// import { Injectable } from '@angular/core';
// import { EPlayerType } from '../../enums/';
// import { PlatformWithId } from '../../interfaces/platform-with-id';
// import { PlatformWithRegexes } from '../../interfaces/platform-with-regexes';

// @Injectable({
//   providedIn: 'root'
// })
// export class PlayerTypeFinderService {

//   public getPlatformWithId(url: string) {
//     const platforms: PlatformWithRegexes[] = [{
//       platform: EPlayerType.youtube,
//       regexes: 
//     }, {
//       platform: EPlayerType.dailymotion,
//       regexes: 
//     }, {
//       platform: EPlayerType.vimeo,
//       regexes: 
//     }, {
//       platform: EPlayerType.soundcloud,
//       regexes: 
//     }];

//     const platformIds = platforms.map<PlatformWithId | null>(p => {
//       const matches = p.regexes.map(r => r.exec(url)).filter(r => r !== null);
//       if (matches.length === 0) {
//         return null;
//       } else if (matches[0] === null) {
//         return null;
//       } else if ((<any>matches[0]).groups == null) {
//         return null;
//       } else {
//         return {
//           platform: p.platform,
//           id: (<any>matches[0]).groups.id
//         };
//       }
//     }).filter(p => (p !== null));

//     if (platformIds.length === 0) {
//       return null;
//     } else {
//       return platformIds[0];
//     }
//   }

// }