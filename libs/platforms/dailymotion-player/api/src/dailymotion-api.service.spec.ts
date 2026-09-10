import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { DailymotionApiService } from './dailymotion-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the Dailymotion SDK this service actually drives. */
function fakeDm() {
  const calls: string[] = [];
  const player = {
    width: 0,
    height: 0,
    muted: false,
    volume: 0.5,
    currentTime: 3,
    duration: 300,
    video: { title: 'A+great+video' },
    onvolumechange: undefined as undefined | (() => void),
    load: (args: { video: string }) => calls.push(`load(${args.video})`),
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    setMuted: (m: boolean) => calls.push(`setMuted(${m})`),
    setVolume: (v: number) => calls.push(`setVolume(${v})`),
    seek: (t: number) => calls.push(`seek(${t})`),
  };

  let handlers: Record<string, () => void> = {};
  let constructedWith: { element: unknown; options: Record<string, unknown> } | null = null;

  (globalThis as { DM?: unknown }).DM = {
    player: (element: unknown, options: Record<string, unknown>) => {
      constructedWith = { element, options };
      handlers = options['events'] as Record<string, () => void>;
      return player;
    },
  };

  return {
    calls,
    player,
    fire: (event: string) => handlers[event]?.(),
    get constructedWith() {
      return constructedWith;
    },
  };
}

describe('DailymotionApiService', () => {
  let service: DailymotionApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new DailymotionApiService();
  });

  afterEach(() => {
    delete (globalThis as { DM?: unknown }).DM;
  });

  it('identifies itself as the dailymotion platform', () => {
    expect(service.id).toBe('dailymotion');
  });

  it('allows player reuse, so another video swaps in place', () => {
    expect(service.canReusePlayer).toBe(true);
  });

  it('loads the SDK from the mintplayer mirror', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://video-player.mintplayer.com/assets/dailymotion/all.js'
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
      ['https://www.dailymotion.com/video/x8abcde', 'x8abcde'],
      ['https://dailymotion.com/video/x8abcde', 'x8abcde'],
      ['http://www.dailymotion.com/video/x8abcde', 'x8abcde'],
    ])('extracts the id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      'https://www.dailymotion.com/video/',
      'https://www.dailymotion.com/x8abcde',
      'https://www.youtube.com/watch?v=x8abcde',
      // Anchored at the end, so a trailing query is not a dailymotion url.
      'https://www.dailymotion.com/video/x8abcde?start=10',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  it('prepares a div for the SDK to take over', () => {
    const html = service.prepareHtml({ domId: 'player1', width: 600, height: 450 });
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('div')!.id).toBe('player1');
    // max-width so the iframe the SDK injects cannot overflow its column.
    expect(container.querySelector('div')!.getAttribute('style')).toContain(
      'max-width:100%'
    );
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let dm: ReturnType<typeof fakeDm>;
    let element: HTMLElement;

    beforeEach(() => {
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      dm = fakeDm();
      element = document.createElement('div');
      element.appendChild(document.createElement('div'));
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    it('rejects without a host element', async () => {
      await expect(
        service.createPlayer(
          {
            width: 600,
            height: 450,
            autoplay: false,
            element: null as unknown as HTMLElement,
          },
          destroy
        )
      ).rejects.toBe('The DailyMotion api requires the options.element to be set');
    });

    it('hands the SDK the inner div and the requested size', async () => {
      const promise = service.createPlayer(
        { width: 800, height: 600, autoplay: true, element },
        destroy
      );
      dm.fire('apiready');
      await promise;

      expect(dm.constructedWith!.element).toBe(element.getElementsByTagName('div')[0]);
      // Strings, not numbers: that is what the SDK's options take.
      expect(dm.constructedWith!.options).toMatchObject({
        width: '800',
        height: '600',
        params: { autoplay: true, 'queue-enable': false },
      });
    });

    it('resolves only once the SDK reports apiready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer({ width: 600, height: 450, autoplay: false, element }, destroy)
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      dm.fire('apiready');
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the apiready handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        { width: 600, height: 450, autoplay, element },
        destroy
      );
      dm.fire('apiready');
      return (await promise) as PlayerAdapter;
    }

    it('advertises volume, mute and title support', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.volume,
        ECapability.mute,
        ECapability.getTitle,
      ]);
    });

    it('swaps the video without rebuilding the player', async () => {
      const adapter = await ready();

      adapter.loadVideoById('x8other');

      expect(dm.calls).toContain('load(x8other)');
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has an SDK equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(dm.calls.filter((c) => c === 'play' || c === 'pause')).toEqual([
        'play',
        'pause',
      ]);
    });

    it('scales volume from the 0-100 api onto the SDK 0-1 range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(dm.calls).toContain('setVolume(0.4)');
    });

    it('forwards mute and seek straight through', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setProgress(12);

      expect(dm.calls).toContain('setMuted(true)');
      expect(dm.calls).toContain('seek(12)');
    });

    it('resizes through the player properties', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(dm.player.width).toBe(320);
      expect(dm.player.height).toBe(240);
    });

    it('un-escapes the plus signs Dailymotion puts in titles', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('A great video');
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

    it('translates SDK events into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const durations: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onDurationChange = (d) => durations.push(d);

      dm.fire('play');
      dm.fire('pause');
      dm.fire('end');

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      // Duration only becomes known once playback starts.
      expect(durations).toEqual([300]);
    });

    it('polls mute and progress off the player', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      const times: number[] = [];
      adapter.onMuteChange = (m) => mutes.push(m);
      adapter.onCurrentTimeChange = (t) => times.push(t);

      jest.advanceTimersByTime(100);

      expect(mutes.length).toBeGreaterThan(0);
      expect(times).toContain(3);
    });

    it('scales the polled volume up to the 0-100 api', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      dm.player.onvolumechange?.();

      expect(volumes).toEqual([50]);
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
  });
});
