import { ApiLoader } from "@mintplayer/player-provider";

export const filePlugin: ApiLoader = () => import('@mintplayer/file-player/api').then(m => new m.FileApiService());