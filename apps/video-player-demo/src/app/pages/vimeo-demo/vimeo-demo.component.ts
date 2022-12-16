import { Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { VimeoPlayerComponent } from '@mintplayer/ng-vimeo-player';

@Component({
  selector: 'mintplayer-ng-video-player-vimeo-demo',
  templateUrl: './vimeo-demo.component.html',
  styleUrls: ['./vimeo-demo.component.scss']
})
export class VimeoDemoComponent {
  @ViewChild('player1') player1!: VimeoPlayerComponent;

  title = 'Vimeo player';
  colors = Color;
  playedVideoId: string | null = null;
  volume = 0.5;
  isPip = false;
  width = 400;
  height = 300;

  playVideo() {
    this.playedVideoId = '14190306';
  }
}
