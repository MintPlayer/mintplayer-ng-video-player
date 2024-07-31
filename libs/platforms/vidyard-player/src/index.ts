import { ApiLoader } from "@mintplayer/player-provider";

export const vidyardPlugin: ApiLoader = () => import('@mintplayer/vidyard-player/api').then(m => new m.VidyardService());