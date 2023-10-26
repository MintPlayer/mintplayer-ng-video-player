// https://github.com/rrtheonlyone/XVariables/blob/master/client1/src/players/Facebook.js

declare namespace FB {
    export interface FacebookConfig {
        appId?: string;
        xfbml: boolean;
        version: string;
    }

    export interface FacebookEventData {
        type: 'video';
        id: string;
        instance: Player;
    }

    export interface FacebookEvent {
        subscribe: (action: string, callback: (data: FacebookEventData) => void) => void;
    }

    export const Event: FacebookEvent;
    export const XFBML: any;

    export function init(fbInfo: FacebookConfig): void;

    export interface Player {
        getCurrentPosition: () => number;
        getDuration: () => number;
        getVolume: () => number;
        isMuted: () => boolean;
        mute: () => void;
        pause: () => void;
        play: () => void;
        seek: (seconds: number) => void;
        setVolume: (volume: number) => void;
        subscribe: (ev: PlayerEvents, handler: () => void) => PlayerSubscription;
        unmute: () => void;
    }

    export type PlayerEvents = 'startedPlaying' | 'paused' | 'finishedPlaying' | 'startedBuffering' | 'finishedBuffering' | 'error';

    export interface PlayerSubscription {
        release: () => void;
    }
}