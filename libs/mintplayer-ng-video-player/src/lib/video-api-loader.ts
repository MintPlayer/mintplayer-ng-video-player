import { IApiService } from "@mintplayer/ng-player-provider";
import { VIDEO_API_SERVICES } from "./video-api-collection";

export function loadApi(loader: () => Promise<IApiService>) {
    loader().then(api => {
        console.warn('push', api);
        VIDEO_API_SERVICES.push(api);
    });
}