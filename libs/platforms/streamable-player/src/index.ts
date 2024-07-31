import { ApiLoader } from "@mintplayer/player-provider";

export const streamablePlugin: ApiLoader = () => import('@mintplayer/streamable-player/api').then(m => new m.StreamableService());