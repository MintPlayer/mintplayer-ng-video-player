import { ApiPlugin } from "@mintplayer/player-provider";

export const mixCloudPlugin: ApiPlugin = () => import('../api').then(m => new m.MixcloudApiService());
