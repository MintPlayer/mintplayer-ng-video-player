import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { SpotifyApiService } from './services/spotify-api/spotify-api.service';

// @NgModule({
//   imports: [CommonModule, VideoPlayerModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: SpotifyApiService
//   }],
//   exports: [VideoPlayerComponent]
// })
// export class SpotifyPlayerModule {}


// export function provideSpotifyPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: SpotifyApiService
//   }];
// }