import { PlayerProgress } from '@mintplayer/player-progress';
import { ECapability, EPlayerState } from '@mintplayer/player-provider';

export interface VideoEventMap {
    'progressChange': [PlayerProgress];
    'stateChange': [EPlayerState];
    'volumeChange': [number];
    'muteChange': [boolean];
    'isFullscreenChange': [boolean];
    'isPipChange': [boolean];
    'capabilitiesChange': [ECapability[]];
}
