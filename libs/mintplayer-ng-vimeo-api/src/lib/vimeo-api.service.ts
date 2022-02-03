import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VimeoApiService {

  private hasAlreadyStartedLoadingVimeoApi = false;
  private isVimeoApiReady = false;
  private scriptTag!: HTMLScriptElement;

  public vimeoApiReady$ = new BehaviorSubject<boolean>(
    (typeof window === 'undefined')
      ? false
      : (<any>window)['Vimeo'] !== undefined
  );

  public loadApi() {
    // If not during server-side rendering
    if (typeof window !== 'undefined') {

      if (this.isVimeoApiReady) {
        this.vimeoApiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingVimeoApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingVimeoApi = true;
        
        // Invocation
        this.scriptTag = window.document.createElement('script');
        this.scriptTag.src = 'https://player.vimeo.com/api/player.js';
        this.scriptTag.onload = () => {
          // Callback
          this.isVimeoApiReady = true;
          this.vimeoApiReady$.next(true);
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

}