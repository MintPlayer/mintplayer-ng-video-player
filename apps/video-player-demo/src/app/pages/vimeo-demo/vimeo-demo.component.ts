import { Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-vimeo-demo',
  templateUrl: './vimeo-demo.component.html',
  styleUrls: ['./vimeo-demo.component.scss']
})
export class VimeoDemoComponent {
  @ViewChild('player1') player1!: VideoPlayerComponent;

  title = 'Vimeo player';
  colors = Color;
  volume = 0.5;
  isPip = false;
  width = 400;
  height = 300;

  playVideo() {
    this.player1.setUrl('https://vimeo.com/14190306');
  }
}
