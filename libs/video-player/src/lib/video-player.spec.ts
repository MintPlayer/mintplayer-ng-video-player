import {
  ECapability,
  EPlayerState,
  IApiService,
  PlayerAdapter,
  PlayerOptions,
  PrepareHtmlOptions,
} from '@mintplayer/player-provider';
import { VideoPlayer } from './video-player';

interface FakeApi {
  service: IApiService;
  adapters: PlayerAdapter[];
  createPlayerCalls: PlayerOptions[];
  prepareHtmlCalls: PrepareHtmlOptions[];
  destroyed: number;
  loadedIds: string[];
  sizes: [number, number][];
  setStates: EPlayerState[];
  setVolumes: number[];
  setMutes: boolean[];
  setPips: boolean[];
  setFullscreens: boolean[];
  title: string;
}

/**
 * An IApiService whose adapter records everything VideoPlayer asks of it.
 * `canReusePlayer` and `id` are the two knobs the reuse path turns on.
 */
function fakeApi(
  id = 'fake',
  overrides: Partial<IApiService> = {},
  capabilities: ECapability[] = [ECapability.volume, ECapability.mute]
): FakeApi {
  const state: FakeApi = {
    adapters: [],
    createPlayerCalls: [],
    prepareHtmlCalls: [],
    destroyed: 0,
    loadedIds: [],
    sizes: [],
    setStates: [],
    setVolumes: [],
    setMutes: [],
    setPips: [],
    setFullscreens: [],
    title: 'the title',
    service: undefined as unknown as IApiService,
  };

  state.service = <IApiService>{
    get id() {
      return id;
    },
    urlRegexes: [/https:\/\/fake\/(?<id>\w+)/],
    loadApi: () => Promise.resolve(),
    prepareHtml: (options: PrepareHtmlOptions) => {
      state.prepareHtmlCalls.push(options);
      return `<div id="${options.domId}"></div>`;
    },
    createPlayer: (options: PlayerOptions) => {
      state.createPlayerCalls.push(options);
      const adapter = <PlayerAdapter>{
        get capabilities() {
          return capabilities;
        },
        loadVideoById: (videoId: string) => state.loadedIds.push(videoId),
        setPlayerState: (s: EPlayerState) => state.setStates.push(s),
        setMute: (m: boolean) => state.setMutes.push(m),
        setVolume: (v: number) => state.setVolumes.push(v),
        setProgress: () => undefined,
        setSize: (w: number, h: number) => state.sizes.push([w, h]),
        getTitle: () => Promise.resolve(state.title),
        setPip: (p: boolean) => state.setPips.push(p),
        getPip: () => Promise.resolve(false),
        setFullscreen: (f: boolean) => state.setFullscreens.push(f),
        getFullscreen: () => Promise.resolve(false),
        destroy: () => {
          state.destroyed++;
        },
        onStateChange: () => undefined,
        onMuteChange: () => undefined,
        onVolumeChange: () => undefined,
        onCurrentTimeChange: () => undefined,
        onDurationChange: () => undefined,
        onFullscreenChange: () => undefined,
        onPipChange: () => undefined,
      };
      state.adapters.push(adapter);
      return Promise.resolve(adapter);
    },
    ...overrides,
  };

  return state;
}

/** Let the debounced pipelines fire and their promise chains settle. */
async function settle(ms = 50) {
  await jest.advanceTimersByTimeAsync(ms);
  await jest.advanceTimersByTimeAsync(ms);
}

