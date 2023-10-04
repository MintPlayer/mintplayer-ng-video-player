import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { BehaviorSubject, Subject, takeUntil, timer } from 'rxjs';
import { PlayProgressEvent } from '../../events/play-progress.event';

@Injectable({
  providedIn: 'root'
})
export class SoundcloudApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: object, rendererFactory: RendererFactory2, @Inject(DOCUMENT) doc: any) {
    this.document = doc;
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  private document: Document;
  private renderer: Renderer2;
  private hasAlreadyStartedLoadingApi = false;
  private scriptTag!: HTMLScriptElement;

  public get id() {
    return 'soundcloud';
  }

  public urlRegexes = [
    new RegExp(/(?<id>http[s]{0,1}:\/\/(www\.){0,1}soundcloud\.com\/.+)$/, 'g'),
  ];

  public apiReady$ = new BehaviorSubject<boolean>(false);

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.apiReady$.value) {
        this.apiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingApi = true;
        
        // Create scripttag
        this.scriptTag = this.renderer.createElement('script');
        this.scriptTag.src = 'https://w.soundcloud.com/player/api.js';

        // Setup callback
        this.scriptTag.addEventListener('load', () => this.apiReady$.next(true));
        this.scriptTag.addEventListener('error', () => {
          throw new Error(`${this.scriptTag.src} failed to load`);
        });

        // Insert in DOM
        const firstScriptTag = this.document.getElementsByTagName('script')[0];
        if (!firstScriptTag) {
          this.renderer.appendChild(this.document.head, this.scriptTag);
        } else if (firstScriptTag.parentNode) {
          this.renderer.insertBefore(firstScriptTag.parentNode, this.scriptTag, firstScriptTag);
        } else {
          throw 'First script tag has no parent node';
        }
      }
    }
  }

  public prepareHtml(domId: string, width: number, height: number) {
    return `<iframe id="${domId}" width="${width}" height="${height}" style="max-width:100%" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;show_teaser=false&amp;" allow="autoplay"></iframe>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.element) {
        return rejectPlayer('The SoundCloud api requires the options.element to be set');
      }

      const destroyRef = new Subject();
      const player = SC.Widget(<HTMLIFrameElement>options.element.getElementsByTagName('iframe')[0]);

      const adapter: PlayerAdapter = createPlayerAdapter({
        capabilities: [ECapability.volume, ECapability.getTitle],
        loadVideoById: (id: string) => player.load(id, { auto_play: options.autoplay }),
        setPlayerState: (state: EPlayerState) => {
          switch (state) {
            case EPlayerState.playing:
              player.play();
              break;
            case EPlayerState.paused:
              player.pause();
              break;
            case EPlayerState.ended:
            case EPlayerState.unstarted:
              break;
          }
        },
        setMute: (mute) => player.setVolume(mute ? 0 : 50),
        setVolume: (volume) => player.setVolume(volume),
        setProgress: (time) => player.seekTo(time * 1000),
        setSize: (width, height) => {
          if (options.element) {
            const iframe = options.element.querySelector<HTMLIFrameElement>('iframe');
            if (iframe) {
              iframe.width = String(width);
              iframe.height = String(height);
            }
          }
        },
        getTitle: () => new Promise<string>((resolve) => player.getCurrentSound((sound: {description: string, title: string}) => resolve(sound.description ?? sound.title))),
        setFullscreen: (isFullscreen) => {
          if (isFullscreen) {
            console.warn('SoundCloud player doesn\'t support fullscreen mode');
            setTimeout(() => adapter.onFullscreenChange?.(false), 50);
          }
        },
        getFullscreen: () => new Promise(resolve => resolve(false)),
        setPip: (isPip) => {
          if (isPip) {
            console.warn('SoundCloud player doesn\'t support PIP mode');
            setTimeout(() => adapter.onPipChange?.(false), 50);
          }
        },
        getPip: () => new Promise(resolve => resolve(false)),
        destroy: () => destroyRef.next(true),
      });
      
      player.bind(SC.Widget.Events.READY, () => {
        resolvePlayer(adapter);
        if (!isPlatformServer(this.platformId)) {
          timer(0, 50)
            .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
            .subscribe((time) => {
              // Volume
              player.getVolume((currentVolume) => {
                adapter.onVolumeChange?.(currentVolume);
                adapter.onMuteChange?.(currentVolume === 0 ? true : false);
              });
            });
        }
      });
      player.bind(SC.Widget.Events.PLAY, () => {
        adapter.onStateChange?.(EPlayerState.playing);
        player.getDuration((duration) => adapter.onDurationChange?.(duration / 1000));
      });
      player.bind(SC.Widget.Events.PAUSE, () => adapter.onStateChange?.(EPlayerState.paused));
      player.bind(SC.Widget.Events.FINISH, () => adapter.onStateChange?.(EPlayerState.ended));
      player.bind(SC.Widget.Events.PLAY_PROGRESS, (event: PlayProgressEvent) => adapter.onCurrentTimeChange?.(event.currentPosition / 1000));
    });
  }
}