import { DOCUMENT } from '@angular/common';
import { DestroyRef, Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions } from '@mintplayer/ng-player-provider';
import { BehaviorSubject, Subject } from 'rxjs';
import { PlaybackUpdateEvent, SpotifyIframeApi } from '../../interfaces/spotify-iframe-api';

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService implements IApiService {

  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) doc: any) {
    this.document = doc;
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  private document: Document;
  private renderer: Renderer2;
  private hasAlreadyStartedLoadingIframeApi = false;
  private scriptTag!: HTMLScriptElement;
  private api?: SpotifyIframeApi;

  public get id() {
    return 'spotify';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/open\.spotify\.com\/(?<type>track|episode)\/(?<id>[^&/]+)/, 'g'),
    new RegExp(/spotify:(?<type>track|episode):(?<id>[0-9A-Za-z]+)/, 'g'),
  ];

  public apiReady$ = new BehaviorSubject<boolean>(false);

  public loadApi() {
    if (typeof window !== 'undefined') {

      if (this.apiReady$.value) {
        this.apiReady$.next(true);
      } else if (!this.hasAlreadyStartedLoadingIframeApi) {
        // Ensure the script is inserted only once
        this.hasAlreadyStartedLoadingIframeApi = true;

        // Setup callback
        (<any>window)['onSpotifyIframeApiReady'] = (iframeApi: SpotifyIframeApi) => {
          this.api = iframeApi;
          this.apiReady$.next(true);
        };

        // Invocation
        this.scriptTag = this.renderer.createElement('script');
        this.scriptTag.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';

        // Insert in DOM
        const firstScriptTag = this.document.getElementsByTagName('script')[0];
        if (!firstScriptTag) {
          this.renderer.appendChild(this.document.head, this.scriptTag);
        } else if (firstScriptTag.parentNode) {
          this.renderer.insertBefore(firstScriptTag.parentNode, this.scriptTag, firstScriptTag);
        } else {
          throw 'First script tag has no parent node';
        }
      }
    }
  }

  public prepareHtml(domId: string, width: number, height: number) {
    return `<div id="${domId}" style="max-width:100%"></div>`;
  }

  public match2id(match: RegExpExecArray) {
    if (!match.groups) {
      return '';
    } else {
      return `spotify:${match.groups['type']}:${match.groups['id']}`;
    }
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.element) {
        return rejectPlayer('The Spotify api requires the options.element to be set');
      }

      if (!this.api) {
        return rejectPlayer('The Spotify api should have been set here');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('The Spotify api requires an initial video');
      }

      // Note: options.element is actually wrong
      // console.log('options.element', options.element);

      let isReady = false;
      this.api.createController(<HTMLElement>options.element.querySelector('div'), { uri: options.initialVideoId, width: options.width, height: options.height }, (controller) => {
        controller.addListener('ready', () => {
          if (options.autoplay) {
            setTimeout(() => controller.play(), 300);
          }

          if (!isReady) {
            isReady = true;
            const destroyRef = new Subject();

            const adapter: PlayerAdapter = {
              capabilities: [],
              loadVideoById: (id) => {
                controller.loadUri(id);
              },
              setPlayerState: (state: EPlayerState) => {
                switch (state) {
                  case EPlayerState.playing:
                    controller.resume();
                    break;
                  case EPlayerState.paused:
                    controller.pause();
                    break;
                  case EPlayerState.ended:
                    break;
                  case EPlayerState.unstarted:
                    break;
                }
              },
              setMute: (mute) => {
                throw 'Spotify api doesn\'t allow mute'
              },
              setVolume: (volume) => {
                throw 'Spotify api doesn\'t allow changing the volume'
              },
              setProgress: (time) => controller.seek(time),
              setSize: (width, height) => controller.setIframeDimensions(width, height),
              getTitle: () => new Promise((resolve, reject) => reject('Spotify api doesn\'t allow getting the title')),
              setFullscreen: (isFullscreen) => {
                throw 'Spotify doesn\'t support fullscreen';
              },
              getFullscreen: () => new Promise((resolve) => resolve(false)),
              setPip: (isPip) => {
                throw 'Spotify doesn\'t support picture-in-picture'
              },
              getPip: () => new Promise(resolve => resolve(false)),
              destroy: () => {
                destroyRef.next(true);
                controller.destroy();
              }
            };

            resolvePlayer(adapter);
          }
        });

        controller.addListener('playback_update', (ev) => {
          const evt = <PlaybackUpdateEvent>ev;
          options.onCurrentTimeChange(evt.data.position / 1000);
          options.onDurationChange(evt.data.duration / 1000);
          options.onStateChange(evt.data.isPaused ? EPlayerState.paused : EPlayerState.playing);
        });
      });
    });
  }
}