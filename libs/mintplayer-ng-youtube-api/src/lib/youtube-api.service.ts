import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject, combineLatest, timer, filter, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: any) {}

  private hasAlreadyStartedLoadingIframeApi = false;
  private scriptTag!: HTMLScriptElement;

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

  public createPlayer(options: PlayerOptions): PlayerAdapter {
    if (!options.domId) {
      throw 'The YouTube api requires the options.domId to be set';
    }

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

    // if (!isPlatformServer(this.platformId)) {
    //   combineLatest([timer(0, 50), this.isPlayerReady$, this.isSwitchingVideo$])
    //     .pipe(filter(([time, isPlayerReady, isSwitchingVideo]) => isPlayerReady && !isSwitchingVideo))
    //     .pipe(takeUntil(this.destroyed$))
    //     .subscribe(async ([time, isPlayerReady, isSwitchingVideo]) => {

    // }

    return {
      loadVideoById: (id: string) => {
        player.loadVideoById(id);
      },
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
      setVolume: (volume) => {
        player.setVolume(volume);
      }
    }
  }

}