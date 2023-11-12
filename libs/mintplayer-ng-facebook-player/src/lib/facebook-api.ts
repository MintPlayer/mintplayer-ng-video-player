import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-facebook-player/service').then(m => new m.FacebookApiService()));