describe('VideoPlayer', () => {
  let host: HTMLElement;

  beforeEach(() => {
    jest.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    jest.useRealTimers();
    host.remove();
  });

  it('exposes its defaults before anything is loaded', () => {
    const player = new VideoPlayer();

    expect(player.url).toBeNull();
    expect(player.width).toBe(600);
    expect(player.height).toBe(450);
    expect(player.autoplay).toBe(true);
    expect(player.volume).toBe(0);
    expect(player.mute).toBe(false);
    expect(player.isPip).toBe(false);
    expect(player.isFullscreen).toBe(false);
  });

  it('normalises an empty or undefined url to null', () => {
    const player = new VideoPlayer();

    player.url = 'https://fake/abc';
    expect(player.url).toBe('https://fake/abc');

    player.url = undefined;
    expect(player.url).toBeNull();

    player.url = '';
    expect(player.url).toBeNull();
  });

  it('does nothing without a host, however many apis it has', async () => {
    const api = fakeApi();
    const player = new VideoPlayer([api.service]);

    player.url = 'https://fake/abc';
    await settle();

    expect(api.createPlayerCalls).toEqual([]);
    player.destroy();
  });

  it('ignores an unmatched url while it has no apis at all', async () => {
    // The "no player found" throw is deliberately suppressed until apis are
    // registered, so a wrapper can set the url before its plugins resolve.
    const player = new VideoPlayer([], host);

    player.url = 'https://unknown/abc';
    await settle();

    expect(host.innerHTML).toBe('');
    player.destroy();
  });

  it('throws when no registered api matches the url', async () => {
    const api = fakeApi();
    const player = new VideoPlayer([api.service], host);
    player.url = 'https://unknown/abc';

    await expect(settle()).rejects.toBe(
      'No player found for url https://unknown/abc'
    );
    player.destroy();
  });

  describe('loading a video', () => {
    it('writes the api html into the host and creates the player', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);

      player.url = 'https://fake/abc';
      await settle();

      expect(api.prepareHtmlCalls).toHaveLength(1);
      expect(api.prepareHtmlCalls[0]).toMatchObject({
        width: 600,
        height: 450,
        initialVideoId: 'abc',
        autoplay: true,
      });
      expect(host.innerHTML).toBe(
        `<div id="${api.prepareHtmlCalls[0].domId}"></div>`
      );

      expect(api.createPlayerCalls).toHaveLength(1);
      expect(api.createPlayerCalls[0]).toMatchObject({
        width: 600,
        height: 450,
        autoplay: true,
        element: host,
        initialVideoId: 'abc',
        domId: api.prepareHtmlCalls[0].domId,
      });
      // The same domId has to reach prepareHtml and createPlayer, or the
      // platform script cannot find the element the html just created.
      expect(api.createPlayerCalls[0].domId).toBe(
        api.prepareHtmlCalls[0].domId
      );

      expect(api.loadedIds).toEqual(['abc']);
      player.destroy();
    });

    it('hands out a fresh domId per player', async () => {
      const first = fakeApi('first');
      const second = fakeApi('second');
      const player = new VideoPlayer([first.service, second.service], host);
      second.service.urlRegexes = [/https:\/\/other\/(?<id>\w+)/];

      player.url = 'https://fake/abc';
      await settle();
      player.url = 'https://other/def';
      await settle();

      expect(first.prepareHtmlCalls[0].domId).not.toBe(
        second.prepareHtmlCalls[0].domId
      );
      player.destroy();
    });

    it('announces the adapter capabilities', async () => {
      const api = fakeApi('fake', {}, [ECapability.fullscreen]);
      const player = new VideoPlayer([api.service], host);
      const seen: ECapability[][] = [];
      player.on('capabilitiesChange', (caps) => seen.push(caps));

      player.url = 'https://fake/abc';
      await settle();

      expect(seen).toEqual([[ECapability.fullscreen]]);
      player.destroy();
    });

    it('reuses the player for another video on the same platform', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);

      player.url = 'https://fake/abc';
      await settle();
      player.url = 'https://fake/def';
      await settle();

      expect(api.createPlayerCalls).toHaveLength(1);
      expect(api.destroyed).toBe(0);
      expect(api.loadedIds).toEqual(['abc', 'def']);
      player.destroy();
    });

    it('rebuilds the player when the api forbids reuse', async () => {
      const api = fakeApi('fake', { canReusePlayer: false });
      const player = new VideoPlayer([api.service], host);

      player.url = 'https://fake/abc';
      await settle();
      player.url = 'https://fake/def';
      await settle();

      expect(api.createPlayerCalls).toHaveLength(2);
      expect(api.destroyed).toBe(1);
      player.destroy();
    });

    it('destroys the old player when switching platform', async () => {
      const first = fakeApi('first');
      const second = fakeApi('second');
      second.service.urlRegexes = [/https:\/\/other\/(?<id>\w+)/];
      const player = new VideoPlayer([first.service, second.service], host);

      player.url = 'https://fake/abc';
      await settle();
      player.url = 'https://other/def';
      await settle();

      expect(first.destroyed).toBe(1);
      expect(second.createPlayerCalls).toHaveLength(1);
      player.destroy();
    });

    it('tears the player down and empties the host when the url is cleared', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);

      player.url = 'https://fake/abc';
      await settle();
      expect(host.innerHTML).not.toBe('');

      player.url = null;
      await settle();

      expect(api.destroyed).toBe(1);
      expect(host.innerHTML).toBe('');
      player.destroy();
    });

    it('picks up apis registered after construction', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([], host);

      player.url = 'https://fake/abc';
      await settle();
      expect(api.createPlayerCalls).toEqual([]);

      player.apis = [api.service];
      await settle();

      expect(api.createPlayerCalls).toHaveLength(1);
      player.destroy();
    });

    it('picks up a host assigned after construction', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service]);

      player.url = 'https://fake/abc';
      await settle();
      expect(api.createPlayerCalls).toEqual([]);

      player.host = host;
      await settle();

      expect(api.createPlayerCalls).toHaveLength(1);
      player.destroy();
    });
  });

  describe('event handling', () => {
    it('debounces and de-duplicates adapter callbacks into events', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();
      const adapter = api.adapters[0];

      const volumes: number[] = [];
      const mutes: boolean[] = [];
      const states: EPlayerState[] = [];
      player.on('volumeChange', (v) => volumes.push(v));
      player.on('muteChange', (m) => mutes.push(m));
      player.on('stateChange', (s) => states.push(s));

      // Three rapid volume reports collapse to the last one.
      adapter.onVolumeChange(10);
      adapter.onVolumeChange(20);
      adapter.onVolumeChange(30);
      await settle();

      adapter.onMuteChange(true);
      await settle();
      // Repeating a value must not re-fire.
      adapter.onMuteChange(true);
      await settle();

      adapter.onStateChange(EPlayerState.playing);
      await settle();

      expect(volumes).toEqual([30]);
      expect(mutes).toEqual([true]);
      expect(states).toEqual([EPlayerState.playing]);
      // The debounced value is also what the getters report.
      expect(player.volume).toBe(30);
      expect(player.mute).toBe(true);
      player.destroy();
    });

    it('reports pip and fullscreen changes, seeded to false on load', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      const pips: boolean[] = [];
      const fullscreens: boolean[] = [];
      player.on('isPipChange', (p) => pips.push(p));
      player.on('isFullscreenChange', (f) => fullscreens.push(f));

      player.url = 'https://fake/abc';
      await settle();

      expect(pips).toEqual([false]);
      expect(fullscreens).toEqual([false]);

      api.adapters[0].onPipChange(true);
      api.adapters[0].onFullscreenChange(true);
      await settle();

      expect(pips).toEqual([false, true]);
      expect(fullscreens).toEqual([false, true]);
      expect(player.isPip).toBe(true);
      expect(player.isFullscreen).toBe(true);
      player.destroy();
    });

    it('combines currentTime and duration into one progress event', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      const progress: { currentTime: number; duration: number }[] = [];
      player.on('progressChange', (p) => progress.push(p));

      // Progress needs BOTH halves before it can report anything.
      api.adapters[0].onCurrentTimeChange(12);
      await settle();
      expect(progress).toEqual([]);

      api.adapters[0].onDurationChange(300);
      await settle();

      expect(progress).toEqual([{ currentTime: 12, duration: 300 }]);
      player.destroy();
    });

    it('stops calling a handler that was removed', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      const seen: number[] = [];
      const handler = (v: number) => seen.push(v);
      player.on('volumeChange', handler);

      api.adapters[0].onVolumeChange(10);
      await settle();
      player.off('volumeChange', handler);
      api.adapters[0].onVolumeChange(20);
      await settle();

      expect(seen).toEqual([10]);
      player.destroy();
    });

    it('ignores off() for a handler that was never registered', async () => {
      const player = new VideoPlayer([], host);
      const seen: number[] = [];
      const registered = (v: number) => seen.push(v);
      player.on('volumeChange', registered);

      expect(() =>
        player.off('volumeChange', () => undefined)
      ).not.toThrow();
      // The registered handler must survive the failed removal.
      player.off('volumeChange', registered);
      player.destroy();
    });

    it('calls every handler registered for the same event', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      const first: number[] = [];
      const second: number[] = [];
      player.on('volumeChange', (v) => first.push(v));
      player.on('volumeChange', (v) => second.push(v));

      api.adapters[0].onVolumeChange(42);
      await settle();

      expect(first).toEqual([42]);
      expect(second).toEqual([42]);
      player.destroy();
    });
  });

  describe('commands', () => {
    it('resizes the live player', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      player.width = 800;
      player.height = 600;

      expect(player.width).toBe(800);
      expect(player.height).toBe(600);
      expect(api.sizes).toEqual([
        [800, 450],
        [800, 600],
      ]);
      player.destroy();
    });

    it('remembers a size set before any player exists', () => {
      const player = new VideoPlayer();

      expect(() => {
        player.width = 320;
        player.height = 240;
      }).not.toThrow();
      expect(player.width).toBe(320);
      expect(player.height).toBe(240);
    });

    it('forwards volume, mute and player state to the adapter', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      player.volume = 55;
      player.mute = true;
      player.playerState = EPlayerState.playing;

      expect(api.setVolumes).toEqual([55]);
      expect(api.setMutes).toEqual([true]);
      expect(api.setStates).toEqual([EPlayerState.playing]);
      // The setters are optimistic: the getter updates without waiting for the
      // adapter to report back.
      expect(player.volume).toBe(55);
      expect(player.mute).toBe(true);
      player.destroy();
    });

    it('accepts volume, mute and state with no player attached', () => {
      const player = new VideoPlayer();

      expect(() => {
        player.volume = 55;
        player.mute = true;
        player.playerState = EPlayerState.paused;
      }).not.toThrow();
      expect(player.volume).toBe(55);
      expect(player.mute).toBe(true);
    });

    it('forwards fullscreen and pip requests', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      player.isFullscreen = true;
      player.isPip = true;
      player.setIsPip(false);

      expect(api.setFullscreens).toEqual([true]);
      expect(api.setPips).toEqual([true, false]);
      player.destroy();
    });

    it('swallows fullscreen and pip requests with no player attached', () => {
      const player = new VideoPlayer();

      expect(() => {
        player.isFullscreen = true;
        player.isPip = true;
        player.setIsPip(true);
      }).not.toThrow();
      // Without an adapter to confirm, the reported state stays put.
      expect(player.isFullscreen).toBe(false);
      expect(player.isPip).toBe(false);
    });

    it('reads the title from the adapter', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      await expect(player.getTitle()).resolves.toBe('the title');
      player.destroy();
    });

    it('resolves the title to null with no player attached', async () => {
      const player = new VideoPlayer();

      await expect(player.getTitle()).resolves.toBeNull();
    });
  });

  describe('volume and mute across media (#105)', () => {
    const otherApi = () =>
      fakeApi('other', { urlRegexes: [/https:\/\/other\/(?<id>\w+)/] });

    it('applies the stored settings to every new adapter, also across platforms', async () => {
      const first = fakeApi();
      const second = otherApi();
      const player = new VideoPlayer([first.service, second.service], host);
      const events: (number | boolean)[] = [];
      player.on('volumeChange', (v) => events.push(v));
      player.on('muteChange', (m) => events.push(m));

      // Set before any adapter exists.
      player.volume = 30;
      player.mute = true;
      player.url = 'https://fake/abc';
      await settle();

      expect(first.setMutes).toEqual([true]);
      expect(first.setVolumes).toEqual([30]);

      player.url = 'https://other/def';
      await settle();

      expect(second.adapters).toHaveLength(1);
      expect(second.setMutes).toEqual([true]);
      expect(second.setVolumes).toEqual([30]);
      expect(player.volume).toBe(30);
      expect(player.mute).toBe(true);
      expect(events).toEqual([]);
      player.destroy();
    });

    it('re-applies the settings after loading into a reused adapter', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();
      player.volume = 40;
      player.mute = false;

      player.url = 'https://fake/def';
      await settle();

      expect(api.adapters).toHaveLength(1);
      expect(api.loadedIds).toEqual(['abc', 'def']);
      expect(api.setVolumes).toEqual([40, 40]);
      expect(api.setMutes).toEqual([false, false]);
      player.destroy();
    });

    it("answers a platform's default or reset in the settle window by re-applying", async () => {
      const api = fakeApi();
      const second = otherApi();
      const player = new VideoPlayer([api.service, second.service], host);
      player.volume = 30;
      player.mute = true;
      player.url = 'https://fake/abc';
      await settle();
      player.url = 'https://other/def';
      await settle();
      const events: (number | boolean)[] = [];
      player.on('volumeChange', (v) => events.push(v));
      player.on('muteChange', (m) => events.push(m));

      // The new platform reports its own defaults.
      second.adapters[0].onVolumeChange(52);
      second.adapters[0].onMuteChange(false);
      await settle();

      expect(events).toEqual([]);
      expect(player.volume).toBe(30);
      expect(player.mute).toBe(true);
      expect(second.setVolumes).toEqual([30, 30]);
      expect(second.setMutes).toEqual([true, true]);
      player.destroy();
    });

    it("adopts a report after the settle window as the listener's own action", async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.volume = 30;
      player.mute = true;
      player.url = 'https://fake/abc';
      await settle();
      await jest.advanceTimersByTimeAsync(VideoPlayer.SETTLE_MS);
      const events: (number | boolean)[] = [];
      player.on('volumeChange', (v) => events.push(v));
      player.on('muteChange', (m) => events.push(m));

      api.adapters[0].onVolumeChange(70);
      api.adapters[0].onMuteChange(false);
      await settle();

      expect(events).toEqual([70, false]);
      expect(player.volume).toBe(70);
      expect(player.mute).toBe(false);
      expect(api.setVolumes).toEqual([30]);
      player.destroy();
    });

    it('does not emit a report that matches the stored settings', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.volume = 30;
      player.url = 'https://fake/abc';
      await settle();
      await jest.advanceTimersByTimeAsync(VideoPlayer.SETTLE_MS);
      const events: number[] = [];
      player.on('volumeChange', (v) => events.push(v));

      // An echo, with Vimeo's float rounding.
      api.adapters[0].onVolumeChange(0.3 * 100);
      await settle();

      expect(events).toEqual([]);
      player.destroy();
    });

    it('drops the junk platforms report while loading', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();
      const events: unknown[] = [];
      player.on('volumeChange', (v) => events.push(v));
      player.on('muteChange', (m) => events.push(m));

      api.adapters[0].onVolumeChange(undefined as unknown as number);
      api.adapters[0].onMuteChange(null as unknown as boolean);
      await settle();

      expect(events).toEqual([]);
      player.destroy();
    });

    it("only calls the setters the adapter's capabilities list", async () => {
      const api = fakeApi('fake', {}, [ECapability.volume]);
      const player = new VideoPlayer([api.service], host);
      player.volume = 30;
      player.mute = true;
      player.url = 'https://fake/abc';
      await settle();
      player.mute = false;

      expect(api.setVolumes).toEqual([30]);
      expect(api.setMutes).toEqual([]);
      // The listener's choice is kept for the next platform that can mute.
      expect(player.mute).toBe(false);
      player.destroy();
    });

    it('never throws out of a setter when the platform rejects the change', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      api.adapters[0].setVolume = () => {
        throw 'Spotify does not support volume';
      };

      expect(() => (player.volume = 20)).not.toThrow();
      expect(player.volume).toBe(20);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
      player.destroy();
    });
  });

  describe('destroy', () => {
    it('destroys the adapter and stops emitting events', async () => {
      const api = fakeApi();
      const player = new VideoPlayer([api.service], host);
      player.url = 'https://fake/abc';
      await settle();

      const seen: number[] = [];
      player.on('volumeChange', (v) => seen.push(v));

      player.destroy();
      api.adapters[0].onVolumeChange(99);
      await settle();

      expect(api.destroyed).toBe(1);
      expect(seen).toEqual([]);
    });

    it('is safe on a player that never loaded anything', () => {
      const player = new VideoPlayer();

      expect(() => player.destroy()).not.toThrow();
    });
  });
});
