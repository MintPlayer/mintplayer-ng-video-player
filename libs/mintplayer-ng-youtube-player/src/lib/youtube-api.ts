import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-youtube-player/service').then(m => new m.YoutubeApiService()));
