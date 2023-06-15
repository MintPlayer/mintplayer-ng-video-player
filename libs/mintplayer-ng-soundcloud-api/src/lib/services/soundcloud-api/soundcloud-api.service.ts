import { Injectable } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundcloudApiService implements IApiService {

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
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://w.soundcloud.com/player/api.js';

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
    return `<iframe id="${domId}" width="${width}" height="${height}" style="max-width:100%" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;show_teaser=false&amp;" allow="autoplay"></iframe>`;
  }

  public createPlayer(options: PlayerOptions): PlayerAdapter {
    if (!options.element) {
      throw 'The SoundCloud api requires the options.element to be set';
    }

    const player = SC.Widget(<HTMLIFrameElement>options.element.getElementsByTagName('iframe')[0]);
    player.bind(SC.Widget.Events.READY, () => options.onReady());
    player.bind(SC.Widget.Events.PLAY, () => options.onStateChange(EPlayerState.playing));
    player.bind(SC.Widget.Events.PAUSE, () => options.onStateChange(EPlayerState.paused));
    player.bind(SC.Widget.Events.FINISH, () => options.onStateChange(EPlayerState.ended));
    // player.bind(SC.Widget.Events.PLAY_PROGRESS, (event: PlayProgressEvent) => {

    return {
      loadVideoById: (id: string) => {
        player.load(id, { auto_play: options.autoplay });
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
        player.setVolume(volume);
      }
    };
  }
}