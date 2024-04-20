import { ApiLoader } from "@mintplayer/player-provider";

export const twitchLoader: ApiLoader = () => import('@mintplayer/twitch-player/api').then(m => new m.TwitchApiService());