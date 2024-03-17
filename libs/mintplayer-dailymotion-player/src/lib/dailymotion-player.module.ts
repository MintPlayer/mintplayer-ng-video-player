import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/player-provider';
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { DailymotionApiService } from './dailymotion-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: DailymotionApiService
  }],
  exports: [VideoPlayerComponent]
})
export class DailymotionPlayerModule { }
