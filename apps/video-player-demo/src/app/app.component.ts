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
  videoRequest: VideoRequest | null = null;

  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  // @ViewChild('player1') player1!: VideoPlayerComponent;
  playVideo() {
    // this.player1.playVideoById('jNQXAC9IVRw');
    this.videoRequest = {
      playerType: PlayerType.dailymotion,
      id: 'x2yhuhb'
    };
  }
}
