import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { YoutubeApiService } from './youtube-api.service';

// @NgModule({
//   declarations: [],
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: YoutubeApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class YoutubePlayerModule { }

// export function provideYoutubePlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: YoutubeApiService
//   }];
// }