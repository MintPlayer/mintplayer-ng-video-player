import { PlayerType } from "../enums";

export interface VideoRequest {
    playerType: PlayerType;
    id: string;
}