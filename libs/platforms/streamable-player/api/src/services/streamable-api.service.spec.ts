import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { StreamableService } from './streamable-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/**
 * The slice of embed.ly's player.js this service drives. The real one talks to
 * the iframe over postMessage; the service only ever touches this surface, so
 * the fake stands in for the whole bridge.
 */
function fakePlayerJs() {
  const calls: string[] = [];
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  let volume = 60;
  let muted = false;
  let constructedFor: HTMLIFrameElement | null = null;

  class FakePlayer {
    constructor(iframe: HTMLIFrameElement) {
      constructedFor = iframe;
    }

    on(event: string, handler: (...args: unknown[]) => void) {
      (handlers[event] = handlers[event] ?? []).push(handler);
      calls.push(`on(${event})`);
    }

    off(event: string, handler: (...args: unknown[]) => void) {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
      calls.push(`off(${event})`);
    }

    play() {
      calls.push('play');
    }

    pause() {
      calls.push('pause');
    }

    mute() {
      muted = true;
      calls.push('mute');
    }

    unmute() {
      muted = false;
      calls.push('unmute');
    }

    setVolume(v: number) {
      volume = v;
      calls.push(`setVolume(${v})`);
    }

    setCurrentTime(time: number) {
      calls.push(`setCurrentTime(${time})`);
    }

    setLoop(loop: boolean) {
      calls.push(`setLoop(${loop})`);
    }

    getVolume(callback: (v: number) => void) {
      callback(volume);
    }

    getMuted(callback: (m: boolean) => void) {
      callback(muted);
    }
  }

  (globalThis as { playerjs?: unknown }).playerjs = { Player: FakePlayer };

  return {
    calls,
    fire: (event: string, ...args: unknown[]) =>
      handlers[event]?.slice().forEach((h) => h(...args)),
    listenerCount: (event: string) => (handlers[event] ?? []).length,
    setVolume: (v: number) => (volume = v),
    setMuted: (m: boolean) => (muted = m),
    get constructedFor() {
      return constructedFor;
    },
  };
}

