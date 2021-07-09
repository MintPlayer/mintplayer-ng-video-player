import { PlayerType } from "../enums";

export interface PlatformWithRegexes {
    platform: PlayerType;
    regexes: RegExp[];
}