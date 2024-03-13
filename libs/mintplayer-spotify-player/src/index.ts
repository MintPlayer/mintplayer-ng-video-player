import { ApiLoader } from '@mintplayer/player-provider';

export const spotifyApiLoader: ApiLoader = () => import('@mintplayer/spotify-player/service').then(m => new m.SpotifyApiService());