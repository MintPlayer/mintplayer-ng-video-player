import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { BehaviorSubject, combineLatest, Subject, timer } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { YoutubeApiService } from '@mintplayer/ng-youtube-api';
import { DailymotionApiService } from '@mintplayer/ng-dailymotion-api';
import { VimeoApiService } from '@mintplayer/ng-vimeo-api';
import { SoundcloudApiService, PlayProgressEvent } from '@mintplayer/ng-soundcloud-api';
import { EPlayerState, EPlayerType } from '../../enums';
import { VideoRequest } from '../../interfaces/video-request';
import { PlayerTypeFinderService } from '../../services/player-type-finder/player-type-finder.service';

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  constructor(
    private youtubeApiService: YoutubeApiService,
    private dailymotionApiService: DailymotionApiService,
    private vimeoApiService: VimeoApiService,
    private soundcloudApiService: SoundcloudApiService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private playerTypeFinder: PlayerTypeFinderService,
  ) {
    // [isViewInited$,videoRequest$] => isApiReady$
    combineLatest([this.isViewInited$, this.videoRequest$])
      .pipe(filter(([isViewInited, videoRequest]) => {
        return !!isViewInited;
      }))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([isViewInited, videoRequest]) => {
        console.log('Received videoRequest');
        if (videoRequest === null) {
          this.destroyCurrentPlayer();
          this.playerInfo = null;
          this.container.nativeElement.innerHTML = '';
        } else {
          switch (videoRequest.playerType) {
            case EPlayerType.youtube:
              this.youtubeApiService.youtubeApiReady$
                .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
                .subscribe((ready) => {
                  this.isApiReady$.next(ready);
                });
              this.youtubeApiService.loadApi();
              break;
            case EPlayerType.dailymotion:
              this.dailymotionApiService.dailymotionApiReady$
                .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
                .subscribe((ready) => {
                  this.isApiReady$.next(ready);
                });
              this.dailymotionApiService.loadApi();
              break;
            case EPlayerType.vimeo:
              this.vimeoApiService.vimeoApiReady$
                .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
                .subscribe((ready) => {
                  this.isApiReady$.next(ready);
                });
              this.vimeoApiService.loadApi();
              break;
            case EPlayerType.soundcloud:
              this.soundcloudApiService.soundcloudApiReady$
                .pipe(filter(ready => !!ready), take(1), takeUntil(this.destroyed$))
                .subscribe((ready) => {
                  this.isApiReady$.next(ready);
                });
              this.soundcloudApiService.loadApi();
              break;
          }
        }
      });

    const setHtml = (playertype: EPlayerType) => {
      this.domId = `player${VideoPlayerComponent.playerCounter++}`;
      if (playertype === EPlayerType.soundcloud) {
        this.container.nativeElement.innerHTML = `<iframe id="${this.domId}" width="${this._width}" height="${this._height}" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;show_teaser=false&amp;" allow="autoplay"></iframe>`;
      } else {
        this.container.nativeElement.innerHTML = `<div id="${this.domId}"></div>`;
      }
    };
    
    // [isApiReady$, videoRequest.playerType] => isSwitchingVideo$, isPlayerReady$
    this.isApiReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((value) => {
        const currentVideoRequest = this.videoRequest$.value;
        switch (currentVideoRequest?.playerType) {
          case EPlayerType.youtube:
            if (this.playerInfo?.type === EPlayerType.youtube) {
              // Recycle the YT.Player
              (<YT.Player>this.playerInfo.player).loadVideoById(currentVideoRequest.id);
              this.isSwitchingVideo$.next(false);
            } else {
              this.destroyCurrentPlayer();
              setHtml(EPlayerType.youtube);
              this.playerInfo = {
                type: EPlayerType.youtube,
                player: new YT.Player(this.domId, {
                  width: this.width,
                  height: this.height,
                  playerVars: {
                    fs: 1,
                    autoplay: <any>this.autoplay,
                  },
                  events: {
                    onReady: (ev: YT.PlayerEvent) => {
                      this.isPlayerReady$.next(true);
                      this.isSwitchingVideo$.next(false);
                    },
                    onStateChange: (ev: YT.OnStateChangeEvent) => {
                      this.zone.run(() => {
                        switch (ev.data) {
                          case YT.PlayerState.PLAYING:
                            this.playerStateChange.emit(EPlayerState.playing);
                            break;
                          case YT.PlayerState.PAUSED:
                            this.playerStateChange.emit(EPlayerState.paused);
                            break;
                          case YT.PlayerState.ENDED:
                            this.playerStateChange.emit(EPlayerState.ended);
                            break;
                          case YT.PlayerState.UNSTARTED:
                            this.playerStateChange.emit(EPlayerState.unstarted);
                            break;
                        }
                      });
                    }
                  }
                })
              };
            }
            break;
          case EPlayerType.dailymotion:
            if (this.playerInfo?.type === EPlayerType.dailymotion) {
              // Recycle the DM.Player
              (<DM.Player>this.playerInfo.player).load({ video: currentVideoRequest.id });
              this.isSwitchingVideo$.next(false);
            } else {
              this.destroyCurrentPlayer();
              setHtml(EPlayerType.dailymotion);
              this.playerInfo = {
                type: EPlayerType.dailymotion,
                player: DM.player(this.container.nativeElement.getElementsByTagName('div')[0], {
                  width: String(this.width),
                  height: String(this.height),
                  params: {
                    autoplay: this.autoplay,
                    "queue-enable": false,
                  },
                  events: {
                    apiready: () => {
                      this.isPlayerReady$.next(true);
                      this.isSwitchingVideo$.next(false);
                    },
                    play: () => {
                      this.zone.run(() => {
                        this.playerStateChange.emit(EPlayerState.playing);
                      });
                    },
                    pause: () => {
                      this.zone.run(() => {
                        this.playerStateChange.emit(EPlayerState.paused);
                      });
                    },
                    end: () => {
                      this.zone.run(() => {
                        this.playerStateChange.emit(EPlayerState.ended);
                      });
                    }
                  }
                })
              };
            }
            break;
          case EPlayerType.vimeo:
            if (this.playerInfo?.type === EPlayerType.vimeo) {
              // Recycle the Vimeo.Player
              (<Vimeo.Player>this.playerInfo.player).loadVideo(currentVideoRequest.id).then((v) => {
                this.isSwitchingVideo$.next(false);
              });
            } else {
              this.destroyCurrentPlayer();
              setHtml(EPlayerType.vimeo);
              const videoId = currentVideoRequest.id;
              const vimeoPlayer = new Vimeo.Player(this.domId, {
                id: videoId,
                width: this.width,
                height: this.height,
                autoplay: this.autoplay,
                pip: true
              });
              this.playerInfo = {
                type: EPlayerType.vimeo,
                player: vimeoPlayer
              };
              vimeoPlayer.ready().then(() => {
                console.log('the vimeo player is ready');
                this.isPlayerReady$.next(true);
                this.isSwitchingVideo$.next(false);
                this.zone.run(() => {
                  this.playerStateChange.emit(EPlayerState.unstarted);
                });
              });
              vimeoPlayer.on('loaded', () => {
                this.hasJustLoaded = true;
                console.log('the vimeo player has loaded');
                this.zone.run(() => {
                  this.playerStateChange.emit(EPlayerState.unstarted);
                });
                setTimeout(() => {
                  const player = <Vimeo.Player>this.playerInfo?.player;
                  this.hasJustLoaded = false;
                  player.getVolume().then(vol => {
                    this.zone.run(() => {
                      this.volumeChange.emit(this._volume = vol * 100);
                    });
                  });
                  if (this.autoplay) {
                    player.play();
                  }
                }, 600);
              });
              vimeoPlayer.on('play', () => {
                this.zone.run(() => {
                  this.playerStateChange.emit(EPlayerState.playing);
                });
              });
              vimeoPlayer.on('pause', () => {
                if (!this.hasJustLoaded) {
                  this.zone.run(() => {
                    this.playerStateChange.emit(EPlayerState.paused);
                  });
                }
              });
              vimeoPlayer.on('ended', () => {
                this.zone.run(() => {
                  this.playerStateChange.emit(EPlayerState.ended);
                });
              });
              vimeoPlayer.on('volumechange', (event) => {
                this.zone.run(() => {
                  this.volumeChange.emit(this._volume = event.volume * 100);
                });
              });
              vimeoPlayer.on('timeupdate', (event) => {
                vimeoPlayer.getDuration().then((d) => {
                  this.zone.run(() => {
                    this.progressChange.emit({
                      currentTime: this._currentTime = event.seconds,
                      duration: d
                    });
                  });
                });
              });
              vimeoPlayer.on('enterpictureinpicture', (event) => {
                this.zone.run(() => {
                  this.isPipChange.emit(true);
                });
              });
              vimeoPlayer.on('leavepictureinpicture', (event) => {
                this.zone.run(() => {
                  this.isPipChange.emit(false);
                });
              });
            }
            break;
          case EPlayerType.soundcloud:
            if (this.playerInfo?.type === EPlayerType.soundcloud) {
              (<SC.Widget.Player>this.playerInfo.player).load(currentVideoRequest.id, {
                auto_play: true,
                callback: () => {
                  this.isSwitchingVideo$.next(false);
                }
              });
            } else {
              this.destroyCurrentPlayer();
              setHtml(EPlayerType.soundcloud);
              const soundcloudPlayer = SC.Widget(<HTMLIFrameElement>document.getElementById(this.domId));
              this.playerInfo = {
                type: EPlayerType.soundcloud,
                player: soundcloudPlayer
              };
              soundcloudPlayer.bind(SC.Widget.Events.READY, () => {
                console.log('the ready');
                this.isPlayerReady$.next(true);
                this.isSwitchingVideo$.next(false);
                this.zone.run(() => {
                  this.disableSetPlayerState = true;
                  setTimeout(() => this.disableSetPlayerState = false, 300);
                  this.playerStateChange.emit(EPlayerState.unstarted);
                });
              });
              soundcloudPlayer.bind(SC.Widget.Events.PLAY, () => {
                this.zone.run(() => {
                  this.disableSetPlayerState = true;
                  setTimeout(() => this.disableSetPlayerState = false, 300);
                  this.playerStateChange.emit(EPlayerState.playing);
                });
              });
              soundcloudPlayer.bind(SC.Widget.Events.PAUSE, () => {
                this.zone.run(() => {
                  this.disableSetPlayerState = true;
                  setTimeout(() => this.disableSetPlayerState = false, 300);
                  this.playerStateChange.emit(EPlayerState.paused);
                });
              });
              soundcloudPlayer.bind(SC.Widget.Events.FINISH, () => {
                this.zone.run(() => {
                  this.disableSetPlayerState = true;
                  setTimeout(() => this.disableSetPlayerState = false, 300);
                  this.playerStateChange.emit(EPlayerState.ended);
                });
              });
              soundcloudPlayer.bind(SC.Widget.Events.PLAY_PROGRESS, (event: PlayProgressEvent) => {
                soundcloudPlayer.getDuration((duration) => {
                  this.zone.run(() => {
                    this.progressChange.emit({
                      currentTime: event.currentPosition / 1000,
                      duration: duration / 1000
                    });
                  });
                });
              });
            }
            break;
        }
      });

    // [isPlayerReady$] => playVideo
    this.isPlayerReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((ready) => {
        console.log('hello world');
        const videoRequest = this.videoRequest$.value;
        if (videoRequest !== null) {
          if (typeof videoRequest.id !== 'undefined') {
            if (videoRequest.playerType === EPlayerType.youtube) {
              (<YT.Player>this.playerInfo?.player).loadVideoById(videoRequest.id, VideoPlayerComponent.presetState?.startSeconds);
            } else if (videoRequest.playerType === EPlayerType.dailymotion) {
              (<DM.Player>this.playerInfo?.player).load({ video: videoRequest.id, start: VideoPlayerComponent.presetState?.startSeconds });
            } else if (videoRequest.playerType === EPlayerType.vimeo) {
              const vimeoPlayer = <Vimeo.Player>this.playerInfo?.player;
              vimeoPlayer.loadVideo(videoRequest.id);
              if (VideoPlayerComponent.presetState) {
                vimeoPlayer.setCurrentTime(VideoPlayerComponent.presetState.startSeconds);
              }
            } else if (videoRequest.playerType === EPlayerType.soundcloud) {
              const soundcloudPlayer = <SC.Widget.Player>this.playerInfo?.player;
              (<any>window).player = soundcloudPlayer;
              console.log('sc player ready');

              console.log('presetState after', VideoPlayerComponent.presetState);
              if (VideoPlayerComponent.presetState) {
                soundcloudPlayer.load(videoRequest.id, { auto_play: false });
                soundcloudPlayer.seekTo(VideoPlayerComponent.presetState.startSeconds * 1000);
                setTimeout(() => soundcloudPlayer.play(), 10);
              } else {
                soundcloudPlayer.load(videoRequest.id, { auto_play: this.autoplay });
              }
            }
          }
          VideoPlayerComponent.presetState = null;
        }
      });

    if (!isPlatformServer(this.platformId)) {
      combineLatest([timer(0, 50), this.isPlayerReady$, this.isSwitchingVideo$])
        .pipe(filter(([time, isPlayerReady, isSwitchingVideo]) => {
          return isPlayerReady && !isSwitchingVideo;
        }))
        .pipe(takeUntil(this.destroyed$))
        .subscribe(async ([time, isPlayerReady, isSwitchingVideo]) => {
          let newCurrentTime: number | null = null;
          let newVolume: number | null = null;
          let newIsMuted = false;
          let duration = 0;

          switch (this.playerInfo?.type) {
            case EPlayerType.youtube: {
              const player = <YT.Player>this.playerInfo.player;
              if (player.getCurrentTime !== undefined) {
                newCurrentTime = player.getCurrentTime();
              }
              if (player.getVolume !== undefined) {
                newVolume = player.getVolume();
              }
              if (player.isMuted !== undefined) {
                newIsMuted = player.isMuted();
              }
              if (player.getDuration !== undefined) {
                duration = player.getDuration();
              }
            } break;
            case EPlayerType.dailymotion: {
              const player = <DM.Player>this.playerInfo.player;
              if (player.currentTime !== undefined) {
                newCurrentTime = player.currentTime;
              }
              if (player.volume !== undefined) {
                newVolume = player.volume * 100;
              }
              if (player.muted !== undefined) {
                newIsMuted = player.muted;
              }
              duration = player.duration;
            } break;
            case EPlayerType.vimeo: {
              const player = <Vimeo.Player>this.playerInfo.player;
              if (player.getMuted !== undefined) {
                newIsMuted = await player.getMuted();
              }
            } break;
            case EPlayerType.soundcloud: {
              const player = <SC.Widget.Player>this.playerInfo.player;
              if (player.getVolume !== undefined) {
                newVolume = await new Promise<number>((resolve, reject) => {
                  player.getVolume((volume) => {
                    resolve(volume);
                  });
                });
              }
            } break;
          }

          this.zone.run(() => {
            if ((newCurrentTime !== null) && (this._currentTime !== newCurrentTime)) {
              this.progressChange.emit({
                currentTime: this._currentTime = newCurrentTime,
                duration: duration
              });
            }
            if ((newVolume !== null) && (this._volume !== newVolume)) {
              this.volumeChange.emit(this._volume = newVolume);
            }
            if (this._mute != newIsMuted) {
              this.muteChange.emit(this._mute = newIsMuted);
            }
          });
        });
    }
  }

  static presetState: { startSeconds: number } | null = null;

  private destroyCurrentPlayer() {
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube:
        (<YT.Player>this.playerInfo.player).destroy();
        break;
      case EPlayerType.dailymotion:
        // (<DM.Player>this.playerInfo.player).destroy();
        break;
      case EPlayerType.vimeo:
        (<Vimeo.Player>this.playerInfo.player).destroy();
        break;
      case EPlayerType.soundcloud:
        // (<SC.Widget.Player>this.playerInfo.player).destroy();
        break;
    }
  }

  //#region width
  private _width = 600;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    if (!!this.playerInfo && !!this.playerInfo.player) {
      switch (this.playerInfo.type) {
        case EPlayerType.youtube:
          (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
          break;
        case EPlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).width = this._width;
          break;
        case EPlayerType.vimeo: {
          const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
          if (iframe) {
            iframe.width = String(value);
          }
        } break;
        case EPlayerType.soundcloud: {
          const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('iframe');
          if (iframe) {
            iframe.width = String(value);
          }
        } break;
      }
    }
  }
  //#endregion
  //#region height
  private _height = 450;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    if (!!this.playerInfo && !!this.playerInfo.player) {
      switch (this.playerInfo.type) {
        case EPlayerType.youtube:
          (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
          break;
        case EPlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).height = this._height;
          break;
        case EPlayerType.vimeo: {
          const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
          if (iframe) {
            iframe.height = String(value);
          }
        } break;
        case EPlayerType.soundcloud: {
          const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('iframe');
          if (iframe) {
            iframe.height = String(value);
          }
        } break;
      }
    }
  }
  //#endregion
  //#region currentTime
  private _currentTime = 0;
  get currentTime() {
    return this._currentTime;
  }
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  //#endregion
  //#region seek
  public seek(timestamp: number) {
    if (this._currentTime !== timestamp) {
      this._currentTime = timestamp;
      switch (this.playerInfo?.type) {
        case EPlayerType.youtube:
          (<YT.Player>this.playerInfo.player).seekTo(timestamp, true);
          break;
        case EPlayerType.dailymotion:
          (<DM.Player>this.playerInfo.player).seek(timestamp);
          break;
        case EPlayerType.vimeo:
          (<Vimeo.Player>this.playerInfo.player).setCurrentTime(timestamp);
          break;
        case EPlayerType.soundcloud:
          (<SC.Widget.Player>this.playerInfo.player).seekTo(timestamp * 1000);
          break;
      }
    }
  }
  //#endregion
  //#region playerState
  private disableSetPlayerState = false;
  public async getplayerState() {
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube: {

        const player = <YT.Player>this.playerInfo.player;
        switch (player.getPlayerState()) {
          case YT.PlayerState.PLAYING:
            return EPlayerState.playing;
          case YT.PlayerState.PAUSED:
            return EPlayerState.paused;
          case YT.PlayerState.ENDED:
            return EPlayerState.ended;
          default:
            return EPlayerState.unstarted;
        }

      }
      case EPlayerType.dailymotion: {

        const player = <DM.Player>this.playerInfo.player;
        if (player.ended) {
          return EPlayerState.ended;
        } else if (player.paused) {
          return EPlayerState.paused;
        } else {
          return EPlayerState.playing;
        }

      }
      case EPlayerType.vimeo: {

        const player = <Vimeo.Player>this.playerInfo.player;
        if (await player.getEnded()) {
          return EPlayerState.ended;
        } else if (await player.getPaused()) {
          return EPlayerState.paused;
        } else {
          return EPlayerState.playing;
        }

      }
      case EPlayerType.soundcloud: {
        const player = <SC.Widget.Player>this.playerInfo.player;
        const isPaused = await new Promise<boolean>((resolve, reject) => {
          player.isPaused((paused) => {
            resolve(paused);
          });
        });
        
        if (isPaused) {
          return EPlayerState.paused;
        } else {
          return EPlayerState.playing;
        }
      }
      default: {

        throw `Player type ${this.playerInfo?.type} not supported`;

      }
    }
  }
  @Input() set playerState(value: EPlayerState) {
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube: {

        const player = <YT.Player>this.playerInfo.player;
        switch (value) {
          case EPlayerState.playing:
            player.playVideo();
            break;
          case EPlayerState.paused:
            player.pauseVideo();
            break;
          case EPlayerState.ended:
            player.stopVideo();
            break;
          case EPlayerState.unstarted:
            break;
        }

      } break;
      case EPlayerType.dailymotion: {

        const player = <DM.Player>this.playerInfo.player;
        switch (value) {
          case EPlayerState.playing:
            player.play();
            break;
          case EPlayerState.paused:
            player.pause();
            break;
          case EPlayerState.ended:
          case EPlayerState.unstarted:
            break;
        }

      } break;
      case EPlayerType.vimeo: {

        const player = <Vimeo.Player>this.playerInfo.player;
        switch (value) {
          case EPlayerState.playing:
            player.play();
            break;
          case EPlayerState.paused:
            player.pause();
            break;
          case EPlayerState.ended:
          case EPlayerState.unstarted:
            break;
        }

      } break;
      case EPlayerType.soundcloud: {
        if (!this.isSwitchingVideo$.value && !this.disableSetPlayerState) {
          const player = <SC.Widget.Player>this.playerInfo.player;
          switch (value) {
            case EPlayerState.playing:
              player.play();
              break;
            case EPlayerState.paused:
              player.pause();
              break;
            case EPlayerState.ended:
            case EPlayerState.unstarted:
              break;
          }
        }

      } break;
    }
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
  //#endregion
  //#region title
  public async getTitle() {
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube: {
        const player = <YT.Player>this.playerInfo.player;
        return <string>(<any>player).getVideoData().title;
      }
      case EPlayerType.dailymotion: {
        const player = <DM.Player>this.playerInfo.player;
        return player.video.title.replace(new RegExp('\\+', 'g'), ' ');
      }
      case EPlayerType.vimeo: {
        const player = <Vimeo.Player>this.playerInfo.player;
        const title = await player.getVideoTitle();
        return title;
      }
      case EPlayerType.soundcloud: {
        const player = <SC.Widget.Player>this.playerInfo.player;
        const title = await new Promise<string>((resolve, reject) => {
          player.getCurrentSound((sound: any) => {
            resolve(sound.description ?? sound.title);
          });
        });
        return title;
      }
      default: {
        return '';
      }
    }
  }
  //#endregion
  //#region volume
  private _volume = 0;
  get volume() {
    return this._volume;
  }
  @Input() set volume(value: number) {
    this._volume = value;
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube: {
        (<YT.Player>this.playerInfo.player).setVolume(value);
      } break;
      case EPlayerType.dailymotion: {
        (<DM.Player>this.playerInfo.player).setVolume(value / 100);
      } break;
      case EPlayerType.vimeo: {
        (<Vimeo.Player>this.playerInfo.player).setVolume(value / 100);
      } break;
      case EPlayerType.soundcloud: {
        (<SC.Widget.Player>this.playerInfo.player).setVolume(value);
      } break;
    }
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
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube: {
        if (value) {
          (<YT.Player>this.playerInfo.player).mute();
        } else {
          (<YT.Player>this.playerInfo.player).unMute();
        }
      } break;
      case EPlayerType.dailymotion: {
        (<DM.Player>this.playerInfo.player).muted = value;
      } break;
      case EPlayerType.vimeo: {
        (<Vimeo.Player>this.playerInfo.player).setMuted(value);
      } break;
    }
  }
  @Output() public muteChange = new EventEmitter<boolean>();
  //#endregion

  //#region isPip
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
    switch (this.playerInfo?.type) {
      case EPlayerType.youtube:
        return false
      case EPlayerType.dailymotion:
        return false;
      case EPlayerType.vimeo: {
        const player = <Vimeo.Player>this.playerInfo?.player;
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
      case EPlayerType.youtube: {
        if (isPip) {
          throw 'YouTube does not support PiP mode';
        }
      } break;
      case EPlayerType.dailymotion: {
        if (isPip) {
          throw 'DailyMotion does not support PiP mode';
        }
      } break;
      case EPlayerType.vimeo: {
        if (isPip) {
          await (<Vimeo.Player>this.playerInfo?.player).requestPictureInPicture();
        } else {
          await (<Vimeo.Player>this.playerInfo.player).exitPictureInPicture();
        }
      } break;
      case EPlayerType.soundcloud: {
        if (isPip) {
          throw 'SoundCloud does not support PiP mode';
        }
      } break;
    }
  }
  //#endregion
  @Input() public autoplay = true;
  //#region url
  @Input() public set url(value: string) {
    this.setUrl(value);
  }
  public setUrl(url: string | null) {
    console.log('set url');
    if ((typeof url === 'undefined') || (url === null) || (url === '')) {
      this.videoRequest$.next(null);
    } else {
      this.isSwitchingVideo$.next(true);

      const platformWithId = this.playerTypeFinder.getPlatformWithId(url);
      if (platformWithId === null) {
        throw `No player found for url ${url}`;
      } else {
        console.log('platformWithId', platformWithId);
        this.videoRequest$.next({ playerType: platformWithId.platform, id: platformWithId.id });
      }
    }
  }
  //#endregion
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private static playerCounter = 1;
  domId = 'player';
  counter = 1;

  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  private isApiReady$ = new Subject();
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  private isSwitchingVideo$ = new BehaviorSubject<boolean>(false);

  private playerInfo: { type: EPlayerType, player: YT.Player | DM.Player | Vimeo.Player | SC.Widget.Player } | null = null;
  private hasJustLoaded = false;

  ngAfterViewInit() {
    console.log('view inited');
    this.isViewInited$.next(true);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}