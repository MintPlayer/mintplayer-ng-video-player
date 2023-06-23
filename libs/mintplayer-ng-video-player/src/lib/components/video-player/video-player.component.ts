import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Inject, Input, NgZone, Output, PLATFORM_ID, ViewChild } from '@angular/core';
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
export class VideoPlayerComponent implements AfterViewInit {
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
          // this.destroyCurrentPlayer();
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
            this.playerInfo?.adapter.destroy();
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
        } else {
          // Cancel all timers / Clear the html
          this.playerInfo?.adapter?.destroy();
          setHtml(null);
        }


        // switch (currentVideoRequest?.playerType) {
        //   case EPlayerType.youtube:
        //     if (this.playerInfo?.platformId === EPlayerType.youtube) {
        //       // Recycle the YT.Player
        //       (<YT.Player>this.playerInfo.player).loadVideoById(currentVideoRequest.id);
        //       if (this.autoplay) {
        //         setTimeout(() => (<YT.Player>this.playerInfo?.player).playVideo(), 100);
        //       }
        //       this.isSwitchingVideo$.next(false);
        //     } else {
        //       this.destroyCurrentPlayer();
        //       setHtml(currentVideoRequest);
        //       currentVideoRequest.api.createPlayer({
        //         width: this.width,
        //         height: this.height,
        //         autoplay: this.autoplay,
        //         domId: this.domId
        //       });
        //       // this.playerInfo = {
        //       //   type: EPlayerType.youtube,
        //       //   player: new YT.Player(this.domId, {
        //       //     width: this.width,
        //       //     height: this.height,
        //       //     playerVars: {
        //       //       fs: 1,
        //       //       autoplay: <any>this.autoplay,
        //       //     },
        //       //     events: {
        //       //       onReady: (ev: YT.PlayerEvent) => {
        //       //         this.isPlayerReady$.next(true);
        //       //         this.isSwitchingVideo$.next(false);
        //       //       },
        //       //       onStateChange: (ev: YT.OnStateChangeEvent) => {
        //       //         switch (ev.data) {
        //       //           case YT.PlayerState.PLAYING:
        //       //             return this.playerStateObserver$.next(EPlayerState.playing);
        //       //           case YT.PlayerState.PAUSED:
        //       //             return this.playerStateObserver$.next(EPlayerState.paused);
        //       //           case YT.PlayerState.ENDED:
        //       //             return this.playerStateObserver$.next(EPlayerState.ended);
        //       //           case YT.PlayerState.UNSTARTED:
        //       //             return this.playerStateObserver$.next(EPlayerState.unstarted);
        //       //         }
        //       //       }
        //       //     }
        //       //   })
        //       // };
        //     }
        //     break;
        //   // case EPlayerType.dailymotion:
        //   //   if (this.playerInfo?.type === EPlayerType.dailymotion) {
        //   //     // Recycle the DM.Player
        //   //     (<DM.Player>this.playerInfo.player).load({ video: currentVideoRequest.id });
        //   //     this.isSwitchingVideo$.next(false);
        //   //   } else {
        //   //     this.destroyCurrentPlayer();
        //   //     setHtml(EPlayerType.dailymotion);
        //   //     this.playerInfo = {
        //   //       type: EPlayerType.dailymotion,
        //   //       player: DM.player(this.container.nativeElement.getElementsByTagName('div')[0], {
        //   //         width: String(this.width),
        //   //         height: String(this.height),
        //   //         params: {
        //   //           autoplay: this.autoplay,
        //   //           "queue-enable": false,
        //   //         },
        //   //         events: {
        //   //           apiready: () => {
        //   //             this.isPlayerReady$.next(true);
        //   //             this.isSwitchingVideo$.next(false);
        //   //           },
        //   //           play: () => this.playerStateObserver$.next(EPlayerState.playing),
        //   //           pause: () => this.playerStateObserver$.next(EPlayerState.paused),
        //   //           end: () => this.playerStateObserver$.next(EPlayerState.ended),
        //   //         }
        //   //       })
        //   //     };
        //   //   }
        //   //   break;
        //   // case EPlayerType.vimeo:
        //   //   if (this.playerInfo?.type === EPlayerType.vimeo) {
        //   //     // Recycle the Vimeo.Player
        //   //     (<Vimeo.Player>this.playerInfo.player)
        //   //       .loadVideo(currentVideoRequest.id)
        //   //       .then((v) => this.isSwitchingVideo$.next(false));
        //   //   } else {
        //   //     this.destroyCurrentPlayer();
        //   //     setHtml(EPlayerType.vimeo);
        //   //     const videoId = currentVideoRequest.id;
        //   //     const vimeoPlayer = new Vimeo.Player(this.domId, {
        //   //       id: videoId,
        //   //       width: this.width,
        //   //       height: this.height,
        //   //       autoplay: this.autoplay,
        //   //       pip: true
        //   //     });
        //   //     this.playerInfo = {
        //   //       type: EPlayerType.vimeo,
        //   //       player: vimeoPlayer
        //   //     };
        //   //     vimeoPlayer.ready().then(() => {
        //   //       this.isPlayerReady$.next(true);
        //   //       this.isSwitchingVideo$.next(false);
        //   //       this.playerStateObserver$.next(EPlayerState.unstarted);
        //   //     });
        //   //     vimeoPlayer.on('loaded', () => {
        //   //       this.hasJustLoaded = true;
        //   //       this.playerStateObserver$.next(EPlayerState.unstarted);
        //   //       setTimeout(() => {
        //   //         const player = <Vimeo.Player>this.playerInfo?.player;
        //   //         this.hasJustLoaded = false;
        //   //         player.getVolume().then(newVolume => this.volumeObserver$.next(newVolume * 100));

        //   //         if (this.autoplay) {
        //   //           player.play();
        //   //         }
        //   //       }, 600);
        //   //     });
        //   //     vimeoPlayer.on('play', () => this.playerStateObserver$.next(EPlayerState.playing));
        //   //     vimeoPlayer.on('pause', () => {
        //   //       if (!this.hasJustLoaded) {
        //   //         this.playerStateObserver$.next(EPlayerState.paused);
        //   //       }
        //   //     });
        //   //     vimeoPlayer.on('ended', () => this.playerStateObserver$.next(EPlayerState.ended));
        //   //     vimeoPlayer.on('volumechange', (event) => this.volumeObserver$.next(event.volume * 100));
        //   //     vimeoPlayer.on('timeupdate', (event) => {
        //   //       vimeoPlayer.getDuration().then((d) => {
        //   //         this.currentTimeObserver$.next(event.seconds);
        //   //         this.durationObserver$.next(d);
        //   //       });
        //   //     });
        //   //     vimeoPlayer.on('enterpictureinpicture', (event) => {
        //   //       this.zone.run(() => {
        //   //         this.isPipChange.emit(true);
        //   //       });
        //   //     });
        //   //     vimeoPlayer.on('leavepictureinpicture', (event) => {
        //   //       this.zone.run(() => {
        //   //         this.isPipChange.emit(false);
        //   //       });
        //   //     });
        //   //   }
        //   //   break;
        //   // case EPlayerType.soundcloud:
        //   //   if (this.playerInfo?.type === EPlayerType.soundcloud) {
        //   //     (<SC.Widget.Player>this.playerInfo.player).load(currentVideoRequest.id, {
        //   //       auto_play: true,
        //   //       callback: () => this.isSwitchingVideo$.next(false)
        //   //     });
        //   //   } else {
        //   //     this.destroyCurrentPlayer();
        //   //     setHtml(EPlayerType.soundcloud);
        //   //     const soundcloudPlayer = SC.Widget(<HTMLIFrameElement>document.getElementById(this.domId));
        //   //     this.playerInfo = {
        //   //       type: EPlayerType.soundcloud,
        //   //       player: soundcloudPlayer
        //   //     };
        //   //     soundcloudPlayer.bind(SC.Widget.Events.READY, () => {
        //   //       this.isPlayerReady$.next(true);
        //   //       this.isSwitchingVideo$.next(false);
        //   //       this.playerStateObserver$.next(EPlayerState.unstarted);
        //   //     });
        //   //     soundcloudPlayer.bind(SC.Widget.Events.PLAY, () => this.playerStateObserver$.next(EPlayerState.playing));
        //   //     soundcloudPlayer.bind(SC.Widget.Events.PAUSE, () => this.playerStateObserver$.next(EPlayerState.paused));
        //   //     soundcloudPlayer.bind(SC.Widget.Events.FINISH, () => this.playerStateObserver$.next(EPlayerState.ended));
        //   //     soundcloudPlayer.bind(SC.Widget.Events.PLAY_PROGRESS, (event: PlayProgressEvent) => {
        //   //       soundcloudPlayer.getDuration((duration) => {
        //   //         this.currentTimeObserver$.next(event.currentPosition / 1000);
        //   //         this.durationObserver$.next(duration / 1000);
        //   //       });
        //   //     });
        //   //   }
        //   //   break;
        // }
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
            // if (videoRequest.playerType === EPlayerType.youtube) {
            //   (<YT.Player>this.playerInfo?.player).loadVideoById(videoRequest.id);
            // } else if (videoRequest.playerType === EPlayerType.dailymotion) {
            //   (<DM.Player>this.playerInfo?.player).load({ video: videoRequest.id });
            // } else if (videoRequest.playerType === EPlayerType.vimeo) {
            //   (<Vimeo.Player>this.playerInfo?.player).loadVideo(videoRequest.id);
            // } else if (videoRequest.playerType === EPlayerType.soundcloud) {
            //   (<SC.Widget.Player>this.playerInfo?.player).load(videoRequest.id, { auto_play: this.autoplay });
            // }
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

    // if (!isPlatformServer(this.platformId)) {
    //   combineLatest([timer(0, 50), this.isPlayerReady$, this.isSwitchingVideo$])
    //     .pipe(filter(([time, isPlayerReady, isSwitchingVideo]) => isPlayerReady && !isSwitchingVideo))
    //     .pipe(takeUntil(this.destroyed$))
    //     .subscribe(async ([time, isPlayerReady, isSwitchingVideo]) => {
    //       switch (this.playerInfo?.type) {
    //         case EPlayerType.youtube: {
    //           const player = <YT.Player>this.playerInfo.player;
    //           if (player.getCurrentTime !== undefined) {
    //             const newCurrentTime = player.getCurrentTime();
    //             this.currentTimeObserver$.next(newCurrentTime);
    //           }
    //           if (player.getVolume !== undefined) {
    //             const newVolume = player.getVolume();
    //             this.volumeObserver$.next(newVolume);
    //           }
    //           if (player.isMuted !== undefined) {
    //             const newIsMuted = player.isMuted();
    //             this.muteObserver$.next(newIsMuted);
    //           }
    //           if (player.getDuration !== undefined) {
    //             const duration = player.getDuration();
    //             this.durationObserver$.next(duration);
    //           }
    //         } break;
    //         case EPlayerType.dailymotion: {
    //           const player = <DM.Player>this.playerInfo.player;
    //           if (player.currentTime !== undefined) {
    //             this.currentTimeObserver$.next(player.currentTime);
    //           }
    //           if (player.volume !== undefined) {
    //             const newVolume = player.volume * 100;
    //             this.volumeObserver$.next(newVolume);
    //           }
    //           if (player.muted !== undefined) {
    //             this.muteObserver$.next(player.muted);
    //           }
    //           if (player.duration !== undefined) {
    //             this.durationObserver$.next(player.duration);
    //           }
    //         } break;
    //         case EPlayerType.vimeo: {
    //           const player = <Vimeo.Player>this.playerInfo.player;
    //           if (player.getMuted !== undefined) {
    //             player.getMuted().then((newIsMuted) => this.muteObserver$.next(newIsMuted));
    //           }
    //         } break;
    //         case EPlayerType.soundcloud: {
    //           const player = <SC.Widget.Player>this.playerInfo.player;
    //           if (player.getVolume !== undefined) {
    //             player.getVolume((volume) => this.volumeObserver$.next(volume));
    //           }
    //         } break;
    //       }
    //     });
    // }
  }

  // private destroyCurrentPlayer() {
  //   switch (this.playerInfo?.type) {
  //     case EPlayerType.youtube:
  //       (<YT.Player>this.playerInfo.player).destroy();
  //       break;
  //     case EPlayerType.dailymotion:
  //       // (<DM.Player>this.playerInfo.player).destroy();
  //       break;
  //     case EPlayerType.vimeo:
  //       (<Vimeo.Player>this.playerInfo.player).destroy();
  //       break;
  //     case EPlayerType.soundcloud:
  //       // (<SC.Widget.Player>this.playerInfo.player).destroy();
  //       break;
  //   }
  // }

  //#region width
  private _width = 600;
  get width() {
    return this._width;
  }
  @Input() set width(value: number) {
    this._width = value;
    // if (!!this.playerInfo && !!this.playerInfo.player) {
    //   switch (this.playerInfo.type) {
    //     case EPlayerType.youtube:
    //       (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
    //       break;
    //     case EPlayerType.dailymotion:
    //       (<DM.Player>this.playerInfo.player).width = this._width;
    //       break;
    //     case EPlayerType.vimeo: {
    //       const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
    //       if (iframe) {
    //         iframe.width = String(value);
    //       }
    //     } break;
    //     case EPlayerType.soundcloud: {
    //       const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('iframe');
    //       if (iframe) {
    //         iframe.width = String(value);
    //       }
    //     } break;
    //   }
    // }
  }
  //#endregion
  //#region height
  private _height = 450;
  get height() {
    return this._height;
  }
  @Input() set height(value: number) {
    this._height = value;
    // if (!!this.playerInfo && !!this.playerInfo.player) {
    //   switch (this.playerInfo.type) {
    //     case EPlayerType.youtube:
    //       (<YT.Player>this.playerInfo.player).setSize(this._width, this._height);
    //       break;
    //     case EPlayerType.dailymotion:
    //       (<DM.Player>this.playerInfo.player).height = this._height;
    //       break;
    //     case EPlayerType.vimeo: {
    //       const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('div iframe');
    //       if (iframe) {
    //         iframe.height = String(value);
    //       }
    //     } break;
    //     case EPlayerType.soundcloud: {
    //       const iframe = this.container.nativeElement.querySelector<HTMLIFrameElement>('iframe');
    //       if (iframe) {
    //         iframe.height = String(value);
    //       }
    //     } break;
    //   }
    // }
  }
  //#endregion
  //#region seek
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  public seek(timestamp: number) {
    // this.currentTimeObserver$.next(timestamp);
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube:
    //     (<YT.Player>this.playerInfo.player).seekTo(timestamp, true);
    //     break;
    //   case EPlayerType.dailymotion:
    //     (<DM.Player>this.playerInfo.player).seek(timestamp);
    //     break;
    //   case EPlayerType.vimeo:
    //     (<Vimeo.Player>this.playerInfo.player).setCurrentTime(timestamp);
    //     break;
    //   case EPlayerType.soundcloud:
    //     (<SC.Widget.Player>this.playerInfo.player).seekTo(timestamp * 1000);
    //     break;
    // }
  }
  //#endregion
  //#region playerState
  @Input() set playerState(value: EPlayerState) {
    this.playerInfo?.adapter.setPlayerState(value);
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube: {

    //     const player = <YT.Player>this.playerInfo.player;
    //     switch (value) {
    //       case EPlayerState.playing:
    //         player.playVideo();
    //         break;
    //       case EPlayerState.paused:
    //         player.pauseVideo();
    //         break;
    //       case EPlayerState.ended:
    //         player.stopVideo();
    //         break;
    //       case EPlayerState.unstarted:
    //         break;
    //     }

    //   } break;
    //   case EPlayerType.dailymotion: {

    //     const player = <DM.Player>this.playerInfo.player;
    //     switch (value) {
    //       case EPlayerState.playing:
    //         player.play();
    //         break;
    //       case EPlayerState.paused:
    //         player.pause();
    //         break;
    //       case EPlayerState.ended:
    //       case EPlayerState.unstarted:
    //         break;
    //     }

    //   } break;
    //   case EPlayerType.vimeo: {

    //     const player = <Vimeo.Player>this.playerInfo.player;
    //     switch (value) {
    //       case EPlayerState.playing:
    //         player.play();
    //         break;
    //       case EPlayerState.paused:
    //         player.pause();
    //         break;
    //       case EPlayerState.ended:
    //       case EPlayerState.unstarted:
    //         break;
    //     }

    //   } break;
    //   case EPlayerType.soundcloud: {
    //     const player = <SC.Widget.Player>this.playerInfo.player;
    //     switch (value) {
    //       case EPlayerState.playing:
    //         player.play();
    //         break;
    //       case EPlayerState.paused:
    //         player.pause();
    //         break;
    //       case EPlayerState.ended:
    //       case EPlayerState.unstarted:
    //         break;
    //     }

    //   } break;
    // }
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
  //#endregion
  //#region title
  public async getTitle() {
    return '';
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube: {
    //     const player = <YT.Player>this.playerInfo.player;
    //     return <string>(<any>player).getVideoData().title;
    //   }
    //   case EPlayerType.dailymotion: {
    //     const player = <DM.Player>this.playerInfo.player;
    //     return player.video.title.replace(new RegExp('\\+', 'g'), ' ');
    //   }
    //   case EPlayerType.vimeo: {
    //     const player = <Vimeo.Player>this.playerInfo.player;
    //     const title = await player.getVideoTitle();
    //     return title;
    //   }
    //   case EPlayerType.soundcloud: {
    //     const player = <SC.Widget.Player>this.playerInfo.player;
    //     const title = await new Promise<string>((resolve, reject) => {
    //       player.getCurrentSound((sound: any) => {
    //         resolve(sound.description ?? sound.title);
    //       });
    //     });
    //     return title;
    //   }
    //   default: {
    //     return '';
    //   }
    // }
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
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube: {
    //     (<YT.Player>this.playerInfo.player).setVolume(value);
    //   } break;
    //   case EPlayerType.dailymotion: {
    //     (<DM.Player>this.playerInfo.player).setVolume(value / 100);
    //   } break;
    //   case EPlayerType.vimeo: {
    //     (<Vimeo.Player>this.playerInfo.player).setVolume(value / 100);
    //   } break;
    //   case EPlayerType.soundcloud: {
    //     (<SC.Widget.Player>this.playerInfo.player).setVolume(value);
    //   } break;
    // }
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
    // switch (this.playerInfo?.type) {
    //   case EPlayerType.youtube: {
    //     if (value) {
    //       (<YT.Player>this.playerInfo.player).mute();
    //     } else {
    //       (<YT.Player>this.playerInfo.player).unMute();
    //     }
    //   } break;
    //   case EPlayerType.dailymotion: {
    //     (<DM.Player>this.playerInfo.player).setMuted(value);
    //   } break;
    //   case EPlayerType.vimeo: {
    //     (<Vimeo.Player>this.playerInfo.player).setMuted(value);
    //   } break;
    // }
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
  // private durationObserver$ = new Subject<number>();
  private playerStateObserver$ = new Subject<EPlayerState>();


  private playerInfo: { platformId: string, videoId: string, adapter: PlayerAdapter } | null = null;
  private hasJustLoaded = false;

  ngAfterViewInit() {
    this.isViewInited$.next(true);
  }
}