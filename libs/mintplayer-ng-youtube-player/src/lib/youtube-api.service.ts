import { isPlatformServer, DOCUMENT } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-provider';
import { BehaviorSubject, Subject, takeUntil, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: any, rendererFactory: RendererFactory2, @Inject(DOCUMENT) doc: any) {
    this.document = doc;
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  private document: Document;
  private renderer: Renderer2;
  private hasAlreadyStartedLoadingIframeApi = false;
  private scriptTag!: HTMLScriptElement;

  public get id() {
    return 'youtube';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>[^&?]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/shorts\/(?<id>[^&?]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/shorts\/(?<id>[^&?]+)/, 'g'),
  ];

  public apiReady$ = new BehaviorSubject<boolean>(
    (typeof window === 'undefined')
      ? false
      : (<any>window)['YT'] !== undefined
  );

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.apiReady$.value) {
        this.apiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingIframeApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingIframeApi = true;
        
        // Setup callback
        (<any>window)['onYouTubeIframeAPIReady'] = () => {
          this.apiReady$.next(true);
        };

        // Invocation
        this.scriptTag = this.renderer.createElement('script');
        this.scriptTag.src = 'https://www.youtube.com/iframe_api';

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
    return `<div id="${domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): PlayerAdapter {
    if (!options.domId) {
      throw 'The YouTube api requires the options.domId to be set';
    }

    const destroyRef = new Subject();
    const player = new YT.Player(options.domId, {
      width: options.width,
      height: options.height,
      playerVars: {
        fs: 1,
        autoplay: <any>options.autoplay,
      },
      events: {
        onReady: (ev: YT.PlayerEvent) => {
          options.onReady();
          if (!isPlatformServer(this.platformId)) {
            timer(0, 50)
              .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
              .subscribe((time) => {
                // Progress
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                options.onProgressChange({ currentTime, duration });
              });
            timer(0, 50)
              .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
              .subscribe((time) => {
                // Volume
                const vol = player.getVolume();
                options.onVolumeChange(vol);
                
                // Mute
                const currentMute = player.isMuted();
                options.onMuteChange(currentMute);
              });
          }
        },
        onStateChange: (ev: YT.OnStateChangeEvent) => {
          switch (ev.data) {
            case YT.PlayerState.PLAYING:
              return options.onStateChange(EPlayerState.playing);
            case YT.PlayerState.PAUSED:
              return options.onStateChange(EPlayerState.paused);
            case YT.PlayerState.ENDED:
              return options.onStateChange(EPlayerState.ended);
            case YT.PlayerState.UNSTARTED:
              return options.onStateChange(EPlayerState.unstarted);
          }
        }
      }
    });

    return {
      loadVideoById: (id: string) => player.loadVideoById(id),
      setPlayerState: (state: EPlayerState) => {
        switch (state) {
          case EPlayerState.playing:
            player.playVideo();
            break;
          case EPlayerState.paused:
            player.pauseVideo();
            break;
          case EPlayerState.ended:
            player.stopVideo();
            break;
          case EPlayerState.unstarted:
            break;
        }
      },
      setMute: (mute) => mute ? player.mute() : player.unMute(),
      setVolume: (volume) => player.setVolume(volume),
      setProgress: (time) => player.seekTo(time, true),
      setSize: (width, height) => player.setSize(width, height),
      getTitle: () => new Promise((resolve) => {
        resolve((<any>player).getVideoData().title);
      }),
      destroy: () => {
        destroyRef.next(true);
        player.destroy();  
      },
    }
  }

}