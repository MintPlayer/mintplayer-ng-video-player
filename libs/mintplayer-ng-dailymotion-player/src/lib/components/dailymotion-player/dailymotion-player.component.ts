import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { DailymotionApiService } from '@mintplayer/ng-dailymotion-api';

@Component({
  selector: 'dailymotion-player',
  templateUrl: './dailymotion-player.component.html',
  styleUrls: ['./dailymotion-player.component.scss']
})
export class DailymotionPlayerComponent implements OnDestroy, AfterViewInit {

  constructor(private dailymotionApiService: DailymotionApiService) {
    combineLatest([this.isViewInited$, this.videoId$])
      .pipe(filter(([isViewInited, videoId]) => { return (!!isViewInited) && (videoId !== null) && (videoId !== ''); }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoId]) => {
        console.log('load api');
        this.dailymotionApiService.loadApi();
      });
    
    this.dailymotionApiService.apiReady$
      .pipe(filter(r => !!r), take(1), takeUntil(this.destroyed$))
      .subscribe((value) => {
        console.log('api loaded', this.player);
        if (this.player === null) {
          console.log('create player');
          this.player = DM.player(this.element.nativeElement, {
            width: String(this._width),
            height: String(this._height),
            params: {
              'autoplay': this._autoplay,
              'queue-autoplay-next': false,
              'queue-enable': false,
              'mute': false
            },
            events: {
              apiready: () => {
                console.log('player ready', this.player);
                this.isPlayerReady$.next(true);
              },
              play: () => {
                this.stateChange.emit(DM.PlayerState.PLAYING);
                if (this.progressTimer === null) {
                  const handler = () => {
                    if (this.player !== null) {
                      this.progressChange.emit({
                        currentTime: this.player.currentTime,
                        duration: this.player.duration
                      });
                    }
                  };
                  if (typeof global === 'undefined') {
                    this.progressTimer = setInterval(handler, 100);
                  } else {
                    this.progressTimer = global.setInterval(handler, 100);
                  }
                }
              },
              pause: () => {
                this.stateChange.emit(DM.PlayerState.PAUSED);
                if (this.progressTimer) {
                  if (typeof global === 'undefined') {
                    clearInterval(this.progressTimer);
                  } else {
                    global.clearInterval(this.progressTimer);
                  }
                  this.progressTimer = null;
                }
              },
              end: () => {
                this.stateChange.emit(DM.PlayerState.ENDED);
                if (this.progressTimer) {
                  if (typeof global === 'undefined') {
                    clearInterval(this.progressTimer);
                  } else {
                    global.clearInterval(this.progressTimer);
                  }
                  this.progressTimer = null;
                }
              }
            }
          });
          this.player.onvolumechange = () => {
            if (this.player !== null) {
              this.volumeChange.emit(this.player.volume);
            }
          };
        } else if (this.isPlayerReady$.value) {
          console.log('player ready');
          this.isPlayerReady$.next(true);
        }
      });
    
    combineLatest([
      this.isPlayerReady$.pipe(filter(r => !!r)),
      this.videoId$.pipe(filter(videoId => (videoId !== null) && (videoId !== '')))
    ])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isPlayerReady, videoId]) => {
        if ((videoId !== null) && (this.player !== null)) {
          this.player.load({ video: videoId });
        }
      });
  }

  //#region width
  private _width: number = 400;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    this.updateSize();
  }
  //#endregion
  //#region height
  private _height: number = 300;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    this.updateSize();
  }
  //#endregion
  //#region autoplay
  private _autoplay: boolean = true;
  get autoplay() {
    return this._autoplay;
  }
  @Input() set autoplay(value: boolean) {
    this._autoplay = value;
  }
  //#endregion
  //#region mute
  get mute() {
    if (this.player !== null) {
      return this.player.muted;
    } else {
      return null;
    }
  }
  set mute(value: boolean | null) {
    if ((this.player !== null) && (value !== null)) {
      this.player.setMuted(value);
    }
  }
  //#endregion
  //#region Volume
  get volume() {
    if (this.player !== null) {
      return this.player.volume;
    } else {
      return null;
    }
  }
  set volume(value: number | null) {
    if ((this.player !== null) && (value !== null)) {
      this.player.setVolume(value);
    }
  }
  @Output() volumeChange: EventEmitter<number> = new EventEmitter();
  //#endregion

  @Output() stateChange: EventEmitter<DM.PlayerState> = new EventEmitter();

  private progressTimer!: NodeJS.Timer | null;
  private player: DM.Player | null = null;
  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private videoId$ = new BehaviorSubject<string | null>(null);

  @ViewChild('player') element!: ElementRef<HTMLDivElement>;

  @Input() public set videoId(value: string | null) {
    this.videoId$.next(value);
  }

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  public reinitialize() {
    this.isViewInited$.next(true);
  }

  private updateSize() {
    if ((this.player !== null) && (this.player !== undefined)) {
      this.player.width = this._width;
      this.player.height = this._height;
    }
  }

  public playVideo(dailyMotionId: string) {
    this.videoId$.next(dailyMotionId);
  }

  public play() {
    if (this.player !== null) {
      this.player.play();
    }
  }

  public pause() {
    if (this.player !== null) {
      this.player.pause();
    }
  }

  //#region Position
  public get position() {
    if (this.player !== null) {
      return this.player.currentTime;
    } else {
      return null;
    }
  }
  public set position(value: number | null) {
    if ((this.player !== null) && (value !== null)) {
      this.player.seek(value);
    }
  }
  //#endregion

  get progress() {
    if (this.player !== null) {
      return this.player.currentTime / this.player.duration;
    } else {
      return 0;
    }
  }

  @Output() public progressChange = new EventEmitter<PlayerProgress>();

}