describe('StreamableService', () => {
  let service: StreamableService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new StreamableService();
  });

  afterEach(() => {
    delete (globalThis as { playerjs?: unknown }).playerjs;
  });

  it('identifies itself as the streamable platform', () => {
    expect(service.id).toBe('streamable');
  });

  it('refuses player reuse', () => {
    // The iframe src carries the video id, so another video means another
    // iframe — loadVideoById throws rather than swapping in place.
    expect(service.canReusePlayer).toBe(false);
  });

  it('loads the embed.ly player bridge', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://cdn.embed.ly/player-0.1.0.min.js'
    );
  });

  describe('urlRegexes', () => {
    /** The id the VideoPlayer would extract from `url`, or null. */
    function idFor(url: string) {
      for (const rgx of service.urlRegexes) {
        const match = new RegExp(rgx).exec(url);
        if (match?.groups) return match.groups['id'];
      }
      return null;
    }

    it.each([
      ['https://streamable.com/moo', 'moo'],
      ['https://www.streamable.com/moo', 'moo'],
      ['http://streamable.com/8bk3s1', '8bk3s1'],
    ])('extracts the id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      'https://streamable.com/',
      // Ids are lowercase alphanumerics only, and the pattern is anchored at
      // the end, so neither capitals nor a trailing path can match.
      'https://streamable.com/MOO',
      'https://streamable.com/moo/extra',
      'https://streamable.com/moo?t=10',
      'https://www.youtube.com/watch?v=abcdefg',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  describe('prepareHtml', () => {
    it('renders the streamable embed iframe at the requested size', () => {
      const html = service.prepareHtml({
        width: 800,
        height: 600,
        initialVideoId: 'moo',
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const iframe = container.querySelector('iframe')!;
      expect(iframe.getAttribute('src')).toBe('https://streamable.com/o/moo');
      expect(iframe.getAttribute('width')).toBe('800');
      expect(iframe.getAttribute('height')).toBe('600');
      expect(iframe.getAttribute('allow')).toContain('fullscreen');
      // max-width so the iframe cannot overflow its column.
      expect(iframe.getAttribute('style')).toContain('max-width: 100%');
    });

    it('falls back to 450x300 when no size is given', () => {
      const html = service.prepareHtml({ initialVideoId: 'moo' });
      const container = document.createElement('div');
      container.innerHTML = html;

      const iframe = container.querySelector('iframe')!;
      expect(iframe.getAttribute('width')).toBe('450');
      expect(iframe.getAttribute('height')).toBe('300');
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let pjs: ReturnType<typeof fakePlayerJs>;
    let element: HTMLElement;
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
      // The ready handler starts a timer(0, 50) volume poll, and autoplay plus
      // the fullscreen/pip corrections run on setTimeout.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      pjs = fakePlayerJs();
      element = document.createElement('div');
      iframe = document.createElement('iframe');
      element.appendChild(iframe);
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    it('rejects when the host element holds no iframe', async () => {
      await expect(
        service.createPlayer(
          {
            width: 450,
            height: 300,
            autoplay: false,
            element: document.createElement('div'),
          },
          destroy
        )
      ).rejects.toBe(
        'Streamable player requires the options.element to be set, and contain an iframe'
      );
    });

    it('rejects with the same message when there is no host element at all', async () => {
      await expect(
        service.createPlayer(
          {
            width: 450,
            height: 300,
            autoplay: false,
            element: null as unknown as HTMLElement,
          },
          destroy
        )
      ).rejects.toBe(
        'Streamable player requires the options.element to be set, and contain an iframe'
      );
    });

    it('binds player.js to the iframe inside the host element', async () => {
      const promise = service.createPlayer(
        { width: 450, height: 300, autoplay: false, element },
        destroy
      );
      pjs.fire('ready');
      await promise;

      expect(pjs.constructedFor).toBe(iframe);
    });

    it('resolves only once player.js reports ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer({ width: 450, height: 300, autoplay: false, element }, destroy)
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      pjs.fire('ready');
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the ready handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        { width: 450, height: 300, autoplay, element },
        destroy
      );
      pjs.fire('ready');
      return (await promise) as PlayerAdapter;
    }

    it('turns looping off, so a finished video reports ended', async () => {
      await ready();

      expect(pjs.calls).toContain('setLoop(false)');
    });

    it('starts playback shortly after ready when autoplay was asked for', async () => {
      await ready(true);
      expect(pjs.calls).not.toContain('play');

      // The player needs a moment after ready before it accepts play().
      jest.advanceTimersByTime(20);

      expect(pjs.calls).toContain('play');
    });

    it('does not start playback when autoplay was not asked for', async () => {
      await ready(false);

      jest.advanceTimersByTime(50);

      expect(pjs.calls).not.toContain('play');
    });

    it('advertises volume and mute support only', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([ECapability.volume, ECapability.mute]);
    });

    it('refuses to swap in another video', async () => {
      const adapter = await ready();

      expect(() => adapter.loadVideoById('other')).toThrow(
        'The Streamable player cannot be reused'
      );
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has a player.js equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(pjs.calls.filter((c) => c === 'play' || c === 'pause')).toEqual([
        'play',
        'pause',
      ]);
    });

    it('mutes and unmutes through the dedicated calls', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setMute(false);

      expect(pjs.calls).toContain('mute');
      expect(pjs.calls).toContain('unmute');
    });

    it('passes the 0-100 volume straight to player.js', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(pjs.calls).toContain('setVolume(40)');
    });

    it('seeks in seconds', async () => {
      const adapter = await ready();

      adapter.setProgress(12);

      expect(pjs.calls).toContain('setCurrentTime(12)');
    });

    it('resizes the iframe, in pixels', async () => {
      const adapter = await ready();

      adapter.setSize(320, 180);

      expect(iframe.getAttribute('width')).toBe('320px');
      expect(iframe.getAttribute('height')).toBe('180px');
    });

    it('has no title to offer', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('');
    });

    it('reports fullscreen and pip as unsupported', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const adapter = await ready();
      const fullscreens: boolean[] = [];
      const pips: boolean[] = [];
      adapter.onFullscreenChange = (f) => fullscreens.push(f);
      adapter.onPipChange = (p) => pips.push(p);

      adapter.setFullscreen(true);
      adapter.setPip(true);
      // Both correct themselves on a timer rather than leaving the caller
      // waiting for a change event that will never come.
      jest.advanceTimersByTime(60);

      expect(fullscreens).toEqual([false]);
      expect(pips).toEqual([false]);
      await expect(adapter.getFullscreen()).resolves.toBe(false);
      await expect(adapter.getPip()).resolves.toBe(false);
      expect(warn.mock.calls.flat()).toEqual(
        expect.arrayContaining([
          "Streamable player doesn't allow setting fullscreen from outside",
          "Streamable player doesn't support PIP mode",
        ])
      );
      warn.mockRestore();
    });

    it('ignores a request to leave fullscreen or pip it was never in', async () => {
      const adapter = await ready();
      const fullscreens: boolean[] = [];
      const pips: boolean[] = [];
      adapter.onFullscreenChange = (f) => fullscreens.push(f);
      adapter.onPipChange = (p) => pips.push(p);

      adapter.setFullscreen(false);
      adapter.setPip(false);
      jest.advanceTimersByTime(60);

      expect(fullscreens).toEqual([]);
      expect(pips).toEqual([]);
    });

    it('translates player.js events into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      pjs.fire('play');
      pjs.fire('pause');
      pjs.fire('ended');

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
    });

    it('reads both progress and duration off a single timeupdate', async () => {
      const adapter = await ready();
      const times: number[] = [];
      const durations: number[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onDurationChange = (d) => durations.push(d);

      pjs.fire('timeupdate', { seconds: 12.5, duration: 90 });

      expect(times).toEqual([12.5]);
      expect(durations).toEqual([90]);
    });

    it('polls volume and mute, which player.js only answers by callback', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);

      pjs.setVolume(70);
      pjs.setMuted(true);
      jest.advanceTimersByTime(50);

      expect(volumes).toContain(70);
      expect(mutes).toContain(true);
    });

    it('unhooks every player.js listener on destroy', async () => {
      const adapter = await ready();

      adapter.destroy();

      // The 'ready' listener stays: its subscription is what created the
      // adapter, and it is not tied to destroyRef.
      for (const event of ['play', 'pause', 'ended', 'timeupdate']) {
        expect(pjs.listenerCount(event)).toBe(0);
      }
    });

    it('stops emitting and polling after destroy', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const volumes: number[] = [];

      adapter.destroy();
      adapter.onStateChange = (s) => states.push(s);
      adapter.onVolumeChange = (v) => volumes.push(v);
      pjs.fire('play');
      jest.advanceTimersByTime(200);

      expect(states).toEqual([]);
      expect(volumes).toEqual([]);
    });

    it('stops emitting once the owner signals destruction', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const volumes: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onVolumeChange = (v) => volumes.push(v);

      destroy.next(true);
      volumes.length = 0;
      pjs.fire('play');
      jest.advanceTimersByTime(200);

      expect(states).toEqual([]);
      expect(volumes).toEqual([]);
    });
  });
});
