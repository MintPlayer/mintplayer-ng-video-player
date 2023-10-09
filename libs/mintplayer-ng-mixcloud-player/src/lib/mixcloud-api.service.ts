import { DestroyRef, Injectable } from '@angular/core';
import { EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { ScriptLoader } from '@mintplayer/ng-script-loader';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MixcloudApiService implements IApiService {

  // https://www.mixcloud.com/developers/widget/

  constructor(private scriptLoader: ScriptLoader) { }

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
    return this.scriptLoader.loadScript('//widget.mixcloud.com/media/js/widgetApi.js')
      .then((readyArgs) => this.apiReady$.next(true));
  }

  public prepareHtml(options: PrepareHtmlOptions): string {
    if (!options.initialVideoId) {
      throw 'The MixCloud api requires an initial video id';
    }

    return `<iframe id="${options.domId}" style="max-width:100%" src="https://www.mixcloud.com/widget/iframe/?autoplay=${options.autoplay ? 1 : 0}&feed=${encodeURIComponent(options.initialVideoId)}"></iframe>`;
  }

  public createPlayer(options: PlayerOptions, destroy: DestroyRef) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      if (!options.element) {
        return rejectPlayer('The MixCloud api requires the options.element to be set');
      }

      const frame = options.element.querySelector('iframe');
      if (!frame) {
        return rejectPlayer('There doesn\'t seem to be an iframe');
      }

      const destroyRef = new Subject();
      let adapter: PlayerAdapter;
      const player = Mixcloud.PlayerWidget(frame);
      player.ready.then(() => {
        console.log('player', player);
        adapter = createPlayerAdapter({
          capabilities: [],
          loadVideoById: (id: string) => player.load(id, options.autoplay),
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
          setMute: (mute) => {
            throw 'MixCloud doesn\'t allow mute';
          },
          setVolume: (mute) => {
            throw 'MixCloud doesn\'t changing the volume';
          },
          setProgress: (time) => player.seek(time),
          setSize: (width, height) => {
            frame.width = String(width);
            frame.height = String(height);
          },
          getTitle: () => new Promise((resolve, reject) => reject('MixCloud doesn\'t allow getting the title')),
          setFullscreen: (isFullscreen) => {
            throw 'MixCloud doesn\'t support fullscreen';
          },
          getFullscreen: () => new Promise((resolve) => resolve(false)),
          setPip: (isPip) => {
            throw 'MixCloud doesn\'t support picture-in-picture'
          },
          getPip: () => new Promise(resolve => resolve(false)),
          destroy: () => {
            destroyRef.next(true);
          }
        });

        player.events.play.on(() => adapter.onStateChange(EPlayerState.playing));
        player.events.pause.on(() => adapter.onStateChange(EPlayerState.paused));
        player.events.ended.on(() => adapter.onStateChange(EPlayerState.ended));
        player.events.progress.on((position: number, duration: number) => {
          adapter.onCurrentTimeChange(position);
          adapter.onDurationChange(duration);
        });

        resolvePlayer(adapter);
      });
    });
  }
}
