import { EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import {
  PlaybackUpdateEvent,
  SpotifyController,
} from '../../interfaces/spotify-iframe-api';
import { SpotifyApiService } from './spotify-api.service';

// The real loader appends a <script> to the document and waits for its window
// callback — in jsdom that never resolves, and it would reach out to the
// network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the Spotify iframe api this service actually drives. */
function fakeSpotify() {
  const calls: string[] = [];
  const listeners: Record<string, ((data?: unknown) => void)[]> = {};
  const addedListeners: { ev: string; cb: (data?: unknown) => void }[] = [];
  const removedListeners: { ev: string; cb: (data?: unknown) => void }[] = [];
  const controller = {
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    resume: () => calls.push('resume'),
    playFromStart: () => calls.push('playFromStart'),
    togglePlay: () => calls.push('togglePlay'),
    loadUri: (uri: string) => calls.push(`loadUri(${uri})`),
    seek: (seconds: number) => calls.push(`seek(${seconds})`),
    destroy: () => calls.push('destroy'),
    setIframeDimensions: (w: number, h: number) =>
      calls.push(`setIframeDimensions(${w},${h})`),
    addListener: (ev: string, cb: (data?: unknown) => void) => {
      addedListeners.push({ ev, cb });
      (listeners[ev] = listeners[ev] ?? []).push(cb);
    },
    removeListener: (ev: string, cb: (data?: unknown) => void) => {
      removedListeners.push({ ev, cb });
      listeners[ev] = (listeners[ev] ?? []).filter((h) => h !== cb);
    },
  } as unknown as SpotifyController;

  let createdWith: { el: HTMLElement; options: Record<string, unknown> } | null =
    null;

  const api = {
    createController: (
      el: HTMLElement,
      options: Record<string, unknown>,
      callback: (controller: SpotifyController) => void
    ) => {
      createdWith = { el, options };
      callback(controller);
    },
  };

  return {
    api,
    calls,
    controller,
    addedListeners,
    removedListeners,
    fire: (ev: string, data?: unknown) =>
      [...(listeners[ev] ?? [])].forEach((cb) => cb(data)),
    get createdWith() {
      return createdWith;
    },
  };
}

/** A playback_update event, in the milliseconds the api reports. */
function playback(
  isPaused: boolean,
  position: number,
  duration: number
): PlaybackUpdateEvent {
  return { data: { isPaused, isBuffering: false, position, duration } };
}

describe('SpotifyApiService', () => {
  let service: SpotifyApiService;

  beforeEach(() => {
    loadScriptMock.mockReset();
    loadScriptMock.mockResolvedValue([]);
    service = new SpotifyApiService();
  });

  it('identifies itself as the spotify platform', () => {
    expect(service.id).toBe('spotify');
  });

  it('loads the embed-podcast iframe api and waits for its window callback', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://open.spotify.com/embed-podcast/iframe-api/v1',
      { windowCallback: 'onSpotifyIframeApiReady' }
    );
  });

  it('keeps the api object the window callback handed it', async () => {
    const spotify = fakeSpotify();
    loadScriptMock.mockResolvedValue([spotify.api]);

    await expect(service.loadApi()).resolves.toBe(spotify.api);
  });

  describe('urlRegexes', () => {
    /** The id the VideoPlayer would build from `url`, or null. */
    function idFor(url: string) {
      for (const rgx of service.urlRegexes) {
        const match = new RegExp(rgx).exec(url);
        if (match) return service.match2id(match);
      }
      return null;
    }

    it.each([
      ['https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 'track'],
      ['http://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 'track'],
      ['https://open.spotify.com/episode/4cOdK2wGLETKBW3PvgPWqT', 'episode'],
    ])('turns the web url %s into a spotify uri', (url, type) => {
      expect(idFor(url)).toBe(`spotify:${type}:4cOdK2wGLETKBW3PvgPWqT`);
    });

    it.each([
      ['spotify:track:4cOdK2wGLETKBW3PvgPWqT', 'track'],
      ['spotify:episode:4cOdK2wGLETKBW3PvgPWqT', 'episode'],
    ])('keeps the already-canonical uri %s', (url, type) => {
      expect(idFor(url)).toBe(`spotify:${type}:4cOdK2wGLETKBW3PvgPWqT`);
    });

    it('leaves the tracking parameters of a share link out of the id', () => {
      // Every Spotify share link carries ?si=<token>; letting it into the id
      // would produce a uri the embed cannot play.
      expect(
        idFor('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc')
      ).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
      expect(
        idFor('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=a&x=1')
      ).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
    });

    it('reads the same id from a url with no query at all', () => {
      expect(idFor('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toBe(
        'spotify:track:4cOdK2wGLETKBW3PvgPWqT'
      );
    });

    it.each([
      // Only tracks and episodes are playable through this api.
      'https://open.spotify.com/album/4cOdK2wGLETKBW3PvgPWqT',
      'https://open.spotify.com/playlist/4cOdK2wGLETKBW3PvgPWqT',
      'spotify:album:4cOdK2wGLETKBW3PvgPWqT',
      'https://open.spotify.com/track/',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  describe('match2id', () => {
    it('rejects a match with no named groups', () => {
      const match = /spotify/.exec('spotify') as RegExpExecArray;

      expect(() => service.match2id(match)).toThrow(
        'match2id - match.groups is undefined'
      );
    });
  });

  it('prepares a div for the api to take over', () => {
    const html = service.prepareHtml({ domId: 'player1', width: 600, height: 450 });
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('div')!.id).toBe('player1');
    // max-width so the iframe the api injects cannot overflow its column.
    expect(container.querySelector('div')!.getAttribute('style')).toContain(
      'max-width:100%'
    );
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let spotify: ReturnType<typeof fakeSpotify>;
    let element: HTMLElement;

    beforeEach(async () => {
      // createPlayer delays autoplay by 3000ms and the end-of-track detection
      // by 20ms.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      spotify = fakeSpotify();
      element = document.createElement('div');
      element.appendChild(document.createElement('div'));
      loadScriptMock.mockResolvedValue([spotify.api]);
      await service.loadApi();
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    function options(extra: Record<string, unknown>) {
      return {
        width: 600,
        height: 450,
        autoplay: false,
        element,
        ...extra,
      } as never;
    }

    it('rejects without a host element', async () => {
      await expect(
        service.createPlayer(
          options({ element: null, initialVideoId: 'spotify:track:abc' }),
          destroy
        )
      ).rejects.toBe('The Spotify api requires the options.element to be set');
    });

    it('rejects when loadApi never handed it an api object', async () => {
      const fresh = new SpotifyApiService();

      await expect(
        fresh.createPlayer(options({ initialVideoId: 'spotify:track:abc' }), destroy)
      ).rejects.toBe('The Spotify api should have been set here');
    });

    it('rejects without an initial video, since the controller needs a uri', async () => {
      await expect(
        service.createPlayer(options({}), destroy)
      ).rejects.toBe('The Spotify api requires an initial video');
    });

    it('builds the controller on the inner div, with the uri and the size', async () => {
      const promise = service.createPlayer(
        options({ initialVideoId: 'spotify:track:abc' }),
        destroy
      );
      spotify.fire('ready');
      await promise;

      expect(spotify.createdWith!.el).toBe(element.querySelector('div'));
      expect(spotify.createdWith!.options).toEqual({
        uri: 'spotify:track:abc',
        width: 600,
        height: 450,
      });
    });

    it('resolves only once the controller reports it is ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer(options({ initialVideoId: 'spotify:track:abc' }), destroy)
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      spotify.fire('ready');
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the ready handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        options({ autoplay, initialVideoId: 'spotify:track:abc' }),
        destroy
      );
      spotify.fire('ready');
      return (await promise) as PlayerAdapter;
    }

    it('starts autoplay only well after the controller is ready', async () => {
      await ready(true);

      expect(spotify.calls).not.toContain('play');
      // The embed needs time to settle before it accepts a play call.
      jest.advanceTimersByTime(3000);

      expect(spotify.calls).toContain('play');
    });

    it('does not start playback when autoplay is off', async () => {
      await ready(false);

      jest.advanceTimersByTime(3000);

      expect(spotify.calls).not.toContain('play');
    });

    it('builds the adapter only once, however often ready fires', async () => {
      const adapter = await ready();

      spotify.fire('ready');
      adapter.setProgress(5);

      // A second handshake must not leave a stale adapter driving the
      // controller: only one seek should have gone through.
      expect(spotify.calls.filter((c) => c === 'seek(5)')).toHaveLength(1);
    });

    it('advertises no capabilities at all', async () => {
      const adapter = await ready();

      // No volume, no mute, no fullscreen, no pip, no title: the embed exposes
      // none of them.
      expect(adapter.capabilities).toEqual([]);
    });

    it('swaps the track without rebuilding the controller', async () => {
      const adapter = await ready();

      adapter.loadVideoById('spotify:track:other');

      expect(spotify.calls).toContain('loadUri(spotify:track:other)');
    });

    it('maps player state onto resume and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has an api equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(spotify.calls).toEqual(['resume', 'pause']);
    });

    it('refuses to mute or change the volume', async () => {
      const adapter = await ready();

      expect(() => adapter.setMute(true)).toThrow(
        "Spotify api doesn't allow mute"
      );
      expect(() => adapter.setVolume(40)).toThrow(
        "Spotify api doesn't allow changing the volume"
      );
    });

    it('seeks through the controller', async () => {
      const adapter = await ready();

      adapter.setProgress(12);

      expect(spotify.calls).toContain('seek(12)');
    });

    it('resizes through the controller, which owns the iframe', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(spotify.calls).toContain('setIframeDimensions(320,240)');
    });

    it('has no title to offer', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).rejects.toBe(
        "Spotify api doesn't allow getting the title"
      );
    });

    it('refuses fullscreen and pip, and reports both as off', async () => {
      const adapter = await ready();

      expect(() => adapter.setFullscreen(true)).toThrow(
        "Spotify doesn't support fullscreen"
      );
      expect(() => adapter.setPip(true)).toThrow(
        "Spotify doesn't support picture-in-picture"
      );
      await expect(adapter.getFullscreen()).resolves.toBe(false);
      await expect(adapter.getPip()).resolves.toBe(false);
    });

    it('accepts a request to leave fullscreen or pip it was never in', async () => {
      const adapter = await ready();

      // The VideoPlayer forwards its isFullscreen/isPip values
      // unconditionally, so clearing them has to be a no-op rather than an
      // error — only asking to turn them on is a mistake.
      expect(() => adapter.setFullscreen(false)).not.toThrow();
      expect(() => adapter.setPip(false)).not.toThrow();
      expect(() => adapter.setFullscreen(true)).toThrow();
      expect(() => adapter.setPip(true)).toThrow();
    });

    it('translates a playback update into progress, duration and state', async () => {
      const adapter = await ready();
      const times: number[] = [];
      const durations: number[] = [];
      const states: EPlayerState[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onDurationChange = (d) => durations.push(d);
      adapter.onStateChange = (s) => states.push(s);

      spotify.fire('playback_update', playback(false, 30000, 300000));
      spotify.fire('playback_update', playback(true, 45000, 300000));

      // The api reports milliseconds; the adapter speaks seconds.
      expect(times).toEqual([30, 45]);
      expect(durations).toEqual([300, 300]);
      expect(states).toEqual([EPlayerState.playing, EPlayerState.paused]);
    });

    it('reads a rewind to the start of a finished track as the end of it', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      // The embed never says "ended": it reports the last position, then a
      // paused update back at zero. That pair is the only signal available.
      spotify.fire('playback_update', playback(false, 300000, 300000));
      spotify.fire('playback_update', playback(true, 0, 300000));
      jest.advanceTimersByTime(20);

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
    });

    it('does not read a mid-track pause as the end of the track', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      spotify.fire('playback_update', playback(false, 120000, 300000));
      spotify.fire('playback_update', playback(true, 0, 300000));
      jest.advanceTimersByTime(20);

      expect(states).toEqual([EPlayerState.playing, EPlayerState.paused]);
    });

    /** The states reported for a last-position/rewind pair of updates. */
    function endStates(adapter: PlayerAdapter, last: PlaybackUpdateEvent, rewind: PlaybackUpdateEvent) {
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      spotify.fire('playback_update', last);
      spotify.fire('playback_update', rewind);
      jest.advanceTimersByTime(20);

      return states;
    }

    it('allows the last position to fall half a second short of the duration', async () => {
      const adapter = await ready();

      // The embed rarely reports the final millisecond, so the window is half
      // a second wide — measured in the milliseconds the api speaks.
      expect(
        endStates(adapter, playback(false, 299800, 300000), playback(true, 0, 300000))
      ).toEqual([EPlayerState.playing, EPlayerState.paused, EPlayerState.ended]);
    });

    it('does not treat a stop well before the end as the end of the track', async () => {
      const adapter = await ready();

      expect(
        endStates(adapter, playback(false, 299200, 300000), playback(true, 0, 300000))
      ).toEqual([EPlayerState.playing, EPlayerState.paused]);
    });

    it('tolerates the reported duration drifting by up to three seconds', async () => {
      const adapter = await ready();

      // The two updates must be about the same track; the embed refines its
      // duration estimate as it goes.
      expect(
        endStates(adapter, playback(false, 299800, 300000), playback(true, 0, 302500))
      ).toEqual([EPlayerState.playing, EPlayerState.paused, EPlayerState.ended]);
    });

    it('tolerates the duration drifting down as well as up', async () => {
      const adapter = await ready();

      expect(
        endStates(adapter, playback(false, 299800, 300000), playback(true, 0, 297500))
      ).toEqual([EPlayerState.playing, EPlayerState.paused, EPlayerState.ended]);
    });

    it('reads a bigger duration jump as a different track, not an ending', async () => {
      const adapter = await ready();

      expect(
        endStates(adapter, playback(false, 299800, 300000), playback(true, 0, 304000))
      ).toEqual([EPlayerState.playing, EPlayerState.paused]);
    });

    it('destroys the controller on destroy', async () => {
      const adapter = await ready();

      adapter.destroy();

      expect(spotify.calls).toContain('destroy');
    });

    it('detaches the playback listener on destroy', async () => {
      const adapter = await ready();
      const times: number[] = [];
      const added = spotify.addedListeners.find(
        (l) => l.ev === 'playback_update'
      )!;

      adapter.destroy();
      adapter.onCurrentTimeChange = (t) => times.push(t);
      spotify.fire('playback_update', playback(false, 30000, 300000));

      // The very function that was registered has to be handed back, or the
      // embed keeps the subscription and a destroyed adapter still fires.
      expect(spotify.removedListeners).toEqual([
        { ev: 'playback_update', cb: added.cb },
      ]);
      expect(times).toEqual([]);
    });

    it('stops detecting the end of the track on destroy', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      spotify.fire('playback_update', playback(false, 300000, 300000));
      adapter.destroy();
      spotify.fire('playback_update', playback(true, 0, 300000));
      jest.advanceTimersByTime(20);

      expect(states).toEqual([EPlayerState.playing]);
    });

    it('stops detecting the end of the track once the owner signals destruction', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      destroy.next(true);
      spotify.fire('playback_update', playback(false, 300000, 300000));
      spotify.fire('playback_update', playback(true, 0, 300000));
      jest.advanceTimersByTime(20);

      // The end-of-track pipeline is torn down; the raw per-event state
      // forwarding is not.
      expect(states).toEqual([EPlayerState.playing, EPlayerState.paused]);
    });
  });
});
