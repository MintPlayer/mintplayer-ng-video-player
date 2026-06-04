import { ApiPlugin } from "@mintplayer/player-provider";

export const facebookPlugin: ApiPlugin = () => import('../api').then(m => new m.FacebookApiService());
