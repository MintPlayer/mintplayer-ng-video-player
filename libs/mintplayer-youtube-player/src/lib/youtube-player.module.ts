import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/player-provider';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { YoutubeApiService } from './youtube-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: YoutubeApiService
  }],
  exports: [VideoPlayerComponent]
})
export class YoutubePlayerModule { }
