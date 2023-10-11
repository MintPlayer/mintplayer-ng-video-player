// https://angular.io/guide/using-libraries#library-typings

declare namespace DM {
    export const enum PlayerState {
        ENDED = 0,
        PLAYING = 1,
        PAUSED = 2
    }

    export interface PlayerOptions {
        video: string;
        width: string;
        height: string;
        params: Partial<PlayerParams>;
        events: Partial<PlayerEvents>;
    }

    export type LoadOptions = Partial<PlayerParams> & {
        video: string;
        playlist?: string;
    }

    export type PlayerParams = {
        'autoplay': boolean;
        'queue-autoplay-next': boolean;
        'queue-enable': boolean;
        'mute': boolean;
        'start': number;
    }

    export interface Player {
        width: number;
        height: number;

        load: (options: LoadOptions) => void;

        currentTime: number;
        duration: number;

        play: () => void;
        pause: () => void;
        seek: (t: number) => void;

        paused: boolean;
        ended: boolean;

        muted: boolean;
        setMuted: (mute: boolean) => void;

        volume: number;
        setVolume: (volume: number) => void;
        onvolumechange: () => void;
                
        setFullscreen: (isFullscren: boolean) => void;
        get fullscreen(): boolean;
        onfullscreenchange: (ev: Event) => void;
        onfullscreenerror: () => void;

        video: Video;
    }

    export class PlayerEvents {
        //constructor(data?: Partial<PlayerEvents>) {
        //  Object.assign(this, data);
        //}

        apiready: () => void;
        play: () => void;
        pause: () => void;
        end: () => void;
    }
    
    export interface Video {
        videoId: string;
        title: string;
        duration: number;
    }

    export function player(element: HTMLElement, options: Partial<PlayerOptions>): Player;
}