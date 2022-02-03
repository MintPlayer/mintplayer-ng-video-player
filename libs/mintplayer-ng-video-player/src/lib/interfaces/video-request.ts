import { EPlayerType } from "../enums/player-type";

export interface VideoRequest {
    playerType: EPlayerType;
    id: string;
}