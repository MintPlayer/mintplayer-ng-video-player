import { ApiPlugin } from "@mintplayer/player-provider";

export const filePlugin: ApiPlugin = () => import('@mintplayer/file-player/api').then(m => new m.FileApiService());
