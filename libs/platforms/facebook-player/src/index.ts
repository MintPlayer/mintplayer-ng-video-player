import { ApiLoader } from "@mintplayer/player-provider";

export const facebookPlugin: ApiLoader = () => import('@mintplayer/facebook-player/api').then(m => new m.FacebookApiService());