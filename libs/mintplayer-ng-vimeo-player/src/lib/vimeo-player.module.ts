import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { VimeoApiService } from './vimeo-api.service';

// @NgModule({
//   declarations: [],
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: VimeoApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class VimeoPlayerModule { }


// export function provideVimeoPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: VimeoApiService
//   }];
// }