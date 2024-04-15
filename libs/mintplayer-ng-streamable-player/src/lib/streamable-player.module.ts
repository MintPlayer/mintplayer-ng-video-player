import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { StreamableService } from './services/streamable-api.service';

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: StreamableService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class StreamablePlayerModule {}


// export function provideStreamablePlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: StreamableService
//   }];
// }