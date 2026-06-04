import { ApiPlugin } from "@mintplayer/player-provider";

export const vidyardPlugin: ApiPlugin = () => import('../api').then(m => new m.VidyardService());
