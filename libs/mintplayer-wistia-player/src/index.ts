import { ApiLoader } from '@mintplayer/player-provider';

export const wistiaApiLoader: ApiLoader = () => import('@mintplayer/wistia-player/service').then(m => new m.WistiaService());