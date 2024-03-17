import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { VideoRequest } from '../../interfaces/video-request';
import { VideoPlayerService } from '../../services/video-player.service';

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  constructor(
    private zone: NgZone,
    videoPlayerService: VideoPlayerService,
    destroy: DestroyRef,
  ) {
    //#region [isViewInited$, url$] => videoRequest$
    combineLatest([this.isViewInited$, this.url$])
      .pipe(filter(([isViewInited]) => !!isViewInited))
      .pipe(takeUntilDestroyed())
      .subscribe(([, url]) => {
        if (url === null) {
          this.playerInfo?.adapter?.destroy();
          this.playerInfo = null;
          this.container.nativeElement.innerHTML = '';
        } else {
          const matchingApis = videoPlayerService.findApis(url);
          if (matchingApis.length === 0) {
            throw `No player found for url ${url}`;
          } else {
            this.videoRequest$.next(matchingApis[0]);
          }
        }
      });
    //#endregion

    this.videoRequest$
      .pipe(takeUntilDestroyed())
      .subscribe(videoRequest => {
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
                element: this.container.nativeElement,
                initialVideoId: videoRequest.id,
              }, destroy).then(adapter => {
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
                this.capabilitiesChange.emit(adapter.capabilities);
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
          if (this.container && this.container.nativeElement) {
            this.container.nativeElement.innerHTML = '';
          }
        }
      });

    const setHtml = (request: VideoRequest | null) => {
      if (request) {
        this.domId = `player${VideoPlayerComponent.playerCounter++}`;
        const html = request.api.prepareHtml({
          domId: this.domId,
          width: this._width,
          height: this._height,
          initialVideoId: request.id,
          autoplay: this.autoplay,
        });
        this.container.nativeElement.innerHTML = html;
      } else {
        this.container.nativeElement.innerHTML = '';
      }
    };

    //#endregion

    this.volumeObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), filter(volume => volume !== null), takeUntilDestroyed())
      .subscribe(newVolume => this.zoneEmit(this.volumeChange, this._volume = newVolume));
    this.muteObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(newMute => this.zoneEmit(this.muteChange, this._mute = newMute));
    this.playerStateObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(newPlayerState => this.zoneEmit(this.playerStateChange, newPlayerState));
    this.pipObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(isPip => this.zoneEmit(this.isPipChange, this._isPip = isPip));
    this.fullscreenObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(isFullscreen => this.zoneEmit(this.isFullscreenChange, this._isFullscreen = isFullscreen));

    this.progressObserver$ = combineLatest([this.currentTimeObserver$, this.durationObserver$])
      .pipe(debounceTime(10), takeUntilDestroyed())
      .pipe(map(([currentTime, duration]) => <PlayerProgress>{ currentTime, duration }));

    this.progressObserver$.pipe(takeUntilDestroyed())
      .subscribe(progress => this.zoneEmit(this.progressChange, progress));
  }

  private zoneEmit<T>(emitter: EventEmitter<T>, value?: T) {
    this.zone.run(() => emitter.emit(value));
  }

  //#region width
  private _width = 600;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    this.playerInfo?.adapter.setSize(this._width, this._height);
  }
  //#endregion
  //#region height
  private _height = 450;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    this.playerInfo?.adapter.setSize(this._width, this._height);
  }
  //#endregion
  //#region progress
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  //#endregion
  //#region playerState
  @Input() set playerState(value: EPlayerState) {
    this.playerInfo?.adapter.setPlayerState(value);
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
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
  @Input() set volume(value: number) {
    this._volume = value;
    this.playerInfo?.adapter.setVolume(value);
  }
  @Output() public volumeChange = new EventEmitter<number>();
  //#endregion
  //#region mute
  private _mute = false;
  get mute() {
    return this._mute;
  }
  @Input() set mute(value: boolean) {
    this._mute = value;
    this.playerInfo?.adapter.setMute(value);
  }
  @Output() public muteChange = new EventEmitter<boolean>();
  //#endregion

  //#region isFullscreen
  private _isFullscreen = false;
  get isFullscreen() {
    return this._isFullscreen;
  }
  @Input() set isFullscreen(value: boolean) {
    if (this.playerInfo && this.playerInfo.adapter) {
      this.playerInfo.adapter.setFullscreen(value);
    }
  }
  @Output() public isFullscreenChange = new EventEmitter<boolean>();
  //#endregion
  //#region isPip
  private _isPip = false;
  get isPip() {
    return this._isPip;
  }
  @Input() set isPip(value: boolean) {
    if (this.playerInfo && this.playerInfo.adapter) {
      this.playerInfo.adapter.setPip(value);
    }
  }
  @Output() public isPipChange = new EventEmitter<boolean>();
  public setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why we can't make it a bindable property.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    this.playerInfo?.adapter?.setPip(isPip);
  }
  //#endregion
  @Input() public autoplay = true;
  //#region url
  @Input() public set url(value: string) {
    this.setUrl(value);
  }
  public setUrl(url: string | null) {
    if ((typeof url === 'undefined') || (url === null) || (url === '')) {
      this.url$.next(null);
    } else {
      this.url$.next(url);
    }
  }
  //#endregion

  @Output() capabilitiesChange = new EventEmitter<ECapability[]>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private static playerCounter = 1;
  domId = 'player';

  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private url$ = new BehaviorSubject<string | null>(null);
  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  private volumeObserver$ = new Subject<number>();
  private muteObserver$ = new Subject<boolean>();
  private currentTimeObserver$ = new Subject<number>();
  private durationObserver$ = new Subject<number>();
  private progressObserver$: Observable<PlayerProgress>;
  private playerStateObserver$ = new Subject<EPlayerState>();
  private pipObserver$ = new Subject<boolean>();
  private fullscreenObserver$ = new Subject<boolean>();


  private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.playerInfo?.adapter?.destroy();
  }
}
