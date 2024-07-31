import { ApiPlugin } from "@mintplayer/player-provider";

export const streamablePlugin: ApiPlugin = () => import('@mintplayer/streamable-player/api').then(m => new m.StreamableService());
