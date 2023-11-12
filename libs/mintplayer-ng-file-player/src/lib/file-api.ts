import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-file-player/service').then(m => new m.FileApiService()));
