import { ApiLoader } from "@mintplayer/player-provider";

export const vimeoPlugin: ApiLoader = () => import('@mintplayer/vimeo-player/api').then(m => new m.VimeoApiService());