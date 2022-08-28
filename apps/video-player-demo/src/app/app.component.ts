import { Component, Inject } from '@angular/core';

@Component({
  selector: 'mintplayer-ng-video-player-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(@Inject('VIDEO_PLAYER_VERSION') videoPlayerVersion: string) {
    this.versionInfo = videoPlayerVersion;
  }
  
  versionInfo = '';
  title = '@mintplayer/ng-video-player';
}
