import { ApiLoader } from "@mintplayer/player-provider";

export const mixCloudPlugin: ApiLoader = () => import('@mintplayer/mixcloud-player/api').then(m => new m.MixcloudApiService());