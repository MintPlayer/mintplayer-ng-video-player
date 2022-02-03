import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailymotionPlayerModule } from '@mintplayer/ng-dailymotion-player';

import { DailymotionDemoRoutingModule } from './dailymotion-demo-routing.module';
import { DailymotionDemoComponent } from './dailymotion-demo.component';


@NgModule({
  declarations: [
    DailymotionDemoComponent
  ],
  imports: [
    CommonModule,
    DailymotionPlayerModule,
    DailymotionDemoRoutingModule
  ]
})
export class DailymotionDemoModule { }
