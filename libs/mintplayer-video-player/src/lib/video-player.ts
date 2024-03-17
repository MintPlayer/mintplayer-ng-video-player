import { BehaviorSubject, Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, filter, map, takeUntil } from "rxjs";
import { PlayerProgress } from "@mintplayer/player-progress";
import { EPlayerState, PlayerAdapter } from "@mintplayer/player-provider";
import { findApis } from "./player-type-finder";
import { VideoRequest } from "./video-request";
import { VideoEventMap } from "./event-map";
import { EventHandler } from "./event-handler";

export class VideoPlayer {
  constructor(host: HTMLElement) {
    this.url$.pipe(takeUntil(this.destroyed$)).subscribe(url => {
      if (url === null) {
        this.playerInfo?.adapter?.destroy();
        this.playerInfo = null;
        host.innerHTML = '';
      } else {
        const matchingApis = findApis(url);
        if (matchingApis.length === 0) {
          throw `No player found for url ${url}`;
        } else {
          this.videoRequest$.next(matchingApis[0]);
        }
      }
    });
    
    this.videoRequest$.pipe(takeUntil(this.destroyed$)).subscribe(videoRequest => {
      if (videoRequest) {
        videoRequest.api.loadApi().then(() => {
          if ((videoRequest.api.id === this.playerInfo?.platformId) && (videoRequest.api.canReusePlayer !== false)) {
            this.playerInfo.adapter.loadVideoById(videoRequest.id);
          } else {
            this.playerInfo?.adapter?.destroy();
            setHtml(videoRequest);
            videoRequest.api.createPlayer({
              width: this.width,
              height: this.height,
              autoplay: this.autoplay,
              domId: this.domId,
              element: host,
              initialVideoId: videoRequest.id,
            }, this.destroyed$).then(adapter => {
              this.playerInfo = {
                platformId: videoRequest.api.id,
                videoId: videoRequest.id,
                adapter: adapter,
              };

              adapter.onStateChange = (state) => this.playerStateObserver$.next(state);
              adapter.onMuteChange = (mute) => this.muteObserver$.next(mute);
              adapter.onVolumeChange = (volume) => this.volumeObserver$.next(volume);
              adapter.onCurrentTimeChange = (progress) => this.currentTimeObserver$.next(progress);
              adapter.onDurationChange = (duration) => this.durationObserver$.next(duration);
              adapter.onPipChange = (isPip) => this.pipObserver$.next(isPip);
              adapter.onFullscreenChange = (isFullscreen) => this.fullscreenObserver$.next(isFullscreen);
              this.invokeEvent('capabilitiesChange', adapter.capabilities);
            }).then(() => {
              if (videoRequest !== null) {
                if (typeof videoRequest.id !== 'undefined') {
                  this.playerInfo?.adapter.loadVideoById(videoRequest.id);
                }
              }
            });

            this.pipObserver$.next(false);
            this.fullscreenObserver$.next(false);
          }
        });

      } else {
        // Cancel all timers / Clear the html
        this.playerInfo?.adapter?.destroy();
        if (host) {
          host.innerHTML = '';
        }
      }
    });

    const setHtml = (request: VideoRequest | null) => {
      if (request) {
        this.domId = `player${VideoPlayer.playerCounter++}`;
        const html = request.api.prepareHtml({
          domId: this.domId,
          width: this._width,
          height: this._height,
          initialVideoId: request.id,
          autoplay: this.autoplay,
        });
        host.innerHTML = html;
      } else {
        host.innerHTML = '';
      }
    };

    // TODO: missing zone.emit from angular
    this.volumeObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), filter(volume => volume !== null), takeUntil(this.destroyed$))
      .subscribe(newVolume => this.invokeEvent('volumeChange', this._volume = newVolume));
    this.muteObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(newMute => this.invokeEvent('muteChange', this._mute = newMute));
    this.playerStateObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(newPlayerState => this.invokeEvent('stateChange', newPlayerState));
    this.pipObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(isPip => this.invokeEvent('isPipChange', this._isPip = isPip));
    this.fullscreenObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(isFullscreen => this.invokeEvent('isFullscreenChange', this._isFullscreen = isFullscreen));

    this.progressObserver$ = combineLatest([this.currentTimeObserver$, this.durationObserver$])
      .pipe(debounceTime(10), takeUntil(this.destroyed$))
      .pipe(map(([currentTime, duration]) => <PlayerProgress>{ currentTime, duration }));

    this.progressObserver$.pipe(takeUntil(this.destroyed$))
      .subscribe(progress => this.invokeEvent('progressChange', progress));
  }

  //#region Url
  private url$ = new BehaviorSubject<string | null>(null);
  public get url() {
    return this.url$.value;
  }
  public set url(value: string | null) {
    this.url$.next(value || null);
  }
  //#endregion

  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);

  private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;
  private static playerCounter = 1;
  private domId = 'player';

  //#region Event handling
  public on<K extends keyof VideoEventMap>(event: K, handler: (...args: VideoEventMap[K]) => void) {
    this.handlers.push({ event, handler });
  }
  public off<K extends keyof VideoEventMap>(ev: K, handler: (...args: VideoEventMap[K]) => void) {
    const index = this.handlers.findIndex(h => (h.event === ev) && (h.handler === handler));
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }
  private handlers: EventHandler<any>[] = [];
  private invokeEvent<K extends keyof VideoEventMap>(ev: K, ...args: VideoEventMap[K]) {
    this.handlers
      .filter(h => h.event === ev)
      .forEach(h => h.handler(args));
  }
  //#endregion

  //#region Debouncing
  private volumeObserver$ = new Subject<number>();
  private muteObserver$ = new Subject<boolean>();
  private currentTimeObserver$ = new Subject<number>();
  private durationObserver$ = new Subject<number>();
  private progressObserver$: Observable<PlayerProgress>;
  private playerStateObserver$ = new Subject<EPlayerState>();
  private pipObserver$ = new Subject<boolean>();
  private fullscreenObserver$ = new Subject<boolean>();
  //#endregion

  //#region width
  private _width = 600;
  get width() {
    return this._width;
  }
  set width(value: number) {
    this._width = value;
    this.playerInfo?.adapter.setSize(this._width, this._height);
  }
  //#endregion
  //#region height
  private _height = 450;
  get height() {
    return this._height;
  }
  set height(value: number) {
    this._height = value;
    this.playerInfo?.adapter.setSize(this._width, this._height);
  }
  //#endregion
  //#region Autoplay
  public autoplay = true;
  //#endregion

  //#region playerState
  set playerState(value: EPlayerState) {
    this.playerInfo?.adapter.setPlayerState(value);
  }
  //#endregion
  //#region title
  public getTitle() {
    return new Promise<string | null>((resolve) => {
      const adapter = this.playerInfo?.adapter;
      if (adapter) {
        adapter.getTitle().then(t => resolve(t));
      } else {
        resolve(null);
      }
    });
  }
  //#endregion
  //#region volume
  private _volume = 0;
  get volume() {
    return this._volume;
  }
  set volume(value: number) {
    this._volume = value;
    this.playerInfo?.adapter.setVolume(value);
  }
  //#endregion
  //#region mute
  private _mute = false;
  get mute() {
    return this._mute;
  }
  set mute(value: boolean) {
    this._mute = value;
    this.playerInfo?.adapter.setMute(value);
  }
  //#endregion

  //#region isFullscreen
  private _isFullscreen = false;
  get isFullscreen() {
    return this._isFullscreen;
  }
  set isFullscreen(value: boolean) {
    if (this.playerInfo && this.playerInfo.adapter) {
      this.playerInfo.adapter.setFullscreen(value);
    }
  }
  //#endregion
  //#region isPip
  private _isPip = false;
  get isPip() {
    return this._isPip;
  }
  set isPip(value: boolean) {
    if (this.playerInfo && this.playerInfo.adapter) {
      this.playerInfo.adapter.setPip(value);
    }
  }
  public setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why we can't make it a bindable property.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    this.playerInfo?.adapter?.setPip(isPip);
  }
  //#endregion

  //#region Destroyed
  private destroyed$ = new Subject<boolean>();
  destroy() {
    this.playerInfo?.adapter?.destroy();
    this.destroyed$.next(true);
  }
  //#endregion
}