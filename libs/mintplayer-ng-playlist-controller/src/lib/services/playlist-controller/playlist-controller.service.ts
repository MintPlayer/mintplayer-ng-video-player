import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ERepeatMode } from '../../enums/repeat-mode';
import { NextVideoResult } from '../../interfaces/next-video-result';
import { PlayedVideo } from '../../interfaces/played-video';

@Injectable()
export class PlaylistController<TVideo> {

  private _playlist: TVideo[] = [];
  private _actualPlaylist: PlayedVideo<TVideo>[] = [];
  private _currentPlayedVideo: PlayedVideo<TVideo> | null = null;

  public video$ = new BehaviorSubject<TVideo | null>(null);


  //#region PUBLIC MEMBERS

  //#region Properties

  //#region playlist
  public get playlist() {
    return this._playlist.map(v => v);
  }
  //#endregion
  //#region shuffle
  public shuffle = false;
  //#endregion
  //#region repeat
  public repeat: ERepeatMode = ERepeatMode.noRepeat;
  //#endregion
  //#region currentVideoPosition
  /** The progress of the current video, in seconds. */
  public currentVideoPosition = 0;
  //#endregion

  //#endregion

  //#region Methods

  public addToPlaylist(...videos: TVideo[]) {
    const clones = videos.map((video) => {
      if (typeof video === 'string') {
        return video;
      } else {
        return Object.assign({}, video);
      }
    });
    this._playlist.push(...clones);
    this.reviewVideoToPlay(...clones);
  }
  
  public async setPlaylist(videos: TVideo[]) {
    this._playlist.splice(0);
    this._actualPlaylist.splice(0);
    this.addToPlaylist(...videos);
  }

  public removeFromPlaylist(video: TVideo) {
    // Check if video to be removed is currently playing
    if (this._currentPlayedVideo !== null) {
      if (this._currentPlayedVideo.video === video) {
        const next = this.findNextNotCurrentVideo();
        if (next === null) {
          // Remove from the playlist
          this._playlist.splice(this._playlist.indexOf(video), 1);

          // Remove from the actual playlist
          this.removeVideoFromActualPlaylist(video);
          
          this.playNextVideo(true);
          return;
        } else {
          this.onPlayVideo(next);
        }
      }
    }

    // Remove from the playlist
    this._playlist.splice(this._playlist.indexOf(video), 1);

    // Remove from the actual playlist
    this.removeVideoFromActualPlaylist(video);
  }

  private removeVideoFromActualPlaylist(video: TVideo) {
    let i = 0;
    while (i < this._actualPlaylist.length) {
      if (this._actualPlaylist[i].video === video) {
        this._actualPlaylist.splice(i, 1);
      } else {
        i++;
      }
    }
  }
  
  private findNextNotCurrentVideo() {
    if (this._currentPlayedVideo) {
      const currentPlayedIndex = this._actualPlaylist.indexOf(this._currentPlayedVideo);
      const nextNotcurrentPlayedvideos = this._actualPlaylist.filter((item, index) => {
        if (index <= currentPlayedIndex) return false;
        if (item.video === this._currentPlayedVideo?.video) return false;
        return true;
      });
      
      if (nextNotcurrentPlayedvideos.length === 0) return null;
      else return nextNotcurrentPlayedvideos[0];
    } else {
      throw 'currentPlayedVideo cannot be null';
    }
  }

  private reviewVideoToPlay(...justAdded: TVideo[]) {
    if (this._currentPlayedVideo === null) {
      if (justAdded.length > 0) {
        const newPlayedVideo = { video: justAdded[0] };
        this._actualPlaylist.push(newPlayedVideo);
        this.onPlayVideo(newPlayedVideo);
      } else {
        this.playNextVideo(false);
      }
    }
  }

  //#endregion

  //#endregion PUBLIC MEMBERS




  //#region PRIVATE MEMBERS

  //#region Methods
  public previous() {
    const currentIndex = this._currentPlayedVideo
      ? this._actualPlaylist.indexOf(this._currentPlayedVideo)
      : -1;

    if (currentIndex < 1) {
      if (this._actualPlaylist.length > 0) {
        this.onPlayVideo(this._actualPlaylist[0]);
      }
    } else if (this.currentVideoPosition < 5) {
        this.onPlayVideo(this._actualPlaylist[currentIndex - 1]);
    } else {
        this.onPlayVideo(this._actualPlaylist[currentIndex]);
    }
  }

  /** Call this method to forcefully go to the next video in the queue. */
  public next() {
   this.playNextVideo(true);
  }

  /** Call this method when your video player has finished playing the current video. */
  public playerEnded() {
    this.playNextVideo(false);
  }

  private playNextVideo(force: boolean) {
    const nextVideo = this.findNextVideoToPlay(force);
    if (nextVideo.playedVideo) {
      if (!nextVideo.fromActualPlaylist) {
        this._actualPlaylist.push(nextVideo.playedVideo);
      }
      this.onPlayVideo(nextVideo.playedVideo);
    } else {
      this.onPlayVideo(null);
    }
  }

  /** Checks if there are videos in the queue. If not, returns a new video taking `random` into account. */
  private findNextVideoToPlay(force: boolean): NextVideoResult<TVideo> {

    // Are there videos anyway?
    if (this._playlist.length === 0) {
      return {
        playedVideo: null,
        fromActualPlaylist: false
      };
    }

    if (this._currentPlayedVideo !== null) {
      const currentPlayedIndex = this._actualPlaylist.indexOf(this._currentPlayedVideo);

      if (currentPlayedIndex !== -1) {
        console.log('repeat current ?');
        // RepeatOne -> return current PlayedVideo
        if ((this.repeat === ERepeatMode.repeatOne) && !force) {
          console.log('repeat current');
          return {
            playedVideo: this._currentPlayedVideo,
            fromActualPlaylist: true
          };
        }

        // Check if there are still videos in the queue
        if (currentPlayedIndex < (this._actualPlaylist.length - 1)) {
          return {
            playedVideo: this._actualPlaylist[currentPlayedIndex + 1],
            fromActualPlaylist: true
          };
        }
      }
    }

    const newVideo = this.findNewVideoToPlay();
    if (newVideo === null) {
      return {
        playedVideo: null,
        fromActualPlaylist: false
      };
    } else {
      return {
        playedVideo: { video: newVideo },
        fromActualPlaylist: false
      };
    }
  }

  /** Returns  */
  private findNewVideoToPlay(): TVideo | null {
    if (this.shuffle) {
      const rnd = Math.floor(Math.random() * this._playlist.length);
      return this._playlist[rnd];
    }

    if (this._currentPlayedVideo) {
      const currentIndex = this._playlist.indexOf(this._currentPlayedVideo.video);
      if (currentIndex < (this._playlist.length - 1)) {
        return this._playlist[currentIndex + 1];
      } else if (this.repeat === ERepeatMode.repeatAll) {
        return this._playlist[0];
      }
    } else {
      return this._playlist[0];
    }

    return null;
  }

  private onPlayVideo(playedVideo: PlayedVideo<TVideo> | null) {
    this._currentPlayedVideo = playedVideo;
    this.video$.next(playedVideo ? playedVideo.video : null);
  }

  //#endregion

  //#endregion PRIVATE MEMBERS



}