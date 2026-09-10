import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { FacebookApiService } from './facebook-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

interface FakePlayer {
  getCurrentPosition(): number;
  getDuration(): number;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  unmute(): void;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  subscribe(ev: string, handler: () => void): { release: () => void };
}

interface ReadyMessage {
  type: string;
  id: string;
  instance: FakePlayer;
}

/** The slice of an FB video player instance this service actually drives. */
function fakePlayer(name: string, calls: string[]) {
  const state = { position: 12, duration: 300, volume: 0.5, muted: false };
  const handlers: Record<string, () => void> = {};

  const player: FakePlayer = {
    getCurrentPosition: () => state.position,
    getDuration: () => state.duration,
    getVolume: () => state.volume,
    isMuted: () => state.muted,
    mute: () => {
      state.muted = true;
      calls.push(`${name}.mute`);
    },
    unmute: () => {
      state.muted = false;
      calls.push(`${name}.unmute`);
    },
    play: () => calls.push(`${name}.play`),
    pause: () => calls.push(`${name}.pause`),
    seek: (seconds) => calls.push(`${name}.seek(${seconds})`),
    setVolume: (volume) => {
      state.volume = volume;
      calls.push(`${name}.setVolume(${volume})`);
    },
    subscribe: (ev, handler) => {
      handlers[ev] = handler;
      calls.push(`${name}.subscribe(${ev})`);
      return { release: () => calls.push(`${name}.release(${ev})`) };
    },
  };

  return { player, state, fire: (ev: string) => handlers[ev]?.() };
}

/** The slice of the global Facebook SDK this service actually uses. */
function fakeFb() {
  const inits: unknown[] = [];
  const subscribedEvents: string[] = [];
  let readyHandler: ((message: ReadyMessage) => void) | undefined;

  (globalThis as { FB?: unknown }).FB = {
    init: (config: unknown) => inits.push(config),
    Event: {
      subscribe: (action: string, callback: (message: ReadyMessage) => void) => {
        subscribedEvents.push(action);
        if (action === 'xfbml.ready') {
          readyHandler = callback;
        }
      },
    },
  };

  return {
    inits,
    subscribedEvents,
    ready: (message: ReadyMessage) => readyHandler?.(message),
  };
}

