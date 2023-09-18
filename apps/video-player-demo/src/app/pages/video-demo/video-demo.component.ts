import { Component, Inject, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { ECapability, EPlayerState, IApiService, VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Component({
  selector: 'mintplayer-ng-video-player-video-demo',
  templateUrl: './video-demo.component.html',
  styleUrls: ['./video-demo.component.scss']
})
export class VideoDemoComponent {

  constructor(@Inject(VIDEO_APIS) players: IApiService[]) {
    console.log('VIDEO_APIS', players);
    this.cannotFullscreen$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.fullscreen)));
    this.cannotPip$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.pictureInPicture)));
    this.cannotChangeVolume$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.volume)));
    this.cannotMute$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.mute)));
    this.cannotGetTitle$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.getTitle)));
  }

  title = 'video-player-demo';
  colors = Color;
  playerStates = EPlayerState;
  playerState!: EPlayerState;
  width = 500;
  height = 300;
  volume = 0;
  isMuted = false;
  isPip = false;
  isFullscreen = false;
  progress: PlayerProgress = {
    currentTime: 0,
    duration: 0
  };
  
  newVideoUrl = '';
  videos: string[] = [
    'https://www.youtube.com/watch?v=tt2k8PGm-TI',
    'https://www.youtube.com/watch?v=YykjpeuMNEk',
    'https://www.youtube.com/watch?v=yFKhgF_vkgs',
    'https://www.youtube.com/live/gCNeDWCI0vo?app=desktop&feature=share',
    'https://www.dailymotion.com/video/x2yhuhb',
    'https://www.dailymotion.com/video/x8n41nh',
    'https://vimeo.com/14190306',
    'https://vimeo.com/82932655',
    'https://soundcloud.com/dario-g/sunchyme-radio-edit',
    'https://soundcloud.com/oasisofficial/whatever',
    'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
    'spotify:track:0FDzzruyVECATHXKHFs9eJ',
  ];

  addToPlaylist() {
    this.videos.push(this.newVideoUrl);
    this.newVideoUrl = '';
  }


  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  @ViewChild('player1') player1!: VideoPlayerComponent;
  playVideo(video: string) {
    // Pick one here
    // this.url = video; // This will not replay the video when the url is the same.
    this.player1.setUrl(video); // This will replay the video when the url is the same.

    return false;
  }

  getTitle() {
    this.player1.getTitle().then((title) => {
      alert('title\r\n' + title);
    });
  }

  setSize() {
    this.width = 100;
    this.height = 75;
  }

  play() {
    this.playerState = EPlayerState.playing;
  }
  pause() {
    this.playerState = EPlayerState.paused;
  }

  onProgressChange(progress: PlayerProgress) {
    this.progress = progress;
  }

  onPlayerStateChange(event: EPlayerState) {
    if (event === EPlayerState.ended) {
      this.player1.setUrl(null);
    }
  }

  capabilities$ = new BehaviorSubject<ECapability[]>([]);
  cannotFullscreen$: Observable<boolean>;
  cannotPip$: Observable<boolean>;
  cannotChangeVolume$: Observable<boolean>;
  cannotMute$: Observable<boolean>;
  cannotGetTitle$: Observable<boolean>;
  onCapabilitiesChange(capabilities: ECapability[]) {
    this.capabilities$.next(capabilities);
  }
}
