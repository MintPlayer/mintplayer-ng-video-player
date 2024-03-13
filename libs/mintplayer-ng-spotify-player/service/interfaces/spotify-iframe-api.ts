export interface SpotifyIframeApi {
    createController: (el: HTMLElement, options: SpotifyControllerOptions, callback: (controller: SpotifyController) => void) => void;
}

export interface SpotifyControllerOptions {
    uri: string;
    width?: number;
    height?: number;
}

export interface SpotifyController {
    play: () => void;
    pause: () => void;
    resume: () => void;
    playFromStart: () => void;
    togglePlay: () => void;
    loadUri: (url: string) => void;
    seek: (seconds: number) => void;
    destroy: () => void;
    setIframeDimensions: (w: number, h: number) => void;

    get currentUri() : string;
    get loading(): boolean;
    get options(): SpotifyControllerOptions;

    addListener: (ev: 'ready' | 'playback_update', callback: (data: undefined | PlaybackUpdateEvent) => void) => void;
    removeListener: (ev: 'ready' | 'playback_update', callback: (data: undefined | PlaybackUpdateEvent) => void) => void;
}

export interface PlaybackUpdateEvent {
    data: PlaybackUpdateEventData;
}

export interface PlaybackUpdateEventData {
    isPaused: boolean;
    isBuffering: boolean;
    duration: number;
    position: number;
    // destroy: () => void;
}