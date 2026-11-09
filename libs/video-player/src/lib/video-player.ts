import { BehaviorSubject, Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, filter, map, takeUntil } from "rxjs";
import { PlayerProgress } from "@mintplayer/player-progress";
import { ECapability, EPlayerState, IApiService, PlayerAdapter } from "@mintplayer/player-provider";
import { findApis } from "./player-type-finder";
import { VideoRequest } from "./video-request";
import { VideoEventMap } from "./event-map";
import { EventHandler } from "./event-handler";

export class VideoPlayer {
  constructor(apis?: IApiService[], host?: HTMLElement) {
    this.host$.next(host);
    this.apis$.next(apis || []);

    combineLatest([this.url$, this.host$, this.apis$])
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe(([url, host, apis]) => {
        if (host) {
          if (url === null) {
            this.playerInfo?.adapter?.destroy();
            this.playerInfo = null;
            host.innerHTML = '';
          } else {
            const matchingApis = findApis(url, apis);
            if (matchingApis.length > 0) {
              this.videoRequest$.next(matchingApis[0]);
            } else if (apis.length > 0) {
              throw `No player found for url ${url}`;
            }
          }
        }
      });
    
    combineLatest([this.videoRequest$, this.host$])
      .pipe(filter(([_, host]) => !!host))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([videoRequest, host]) => {
        if (videoRequest) {
          videoRequest.api.loadApi().then(() => {
            if ((videoRequest.api.id === this.playerInfo?.platformId) && (videoRequest.api.canReusePlayer !== false)) {
              this.loadAndApplySettings(this.playerInfo.adapter, videoRequest.id);
            } else {
              this.playerInfo?.adapter?.destroy();
              this.setHtml(videoRequest, host!);
              videoRequest.api.createPlayer({
                width: this.width,
                height: this.height,
                autoplay: this.autoplay,
                domId: this.domId,
                element: host!,
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
                const adapter = this.playerInfo?.adapter;
                if (adapter && (typeof videoRequest.id !== 'undefined')) {
                  this.loadAndApplySettings(adapter, videoRequest.id);
                } else if (adapter) {
                  this.applySettings(adapter);
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

    // TODO: missing zone.emit from angular
    // Volume and mute are the listener's settings, owned here (#105). An adapter's
    // report only replaces them outside the settle window; see onVolumeReport.
    this.volumeObserver$
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe(volume => this.onVolumeReport(volume));
    this.muteObserver$
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe(mute => this.onMuteReport(mute));
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
  public set url(value: string | null | undefined) {
    this.url$.next(value || null);
  }
  //#endregion
  //#region Apis
  private apis$ = new BehaviorSubject<IApiService[]>([]);
  public set apis(value: IApiService[]) {
    this.apis$.next(value);
  }
  //#endregion
  //#region Host
  private host$ = new BehaviorSubject<HTMLElement | undefined>(undefined);
  public set host(value: HTMLElement | undefined) {
    this.host$.next(value);
  }
  //#endregion

  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);

  private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;
  private static playerCounter = 1;
  private domId = 'player';

  //#region Event handling
  public on<K extends keyof VideoEventMap>(event: K, handler: (args: VideoEventMap[K]) => void) {
    this.handlers.push({ event, handler });
  }
  public off<K extends keyof VideoEventMap>(ev: K, handler: (args: VideoEventMap[K]) => void) {
    const index = this.handlers.findIndex(h => (h.event === ev) && (h.handler === handler));
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }
  private handlers: EventHandler<any>[] = [];
  private invokeEvent<K extends keyof VideoEventMap>(ev: K, args: VideoEventMap[K]) {
    this.handlers
      .filter(h => h.event === ev)
      .forEach(h => h.handler(args));
  }
  //#endregion

  private setHtml(request: VideoRequest | null, host: HTMLElement) {
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
  }

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
  //#region volume and mute
  /**
   * How long after volume and mute were pushed to an adapter a contradicting
   * report is still taken as the platform's own default or load reset, and
   * answered by re-applying, rather than as the listener using the platform's UI.
   * Sized by spike S3 in docs/prd/keep-volume-and-mute-across-media.md.
   */
  public static readonly SETTLE_MS = 2000;
  private static readonly REAPPLY_INTERVAL_MS = 250;

  /** The listener's settings. Undefined until set by the consumer or first reported by a platform. */
  private desiredVolume: number | undefined = undefined;
  private desiredMute: boolean | undefined = undefined;
  private settleUntil = 0;
  private lastReapply = 0;

  get volume() {
    return this.desiredVolume ?? 0;
  }
  set volume(value: number) {
    if ((typeof value !== 'number') || !Number.isFinite(value)) {
      return;
    }
    this.desiredVolume = value;
    const adapter = this.playerInfo?.adapter;
    if (adapter && this.can(adapter, ECapability.volume)) {
      this.openSettleWindow();
      this.call(() => adapter.setVolume(value));
    }
  }

  get mute() {
    return this.desiredMute ?? false;
  }
  set mute(value: boolean) {
    if (typeof value !== 'boolean') {
      return;
    }
    this.desiredMute = value;
    const adapter = this.playerInfo?.adapter;
    if (adapter && this.can(adapter, ECapability.mute)) {
      this.openSettleWindow();
      this.call(() => adapter.setMute(value));
    }
  }

  private loadAndApplySettings(adapter: PlayerAdapter, videoId: string) {
    try {
      adapter.loadVideoById(videoId);
    } finally {
      this.applySettings(adapter);
    }
  }

  /** Push the listener's settings to the adapter, as far as its capabilities allow. */
  private applySettings(adapter: PlayerAdapter, openWindow = true) {
    if (openWindow) {
      this.openSettleWindow();
    }
    const canMute = this.can(adapter, ECapability.mute);
    // Mute first, so the medium never starts audible.
    if (canMute && (this.desiredMute === true)) {
      this.call(() => adapter.setMute(true));
    }
    if ((this.desiredVolume !== undefined) && this.can(adapter, ECapability.volume)) {
      const volume = this.desiredVolume;
      this.call(() => adapter.setVolume(volume));
    }
    if (canMute && (this.desiredMute === false)) {
      this.call(() => adapter.setMute(false));
    }
  }

  private onVolumeReport(volume: number) {
    if ((typeof volume !== 'number') || !Number.isFinite(volume)) {
      return; // Platforms report junk (undefined, null) while loading.
    }
    if ((this.desiredVolume !== undefined) && (Math.abs(this.desiredVolume - volume) < 0.5)) {
      return;
    }
    if ((this.desiredVolume !== undefined) && this.isSettling()) {
      this.reapply();
      return;
    }
    this.desiredVolume = volume;
    this.invokeEvent('volumeChange', volume);
  }

  private onMuteReport(mute: boolean) {
    if (typeof mute !== 'boolean') {
      return;
    }
    if (this.desiredMute === mute) {
      return;
    }
    if ((this.desiredMute !== undefined) && this.isSettling()) {
      this.reapply();
      return;
    }
    this.desiredMute = mute;
    this.invokeEvent('muteChange', mute);
  }

  private openSettleWindow() {
    this.settleUntil = Date.now() + VideoPlayer.SETTLE_MS;
  }

  private isSettling() {
    return Date.now() < this.settleUntil;
  }

  /** Answer a platform's reset. Throttled, since polls report every 50 ms; never extends the window. */
  private reapply() {
    const adapter = this.playerInfo?.adapter;
    const now = Date.now();
    if (adapter && (now - this.lastReapply >= VideoPlayer.REAPPLY_INTERVAL_MS)) {
      this.lastReapply = now;
      this.applySettings(adapter, false);
    }
  }

  private can(adapter: PlayerAdapter, capability: ECapability) {
    return (adapter.capabilities ?? []).includes(capability);
  }

  /** Setting volume or mute must never throw out of a setter, whatever the platform. */
  private call(action: () => void) {
    try {
      action();
    } catch (e) {
      console.warn('VideoPlayer: the player rejected a volume or mute change', e);
    }
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