/// <reference path="../../types/vimeo/index.d.ts" />

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


      // The SDK unmutes on every setVolume, and loadVideo resets volume and mute
      // to its defaults (spike S1 in docs/prd/keep-volume-and-mute-across-media.md).
      // So the adapter remembers both, and puts them back itself.
      let volume: number | null = null;
      let muted = false;
      let lastMuteSet = 0;
      const setVolume = (newVolume: number): Promise<void> => {
        volume = newVolume;
        const keepMuted = muted;
        return Promise.resolve(player.setVolume(newVolume / 100))
          .then(() => {
            if (keepMuted && muted) {
              player.setMuted(true);
            }
          })
          .catch(() => undefined);
      };
      const restore = (settings: { volume: number | null, muted: boolean }) => {
        muted = settings.muted;
        lastMuteSet = Date.now();
        if (settings.muted) {
          player.setMuted(true);
        }
        return (settings.volume === null) ? Promise.resolve() : setVolume(settings.volume);
      };

      player.ready().then(() => {
        adapter = createPlayerAdapter({
          capabilities: [ECapability.fullscreen, ECapability.pictureInPicture, ECapability.volume, ECapability.mute, ECapability.getTitle],
          loadVideoById: (id: string) => {
            const settings = { volume, muted };
            Promise.resolve(player.loadVideo(id))
              .then(() => restore(settings))
              .catch(() => undefined);
          },
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
          setVolume: (newVolume) => { setVolume(newVolume); },
          setMute: (mute) => {
            muted = mute;
            lastMuteSet = Date.now();
            player.setMuted(mute);
          },
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
      let polling = false;
      player.on('loaded', () => {
        adapter.onStateChange(EPlayerState.unstarted);
        if (typeof window !== 'undefined') {
          setTimeout(() => options.autoplay && player.play(), 600);
          // 'loaded' fires for every video; one poll per player is enough.
          if (!polling) {
            polling = true;
            timer(0, 50)
              .pipe(takeUntil(destroyRef), takeUntil(destroy))
              .subscribe(() => {
                // Mute
                player.getMuted().then((currentMute) => {
                  // Follow the listener's own clicks, but not a read that predates our last setMuted.
                  if (Date.now() - lastMuteSet > 150) {
                    muted = currentMute;
                  }
                  adapter.onMuteChange(currentMute);
                });
              });
          }
          player.getVolume().then((vol) => adapter.onVolumeChange(vol * 100));
          player.getDuration().then((duration) => adapter.onDurationChange(duration));
        }
      });
      player.on('play', () => adapter.onStateChange(EPlayerState.playing));
      player.on('pause', () => adapter.onStateChange(EPlayerState.paused));
      player.on('ended', () => adapter.onStateChange(EPlayerState.ended));
      player.on('volumechange', (ev) => {
        volume = ev.volume * 100;
        adapter.onVolumeChange(volume);
      });
      player.on('timeupdate', (ev) => adapter.onCurrentTimeChange(ev.seconds));
      player.on('enterpictureinpicture', () => adapter.onPipChange(true));
      player.on('leavepictureinpicture', () => adapter.onPipChange(false));
      player.on('fullscreenchange', (ev) => adapter.onFullscreenChange(ev.fullscreen));

    });
  }

}