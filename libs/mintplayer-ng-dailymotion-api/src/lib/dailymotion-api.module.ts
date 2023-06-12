import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-player-provider';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useValue: 'DailyMotion'
  }]
})
export class DailymotionApiModule { }
