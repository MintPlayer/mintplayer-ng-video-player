import { ApiLoader } from "@mintplayer/player-provider";

export const wistiaPlugin: ApiLoader = () => import('@mintplayer/wistia-player/api').then(m => new m.WistiaService());