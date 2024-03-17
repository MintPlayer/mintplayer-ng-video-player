import { ApiLoader } from "@mintplayer/player-provider";

export const dailyMotionLoader: ApiLoader = () => import('@mintplayer/dailymotion-player/api').then(m => new m.DailymotionApiService());