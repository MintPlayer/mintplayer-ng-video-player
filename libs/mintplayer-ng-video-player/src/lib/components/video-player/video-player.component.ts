/// <reference path="../../../../../../node_modules/@types/youtube/index.d.ts" />
/// <reference path="../../interfaces/dailymotion.ts" />
/// <reference path="../../interfaces/vimeo.ts" />

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { YoutubeApiService } from '@mintplayer/ng-youtube-api';
import { DailymotionApiService } from '@mintplayer/ng-dailymotion-api';
import { VimeoApiService } from '@mintplayer/ng-vimeo-api';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { PlayerType } from '../../enums';
import { VideoRequest } from '../../interfaces/video-request';

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
    this.domId = `player${VideoPlayerComponent.playerCounter++}`;
    
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
    
    this.isApiReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((value) => {
        switch (this.videoRequest$.value?.playerType) {
          case PlayerType.youtube:
            this.player = new YT.Player(this.domId, {
              width: this.width,
              height: this.height,
              events: {
                onReady: (ev: YT.PlayerEvent) => {
                  this.isPlayerReady$.next(true);
                }
              }
            });
            break;
          case PlayerType.dailymotion:
            this.player = DM.player(this.container.nativeElement, {
              width: String(this.width),
              height: String(this.height),
              events: {
                apiready: () => {
                  this.isPlayerReady$.next(true);
                }
              }
            });
            break;
          case PlayerType.vimeo:
            let videoId = this.videoRequest$.value.id;
            this.player = new Vimeo.Player(this.domId, {
              id: videoId,
              width: this.width,
              height: this.height
            });
            this.player.ready().then(() => {
              this.isPlayerReady$.next(true);
            });
            break;
        }
      });
    
    this.isPlayerReady$
      .pipe(filter(r => !!r), takeUntil(this.destroyed$))
      .subscribe((ready) => {
        let videoRequest = this.videoRequest$.value;
        if (videoRequest !== null) {
          if (typeof videoRequest.id !== 'undefined') {
            if (videoRequest.playerType === PlayerType.youtube) {
              (<YT.Player>this.player).loadVideoById(videoRequest.id)
            } else if (videoRequest.playerType === PlayerType.dailymotion) {
              (<DM.Player>this.player).load({ video: videoRequest.id });
            } else if (videoRequest.playerType === PlayerType.vimeo) {
              (<Vimeo.Player>this.player).loadVideo(videoRequest.id);
            }
          }
        }
      });
  }

  @Input() public width: number = 800;
  @Input() public height: number = 600;
  @Input() public set videoRequest(value: VideoRequest | null) {
    this.videoRequest$.next(value);
  }
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private static playerCounter: number = 1;
  domId: string = 'player';
 
  private destroyed$ = new Subject();
  private isViewInited$ = new BehaviorSubject<boolean>(false);
  private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
  private isApiReady$ = new BehaviorSubject<boolean>(false);
  private isPlayerReady$ = new BehaviorSubject<boolean>(false);
  
  private player: YT.Player | DM.Player | Vimeo.Player | null = null;

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
