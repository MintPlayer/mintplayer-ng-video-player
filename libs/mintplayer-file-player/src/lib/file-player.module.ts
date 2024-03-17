import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { FileApiService } from './file-api.service';

@NgModule({
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: FileApiService
  }]
})
export class FilePlayerModule {}
