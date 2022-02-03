import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService {

  private hasAlreadyStartedLoadingIframeApi = false;
  private isIframeApiReady = false;
  private scriptTag!: HTMLScriptElement;

  public youtubeApiReady$ = new BehaviorSubject<boolean>(
    (typeof window === 'undefined')
      ? false
      : (<any>window)['YT'] !== undefined
  );

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.isIframeApiReady) {
        this.youtubeApiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingIframeApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingIframeApi = true;
        
        // Setup callback
        (<any>window)['onYouTubeIframeAPIReady'] = () => {
          this.isIframeApiReady = true;
          this.youtubeApiReady$.next(true);
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