import { ApiPlugin } from "@mintplayer/player-provider";

export const wistiaPlugin: ApiPlugin = () => import('@mintplayer/wistia-player/api').then(m => new m.WistiaService());
