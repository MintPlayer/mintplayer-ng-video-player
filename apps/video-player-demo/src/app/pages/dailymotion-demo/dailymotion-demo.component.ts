import { Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-dailymotion-demo',
  templateUrl: './dailymotion-demo.component.html',
  styleUrls: ['./dailymotion-demo.component.scss']
})
export class DailymotionDemoComponent {

  title = 'DailyMotion player'
  @ViewChild('dmplayer') dmplayer!: VideoPlayerComponent;
  colors = Color;

  playVideo() {
    this.dmplayer.setUrl('https://www.dailymotion.com/video/x2yhuhb');
  }
}
