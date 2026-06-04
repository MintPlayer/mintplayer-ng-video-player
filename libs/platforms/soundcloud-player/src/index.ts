import { ApiPlugin } from "@mintplayer/player-provider";

export const soundCloudPlugin: ApiPlugin = () => import('../api').then(m => new m.SoundcloudApiService());
