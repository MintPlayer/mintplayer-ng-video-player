import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import type { VidyardPlayer } from '@vidyard/embed-code';
import { Subject } from 'rxjs';
import { VidyardService } from './vidyard.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

// The embed code is a browser bundle that installs itself into the page on
// import, so the service's only entry point into it — the `api` surface — is
// replaced wholesale. The getter defers to `api` below, which is re-created
// for every test.
jest.mock('@vidyard/embed-code', () => ({
  __esModule: true,
  default: {
    get api() {
      return api;
    },
  },
}));

let api: {
  renderPlayer: jest.Mock;
  addReadyListener: jest.Mock;
  getPlayerMetadata: jest.Mock;
  destroyPlayer: jest.Mock;
};

/** The slice of a Vidyard player object this service drives. */
function fakePlayer(lengthInSeconds = 120) {
  const calls: string[] = [];
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  const iframe = document.createElement('iframe');

  const player = {
    iframe,
    uuid: 'abcde12345',
    metadata: {
      length_in_seconds: lengthInSeconds,
      width: 640,
      height: 360,
      name: 'A name',
      description: 'A description',
      chapters_attributes: [
        { video_attributes: { length_in_seconds: lengthInSeconds, name: 'A name' } },
      ],
    },
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    seek: (seconds: number) => calls.push(`seek(${seconds})`),
    setVolume: (volume: number) => calls.push(`setVolume(${volume})`),
    currentTime: () => 0,
    on: (event: string, handler: (...args: unknown[]) => void) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
    },
    off: (event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
    },
  };

  return {
    player: player as unknown as VidyardPlayer,
    calls,
    iframe,
    metadata: player.metadata,
    fire: (event: string, ...args: unknown[]) =>
      handlers[event]?.slice().forEach((h) => h(...args)),
    listenerCount: (event: string) => (handlers[event] ?? []).length,
  };
}

