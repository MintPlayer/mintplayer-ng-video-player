declare module '@vidyard/embed-code' {
    export declare class Surface {
        api: VidyardApi;
    }

    export declare class VidyardApi {
        // renderDOMPlayers: () => void;
        renderPlayer(el: HTMLElement | RenderPlayerOptions): void;
        addReadyListener(callback: (_, player: VidyardPlayer) => void): void;
        // progressEvents(callback: (ev: ProgressEventsEvent) => void):void;
        getPlayerMetadata(id: string): Promise<VidyardMetadata>;
        destroyPlayer(player: VidyardPlayer): void;
    }

    export declare interface RenderPlayerOptions {
        uuid: string,
        container: HTMLElement;
        // optional
        type?: 'lightbox' | 'inline';
        aspect?: 'landscape' | 'portrait' | number,
        autoplay?: 1 | 0;

        [x: string | number | symbol]: unknown;
    }

    export declare interface VidyardPlayer {
        get container(): HTMLElement;
        get element(): HTMLElement;
        get iframe(): HTMLIFrameElement;
        get uuid(): string;
        get metadata(): VidyardMetadata;
        get placeholder(): HTMLElement;
        play(): void;
        pause(): void;
        seek(seconds: number): void;
        on<K extends keyof VidyardEventMap>(ev: K, handler: (...args: VidyardEventMap[K]) => void): void;
        off<K extends keyof VidyardEventMap>(ev: K, handler: (...args: VidyardEventMap[K]) => void): void;
        setVolume(volume: number): void;
        currentTime(): number;
    }


    export declare interface VidyardMetadata {
        length_in_seconds: number;
        width: number;
        height: number;
        name: string;
        description: string;
        chapters_attributes: VidyardChapter[];
    }

    export declare interface VidyardChapter {
        video_attributes: VidyardChapterAttribute;
    }

    export declare interface VidyardChapterAttribute {
        length_in_seconds: number;
        name: string;
    }

    export declare interface VidyardEventMap {
        'ready': [undefined, VidyardPlayer];
        'play': [number, VidyardPlayer];
        'pause': [undefined, VidyardPlayer];
        'seek': [[previous: number, next: number], VidyardPlayer];
        'beforeSeek': [BeforeSeekEvent, VidyardPlayer];
        'metadata': [VidyardMetadata[], VidyardPlayer];
        'playerComplete': [undefined, VidyardPlayer];
        'videoComplete': [number, VidyardPlayer];
        'timeupdate': [seconds: number, VidyardPlayer];
        'volumeChange': [number, VidyardPlayer];
    };

    const surface: Surface;
    export default surface;
}

interface BeforeSeekEvent {
    start: number;
}
