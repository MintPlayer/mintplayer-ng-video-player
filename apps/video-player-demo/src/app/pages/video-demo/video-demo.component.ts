import { Component, ViewChild } from '@angular/core';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { EPlayerState, VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-video-demo',
  templateUrl: './video-demo.component.html',
  styleUrls: ['./video-demo.component.scss']
})
export class VideoDemoComponent {

  title = 'video-player-demo';
  url = '';
  playerStates = EPlayerState;
  playerState!: EPlayerState;
  width = 400;
  height = 300;
  volume = 0;
  isMuted = false;
  isPip = false;
  progress: PlayerProgress = {
    currentTime: 0,
    duration: 0
  };
  
  newVideoUrl = '';
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

  async getTitle() {
    const title = await this.player1.getTitle();
    alert('title\r\n' + title);
  }

  setSize() {
    this.width = 100;
    this.height = 75;
  }

  setMuted(event: Event) {
    this.isMuted = (<any>event.target).checked;
  }

  async requestPip() {
    await this.player1.setIsPip(true);
  }
  async exitPip() {
    await this.player1.setIsPip(false);
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
    console.log(event);
  }
}
