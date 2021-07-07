import { Component, ViewChild } from '@angular/core';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player'

@Component({
  selector: 'mintplayer-ng-video-player-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'video-player-demo';

  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  @ViewChild('player1') player1!: VideoPlayerComponent;
  playVideo() {
    this.player1.playVideoById('jNQXAC9IVRw');
  }
}
