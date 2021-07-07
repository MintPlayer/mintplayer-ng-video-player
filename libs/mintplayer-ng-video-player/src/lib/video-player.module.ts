import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from './components';

@NgModule({
  imports: [CommonModule],
  declarations: [VideoPlayerComponent],
  exports: [VideoPlayerComponent]
})
export class VideoPlayerModule {}
