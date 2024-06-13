import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsAlertModule } from '@mintplayer/ng-bootstrap/alert';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsInputGroupComponent } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupComponent } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';

import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { youtubeLoader } from '@mintplayer/youtube-player';
import { dailymotionLoader } from '@mintplayer/dailymotion-player';
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
    BsInputGroupComponent,
    BsButtonTypeDirective,
    BsButtonGroupComponent,
    BsToggleButtonModule,
    BsAlertModule,
   
    VideoPlayerComponent,
    
    VideoDemoRoutingModule
  ],
  providers: [
    provideVideoApis(
      youtubeLoader,
      dailymotionLoader,
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
export class VideoDemoModule { }
