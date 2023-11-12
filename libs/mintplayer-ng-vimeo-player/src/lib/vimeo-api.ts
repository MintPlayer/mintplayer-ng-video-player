import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-vimeo-player/service').then(m => new m.VimeoApiService()));
