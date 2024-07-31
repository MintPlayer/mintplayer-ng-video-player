import { ApiLoader } from "@mintplayer/player-provider";

export const dailymotionPlugin: ApiLoader = () => import('@mintplayer/dailymotion-player/api').then(m => new m.DailymotionApiService());