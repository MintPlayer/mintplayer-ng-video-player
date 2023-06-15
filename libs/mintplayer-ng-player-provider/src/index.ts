import { InjectionToken } from "@angular/core";
import { BehaviorSubject } from 'rxjs';

export const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');

export interface IApiService {
    get id(): string;
    urlRegexes: RegExp[];
    loadApi(): void;
    apiReady$: BehaviorSubject<boolean>;
    prepareHtml(domId: string, width: number, height: number): string;
    createPlayer(options: PlayerOptions): PlayerAdapter;
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
    onVolumeChange: (volume: number) => void;
}

export interface PlayerAdapter {
    // Methods
    loadVideoById: (id: string) => void;
    setPlayerState: (state: EPlayerState) => void;
    setVolume: (volume: number) => void;
}

export enum EPlayerState {
    unstarted = 1,
    playing = 2,
    paused = 3,
    ended = 4,
}