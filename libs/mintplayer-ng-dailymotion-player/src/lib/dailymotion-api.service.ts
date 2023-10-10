import { isPlatformServer } from '@angular/common';
import { Injectable, DestroyRef, Inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { timer, takeUntil, Subject } from 'rxjs';
import { ScriptLoader } from '@mintplayer/ng-script-loader';

@Injectable({
  providedIn: 'root'
})
export class DailymotionApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: object, private scriptLoader: ScriptLoader) {
  }

  public get id() {
    return 'dailymotion';
  }

  urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}dailymotion\.com\/video\/(?<id>[0-9A-Za-z]+)$/, 'g'),
  ];


  public loadApi() {
    return this.scriptLoader.loadScript('https://api.dmcdn.net/all.js');
  }

  public prepareHtml(domId: string, width: number, height: number) {
    return `<div id="${domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.element) {
        return rejectPlayer('The DailyMotion api requires the options.element to be set');
      }

      const destroyRef = new Subject();
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

            if (!isPlatformServer(this.platformId)) {
              timer(0, 50)
                .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
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
