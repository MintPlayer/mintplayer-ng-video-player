import { ApiLoader } from "@mintplayer/player-provider";

export const soundCloudPlugin: ApiLoader = () => import('@mintplayer/soundcloud-player/api').then(m => new m.SoundcloudApiService());