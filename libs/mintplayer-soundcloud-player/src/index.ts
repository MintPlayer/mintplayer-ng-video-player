import { ApiLoader } from '@mintplayer/player-provider';

export const soundcloudApiLoader: ApiLoader = () => import('@mintplayer/soundcloud-player/service').then(m => new m.SoundcloudApiService());