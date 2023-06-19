import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { EPlayerState } from '@mintplayer/ng-player-provider';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-soundcloud-demo',
  templateUrl: './soundcloud-demo.component.html',
  styleUrls: ['./soundcloud-demo.component.scss']
})
export class SoundcloudDemoComponent implements AfterViewInit {

  title = 'SoundCloud player';
  currentTime = 0;
  colors = Color;
  playerState = EPlayerState.unstarted;
  playerStates = EPlayerState;
  size = { width: 400, height: 200 };
  autoplay = true;
  @ViewChild('player') player!: VideoPlayerComponent;
  videoUrlInput = 'https://soundcloud.com/dario-g/sunchyme-radio-edit';

  ngAfterViewInit() {
    this.player.setUrl('https://soundcloud.com/oasisofficial/whatever');
  }

  playVideo() {
    this.player.setUrl(this.videoUrlInput);
  }


  play() {
    this.player.playerState = EPlayerState.playing;
  }
  
  pause() {
    this.player.playerState = EPlayerState.paused;
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

  onStateChange(state: EPlayerState) {
    this.playerState = state;
  }
}
