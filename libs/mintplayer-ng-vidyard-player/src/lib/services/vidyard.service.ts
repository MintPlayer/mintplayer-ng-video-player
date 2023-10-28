import { isPlatformServer } from '@angular/common';
import { Injectable, DestroyRef, Inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import VidyardEmbed, { VidyardApi, VidyardPlayer } from '@vidyard/embed-code';
import { Subject, BehaviorSubject, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VidyardService implements IApiService {

  constructor(private scriptLoader: ScriptLoader, @Inject(PLATFORM_ID) private platformId: any) { }

  public get id() {
    return 'vidyard';
  }

  public get canReusePlayer() {
    return false;
  };

  public urlRegexes = [
    new RegExp(/https?:\/\/video\.vidyard\.com\/watch\/(?<id>[0-9A-Za-z]{5,})/),
    new RegExp(/https?:\/\/play\.vidyard\.com\/(?<id>[0-9A-Za-z]{5,})\.jpg/),
  ];

  public loadApi() {
    return this.scriptLoader.loadScript('https://play.vidyard.com/embed/v4.js', 'onVidyardAPI');
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    if (!options.initialVideoId) {
      throw 'Vidyard player requires an initial video to be set';
    }

    const w = options.width ? `${options.width}px` : '100%';
    
    return `
      <div style="width: ${w}; margin: auto; display: block; max-width: 100%" class="vidyard-player-embed" data-uuid="${options.initialVideoId}" data-v="4" data-type="lightbox">
        <img src="https://play.vidyard.com/${options.initialVideoId}.jpg">
      </div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef) : Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      const div = options.element.querySelector<HTMLDivElement>('div.vidyard-player-embed');
      if (!div) {
        return rejectPlayer('Something went wrong');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('The Vidyard implementation requires an initial video. Vidyard itself allows creation of a player without, but this wasn\'t implemented here.');
      }

      const destroyRef = new Subject();
      // let adapter: PlayerAdapter;
      const adapter$ = new BehaviorSubject<PlayerAdapter | null>(null);
      const playerReady$ = new BehaviorSubject<boolean>(false);

      VidyardEmbed.api.addReadyListener((_: any, player: VidyardPlayer) => {
        adapter = createPlayerAdapter({
          capabilities: [ECapability.volume],
          loadVideoById: (id: string) => {

          },
          setPlayerState: (state: EPlayerState) => {
            switch (state) {
              case EPlayerState.playing:
                player.play();
                break;
              case EPlayerState.paused:
                player.pause();
                break;
            }
          },
          setMute: (mute) => {},
          setVolume: (volume) => player.setVolume(volume / 100),
          setProgress: (time) => player.seek(time),
          setSize: (width, heigt) => {
            player.iframe.width = `${width}px`;
            player.iframe.height = `${heigt}px`;
          },
          getTitle: () => new Promise((resolve) => {
            player.metadata.name ?? player.metadata.description;
          }),
          setFullscreen: (fullscreen) => {},
          getFullscreen: () => new Promise((resolve) => resolve(false)),
          setPip: (pip) => {
            throw 'The Vidyard player doesn\'t support PiP';
          },
          getPip: () => new Promise((resolve) => resolve(false)),
          destroy: () => VidyardEmbed.api.destroyPlayer(player)
        });

        // window.addEventListener( "mousedown", (e) => obj.onClick(e) );

        player.on('ready', (_, plr) => {
          console.log('player', player);
          playerReady$.next(true);

          setTimeout(() => {
            VidyardEmbed.api.getPlayerMetadata(options.initialVideoId!).then(meta => {
              adapter.onDurationChange(meta.length_in_seconds);
            });
            resolvePlayer(adapter);

            // player.setVolume(0.5);

            player.on('play', (seconds, plr) => adapter.onStateChange(EPlayerState.playing));
            player.on('pause', (_, plr) => adapter.onStateChange(EPlayerState.paused));
            player.on('seek', ([previous, next], plr) => adapter.onCurrentTimeChange(next));
            // player.on('playerComplete', (_, plr) => adapter.onStateChange(EPlayerState.ended));
            // player.on('videoComplete', (index, plr) => {
            //   debugger;
            //   if (index === plr.metadata.chapters_attributes.length - 1) {
            //     adapter.onStateChange(EPlayerState.ended);
            //   }
            // });
            player.on('volumeChange', (volume, plr) => adapter.onVolumeChange(volume * 100));
            player.on('timeupdate', (seconds, plr) => {
              adapter.onCurrentTimeChange(seconds);
              const chapters = plr.metadata.chapters_attributes;
              const duration = chapters[chapters.length - 1].video_attributes.length_in_seconds;
              if ((seconds >= duration) || (Math.abs(seconds - duration) < 0.2)) {
                adapter.onStateChange(EPlayerState.ended);
              }
            });
            player.on('metadata', (...args: any[]) => console.log('metadata', args));
          }, 500);

          options.element.querySelector(':scope > div > img')?.remove();
        });

      });

      VidyardEmbed.api.renderPlayer({
        container: div,
        uuid: options.initialVideoId,
        autoplay: options.autoplay ? 1 : 0,
      });
    });
  }

}
