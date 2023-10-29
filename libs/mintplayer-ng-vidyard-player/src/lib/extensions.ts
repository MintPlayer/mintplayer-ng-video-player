// import { Observable } from 'rxjs';

import { VidyardEventMap } from "@vidyard/embed-code";
import { Observable } from "rxjs";

// export interface JQueryStyleEventEmitter<TContext, T> {
//     on<K extends keyof U, U, V = U[K], V extends ArrayLike<any>>(eventName: K, handler: (...args: U[K]) => any): void;
//     off<K extends keyof U, U>(eventName: K, handler: (...args: U[K]) => any): void;
// }

// export function fromEventX<T>(target: JQueryStyleEventEmitter<any, T>, eventName: string) : Observable<T> {

// }

export function fromEventX<E extends keyof VidyardEventMap>(target: any, name: E): Observable<VidyardEventMap[E]> {

}