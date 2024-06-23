// import { InjectionToken } from "@angular/core";
import { Subject } from "rxjs";
// import { BehaviorSubject } from 'rxjs';

// export const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');
export type ApiLoader = () => Promise<IApiService>;
// export const VIDEO_APIS: IApiService[] = [];
// export function loadApi(...loaders: ApiLoader[]) {
//     loaders.forEach(loader => loader().then(api => VIDEO_APIS.push(api)));
// }

export type VideoQuality = 'default' | 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres' | 'auto';

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
    onPlaybackRateChange: (rate: number) => void;
    onQualityChange: (quality: VideoQuality) => void;
    on360PropertiesChange: (properties: SphericalProperties) => void;
}


export interface PlayerAdapterRequired {
    loadVideoById: (id: string) => void;
    getPlayerState: () => Promise<EPlayerState>;
    setPlayerState: (state: EPlayerState) => void;
    getMute: () => Promise<boolean>;
    setMute: (mute: boolean) => void;
    getVolume: () => Promise<number>;
    setVolume: (volume: number) => void;
    setProgress: (time: number) => void;
    setSize: (width: number, height: number) => void;
    getPlaybackRate: () => Promise<number>;
    setPlaybackRate: (rate: number) => void;
    getQuality: () => Promise<VideoQuality | number>;
    setQuality: (quality: VideoQuality | number) => void;
    get360properties: () => Promise<SphericalProperties>;
    set360properties: (properties: SphericalProperties) => void;
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
        onPlaybackRateChange: () => console.warn('onPlaybackRateChange is not registered'),
        onQualityChange: () => console.warn('onQualityChange is not registered'),
        on360PropertiesChange: () => console.warn('on360PropertiesChange is not registered'),
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
    playbackRate,
    quality,
    spherical
}

/**
 * The spherical video config object, which serves 360° experience
 */
export interface SphericalProperties {
    enableOrientationSensor?: boolean | undefined;
    fov?: number | undefined;
    pitch?: number | undefined;
    roll?: number | undefined;
    yaw?: number | undefined;
}