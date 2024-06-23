import { PlayerProgress } from '@mintplayer/player-progress';
import { ECapability, EPlayerState, SphericalProperties, VideoQuality } from '@mintplayer/player-provider';
import { VideoPlayer } from './video-player';
import { Observable, fromEvent } from 'rxjs';

export interface VideoEventMap {
    'progressChange': [PlayerProgress];
    'stateChange': [EPlayerState];
    'volumeChange': [number];
    'muteChange': [boolean];
    'isFullscreenChange': [boolean];
    'isPipChange': [boolean];
    'playbackRateChange': [number];
    'qualityChange': [VideoQuality];
    'qualitiesChange': [VideoQuality[]];
    'sphericalPropertiesChange': [SphericalProperties];
    'capabilitiesChange': [ECapability[]];
}

export function fromVideoEvent<E extends keyof VideoEventMap>(target: VideoPlayer, name: E): Observable<VideoEventMap[E]> {
    return fromEvent(<any>target, name);
}