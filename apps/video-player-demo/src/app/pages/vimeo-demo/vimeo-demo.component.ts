import { Component, ViewChild } from '@angular/core';
import { VimeoPlayerComponent } from '@mintplayer/ng-vimeo-player';

@Component({
  selector: 'mintplayer-ng-video-player-vimeo-demo',
  templateUrl: './vimeo-demo.component.html',
  styleUrls: ['./vimeo-demo.component.scss']
})
export class VimeoDemoComponent {
  @ViewChild('player1') player1!: VimeoPlayerComponent;
  @ViewChild('player2') player2!: VimeoPlayerComponent;

  title = 'vimeo-player-demo';
  playedVideoId1: string | null = null;
  playedVideoId2: string | null = null;
  volume = 0.5;
  isPip1 = false;
  isPip2 = false;
  width1 = 400;
  height1 = 300;
  playVideo() {
    this.playedVideoId1 = '1552092';
    this.playedVideoId2 = '14190306';
  }

  togglePip1() {
    this.isPip1 = !this.isPip1;
  }
  togglePip2() {
    this.isPip2 = !this.isPip2;
  }
  changeSize1() {
    this.width1 = 800;
    this.height1 = 600;
  }
}
