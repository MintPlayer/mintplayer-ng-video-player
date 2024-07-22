import { ApiLoader } from "@mintplayer/player-provider";

export const fileLoader: ApiLoader = () => import('@mintplayer/file-player/api').then(m => new m.FileApiService());