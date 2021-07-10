/// <reference path="../../../../../../node_modules/@types/youtube/index.d.ts" />
/// <reference path="../../interfaces/dailymotion.ts" />
/// <reference path="../../interfaces/vimeo.ts" />

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject, timer } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { YoutubeApiService } from '@mintplayer/ng-youtube-api';
import { DailymotionApiService } from '@mintplayer/ng-dailymotion-api';
import { VimeoApiService } from '@mintplayer/ng-vimeo-api';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { PlayerState, PlayerType } from '../../enums';
import { VideoRequest } from '../../interfaces/video-request';
import { PlatformWithRegexes } from '../../interfaces/platform-with-regexes';

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private youtubeApiService: YoutubeApiService,
    private dailymotionApiService: DailymotionApiService,
    private vimeoApiService: VimeoApiService,
    private zone: NgZone,
  ) {
    // [isViewInited$,videoRequest$] => isApiReady$
    combineLatest([this.isViewInited$, this.videoRequest$])
      .pipe(filter(([isViewInited, videoRequest]) => {
        return !!isViewInited && (videoRequest !== null);
      }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoRequest]) => {
        switch (videoRequest?.playerType) {
          case PlayerType.youtube:
            this.youtubeApiService.youtubeApiReady$
              .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
              .subscribe((ready) => {
                this.isApiReady$.next(ready);
              });
            this.youtubeApiService.loadApi();
            break;
          case PlayerType.dailymotion:
            this.dailymotionApiService.dailymotionApiReady$
              .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
              .subscribe((ready) => {
                this.isApiReady$.next(ready);
              });
            this.dailymotionApiService.loadApi();
            break;
          case PlayerType.vimeo:
            this.vimeoApiService.vimeoApiReady$
              .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
              .subscribe((ready) => {
                this.isApiReady$.next(ready);
              });
            this.vimeoApiService.loadApi();
            break;
        }
      });

    let setHtml = () => {
      this.domId = `player${VideoPlayerComponent.playerCounter++}`;
      this.container.nativeElement.innerHTML = `<div id="${this.domId}"></div>`;
    };
    let destroyCurrentPlayer = () => {
      switch (this.playerInfo?.type) {
        case PlayerType.youtube:
          (<YT.Player>this.playerInfo.player).destroy();
          break;
        case PlayerType.dailymotion:
          // (<DM.Player>this.playerInfo.player).destroy();
          break;
        case PlayerType.vimeo:
          (<Vimeo.Player>this.playerInfo.player).destroy();
          break;
      }
    }

    // [isApiReady$, videoRequest.playerType] => isSwitchingVideo$, isPlayerReady$
    this.isApiReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((value) => {
        let currentVideoRequest = this.videoRequest$.value;
        switch (currentVideoRequest?.playerType) {
          case PlayerType.youtube:
            if (this.playerInfo?.type === PlayerType.youtube) {
              // Recycle the YT.Player
              (<YT.Player>this.playerInfo.player).loadVideoById(currentVideoRequest.id);
              this.isSwitchingVideo$.next(false);
            } else {
              destroyCurrentPlayer();
              setHtml();
              this.playerInfo = {
                type: PlayerType.youtube,
                player: new YT.Player(this.domId, {
                  width: this.width,
                  height: this.height,
                  playerVars: {
                    autoplay: <any>this.autoplay,
                  },
                  events: {
                    onReady: (ev: YT.PlayerEvent) => {
                      this.isPlayerReady$.next(true);
                      this.isSwitchingVideo$.next(false);
                    },
                    onStateChange: (ev: YT.OnStateChangeEvent) => {
                      switch (ev.data) {
                        case YT.PlayerState.PLAYING:
                          this.playerStateChange.emit(PlayerState.playing);
                          break;
                        case YT.PlayerState.PAUSED:
                          this.playerStateChange.emit(PlayerState.paused);
                          break;
                        case YT.PlayerState.ENDED:
                          this.playerStateChange.emit(PlayerState.ended);
                          break;
                        case YT.PlayerState.UNSTARTED:
                          this.playerStateChange.emit(PlayerState.unstarted);
                          break;
                      }
                    }
                  }
                })
              };
            }
            break;
          case PlayerType.dailymotion:
            if (this.playerInfo?.type === PlayerType.dailymotion) {
              // Recycle the DM.Player
              (<DM.Player>this.playerInfo.player).load({ video: currentVideoRequest.id });
              this.isSwitchingVideo$.next(false);
            } else {
              destroyCurrentPlayer();
              setHtml();
              this.playerInfo = {
                type: PlayerType.dailymotion,
                player: DM.player(this.container.nativeElement.getElementsByTagName('div')[0], {
                  width: String(this.width),
                  height: String(this.height),
                  params: {
                    autoplay: this.autoplay,
                  },
                  events: {
                    apiready: () => {
                      this.isPlayerReady$.next(true);
                      this.isSwitchingVideo$.next(false);
                    },
                    play: () => {
                      this.playerStateChange.emit(PlayerState.playing);
                    },
                    pause: () => {
                      this.playerStateChange.emit(PlayerState.paused);
                    },
                    end: () => {
                      this.playerStateChange.emit(PlayerState.ended);
                    }
                  }
                })
              };
            }
            break;
          case PlayerType.vimeo:
            if (this.playerInfo?.type === PlayerType.vimeo) {
              // Recycle the Vimeo.Player
              (<Vimeo.Player>this.playerInfo.player).loadVideo(currentVideoRequest.id);
              this.isSwitchingVideo$.next(false);
            } else {
              destroyCurrentPlayer();
              setHtml();
              let videoId = currentVideoRequest.id;
              let vimeoPlayer = new Vimeo.Player(this.domId, {
                id: videoId,
                width: this.width,
                height: this.height,
                autoplay: this.autoplay,
                pip: true
              });
              this.playerInfo = {
                type: PlayerType.vimeo,
                player: vimeoPlayer
              };
              vimeoPlayer.ready().then(() => {
                this.isPlayerReady$.next(true);
                this.isSwitchingVideo$.next(false);
                this.playerStateChange.emit(PlayerState.unstarted);
              });
              vimeoPlayer.on('loaded', () => {
                this.hasJustLoaded = true;
                this.playerStateChange.emit(PlayerState.unstarted);
                setTimeout(() => {
                  let player = <Vimeo.Player>this.playerInfo?.player;
                  this.hasJustLoaded = false;
                  player.getVolume().then(vol => {
                    this.volumeChange.emit(this._volume = vol * 100);
                  });
                  if (this.autoplay) {
                    player.play();
                  }
                }, 600);
              });
              vimeoPlayer.on('play', () => {
                this.playerStateChange.emit(PlayerState.playing);
              });
              vimeoPlayer.on('pause', () => {
                if (!this.hasJustLoaded) {
                  this.playerStateChange.emit(PlayerState.paused);
                }
              });
              vimeoPlayer.on('ended', () => {
                this.playerStateChange.emit(PlayerState.ended);
              });
              vimeoPlayer.on('volumechange', (event) => {
                this.volumeChange.emit(this._volume = event.volume * 100);
              });
              vimeoPlayer.on('timeupdate', (event) => {
                this.currentTimeChange.emit(this._currentTime = event.seconds);
              });
              vimeoPlayer.on('enterpictureinpicture', (event) => {
                this.isPipChange.emit(true);
              });
              vimeoPlayer.on('leavepictureinpicture', (event) => {
                this.isPipChange.emit(false);
              });
              break;
            }
        }
      });

    // [isPlayerReady$] => playVideo
    this.isPlayerReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((ready) => {
        (<any>window).myPlayer = this.playerInfo?.player;
        let videoRequest = this.videoRequest$.value;
        if (videoRequest !== null) {
          if (typeof videoRequest.id !== 'undefined') {
            if (videoRequest.playerType === PlayerType.youtube) {
              (<YT.Player>this.playerInfo?.player).loadVideoById(videoRequest.id)
            } else if (videoRequest.playerType === PlayerType.dailymotion) {
              (<DM.Player>this.playerInfo?.player).load({ video: videoRequest.id });
            } else if (videoRequest.playerType === PlayerType.vimeo) {
              (<Vimeo.Player>this.playerInfo?.player).loadVideo(videoRequest.id);
            }
          }
        }
      });

    combineLatest([timer(0, 50), this.isPlayerReady$, this.isSwitchingVideo$])
      .pipe(filter(([time, isPlayerReady, isSwitchingVideo]) => {
        return isPlayerReady && !isSwitchingVideo;
      }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async ([time, isPlayerReady, isSwitchingVideo]) => {
        let newCurrentTime: number | null = null;
        let newVolume: number | null = null;
        let newIsMuted: boolean = false;

        switch (this.playerInfo?.type) {
          case PlayerType.youtube: {
            let player = <YT.Player>this.playerInfo.player;
            if (player.getCurrentTime !== undefined) {
              newCurrentTime = player.getCurrentTime();
            }
            if (player.getVolume !== undefined) {
              newVolume = player.getVolume();
            }
            if (player.isMuted !== undefined) {
              newIsMuted = player.isMuted();
            }
          } break;
          case PlayerType.dailymotion: {
            let player = <DM.Player>this.playerInfo.player;
            if (player.currentTime !== undefined) {
              newCurrentTime = player.currentTime;
            }
            if (player.volume !== undefined) {
              newVolume = player.volume * 100;
            }
            if (player.muted !== undefined) {
              newIsMuted = player.muted;
            }
          } break;
          case PlayerType.vimeo: {
            let player = <Vimeo.Player>this.playerInfo.player;
            if (player.getMuted !== undefined) {
              await player.getMuted().then((m) => {
                newIsMuted = m;
              });
            }
          } break;
        }

        if ((newCurrentTime !== null) && (this._currentTime !== newCurrentTime)) {
          this.currentTimeChange.emit(this._currentTime = newCurrentTime);
        }
        if ((newVolume !== null) && (this._volume !== newVolume)) {
          this.volumeChange.emit(this._volume = newVolume);
        }
        if (this._mute != newIsMuted) {
          this.muteChange.emit(this._mute = newIsMuted);
        }
      });
  }

  //#region width
  private _width: number = 600;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    if (!!this.playerInfo && !!this.playerInfo.player) {
      switch (this.playerInfo.type) {
        case PlayerType.youtube:
          (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
          break;
        case PlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).width = this._width;
          break;
        case PlayerType.vimeo:
          let iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
          if (!!iframe) {
            iframe.width = String(value);
          }
          break;
      }
    }
  }
  //#endregion
  //#region height
  private _height: number = 450;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    if (!!this.playerInfo && !!this.playerInfo.player) {
      switch (this.playerInfo.type) {
        case PlayerType.youtube:
          (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
          break;
        case PlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).height = this._height;
          break;
        case PlayerType.vimeo:
          let iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
          if (!!iframe) {
            iframe.height = String(value);
          }
          break;
      }
    }
  }
  //#endregion
  //#region currentTime
  private _currentTime: number = 0;
  get currentTime() {
    return this._currentTime;
  }
  @Output() public currentTimeChange = new EventEmitter<number>();
  //#endregion
  //#region seek
  public seek(timestamp: number) {
    if (this._currentTime !== timestamp) {
      this._currentTime = timestamp;
      switch (this.playerInfo?.type) {
        case PlayerType.youtube:
          (<YT.Player>this.playerInfo.player).seekTo(timestamp, true);
          break;
        case PlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).seek(timestamp);
          break;
        case PlayerType.vimeo:
          (<Vimeo.Player>this.playerInfo.player).setCurrentTime(timestamp);
          break;
      }
    }
  }
  //#endregion
  //#region playerState
  public async getplayerState() {
    switch (this.playerInfo?.type) {
      case PlayerType.youtube: {

        let player = <YT.Player>this.playerInfo.player;
        switch (player.getPlayerState()) {
          case YT.PlayerState.PLAYING:
            return PlayerState.playing;
          case YT.PlayerState.PAUSED:
            return PlayerState.paused;
          case YT.PlayerState.ENDED:
            return PlayerState.ended;
          default:
            return PlayerState.unstarted;
        }

      }
      case PlayerType.dailymotion: {

        let player = <DM.Player>this.playerInfo.player;
        if (!!player.ended) {
          return PlayerState.ended;
        } else if (!!player.paused) {
          return PlayerState.paused;
        } else {
          return PlayerState.playing;
        }

      }
      case PlayerType.vimeo: {

        let player = <Vimeo.Player>this.playerInfo.player;
        if (await player.getEnded()) {
          return PlayerState.ended;
        } else if (await player.getPaused()) {
          return PlayerState.paused;
        } else {
          return PlayerState.playing;
        }

      }
      default: {

        throw `Player type ${this.playerInfo?.type} not supported`;

      }
    }
  }
  @Input() set playerState(value: PlayerState) {
    switch (this.playerInfo?.type) {
      case PlayerType.youtube: {

        let player = <YT.Player>this.playerInfo.player;
        switch (value) {
          case PlayerState.playing:
            player.playVideo();
            break;
          case PlayerState.paused:
            player.pauseVideo();
            break;
          case PlayerState.ended:
            player.stopVideo();
            break;
          case PlayerState.unstarted:
            break;
        }

      } break;
      case PlayerType.dailymotion: {

        let player = <DM.Player>this.playerInfo.player;
        switch (value) {
          case PlayerState.playing:
            player.play();
            break;
          case PlayerState.paused:
            player.pause();
            break;
          case PlayerState.ended:
          case PlayerState.unstarted:
            break;
        }

      } break;
      case PlayerType.vimeo: {

        let player = <Vimeo.Player>this.playerInfo.player;
        switch (value) {
          case PlayerState.playing:
            player.play();
            break;
          case PlayerState.paused:
            player.pause();
            break;
          case PlayerState.ended:
          case PlayerState.unstarted:
            break;
        }

      } break;
    }
  }
  @Output() public playerStateChange = new EventEmitter<PlayerState>();
  //#endregion
  //#region volume
  private _volume: number = 0;
  get volume() {
    return this._volume;
  }
  @Input() set volume(value: number) {
    this._volume = value;
    switch (this.playerInfo?.type) {
      case PlayerType.youtube: {
        (<YT.Player>this.playerInfo.player).setVolume(value);
      } break;
      case PlayerType.dailymotion: {
        (<DM.Player>this.playerInfo.player).setVolume(value / 100);
      } break;
      case PlayerType.vimeo: {
        (<Vimeo.Player>this.playerInfo.player).setVolume(value / 100);
      } break;
    }
  }
  @Output() public volumeChange = new EventEmitter<number>();
  //#endregion
  //#region mute
  private _mute: boolean = false;
  get mute() {
    return this._mute;
  }
  @Input() set mute(value: boolean) {
    this._mute = value;
    switch (this.playerInfo?.type) {
      case PlayerType.youtube: {
        if (value) {
          (<YT.Player>this.playerInfo.player).mute();
        } else {
          (<YT.Player>this.playerInfo.player).unMute();
        }
      } break;
      case PlayerType.dailymotion: {
        (<DM.Player>this.playerInfo.player).muted = value;
      } break;
      case PlayerType.vimeo: {
        (<Vimeo.Player>this.playerInfo.player).setMuted(value);
      } break;
    }
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
  //     case PlayerType.youtube: {
  //       if (value) {
  //         throw 'YouTube does not support PiP mode';  
  //       }
  //     } break;
  //     case PlayerType.dailymotion: {
  //       if (value) {
  //         throw 'DailyMotion does not support PiP mode';  
  //       }
  //     } break;
  //     case PlayerType.vimeo: {
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
    switch (this.playerInfo?.type) {
      case PlayerType.youtube:
        return false
      case PlayerType.dailymotion:
        return false;
      case PlayerType.vimeo: {
        let player = <Vimeo.Player>this.playerInfo?.player;
        return player.getPictureInPicture();
      }
      default:
        return false;
    }
  }
  public async setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why we can't make it a bindable property.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    switch (this.playerInfo?.type) {
      case PlayerType.youtube: {
        if (isPip) {
          throw 'YouTube does not support PiP mode';  
        }
      } break;
      case PlayerType.dailymotion: {
        if (isPip) {
          throw 'DailyMotion does not support PiP mode';  
        }
      } break;
      case PlayerType.vimeo: {
        if (isPip) {
          await (<Vimeo.Player>this.playerInfo?.player).requestPictureInPicture();
        } else {
          await (<Vimeo.Player>this.playerInfo.player).exitPictureInPicture();
        }
      } break;
    }
  }
  // //#endregion
  @Input() public autoplay: boolean = true;
  //#region url
  @Input() public set url(value: string) {
    this.isSwitchingVideo$.next(true);

    const platforms: PlatformWithRegexes[] = [{
      platform: PlayerType.youtube,
      regexes: [
        // new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>.+)/, 'g'),
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>.+)$/, 'g'),
      ]
    }, {
      platform: PlayerType.dailymotion,
      regexes: [
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}dailymotion\.com\/video\/(?<id>[0-9A-Za-z]+)$/, 'g'),
      ]
    }, {
      platform: PlayerType.vimeo,
      regexes: [
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}vimeo\.com\/(?<id>[0-9]+)$/, 'g'),
      ]
    }];

    let platformIds = platforms.map(p => {
      let matches = p.regexes.map(r => r.exec(value)).filter(r => r !== null);
      if (matches.length === 0) {
        return null;
      }

      if (matches[0] === null) {
        return null;
      } else if (matches[0].groups == null) {
        return null;
      }

      return {
        platform: p.platform,
        id: matches[0].groups.id
      };
    }).filter(p => (p !== null));

    if (platformIds.length === 0) {
      throw `No player found for url ${value}`;
    }

    if (!!platformIds[0]) {
      this.videoRequest$.next({ playerType: platformIds[0].platform, id: platformIds[0].id });
    }
  }
  //#endregion
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private static playerCounter: number = 1;
  domId: string = 'player';

  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  private isApiReady$ = new Subject();
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private isSwitchingVideo$ = new BehaviorSubject<boolean>(false);

  private playerInfo: { type: PlayerType, player: YT.Player | DM.Player | Vimeo.Player } | null = null;
  private hasJustLoaded: boolean = false;

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
