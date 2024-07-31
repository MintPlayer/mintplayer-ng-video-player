import { ApiPlugin } from "@mintplayer/player-provider";

export const youtubePlugin: ApiPlugin = () => import('@mintplayer/youtube-player/api').then(m => new m.YoutubeApiService());
