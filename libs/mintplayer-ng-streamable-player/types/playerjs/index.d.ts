declare namespace playerjs {
    export class Player {
        constructor(iframe: HTMLIFrameElement);

        on<K extends keyof StreamableEventMap>(ev: K, handler: (...args: StreamableEventMap[K]) => void): void;
        off<K extends keyof StreamableEventMap>(ev: K, handler: (...args: StreamableEventMap[K]) => void): void;
        play(): void;
        pause(): void;
        
        getCurrentTime(callback: (time: number) => void): void;
        setCurrentTime(time: number): void;
        getDuration(callback: (duration: number) => void): void;
        getLoop(callback: (loop: boolean) => void): void;
        setLoop(loop: boolean): void;
        getMuted(callback: (muted: boolean) => void): void;
        getPaused(callback: (paused: boolean) => void): void;
        getVolume(callback: (volume: number) => void): void;
        setVolume(volume: number): void;
        mute(): void;
        unmute(): void;

    }

    export interface StreamableEventMap {
        'ready': [];
        'play': [];
        'pause': [];
        'seeked': [];
        'ended': [];
        'error': [];
        'timeupdate': {duration: number, seconds: number};
    }
}