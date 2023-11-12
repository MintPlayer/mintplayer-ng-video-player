import { IApiService } from "@mintplayer/ng-player-provider";

const VIDEO_API_LOADERS: IApiService[] = [];

export function loadApi(loader: () => Promise<IApiService>) {
    loader().then(api => {
        VIDEO_API_LOADERS.push(api);
    });
}