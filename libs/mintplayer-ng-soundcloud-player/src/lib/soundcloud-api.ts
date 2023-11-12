import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-soundcloud-player/service').then(m => new m.SoundcloudApiService()));
