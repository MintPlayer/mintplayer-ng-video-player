import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-player-provider';
import { YoutubeApiService } from './youtube-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: YoutubeApiService
  }]
})
export class YoutubeApiModule { }
