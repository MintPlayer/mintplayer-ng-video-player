import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { CdkPortal, ComponentPortal, DomPortal, Portal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { EPlayerState, VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { PlayerStateCache } from '../../interfaces/player-state-cache';
import { delay, filter, take } from 'rxjs';

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

  constructor(private overlay: Overlay, private renderer: Renderer2) { }

  // npm start -- --open
  // npm run nx run-many -- --target=build --projects=ng-youtube-player-demo --with-deps

  @ViewChild('videoPlayer') videoPlayer!: VideoPlayerComponent;
  @ViewChild('videoWrapper') videoWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('videoPlayer', { read: ElementRef }) videoPlayerElement!: ElementRef<VideoPlayerComponent>;
  @ViewChild('theTitle') theTitle!: ElementRef<HTMLHeadingElement>;
  playVideo(video: string) {
    // Pick one here
    // this.url = video; // This will not replay the video when the url is the same.
    this.videoPlayer.setUrl(video); // This will replay the video when the url is the same.

    return false;
  }

  titlePortal: Portal<HTMLHeadingElement> | null = null;
  titleOverlay: OverlayRef | null = null;
  playerPortal: Portal<HTMLDivElement> | null = null;
  playerOverlay: OverlayRef | null = null;
  moveToOverlay(element: HTMLHeadingElement | VideoPlayerComponent) {
    if ('currentTime' in element) {
      // const wrapper = this.renderer.createElement('div');
      // const elem = <any>this.videoPlayerElement.nativeElement;
      // this.renderer.insertBefore(elem.parentNode, wrapper, elem);
      // this.renderer.appendChild(wrapper, elem);
      VideoPlayerComponent.presetState = {
        startSeconds: this.videoPlayer.currentTime
      };
      console.log('preserving state', {
        presetState: VideoPlayerComponent.presetState,
      });
      
      this.playerPortal = new DomPortal(this.videoWrapper);
      
      this.playerOverlay = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        positionStrategy: this.overlay.position()
        .global().bottom('20px').right('20px')
      });
      this.playerOverlay.attach(this.playerPortal);
      this.videoPlayer.seek(VideoPlayerComponent.presetState.startSeconds);

      // console.log('element', element);
      // element.getplayerState().then((playerState) => {
      //   if (this.playerPortal && this.playerOverlay) {
      //     const state = { currentTime: element.currentTime, playerState: playerState };
      //     console.log('state', state);
      //     const instance = this.playerOverlay.attach(this.playerPortal);
      //     this.videoPlayer..changeDetectorRef.detectChanges();
      //     element['isPlayerReady$'].pipe(filter(r => r), take(1)).subscribe((ready) => {
      //       console.log('seek now');
      //       // setTimeout(() => {
      //         element.playerStateChange.pipe(take(1)).subscribe((state) => {
      //           console.log('the player state', state);
      //         });
      //         // element['playerSta'].pipe(filter(req => !!req && !!req.id), take(1), delay(500)).subscribe(() => {
      //         //   console.log('seek now 2');
      //         //   element.seek(state.currentTime);
      //         // });
      //       // }, 50);
      //     });
      //     // setTimeout(() => {
      //     //   element.playerState = state.playerState;
      //     //   console.log('setting', state.playerState);
      //     // }, 200);
      //   }
      // });
        // console.log('instance', {instance, elem, playerPortal: this.playerPortal});
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

  playerStateCache: PlayerStateCache | null = null;
  removeFromOverlay(what: 'title' | 'video') {
    if (what === 'title') {
      this.titleOverlay?.detach();
      this.titleOverlay?.dispose();
      this.titleOverlay = null;
    } else {
      VideoPlayerComponent.presetState = {
        startSeconds: this.videoPlayer.currentTime
      };


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
