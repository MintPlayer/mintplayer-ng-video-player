import type { EPlayerState } from '@mintplayer/player-provider';

export interface VueVideoPlayerProps {
  url?: string;
  /** Kept across media. Leave unset to start at the first platform's own volume. */
  volume?: number;
  /** Kept across media. Leave unset to start at the first platform's own mute state. */
  mute?: boolean;
  playerState: EPlayerState;
}

export interface VueVideoPlayerEmits {
  (event: 'update:volume', value: number): void;
  (event: 'update:mute', value: boolean): void;
  (event: 'update:playerState', value: EPlayerState): void;
}
