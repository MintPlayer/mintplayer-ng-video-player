import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-player-provider';
import { VimeoApiService } from './vimeo-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: VimeoApiService
  }]
})
export class VimeoApiModule { }
