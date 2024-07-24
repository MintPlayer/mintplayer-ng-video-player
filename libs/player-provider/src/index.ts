// import { InjectionToken } from "@angular/core";
import { Subject } from "rxjs";
// import { BehaviorSubject } from 'rxjs';

// export const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');
export type ApiPlugin = () => Promise<IApiService>;
// export const VIDEO_APIS: IApiService[] = [];
// export function loadApi(...loaders: ApiPlugin[]) {
//     loaders.forEach(loader => loader().then(api => VIDEO_APIS.push(api)));
// }

export interface IApiService {
    get id(): string;
    urlRegexes: RegExp[];
    loadApi(): Promise<any>;
    prepareHtml(options: PrepareHtmlOptions): string;
    createPlayer(options: PlayerOptions, destroy: Subject<boolean>): Promise<PlayerAdapter>;
    match2id?: (match: RegExpExecArray) => string;
    canReusePlayer?: boolean;
}

export type PrepareHtmlOptions = Partial<Omit<PlayerOptions, 'element'>>;

export interface PlayerOptions {
    width: number;
    height: number;
    autoplay: boolean;

    domId?: string;
    element: HTMLElement;
    initialVideoId?: string;
}

export interface PlayerAdapter extends PlayerAdapterRequired {
    onStateChange: (ev: EPlayerState) => void;
    onMuteChange: (ev: boolean) => void;
    onVolumeChange: (volume: number) => void;
    onCurrentTimeChange: (currentTime: number) => void;
    onDurationChange: (duration: number) => void;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onPipChange: (isPip: boolean) => void;
}


export interface PlayerAdapterRequired {
    loadVideoById: (id: string) => void;
    setPlayerState: (state: EPlayerState) => void;
    setMute: (mute: boolean) => void;
    setVolume: (volume: number) => void;
    setProgress: (time: number) => void;
    setSize: (width: number, height: number) => void;
    getTitle: () => Promise<string>;
    setPip: (isPip: boolean) => void;
    getPip: () => Promise<boolean>;
    setFullscreen: (isFullscreen: boolean) => void;
    getFullscreen: () => Promise<boolean>;
    destroy: () => void;

    get capabilities(): ECapability[];
}

export function createPlayerAdapter(requiredProps: PlayerAdapterRequired) : PlayerAdapter {
    return {
        ...requiredProps,
        onStateChange: () => console.warn('onStateChange is not registered'),
        onMuteChange: () => console.warn('onMuteChange is not registered'),
        onVolumeChange: () => console.warn('onVolumeChange is not registered'),
        onCurrentTimeChange: () => console.warn('onCurrentTimeChange is not registered'),
        onDurationChange: () => console.warn('onDurationChange is not registered'),
        onFullscreenChange: () => console.warn('onFullscreenChange is not registered'),
        onPipChange: () => console.warn('onPipChange is not registered'),
    }
}

export enum EPlayerState {
    unstarted = 1,
    playing = 2,
    paused = 3,
    ended = 4,
}

export enum ECapability {
    fullscreen,
    pictureInPicture,
    volume,
    mute,
    getTitle,
}