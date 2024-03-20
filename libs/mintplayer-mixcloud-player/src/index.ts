import { ApiLoader } from "@mintplayer/player-provider";

export const mixCloudLoader: ApiLoader = () => import('@mintplayer/mixcloud-player/api').then(m => new m.MixcloudApiService());