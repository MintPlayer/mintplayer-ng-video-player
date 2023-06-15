import { Injectable } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DailymotionApiService implements IApiService {

  private hasAlreadyStartedLoadingApi = false;
  private scriptTag!: HTMLScriptElement;

  public get id() {
    return 'dailymotion';
  }

  urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}dailymotion\.com\/video\/(?<id>[0-9A-Za-z]+)$/, 'g'),
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
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://api.dmcdn.net/all.js';
        // this.scriptTag.src = 'https://cdn.mintplayer.com/dailymotion/all.js';

        // Setup callback
        this.scriptTag.addEventListener('load', () => {
          this.apiReady$.next(true);
        });
        this.scriptTag.addEventListener('error', () => {
          throw new Error(`${this.scriptTag.src} failed to load`);
        });

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
    if (!options.element) {
      throw 'The DailyMotion api requires the options.element to be set';
    }

    const player = DM.player(options.element.getElementsByTagName('div')[0], {
      width: String(options.width),
      height: String(options.height),
      params: {
        autoplay: options.autoplay,
        "queue-enable": false,
      },
      events: {
        apiready: () => options.onReady(),
        play: () => options.onStateChange(EPlayerState.playing),
        pause: () => options.onStateChange(EPlayerState.paused),
        end: () => options.onStateChange(EPlayerState.ended),
      }
    });

    return {
      loadVideoById: (id: string) => {
        player.load({video: id});
      },
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
      setVolume: (volume) => {
        player.setVolume(volume / 100);
      }
    };
  }
}
