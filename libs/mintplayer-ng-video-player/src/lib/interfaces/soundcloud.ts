declare namespace SC {

    namespace Widget {
        
        export class Player {
            load(url: string, options: Partial<SoundCloudLoadOptions>): Promise<any>;
            play(): void;
            pause(): void;
            
            bind(event: SC.Widget.Events, handler: (event: any) => void): void;

            getDuration(callback: (duration: number) => void): void;
            getPosition(callback: (position: number) => void): void;
            getVolume(callback: (volume: number) => void): void;
            setVolume(volume: number): void;
            seekTo(ms: number): void;
            isPaused(callback: (paused: boolean) => void): void;
        }

        export enum Events {
            CLICK_BUY = 'buyClicked',
            CLICK_DOWNLOAD = 'downloadClicked',
            ERROR = 'error',
            FINISH = 'finish',
            LOAD_PROGRESS = 'loadProgress',
            OPEN_SHARE_PANEL = 'sharePanelOpened',
            PAUSE = 'pause',
            PLAY = 'play',
            PLAY_PROGRESS = 'playProgress',
            READY = 'ready',
            SEEK = 'seek'
        }
        
    }

    export interface OEmbedOptions {
        element: HTMLElement | null;
    }
    
    export interface SoundCloudLoadOptions {
        auto_play: boolean;
        callback: () => void;
    }

    export function Widget(element: HTMLIFrameElement | string | null) : SC.Widget.Player;
}