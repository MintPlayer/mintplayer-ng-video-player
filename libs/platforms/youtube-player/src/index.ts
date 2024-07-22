import { ApiLoader } from "@mintplayer/player-provider";

export const youtubeLoader: ApiLoader = () => import('@mintplayer/youtube-player/api').then(m => new m.YoutubeApiService());