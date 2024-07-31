import { ApiPlugin } from "@mintplayer/player-provider";

export const mixCloudPlugin: ApiPlugin = () => import('@mintplayer/mixcloud-player/api').then(m => new m.MixcloudApiService());
