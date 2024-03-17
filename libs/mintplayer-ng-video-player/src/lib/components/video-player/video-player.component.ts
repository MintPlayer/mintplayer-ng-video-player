import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState } from '@mintplayer/player-provider';
import { VideoPlayer, fromVideoEvent } from "@mintplayer/video-player";

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  standalone: true
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  constructor(
    private zone: NgZone,
    // videoPlayerService: VideoPlayerService,
    private destroy: DestroyRef,
  ) {
    // //#region [isViewInited$, url$] => videoRequest$
    // combineLatest([this.isViewInited$, this.url$])
    //   .pipe(filter(([isViewInited]) => !!isViewInited))
    //   .pipe(takeUntilDestroyed())
    //   .subscribe(([, url]) => {
    //     if (url === null) {
    //       this.playerInfo?.adapter?.destroy();
    //       this.playerInfo = null;
    //       this.container.nativeElement.innerHTML = '';
    //     } else {
    //       const matchingApis = videoPlayerService.findApis(url);
    //       if (matchingApis.length === 0) {
    //         throw `No player found for url ${url}`;
    //       } else {
    //         this.videoRequest$.next(matchingApis[0]);
    //       }
    //     }
    //   });
    // //#endregion

    // this.videoRequest$
    //   .pipe(takeUntilDestroyed())
    //   .subscribe(videoRequest => {
    //     if (videoRequest) {
    //       videoRequest.api.loadApi().then(() => {
    //         if ((videoRequest.api.id === this.playerInfo?.platformId) && (videoRequest.api.canReusePlayer !== false)) {
    //           this.playerInfo.adapter.loadVideoById(videoRequest.id);
    //         } else {
    //           this.playerInfo?.adapter?.destroy();
    //           setHtml(videoRequest);
    //           videoRequest.api.createPlayer({
    //             width: this.width,
    //             height: this.height,
    //             autoplay: this.autoplay,
    //             domId: this.domId,
    //             element: this.container.nativeElement,
    //             initialVideoId: videoRequest.id,
    //           }, this.destroyed$).then(adapter => {
    //             this.playerInfo = {
    //               platformId: videoRequest.api.id,
    //               videoId: videoRequest.id,
    //               adapter: adapter,
    //             };

    //             adapter.onStateChange = (state) => this.playerStateObserver$.next(state);
    //             adapter.onMuteChange = (mute) => this.muteObserver$.next(mute);
    //             adapter.onVolumeChange = (volume) => this.volumeObserver$.next(volume);
    //             adapter.onCurrentTimeChange = (progress) => this.currentTimeObserver$.next(progress);
    //             adapter.onDurationChange = (duration) => this.durationObserver$.next(duration);
    //             adapter.onPipChange = (isPip) => this.pipObserver$.next(isPip);
    //             adapter.onFullscreenChange = (isFullscreen) => this.fullscreenObserver$.next(isFullscreen);
    //             this.capabilitiesChange.emit(adapter.capabilities);
    //           }).then(() => {
    //             if (videoRequest !== null) {
    //               if (typeof videoRequest.id !== 'undefined') {
    //                 this.playerInfo?.adapter.loadVideoById(videoRequest.id);
    //               }
    //             }
    //           });

    //           this.pipObserver$.next(false);
    //           this.fullscreenObserver$.next(false);
    //         }
    //       });

    //     } else {
    //       // Cancel all timers / Clear the html
    //       this.playerInfo?.adapter?.destroy();
    //       if (this.container && this.container.nativeElement) {
    //         this.container.nativeElement.innerHTML = '';
    //       }
    //     }
    //   });

    // const setHtml = (request: VideoRequest | null) => {
    //   if (request) {
    //     this.domId = `player${VideoPlayerComponent.playerCounter++}`;
    //     const html = request.api.prepareHtml({
    //       domId: this.domId,
    //       width: this._width,
    //       height: this._height,
    //       initialVideoId: request.id,
    //       autoplay: this.autoplay,
    //     });
    //     this.container.nativeElement.innerHTML = html;
    //   } else {
    //     this.container.nativeElement.innerHTML = '';
    //   }
    // };

    //#endregion

    // this.volumeObserver$
    //   .pipe(debounceTime(20), distinctUntilChanged(), filter(volume => volume !== null), takeUntilDestroyed())
    //   .subscribe(newVolume => this.zoneEmit(this.volumeChange, this._volume = newVolume));
    // this.muteObserver$
    //   .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
    //   .subscribe(newMute => this.zoneEmit(this.muteChange, this._mute = newMute));
    // this.playerStateObserver$
    //   .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
    //   .subscribe(newPlayerState => this.zoneEmit(this.playerStateChange, newPlayerState));
    // this.pipObserver$
    //   .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
    //   .subscribe(isPip => this.zoneEmit(this.isPipChange, this._isPip = isPip));
    // this.fullscreenObserver$
    //   .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
    //   .subscribe(isFullscreen => this.zoneEmit(this.isFullscreenChange, this._isFullscreen = isFullscreen));

    // this.progressObserver$ = combineLatest([this.currentTimeObserver$, this.durationObserver$])
    //   .pipe(debounceTime(10), takeUntilDestroyed())
    //   .pipe(map(([currentTime, duration]) => <PlayerProgress>{ currentTime, duration }));

    // this.progressObserver$.pipe(takeUntilDestroyed())
    //   .subscribe(progress => this.zoneEmit(this.progressChange, progress));
  }

  // destroyed$ = new Subject<boolean>();

  private zoneEmit<T>(emitter: EventEmitter<T>, value?: T) {
    this.zone.run(() => emitter.emit(value));
  }

  //#region width
  get width() {
    return this.player?.width || 300;
  }
  @Input() set width(value: number) {
    if (this.player) {
      this.player.width = value;
    }
  }
  //#endregion
  //#region height
  get height() {
    return this.player?.height || 200;
  }
  @Input() set height(value: number) {
    if (this.player) {
      this.player.height = value;
    }
  }
  //#endregion
  // //#region progress
  // @Output() public progressChange = new EventEmitter<PlayerProgress>();
  // //#endregion
  //#region playerState
  @Input() set playerState(value: EPlayerState) {
    if (this.player) {
      this.player.playerState = value;
    }
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
  //#endregion
  // //#region title
  // public getTitle() {
  //   return new Promise<string | null>((resolve) => {
  //     const adapter = this.playerInfo?.adapter;
  //     if (adapter) {
  //       adapter.getTitle().then(t => resolve(t));
  //     } else {
  //       resolve(null);
  //     }
  //   });
  // }
  // //#endregion
  // //#region volume
  // private _volume = 0;
  // get volume() {
  //   return this._volume;
  // }
  // @Input() set volume(value: number) {
  //   this._volume = value;
  //   this.playerInfo?.adapter.setVolume(value);
  // }
  // @Output() public volumeChange = new EventEmitter<number>();
  // //#endregion
  // //#region mute
  // private _mute = false;
  // get mute() {
  //   return this._mute;
  // }
  // @Input() set mute(value: boolean) {
  //   this._mute = value;
  //   this.playerInfo?.adapter.setMute(value);
  // }
  // @Output() public muteChange = new EventEmitter<boolean>();
  // //#endregion

  // //#region isFullscreen
  // private _isFullscreen = false;
  // get isFullscreen() {
  //   return this._isFullscreen;
  // }
  // @Input() set isFullscreen(value: boolean) {
  //   if (this.playerInfo && this.playerInfo.adapter) {
  //     this.playerInfo.adapter.setFullscreen(value);
  //   }
  // }
  // @Output() public isFullscreenChange = new EventEmitter<boolean>();
  // //#endregion
  // //#region isPip
  // private _isPip = false;
  // get isPip() {
  //   return this._isPip;
  // }
  // @Input() set isPip(value: boolean) {
  //   if (this.playerInfo && this.playerInfo.adapter) {
  //     this.playerInfo.adapter.setPip(value);
  //   }
  // }
  // @Output() public isPipChange = new EventEmitter<boolean>();
  // public setIsPip(isPip: boolean) {
  //   // Vimeo pip requests must originate from a user gesture.
  //   // Hence why we can't make it a bindable property.
  //   // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
  //   this.playerInfo?.adapter?.setPip(isPip);
  // }
  // //#endregion
  // @Input() public autoplay = true;
  //#region autoplay
  public get autoplay() {
    return this.player?.autoplay || false;
  }
  @Input() public set autoplay(value: boolean) {
    if (this.player) {
      this.player.autoplay = value;
    }
  }
  //#endregion
  //#region url
  public get url() {
    return this.player?.url || '';
  }
  @Input() public set url(value: string) {
    this.setUrl(value);
  }
  public setUrl(url: string | null) {
    if (this.player) {
      this.player.url = url;
    }
  }
  //#endregion

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  // private isViewInited$ = new BehaviorSubject<boolean>(false);
  // private url$ = new BehaviorSubject<string | null>(null);
  // private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  // private volumeObserver$ = new Subject<number>();
  // private muteObserver$ = new Subject<boolean>();
  // private currentTimeObserver$ = new Subject<number>();
  // private durationObserver$ = new Subject<number>();
  // private progressObserver$: Observable<PlayerProgress>;
  // private playerStateObserver$ = new Subject<EPlayerState>();
  // private pipObserver$ = new Subject<boolean>();
  // private fullscreenObserver$ = new Subject<boolean>();


  // private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;

  player?: VideoPlayer;
  ngAfterViewInit() {
    // this.isViewInited$.next(true);
    this.player = new VideoPlayer(this.container.nativeElement);
    fromVideoEvent(this.player, 'stateChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([state]) => {
        console.warn('stateChange', state);
        this.playerStateChange.emit(state);
      });
  }

  ngOnDestroy() {
    this.player?.destroy();
    // this.playerInfo?.adapter?.destroy();
    // this.destroyed$.next(true);
  }
}
