import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { WistiaService } from './services/wistia.service';

// @NgModule({
//   imports: [CommonModule],
//   providers: [{
//     provide: VIDEO_APIS,
//     useClass: WistiaService,
//     multi: true
//   }]
// })
// export class WistiaPlayerModule {}


// export function provideWistiaPlayer(): Provider[] {
//   return [{
//     provide: VIDEO_APIS,
//     multi: true,
//     useClass: WistiaService
//   }];
// }