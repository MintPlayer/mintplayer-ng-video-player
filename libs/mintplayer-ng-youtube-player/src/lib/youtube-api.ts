console.warn('hi there 2');

import { loadApi } from "@mintplayer/ng-video-player";

(function() {
    console.warn('hi there');
    loadApi(() => import('@mintplayer/ng-youtube-player/service').then(m => new m.YoutubeApiService()));
})();