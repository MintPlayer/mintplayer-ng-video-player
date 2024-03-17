import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsAlertModule } from '@mintplayer/ng-bootstrap/alert';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';

import { YoutubePlayerModule } from '@mintplayer/youtube-player';
import { DailymotionPlayerModule } from '@mintplayer/dailymotion-player';
import { VimeoPlayerModule } from '@mintplayer/vimeo-player';
import { SoundcloudPlayerModule } from '@mintplayer/soundcloud-player';
import { SpotifyPlayerModule } from '@mintplayer/spotify-player';
import { TwitchPlayerModule } from '@mintplayer/twitch-player';
import { MixcloudPlayerModule } from '@mintplayer/mixcloud-player';
import { FacebookPlayerModule } from '@mintplayer/facebook-player';
import { VidyardPlayerModule } from '@mintplayer/vidyard-player';
import { WistiaPlayerModule } from '@mintplayer/wistia-player';
import { StreamablePlayerModule } from '@mintplayer/streamable-player';
import { FilePlayerModule } from '@mintplayer/file-player';


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
    BsAlertModule,
    
    YoutubePlayerModule,
    DailymotionPlayerModule,
    VimeoPlayerModule,
    SoundcloudPlayerModule,
    SpotifyPlayerModule,
    TwitchPlayerModule,
    MixcloudPlayerModule,
    FacebookPlayerModule,
    VidyardPlayerModule,
    WistiaPlayerModule,
    StreamablePlayerModule,
    FilePlayerModule,

    VideoDemoRoutingModule
  ]
})
export class VideoDemoModule { }
