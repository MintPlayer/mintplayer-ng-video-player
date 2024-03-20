import { ApiLoader } from "@mintplayer/player-provider";

export const facebookLoader: ApiLoader = () => import('@mintplayer/facebook-player/api').then(m => new m.FacebookApiService());