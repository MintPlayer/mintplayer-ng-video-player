import { ApiPlugin } from "@mintplayer/player-provider";

export const spotifyPlugin: ApiPlugin = () => import('../api').then(m => new m.SpotifyApiService());
