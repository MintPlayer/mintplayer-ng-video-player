import { ERepeatMode } from '../../enums/repeat-mode';
import { PlaylistController } from './playlist-controller.service';

/** Records every value pushed onto `video$`, starting with the initial null. */
function track<T>(controller: PlaylistController<T>) {
  const seen: (T | null)[] = [];
  controller.video$.subscribe((v) => seen.push(v));
  return seen;
}

describe('PlaylistController', () => {
  let controller: PlaylistController<string>;

  beforeEach(() => {
    controller = new PlaylistController<string>();
  });

  it('starts empty, with nothing playing', () => {
    expect(controller.playlist).toEqual([]);
    expect(controller.video$.value).toBeNull();
    expect(controller.shuffle).toBe(false);
    expect(controller.repeat).toBe(ERepeatMode.noRepeat);
    expect(controller.currentVideoPosition).toBe(0);
  });

  describe('addToPlaylist', () => {
    it('starts playing the first video added', () => {
      const seen = track(controller);
      controller.addToPlaylist('a', 'b');

      expect(controller.playlist).toEqual(['a', 'b']);
      expect(seen).toEqual([null, 'a']);
    });

    it('leaves the current video alone when more are appended', () => {
      controller.addToPlaylist('a');
      const seen = track(controller);
      controller.addToPlaylist('b', 'c');

      expect(controller.playlist).toEqual(['a', 'b', 'c']);
      expect(seen).toEqual(['a']);
    });

    it('returns a defensive copy of the playlist', () => {
      controller.addToPlaylist('a');
      controller.playlist.push('smuggled');

      expect(controller.playlist).toEqual(['a']);
    });

    it('clones object videos so the caller cannot mutate the queue', () => {
      const objects = new PlaylistController<{ id: string }>();
      const original = { id: 'a' };
      objects.addToPlaylist(original);

      original.id = 'changed';

      expect(objects.playlist[0]).not.toBe(original);
      expect(objects.playlist[0].id).toBe('a');
    });

    it('keeps string videos as-is rather than boxing them', () => {
      controller.addToPlaylist('a');
      expect(controller.playlist[0]).toBe('a');
    });
  });

  describe('setPlaylist', () => {
    it('replaces the queue and plays the new first video', async () => {
      controller.addToPlaylist('a', 'b');
      const seen = track(controller);

      await controller.setPlaylist(['x', 'y']);

      expect(controller.playlist).toEqual(['x', 'y']);
      // 'a' is still the current video: setPlaylist only reviews what to play
      // when nothing is playing, and clearing the arrays does not clear that.
      expect(seen).toEqual(['a']);
    });

    it('plays the new first video when nothing was playing', async () => {
      const seen = track(controller);
      await controller.setPlaylist(['x', 'y']);

      expect(seen).toEqual([null, 'x']);
    });
  });

  describe('next', () => {
    it('walks the playlist in order', () => {
      controller.addToPlaylist('a', 'b', 'c');
      const seen = track(controller);

      controller.next();
      controller.next();

      expect(seen).toEqual(['a', 'b', 'c']);
    });

    it('stops at the end when not repeating', () => {
      controller.addToPlaylist('a', 'b');
      controller.next();
      const seen = track(controller);

      controller.next();

      expect(seen).toEqual(['b', null]);
    });

    it('wraps to the start when repeating all', () => {
      controller.addToPlaylist('a', 'b');
      controller.repeat = ERepeatMode.repeatAll;
      controller.next();
      const seen = track(controller);

      controller.next();

      expect(seen).toEqual(['b', 'a']);
    });

    it('advances past the current video even when repeating one', () => {
      // `next()` is the explicit user gesture, so it forces past repeatOne.
      controller.addToPlaylist('a', 'b');
      controller.repeat = ERepeatMode.repeatOne;
      const seen = track(controller);

      controller.next();

      expect(seen).toEqual(['a', 'b']);
    });

    it('does nothing on an empty playlist', () => {
      const seen = track(controller);
      controller.next();

      expect(seen).toEqual([null, null]);
    });

    it('replays a video already in the history rather than re-queueing it', () => {
      controller.addToPlaylist('a', 'b');
      controller.next();
      controller.previous();
      const seen = track(controller);

      // 'b' is still ahead in the actual playlist, so next() returns to it.
      controller.next();

      expect(seen).toEqual(['a', 'b']);
    });
  });

  describe('playerEnded', () => {
    it('advances to the next video', () => {
      controller.addToPlaylist('a', 'b');
      const seen = track(controller);

      controller.playerEnded();

      expect(seen).toEqual(['a', 'b']);
    });

    it('replays the same video when repeating one', () => {
      controller.addToPlaylist('a', 'b');
      controller.repeat = ERepeatMode.repeatOne;
      const seen = track(controller);

      controller.playerEnded();

      expect(seen).toEqual(['a', 'a']);
    });
  });

  describe('previous', () => {
    it('restarts the current video when more than 5 seconds in', () => {
      controller.addToPlaylist('a', 'b');
      controller.next();
      controller.currentVideoPosition = 30;
      const seen = track(controller);

      controller.previous();

      expect(seen).toEqual(['b', 'b']);
    });

    it('goes back a video when less than 5 seconds in', () => {
      controller.addToPlaylist('a', 'b');
      controller.next();
      controller.currentVideoPosition = 2;
      const seen = track(controller);

      controller.previous();

      expect(seen).toEqual(['b', 'a']);
    });

    it('restarts the first video rather than falling off the front', () => {
      controller.addToPlaylist('a', 'b');
      controller.currentVideoPosition = 30;
      const seen = track(controller);

      controller.previous();

      expect(seen).toEqual(['a', 'a']);
    });

    it('does nothing on an empty playlist', () => {
      const seen = track(controller);
      controller.previous();

      expect(seen).toEqual([null]);
    });
  });

  describe('shuffle', () => {
    it('picks the next video at random from the playlist', () => {
      controller.addToPlaylist('a', 'b', 'c');
      controller.shuffle = true;
      const random = jest.spyOn(Math, 'random').mockReturnValue(0.9);
      const seen = track(controller);

      controller.next();

      expect(seen).toEqual(['a', 'c']);
      random.mockRestore();
    });

    it('can land on the video that is already playing', () => {
      controller.addToPlaylist('a', 'b', 'c');
      controller.shuffle = true;
      const random = jest.spyOn(Math, 'random').mockReturnValue(0);
      const seen = track(controller);

      controller.next();

      expect(seen).toEqual(['a', 'a']);
      random.mockRestore();
    });
  });

  describe('removeFromPlaylist', () => {
    it('removes a video that is not playing without disturbing playback', () => {
      controller.addToPlaylist('a', 'b', 'c');
      const seen = track(controller);

      controller.removeFromPlaylist('c');

      expect(controller.playlist).toEqual(['a', 'b']);
      expect(seen).toEqual(['a']);
    });

    it('skips to the next queued video when removing the one playing', () => {
      controller.addToPlaylist('a', 'b');
      controller.next();
      controller.previous();
      const seen = track(controller);

      // 'b' is still queued after 'a' in the actual playlist.
      controller.removeFromPlaylist('a');

      expect(controller.playlist).toEqual(['b']);
      expect(seen).toEqual(['a', 'b']);
    });

    it('advances into the rest of the playlist when nothing is queued', () => {
      controller.addToPlaylist('a', 'b');
      const seen = track(controller);

      controller.removeFromPlaylist('a');

      expect(controller.playlist).toEqual(['b']);
      expect(seen).toEqual(['a', 'b']);
    });

    it('stops playback when the last video is removed', () => {
      controller.addToPlaylist('a');
      const seen = track(controller);

      controller.removeFromPlaylist('a');

      expect(controller.playlist).toEqual([]);
      expect(seen).toEqual(['a', null]);
    });

    it('purges every history entry for a repeated video', () => {
      controller.addToPlaylist('a', 'b');
      controller.repeat = ERepeatMode.repeatOne;
      controller.playerEnded();
      controller.playerEnded();

      // 'a' now sits in the actual playlist once but is the current video;
      // removing it must not leave a stale entry behind that a later next()
      // could resolve to.
      controller.removeFromPlaylist('a');

      expect(controller.playlist).toEqual(['b']);
      expect(controller.video$.value).toBe('b');
    });

    it('ignores a video that was never in the playlist', () => {
      controller.addToPlaylist('a');
      const seen = track(controller);

      // indexOf returns -1, and splice(-1, 1) would drop the LAST element —
      // so this is the case that would quietly eat 'a'.
      controller.removeFromPlaylist('nope');

      expect(controller.playlist).toEqual(['a']);
      expect(seen).toEqual(['a']);
    });
  });
});

describe('ERepeatMode', () => {
  it('has stable numeric values', () => {
    expect(ERepeatMode.noRepeat).toBe(0);
    expect(ERepeatMode.repeatOne).toBe(1);
    expect(ERepeatMode.repeatAll).toBe(2);
  });
});
