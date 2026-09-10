import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { WistiaRequest, WistiaRevokeRequest, WistiaService } from './wistia.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

type Queue = (WistiaRequest | WistiaRevokeRequest)[];

/** The queue Wistia's E-v1.js drains; the service only ever pushes onto it. */
function wq() {
  return (window as unknown as { _wq: Queue })._wq;
}

/** Every event the service binds, in the order the source binds them. */
const boundEvents = [
  'play',
  'pause',
  'end',
  'timechange',
  'mutechange',
  'volumechange',
  'enterfullscreen',
  'cancelfullscreen',
];

/** The slice of a Wistia player object this service drives. */
function fakePlayer() {
  const calls: string[] = [];
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  let volume = 0.6;
  let fullscreen = false;

  const player = {
    addToPlaylist: (id: string) => calls.push(`addToPlaylist(${id})`),
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    mute: () => calls.push('mute'),
    unmute: () => calls.push('unmute'),
    volume: (value?: number) => {
      if (value === undefined) return volume;
      volume = value;
      calls.push(`volume(${value})`);
      return undefined;
    },
    time: (value?: number) => {
      if (value === undefined) return 0;
      calls.push(`time(${value})`);
      return undefined;
    },
    width: (value: number) => calls.push(`width(${value})`),
    height: (value: number) => calls.push(`height(${value})`),
    name: () => 'A video name',
    duration: () => 240,
    requestFullscreen: () => {
      fullscreen = true;
      calls.push('requestFullscreen');
    },
    cancelFullscreen: () => {
      fullscreen = false;
      calls.push('cancelFullscreen');
    },
    inFullscreen: () => fullscreen,
    remove: () => calls.push('remove'),
    bind: (event: string, handler: (...args: unknown[]) => void) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
    },
    unbind: (event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
      calls.push(`unbind(${event})`);
    },
  };

  return {
    player: player as unknown as Wistia.Player,
    calls,
    setVolume: (v: number) => (volume = v),
    fire: (event: string, ...args: unknown[]) =>
      handlers[event]?.slice().forEach((h) => h(...args)),
    listenerCount: (event: string) => (handlers[event] ?? []).length,
  };
}

