import { NgModule, StaticProvider, Type } from '@angular/core';
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

import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { YoutubeApiService } from '@mintplayer/youtube-player/api';
import { VimeoApiService } from '@mintplayer/vimeo-player/api';
import { SoundcloudApiService } from '@mintplayer/soundcloud-player/api';
import { MixcloudApiService } from '@mintplayer/mixcloud-player/api';
import { TwitchApiService } from '@mintplayer/twitch-player/api';
import { SpotifyApiService } from '@mintplayer/spotify-player/api';
import { StreamableService } from '@mintplayer/streamable-player/api';
import { FacebookApiService } from '@mintplayer/facebook-player/api';
import { FileApiService } from '@mintplayer/file-player/api';
import { VidyardService } from '@mintplayer/vidyard-player/api';
import { WistiaService } from '@mintplayer/wistia-player/api';

import { VideoDemoRoutingModule } from './video-demo-routing.module';
import { VideoDemoComponent } from './video-demo.component';

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
   
    VideoPlayerComponent,
    
    VideoDemoRoutingModule
  ],
  providers: [
    provideVideoApis(
      YoutubeApiService,
      VimeoApiService,
      SoundcloudApiService,
      MixcloudApiService,
      TwitchApiService,
      SpotifyApiService,
      StreamableService,
      FacebookApiService,
      FileApiService,
      VidyardService,
      WistiaService
    )
  ]
})
export class VideoDemoModule { }
