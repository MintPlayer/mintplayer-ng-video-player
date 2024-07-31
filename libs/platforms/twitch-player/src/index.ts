import { ApiPlugin } from "@mintplayer/player-provider";

export const twitchPlugin: ApiPlugin = () => import('@mintplayer/twitch-player/api').then(m => new m.TwitchApiService());
