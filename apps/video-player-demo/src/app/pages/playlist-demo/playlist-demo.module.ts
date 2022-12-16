import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsSelectModule } from '@mintplayer/ng-bootstrap/select';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
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
    BsGridModule,
    BsSelectModule,
    BsListGroupModule,
    BsToggleButtonModule,
    VideoPlayerModule,
    PlaylistControllerModule,
    PlaylistDemoRoutingModule
  ]
})
export class PlaylistDemoModule { }
