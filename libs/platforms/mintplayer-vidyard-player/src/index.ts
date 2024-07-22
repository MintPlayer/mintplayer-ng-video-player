import { ApiLoader } from "@mintplayer/player-provider";

export const vidyardLoader: ApiLoader = () => import('@mintplayer/vidyard-player/api').then(m => new m.VidyardService());