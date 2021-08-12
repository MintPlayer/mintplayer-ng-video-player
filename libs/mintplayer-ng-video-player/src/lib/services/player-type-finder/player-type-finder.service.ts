import { Injectable } from '@angular/core';
import { PlayerType } from '../../enums';
import { PlatformWithId } from '../../interfaces';
import { PlatformWithRegexes } from '../../interfaces/platform-with-regexes';

@Injectable({
  providedIn: 'root'
})
export class PlayerTypeFinderService {

  constructor() {
  }
  
  public getPlatformWithId(url: string) {
    const platforms: PlatformWithRegexes[] = [{
      platform: PlayerType.youtube,
      regexes: [
        // new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>.+)/, 'g'),
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
        new RegExp(/http[s]{0,1}:\/\/m\.youtube\.com\/watch\?v=(?<id>[^&]+)/, 'g'),
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>.+)$/, 'g'),
      ]
    }, {
      platform: PlayerType.dailymotion,
      regexes: [
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}dailymotion\.com\/video\/(?<id>[0-9A-Za-z]+)$/, 'g'),
      ]
    }, {
      platform: PlayerType.vimeo,
      regexes: [
        new RegExp(/http[s]{0,1}:\/\/(www\.){0,1}vimeo\.com\/(?<id>[0-9]+)$/, 'g'),
      ]
    }, {
      platform: PlayerType.soundcloud,
      regexes: [
        new RegExp(/(?<id>http[s]{0,1}:\/\/(www\.){0,1}soundcloud\.com\/.+)$/, 'g'),
      ]
    }];

    let platformIds = platforms.map<PlatformWithId | null>(p => {
      let matches = p.regexes.map(r => r.exec(url)).filter(r => r !== null);
      if (matches.length === 0) {
        return null;
      } else if (matches[0] === null) {
        return null;
      } else if (matches[0].groups == null) {
        return null;
      } else {
        return {
          platform: p.platform,
          id: matches[0].groups.id
        };
      }
    }).filter(p => (p !== null));

    if (platformIds.length === 0) {
      return null;
    } else {
      return platformIds[0];
    }
  }

}
