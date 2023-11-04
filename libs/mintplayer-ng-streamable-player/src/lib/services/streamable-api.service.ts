import { DestroyRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import { Subject, fromEvent, takeUntil } from 'rxjs';
import { fromStreamableEvent } from '../extensions';

@Injectable({
  providedIn: 'root'
})
export class StreamableService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: object, private scriptLoader: ScriptLoader) {}

  public get id() {
    return 'streamable';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.)?streamable\.com\/(?<id>[0-9a-z]+)$/, 'g'),
  ];

  canReusePlayer = false;

  public loadApi() {
    return this.scriptLoader.loadScript('https://cdn.embed.ly/player-0.1.0.min.js');
  }

  public prepareHtml(options: Partial<Omit<PlayerOptions, 'element'>>): string {
    return `<iframe
      src="https://streamable.com/o/${options.initialVideoId}"
      frameBorder="0"
      scrolling="no"
      allow="encrypted-media; autoplay; fullscreen;"
      width="${options.width ?? 450}"
      height="${options.height ?? 300}"
      style="max-width: 100%"
      ></iframe>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      const iframe = options.element.querySelector('iframe');

      if (!iframe) {
        return rejectPlayer('Streamable player requires the options.element to be set, and contain an iframe');
      }

      const player = new playerjs.Player(iframe);
      const destroyRef = new Subject();

      fromEvent(<any>player, 'ready').subscribe(() => {
        console.warn('fromEvent ready');
      });

      player.on('ready', () => {
        console.warn('player.on(ready)');
      });

      // fromStreamableEvent(player, 'ready')
      //   .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
      //   .subscribe(() => {
      //     console.warn('player', player);
      //     // const adapter = createPlayerAdapter({
      //     //   capabilities: [],
      //     //   loadVideoById: (id) => {

      //     //   },
      //     //   setPlayerState: (state) => {

      //     //   },
      //     //   setMute: (mute) => {

      //     //   },
      //     //   setVolume: (volume) => {

      //     //   },
      //     //   setProgress: (time) => {

      //     //   },
      //     //   setSize: (width, height) => {

      //     //   },
      //     //   getTitle: () => new Promise((resolve) => resolve('')),
      //     //   setFullscreen: (fullscreen) => {

      //     //   },
      //     //   getFullscreen: () => new Promise((resolve) => resolve(false)),
      //     //   setPip: (pip) => {

      //     //   },
      //     //   getPip: () => new Promise((resolve) => resolve(false)),
      //     //   destroy: () => {

      //     //   }
      //     // });
    
      //     // // player.on('play')
      //     // fromStreamableEvent(player, 'play')
      //     //   .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
      //     //   .subscribe(() => {
      //     //     adapter.onStateChange(EPlayerState.playing);
      //     //     console.warn('hello world');
      //     //   });
            
      //     // fromStreamableEvent(player, 'pause')
      //     //   .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
      //     //   .subscribe(() => adapter.onStateChange(EPlayerState.paused));

      //     // resolvePlayer(adapter);
      //   });
    });
  }

}
