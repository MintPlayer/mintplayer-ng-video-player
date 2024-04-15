import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { FileApiService } from './file-api.service';

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: FileApiService
//   }]
// })
// export class FilePlayerModule {}

// export function provideFilePlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: FileApiService
//   }];
// }