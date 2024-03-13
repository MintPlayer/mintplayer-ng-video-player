import { ApiLoader } from '@mintplayer/player-provider';

export const vimeoApiLoader: ApiLoader = () => import('@mintplayer/vimeo-player/service').then(m => new m.VimeoApiService());