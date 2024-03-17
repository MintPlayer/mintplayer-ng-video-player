import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { SpotifyApiService } from './services/spotify-api/spotify-api.service';

@NgModule({
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: SpotifyApiService
  }],
  exports: [VideoPlayerComponent]
})
export class SpotifyPlayerModule {}
