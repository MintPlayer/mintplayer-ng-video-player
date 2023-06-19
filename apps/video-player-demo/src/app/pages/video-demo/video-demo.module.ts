import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';

import { YoutubeApiModule } from '@mintplayer/ng-youtube-player';
import { DailymotionApiModule } from '@mintplayer/ng-dailymotion-player';
import { VimeoApiModule } from '@mintplayer/ng-vimeo-player';
import { SoundcloudApiModule } from '@mintplayer/ng-soundcloud-player';


@NgModule({
  declarations: [
    VideoDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BsFormModule,
    BsGridModule,
    BsRangeModule,
    BsListGroupModule,
    BsInputGroupModule,
    BsButtonTypeModule,
    BsButtonGroupModule,
    BsToggleButtonModule,
    VideoPlayerModule,
    YoutubeApiModule,
    DailymotionApiModule,
    VimeoApiModule,
    SoundcloudApiModule,
    VideoDemoRoutingModule
  ]
})
export class VideoDemoModule { }
