/// <reference types="../../types/vimeo" />

import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { Subject, takeUntil, timer } from 'rxjs';
import { loadScript } from '@mintplayer/script-loader';

export class VimeoApiService implements IApiService {

  public get id() {
    return 'vimeo';
  }

  public urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}vimeo\.com\/(?<id>[0-9]+)$/, 'g'),
  ];

  public loadApi() {
    return loadScript('https://player.vimeo.com/api/player.js');
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    return `<div id="${options.domId}" style="max-width:100%"></div>`;
  }

  public createPlayer(options: PlayerOptions, destroy: Subject<boolean>): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.domId) {
        return rejectPlayer('The Vimeo api requires the options.domId to be set');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('Vimeo requires an initial video');
      }

      const destroyRef = new Subject<boolean>();
      let adapter: PlayerAdapter;
      const player = new Vimeo.Player(options.domId, {
        id: options.initialVideoId,
        width: options.width,
        height: options.height,
        autoplay: options.autoplay,
        pip: true,
      });


      player.ready().then(() => {
        adapter = createPlayerAdapter({
          capabilities: [ECapability.fullscreen, ECapability.pictureInPicture, ECapability.volume, ECapability.mute, ECapability.getTitle],
          loadVideoById: (id: string) => player.loadVideo(id),
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
          setVolume: (volume) => player.setVolume(volume / 100),
          setMute: (mute) => player.setMuted(mute),
          setProgress: (time) => player.setCurrentTime(time),
          setSize: (width, height) => {
            if (options.element) {
              const iframe = options.element.querySelector<HTMLIFrameElement>('div iframe');
              if (iframe) {
                iframe.width = String(width);
                iframe.height = String(height);
              }
            }
          },
          getTitle: () => player.getVideoTitle(),
          setFullscreen: (isFullscreen) => {
            if (isFullscreen) {
              player.requestFullscreen();
            } else {
              player.exitFullscreen();
            }
          },
          getFullscreen: () => player.getFullscreen(),
          setPip: (isPip) => {
            if (isPip) {
              // const iframe = options.element?.querySelector<HTMLIFrameElement>('div iframe');
              // iframe?.click();
  
              // Below promise doesn't resolve nor reject
              player.requestPictureInPicture();
              setTimeout(() => {
                player.getPictureInPicture().then((current) => {
                  if (current !== isPip) {
                    console.warn('To enable pip from outside its iframe, you need to first focus the player, then call setPip');
                    adapter.onPipChange(current);
                  }
                });
              }, 50);
            } else {
              player.exitPictureInPicture();
            }
          },
          getPip: () => player.getPictureInPicture(),
          destroy: () => {
            destroyRef.next(true);
            player.destroy();
          },
        });
        resolvePlayer(adapter);
      });
      player.on('loaded', () => {
        adapter.onStateChange(EPlayerState.unstarted);
        if (typeof window !== 'undefined') {
          setTimeout(() => options.autoplay && player.play(), 600);
          timer(0, 50)
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(() => {
              // Mute
              player.getMuted().then((currentMute) => adapter.onMuteChange(currentMute));
            });
          player.getVolume().then((vol) => adapter.onVolumeChange(vol * 100));
          player.getDuration().then((duration) => adapter.onDurationChange(duration));
        }
      });
      player.on('play', () => adapter.onStateChange(EPlayerState.playing));
      player.on('pause', () => adapter.onStateChange(EPlayerState.paused));
      player.on('ended', () => adapter.onStateChange(EPlayerState.ended));
      player.on('volumechange', (ev) => adapter.onVolumeChange(ev.volume * 100));
      player.on('timeupdate', (ev) => adapter.onCurrentTimeChange(ev.seconds));
      player.on('enterpictureinpicture', () => adapter.onPipChange(true));
      player.on('leavepictureinpicture', () => adapter.onPipChange(false));
      player.on('fullscreenchange', (ev) => adapter.onFullscreenChange(ev.fullscreen));

    });
  }

}