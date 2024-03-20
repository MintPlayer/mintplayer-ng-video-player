import { ApiLoader } from "@mintplayer/player-provider";

export const spotifyLoader: ApiLoader = () => import('@mintplayer/spotify-player/api').then(m => new m.SpotifyApiService());