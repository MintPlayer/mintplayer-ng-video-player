import { ApiPlugin } from "@mintplayer/player-provider";

export const vimeoPlugin: ApiPlugin = () => import('../api').then(m => new m.VimeoApiService());
