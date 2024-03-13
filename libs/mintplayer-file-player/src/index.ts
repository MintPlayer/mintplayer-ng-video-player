import { ApiLoader } from '@mintplayer/player-provider';

export const fileApiLoader: ApiLoader = () => import('@mintplayer/file-player/service').then(m => new m.FileApiService());