import { ApiPlugin } from "@mintplayer/player-provider";

export const spotifyPlugin: ApiPlugin = () => import('@mintplayer/spotify-player/api').then(m => new m.SpotifyApiService());
