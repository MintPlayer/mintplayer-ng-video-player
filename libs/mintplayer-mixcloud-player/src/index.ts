import { ApiLoader } from '@mintplayer/player-provider';

export const mixcloudApiLoader: ApiLoader = () => import('@mintplayer/mixcloud-player/service').then(m => new m.MixcloudApiService());