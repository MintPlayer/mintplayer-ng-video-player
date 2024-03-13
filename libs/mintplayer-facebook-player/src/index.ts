import { ApiLoader } from '@mintplayer/player-provider';

export const facebookApiLoader: ApiLoader = () => import('@mintplayer/facebook-player/service').then(m => new m.FacebookApiService());