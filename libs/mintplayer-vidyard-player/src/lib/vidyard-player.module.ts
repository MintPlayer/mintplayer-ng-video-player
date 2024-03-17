import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/player-provider';
import { VidyardService } from './services/vidyard.service';

@NgModule({
  imports: [CommonModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: VidyardService
  }]
})
export class VidyardPlayerModule {}