describe('FacebookApiService', () => {
  let service: FacebookApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new FacebookApiService();
  });

  afterEach(() => {
    delete (globalThis as { FB?: unknown }).FB;
  });

  it('identifies itself as the facebook platform', () => {
    expect(service.id).toBe('facebook');
  });

  it('refuses player reuse, so every video rebuilds the embed', () => {
    // There is no loadVideoById on an fb-video embed, so the VideoPlayer has
    // to re-render the html instead of swapping the source.
    expect(service.canReusePlayer).toBe(false);
  });

  it('loads the Facebook SDK and waits for its window callback', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0',
      { windowCallback: 'fbAsyncInit' }
    );
  });

  describe('urlRegexes', () => {
    /** The named groups the VideoPlayer would extract from `url`, or null. */
    function groupsFor(url: string) {
      for (const rgx of service.urlRegexes) {
        const match = new RegExp(rgx).exec(url);
        if (match?.groups) return match.groups;
      }
      return null;
    }

    it('exposes one regex per supported facebook url shape', () => {
      expect(service.urlRegexes).toHaveLength(2);
    });

    it.each([
      'https://www.facebook.com/someuser/videos/1234567890/',
      'https://facebook.com/someuser/videos/1234567890',
      'http://www.facebook.com/someuser/videos/1234567890/',
    ])('matches the /user/videos/ url %s', (url) => {
      expect(groupsFor(url)).not.toBeNull();
    });

    it('names the user and the video number of a /user/videos/ url', () => {
      const groups = groupsFor(
        'https://www.facebook.com/someuser/videos/1234567890/'
      )!;

      expect(groups['id']).toBe(
        'https://www.facebook.com/someuser/videos/1234567890/'
      );
      expect(groups['user']).toBe('someuser');
      expect(groups['video']).toBe('1234567890');
    });

    it('stops the id at the query separator of a /user/videos/ url', () => {
      // `[/?]*` swallows the separator but nothing after it, so a tracking
      // query never becomes part of the video id.
      const groups = groupsFor(
        'https://www.facebook.com/someuser/videos/1234567890/?ref=share'
      )!;

      expect(groups['id']).toBe(
        'https://www.facebook.com/someuser/videos/1234567890/?'
      );
    });

    it.each([
      'https://www.facebook.com/watch/?v=1234567890',
      'https://facebook.com/watch/?v=1234567890',
      'http://www.facebook.com/watch/?v=1234567890',
    ])('matches the /watch/ url %s', (url) => {
      const groups = groupsFor(url)!;

      expect(groups['id']).toBe(url);
    });

    it('has no user or video group for a /watch/ url', () => {
      const groups = groupsFor('https://www.facebook.com/watch/?v=1234567890')!;

      expect(groups['user']).toBeUndefined();
      expect(groups['video']).toBeUndefined();
    });

    it.each([
      // The video part has to be numeric.
      'https://www.facebook.com/someuser/videos/abcdef',
      // A user but no /videos/ segment.
      'https://www.facebook.com/someuser/photos/1234567890',
      // /watch/ with a non-numeric v.
      'https://www.facebook.com/watch/?v=abcdef',
      // Anchored at the start, so another host never matches.
      'https://www.youtube.com/watch?v=1234567890',
      'https://www.notfacebook.com/someuser/videos/1234567890',
    ])('does not match %s', (url) => {
      expect(groupsFor(url)).toBeNull();
    });
  });

  describe('prepareHtml', () => {
    it('renders the fb-video div the SDK takes over', () => {
      const html = service.prepareHtml({
        domId: 'player1',
        width: 600,
        height: 450,
        initialVideoId: 'https://www.facebook.com/someuser/videos/1234567890/',
      });
      const container = document.createElement('div');
      container.innerHTML = html;
      const div = container.querySelector('div')!;

      expect(div.id).toBe('player1');
      // The class is what tells the SDK's xfbml parser to claim this div.
      expect(div.className).toBe('fb-video');
      expect(div.getAttribute('data-href')).toBe(
        'https://www.facebook.com/someuser/videos/1234567890/'
      );
      expect(div.getAttribute('data-width')).toBe('600');
      expect(div.getAttribute('data-height')).toBe('450');
      expect(div.getAttribute('data-autoplay')).toBe('true');
      expect(div.getAttribute('data-allowfullscreen')).toBe('true');
      expect(div.getAttribute('data-controls')).toBe('true');
    });

    it('rejects a request with no initial video id', () => {
      expect(() =>
        service.prepareHtml({ domId: 'player1', width: 600, height: 450 })
      ).toThrow('The Facebook api requires an initial video id');
    });

    it.each([
      'https://www.facebook.com/a b/videos/1',
      'https://www.facebook.com/a"/videos/1',
      'https://www.facebook.com/a<b/videos/1',
      'https://www.facebook.com/a>b/videos/1',
    ])('refuses to interpolate the injectable id %s', (initialVideoId) => {
      // The id lands unescaped in a data-href="" attribute, so a quote or an
      // angle bracket would let the caller inject markup into the host page.
      expect(() =>
        service.prepareHtml({
          domId: 'player1',
          width: 600,
          height: 450,
          initialVideoId,
        })
      ).toThrow('The url contains invalid characters');
    });
  });

  describe('createPlayer', () => {
    const domId = 'fb-player-1';
    let destroy: Subject<boolean>;
    let fb: ReturnType<typeof fakeFb>;
    let calls: string[];
    let main: ReturnType<typeof fakePlayer>;
    let element: HTMLElement;
    let warn: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      fb = fakeFb();
      calls = [];
      main = fakePlayer('p1', calls);
      element = document.createElement('div');
      // Unregistered adapter callbacks warn on every poll tick.
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      warn.mockRestore();
      jest.useRealTimers();
    });

    function create(autoplay = false) {
      return service.createPlayer(
        { width: 600, height: 450, autoplay, element, domId },
        destroy
      ) as Promise<PlayerAdapter>;
    }

    /**
     * createPlayer plus the xfbml.ready handshake exactly as the SDK does it:
     * the message arrives right after the embed is parsed. The 500ms flush is
     * what lets the instance through the service's debounceTime.
     */
    async function ready(autoplay = false) {
      const adapter = await create(autoplay);
      fb.ready({ type: 'video', id: domId, instance: main.player });
      jest.advanceTimersByTime(500);
      return adapter;
    }

    it('initialises the SDK with xfbml parsing turned on', async () => {
      await create();

      expect(fb.inits).toEqual([{ xfbml: true, version: 'v2.5' }]);
    });

    it('listens for the xfbml.ready message the SDK fires per embed', async () => {
      await create();

      expect(fb.subscribedEvents).toEqual(['xfbml.ready']);
    });

    it('advertises mute and volume support, and nothing else', async () => {
      const adapter = await create();

      expect(adapter.capabilities).toEqual([ECapability.mute, ECapability.volume]);
    });

    it('ignores an xfbml.ready message of another type', async () => {
      const adapter = await create();

      fb.ready({ type: 'post', id: domId, instance: main.player });
      jest.advanceTimersByTime(500);
      adapter.setProgress(30);

      expect(calls).toEqual([]);
    });

    it('ignores an xfbml.ready message for another embed on the page', async () => {
      const adapter = await create();

      fb.ready({ type: 'video', id: 'some-other-embed', instance: main.player });
      jest.advanceTimersByTime(500);
      adapter.setProgress(30);

      expect(calls).toEqual([]);
    });

    it('adopts the instance of the matching xfbml.ready message', async () => {
      const adapter = await ready();

      adapter.setProgress(30);

      expect(calls).toContain('p1.seek(30)');
    });

    it('does nothing at all before an instance has arrived', async () => {
      const adapter = await create();
      const durations: number[] = [];
      adapter.onDurationChange = (d) => durations.push(d);

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      adapter.setMute(true);
      adapter.setVolume(40);
      adapter.setProgress(30);
      jest.advanceTimersByTime(500);

      expect(calls).toEqual([]);
      expect(durations).toEqual([]);
    });

    it('reports the duration before starting playback', async () => {
      const adapter = await ready();
      const durations: number[] = [];
      adapter.onDurationChange = (d) => durations.push(d);

      adapter.setPlayerState(EPlayerState.playing);

      // The duration is only known once an instance exists, so playing is the
      // moment the service pushes it out.
      expect(durations).toEqual([300]);
      expect(calls).toContain('p1.play');
    });

    it('pauses the player when asked to', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.paused);

      expect(calls).toContain('p1.pause');
    });

    it.each([EPlayerState.ended, EPlayerState.unstarted])(
      'has no SDK equivalent for state %s',
      async (state) => {
        const adapter = await ready();
        calls.length = 0;

        adapter.setPlayerState(state);

        expect(calls).toEqual([]);
      }
    );

    it('cannot swap the video in place, so loadVideoById does nothing', async () => {
      const adapter = await ready();
      calls.length = 0;

      adapter.loadVideoById('https://www.facebook.com/someuser/videos/999/');

      expect(calls).toEqual([]);
    });

    it('cannot resize the embed, so setSize does nothing', async () => {
      const adapter = await ready();
      calls.length = 0;

      adapter.setSize(320, 240);

      expect(calls).toEqual([]);
    });

    it('mutes and unmutes through the instance', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      jest.advanceTimersByTime(20);
      adapter.setMute(false);

      expect(calls).toContain('p1.mute');
      expect(calls).toContain('p1.unmute');
    });

    it('scales volume from the 0-100 api onto the SDK 0-1 range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(calls).toContain('p1.setVolume(0.4)');
    });

    it('drops a volume change that lands inside the mute window', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setVolume(40);

      // Muting an fb player reports a volume of its own; the 20ms window keeps
      // that echo from being written straight back.
      expect(calls).not.toContain('p1.setVolume(0.4)');
    });

    it('accepts volume changes again once the mute window closes', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      jest.advanceTimersByTime(20);
      adapter.setVolume(40);

      expect(calls).toContain('p1.setVolume(0.4)');
    });

    it('seeks to the requested position', async () => {
      const adapter = await ready();

      adapter.setProgress(42);

      expect(calls).toContain('p1.seek(42)');
    });

    it('rejects a request for the title', async () => {
      const adapter = await create();

      await expect(adapter.getTitle()).rejects.toBe(
        "The Facebook player doesn't allow getting the title"
      );
    });

    it('refuses fullscreen and pip outright', async () => {
      const adapter = await create();

      expect(() => adapter.setFullscreen(true)).toThrow(
        "The Facebook player doesn't allow fullscreen mode"
      );
      expect(() => adapter.setPip(true)).toThrow(
        "The Facebook player doesn't allow PiP mode"
      );
    });

    it('reports itself as never fullscreen and never in pip', async () => {
      const adapter = await create();

      await expect(adapter.getFullscreen()).resolves.toBe(false);
      await expect(adapter.getPip()).resolves.toBe(false);
    });

    it('polls progress, volume and mute off the instance', async () => {
      const adapter = await ready();
      const times: number[] = [];
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);

      jest.advanceTimersByTime(100);

      expect(times).toContain(12);
      // Scaled back up from the SDK's 0-1 range.
      expect(volumes).toContain(50);
      expect(mutes).toContain(false);
    });

    it('does not report a volume of zero while the player is muted', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);
      main.state.muted = true;
      main.state.volume = 0;

      jest.advanceTimersByTime(100);

      // Otherwise unmuting would restore a volume of 0 instead of the one the
      // user had set.
      expect(volumes).toEqual([]);
      expect(mutes).toContain(true);
    });

    it('still reports the volume of a muted player that kept its level', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      main.state.muted = true;
      main.state.volume = 0.3;

      jest.advanceTimersByTime(100);

      expect(volumes).toContain(30);
    });

    it('skips the polled volume while the mute window is open', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      const times: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onCurrentTimeChange = (t) => times.push(t);

      // Line up with the 50ms poll interval so that the next tick lands inside
      // the 20ms window setMute opens.
      jest.advanceTimersByTime(45);
      adapter.setMute(true);
      jest.advanceTimersByTime(10);

      expect(times).toEqual([12]);
      expect(volumes).toEqual([]);
    });

    it('translates the instance events into state changes', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      main.fire('startedPlaying');
      main.fire('paused');
      main.fire('finishedPlaying');

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
    });

    it('subscribes to exactly the three playback events it maps', async () => {
      await ready();

      expect(calls.filter((c) => c.includes('.subscribe('))).toEqual([
        'p1.subscribe(startedPlaying)',
        'p1.subscribe(paused)',
        'p1.subscribe(finishedPlaying)',
      ]);
    });

    it('subscribes the very first instance, once its debounce window closes', async () => {
      // The SDK fires xfbml.ready well within 500ms of createPlayer, so this
      // prompt path is the normal one — `startWith(undefined)` is what gives
      // pairwise() a partner for that first instance.
      const adapter = await create();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      fb.ready({ type: 'video', id: domId, instance: main.player });
      jest.advanceTimersByTime(499);
      expect(calls).toEqual([]);

      jest.advanceTimersByTime(1);
      expect(calls.filter((c) => c.includes('.subscribe('))).toHaveLength(3);

      main.fire('startedPlaying');
      expect(states).toEqual([EPlayerState.playing]);
    });

    it('moves its subscriptions over when the SDK re-renders the embed', async () => {
      // FB fires xfbml.ready several times per embed; only the last instance
      // is the controllable one.
      const adapter = await ready();
      const second = fakePlayer('p2', calls);
      calls.length = 0;

      fb.ready({ type: 'video', id: domId, instance: second.player });
      jest.advanceTimersByTime(500);

      expect(calls).toEqual([
        'p1.release(startedPlaying)',
        'p1.release(paused)',
        'p1.release(finishedPlaying)',
        'p2.subscribe(startedPlaying)',
        'p2.subscribe(paused)',
        'p2.subscribe(finishedPlaying)',
      ]);

      calls.length = 0;
      adapter.setProgress(7);
      expect(calls).toEqual(['p2.seek(7)']);
    });

    it('releases the instance events on destroy', async () => {
      const adapter = await ready();
      calls.length = 0;

      adapter.destroy();

      expect(calls).toEqual([
        'p1.release(startedPlaying)',
        'p1.release(paused)',
        'p1.release(finishedPlaying)',
      ]);
    });

    it('survives a destroy that happens before any instance arrived', async () => {
      const adapter = await create();

      expect(() => adapter.destroy()).not.toThrow();
    });

    it('stops polling on destroy', async () => {
      const adapter = await ready();
      const times: number[] = [];

      adapter.destroy();
      adapter.onCurrentTimeChange = (t) => times.push(t);
      jest.advanceTimersByTime(200);

      expect(times).toEqual([]);
    });

    it('stops polling once the owner signals destruction', async () => {
      const adapter = await ready();
      const times: number[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);

      destroy.next(true);
      times.length = 0;
      jest.advanceTimersByTime(200);

      expect(times).toEqual([]);
    });

    it('starts playback itself when autoplay is requested', async () => {
      await ready(true);
      calls.length = 0;

      // The autoplay pipeline waits out debounceTime(1500) — counted from the
      // xfbml.ready message, 500ms of which `ready` already advanced — and
      // then one more 50ms timeout before touching the player.
      jest.advanceTimersByTime(1000);
      expect(calls).not.toContain('p1.play');

      jest.advanceTimersByTime(50);
      expect(calls).toContain('p1.play');
    });

    it('autoplays only once, however often the embed re-renders', async () => {
      await ready(true);
      jest.advanceTimersByTime(1550);
      calls.length = 0;

      fb.ready({ type: 'video', id: domId, instance: main.player });
      jest.advanceTimersByTime(2000);

      expect(calls).not.toContain('p1.play');
    });

    it('leaves playback alone when autoplay is off', async () => {
      await ready(false);
      calls.length = 0;

      jest.advanceTimersByTime(2000);

      expect(calls).not.toContain('p1.play');
    });
  });
});
