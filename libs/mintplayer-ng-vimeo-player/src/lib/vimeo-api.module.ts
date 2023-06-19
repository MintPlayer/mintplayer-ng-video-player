import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VimeoApiService } from './vimeo-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: VimeoApiService
  }],
  exports: [VideoPlayerComponent]
})
export class VimeoApiModule { }
