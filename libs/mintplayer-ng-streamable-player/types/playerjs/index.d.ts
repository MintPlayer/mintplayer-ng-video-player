declare namespace playerjs {
    export class Player {
        constructor(iframe: HTMLIFrameElement);

        on<K extends keyof StreamableEventMap>(ev: K, handler: (...args: StreamableEventMap[K]) => void): void;
        off<K extends keyof StreamableEventMap>(ev: K, handler: (...args: StreamableEventMap[K]) => void): void;
    }

    export interface StreamableEventMap {
        'ready': [];
        'play': [];
        'pause': [];
    }
}