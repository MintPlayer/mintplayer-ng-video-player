import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { MixcloudApiService } from './mixcloud-api.service';

@NgModule({
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: MixcloudApiService
  }],
  exports: [VideoPlayerComponent]
})
export class MixcloudPlayerModule {}