describe('WistiaService', () => {
  let service: WistiaService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new WistiaService();
  });

  afterEach(() => {
    delete (window as unknown as { _wq?: unknown })._wq;
  });

  it('identifies itself as the wistia platform', () => {
    expect(service.id).toBe('wistia');
  });

  it('refuses player reuse', () => {
    // The embed div carries the video id in its class name, so another video
    // means new markup.
    expect(service.canReusePlayer).toBe(false);
  });

  it('loads the wistia embed script asynchronously', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://fast.wistia.com/assets/external/E-v1.js',
      { async: true }
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
      ['https://wistia.com/medias/abc123', 'abc123'],
      ['https://www.wistia.com/medias/abc123', 'abc123'],
      ['https://home.wistia.com/medias/abc123', 'abc123'],
      ['http://wistia.com/medias/abc123', 'abc123'],
      ['https://wistia.net/embed/abc123', 'abc123'],
      ['https://www.wistia.com/embed/abc123', 'abc123'],
      // The url wistia's own share dialog hands out. The iframe/ segment is
      // skipped rather than read as the id.
      ['https://fast.wistia.net/embed/iframe/abc123', 'abc123'],
      ['https://fast.wistia.com/embed/abc123', 'abc123'],
      // Not anchored at the end, so anything trailing is ignored.
      ['https://wistia.com/medias/abc123?wvideo=abc123', 'abc123'],
    ])('extracts the id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      'https://wistia.com/medias/',
      'https://wistia.com/projects/abc123',
      'https://wistia.org/medias/abc123',
      'https://cdn.wistia.net/embed/abc123',
      'https://www.youtube.com/watch?v=abcdefg',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  describe('prepareHtml', () => {
    it('rejects a request with no dom id', () => {
      expect(() =>
        service.prepareHtml({ width: 640, height: 360, initialVideoId: 'abc123' })
      ).toThrow('The Wistia api requires the options.domId to be set');
    });

    it('rejects a request with no initial video id', () => {
      expect(() =>
        service.prepareHtml({ width: 640, height: 360, domId: 'player1' })
      ).toThrow('The Wistia api requires an initial video id');
    });

    it('renders the embed div the wistia script picks up by class name', () => {
      const html = service.prepareHtml({
        width: 800,
        height: 450,
        domId: 'player1',
        initialVideoId: 'abc123',
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const div = container.querySelector('div')!;
      expect(div.id).toBe('player1');
      expect(div.getAttribute('key')).toBe('abc123');
      // The video id travels in the class name; that is how E-v1.js finds it.
      expect(div.classList.contains('wistia_embed')).toBe(true);
      expect(div.classList.contains('wistia_async_abc123')).toBe(true);
      expect(div.getAttribute('style')).toContain('width:800px');
      expect(div.getAttribute('style')).toContain('height:450px');
      expect(div.getAttribute('style')).toContain('max-width:100%');
    });

    it('falls back to 640x360 when no size is given', () => {
      const html = service.prepareHtml({
        domId: 'player1',
        initialVideoId: 'abc123',
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const style = container.querySelector('div')!.getAttribute('style')!;
      expect(style).toContain('width:640px');
      expect(style).toContain('height:360px');
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;

    beforeEach(() => {
      // The autoplay nudge and the pip correction both run on setTimeout.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    function create(overrides: Record<string, unknown> = {}) {
      return service.createPlayer(
        {
          width: 640,
          height: 360,
          autoplay: false,
          // The service never touches the host element: E-v1.js finds the
          // embed div itself, by dom id.
          element: document.createElement('div'),
          domId: 'player1',
          initialVideoId: 'abc123',
          ...overrides,
        },
        destroy
      );
    }

    it('rejects without a dom id', async () => {
      await expect(create({ domId: undefined })).rejects.toBe(
        'The Wistia api requires the options.domId to be set'
      );
    });

    it('rejects without an initial video, which this implementation requires', async () => {
      await expect(create({ initialVideoId: undefined })).rejects.toBe(
        'The Wistia implementation requires an initial video'
      );
    });

    it('enqueues a request for its own dom id, creating the queue if needed', () => {
      create();

      expect(wq()).toHaveLength(1);
      expect((wq()[0] as WistiaRequest).id).toBe('player1');
    });

    it('appends to a queue the wistia script already installed', () => {
      const existing = { id: 'somebody-else' } as WistiaRequest;
      (window as unknown as { _wq: Queue })._wq = [existing];

      create();

      expect(wq()[0]).toBe(existing);
      expect(wq()).toHaveLength(2);
    });

    it('resolves only once wistia hands over a ready player', async () => {
      const fake = fakePlayer();
      let resolved = false;
      const promise = create().then((a) => {
        resolved = true;
        return a;
      });

      await Promise.resolve();
      expect(resolved).toBe(false);

      (wq()[0] as WistiaRequest).onReady(fake.player);
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the onReady handshake. */
    async function ready(overrides: Record<string, unknown> = {}) {
      const fake = fakePlayer();
      const promise = create(overrides);
      (wq()[0] as WistiaRequest).onReady(fake.player);
      const adapter = (await promise) as PlayerAdapter;
      return { adapter, fake };
    }

    it('binds a handler for every event it translates', async () => {
      const { fake } = await ready();

      for (const event of boundEvents) {
        expect(fake.listenerCount(event)).toBe(1);
      }
    });

    it('advertises mute, volume, fullscreen and title support', async () => {
      const { adapter } = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.mute,
        ECapability.volume,
        ECapability.fullscreen,
        ECapability.getTitle,
      ]);
    });

    it('queues another video onto the playlist and reports its volume', async () => {
      const { adapter, fake } = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      fake.setVolume(0.8);

      adapter.loadVideoById('def456');

      expect(fake.calls).toContain('addToPlaylist(def456)');
      // The player keeps its volume across videos; the adapter re-publishes it
      // on the 0-100 scale.
      expect(volumes).toEqual([80]);
    });

    it('nudges the newly queued video into playing when autoplay is on', async () => {
      const { adapter, fake } = await ready({ autoplay: true });

      adapter.loadVideoById('def456');
      expect(fake.calls).not.toContain('play');

      // The playlist entry is not ready to play the instant it is added.
      jest.advanceTimersByTime(20);

      expect(fake.calls).toContain('play');
    });

    it('leaves the newly queued video paused when autoplay is off', async () => {
      const { adapter, fake } = await ready({ autoplay: false });

      adapter.loadVideoById('def456');
      jest.advanceTimersByTime(50);

      expect(fake.calls).not.toContain('play');
    });

    it('maps player state onto play and pause', async () => {
      const { adapter, fake } = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has a wistia equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(fake.calls).toEqual(['play', 'pause']);
    });

    it('mutes and unmutes through the dedicated calls', async () => {
      const { adapter, fake } = await ready();

      adapter.setMute(true);
      adapter.setMute(false);

      expect(fake.calls).toEqual(['mute', 'unmute']);
    });

    it('scales volume from the 0-100 api onto the wistia 0-1 range', async () => {
      const { adapter, fake } = await ready();

      adapter.setVolume(40);

      expect(fake.calls).toContain('volume(0.4)');
    });

    it('seeks in seconds', async () => {
      const { adapter, fake } = await ready();

      adapter.setProgress(12);

      expect(fake.calls).toContain('time(12)');
    });

    it('resizes through the player, not the embed div', async () => {
      const { adapter, fake } = await ready();

      adapter.setSize(320, 180);

      expect(fake.calls).toEqual(['width(320)', 'height(180)']);
    });

    it('takes the title from the player name', async () => {
      const { adapter } = await ready();

      await expect(adapter.getTitle()).resolves.toBe('A video name');
    });

    it('enters and leaves fullscreen, and reports where it is', async () => {
      const { adapter, fake } = await ready();

      await expect(adapter.getFullscreen()).resolves.toBe(false);

      adapter.setFullscreen(true);
      expect(fake.calls).toContain('requestFullscreen');
      await expect(adapter.getFullscreen()).resolves.toBe(true);

      adapter.setFullscreen(false);
      expect(fake.calls).toContain('cancelFullscreen');
      await expect(adapter.getFullscreen()).resolves.toBe(false);
    });

    it('reports pip as unsupported', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { adapter } = await ready();
      const pips: boolean[] = [];
      adapter.onPipChange = (p) => pips.push(p);

      adapter.setPip(true);
      // It corrects itself on a timer rather than leaving the caller waiting
      // for a change event that will never come.
      jest.advanceTimersByTime(60);

      expect(pips).toEqual([false]);
      await expect(adapter.getPip()).resolves.toBe(false);
      expect(warn).toHaveBeenCalledWith("Wistia player doesn't support PIP mode");
      warn.mockRestore();
    });

    it('ignores a request to leave a pip it was never in', async () => {
      const { adapter } = await ready();
      const pips: boolean[] = [];
      adapter.onPipChange = (p) => pips.push(p);

      adapter.setPip(false);
      jest.advanceTimersByTime(60);

      expect(pips).toEqual([]);
    });

    it('translates wistia events into adapter callbacks', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];
      const durations: number[] = [];
      const times: number[] = [];
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      const fullscreens: boolean[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onDurationChange = (d) => durations.push(d);
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);
      adapter.onFullscreenChange = (f) => fullscreens.push(f);

      fake.fire('play');
      fake.fire('pause');
      fake.fire('end');
      fake.fire('timechange', 12.5);
      fake.fire('volumechange', 0.4);
      fake.fire('mutechange', true);
      fake.fire('enterfullscreen');
      fake.fire('cancelfullscreen');

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      // The duration is only asked for once playback starts.
      expect(durations).toEqual([240]);
      expect(times).toEqual([12.5]);
      // Wistia reports 0-1; the adapter speaks 0-100.
      expect(volumes).toEqual([40]);
      expect(mutes).toEqual([true]);
      expect(fullscreens).toEqual([true, false]);
    });

    it('unbinds every handler, removes the player and revokes its queue entry on destroy', async () => {
      const { adapter, fake } = await ready();
      const request = wq()[0] as WistiaRequest;

      adapter.destroy();

      expect(fake.calls.filter((c) => c.startsWith('unbind('))).toEqual(
        // Unbound in the order the source lists them, which is not quite the
        // order they were bound in.
        [
          'unbind(play)',
          'unbind(pause)',
          'unbind(end)',
          'unbind(mutechange)',
          'unbind(volumechange)',
          'unbind(timechange)',
          'unbind(enterfullscreen)',
          'unbind(cancelfullscreen)',
        ]
      );
      for (const event of boundEvents) {
        expect(fake.listenerCount(event)).toBe(0);
      }
      expect(fake.calls).toContain('remove');
      // The revoke tells E-v1.js to forget the onReady request, so a rebuilt
      // player is not handed to the dead adapter.
      expect(wq()[wq().length - 1]).toEqual({ revoke: request });
    });

    it('stops emitting after destroy', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];

      adapter.destroy();
      adapter.onStateChange = (s) => states.push(s);
      fake.fire('play');

      expect(states).toEqual([]);
    });

    it('tears the player down just as thoroughly when the owner signals destruction', async () => {
      const { adapter, fake } = await ready();
      const request = wq()[0] as WistiaRequest;
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      destroy.next(true);
      fake.fire('play');

      expect(fake.calls.filter((c) => c.startsWith('unbind('))).toHaveLength(8);
      expect(fake.calls).toContain('remove');
      expect(wq()[wq().length - 1]).toEqual({ revoke: request });
      expect(states).toEqual([]);
    });

    /** Teardown ran exactly once, whichever route triggered it. */
    function expectTornDownOnce(fake: ReturnType<typeof fakePlayer>) {
      expect(fake.calls.filter((c) => c.startsWith('unbind('))).toHaveLength(8);
      expect(fake.calls.filter((c) => c === 'remove')).toHaveLength(1);
      expect(wq().filter((r) => 'revoke' in r)).toHaveLength(1);
    }

    it('tears down only once when the owner destroys after the adapter did', async () => {
      const { adapter, fake } = await ready();

      adapter.destroy();
      destroy.next(true);

      // The explicit teardown unsubscribes the owner subscription, so the
      // owner's signal cannot run it again — a second pass would unbind
      // handlers that are already gone, remove an already-removed player and
      // push a second revoke onto wistia's queue.
      expectTornDownOnce(fake);
    });

    it('tears down only once when the adapter is destroyed after the owner was', async () => {
      const { adapter, fake } = await ready();

      destroy.next(true);
      adapter.destroy();

      // The mirror case: the owner's signal already ran the teardown, and the
      // explicit call that follows — a VideoPlayer disposing of its adapter
      // after signalling — is a no-op.
      expectTornDownOnce(fake);
    });

    it('ignores every further destroy signal, however many arrive', async () => {
      const { adapter, fake } = await ready();

      adapter.destroy();
      adapter.destroy();
      destroy.next(true);
      destroy.next(true);

      expectTornDownOnce(fake);
    });

    it('ignores a false on the destroy subject', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      // Only a truthy signal means "tear down".
      destroy.next(false);
      fake.fire('play');

      expect(fake.calls).not.toContain('remove');
      expect(states).toEqual([EPlayerState.playing]);
    });
  });
});
