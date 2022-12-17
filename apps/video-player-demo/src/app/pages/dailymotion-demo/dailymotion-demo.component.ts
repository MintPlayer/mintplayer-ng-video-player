import { Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { DailymotionPlayerComponent } from '@mintplayer/ng-dailymotion-player';

@Component({
  selector: 'mintplayer-ng-video-player-dailymotion-demo',
  templateUrl: './dailymotion-demo.component.html',
  styleUrls: ['./dailymotion-demo.component.scss']
})
export class DailymotionDemoComponent {

  title = 'DailyMotion player'
  videoId = '';
  @ViewChild('dmplayer') dmplayer!: DailymotionPlayerComponent;
  colors = Color;

}