describe('VidyardService', () => {
  let service: VidyardService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    api = {
      renderPlayer: jest.fn(),
      addReadyListener: jest.fn(),
      getPlayerMetadata: jest.fn(() =>
        Promise.resolve({
          length_in_seconds: 120,
          width: 640,
          height: 360,
          name: 'A name',
          description: 'A description',
          chapters_attributes: [],
        })
      ),
      destroyPlayer: jest.fn(),
    };
    service = new VidyardService();
  });

  it('identifies itself as the vidyard platform', () => {
    expect(service.id).toBe('vidyard');
  });

  it('refuses player reuse', () => {
    // A Vidyard player is rendered around one uuid, so another video means a
    // new player — loadVideoById throws rather than swapping in place.
    expect(service.canReusePlayer).toBe(false);
  });

  it('loads the v4 embed code and waits for its window callback', async () => {
    await service.loadApi();

    // The bundle signals readiness through window.onVidyardAPI, so the loader
    // must wait for that rather than for the script's load event.
    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://play.vidyard.com/embed/v4.js',
      { windowCallback: 'onVidyardAPI' }
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
      ['https://video.vidyard.com/watch/abcde12345', 'abcde12345'],
      ['http://video.vidyard.com/watch/abcde12345', 'abcde12345'],
      // Not anchored at the end, so a share query is simply ignored.
      ['https://video.vidyard.com/watch/abcde12345?disableTracking=1', 'abcde12345'],
    ])('extracts the id from the watch url %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      ['https://play.vidyard.com/abcde12345.jpg', 'abcde12345'],
      ['http://play.vidyard.com/abcde12345.jpg', 'abcde12345'],
    ])('extracts the id from the thumbnail url %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      // Ids are at least five alphanumerics.
      'https://video.vidyard.com/watch/abcd',
      'https://video.vidyard.com/watch/',
      'https://video.vidyard.com/abcde12345',
      // The thumbnail pattern needs the .jpg suffix.
      'https://play.vidyard.com/abcde12345',
      'https://play.vidyard.com/abcde12345.png',
      'https://www.youtube.com/watch?v=abcdefg',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  describe('prepareHtml', () => {
    it('rejects a request with no initial video id', () => {
      expect(() => service.prepareHtml({ width: 640, height: 360 })).toThrow(
        'Vidyard player requires an initial video to be set'
      );
    });

    it('renders the embed div the SDK looks for, plus a thumbnail placeholder', () => {
      const html = service.prepareHtml({
        width: 640,
        height: 360,
        initialVideoId: 'abcde12345',
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const div = container.querySelector('div.vidyard-player-embed')!;
      expect(div.getAttribute('data-uuid')).toBe('abcde12345');
      expect(div.getAttribute('data-v')).toBe('4');
      expect(div.getAttribute('data-type')).toBe('lightbox');
      expect(div.getAttribute('style')).toContain('width: 640px');
      expect(div.getAttribute('style')).toContain('max-width: 100%');
      // Shown until the player reports ready, then removed by createPlayer.
      expect(container.querySelector('img')!.getAttribute('src')).toBe(
        'https://play.vidyard.com/abcde12345.jpg'
      );
    });

    it('stretches to the full width when no width is given', () => {
      const html = service.prepareHtml({ initialVideoId: 'abcde12345' });
      const container = document.createElement('div');
      container.innerHTML = html;

      expect(
        container.querySelector('div.vidyard-player-embed')!.getAttribute('style')
      ).toContain('width: 100%');
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let element: HTMLElement;
    let embed: HTMLDivElement;
    let placeholder: HTMLImageElement;
    let warn: jest.SpyInstance;

    beforeEach(() => {
      // Tests that do not care about the duration never assign a handler for
      // it, so the metadata emission warns. Kept out of the test output.
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      destroy = new Subject<boolean>();
      element = document.createElement('div');
      embed = document.createElement('div');
      embed.className = 'vidyard-player-embed';
      placeholder = document.createElement('img');
      embed.appendChild(placeholder);
      element.appendChild(embed);
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      warn.mockRestore();
    });

    function options(overrides: Record<string, unknown> = {}) {
      return {
        width: 640,
        height: 360,
        autoplay: false,
        element,
        initialVideoId: 'abcde12345',
        ...overrides,
      };
    }

    it('rejects when the host element holds no embed div', async () => {
      await expect(
        service.createPlayer(
          options({ element: document.createElement('div') }),
          destroy
        )
      ).rejects.toBe('Something went wrong');
    });

    it('rejects when there is no host element at all', async () => {
      await expect(
        service.createPlayer(
          options({ element: null as unknown as HTMLElement }),
          destroy
        )
      ).rejects.toBe('The Vidyard api requires the options.element to be set');
    });

    it('rejects without an initial video, which this implementation requires', async () => {
      await expect(
        service.createPlayer(options({ initialVideoId: undefined }), destroy)
      ).rejects.toBe(
        "The Vidyard implementation requires an initial video. Vidyard itself allows creation of a player without, but this wasn't implemented here."
      );
    });

    it('renders the player into the embed div, passing autoplay as a flag', async () => {
      service.createPlayer(options({ autoplay: true }), destroy);

      expect(api.renderPlayer).toHaveBeenCalledWith({
        container: embed,
        uuid: 'abcde12345',
        // 1/0 rather than true/false: that is what the SDK's options take.
        autoplay: 1,
      });
    });

    it('asks for no autoplay as a zero', async () => {
      service.createPlayer(options(), destroy);

      expect(api.renderPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ autoplay: 0 })
      );
    });

    it('resolves only once the rendered player reports ready', async () => {
      const fake = fakePlayer();
      let resolved = false;
      const promise = service.createPlayer(options(), destroy).then((a) => {
        resolved = true;
        return a;
      });

      // The SDK first announces the player, then the player announces itself.
      api.addReadyListener.mock.calls[0][0](undefined, fake.player);
      await Promise.resolve();
      expect(resolved).toBe(false);

      fake.fire('ready', undefined, fake.player);
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the two-step ready handshake. */
    async function ready(fake = fakePlayer(), overrides = {}) {
      const promise = service.createPlayer(options(overrides), destroy);
      api.addReadyListener.mock.calls[0][0](undefined, fake.player);
      fake.fire('ready', undefined, fake.player);
      const adapter = (await promise) as PlayerAdapter;
      // Let the getPlayerMetadata promise settle.
      await Promise.resolve();
      return { adapter, fake };
    }

    it('drops the thumbnail placeholder once the player is ready', async () => {
      expect(embed.contains(placeholder)).toBe(true);

      await ready();

      expect(embed.contains(placeholder)).toBe(false);
    });

    it('advertises volume support only', async () => {
      const { adapter } = await ready();

      expect(adapter.capabilities).toEqual([ECapability.volume]);
    });

    it('reports the duration from the metadata endpoint, not from the player', async () => {
      const durations: number[] = [];
      const fake = fakePlayer();
      // Wired the way a consumer does it: in the continuation of createPlayer,
      // registered before the player reports ready. The metadata is only
      // reported after resolvePlayer, so that continuation runs first.
      const promise = service.createPlayer(options(), destroy).then((adapter) => {
        adapter.onDurationChange = (d) => durations.push(d);
        return adapter;
      });
      api.addReadyListener.mock.calls[0][0](undefined, fake.player);
      fake.fire('ready', undefined, fake.player);
      await promise;
      await Promise.resolve();

      expect(api.getPlayerMetadata).toHaveBeenCalledWith('abcde12345');
      expect(durations).toEqual([120]);
      expect(warn).not.toHaveBeenCalledWith('onDurationChange is not registered');
    });

    it('refuses to swap in another video', async () => {
      const { adapter } = await ready();

      expect(() => adapter.loadVideoById('other12345')).toThrow(
        'The Vidyard player cannot be reused'
      );
    });

    it('maps player state onto play and pause', async () => {
      const { adapter, fake } = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has an SDK equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(fake.calls).toEqual(['play', 'pause']);
    });

    it('scales volume from the 0-100 api onto the SDK 0-1 range', async () => {
      const { adapter, fake } = await ready();

      adapter.setVolume(40);

      expect(fake.calls).toContain('setVolume(0.4)');
    });

    it('has no mute, fullscreen or pip to offer', async () => {
      const { adapter } = await ready();

      expect(() => adapter.setMute(true)).toThrow(
        "The Vidyard player doesn't support mute"
      );
      expect(() => adapter.setFullscreen(true)).toThrow(
        "The Vidyard player doesn't support fullscreen"
      );
      expect(() => adapter.setPip(true)).toThrow(
        "The Vidyard player doesn't support PiP"
      );
      // Asking, unlike setting, is answered rather than thrown at.
      await expect(adapter.getFullscreen()).resolves.toBe(false);
      await expect(adapter.getPip()).resolves.toBe(false);
    });

    it('seeks in seconds', async () => {
      const { adapter, fake } = await ready();

      adapter.setProgress(12);

      expect(fake.calls).toContain('seek(12)');
    });

    it('resizes the SDK iframe, in pixels', async () => {
      const { adapter, fake } = await ready();

      adapter.setSize(320, 180);

      expect(fake.iframe.getAttribute('width')).toBe('320px');
      expect(fake.iframe.getAttribute('height')).toBe('180px');
    });

    it('takes the title from the metadata name', async () => {
      const { adapter } = await ready();

      await expect(adapter.getTitle()).resolves.toBe('A name');
    });

    it('falls back to the description when the video has no name', async () => {
      const fake = fakePlayer();
      (fake.metadata as { name: string | null }).name = null;
      const { adapter } = await ready(fake);

      await expect(adapter.getTitle()).resolves.toBe('A description');
    });

    it('translates SDK events into adapter callbacks', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];
      const times: number[] = [];
      const volumes: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onVolumeChange = (v) => volumes.push(v);

      fake.fire('play', 0, fake.player);
      fake.fire('pause', undefined, fake.player);
      fake.fire('seek', [3, 42], fake.player);
      fake.fire('volumeChange', 0.35, fake.player);

      expect(states).toEqual([EPlayerState.playing, EPlayerState.paused]);
      // A seek reports where it landed, not where it came from.
      expect(times).toEqual([42]);
      // The SDK reports 0-1; the adapter speaks 0-100.
      expect(volumes).toHaveLength(1);
      expect(volumes[0]).toBeCloseTo(35);
    });

    it('reports progress on every timeupdate', async () => {
      const { adapter, fake } = await ready();
      const times: number[] = [];
      const states: EPlayerState[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onStateChange = (s) => states.push(s);

      fake.fire('timeupdate', 10, fake.player);

      expect(times).toEqual([10]);
      expect(states).toEqual([]);
    });

    it('calls the video ended as soon as the last chapter runs out', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      // Within 0.2s of the end counts as ended, so a post-roll ad cannot keep
      // the player from reporting completion.
      fake.fire('timeupdate', 119.9, fake.player);
      fake.fire('timeupdate', 125, fake.player);

      expect(states).toEqual([EPlayerState.ended, EPlayerState.ended]);
    });

    it('logs the metadata event it does not otherwise use', async () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const { fake } = await ready();

      fake.fire('metadata', [fake.metadata], fake.player);

      expect(log).toHaveBeenCalledWith('metadata', [fake.metadata]);
      log.mockRestore();
    });

    it('tears the SDK player down and stops forwarding events on destroy', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];

      adapter.destroy();
      adapter.onStateChange = (s) => states.push(s);
      fake.fire('play', 0, fake.player);

      expect(api.destroyPlayer).toHaveBeenCalledWith(fake.player);
      expect(states).toEqual([]);
      for (const event of ['play', 'pause', 'seek', 'volumeChange', 'timeupdate']) {
        expect(fake.listenerCount(event)).toBe(0);
      }
    });

    it('stops forwarding events once the owner signals destruction', async () => {
      const { adapter, fake } = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      destroy.next(true);
      fake.fire('play', 0, fake.player);

      expect(states).toEqual([]);
    });
  });
});
