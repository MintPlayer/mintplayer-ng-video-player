import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsIconModule } from '@mintplayer/ng-bootstrap/icon';
import { BsSelectModule } from '@mintplayer/ng-bootstrap/select';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { PlaylistControllerModule } from '@mintplayer/ng-playlist-controller';

import { PlaylistDemoRoutingModule } from './playlist-demo-routing.module';
import { PlaylistDemoComponent } from './playlist-demo.component';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';


@NgModule({
  declarations: [
    PlaylistDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BsGridModule,
    BsIconModule,
    BsSelectModule,
    BsListGroupModule,
    BsButtonTypeModule,
    BsToggleButtonModule,
    PlaylistControllerModule,
    PlaylistDemoRoutingModule,
    VideoPlayerModule
  ]
})
export class PlaylistDemoModule { }
