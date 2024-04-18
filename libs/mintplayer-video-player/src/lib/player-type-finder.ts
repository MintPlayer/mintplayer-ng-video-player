// import { VIDEO_APIS } from '@mintplayer/player-provider';
import { IApiService } from '@mintplayer/player-provider';
import { VideoRequest } from './video-request';

export function findApis(url: string, apis: IApiService[]) {
    const matchingApis = apis
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