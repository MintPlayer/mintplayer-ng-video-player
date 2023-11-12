import { loadApi } from "@mintplayer/ng-video-player";

loadApi(() => import('@mintplayer/ng-vidyard-player/service').then(m => new m.VidyardService()));
