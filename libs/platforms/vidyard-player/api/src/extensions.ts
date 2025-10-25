/// <reference path="../../types/vidyard/index.d.ts" />

// import { Observable } from 'rxjs';

import { VidyardEventMap, VidyardPlayer } from "@vidyard/embed-code";
import { Observable, fromEvent } from "rxjs";

export function fromVidyardEvent<E extends keyof VidyardEventMap>(target: VidyardPlayer, name: E): Observable<VidyardEventMap[E]> {
    return fromEvent(<any>target, name);
}