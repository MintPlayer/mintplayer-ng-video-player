import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';

@NgModule({
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: FacebookApiService
  }],
  exports: [VideoPlayerComponent]
})
export class FacebookPlayerModule {}
