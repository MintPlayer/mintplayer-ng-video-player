import { Injectable } from "@angular/core";
import { IApiService } from "@mintplayer/ng-player-provider";

@Injectable({
    providedIn: 'root'
})
export class FacebookApiService implements IApiService {

    public get id() {
        return 'facebook';
    }

    urlRegexes: RegExp[];
}