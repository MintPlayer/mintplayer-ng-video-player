import { ApiPlugin } from "@mintplayer/player-provider";

export const dailymotionPlugin: ApiPlugin = () => import('../api').then(m => new m.DailymotionApiService());
