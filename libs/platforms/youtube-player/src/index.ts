import { ApiPlugin } from "@mintplayer/player-provider";

export const youtubePlugin: ApiPlugin = () => import('../api').then(m => new m.YoutubeApiService());
