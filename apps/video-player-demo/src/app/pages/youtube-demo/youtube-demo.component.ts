import { AfterViewInit, Component } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';

@Component({
  selector: 'mintplayer-ng-video-player-youtube-demo',
  templateUrl: './youtube-demo.component.html',
  styleUrls: ['./youtube-demo.component.scss']
})
export class YoutubeDemoComponent implements AfterViewInit {
  title = 'YouTube player';
  colors = Color;
  mute = false;
  ngAfterViewInit() {
    setTimeout(() => this.mute = true, 50);
  }
}
