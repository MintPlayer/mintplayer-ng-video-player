import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-provider';
import { BehaviorSubject, Subject, takeUntil, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: any, @Inject(DOCUMENT) doc: any) {
    this.document = doc;
  }

  private hasAlreadyStartedLoadingIframeApi = false;
  private scriptTag!: HTMLScriptElement;
  private document: Document;

  public get id() {
    return 'youtube';
  }

  public urlRegexes = [
    // new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>.+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>.+)$/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/shorts\/(?<id>.+)$/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/shorts\/(?<id>.+)$/, 'g'),
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
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://www.youtube.com/iframe_api';

        // Insert in DOM
        const firstScriptTag = window.document.getElementsByTagName('script')[0];
        if (!firstScriptTag) {
          document.head.appendChild(this.scriptTag);
        } else if (firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(this.scriptTag, firstScriptTag);
        } else {
          throw 'First script tag has no parent node';
        }
      }
    }
  }

  public prepareHtml(domId: string, width: number, height: number) {
    return `<div id="${domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
    return new Promise((resolve, reject) => {
      if (!options.domId) {
        reject('The YouTube api requires the options.domId to be set');
        return;
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
              
              // const iframe = <HTMLIFrameElement>this.document.getElementById(`#${options.domId}`);
              const iframe = options.element?.querySelector('iframe');
              if (iframe) {
                console.log('iframe', iframe);
                iframe.onfullscreenchange = () => options.onFullscreenChange(this.document.fullscreenElement === iframe);
                
                const concat = [iframe.attributes.getNamedItem('allow')?.value, 'fullscreen'].filter(v => !!v).join('; ');
                iframe.setAttribute('allow', concat);
              }
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

      resolve({
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
        destroy: () => destroyRef.next(true),
        isFullscreen: () => {
          const iframe = <HTMLIFrameElement>this.document.querySelector(`#${options.domId}`);
          return this.document.fullscreenElement === iframe;
        },
        setFullscreen: (fullscreen) => {
          const iframe = <HTMLIFrameElement>this.document.querySelector(`#${options.domId}`);
          fullscreen ? iframe.requestFullscreen() : iframe.contentDocument?.exitFullscreen();
        },
        isPip: () => false,
        setIsPip: (isPip) => console.error('Youtube player doesn\'t support picture-in-picture mode')
        // setIsPip: (isPip) => isPip && setTimeout(() => options.onIsPipChange(false), 50)
      });
    });
  }

}