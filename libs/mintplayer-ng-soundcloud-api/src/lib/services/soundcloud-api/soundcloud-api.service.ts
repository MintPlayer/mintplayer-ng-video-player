import { Injectable } from '@angular/core';
import { IApiService } from '@mintplayer/ng-player-player-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundcloudApiService implements IApiService {

  private hasAlreadyStartedLoadingApi = false;
  private scriptTag!: HTMLScriptElement;

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
}