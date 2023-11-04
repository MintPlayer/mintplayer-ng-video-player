import { Injectable, DestroyRef, Inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import VidyardEmbed, { VidyardApi, VidyardEventMap, VidyardPlayer } from '@vidyard/embed-code';
import { Subject, BehaviorSubject, map, filter, take, takeUntil, fromEvent } from 'rxjs';
import { fromVidyardEvent } from '../extensions';

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
    return this.scriptLoader.loadScript('https://play.vidyard.com/embed/v4.js', { windowCallback: 'onVidyardAPI' });
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
      const playerReady$ = new BehaviorSubject<[boolean, VidyardPlayer?]>([false, undefined]);
      const adapter$ = new BehaviorSubject<[PlayerAdapter, VidyardPlayer] | null>(null);

      adapter$.pipe(filter(a => !!a), map(a => a!), take(1), takeUntil(destroyRef), takeUntilDestroyed(destroy))
        .subscribe(([adapter, player]) => {
          VidyardEmbed.api.getPlayerMetadata(options.initialVideoId!).then(meta => {
            adapter.onDurationChange(meta.length_in_seconds);
          });

          fromVidyardEvent(player, 'play')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([sec, plr]) => adapter.onStateChange(EPlayerState.playing));

          fromVidyardEvent(player, 'pause')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([_, plr]) => adapter.onStateChange(EPlayerState.paused));

          fromVidyardEvent(player, 'seek')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([[previous, next], plr]) => adapter.onCurrentTimeChange(next));

          fromVidyardEvent(player, 'volumeChange')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([volume, plr]) => adapter.onVolumeChange(volume * 100));

          fromVidyardEvent(player, 'timeupdate')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([seconds, plr]) => {
              adapter.onCurrentTimeChange(seconds);
              const chapters = plr.metadata.chapters_attributes;
              const duration = chapters[chapters.length - 1].video_attributes.length_in_seconds;
              if ((seconds >= duration) || (Math.abs(seconds - duration) < 0.2)) {
                // Prevents us to have to wait for ads at the end
                adapter.onStateChange(EPlayerState.ended);
              }
            });

          fromVidyardEvent(player, 'metadata')
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(([meta, plr]) => console.log('metadata', meta));

          // player.setVolume(0.5);

          // player.on('playerComplete', (_, plr) => adapter.onStateChange(EPlayerState.ended));
          // player.on('videoComplete', (index, plr) => {
          //   debugger;
          //   if (index === plr.metadata.chapters_attributes.length - 1) {
          //     adapter.onStateChange(EPlayerState.ended);
          //   }
          // });
          
          resolvePlayer(adapter);
        });

      playerReady$.pipe(filter(([ready]) => ready), take(1), takeUntil(destroyRef), takeUntilDestroyed(destroy))
        .subscribe(([_, plr]) => {
          const player = plr!;
          console.warn('player', plr);
          const adapter = createPlayerAdapter({
            capabilities: [ECapability.volume],
            loadVideoById: (id: string) => {
              throw 'The Vidyard player cannot be reused';
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
            setMute: (mute) => {
              throw 'The Vidyard player doesn\'t support mute';
            },
            setVolume: (volume) => player.setVolume(volume / 100),
            setProgress: (time) => player.seek(time),
            setSize: (width, heigt) => {
              player.iframe.width = `${width}px`;
              player.iframe.height = `${heigt}px`;
            },
            getTitle: () => new Promise((resolve) => {
              resolve(player.metadata.name ?? player.metadata.description);
            }),
            setFullscreen: (fullscreen) => {
              throw 'The Vidyard player doesn\'t support fullscreen';
            },
            getFullscreen: () => new Promise((resolve) => resolve(false)),
            setPip: (pip) => {
              throw 'The Vidyard player doesn\'t support PiP';
            },
            getPip: () => new Promise((resolve) => resolve(false)),
            destroy: () => VidyardEmbed.api.destroyPlayer(player)
          });

          adapter$.next([adapter, player]);
        });

      VidyardEmbed.api.addReadyListener((_: any, player: VidyardPlayer) => {
        player.on('ready', (_, plr) => {
          playerReady$.next([true, player]);
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
