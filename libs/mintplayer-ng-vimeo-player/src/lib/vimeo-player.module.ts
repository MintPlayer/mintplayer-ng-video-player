import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VimeoPlayerComponent } from './components/vimeo-player/vimeo-player.component';

@NgModule({
  imports: [CommonModule],
  declarations: [VimeoPlayerComponent],
  exports: [VimeoPlayerComponent],
})
export class VimeoPlayerModule {}
