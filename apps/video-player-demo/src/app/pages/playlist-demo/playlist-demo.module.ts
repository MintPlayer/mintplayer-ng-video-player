import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';
import { PlaylistControllerModule } from '@mintplayer/ng-playlist-controller';

import { PlaylistDemoRoutingModule } from './playlist-demo-routing.module';
import { PlaylistDemoComponent } from './playlist-demo.component';


@NgModule({
  declarations: [
    PlaylistDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    VideoPlayerModule,
    PlaylistControllerModule,
    PlaylistDemoRoutingModule
  ]
})
export class PlaylistDemoModule { }
