import { ApiLoader } from "@mintplayer/player-provider";

export const streamableLoader: ApiLoader = () => import('@mintplayer/streamable-player/api').then(m => new m.StreamableService());