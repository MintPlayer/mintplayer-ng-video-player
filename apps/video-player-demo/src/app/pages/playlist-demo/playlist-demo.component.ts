import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { PlayerProgress } from '@mintplayer/ng-player-progress';
import { ERepeatMode, PlaylistController } from '@mintplayer/ng-playlist-controller';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { Subject, takeUntil } from 'rxjs';
import { Video } from '../../interfaces/video';
import { EPlayerState } from '@mintplayer/ng-player-player-provider';

@Component({
  selector: 'mintplayer-ng-video-player-playlist-demo',
  templateUrl: './playlist-demo.component.html',
  styleUrls: ['./playlist-demo.component.scss']
})
export class PlaylistDemoComponent implements OnDestroy, AfterViewInit {
  constructor(
    playlistController: PlaylistController<Video>,
    private ref: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.playlistController = playlistController;
    this.playlistController.video$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((video) => {
        if (this.isViewInited) {
          if (video !== null) {
            this.video = video;
            this.player.setUrl(video.url);
            // this.ref.detectChanges();
          } else {
            this.video = null;
            this.player.setUrl(null);
            // this.ref.detectChanges();
          }
        }
      });

    const enumValues = Object.values(ERepeatMode);
    this.repeatOptions = enumValues.slice(enumValues.length / 2)
      .map((id) => {
        const id_num = <number>id;
        return { id: id_num, text: <string>enumValues[id_num] };
      });
  }
  
  private isViewInited = false;
  private destroyed$ = new Subject();

  @ViewChild('player') player!: VideoPlayerComponent;
  repeatOptions: any[];
  title = 'playlist';
  colors = Color;
  playlistController: PlaylistController<Video>;
  video: Video | null = null;
  videos: Video[] = [
    { url: 'https://www.youtube.com/watch?v=zp7NtW_hKJI' },
    { url: 'https://www.youtube.com/watch?v=cxKOn1gB92c' },
    { url: 'https://www.youtube.com/watch?v=lzkKzZmRZk8' },
  ];


  ngAfterViewInit() {
    this.isViewInited = true;
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
  }

  addVideoToPlaylist(video: Video) {
    this.playlistController.addToPlaylist(video);
  }

  removeVideo(video: Video) {
    this.playlistController.removeFromPlaylist(video);
  }

  onPlayerStateChange(playerState: EPlayerState) {
    switch (playerState) {
      case EPlayerState.ended: {
        this.zone.run(() => {
          this.playlistController.playerEnded();
        });
        break;
      }
    }
  }

  onProgressChange(progress: PlayerProgress) {
    this.playlistController.currentVideoPosition = progress.currentTime;
  }

  onPrevious() {
    this.playlistController.previous();
  }

  onNext() {
    this.playlistController.next();
  }

  get repeat() {
    return this.playlistController.repeat;
  }
  set repeat(value: ERepeatMode) {
    this.playlistController.repeat = value;
  }

  get shuffle() {
    return this.playlistController.shuffle;
  }
  set shuffle(value: boolean) {
    this.playlistController.shuffle = value;
  }

  getChecked($event: Event) {
    return (<HTMLInputElement>$event.target).checked;
  }
}
