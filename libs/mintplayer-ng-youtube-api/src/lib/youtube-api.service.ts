import { Injectable } from '@angular/core';
import { IApiService } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService implements IApiService {

  private hasAlreadyStartedLoadingIframeApi = false;
  private scriptTag!: HTMLScriptElement;

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
}