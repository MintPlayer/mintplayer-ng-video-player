declare namespace Twitch {
    export class Player {
        constructor(domId: string, options: TwitchPlayerOptions);

        addEventListener(event: string, callback: () => void);
        play(): void;
        pause(): void;
        getChannel(): string;
        setChannel(channel: string): void;
        getVideo(): string;
        setVideo(video: string, timestamp: number): void;
        setCollection(collection: string): void;
        seek(seconds: number): void;
        getCurrentTime(): number;
        getDuration(): number;
        isPaused(): boolean;
        getEnded(): boolean;
        getMuted(): boolean;
        setMuted(mute: boolean): void;
        getVolume(): number;
        setVolume(volume: number): void;
        destroy(): void;


        static CAPTIONS: string;
        static ENDED: string;
        static PAUSE: string;
        static PLAY: string;
        static PLAYBACK_BLOCKED: string;
        static PLAYING: string;
        static OFFLINE: string;
        static ONLINE: string;
        static READY: string;
        static SEEK: string;
    }

    export interface TwitchPlayerOptions {
        width: number;
        height: number;
        channel?: string;
        video?: string;
        collection?: string;

        autoplay?: boolean;
        muted?: boolean;
    }
}