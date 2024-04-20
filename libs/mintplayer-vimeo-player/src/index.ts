import { ApiLoader } from "@mintplayer/player-provider";

export const vimeoLoader: ApiLoader = () => import('@mintplayer/vimeo-player/api').then(m => new m.VimeoApiService());