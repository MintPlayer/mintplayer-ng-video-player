import { PlayedVideo } from "./played-video";

export interface NextVideoResult<T> {
    /** PlayedVideo returned by the FindNextVideo() method. */
    playedVideo: PlayedVideo<T> | null;

    /** Indicates whether the PlayedVideo comes from the actualPlaylist. */
    fromActualPlaylist: boolean;
}