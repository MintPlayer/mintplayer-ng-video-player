import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { MixcloudApiService } from './mixcloud-api.service';

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: MixcloudApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class MixcloudPlayerModule {}


// export function provideMixcloudPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: MixcloudApiService
//   }];
// }