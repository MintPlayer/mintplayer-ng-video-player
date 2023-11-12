import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-streamable-player/service').then(m => new m.StreamableService()));
