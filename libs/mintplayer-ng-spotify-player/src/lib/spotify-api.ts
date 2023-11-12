import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-spotify-player/service').then(m => new m.SpotifyApiService()));
