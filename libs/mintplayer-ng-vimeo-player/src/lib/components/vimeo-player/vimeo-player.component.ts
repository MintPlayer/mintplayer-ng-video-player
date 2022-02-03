import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, filter, take, takeUntil } from 'rxjs/operators';
import { VimeoApiService } from '@mintplayer/ng-vimeo-api';

@Component({
  selector: 'vimeo-player',
  templateUrl: './vimeo-player.component.html',
  styleUrls: ['./vimeo-player.component.scss']
})
export class VimeoPlayerComponent implements OnDestroy, AfterViewInit {

  constructor(
    private vimeoApiService: VimeoApiService,
    private zone: NgZone,
    private ref: ChangeDetectorRef
  ) {
    this.domId = `vimeoplayer${VimeoPlayerComponent.playerCounter++}`;
    console.log(this.domId);
    combineLatest([this.isViewInited$, this.videoId$])
      .pipe(filter(([isViewInited, videoId]) => { return (!!isViewInited) && (videoId !== null) && (videoId !== ''); }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoId]) => {
        this.vimeoApiService.loadApi();
      });

    this.vimeoApiService.vimeoApiReady$
      .pipe(filter(r => !!r), take(1), takeUntil(this.destroyed$))
      .subscribe((value) => {
        if (this.player) {
          if (this.isPlayerReady$.value) {
            this.isPlayerReady$.next(true);
          } else {
            // Do nothing. The player is still initializing.
            // The Subject will update when this.player.onReady is triggered.
          }
        } else {
          this.player = new Vimeo.Player(this.domId, {
            id: <string>this.videoId$.value,
            pip: true,
            width: this.width,
            height: this.height
          });
          this.player.ready().then(() => {
            this.isPlayerReady$.next(true);
          });
          (<any>window)['player'] = this.player;
        }
      });

    combineLatest([
      this.isPlayerReady$.pipe(filter(r => !!r)),
      this.videoId$
    ])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isPlayerReady, videoId]) => {
        if (this.player.getVideoId() === videoId) {
          setTimeout(() => {
            this.player.play();
          }, 20);
        } else if (videoId) {
          this.player.loadVideo(videoId).then(() => {
            this.player.play();
          });
        } else {
          this.player.destroy();
        }
      });
    
    this.fullscreenObserver$
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe((fullscreen) => {
        console.log('emit fullscreenchange', fullscreen);
        this.fullscreenChange.emit(fullscreen);
      });
    this.pictureInPictureObserver$
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe((pip) => {
        this.isPipChange.emit(pip);
      });
    this.volumeObserver$
      .pipe(debounceTime(20), takeUntil(this.destroyed$))
      .subscribe((volume) => {
        this._volume = volume;
        this.volumeChange.emit(volume);
      });

    const fullscreenChangeHandler = ((fullscreen: boolean) => this.fullscreenObserver$.next(fullscreen)).bind(this);
    const enterPictureInPictureHandler = (() => this.pictureInPictureObserver$.next(true)).bind(this);
    const leavePictureInPictureHandler = (() => this.pictureInPictureObserver$.next(false)).bind(this);
    const volumeChangeHandler = ((event: any) => this.volumeObserver$.next(event.volume)).bind(this);

    this.isPlayerReady$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((r) => {
        if (r) {
          this.player.on('fullscreenchange', fullscreenChangeHandler);
          this.player.on('enterpictureinpicture', enterPictureInPictureHandler);
          this.player.on('leavepictureinpicture', leavePictureInPictureHandler);
          this.player.on('volumechange', volumeChangeHandler);
        } else {
          if (this.player) {
            this.player.off('fullscreenchange', fullscreenChangeHandler);
            this.player.off('enterpictureinpicture', enterPictureInPictureHandler);
            this.player.off('leavepictureinpicture', leavePictureInPictureHandler);
            this.player.off('volumechange', volumeChangeHandler);
          }
        }
      });
  }

  @ViewChild('player') playerDiv!: ElementRef<HTMLDivElement>;
  private fullscreenObserver$ = new Subject<boolean>();
  private pictureInPictureObserver$ = new Subject<boolean>();
  private volumeObserver$ = new Subject<number>();

  //#region Width
  private _width: number = 200;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      const iframe = this.playerDiv.nativeElement.querySelector('iframe');
      if (iframe) {
        iframe.width = String(value);
      }
    }
  }
  //#endregion
  //#region Width
  private _height: number = 200;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      const iframe = this.playerDiv.nativeElement.querySelector('iframe');
      if (iframe) {
        iframe.height = String(value);
      }
    }
  }
  //#endregion
  //#region Volume
  private _oldVolume: number | null = null;
  private _volume: number | null = null;
  get volume() {
    if (this.player) {
      return this._volume;
    } else {
      return null;
    }
  }
  @Input() set volume(value: number | null) {
    if (this._oldVolume !== value) {
      this._oldVolume = value;

      if (value !== null) {
        if (this.player) {
          this.player.setVolume(value);
        }
      }
    }
  }
  @Output() volumeChange: EventEmitter<number> = new EventEmitter();
  //#endregion
  //#region Fullscreen
  private _oldFullscreen: boolean | null = null;
  get fullscreen() {
    if (this.player) {
      return this.player.getFullscreen();
    } else {
      return null;
    }
  }
  @Input() set fullscreen(value: boolean | null) {
    if (this._oldFullscreen !== value) {
      this._oldFullscreen = value;

      if (this.player) {
        if (value === true) {
          this.player.requestFullscreen();
        } else if (value === false) {
          this.player.exitFullscreen();
        }
      }
    }
  }
  @Output() fullscreenChange: EventEmitter<boolean> = new EventEmitter();
  //#endregion
  //#region IsPip
  private _oldIsPip: boolean | null = null;
  get isPip() {
    if (this.player) {
      return this.player.getPictureInPicture();
    } else {
      return null;
    }
  }
  @Input() set isPip(value: boolean | null) {
    if (this._oldIsPip !== value) {
      this._oldIsPip = value;

      if (this.player) {
        if (value === true) {
          this.player.requestPictureInPicture().then(() => {
            console.log('PIP mode active');
          }).catch((error) => {
            console.log('Failed activating PIP mode');
          });
        } else if (value === false) {
          this.player.exitPictureInPicture();
        }
      }
    }
  }
  @Output() isPipChange: EventEmitter<boolean> = new EventEmitter();
  //#endregion

  private static playerCounter: number = 1;
  domId: string = 'vimeoplayer';

  private player!: Vimeo.Player;
  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private videoId$ = new BehaviorSubject<string | null>(null);

  @Input() public set videoId(value: string | null) {
    this.videoId$.next(value);
  }

  public reinitialize() {
    this.isViewInited$.next(true);
  }

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

}