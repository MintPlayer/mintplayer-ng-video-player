import { ApiLoader } from '@mintplayer/player-provider';

export const vidyardApiLoader: ApiLoader = () => import('@mintplayer/vidyard-player/service').then(m => new m.VidyardService());