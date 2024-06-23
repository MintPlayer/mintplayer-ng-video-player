import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject, fromEvent, fromEventPattern, takeUntil, timer } from 'rxjs';

export class StreamableService implements IApiService {

  public get id() {
    return 'streamable';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.)?streamable\.com\/(?<id>[0-9a-z]+)$/, 'g'),
  ];

  canReusePlayer = false;

  public loadApi() {
    return loadScript('https://cdn.embed.ly/player-0.1.0.min.js');
  }

  public prepareHtml(options: Partial<Omit<PlayerOptions, 'element'>>): string {
    return `<iframe
      src="https://streamable.com/o/${options.initialVideoId}"
      frameBorder="0"
      scrolling="no"
      allow="encrypted-media; autoplay; fullscreen;"
      width="${options.width ?? 450}"
      height="${options.height ?? 300}"
      style="max-width: 100%"
      ></iframe>`;
  }

  public createPlayer(options: PlayerOptions, destroy: Subject<boolean>) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      const iframe = options.element.querySelector('iframe');

      if (!iframe) {
        return rejectPlayer('Streamable player requires the options.element to be set, and contain an iframe');
      }

      const player = new playerjs.Player(iframe);
      const destroyRef = new Subject<boolean>();

      fromEventPattern(
        (handler: () => void) => player.on('ready', handler),
        (handler: () => void) => player.off('ready', handler),
      )
        .pipe(takeUntil(destroyRef), takeUntil(destroy))
        .subscribe(() => {
          const adapter = createPlayerAdapter({
            capabilities: [ECapability.volume, ECapability.mute],
            loadVideoById: (id) => {
              throw 'The Streamable player cannot be reused';
            },
            getPlayerState: () => new Promise(resolve => {
              player.getPaused((paused) => {
                if (paused) resolve(EPlayerState.paused);
                else resolve(EPlayerState.playing);
              });
            }),
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
            getMute: () => new Promise(resolve => player.getMuted(muted => resolve(muted))),
            setMute: (mute) => {
              if (mute) {
                player.mute();
              } else {
                player.unmute();
              }
            },
            getVolume: () => new Promise(resolve => player.getVolume(volume => resolve(volume))),
            setVolume: (volume) => {
              player.setVolume(volume);
            },
            setProgress: (time) => {
              player.setCurrentTime(time);
            },
            setSize: (width, height) => {
              iframe.width = `${width}px`;
              iframe.height = `${height}px`;
            },
            getPlaybackRate: () => new Promise((resolve, reject) => reject('Streamable doesn\'t support changing playback rate')),
            setPlaybackRate: () => { throw 'Streamable doesn\'t support changing playback rate' },
            getPlaybackRates: () => new Promise((resolve, reject) => reject('Streamable doesn\'t support changing playback rate')),
            getQuality: () => new Promise((resolve, reject) => reject('Streamable doesn\'t support changing video quality')),
            setQuality: () => { throw 'Streamable doesn\'t support changing video quality' },
            getQualities: () => new Promise((resolve, reject) => reject('Streamable doesn\'t support changing video quality')),
            get360properties: () => new Promise((resolve, reject) => reject('Streamable doesn\'t support 360 mode')),
            set360properties: (properties) => { throw 'Streamable doesn\'t support 360 mode'; },
            getTitle: () => new Promise((resolve) => resolve('')),
            setFullscreen: (fullscreen) => {
              if (fullscreen) {
                console.warn('Streamable player doesn\'t allow setting fullscreen from outside');
                setTimeout(() => adapter.onFullscreenChange(false), 50);
              }
            },
            getFullscreen: () => new Promise((resolve) => resolve(false)),
            setPip: (pip) => {
              if (pip) {
                console.warn('Streamable player doesn\'t support PIP mode');
                setTimeout(() => adapter.onPipChange(false), 50);
              }
            },
            getPip: () => new Promise((resolve) => resolve(false)),
            destroy: () => {
              destroyRef.next(true);
            }
          });
    
          player.setLoop(false);

          fromEventPattern(
            (handler: () => void) => player.on('play', handler),
            (handler: () => void) => player.off('play', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.playing));
            
          fromEventPattern(
            (handler: () => void) => player.on('pause', handler),
            (handler: () => void) => player.off('pause', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.paused));

          fromEventPattern(
            (handler: () => void) => player.on('ended', handler),
            (handler: () => void) => player.off('ended', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(() => adapter.onStateChange(EPlayerState.ended));

          fromEventPattern<playerjs.StreamableEventMap['timeupdate']>(
            (handler: () => void) => player.on('timeupdate', handler),
            (handler: () => void) => player.off('timeupdate', handler),
          )
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(({seconds, duration}) => {
              adapter.onCurrentTimeChange(seconds);
              adapter.onDurationChange(duration);
            });

            
          if (typeof window !== 'undefined') {
            timer(0, 50)
              .pipe(takeUntil(destroyRef), takeUntil(destroy))
              .subscribe(() => {
                player.getVolume((volume) => adapter.onVolumeChange(volume));
                player.getMuted((mute) => adapter.onMuteChange(mute));
              });
          }

          if (options.autoplay) {
            setTimeout(() => player.play(), 20);
          }

          resolvePlayer(adapter);
        });
    });
  }

}
