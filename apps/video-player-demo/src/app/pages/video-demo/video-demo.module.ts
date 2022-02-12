import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';
import { PortalModule } from '@angular/cdk/portal';


@NgModule({
  declarations: [
    VideoDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    OverlayModule,
    PortalModule,
    VideoPlayerModule,
    VideoDemoRoutingModule
  ]
})
export class VideoDemoModule { }
