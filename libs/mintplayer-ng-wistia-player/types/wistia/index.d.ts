declare namespace Wistia {
    // export function api(matcher: string);

    export interface Player {
        addToPlaylist(hashedId: string, options?: AddToPlaylistOptions, position?: AddToPlaylistPosition): void;
        aspect(): number;
        bind<K extends keyof WistiaEventMap>(eventType: K, ...inArgs: [...WistiaEventMap[K][0], (...args: WistiaEventMap[K][1]) => void]): void;
        unbind<K extends keyof WistiaEventMap>(eventType: K, callback: (...args: WistiaEventMap[K][1]) => void): void;
        cancelFullscreen(): void;
        duration(): number;
        email(): string | null;
        email(val: string): void;
        embedded(): boolean;
        eventKey(): string;
        getSubtitlesScale(): number;
        setSubtitlesScale(scale: number): void;
        hasData(): boolean;
        hashedId(): string;
        height(): number;
        height(val: number, options?: SizeOptions): void;
        inFullscreen(): boolean;
        look(): Look;
        look(options: Partial<Look>): void;
        isMuted(): boolean;
        mute(): void;
        unmute(): void;
        name(): string;
        pause(): void;
        /** Value between 0 and 1. */
        percentWatched(): number;
        play(): void;
        playbackRate(rate: number): void;
        ready(): boolean;
        remove(): void;
        replaceWith(hashedId: string, options?: ReplaceWithOptions): void;
        requestFullscreen(): void;
        secondsWatched(): number;
        secondsWatchedVector(): number[];
        state(): PlayerState;
        time(): number;
        time(val: number): void;
        videoHeight(val: number, options?: SizeOptions): void;
        videoQuality(): number | 'auto';
        videoWidth(): number;
        videoWidth(val: number, options?: SizeOptions): void;
        visitorKey(): any;
        volume(): number;
        volume(vol: number): void;
        width(): number;
        width(w: number): void;
    }

    export type PlayerState = 'beforeplay' | 'playing' | 'paused' | 'ended';
    
    export interface ReplaceWithOptions {
        transition: 'slide' | 'fade' | 'crossfade' | 'none';
    }
    
    export interface SizeOptions {
        constrain: boolean;
    }

    export interface Look {
        heading: string;
        pitch: string;
        fov: string;
    }
    
    export interface AddToPlaylistPosition {
        before?: string;
        after?: string;
    }
    
    export interface CaptionsChangeEvent {
        visible: boolean;
        language: string;
    }
    
    export interface WistiaEventMap extends {} {
        'beforeremove': [[], []];
        'beforereplace': [[], []];
        'betweentimes': [[number, number], [boolean]];
        'cancelfullscreen': [[], []];
        'captionschange': [[], [CaptionsChangeEvent]];
        'conversion': [[], [type: 'pre-roll-email' | 'mid-roll-email' | 'post-roll-email', email: string, firstName: string, lastName: string]];
        'crosstime': [[number], []];
        'end': [[], []];
        'enterfullscreen': [[], []];
        'heightchange': [[], []];
        'lookchange': [[], [Wistia.Look]];
        'mutechange': [[], [boolean]];
        'pause': [[], []];
        'percentwatchedchanged': [[], [percent: number, lastPercent: number]];
        'play': [[], []];
        'playbackratechange': [[], [playbackRate: number]];
        'secondchange': [[], [s: number]];
        'seek': [[], [currentTime: number, lastTime: number]];
        'silentplaybackmodechange': [[], [boolean]];
        'timechange': [[], [number]];
        'volumechange': [[], [volume: number, isMuted: boolean]];
        'widthchange': [[], []];
    }
}