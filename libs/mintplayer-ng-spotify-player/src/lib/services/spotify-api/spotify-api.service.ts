import { DestroyRef, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { BehaviorSubject, Subject, filter, pairwise } from 'rxjs';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import { PlaybackUpdateEvent, SpotifyIframeApi } from '../../interfaces/spotify-iframe-api';

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService implements IApiService {

  constructor(private scriptLoader: ScriptLoader) {}

  private api?: SpotifyIframeApi;

  public get id() {
    return 'spotify';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/open\.spotify\.com\/(?<type>track|episode)\/(?<id>[^&/]+)/, 'g'),
    new RegExp(/spotify:(?<type>track|episode):(?<id>[0-9A-Za-z]+)/, 'g'),
  ];

  public loadApi() {
    return this.scriptLoader.loadScript('https://open.spotify.com/embed-podcast/iframe-api/v1', 'onSpotifyIframeApiReady')
      .then(readyArgs => this.api = readyArgs[0]);
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
        let adapter: PlayerAdapter;
        console.log('controller', controller);
        controller.addListener('ready', () => {
          if (options.autoplay) {
            setTimeout(() => controller.play(), 3000);
          }

          if (!isReady) {
            isReady = true;
            const destroyRef = new Subject();

            adapter = createPlayerAdapter({
              capabilities: [],
              loadVideoById: (id) => controller.loadUri(id),
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
            });

            resolvePlayer(adapter);
          }
        });

        const state$ = new Subject<PlaybackUpdateEvent>();
        state$.pipe(
          // debounceTime(200),
          pairwise(),
          filter(([prev, next]) => {
            return !prev.data.isPaused && ((prev.data.duration - prev.data.position) < 0.5)
              && next.data.isPaused && (next.data.position === 0) && (Math.abs(prev.data.duration - next.data.duration) < 3);
          }),
          takeUntilDestroyed(destroy)
        ).subscribe(() => {
          setTimeout(() => adapter.onStateChange(EPlayerState.ended), 20);
        });

        controller.addListener('playback_update', (ev) => {
          const evt = <PlaybackUpdateEvent>ev;
          state$.next(evt);
          // console.warn('state', evt);

          adapter.onCurrentTimeChange(evt.data.position / 1000);
          adapter.onDurationChange(evt.data.duration / 1000);
          adapter.onStateChange(!evt.data.isPaused ? EPlayerState.playing : EPlayerState.paused);
        });
      });
    });
  }
}
