import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { BehaviorSubject, Subject, takeUntil, timer } from 'rxjs';
import { MixcloudPlayerExternalWidgetApiRPC, PlayerWidget } from './remote/widgetApi';

export class MixcloudApiService implements IApiService {

  // https://www.mixcloud.com/developers/widget/

  public get id() {
    return 'mixcloud';
  }

  urlRegexes = [
    new RegExp(/http[s]{0,1}:\/\/(www.){0,1}mixcloud\.com(?<id>\/[0-9A-Za-z-]+\/[0-9A-Za-z-]+)\/{0,1}/),
  ]

  match2id(match: RegExpExecArray) {
    if (!match.groups) {
      throw 'match2id - match.groups is undefined';
    }

    return `${match.groups['id']}/`;
  }

  public apiReady$ = new BehaviorSubject<boolean>(false);

  public loadApi() {
    // return loadScript('//widget.mixcloud.com/media/js/widgetApi.js')
    //   .then((readyArgs) => this.apiReady$.next(true));

    return new Promise(resolve => resolve(true))
      .then((readyArgs) => this.apiReady$.next(true));
  }

  public prepareHtml(options: PrepareHtmlOptions): string {
    if (!options.initialVideoId) {
      throw 'The MixCloud api requires an initial video id';
    }

    return `<iframe id="${options.domId}" style="max-width:100%" src="https://www.mixcloud.com/widget/iframe/?autoplay=${options.autoplay ? 1 : 0}&feed=${encodeURIComponent(options.initialVideoId)}" allow="autoplay"></iframe>`;
  }

  public createPlayer(options: PlayerOptions, destroy: Subject<boolean>) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      if (!options.element) {
        return rejectPlayer('The MixCloud api requires the options.element to be set');
      }

      const frame = options.element.querySelector('iframe');
      if (!frame) {
        return rejectPlayer('There doesn\'t seem to be an iframe');
      }

      const destroyRef = new Subject<boolean>();
      let adapter: PlayerAdapter;
      const player = PlayerWidget(frame);
      player.ready.then(() => {
        let events: MixCloudEvents;
        adapter = createPlayerAdapter({
          capabilities: [ECapability.volume, ECapability.getTitle],
          loadVideoById: (id: string) => {
            player.load && player.load(id, options.autoplay)
              // .then(() => this.hookEvents(player, adapter));
          },
          setPlayerState: (state: EPlayerState) => {
            switch (state) {
              case EPlayerState.playing:
                player.play && player.play();
                break;
              case EPlayerState.paused:
                player.pause && player.pause();
                break;
              case EPlayerState.ended:
              case EPlayerState.unstarted:
                break;
            }
          },
          setMute: (mute) => {
            throw 'MixCloud doesn\'t allow mute';
          },
          setVolume: (volume) => player.setVolume && player.setVolume(volume / 100),
          setProgress: (time) => player.seek && player.seek(time),
          setSize: (width, height) => {
            frame.width = String(width);
            frame.height = String(height);
          },
          getTitle: () => new Promise((resolve, reject) => {
            if (player.getCurrentKey) {
              player.getCurrentKey().then((key) => resolve(key));
            } else {
              reject('Player not yet initialized');
            }
          }),
          setFullscreen: (isFullscreen) => {
            throw 'MixCloud doesn\'t support fullscreen';
          },
          getFullscreen: () => new Promise((resolve) => resolve(false)),
          setPip: (isPip) => {
            throw 'MixCloud doesn\'t support picture-in-picture'
          },
          getPip: () => new Promise(resolve => resolve(false)),
          destroy: () => {
            player.events.play.off(events.playHandler);
            player.events.pause.off(events.pauseHandler);
            player.events.ended.off(events.endedHandler);
            player.events.progress.off(events.progressHandler);
            player.destroy();
            setTimeout(() => destroyRef.next(true), 50);
          }
        });

        events = this.hookEvents(player, adapter);

        if (typeof window !== 'undefined') {
          timer(0, 50)
            .pipe(takeUntil(destroyRef), takeUntil(destroy))
            .subscribe(() => {
              if (player.getVolume) {
                player.getVolume().then((vol) => adapter.onVolumeChange(vol * 100));
              }
            });
        }

        resolvePlayer(adapter);
      });
    });
  }

  private hookEvents(player: MixcloudPlayerExternalWidgetApiRPC, adapter: PlayerAdapter): MixCloudEvents {
    const playHandler = () => adapter.onStateChange(EPlayerState.playing);
    const pauseHandler = () => adapter.onStateChange(EPlayerState.paused);
    const endedHandler = () => adapter.onStateChange(EPlayerState.ended);
    const progressHandler = (position: number, duration: number) => {
      adapter.onCurrentTimeChange(position);
      adapter.onDurationChange(duration);
    };

    player.events.play.on(playHandler);
    player.events.pause.on(pauseHandler);
    player.events.ended.on(endedHandler);
    player.events.progress.on(progressHandler);

    return {
      playHandler,
      pauseHandler,
      endedHandler,
      progressHandler,
    };
  }
}

interface MixCloudEvents {
  playHandler: () => void;
  pauseHandler: () => void;
  endedHandler: () => void;
  progressHandler: (position: number, duration: number) => void;
}
