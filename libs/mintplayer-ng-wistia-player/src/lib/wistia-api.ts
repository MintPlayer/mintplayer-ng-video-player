import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-wistia-player/service').then(m => new m.WistiaService()));
