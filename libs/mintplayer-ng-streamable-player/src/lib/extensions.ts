import { Observable, fromEvent } from "rxjs";

export function fromStreamableEvent<E extends keyof playerjs.StreamableEventMap>(target: playerjs.Player, name: E): Observable<playerjs.StreamableEventMap[E]> {
    return fromEvent(<any>target, name);
}