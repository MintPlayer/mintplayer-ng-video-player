import { ApiLoader } from '@mintplayer/ng-player-provider';

export const youtubeApiLoader: ApiLoader = () => import('@mintplayer/ng-youtube-player/service').then(m => new m.YoutubeApiService());