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

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';

import { YoutubePlayerModule } from '@mintplayer/ng-youtube-player';
import { DailymotionPlayerModule } from '@mintplayer/ng-dailymotion-player';
import { VimeoPlayerModule } from '@mintplayer/ng-vimeo-player';
import { SoundcloudPlayerModule } from '@mintplayer/ng-soundcloud-player';
import { SpotifyPlayerModule } from '@mintplayer/ng-spotify-player';
import { TwitchPlayerModule } from '@mintplayer/ng-twitch-player';
import { MixcloudPlayerModule } from '@mintplayer/ng-mixcloud-player';


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
    
    YoutubePlayerModule,
    DailymotionPlayerModule,
    VimeoPlayerModule,
    SoundcloudPlayerModule,
    SpotifyPlayerModule,
    TwitchPlayerModule,
    MixcloudPlayerModule,

    VideoDemoRoutingModule
  ]
})
export class VideoDemoModule { }
