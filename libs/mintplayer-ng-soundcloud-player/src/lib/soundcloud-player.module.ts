import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { SoundcloudApiService } from './services/soundcloud-api/soundcloud-api.service';

// @NgModule({
//   declarations: [],
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: SoundcloudApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class SoundcloudPlayerModule { }

// export function provideSoundcloudPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: SoundcloudApiService
//   }];
// }