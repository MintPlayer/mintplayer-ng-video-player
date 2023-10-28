declare module '@vidyard/embed-code' {
    export class Surface {
        api: VidyardApi;
    }

    export class VidyardApi {
        // renderDOMPlayers: () => void;
        renderPlayer(el: HTMLElement | RenderPlayerOptions): void;
        addReadyListener(callback: (_, player: VidyardPlayer) => void): void;
        // progressEvents(callback: (ev: ProgressEventsEvent) => void):void;
        getPlayerMetadata(id: string): Promise<VidyardMetadata>;
        destroyPlayer(player: VidyardPlayer): void;
    }

    // export interface RenderPlayerOptions {
    //     uuid: string,
    //     container: HTMLElement;
    //     // optional
    //     type?: 'lightbox' | 'inline';
    //     aspect?: 'landscape' | 'portrait' | number,

    //     [x: string | number | symbol]: unknown;
    // }

    // export interface ProgressEventsEvent {
    //     chapter: number;
    //     event: any;
    //     player: VidyardPlayer;
    // }

    export interface VidyardPlayer {
        container: HTMLElement;
    //     element: HTMLElement;
    //     get uuid(): string;
    //     play(): void;
    //     pause(): void;
    //     seek(seconds: number): void;
        on<K = keyof GlobalEventHandlersEventMap>(ev = K, handler: (...args: GlobalEventHandlersEventMap[K]) => void): void;
    //     off(ev: PlayerEvent, handler: (...args: any[]) => void): void;
    //     setVolume(volume: number): void;
    //     currentTime(): number;
    }

    // export type PlayerEvent = 
    //     'ready' |
    //     'play' |
    //     'pause' |
    //     'beforeSeek' |
    //     'seek' |
    //     'playerComplete' |
    //     'videoComplete' |
    //     'timeUpdate' |
    //     'volumeChange' |
    //     'lightboxClose' |
    //     'metadata';
    
    

    export interface VidyardMetadata {
        length_in_seconds: number;
    }


    export class GlobalEventHandlersEventMap {
        ready: [undefined, VidyardPlayer];
        // stateChange: PlayerStateChangeEvent;
        // play: <[string, VidyardPlayer]>[0, null],
    };

    const surface: Surface;
    export default surface;
}

interface PlayerReadyEvent extends Event {
    readyData: any;
}

// interface PlayerStateChangeEvent extends Event {
//     stateChangeData: any;
// }



// class test {
//     constructor() {
//         this.on('stateChange', ())
//     }

//     on<K extends keyof GlobalEventHandlersEventMap>(type: K, listener: (e: GlobalEventHandlersEventMap[K]) => void) {

//     }
// }