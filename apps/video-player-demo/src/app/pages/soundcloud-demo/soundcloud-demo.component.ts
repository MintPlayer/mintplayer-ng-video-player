import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { PlayerState, SoundcloudPlayerComponent } from '@mintplayer/ng-soundcloud-player';

@Component({
  selector: 'mintplayer-ng-video-player-soundcloud-demo',
  templateUrl: './soundcloud-demo.component.html',
  styleUrls: ['./soundcloud-demo.component.scss']
})
export class SoundcloudDemoComponent implements AfterViewInit {

  title = 'SoundCloud player';
  currentTime = 0;
  playerState = PlayerState.UNSTARTED;
  playerStates = PlayerState;
  size = { width: 400, height: 200 };
  autoplay = true;
  @ViewChild('player') player!: SoundcloudPlayerComponent;
  videoUrlInput = 'https://soundcloud.com/dario-g/sunchyme-radio-edit';

  ngAfterViewInit() {
    this.player.playVideo('https://soundcloud.com/oasisofficial/whatever');
  }


  playVideo() {
    this.player.playVideo(this.videoUrlInput);
  }


  play() {
    this.player.play();
  }
  
  pause() {
    this.player.pause();
  }

  resize() {
    this.size = { width: 200, height: 100 };
  }

  setAutoplay(target: any) {
    this.autoplay = target.checked;
  }

  onProgressChange(event: PlayerProgress) {
    this.currentTime = event.currentTime;
  }

  onStateChange(state: PlayerState) {
    this.playerState = state;
  }
}
