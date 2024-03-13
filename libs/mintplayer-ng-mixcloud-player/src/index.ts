import { ApiLoader } from '@mintplayer/ng-player-provider';

export const mixcloudApiLoader: ApiLoader = () => import('@mintplayer/ng-mixcloud-player/service').then(m => new m.MixcloudApiService());