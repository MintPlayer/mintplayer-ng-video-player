import { DestroyRef, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import { ECapability, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { isPlatformServer } from '@angular/common';

// https://wistia.com/support/developers/player-api#volumechange

@Injectable({
  providedIn: 'root'
})
export class WistiaService implements IApiService {

  constructor(private scriptLoader: ScriptLoader, @Inject(PLATFORM_ID) private platformId: any) { }

  public get id() {
    return 'wistia';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.|home\.)?wistia\.(com|net)\/(medias|embed)\/(?<id>[0-9A-Za-z]+)/),
  ];

  loadApi() {
    return this.scriptLoader.loadScript('https://fast.wistia.com/assets/external/E-v1.js', { async: true });
  }

  prepareHtml(options: PrepareHtmlOptions) {
    if (!options.domId) {
      throw 'The Wistia api requires the options.domId to be set';
    }

    if (!options.initialVideoId) {
      throw 'The Wistia api requires an initial video id';
    }

    // id="${options.domId}"
    //  wistia_async_${options.domId}
    // return `<div id="${options.domId}" style="width:${options.width ?? 640}px;height:${options.height ?? 360}px" class="wistia_embed"></div>`;
    return `<div id="${options.domId}" key="${options.initialVideoId}" class="wistia_embed wistia_async_${options.initialVideoId}" style="width:640px;height:360px;max-width:100%"></div>`;
  }

  // requests: WistiaRequest[] = [];
  createPlayer(options: PlayerOptions, destroy: DestroyRef) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      if (isPlatformServer(this.platformId)) {
        // Do not resolve this promise during SSR
        return;
      }

      if (!options.domId) {
        return rejectPlayer('The YouTube api requires the options.domId to be set');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('The Wistia implementation requires an initial video');
      }

      // TODO: this can probably be moved to a variable on this class
      const wq: WistiaRequest[] = (<any>window)._wq = (<any>window)._wq || [];
      wq.push({ id: options.domId, onReady: (player) => {
        // console.log('hi there', handle);
        const adapter = createPlayerAdapter({
          capabilities: [ECapability.mute],
          setMute: (mute) => {
            if (mute) player.mute();
            else player.unmute();
          },
          getFullscreen: () => new Promise(resolve => resolve(false)),
          setVolume: (volume) => player.volume(volume / 100),
        });

        player.volume()

        resolvePlayer(adapter);
      } });

      // this.requests.push({
      //   id: options.domId,
      //   onReady: (handle) => {
      //     console.log('hi there', handle);
      //   }
      // });


      // const wq: WistiaRequest[] = (<any>window)._wq = (<any>window)._wq || [];
      // wq.push({ id: 'my_video', onReady: (handle) => {
      //   console.log('hi there', handle);
      // } });

      // setTimeout(() => {
      //   const player = Wistia.api('abcde12345');
      //   console.log('player', player);
      // }, 1000);
    });
  }

}

export interface WistiaRequest {
  id: string;
  onReady: (video: WistiaPlayer) => void;
}

export  interface WistiaPlayer {
  mute: () => void;
  unmute: () => void;
  volume: ((vol: number) => void) | (() => number);
}