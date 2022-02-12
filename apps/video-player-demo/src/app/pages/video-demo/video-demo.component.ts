import { Component, ElementRef, ViewChild } from '@angular/core';
import { CdkPortal, DomPortal, Portal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { EPlayerState, VideoPlayerComponent } from '@mintplayer/ng-video-player';

@Component({
  selector: 'mintplayer-ng-video-player-video-demo',
  templateUrl: './video-demo.component.html',
  styleUrls: ['./video-demo.component.scss']
})
export class VideoDemoComponent {

  title = 'video-player-demo';
  url = '';
  playerStates = EPlayerState;
  playerState!: EPlayerState;
  width = 800;
  height = 600;
  volume = 0;
  isMuted = false;
  isPip = false;
  progress: PlayerProgress = {
    currentTime: 0,
    duration: 0
  };
  
  videos: string[] = [
    'https://www.youtube.com/watch?v=tt2k8PGm-TI',
    'https://www.youtube.com/watch?v=YykjpeuMNEk',
    'https://www.youtube.com/watch?v=yFKhgF_vkgs',
    'https://www.dailymotion.com/video/x2yhuhb',
    'https://vimeo.com/14190306',
    'https://vimeo.com/82932655',
    'https://soundcloud.com/dario-g/sunchyme-radio-edit',
    'https://soundcloud.com/oasisofficial/whatever',
  ];

  constructor(private overlay: Overlay) { }

  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  @ViewChild('videoPlayer') videoPlayer!: VideoPlayerComponent;
  @ViewChild('videoWrapper') videoWrapper!: ElementRef<HTMLDivElement>;
  // @ViewChild('videoPlayer') videoPlayerElement!: ElementRef<VideoPlayerComponent>;
  @ViewChild('theTitle') theTitle!: ElementRef<HTMLHeadingElement>;
  playVideo(video: string) {
    // Pick one here
    // this.url = video; // This will not replay the video when the url is the same.
    this.videoPlayer.setUrl(video); // This will replay the video when the url is the same.

    return false;
  }

  titlePortal: Portal<HTMLHeadingElement> | null = null;
  titleOverlay: OverlayRef | null = null;
  playerPortal: Portal<HTMLHeadingElement> | null = null;
  playerOverlay: OverlayRef | null = null;
  moveToOverlay(element: HTMLHeadingElement | VideoPlayerComponent) {
    if ('currentTime' in element) {
      this.playerPortal = new DomPortal(this.videoWrapper);
      
      this.playerOverlay = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        positionStrategy: this.overlay.position()
        .global().bottom('20px').right('20px')
      });
      
      const instance = this.playerOverlay.attach(this.playerPortal);
    } else {
      this.titlePortal = new DomPortal(element);
      
      this.titleOverlay = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        positionStrategy: this.overlay.position()
        .global().bottom('20px').right('20px')
      });
      
      const instance = this.titleOverlay.attach(this.titlePortal);
    }
  }

  removeFromOverlay(what: 'title' | 'video') {
    if (what === 'title') {
      this.titleOverlay?.detach();
      this.titleOverlay?.dispose();
      this.titleOverlay = null;
    } else {
      this.playerOverlay?.detach();
      this.playerOverlay?.dispose();
      this.playerOverlay = null;
    }
  }

  async getTitle() {
    const title = await this.videoPlayer.getTitle();
    alert('title\r\n' + title);
  }

  setSize() {
    this.width = 100;
    this.height = 75;
  }

  setMuted(event: Event) {
    this.isMuted = (<any>event.target).checked;
  }

  async requestPip() {
    await this.videoPlayer.setIsPip(true);
  }
  async exitPip() {
    await this.videoPlayer.setIsPip(false);
  }

  play() {
    this.playerState = EPlayerState.playing;
  }
  pause() {
    this.playerState = EPlayerState.paused;
  }

  onProgressChange(progress: PlayerProgress) {
    this.progress = progress;
  }

  onPlayerStateChange(event: EPlayerState) {
    console.log(event);
  }
}
