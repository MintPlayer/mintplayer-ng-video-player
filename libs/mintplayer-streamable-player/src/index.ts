import { ApiLoader } from '@mintplayer/player-provider';

export const streamableApiLoader: ApiLoader = () => import('@mintplayer/streamable-player/service').then(m => new m.StreamableService());