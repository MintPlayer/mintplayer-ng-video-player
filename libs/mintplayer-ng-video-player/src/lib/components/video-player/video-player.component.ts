import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { EPlayerState, IApiService, PlayerAdapter, VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { VideoRequest } from '../../interfaces/video-request';

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  constructor(
    @Inject(VIDEO_APIS) private apis: IApiService[],
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private destroy: DestroyRef,
  ) {
    //#region [isViewInited$, url$] => videoRequest$
    combineLatest([this.isViewInited$, this.url$])
      .pipe(filter(([isViewInited, url]) => !!isViewInited))
      .pipe(takeUntilDestroyed())
      .subscribe(([isViewInited, url]) => {
        if (url === null) {
          this.playerInfo?.adapter?.destroy();
          this.playerInfo = null;
          this.container.nativeElement.innerHTML = '';
        } else {
          const matchingApis = apis
            .map(api => {
              const matches = api.urlRegexes
                .map(rgx => new RegExp(rgx).exec(url))
                .filter(r => r !== null);

              if (matches.length === 0) {
                return null;
              } else if (matches[0] === null) {
                return null;
              } else if (!matches[0].groups) {
                return null;
              } else {
                return <VideoRequest>{
                  api,
                  id: matches[0].groups['id']
                };
              }
            })
            .filter(p => (p !== null));

          if ((matchingApis.length === 0) || !matchingApis[0]) {
            throw `No player found for url ${url}`;
          } else {
            this.videoRequest$.next(matchingApis[0]);
          }
        }
      });
    //#endregion

    //#region [videoRequest$] => isApiReady$
    this.videoRequest$
      .pipe(takeUntilDestroyed())
      .subscribe((videoRequest) => {
        if (videoRequest) {
          videoRequest?.api.apiReady$
            .pipe(filter(ready => !!ready), take(1), takeUntilDestroyed(destroy))
            .subscribe((ready) => this.isApiReady$.next(ready));
          videoRequest?.api.loadApi();
        } else {
          // Cancel all timers / Clear the html
          this.playerInfo?.adapter?.destroy();
          if (this.container && this.container.nativeElement) {
            this.container.nativeElement.innerHTML = '';
          }
        }
      });
    //#endregion

    const setHtml = (request: VideoRequest | null) => {
      if (request) {
        this.domId = `player${VideoPlayerComponent.playerCounter++}`;
        this.container.nativeElement.innerHTML = request.api.prepareHtml(this.domId, this._width, this._height);
      } else {
        this.container.nativeElement.innerHTML = '';
      }
    };
    
    //#region [isApiReady$, videoRequest.playerType] => isSwitchingVideo$, isPlayerReady$
    this.isApiReady$
      .pipe(filter(r => !!r), takeUntilDestroyed())
      .subscribe((value) => {
        const currentVideoRequest = this.videoRequest$.value;

        if (currentVideoRequest) {
          if (currentVideoRequest.api.id === this.playerInfo?.platformId) {
            this.playerInfo.adapter.loadVideoById(currentVideoRequest.id);
          } else {
            this.playerInfo?.adapter?.destroy();
            setHtml(currentVideoRequest);
            this.playerInfo = {
              platformId: currentVideoRequest.api.id,
              videoId: currentVideoRequest.id,
              adapter: currentVideoRequest.api.createPlayer({
                width: this.width,
                height: this.height,
                autoplay: this.autoplay,
                domId: this.domId,
                element: this.container.nativeElement,
                initialVideoId: currentVideoRequest.id,
                onReady: () => {
                  this.isPlayerReady$.next(true);
                  this.isSwitchingVideo$.next(false);
                },
                onStateChange: (state) => this.playerStateObserver$.next(state),
                onMuteChange: (mute) => this.muteObserver$.next(mute),
                onVolumeChange: (volume) => this.volumeObserver$.next(volume),
                onProgressChange: (progress) => this.currentTimeObserver$.next(progress)
              }, destroy)
            };
          }
        }
      });
    //#endregion

    //#region [isPlayerReady$] => playVideo
    this.isPlayerReady$
      .pipe(filter(r => !!r), takeUntilDestroyed())
      .subscribe((ready) => {
        const videoRequest = this.videoRequest$.value;
        if (videoRequest !== null) {
          if (typeof videoRequest.id !== 'undefined') {
            this.playerInfo?.adapter.loadVideoById(videoRequest.id);
          }
        }
      });
    //#endregion

    this.volumeObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), filter((volume) => volume !== null), takeUntilDestroyed())
      .subscribe((newVolume) => {
        this.zone.run(() => this.volumeChange.emit(this._volume = newVolume));
      });
    this.muteObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((newMute) => {
        this.zone.run(() => this.muteChange.emit(this._mute = newMute));
      });
    this.playerStateObserver$
      .pipe(debounceTime(20), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((newPlayerState) => {
        this.zone.run(() => this.playerStateChange.emit(newPlayerState));
      });
    
    // combineLatest([
    //   this.currentTimeObserver$.pipe(debounceTime(20), distinctUntilChanged()),
    //   this.durationObserver$.pipe(debounceTime(20), distinctUntilChanged()),
    // ])
    //   .pipe(takeUntil(this.destroyed$))
    //   .subscribe(([currentTime, duration]) => {
    //     this.zone.run(() => this.progressChange.emit({ currentTime, duration }));
    //   });
    this.currentTimeObserver$
      .pipe(takeUntilDestroyed())
      .subscribe((progress) => {
        this.zone.run(() => this.progressChange.emit(progress));
      });
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
    return new Promise((resolve) => {
      resolve(this.playerInfo?.adapter?.getTitle() ?? null);
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

  // //#region isPip
  // private _isPip: boolean = false;
  // get isPip() {
  //   return this._isPip;
  // }
  // @Input() set isPip(value: boolean) {
  //   this._isPip = value;
  //   switch (this.playerInfo?.type) {
  //     case EPlayerType.youtube: {
  //       if (value) {
  //         throw 'YouTube does not support PiP mode';  
  //       }
  //     } break;
  //     case EPlayerType.dailymotion: {
  //       if (value) {
  //         throw 'DailyMotion does not support PiP mode';  
  //       }
  //     } break;
  //     case EPlayerType.vimeo: {
  //       if (value) {
  //         setTimeout(() => {
  //           console.log('request pip');
  //           (<Vimeo.Player>this.playerInfo?.player).requestPictureInPicture();
  //         }, 50);
  //       } else {
  //         (<Vimeo.Player>this.playerInfo.player).exitPictureInPicture();
  //       }
  //     } break;
  //   }
  // }
  @Output() public isPipChange = new EventEmitter<boolean>();
  public getIsPip() {
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube:
    //     return false
    //   case EPlayerType.dailymotion:
    //     return false;
    //   case EPlayerType.vimeo: {
    //     const player = <Vimeo.Player>this.playerInfo?.player;
    //     return player.getPictureInPicture();
    //   }
    //   default:
    //     return false;
    // }
  }
  public async setIsPip(isPip: boolean) {
    // // Vimeo pip requests must originate from a user gesture.
    // // Hence why we can't make it a bindable property.
    // // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube: {
    //     if (isPip) {
    //       throw 'YouTube does not support PiP mode';
    //     }
    //   } break;
    //   case EPlayerType.dailymotion: {
    //     if (isPip) {
    //       throw 'DailyMotion does not support PiP mode';
    //     }
    //   } break;
    //   case EPlayerType.vimeo: {
    //     if (isPip) {
    //       await (<Vimeo.Player>this.playerInfo?.player).requestPictureInPicture();
    //     } else {
    //       await (<Vimeo.Player>this.playerInfo.player).exitPictureInPicture();
    //     }
    //   } break;
    //   case EPlayerType.soundcloud: {
    //     if (isPip) {
    //       throw 'SoundCloud does not support PiP mode';
    //     }
    //   } break;
    // }
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
      this.isSwitchingVideo$.next(true);
      this.url$.next(url);
    }
  }
  //#endregion
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private static playerCounter = 1;
  domId = 'player';

  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private url$ = new BehaviorSubject<string | null>(null);
  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  private isApiReady$ = new Subject();
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private isSwitchingVideo$ = new BehaviorSubject<boolean>(false);
  private volumeObserver$ = new Subject<number>();
  private muteObserver$ = new Subject<boolean>();
  private currentTimeObserver$ = new Subject<PlayerProgress>();
  private playerStateObserver$ = new Subject<EPlayerState>();


  private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;
  private hasJustLoaded = false;

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.playerInfo?.adapter?.destroy();
  }
}