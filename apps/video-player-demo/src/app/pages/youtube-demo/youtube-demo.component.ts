import { Component, ViewChild } from '@angular/core';
import { YoutubePlayerComponent } from '@mintplayer/ng-youtube-player';

@Component({
  selector: 'mintplayer-ng-video-player-youtube-demo',
  templateUrl: './youtube-demo.component.html',
  styleUrls: ['./youtube-demo.component.scss']
})
export class YoutubeDemoComponent {
  title = 'YouTube player';

  @ViewChild('player1') player1!: YoutubePlayerComponent;
  playVideo() {
    this.player1.playVideoById('jNQXAC9IVRw');
  }
}
