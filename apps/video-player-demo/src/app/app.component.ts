import { Component, ViewChild } from '@angular/core';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { PlayerState, PlayerType, VideoPlayerComponent } from '@mintplayer/ng-video-player'

@Component({
  selector: 'mintplayer-ng-video-player-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'video-player-demo';
  url: string = '';

  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  // @ViewChild('player1') player1!: VideoPlayerComponent;
  playVideo(video: string) {
    this.url = video;
    return false;
  }

  videos: string[] = [
    'https://www.youtube.com/watch?v=tt2k8PGm-TI',
    'https://www.youtube.com/watch?v=YykjpeuMNEk',
    'https://www.youtube.com/watch?v=yFKhgF_vkgs',
    'https://www.dailymotion.com/video/x2yhuhb',
    'https://vimeo.com/14190306',
    'https://vimeo.com/82932655',
    'https://soundcloud.com/dario-g/sunchyme-radio-edit',
    'https://soundcloud.com/oasisofficial/whatever',
  ];

  width = 800;
  height = 600;
  setSize() {
    this.width = 100;
    this.height = 75;
  }
  progress: PlayerProgress = {
    currentTime: 0,
    duration: 0
  };
  volume = 0;
  isMuted = false;
  isPip = false;
  setMuted(event: Event) {
    this.isMuted = (<any>event.target).checked;
  }

  @ViewChild('player1') player1!: VideoPlayerComponent;
  async requestPip() {
    await this.player1.setIsPip(true);
  }
  async exitPip() {
    await this.player1.setIsPip(false);
  }

  onProgressChange(progress: PlayerProgress) {
    this.progress = progress;
  }

  playerStates = PlayerState;
  playerState!: PlayerState;

  onPlayerStateChange(event: PlayerState) {
    console.log(event);
  }
  constructor() {
  }
}
