import { afterNextRender, Component, DestroyRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { Color } from '@mintplayer/ng-bootstrap';
import { PlayerProgress } from '@mintplayer/player-progress';
import { ERepeatMode, PlaylistController } from '@mintplayer/playlist-controller';
import { provideVideoApis, VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { Video } from '../../interfaces/video';
import { EPlayerState } from '@mintplayer/player-provider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { youtubePlugin } from '@mintplayer/youtube-player';
import { dailymotionPlugin } from '@mintplayer/dailymotion-player';
import { vimeoPlugin } from '@mintplayer/vimeo-player';
import { soundCloudPlugin } from '@mintplayer/soundcloud-player';
import { mixCloudPlugin } from '@mintplayer/mixcloud-player';
import { twitchPlugin } from '@mintplayer/twitch-player';
import { spotifyPlugin } from '@mintplayer/spotify-player';
import { streamablePlugin } from '@mintplayer/streamable-player';
import { facebookPlugin } from '@mintplayer/facebook-player';
import { filePlugin } from '@mintplayer/file-player';
import { vidyardPlugin } from '@mintplayer/vidyard-player';
import { wistiaPlugin } from '@mintplayer/wistia-player';
import { FormsModule } from '@angular/forms';
import { BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective } from '@mintplayer/ng-bootstrap/grid';
import { BsSelectComponent, BsSelectValueAccessor } from '@mintplayer/ng-bootstrap/select';
import { BsListGroupComponent, BsListGroupItemComponent } from '@mintplayer/ng-bootstrap/list-group';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';
import { BsCheckboxComponent } from '@mintplayer/ng-bootstrap/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mintplayer-ng-video-player-playlist-demo',
  templateUrl: './playlist-demo.component.html',
  styleUrls: ['./playlist-demo.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, VideoPlayerComponent, BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective, BsSelectComponent, BsSelectValueAccessor, BsListGroupComponent, BsListGroupItemComponent, BsButtonTypeDirective, BsCheckboxComponent],
  providers: [
    provideVideoApis(youtubePlugin, dailymotionPlugin, vimeoPlugin, soundCloudPlugin, mixCloudPlugin, twitchPlugin, spotifyPlugin, streamablePlugin, facebookPlugin, filePlugin, vidyardPlugin, wistiaPlugin)
  ]
})
export class PlaylistDemoComponent {
  constructor(sanitizer: DomSanitizer) {
    this.playlistController = new PlaylistController<Video>();
    const destroyRef = inject(DestroyRef);
    // Once the player exists.
    afterNextRender(() => this.playlistController.video$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((video) => {
        this.video = video;
        // setUrl rather than a [url] binding, so repeating the same video replays it.
        this.player().setUrl(video?.url ?? null);
      }));

    // The player reports `ended` through the two-way binding; it is never written back (#100).
    effect(() => {
      if (this.playerState() === EPlayerState.ended) {
        untracked(() => this.playlistController.playerEnded());
      }
    });

    const enumValues = Object.values(ERepeatMode);
    this.repeatOptions = enumValues.slice(enumValues.length / 2)
      .map((id) => {
        const id_num = <number>id;
        return { id: id_num, text: <string>enumValues[id_num] };
      });

      
    import('bootstrap-icons/icons/trash-fill.svg').then((icon) => {
      this.trashFillIcon = sanitizer.bypassSecurityTrustHtml(icon.default);
    });
  }

  trashFillIcon?: SafeHtml;

  readonly player = viewChild.required(VideoPlayerComponent);
  readonly playerState = signal(EPlayerState.unstarted);
  readonly playerStates = EPlayerState;
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


  addVideoToPlaylist(video: Video) {
    this.playlistController.addToPlaylist(video);
  }

  removeVideo(video: Video) {
    this.playlistController.removeFromPlaylist(video);
  }

  play() {
    this.playerState.set(EPlayerState.playing);
  }

  pause() {
    this.playerState.set(EPlayerState.paused);
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
}
