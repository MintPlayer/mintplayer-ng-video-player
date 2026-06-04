import { ApiPlugin } from "@mintplayer/player-provider";

export const twitchPlugin: ApiPlugin = () => import('../api').then(m => new m.TwitchApiService());
