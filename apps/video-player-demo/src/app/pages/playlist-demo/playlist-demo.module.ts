import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsIconModule } from '@mintplayer/ng-bootstrap/icon';
import { BsSelectModule } from '@mintplayer/ng-bootstrap/select';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
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

import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';

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
    BsIconModule,
    BsSelectModule,
    BsListGroupModule,
    BsButtonTypeModule,
    BsToggleButtonModule,

    VideoPlayerComponent,

    PlaylistDemoRoutingModule
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
export class PlaylistDemoModule { }
