export const streamableApiLoader = () => import('@mintplayer/ng-streamable-player/service').then(m => new m.StreamableService());