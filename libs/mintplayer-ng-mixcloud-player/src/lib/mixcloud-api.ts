import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-mixcloud-player/service').then(m => new m.MixcloudApiService()));
