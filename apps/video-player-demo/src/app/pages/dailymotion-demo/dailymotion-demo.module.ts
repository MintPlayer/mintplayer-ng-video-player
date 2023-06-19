import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailymotionApiModule } from '@mintplayer/ng-dailymotion-player';

import { DailymotionDemoRoutingModule } from './dailymotion-demo-routing.module';
import { DailymotionDemoComponent } from './dailymotion-demo.component';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';


@NgModule({
  declarations: [
    DailymotionDemoComponent
  ],
  imports: [
    CommonModule,
    BsButtonTypeModule,
    DailymotionApiModule,
    DailymotionDemoRoutingModule
  ]
})
export class DailymotionDemoModule { }
