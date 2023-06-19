import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-youtube-demo',
  templateUrl: './youtube-demo.component.html',
  styleUrls: ['./youtube-demo.component.scss']
})
export class YoutubeDemoComponent implements AfterViewInit {
  title = 'YouTube player';
  colors = Color;

  @ViewChild('player1') player1!: VideoPlayerComponent;
  ngAfterViewInit() {
    this.player1.setUrl('https://youtube.com/watch?v=jNQXAC9IVRw');
  }
}
