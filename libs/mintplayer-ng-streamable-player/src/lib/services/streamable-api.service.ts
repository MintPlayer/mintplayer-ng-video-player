import { isPlatformServer } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject, fromEvent, fromEventPattern, takeUntil, timer } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
export class StreamableService implements IApiService {

  // constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  public get id() {
    return 'streamable';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.)?streamable\.com\/(?<id>[0-9a-z]+)$/, 'g'),
  ];

  canReusePlayer = false;

  public loadApi() {
    return loadScript('https://cdn.embed.ly/player-0.1.0.min.js');
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

      fromEventPattern(
        (handler: () => void) => player.on('ready', handler),
        (handler: () => void) => player.off('ready', handler),
      )
        .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
        .subscribe(() => {
          const adapter = createPlayerAdapter({
            capabilities: [ECapability.volume, ECapability.mute],
            loadVideoById: (id) => {
              throw 'The Streamable player cannot be reused';
            },
            setPlayerState: (state) => {
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
              if (mute) {
                player.mute();
              } else {
                player.unmute();
              }
            },
            setVolume: (volume) => {
              player.setVolume(volume);
            },
            setProgress: (time) => {
              player.setCurrentTime(time);
            },
            setSize: (width, height) => {
              iframe.width = `${width}px`;
              iframe.height = `${height}px`;
            },
            getTitle: () => new Promise((resolve) => resolve('')),
            setFullscreen: (fullscreen) => {
              if (fullscreen) {
                console.warn('Streamable player doesn\'t allow setting fullscreen from outside');
                setTimeout(() => adapter.onFullscreenChange(false), 50);
              }
            },
            getFullscreen: () => new Promise((resolve) => resolve(false)),
            setPip: (pip) => {
              if (pip) {
                console.warn('Streamable player doesn\'t support PIP mode');
                setTimeout(() => adapter.onPipChange(false), 50);
              }
            },
            getPip: () => new Promise((resolve) => resolve(false)),
            destroy: () => {
              destroyRef.next(true);
            }
          });
    
          player.setLoop(false);

          fromEventPattern(
            (handler: () => void) => player.on('play', handler),
            (handler: () => void) => player.off('play', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.playing));
            
          fromEventPattern(
            (handler: () => void) => player.on('pause', handler),
            (handler: () => void) => player.off('pause', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.paused));

          fromEventPattern(
            (handler: () => void) => player.on('ended', handler),
            (handler: () => void) => player.off('ended', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.ended));

          fromEventPattern<playerjs.StreamableEventMap['timeupdate']>(
            (handler: () => void) => player.on('timeupdate', handler),
            (handler: () => void) => player.off('timeupdate', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe(({seconds, duration}) => {
              adapter.onCurrentTimeChange(seconds);
              adapter.onDurationChange(duration);
            });

            
          // if (!isPlatformServer(this.platformId)) {
          if (typeof window !== 'undefined') {
            timer(0, 50)
              .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
              .subscribe(() => {
                player.getVolume((volume) => adapter.onVolumeChange(volume));
                player.getMuted((mute) => adapter.onMuteChange(mute));
              });
          }

          if (options.autoplay) {
            setTimeout(() => player.play(), 20);
          }

          resolvePlayer(adapter);
        });
    });
  }

}
