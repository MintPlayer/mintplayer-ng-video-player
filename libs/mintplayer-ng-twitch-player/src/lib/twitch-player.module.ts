import { CommonModule } from "@angular/common";
import { NgModule, Provider } from "@angular/core";
import { VIDEO_APIS } from "@mintplayer/ng-player-provider";
import { TwitchApiService } from "./services/twitch-api.service";

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: TwitchApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class TwitchPlayerModule {
// }


// export function provideTwitchPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: TwitchApiService
//   }];
// }