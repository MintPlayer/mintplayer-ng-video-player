import { ApiLoader } from "@mintplayer/player-provider";

export const wistiaLoader: ApiLoader = () => import('@mintplayer/wistia-player/api').then(m => new m.WistiaService());