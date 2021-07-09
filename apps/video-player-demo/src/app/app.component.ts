import { Component, ViewChild } from '@angular/core';
import { PlayerType, VideoPlayerComponent } from '@mintplayer/ng-video-player'
import { VideoRequest } from 'libs/mintplayer-ng-video-player/src/lib/interfaces/video-request';

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
  ];

  width = 800;
  height = 600;
  setSize() {
    this.width = 400;
    this.height = 300;
  }

  constructor() {
  }
}
