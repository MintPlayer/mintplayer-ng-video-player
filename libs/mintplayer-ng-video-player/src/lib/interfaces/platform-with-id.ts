import { EPlayerType } from "../enums/player-type";

export interface PlatformWithId {
    platform: EPlayerType;
    id: string;
}