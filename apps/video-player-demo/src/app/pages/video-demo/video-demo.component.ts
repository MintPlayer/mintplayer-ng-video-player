import { Component, Inject, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { ECapability, EPlayerState, IApiService, VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'mintplayer-ng-video-player-video-demo',
  templateUrl: './video-demo.component.html',
  styleUrls: ['./video-demo.component.scss']
})
export class VideoDemoComponent {

  constructor(@Inject(VIDEO_APIS) players: IApiService[], @Inject(DOCUMENT) doc: any) {
    console.log('VIDEO_APIS', players);
    this.cannotFullscreen$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.fullscreen)));
    this.cannotPip$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.pictureInPicture)));
    this.cannotChangeVolume$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.volume)));
    this.cannotMute$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.mute)));
    this.cannotGetTitle$ = this.capabilities$.pipe(map(caps => !caps.includes(ECapability.getTitle)));
    // (<any>window)['testingPlayerApi'] = true;

    const baseUrl = (<Document>doc).querySelector('base')!.href.slice(0, -1);
    this.videos.push(
      `${baseUrl}/assets/Modern-iMovie-8ot-eJxH2yc.mp4`,
      `${baseUrl}/assets/Jim_Yosef_Firefly_pt_II.mp3`
    );
  }

  url?: string;
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
    'https://www.dailymotion.com/video/x20zq3f',
    'https://vimeo.com/14190306',
    'https://vimeo.com/82932655',
    'https://soundcloud.com/dario-g/sunchyme-radio-edit',
    'https://soundcloud.com/oasisofficial/whatever',
    'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
    'spotify:track:0FDzzruyVECATHXKHFs9eJ',
    'https://www.twitch.tv/jankos',
    'https://www.twitch.tv/dearlola1',
    'https://www.twitch.tv/videos/1920198035',
    'https://www.mixcloud.com/TheChilloutTent/the-chill-out-tent-warriors-of-the-dystotheque',
    'https://www.mixcloud.com/gaby-songs/chillout-your-mind-vol32',
    'https://www.mixcloud.com/radiomonaco/good-vibes-djm4t-29092023',
    'https://www.facebook.com/MetaCanada/videos/801193189918934',
    'https://www.facebook.com/iShareitHD/videos/1269681903839169',
    'https://www.facebook.com/watch/?v=379257177188135',
    'https://video.vidyard.com/watch/6eK8VUFScWLqX2PqgF5S44?',
    'https://video.vidyard.com/watch/TKMKV6sdGhz3Fz5vgAAAw9?',
    'https://home.wistia.com/medias/e4a27b971d',
    'https://home.wistia.com/medias/29b0fbf547',
    'https://streamable.com/moo',
    'https://streamable.com/ifjh',
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
    this.url = video; // This will not replay the video when the url is the same.
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
