import { DestroyRef, InjectionToken } from "@angular/core";
import { BehaviorSubject } from 'rxjs';
// import { PlayerProgress } from '@mintplayer/ng-player-progress';

export const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');

export interface IApiService {
    get id(): string;
    urlRegexes: RegExp[];
    loadApi(): void;
    apiReady$: BehaviorSubject<boolean>;
    prepareHtml(domId: string, width: number, height: number): string;
    createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter>;
    match2id?: (match: RegExpExecArray) => string;
}

export interface PlayerOptions {
    // Properties
    width: number;
    height: number;
    autoplay: boolean;

    domId?: string;
    element?: HTMLElement;
    initialVideoId?: string;

    // Events
    onReady: () => void;
    onStateChange: (ev: EPlayerState) => void;
    onMuteChange: (ev: boolean) => void;
    onVolumeChange: (volume: number) => void;
    onCurrentTimeChange: (currentTime: number) => void;
    onDurationChange: (duration: number) => void;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onPipChange: (isPip: boolean) => void;
}

export interface PlayerAdapter {
    // Methods
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