import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsIconModule } from '@mintplayer/ng-bootstrap/icon';
import { BsSelectModule } from '@mintplayer/ng-bootstrap/select';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { youtubeLoader } from '@mintplayer/youtube-player';
import { vimeoLoader } from '@mintplayer/vimeo-player';
import { soundCloudLoader } from '@mintplayer/soundcloud-player';
import { mixCloudLoader } from '@mintplayer/mixcloud-player';
import { twitchLoader } from '@mintplayer/twitch-player';
import { spotifyLoader } from '@mintplayer/spotify-player';
import { streamableLoader } from '@mintplayer/streamable-player';
import { facebookLoader } from '@mintplayer/facebook-player';
import { fileLoader } from '@mintplayer/file-player';
import { vidyardLoader } from '@mintplayer/vidyard-player';
import { wistiaLoader } from '@mintplayer/wistia-player';

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
      youtubeLoader,
      vimeoLoader,
      soundCloudLoader,
      mixCloudLoader,
      twitchLoader,
      spotifyLoader,
      streamableLoader,
      facebookLoader,
      fileLoader,
      vidyardLoader,
      wistiaLoader
    )
  ]
})
export class PlaylistDemoModule { }
