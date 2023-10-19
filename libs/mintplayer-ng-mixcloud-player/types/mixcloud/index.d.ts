import { MixcloudPlayerWidgetApiRPC } from "../../src/lib/remote/widgetApi";

// declare namespace Mixcloud {
//     export class Player {
//         ready: Promise<any>;
//         load: (cloudcastKey: string, startPlaying: boolean) => Promise<any>;
//         play(): void;
//         pause(): void;
//         togglePlay(): void;
//         seek(seconds: number): void;
//         getPosition(): Promise<number>;
//         getDuration(): Promise<number>;
//         getIsPaused(): Promise<boolean>;

//         set hide_cover(value: boolean);
//         set hide_tracklist(value: boolean);
//         set mini(value: boolean);
//         set hide_artwork(value: boolean);
//         set light(value: boolean);

//         get events(): PlayerEvents;
//     }

    export function PlayerWidget(element: HTMLElement) : MixcloudPlayerWidgetApiRPC;

//     export class PlayerEvents {
//         progress: PlayerProgressEvent;
//         buffering: PlayerEvent;
//         play: PlayerEvent;
//         pause: PlayerEvent;
//         ended: PlayerEvent;
//         error: PlayerEvent;
//     }

//     export class PlayerEvent {
//         on: (callback: () => void) => void;
//         off: (callback: () => void) => void;
//     }
//     export class PlayerProgressEvent {
//         on: (callback: (position: number, duration: number) => void) => void;
//         off: (callback: (position: number, duration: number) => void) => void;
//     }
// }