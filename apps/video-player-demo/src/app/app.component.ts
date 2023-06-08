import { Component, Inject } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';

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
  colors = Color;
  title = '@mintplayer/ng-video-player';
}
