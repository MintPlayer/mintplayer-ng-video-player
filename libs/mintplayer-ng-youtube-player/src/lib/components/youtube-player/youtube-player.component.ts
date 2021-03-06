import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { YoutubeApiService } from '@mintplayer/ng-youtube-api';
import { BehaviorSubject, combineLatest, filter, Subject, take, takeUntil } from 'rxjs';
import { YtVideoRequest } from '../../interfaces/yt-video-request';

@Component({
  selector: 'youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss']
})
export class YoutubePlayerComponent implements AfterViewInit, OnDestroy {
  constructor(private youtubeApiService: YoutubeApiService, private zone: NgZone) {
    this.domId = `player${YoutubePlayerComponent.playerCounter++}`;

    // Do the following after ngAfterViewInit completes
    combineLatest([this.isViewInited$, this.videoRequest$])
      .pipe(filter(([isViewInited, videoRequest]) => (!!isViewInited) && (videoRequest !== null)))
      .pipe(take(1), takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoRequest]) => {
        // Go load the Youtube API
        this.youtubeApiService.loadApi();
      });
      
    // Do the following after the Youtube API is loaded
    this.youtubeApiService.youtubeApiReady$
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
          // Go create the YT.Player
          this.player = new YT.Player(this.domId, {
            width: this.width,
            height: this.height,
            host: 'https://www.youtube.com',
            playerVars: {
              autoplay: <any>this.autoplay,
              fs: 1
            },
            events: {
              onReady: (ev: YT.PlayerEvent) => {
                // Do the following after the YT.Player is created
                this.isPlayerReady$.next(true);
              },
              onStateChange: (state: { data: YT.PlayerState }) => {
                this.stateChange.emit(state.data);
                switch (state.data) {
                  case YT.PlayerState.PLAYING:
                    this.progressTimer = global.setInterval(() => {
                      this.progressChange.emit({
                        currentTime: this.player.getCurrentTime(),
                        duration: this.player.getDuration()
                      });
                    }, 100);
                    break;
                  default:
                    if (this.progressTimer) {
                      global.clearInterval(this.progressTimer);
                    }
                    break;
                }
              },
            }
          });
        }
      });
      
    // Do the following after the YT.Player is ready
    this.isPlayerReady$
      .pipe(filter(r => !!r), take(1), takeUntil(this.destroyed$))
      .subscribe((value) => {

        // Go keep track of the volume, mute, ...
        let oldVolume: number;
        let oldMuted: boolean;
        this.alwaysRunningTimer = global.setInterval(() => {
          try {
            const currentVolume = this.player.getVolume();
            if (oldVolume !== currentVolume) {
              oldVolume = currentVolume;
              this.zone.run(() => {
                this.volumeChange.emit(currentVolume);
              });
            }
          } catch (ex) {
            console.log('Volume timer exception', ex);
          }

          try {
            const currentMuted = this.player.isMuted();
            if (oldMuted !== currentMuted) {
              oldMuted = currentMuted;
              this.zone.run(() => {
                this.muteChange.emit(currentMuted);
              });
            }
          } catch (ex) {
            console.log('Mute timer exception', ex);
          }
        }, 250);
      });
    
    combineLatest([this.isPlayerReady$.pipe(filter(r => !!r)), this.videoRequest$])
      .pipe(filter(([isPlayerReady, videoRequest]) => !!isPlayerReady && (videoRequest !== null)))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isPlayerReady, videoRequest]) => {
        switch (videoRequest?.action) {
          case 'playVideoById':
            this.player.loadVideoById(videoRequest.parameter);
            break;
          case 'cueVideoById':
            this.player.cueVideoById(videoRequest.parameter);
            break;
        }
      })

    this.destroyed$
      .pipe(filter(d => !!d), take(1))
      .subscribe((d) => {
        if (this.alwaysRunningTimer) {
          global.clearInterval(this.alwaysRunningTimer);
        }
        if (this.progressTimer) {
          global.clearInterval(this.progressTimer);
        }
      });
  }


  private static playerCounter = 1;
  domId = 'player';
 

  //#region width
  private _width = 200;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      this.player.setSize(this._width, this._height);
    }
  }
  //#endregion
  //#region height
  private _height = 150;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    if ((this.player !== null) && (this.player !== undefined)) {
      this.player.setSize(this._width, this._height);
    }
  }
  //#endregion
  //#region autoplay
  private _autoplay = true;
  get autoplay() {
    return this._autoplay;
  }
  @Input() set autoplay(value: boolean) {
    this._autoplay = value;
  }
  //#endregion
  //#region mute
  private _oldMuted = false;
  get mute() {
    return this.player.isMuted();
  }
  @Input() set mute(value: boolean) {
    if (this._oldMuted !== value) {
      this._oldMuted = value;
      if (value === true) {
        this.player.mute();
      } else {
        this.player.unMute();
      }
      this.muteChange.emit(value);
    }
  }
  @Output() muteChange: EventEmitter<boolean> = new EventEmitter();
  //#endregion
  //#region volume
  private _oldVolume = 50;
  get volume() {
    try {
      return this.player.getVolume();
    } catch (ex) {
      return 50;
    }
  }
  @Input() set volume(value: number) {
    if (this._oldVolume !== value) {
      this._oldVolume = value;
      if (typeof this.player !== 'undefined') {
        this.player.setVolume(value);
      }
      this.volumeChange.emit(value);
    }
  }
  @Output() volumeChange: EventEmitter<number> = new EventEmitter();
  //#endregion

  @Output() stateChange = new EventEmitter<YT.PlayerState>();

  private progressTimer!: NodeJS.Timeout | null;
  private alwaysRunningTimer!: NodeJS.Timeout | null;
  private player!: YT.Player;
  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private videoRequest$ = new BehaviorSubject<YtVideoRequest | null>(null);

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  public playVideoById(youtubeId: string) {
    this.videoRequest$.next({ action: 'playVideoById', parameter: youtubeId });
  }
  
  public cueVideoById(youtubeId: string) {
    this.videoRequest$.next({ action: 'cueVideoById', parameter: youtubeId });
  }

  public play() {
    this.player.playVideo();
  }

  public pause() {
    this.player.pauseVideo();
  }

  public stop() {
    this.player.stopVideo();
  }

  public previous() {
    this.player.previousVideo();
  }

  public next() {
    this.player.nextVideo();
  }

  public reinitialize() {
    this.isViewInited$.next(true);
  }

  //#region Shuffle - Not used
  private _shuffle = false;
  public get shuffle() {
    return this._shuffle;
  }
  public set shuffle(value: boolean) {
    this.player.setShuffle(this._shuffle = value);
  }
  //#endregion
  //#region CurrentTime
  public get currentTime() {
    try {
      return this.player.getCurrentTime();
    } catch (ex) {
      return 0;
    }
  }
  @Input() public set currentTime(value: number) {
    if (value !== null) {
      this.player.seekTo(value, true);
    }    
  }
  @Output() currentTimeChange = new EventEmitter<number>();
  //#endregion
  //#region Progress
  get progress() {
    return <PlayerProgress>{
      currentTime: this.player.getCurrentTime(),
      duration: this.player.getDuration()
    };
  }
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  //#endregion

}
