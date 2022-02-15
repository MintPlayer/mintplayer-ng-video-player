import { PlayerState } from "@mintplayer/ng-soundcloud-player";

export interface PlayerStateCache {
    progress: number;
    volume: number;
    state: PlayerState;
}