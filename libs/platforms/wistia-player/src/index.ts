import { ApiPlugin } from "@mintplayer/player-provider";

export const wistiaPlugin: ApiPlugin = () => import('../api').then(m => new m.WistiaService());
