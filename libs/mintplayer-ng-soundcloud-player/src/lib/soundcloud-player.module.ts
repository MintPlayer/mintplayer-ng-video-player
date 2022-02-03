import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundcloudPlayerComponent } from './components/soundcloud-player/soundcloud-player.component';

@NgModule({
  imports: [CommonModule],
  declarations: [SoundcloudPlayerComponent],
  exports: [SoundcloudPlayerComponent],
})
export class SoundcloudPlayerModule {}
