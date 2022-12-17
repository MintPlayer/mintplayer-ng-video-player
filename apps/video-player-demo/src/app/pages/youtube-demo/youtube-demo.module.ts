import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubePlayerModule } from '@mintplayer/ng-youtube-player';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';

import { YoutubeDemoRoutingModule } from './youtube-demo-routing.module';
import { YoutubeDemoComponent } from './youtube-demo.component';


@NgModule({
  declarations: [
    YoutubeDemoComponent
  ],
  imports: [
    CommonModule,
    YoutubePlayerModule,
    BsButtonTypeModule,
    YoutubeDemoRoutingModule
  ]
})
export class YoutubeDemoModule { }
