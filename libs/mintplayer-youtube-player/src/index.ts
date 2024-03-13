import { ApiLoader } from '@mintplayer/player-provider';

export const youtubeApiLoader: ApiLoader = () => import('@mintplayer/youtube-player/service').then(m => new m.YoutubeApiService());