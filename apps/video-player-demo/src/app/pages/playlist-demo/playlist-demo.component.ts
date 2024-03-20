import { AfterViewInit, ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { PlayerProgress } from '@mintplayer/player-progress';
import { ERepeatMode, PlaylistController } from '@mintplayer/playlist-controller';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { Video } from '../../interfaces/video';
import { EPlayerState, loadApi } from '@mintplayer/player-provider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { youtubeLoader } from '@mintplayer/youtube-player';
import { dailyMotionLoader } from '@mintplayer/dailymotion-player';
import { vimeoLoader } from '@mintplayer/vimeo-player';
import { soundCloudLoader } from '@mintplayer/soundcloud-player';
import { mixCloudLoader } from '@mintplayer/mixcloud-player';
import { twitchLoader } from '@mintplayer/twitch-player';
import { spotifyLoader } from '@mintplayer/spotify-player';
import { streamableLoader } from '@mintplayer/streamable-player';
import { facebookLoader } from '@mintplayer/facebook-player';
import { fileLoader } from '@mintplayer/file-player';
import { vidyardLoader } from '@mintplayer/vidyard-player';
import { wistiaLoader } from '@mintplayer/wistia-player';

@Component({
  selector: 'mintplayer-ng-video-player-playlist-demo',
  templateUrl: './playlist-demo.component.html',
  styleUrls: ['./playlist-demo.component.scss']
})
export class PlaylistDemoComponent implements AfterViewInit {
  constructor(
    private ref: ChangeDetectorRef,
    private zone: NgZone
  ) {
    loadApi(youtubeLoader, dailyMotionLoader, vimeoLoader, soundCloudLoader, mixCloudLoader, twitchLoader,
      spotifyLoader, streamableLoader, facebookLoader, fileLoader, vidyardLoader, wistiaLoader);

    this.playlistController = new PlaylistController<Video>();
    this.playlistController.video$
      .pipe(takeUntilDestroyed())
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
