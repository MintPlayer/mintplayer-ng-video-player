import { isPlatformServer } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { Subject, takeUntil, timer } from 'rxjs';
import { loadScript } from '@mintplayer/script-loader';

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService implements IApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: any) {}

  public get id() {
    return 'youtube';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>[^&?]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/shorts\/(?<id>[^&?]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/shorts\/(?<id>[^&?]+)/, 'g'),
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/live\/(?<id>[^&?]+)/, 'g'),
  ];

  public loadApi() {
    return loadScript('https://www.youtube.com/iframe_api', { windowCallback: 'onYouTubeIframeAPIReady' });
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    return `<div id="${options.domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.domId) {
        return rejectPlayer('The YouTube api requires the options.domId to be set');
      }

      const destroyRef = new Subject();
      let adapter: PlayerAdapter;
      const player = new YT.Player(options.domId, {
        width: options.width,
        height: options.height,
        playerVars: {
          fs: 1,
          autoplay: <any>options.autoplay,
        },
        events: {
          onReady: (ev: YT.PlayerEvent) => {
            adapter = createPlayerAdapter({
              capabilities: [ECapability.volume, ECapability.mute, ECapability.getTitle],
              loadVideoById: (id: string) => player.loadVideoById(id),
              setPlayerState: (state: EPlayerState) => {
                switch (state) {
                  case EPlayerState.playing:
                    player.playVideo();
                    break;
                  case EPlayerState.paused:
                    player.pauseVideo();
                    break;
                  case EPlayerState.ended:
                    player.stopVideo();
                    break;
                  case EPlayerState.unstarted:
                    break;
                }
              },
              setMute: (mute) => mute ? player.mute() : player.unMute(),
              setVolume: (volume) => player.setVolume(volume),
              setProgress: (time) => player.seekTo(time, true),
              setSize: (width, height) => player.setSize(width, height),
              getTitle: () => new Promise((resolve) => {
                resolve((<any>player).getVideoData().title);
              }),
              setFullscreen: (isFullscreen) => {
                if (isFullscreen) {
                  console.warn('YouTube player doesn\'t allow setting fullscreen from outside');
                  setTimeout(() => adapter.onFullscreenChange(false), 50);
                }
              },
              getFullscreen: () => new Promise(resolve => {
                console.warn('YouTube player doesn\'t allow setting fullscreen from outside');
                resolve(false);
              }),
              setPip: (isPip) => {
                if (isPip) {
                  console.warn('YouTube player doesn\'t support PIP mode');
                  setTimeout(() => adapter.onPipChange(false), 50);
                }
              },
              getPip: () => new Promise(resolve => resolve(false)),
              destroy: () => {
                destroyRef.next(true);
                player.destroy();  
              },
            });

            if (!isPlatformServer(this.platformId)) {
              timer(0, 50)
                .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                .subscribe(() => {
                  // Progress
                  const currentTime = player.getCurrentTime();
                  adapter.onCurrentTimeChange(currentTime);
                });
              timer(0, 50)
                .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                .subscribe(() => {
                  // Volume
                  const vol = player.getVolume();
                  adapter.onVolumeChange(vol);
                  
                  // Mute
                  const currentMute = player.isMuted();
                  adapter.onMuteChange(currentMute);
                });
            }

            resolvePlayer(adapter);
          },
          onStateChange: (ev: YT.OnStateChangeEvent) => {
            switch (ev.data) {
              case YT.PlayerState.PLAYING:
                adapter.onDurationChange(player.getDuration());
                return adapter.onStateChange(EPlayerState.playing);
              case YT.PlayerState.PAUSED:
                return adapter.onStateChange(EPlayerState.paused);
              case YT.PlayerState.ENDED:
                return adapter.onStateChange(EPlayerState.ended);
              case YT.PlayerState.UNSTARTED:
                return adapter.onStateChange(EPlayerState.unstarted);
            }
          }
        }
      });
    });
  }
}