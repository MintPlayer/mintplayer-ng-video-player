import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailymotionPlayerComponent } from './components/dailymotion-player/dailymotion-player.component';

@NgModule({
  imports: [CommonModule],
  declarations: [DailymotionPlayerComponent],
  exports: [DailymotionPlayerComponent],
})
export class DailymotionPlayerModule {}
