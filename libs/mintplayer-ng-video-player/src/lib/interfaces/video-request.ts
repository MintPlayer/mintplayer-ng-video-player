import { IApiService } from "@mintplayer/player-provider";

export interface VideoRequest {
    api: IApiService;
    id: string;
}