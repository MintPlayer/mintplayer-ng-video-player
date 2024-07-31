import { ApiPlugin } from "@mintplayer/player-provider";

export const dailymotionPlugin: ApiPlugin = () => import('@mintplayer/dailymotion-player/api').then(m => new m.DailymotionApiService());
