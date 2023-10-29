// import { Observable } from 'rxjs';

import { VidyardEventMap } from "@vidyard/embed-code";
import { Observable, fromEvent } from "rxjs";
import { HasEventTargetAddRemove, JQueryStyleEventEmitter } from "rxjs/internal/observable/fromEvent";

export function fromVidyardEvent<E extends keyof VidyardEventMap>(
    target: HasEventTargetAddRemove<VidyardEventMap[E]> | ArrayLike<HasEventTargetAddRemove<VidyardEventMap[E]>>,
    name: E): Observable<VidyardEventMap[E]> {
    return fromEvent(target, name);
}

// export function fromVidyardEvent<E extends keyof VidyardEventMap>(
//     target: JQueryStyleEventEmitter<any, VidyardEventMap[E]> | ArrayLike<HasEventTargetAddRemove<VidyardEventMap[E]>>,
//     name: E): Observable<VidyardEventMap[E]> {
//     return fromEvent(target, name);
// }