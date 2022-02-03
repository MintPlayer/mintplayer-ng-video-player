import { EPlayerType } from "../enums/player-type";

export interface PlatformWithRegexes {
    platform: EPlayerType;
    regexes: RegExp[];
}