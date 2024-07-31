import { ApiPlugin } from "@mintplayer/player-provider";

export const vimeoPlugin: ApiPlugin = () => import('@mintplayer/vimeo-player/api').then(m => new m.VimeoApiService());
