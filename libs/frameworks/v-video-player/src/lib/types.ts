import type { EPlayerState } from '@mintplayer/player-provider';

export interface VVideoPlayerProps {
  url?: string;
  volume: number;
  mute: boolean;
  playerState: EPlayerState;
}

export interface VVideoPlayerEmits {
  (event: 'update:volume', value: number): void;
  (event: 'update:mute', value: boolean): void;
  (event: 'update:playerState', value: EPlayerState): void;
}
