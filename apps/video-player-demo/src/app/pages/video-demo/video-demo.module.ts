import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';


@NgModule({
  declarations: [
    VideoDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BsListGroupModule,
    VideoPlayerModule,
    VideoDemoRoutingModule
  ]
})
export class VideoDemoModule { }
