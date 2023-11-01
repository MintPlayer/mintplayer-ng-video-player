import { DestroyRef, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
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

  public get canReusePlayer() {
    return false;
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
      const wq: (WistiaRequest | WistiaRevokeRequest)[] = (<any>window)._wq = (<any>window)._wq || [];
      wq.push({ id: options.domId, onReady: (player) => {
        // console.log('hi there', handle);
        const adapter = createPlayerAdapter({
          capabilities: [ECapability.mute, ECapability.volume, ECapability.fullscreen],
          loadVideoById: (id: string) => {
            player.addToPlaylist(id);
          },
          setPlayerState: (state) => {
            switch (state) {
              case EPlayerState.playing:
                player.play();
                break;
              case EPlayerState.paused:
                player.pause();
                break;
            }
          },
          setMute: (mute) => {
            if (mute) player.mute();
            else player.unmute();
          },
          setVolume: (volume) => player.volume(volume / 100),
          setProgress: (time) => player.time(time),
          setSize: (width, height) => {
            player.width(width);
            player.height(height);
          },
          getTitle: () => new Promise((resolve, reject) => reject('The Wistia player doesn\'t allow getting the title')),
          setFullscreen: (isFullscreen) => {
            if (isFullscreen) {
              player.requestFullscreen();
            } else {
              player.cancelFullscreen();
            }
          },
          getFullscreen: () => new Promise(resolve => resolve(player.inFullscreen())),
          setPip: (isPip) => {
            if (isPip) {
              console.warn('Wistia player doesn\'t support PIP mode');
              setTimeout(() => adapter.onPipChange(false), 50);
            }
          },
          getPip: () => new Promise((resolve) => resolve(false)),
          destroy: () => {
            player.destroy();
            destroyRef.next(true);
          }
        });

        player.bind('enterfullscreen', () => adapter.onFullscreenChange(true));
        player.bind('cancelfullscreen', () => adapter.onFullscreenChange(false));
        player.bind('crosstime', 30, () => {

        });

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

export interface WistiaRevokeRequest {
  revoke: WistiaRequest;
}

export interface WistiaPlayer {
  addToPlaylist(hashedId: string, options?: AddToPlaylistOptions, position?: AddToPlaylistPosition): void;
  aspect(): number;
  bind<K extends keyof WistiaEventMap>(eventType: K, ...inArgs: WistiaEventMap[K][0], callback: (...args: WistiaEventMap[K][1]) => void): void;
  unbind<K extends keyof WistiaEventMap>(eventType: K, callback: (...args: WistiaEventMap[K][1]) => void): void;
  cancelFullscreen(): void;
  duration(): number;
  email(): string | null;
  email(val: string): void;
  embedded(): boolean;
  eventKey(): string;
  getSubtitlesScale(): number;
  setSubtitlesScale(scale: number): void;
  hasData(): boolean;
  hashedId(): string;
  height(): number;
  height(val: number, options?: SizeOptions): void;
  inFullscreen(): boolean;
  look(): WistiaLook;
  look(options: Partial<WistiaLook>): void;
  isMuted(): boolean;
  mute(): void;
  unmute(): void;
  name(): string;
  pause(): void;
  /** Value between 0 and 1. */
  percentWatched(): number;
  play(): void;
  playbackRate(rate: number): void;
  ready(): boolean;
  remove(): void;
  replaceWith(hashedId: string, options?: ReplaceWithOptions): void;
  requestFullscreen(): void;
  secondsWatched(): number;
  secondsWatchedVector(): number[];
  state(): WistiaPlayerState;
  time(): number;
  time(val: number): void;
  videoHeight(val: number, options?: SizeOptions): void;
  videoQuality(): number | 'auto';
  videoWidth(): number;
  videoWidth(val: number, options?: SizeOptions): void;
  visitorKey(): any;
  volume(): number;
  volume(vol: number): void;
  width(): number;
  width(w: number): void;
}

export type WistiaPlayerState = 'beforeplay' | 'playing' | 'paused' | 'ended';

export interface AddToPlaylistOptions {
  playerColor: HtmlColor;
}

export interface AddToPlaylistPosition {
  before?: string;
  after?: string;
}

export interface SizeOptions {
  constrain: boolean;
}

export interface ReplaceWithOptions {
  transition: 'slide' | 'fade' | 'crossfade' | 'none';
}

export type HtmlColor = 
  `#${string}` |
  `rgb(${number}, ${number}, ${number})` |
  `rgba(${number}, ${number}, ${number}, ${number})`;

export interface WistiaEventMap {
  'beforeremove': [[], []];
  'beforereplace': [[], []];
  'betweentimes': [[], [boolean]]; // TODO: There's input parameters here
  'cancelfullscreen': [[], []];
  'captionschange': [[], [CaptionsChangeEvent]];
  'conversion': [[], [type: 'pre-roll-email' | 'mid-roll-email' | 'post-roll-email', email: string, firstName: string, lastName: string]];
  'crosstime': [[], []]; // TODO: Input parameter
  'end': [[], []];
  'enterfullscreen': [[], []];
  'heightchange': [[], []];
  'lookchange': [[], [WistiaLook]];
  'mutechange': [[], [boolean]];
  'pause': [[], []];
  'percentwatchedchanged': [[], [percent: number, lastPercent: number]];
  'play': [[], []];
  'playbackratechange': [[], [playbackRate: number]];
  'secondchange': [[], [s: number]];
  'seek': [[], [currentTime: number, lastTime: number]];
  'silentplaybackmodechange': [[], [boolean]];
  'timechange': [[], [number]];
  'volumechange': [[], [volume: number, isMuted: boolean]];
  'widthchange': [[], [number]];
}

// export interface InOutEvent<TIn, TOut> {
  
// }

export interface CaptionsChangeEvent {
  visible: boolean;
  language: string;
}

export interface WistiaLook {
  heading: string;
  pitch: string;
  fov: string;
}