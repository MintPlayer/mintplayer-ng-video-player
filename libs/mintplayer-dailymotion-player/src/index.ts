import { ApiLoader } from '@mintplayer/player-provider';

export const dailymotionApiLoader: ApiLoader = () => import('@mintplayer/dailymotion-player/service').then(m => new m.DailymotionApiService());