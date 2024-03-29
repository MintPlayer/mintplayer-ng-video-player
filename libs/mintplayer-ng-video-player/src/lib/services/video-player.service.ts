import { Inject, Injectable } from '@angular/core';
import { IApiService, VIDEO_APIS } from '@mintplayer/ng-player-provider';
import { VideoRequest } from '../interfaces/video-request';

@Injectable()
export class VideoPlayerService {

  constructor(@Inject(VIDEO_APIS) private apis: IApiService[]) { }

  public findApis(url: string) {
    const matchingApis = this.apis
      .map(api => {
        const matches = api.urlRegexes
          .map(rgx => new RegExp(rgx).exec(url))
          .filter(r => r !== null);

        if (matches.length === 0) {
          return null;
        } else if (matches[0] === null) {
          return null;
        } else if (!matches[0].groups) {
          return null;
        } else {
          if (api.match2id) {
            const realId = api.match2id(matches[0]);
            return <VideoRequest>{
              api,
              id: realId
            };
          } else {
            return <VideoRequest>{
              api,
              id: matches[0].groups['id']
            };
          }
        }
      })
      .filter(p => (p !== null))
      .map(p => p!);
    
    return matchingApis;
  }

}
