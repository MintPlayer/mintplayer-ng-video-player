import { ApiLoader } from "@mintplayer/player-provider";

export const youtubePlugin: ApiLoader = () => import('@mintplayer/youtube-player/api').then(m => new m.YoutubeApiService());