import { ApiLoader } from '@mintplayer/ng-player-provider';

export const fileApiLoader: ApiLoader = () => import('@mintplayer/ng-file-player/service').then(m => new m.FileApiService());