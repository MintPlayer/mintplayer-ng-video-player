import { ApiPlugin } from "@mintplayer/player-provider";

export const filePlugin: ApiPlugin = () => import('../api').then(m => new m.FileApiService());
