import { ApiPlugin } from "@mintplayer/player-provider";

export const soundCloudPlugin: ApiPlugin = () => import('@mintplayer/soundcloud-player/api').then(m => new m.SoundcloudApiService());
