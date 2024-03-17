import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { timer, takeUntil, Subject } from 'rxjs';
import { loadScript } from '@mintplayer/script-loader';

export class DailymotionApiService implements IApiService {

  public get id() {
    return 'dailymotion';
  }

  urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}dailymotion\.com\/video\/(?<id>[0-9A-Za-z]+)$/, 'g'),
  ];


  public loadApi() {
    return loadScript('https://api.dmcdn.net/all.js');
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    return `<div id="${options.domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: Subject<boolean>): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      /** TODO: shouldn't this be options.domId? */
      if (!options.element) {
        return rejectPlayer('The DailyMotion api requires the options.element to be set');
      }

      const destroyRef = new Subject<boolean>();
      let adapter: PlayerAdapter;
      const player = DM.player(options.element.getElementsByTagName('div')[0], {
        width: String(options.width),
        height: String(options.height),
        params: {
          autoplay: options.autoplay,
          "queue-enable": false,
        },
        events: {
          apiready: () => {
            adapter = createPlayerAdapter({
              capabilities: [ECapability.volume, ECapability.mute, ECapability.getTitle],
              loadVideoById: (id: string) => player.load({video: id}),
              setPlayerState: (state: EPlayerState) => {
                switch (state) {
                  case EPlayerState.playing:
                    player.play();
                    break;
                  case EPlayerState.paused:
                    player.pause();
                    break;
                  case EPlayerState.ended:
                  case EPlayerState.unstarted:
                    break;
                }
              },
              setMute: (mute) => player.setMuted(mute),
              setVolume: (volume) => player.setVolume(volume / 100),
              setProgress: (time) => player.seek(time),
              setSize: (width, height) => {
                player.width = width;
                player.height = height;
              },
              getTitle: () => new Promise((resolve) => {
                resolve(player.video.title.replace(new RegExp('\\+', 'g'), ' '));
              }),
              setFullscreen: (isFullscreen) => {
                if (isFullscreen) {
                  console.warn('DailyMotion player doesn\'t allow setting fullscreen from outside');
                  setTimeout(() => adapter.onFullscreenChange(false), 50);
                }
              },
              getFullscreen: () => new Promise(resolve => {
                console.warn('DailyMotion player doesn\'t allow setting fullscreen from outside');
                resolve(false);
              }),
              setPip: (isPip) => {
                if (isPip) {
                  console.warn('DailyMotion player doesn\'t support PIP mode');
                  setTimeout(() => adapter.onPipChange(false), 50);
                }
              },
              getPip: () => new Promise(resolve => resolve(false)),
              destroy: () => destroyRef.next(true),
            });

            if (typeof window !== 'undefined') {
              timer(0, 50)
                .pipe(takeUntil(destroyRef), takeUntil(destroy))
                .subscribe(() => {
                  adapter.onMuteChange(player.muted);
                  adapter.onCurrentTimeChange(player.currentTime);
                });
            }

            resolvePlayer(adapter);
          },
          play: () => {
            adapter.onStateChange(EPlayerState.playing);
            adapter.onDurationChange(player.duration);
          },
          pause: () => adapter.onStateChange(EPlayerState.paused),
          end: () => adapter.onStateChange(EPlayerState.ended),
        }
      });

      player.onvolumechange = () => {
        if (player) {
          adapter.onVolumeChange(player.volume * 100);
        }
      }
    });
  }
}
