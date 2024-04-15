import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { FacebookApiService } from './facebook-api.service';

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: FacebookApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class FacebookPlayerModule {}

// export function provideFacebookPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: FacebookApiService
//   }];
// }