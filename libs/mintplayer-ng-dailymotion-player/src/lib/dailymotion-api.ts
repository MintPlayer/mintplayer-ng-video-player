import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-dailymotion-player/service').then(m => new m.DailymotionApiService()));
