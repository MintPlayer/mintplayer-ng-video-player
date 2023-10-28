import { isPlatformServer } from '@angular/common';
import { Injectable, DestroyRef, Inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import VidyardEmbed, { VidyardApi, VidyardPlayer } from '@vidyard/embed-code';
import { Subject, takeUntil, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VidyardService implements IApiService {

  constructor(private scriptLoader: ScriptLoader, @Inject(PLATFORM_ID) private platformId: any) { }

  public get id() {
    return 'vidyard';
  }

  // <script type="text/javascript" async src=""></script>

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
    // return `<img style="width: ${w}; margin: auto; display: block; max-width: 100%" class="vidyard-player-embed" src="https://play.vidyard.com/${options.initialVideoId}.jpg" data-uuid="${options.initialVideoId}" data-v="4" data-type="lightbox" />`;
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
      let adapter: PlayerAdapter;

      VidyardEmbed.api.addReadyListener((_: any, player: VidyardPlayer) => {
        // adapter = createPlayerAdapter({
        //   capabilities: [ECapability.volume],
        //   loadVideoById: (id: string) => {

        //   },
        //   setPlayerState: (state: EPlayerState) => {
        //     switch (state) {
        //       case EPlayerState.playing:
        //         player.play();
        //         break;
        //       case EPlayerState.paused:
        //         player.pause();
        //         break;
        //     }
        //   },
        //   setMute: (mute) => {},
        //   setVolume: (volume) => player.setVolume(volume / 100),
        //   setProgress: (time) => {},
        //   setSize: (width, heigt) => {},
        //   getTitle: () => new Promise((resolve) => resolve('')),
        //   setFullscreen: (fullscreen) => {},
        //   getFullscreen: () => new Promise((resolve) => resolve(false)),
        //   setPip: (pip) => {},
        //   getPip: () => new Promise((resolve) => resolve(false)),
        //   destroy: () => VidyardEmbed.api.destroyPlayer(player)
        // });

        player.on('ready', (x) => {
          console.warn('ready', { _, player });
          x.readyData
              
          //   VidyardEmbed.api.getPlayerMetadata(options.initialVideoId!).then(meta => {
          //     console.log('META', meta);
          //     adapter.onDurationChange(meta.length_in_seconds);
          //   });
          //   resolvePlayer(adapter);
          //   options.autoplay && player.play();
          // });
          // player.on('play', (seconds: number, player: VidyardPlayer) => adapter.onStateChange(EPlayerState.playing));
          // player.on('pause', (_: any, player: VidyardPlayer) => adapter.onStateChange(EPlayerState.paused));
          // player.on('seek', ([previous, next]: number[], player: VidyardPlayer) => adapter.onCurrentTimeChange(next));
          // player.on('playerComplete', (_: any, player: VidyardPlayer) => adapter.onStateChange(EPlayerState.ended));

          // if (!isPlatformServer(this.platformId)) {
          //   timer(0, 50)
          //     .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
          //     .subscribe(() => {
          //       const time = player.currentTime();
          //       adapter.onCurrentTimeChange(time);
          //     });

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
