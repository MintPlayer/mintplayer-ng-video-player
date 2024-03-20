export interface PlayProgressEvent {
    soundId: number;
    loadedProgress: number;
    currentPosition: number;
    relativePosition: number;
}