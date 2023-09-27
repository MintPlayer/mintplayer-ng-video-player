import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { VideoPlayerService } from './services/video-player.service';

@NgModule({
  imports: [CommonModule],
  declarations: [VideoPlayerComponent],
  exports: [VideoPlayerComponent],
  providers: [VideoPlayerService]
})
export class VideoPlayerModule {}
