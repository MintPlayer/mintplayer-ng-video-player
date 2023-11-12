import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { BsAlertModule } from '@mintplayer/ng-bootstrap/alert';
import { YoutubePlayerModule } from '@mintplayer/ng-youtube-player';
import { DailymotionPlayerModule } from '@mintplayer/ng-dailymotion-player';
import { VimeoPlayerModule } from '@mintplayer/ng-vimeo-player';
import { SoundcloudPlayerModule } from '@mintplayer/ng-soundcloud-player';
import { SpotifyPlayerModule } from '@mintplayer/ng-spotify-player';
import { TwitchPlayerModule } from '@mintplayer/ng-twitch-player';
import { MixcloudPlayerModule } from '@mintplayer/ng-mixcloud-player';
import { FacebookPlayerModule } from '@mintplayer/ng-facebook-player';
import { VidyardPlayerModule } from '@mintplayer/ng-vidyard-player';
import { WistiaPlayerModule } from '@mintplayer/ng-wistia-player';
import { StreamablePlayerModule } from '@mintplayer/ng-streamable-player';
import { FilePlayerModule } from '@mintplayer/ng-file-player';

@NgModule({
  declarations: [AppComponent],
  imports: [
    FormsModule,
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
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
    AppRoutingModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
