import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { CanvasResizerDirective, CanvasResizerModule } from '@mintplayer/ng-canvas-resizer';
import { FileApiService } from './file-api.service';

@NgModule({
  imports: [CommonModule, CanvasResizerModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: FileApiService
  }],
  exports: [CanvasResizerDirective]
})
export class FilePlayerModule {}
