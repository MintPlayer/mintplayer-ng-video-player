import { ApiPlugin } from "@mintplayer/player-provider";

export const facebookPlugin: ApiPlugin = () => import('@mintplayer/facebook-player/api').then(m => new m.FacebookApiService());
