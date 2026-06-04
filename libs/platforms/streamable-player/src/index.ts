import { ApiPlugin } from "@mintplayer/player-provider";

export const streamablePlugin: ApiPlugin = () => import('../api').then(m => new m.StreamableService());
