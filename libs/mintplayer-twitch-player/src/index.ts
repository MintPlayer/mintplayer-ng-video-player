import { ApiLoader } from '@mintplayer/player-provider';

export const twitchApiLoader: ApiLoader = () => import('@mintplayer/twitch-player/service').then(m => new m.TwitchApiService());