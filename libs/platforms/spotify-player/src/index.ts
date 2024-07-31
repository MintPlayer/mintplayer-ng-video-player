import { ApiLoader } from "@mintplayer/player-provider";

export const spotifyPlugin: ApiLoader = () => import('@mintplayer/spotify-player/api').then(m => new m.SpotifyApiService());