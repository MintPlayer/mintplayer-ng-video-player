declare namespace Vimeo {
    export class Player {
        constructor(name: string, options: Partial<VimeoPlayerOptions>);

        ready(): Promise<boolean>;
        destroy(): Promise<boolean>;

        play(): void;
        pause(): void;
        getPlayed(): Promise<number[]>;
        getPaused(): Promise<boolean>;
        getEnded(): Promise<boolean>;

        getVideoId(): string;
        loadVideo(id: string): Promise<any>;
        getVideoTitle(): Promise<string>;

        getFullscreen(): boolean;
        requestFullscreen(): Promise<boolean>;
        exitFullscreen(): Promise<boolean>;

        getPictureInPicture(): boolean;
        requestPictureInPicture(): Promise<any>;
        exitPictureInPicture(): Promise<any>;

        getVolume(): Promise<number>;
        setVolume(volume: number): void;

        getTextTracks(): any[];
        enableTextTrack(): void;
        disableTextTrack(): void;

        getAutopause(): boolean;
        setAutopause(autopause: boolean): void;

        getBuffered(): boolean;

        getCurrentTime(): Promise<number>;
        setCurrentTime(time: number): void;

        getDuration(): Promise<number>;
        
        getLoop(): boolean;
        setLoop(loop: boolean): void;

        getMuted(): Promise<boolean>;
        setMuted(muted: boolean): void;

        on(e: PlayerEvents, t: (...parms: any[]) => void): void;
        off(e: PlayerEvents, t: (...parms: any[]) => void): void;
    }

    export type PlayerEvents = 'loaded'
                             | 'play'
                             | 'pause'
                             | 'ended'
                             | 'timeupdate'
                             | 'fullscreenchange'
                             | 'enterpictureinpicture'
                             | 'leavepictureinpicture'
                             | 'volumechange';

    export interface VimeoPlayerOptions {
        /** Required. Either the id or the url of the video. */
        id: number | string;

        /** Automatically start playback of the video. Note that this won’t work on some devices. */
        autoplay: boolean;

        /** The exact width of the video. Defaults to the width of the largest available version of the video. */
        width: number;

        /** The exact height of the video. Defaults to the height of the largest available version of the video. */
        height: number;

        /** Play the video again when it reaches the end. */
        loop: boolean;

        /** Mute this video on load. Required to autoplay in certain browsers. */
        muted: boolean;

        /** 	Show the picture-in-picture button in the controlbar and enable the picture-in-picture API. */
        pip: boolean;

        /** Play video inline on mobile devices, to automatically go fullscreen on playback set this parameter to false. */
        playsinline: boolean;

        /** Show the title on the video. */
        title: boolean;
    }
}