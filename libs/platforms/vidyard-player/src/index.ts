import { ApiPlugin } from "@mintplayer/player-provider";

export const vidyardPlugin: ApiPlugin = () => import('@mintplayer/vidyard-player/api').then(m => new m.VidyardService());
