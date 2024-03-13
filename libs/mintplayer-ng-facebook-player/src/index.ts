import { ApiLoader } from '@mintplayer/ng-player-provider';

export const facebookApiLoader: ApiLoader = () => import('@mintplayer/ng-facebook-player/service').then(m => new m.FacebookApiService());