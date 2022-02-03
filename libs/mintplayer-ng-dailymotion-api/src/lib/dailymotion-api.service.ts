import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DailymotionApiService {

  private hasAlreadyStartedLoadingApi = false;
  private isApiReady = false;
  private scriptTag!: HTMLScriptElement;

  public dailymotionApiReady$ = new BehaviorSubject<boolean>(false);

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.isApiReady) {
        this.dailymotionApiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingApi = true;
        
        // Create scripttag
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://api.dmcdn.net/all.js';

        // Setup callback
        this.scriptTag.addEventListener('load', () => {
          this.isApiReady = true;
          this.dailymotionApiReady$.next(true);
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