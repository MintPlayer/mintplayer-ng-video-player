import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-twitch-player/service').then(m => new m.TwitchApiService()));
