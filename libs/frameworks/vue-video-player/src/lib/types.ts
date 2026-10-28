import type { EPlayerState } from '@mintplayer/player-provider';

export interface VueVideoPlayerProps {
  url?: string;
  volume: number;
  mute: boolean;
  playerState: EPlayerState;
}

export interface VueVideoPlayerEmits {
  (event: 'update:volume', value: number): void;
  (event: 'update:mute', value: boolean): void;
  (event: 'update:playerState', value: EPlayerState): void;
}
