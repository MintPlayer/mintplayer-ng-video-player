import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeApiModule } from '@mintplayer/ng-youtube-player';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';

import { YoutubeDemoRoutingModule } from './youtube-demo-routing.module';
import { YoutubeDemoComponent } from './youtube-demo.component';


@NgModule({
  declarations: [
    YoutubeDemoComponent
  ],
  imports: [
    CommonModule,
    YoutubeApiModule,
    BsButtonTypeModule,
    YoutubeDemoRoutingModule
  ]
})
export class YoutubeDemoModule { }
