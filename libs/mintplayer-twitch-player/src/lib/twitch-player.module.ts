import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { VIDEO_APIS } from "@mintplayer/player-provider";
import { VideoPlayerComponent, VideoPlayerModule } from '@mintplayer/ng-video-player';
import { TwitchApiService } from "./services/twitch-api.service";

@NgModule({
  imports: [CommonModule, VideoPlayerModule],
  providers: [{
    provide: VIDEO_APIS,
    multi: true,
    useClass: TwitchApiService
  }],
  exports: [VideoPlayerComponent]
})
export class TwitchPlayerModule {
}
