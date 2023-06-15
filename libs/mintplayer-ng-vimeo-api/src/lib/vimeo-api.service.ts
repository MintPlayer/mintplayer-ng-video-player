import { Injectable } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VimeoApiService implements IApiService {

  private hasAlreadyStartedLoadingVimeoApi = false;
  private scriptTag!: HTMLScriptElement;

  public get id() {
    return 'vimeo';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}vimeo\.com\/(?<id>[0-9]+)$/, 'g'),
  ];

  public apiReady$ = new BehaviorSubject<boolean>(
    (typeof window === 'undefined')
      ? false
      : (<any>window)['Vimeo'] !== undefined
  );

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.apiReady$.value) {
        this.apiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingVimeoApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingVimeoApi = true;
        
        // Invocation
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://player.vimeo.com/api/player.js';
        this.scriptTag.onload = () => {
          // Callback
          this.apiReady$.next(true);
        };

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

  public createPlayer(options: PlayerOptions) {
    if (!options.domId) {
      throw 'The Vimeo api requires the options.domId to be set';
    }

    if (!options.initialVideoId) {
      throw 'Vimeo requires an initial video';
    }

    const player = new Vimeo.Player(options.domId, {
      id: options.initialVideoId,
      width: options.width,
      height: options.height,
      autoplay: options.autoplay,
      pip: true,
    });

    player.ready().then(() => options.onReady());
    player.on('loaded', () => {
      options.onStateChange(EPlayerState.unstarted);
      setTimeout(() => options.autoplay && player.play(), 600);
    });
    player.on('play', () => options.onStateChange(EPlayerState.playing));
    player.on('pause', () => options.onStateChange(EPlayerState.paused));
    player.on('ended', () => options.onStateChange(EPlayerState.ended));
    player.on('volumechange', (ev) => options.onVolumeChange(ev.volume * 100));

    return <PlayerAdapter>{
      loadVideoById: (id: string) => {
        player.loadVideo(id);
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