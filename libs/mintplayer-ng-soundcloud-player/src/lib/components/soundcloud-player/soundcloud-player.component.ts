import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { SoundcloudApiService } from '@mintplayer/ng-soundcloud-api';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { PlayerState } from '../../enums/player-state';
import { PlayProgressEvent } from '../../events/play-progress.event';

@Component({
  selector: 'soundcloud-player',
  templateUrl: './soundcloud-player.component.html',
  styleUrls: ['./soundcloud-player.component.scss']
})
export class SoundcloudPlayerComponent implements AfterViewInit, OnDestroy {

  constructor(
    private soundcloudApiService: SoundcloudApiService,
    private zone: NgZone
  ) {
    this.domId = `player${SoundcloudPlayerComponent.playerCounter++}`;

    combineLatest([this.isViewInited$, this.videoUrl$])
      .pipe(filter(([isViewInited, videoId]) => { return (!!isViewInited) && (videoId !== null) && (videoId !== ''); }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoId]) => {
        this.soundcloudApiService.loadApi();
      });

    combineLatest([
      this.soundcloudApiService.apiReady$,
      this.videoUrl$
    ])
      .pipe(filter(([soundcloudApiReady, videoUrl]) => { return (!!soundcloudApiReady) && (videoUrl !== null) && (videoUrl !== ''); }))
      .pipe(take(1), takeUntil(this.destroyed$))
      .subscribe(([ready, videoUrl]) => {
        if ((this.player === null) && (videoUrl !== null)) {
          this.wrapper.nativeElement.innerHTML = `<iframe width="${this._width}" height="${this._height}" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;" allow="autoplay"></iframe>`;
          const iframe = this.wrapper.nativeElement.querySelector('iframe');
          this.player = (<any>window).player = SC.Widget(iframe);

          this.player.bind(SC.Widget.Events.READY, () => {
            this.isPlayerReady$.next(true);
          });

          this.isPlayerReady$.pipe(take(1), takeUntil(this.destroyed$)).subscribe(() => {
            if (this.player) {
              this.player.bind(SC.Widget.Events.PLAY, () => {
                this.zone.run(() => {
                  this._playerstate = PlayerState.PLAYING;
                  this.playerStateChange.emit(PlayerState.PLAYING);
                });
              });
              this.player.bind(SC.Widget.Events.PAUSE, () => {
                this.zone.run(() => {
                  this._playerstate = PlayerState.PAUSED;
                  this.playerStateChange.emit(PlayerState.PAUSED);
                });
              });
              this.player.bind(SC.Widget.Events.FINISH, () => {
                this.zone.run(() => {
                  this._playerstate = PlayerState.ENDED;
                  this.playerStateChange.emit(PlayerState.ENDED);
                });
              });
              this.player.bind(SC.Widget.Events.PLAY_PROGRESS, (event: PlayProgressEvent) => {
                if (this.player !== null) {
                  this.player.getDuration((duration) => {
                    this.zone.run(() => {
                      this.progressChange.emit({ currentTime: event.currentPosition / 1000, duration: duration / 1000 });
                    });
                  });
                }
              });
            }
          });
        } else if (this.isPlayerReady$.value) {
          this.isPlayerReady$.next(true);
        }
      });

    combineLatest([
      this.isPlayerReady$.pipe(filter(r => !!r)),
      this.videoUrl$.pipe(filter(videoUrl => (videoUrl !== null) && (videoUrl !== '')))
    ])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isPlayerReady, videoUrl]) => {
        if ((videoUrl !== null) && (this.player !== null)) {
          this.player.load(videoUrl, {
            auto_play: this.autoplay
          });
        }
      });
  }

  private static playerCounter = 1;
  domId = 'player';

  @Output() public playerStateChange: EventEmitter<PlayerState> = new EventEmitter();
  @Output() public progressChange: EventEmitter<PlayerProgress> = new EventEmitter();

  private player: SC.Widget.Player | null = null;
  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private videoUrl$ = new BehaviorSubject<string | null>(null);

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

  @ViewChild('wrapper') wrapper!: ElementRef<HTMLIFrameElement>;

  // private updateSize() {
  //   if ((this.player !== null) && (this.player !== undefined)) {
  //     this.player.width = this._width;
  //     this.player.height = this._height;
  //   }
  // }

  public playVideo(soundCloudId: string) {
    this.videoUrl$.next(soundCloudId);
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

  public seek(timestamp: number) {
    if (this.player !== null) {
      this.player.seekTo(timestamp * 1000);
    }
  }

  //#region Width
  private _width = 200;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      const iframe = this.wrapper.nativeElement.querySelector('iframe');
      if (iframe) {
        iframe.width = String(value);
      }
    }
  }
  //#endregion
  //#region Height
  private _height = 200;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      const iframe = this.wrapper.nativeElement.querySelector('iframe');
      if (iframe) {
        iframe.height = String(value);
      }
    }
  }
  //#endregion
  //#region Autoplay
  @Input() public autoplay = true;
  //#endregion
  //#region State
  private _playerstate = PlayerState.UNSTARTED;
  public get playerState() {
    return this._playerstate;
  }
  //#endregion
  // //#region Position
  // public get position() {
  //   if (this.player !== null) {
  //     return this.player.currentTime;
  //   } else {
  //     return null;
  //   }
  // }
  // public set position(value: number | null) {
  //   if ((this.player !== null) && (value !== null)) {
  //     this.player.seek(value);
  //   }
  // }
  // //#endregion

  // get progress() {
  //   if (this.player !== null) {
  //     return this.player.currentTime / this.player.duration;
  //   } else {
  //     return 0;
  //   }
  // }

}