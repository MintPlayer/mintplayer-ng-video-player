import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { Subject, filter, pairwise, takeUntil } from 'rxjs';
import { loadScript } from '@mintplayer/script-loader';
import { PlaybackUpdateEvent, SpotifyIframeApi } from '../../interfaces/spotify-iframe-api';

export class SpotifyApiService implements IApiService {

  private api?: SpotifyIframeApi;

  public get id() {
    return 'spotify';
  }

  public urlRegexes = [
    // `?` excluded from the id, or every share link — they all carry `?si=...`
    // — produced `spotify:track:<id>?si=<token>`, which is not a valid uri.
    new RegExp(/http[s]{0,1}:\/\/open\.spotify\.com\/(?<type>track|episode)\/(?<id>[^&/?]+)/, 'g'),
    new RegExp(/spotify:(?<type>track|episode):(?<id>[0-9A-Za-z]+)/, 'g'),
  ];

  public loadApi() {
    return loadScript('https://open.spotify.com/embed-podcast/iframe-api/v1', { windowCallback: 'onSpotifyIframeApiReady' })
      .then(readyArgs => this.api = readyArgs[0]);
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    return `<div id="${options.domId}" style="max-width:100%"></div>`;
  }

  public match2id(match: RegExpExecArray) {
    if (!match.groups) {
      throw 'match2id - match.groups is undefined';
    }
    
    return `spotify:${match.groups['type']}:${match.groups['id']}`;
  }

  public createPlayer(options: PlayerOptions, destroy: Subject<boolean>): Promise<PlayerAdapter> {
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
        // Out here, not inside the `ready` handler: state$ below is created in
        // this scope, so a destroyRef declared in there could never be used to
        // tear it down — which is why destroy() detached nothing at all.
        const destroyRef = new Subject<boolean>();
        controller.addListener('ready', () => {
          if (options.autoplay) {
            setTimeout(() => controller.play(), 3000);
          }

          if (!isReady) {
            isReady = true;

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
              // Only the request to turn these ON is an error. Throwing on
              // `false` too meant the VideoPlayer could not so much as reset
              // them to off — its isFullscreen/isPip setters forward the value
              // unconditionally — so a player carrying either flag threw on
              // every attempt to clear it.
              setFullscreen: (isFullscreen) => {
                if (isFullscreen) {
                  throw 'Spotify doesn\'t support fullscreen';
                }
              },
              getFullscreen: () => new Promise((resolve) => resolve(false)),
              setPip: (isPip) => {
                if (isPip) {
                  throw 'Spotify doesn\'t support picture-in-picture'
                }
              },
              getPip: () => new Promise(resolve => resolve(false)),
              destroy: () => {
                destroyRef.next(true);
                controller.removeListener('playback_update', onPlaybackUpdate);
                controller.destroy();
              }
            });

            resolvePlayer(adapter);
          }
        });

        // Spotify reports position and duration in MILLISECONDS — that is why
        // they are divided by 1000 before going out to the adapter below. The
        // thresholds here were 0.5 and 3, i.e. half a millisecond and three
        // milliseconds, so this only ever fired when the embed happened to
        // report position exactly equal to duration; a track stopping a
        // millisecond short was never reported as ended.
        const endOfTrackMs = 500;
        const sameTrackToleranceMs = 3000;

        const state$ = new Subject<PlaybackUpdateEvent>();
        state$.pipe(
          // debounceTime(200),
          pairwise(),
          filter(([prev, next]) => {
            return !prev.data.isPaused && ((prev.data.duration - prev.data.position) < endOfTrackMs)
              && next.data.isPaused && (next.data.position === 0) && (Math.abs(prev.data.duration - next.data.duration) < sameTrackToleranceMs);
          }),
          takeUntil(destroyRef),
          takeUntil(destroy)
        ).subscribe(() => {
          setTimeout(() => adapter.onStateChange(EPlayerState.ended), 20);
        });

        const onPlaybackUpdate = (ev: undefined | PlaybackUpdateEvent) => {
          const evt = <PlaybackUpdateEvent>ev;
          state$.next(evt);

          adapter.onCurrentTimeChange(evt.data.position / 1000);
          adapter.onDurationChange(evt.data.duration / 1000);
          adapter.onStateChange(!evt.data.isPaused ? EPlayerState.playing : EPlayerState.paused);
        };
        controller.addListener('playback_update', onPlaybackUpdate);
      });
    });
  }
}
