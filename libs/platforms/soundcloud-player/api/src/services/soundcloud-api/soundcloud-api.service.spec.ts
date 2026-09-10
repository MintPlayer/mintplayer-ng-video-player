import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { PlayerState } from '../../enums/player-state';
import { PlayProgressEvent } from '../../events/play-progress.event';
import { SoundcloudApiService } from './soundcloud-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the SoundCloud widget SDK this service actually drives. */
function fakeSc() {
  const calls: string[] = [];
  const handlers: Record<string, ((event: unknown) => void)[]> = {};
  let volume = 50;
  let duration = 240_000;
  let sound: { description?: string | null; title: string } = {
    description: 'A description',
    title: 'A title',
  };
  let widgetFor: unknown = null;

  const player = {
    load: (url: string, options: { auto_play?: boolean }) => {
      calls.push(`load(${url},auto_play=${options.auto_play})`);
      return Promise.resolve();
    },
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    setVolume: (v: number) => {
      volume = v;
      calls.push(`setVolume(${v})`);
    },
    seekTo: (ms: number) => calls.push(`seekTo(${ms})`),
    getVolume: (callback: (v: number) => void) => callback(volume),
    getDuration: (callback: (d: number) => void) => callback(duration),
    getPosition: (callback: (p: number) => void) => callback(0),
    getCurrentSound: (callback: (s: unknown) => void) => callback(sound),
    isPaused: (callback: (p: boolean) => void) => callback(true),
    bind: (event: string, handler: (event: unknown) => void) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
    },
  };

  const widget = (element: unknown) => {
    widgetFor = element;
    return player;
  };
  widget.Events = {
    CLICK_BUY: 'buyClicked',
    CLICK_DOWNLOAD: 'downloadClicked',
    ERROR: 'error',
    FINISH: 'finish',
    LOAD_PROGRESS: 'loadProgress',
    OPEN_SHARE_PANEL: 'sharePanelOpened',
    PAUSE: 'pause',
    PLAY: 'play',
    PLAY_PROGRESS: 'playProgress',
    READY: 'ready',
    SEEK: 'seek',
  };

  (globalThis as { SC?: unknown }).SC = { Widget: widget };

  return {
    calls,
    player,
    events: widget.Events,
    fire: (event: string, payload?: unknown) =>
      handlers[event]?.forEach((h) => h(payload)),
    setVolume: (v: number) => (volume = v),
    setDuration: (d: number) => (duration = d),
    setSound: (s: { description?: string | null; title: string }) => (sound = s),
    get widgetFor() {
      return widgetFor;
    },
  };
}

describe('SoundcloudApiService', () => {
  let service: SoundcloudApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new SoundcloudApiService();
  });

  afterEach(() => {
    delete (globalThis as { SC?: unknown }).SC;
  });

  it('identifies itself as the soundcloud platform', () => {
    expect(service.id).toBe('soundcloud');
  });

  it('loads the widget api from soundcloud', async () => {
    await service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://w.soundcloud.com/player/api.js'
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
      ['https://soundcloud.com/artist/track', 'https://soundcloud.com/artist/track'],
      [
        'https://www.soundcloud.com/artist/track',
        'https://www.soundcloud.com/artist/track',
      ],
      ['http://soundcloud.com/artist/track', 'http://soundcloud.com/artist/track'],
      // The whole url is the id — SoundCloud's api resolves permalinks, so
      // there is nothing shorter to extract, query string included.
      [
        'https://soundcloud.com/artist/track?in=artist/sets/album',
        'https://soundcloud.com/artist/track?in=artist/sets/album',
      ],
    ])('extracts the id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      // Needs at least one character of path after the host.
      'https://soundcloud.com/',
      'https://soundcloud.com',
      'ftp://soundcloud.com/artist/track',
      'https://mixcloud.com/artist/track',
      'https://www.youtube.com/watch?v=abcdefg',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });
  });

  describe('prepareHtml', () => {
    it('renders a widget iframe at the requested size', () => {
      const html = service.prepareHtml({
        domId: 'player1',
        width: 600,
        height: 200,
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const iframe = container.querySelector('iframe')!;
      expect(iframe.id).toBe('player1');
      expect(iframe.getAttribute('width')).toBe('600');
      expect(iframe.getAttribute('height')).toBe('200');
      // max-width so the widget cannot overflow its column.
      expect(iframe.getAttribute('style')).toContain('max-width:100%');
      expect(iframe.getAttribute('allow')).toBe('autoplay');
    });

    it('embeds the requested track, url-encoded into the widget query', () => {
      const html = service.prepareHtml({
        domId: 'player1',
        width: 600,
        height: 200,
        initialVideoId: 'https://soundcloud.com/artist/track',
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      // The track url is a query-string value, so its slashes and colon have
      // to be escaped rather than terminating the parameter.
      expect(container.querySelector('iframe')!.getAttribute('src')).toBe(
        'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack&show_teaser=false&'
      );
    });

    it('embeds an empty track url when no initial video is given', () => {
      const html = service.prepareHtml({ domId: 'player1', width: 600, height: 200 });
      const container = document.createElement('div');
      container.innerHTML = html;

      // Nothing to play yet; the widget stays blank until loadVideoById runs.
      expect(container.querySelector('iframe')!.getAttribute('src')).toBe(
        'https://w.soundcloud.com/player/?url=&show_teaser=false&'
      );
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let sc: ReturnType<typeof fakeSc>;
    let element: HTMLElement;
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
      // The ready handler starts a timer(0, 50) volume poll, and the
      // fullscreen/pip corrections run on setTimeout.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      sc = fakeSc();
      element = document.createElement('div');
      iframe = document.createElement('iframe');
      element.appendChild(iframe);
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
            height: 200,
            autoplay: false,
            element: null as unknown as HTMLElement,
          },
          destroy
        )
      ).rejects.toBe('The SoundCloud api requires the options.element to be set');
    });

    it('binds the widget to the iframe inside the host element', async () => {
      const promise = service.createPlayer(
        { width: 600, height: 200, autoplay: false, element },
        destroy
      );
      sc.fire(sc.events.READY);
      await promise;

      expect(sc.widgetFor).toBe(iframe);
    });

    it('resolves only once the widget reports ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer({ width: 600, height: 200, autoplay: false, element }, destroy)
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      sc.fire(sc.events.READY);
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the ready handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        { width: 600, height: 200, autoplay, element },
        destroy
      );
      sc.fire(sc.events.READY);
      return (await promise) as PlayerAdapter;
    }

    it('advertises volume and title support only', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.volume,
        ECapability.getTitle,
      ]);
    });

    it('loads another track through the widget, carrying the autoplay flag', async () => {
      const adapter = await ready(true);

      adapter.loadVideoById('https://soundcloud.com/artist/other');

      expect(sc.calls).toContain(
        'load(https://soundcloud.com/artist/other,auto_play=true)'
      );
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has a widget equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(sc.calls.filter((c) => c === 'play' || c === 'pause')).toEqual([
        'play',
        'pause',
      ]);
    });

    it('mutes by dropping the volume to zero', async () => {
      const adapter = await ready();

      adapter.setMute(true);

      expect(sc.calls).toContain('setVolume(0)');
    });

    it('unmutes back to the volume that was set before muting', async () => {
      const adapter = await ready();

      adapter.setVolume(80);
      adapter.setMute(true);
      adapter.setMute(false);

      expect(sc.calls).toEqual([
        'setVolume(80)',
        'setVolume(0)',
        'setVolume(80)',
      ]);
    });

    it('unmutes back to a volume it only ever saw through the poll', async () => {
      const adapter = await ready();

      // The widget has controls of its own, so a volume the listener chose
      // there arrives through the poll rather than through setVolume.
      sc.setVolume(70);
      jest.advanceTimersByTime(50);
      adapter.setMute(true);
      adapter.setMute(false);

      expect(sc.calls).toEqual(['setVolume(0)', 'setVolume(70)']);
    });

    it('never treats the muted zero as the volume to unmute back to', async () => {
      const adapter = await ready();

      adapter.setVolume(80);
      adapter.setMute(true);
      // Polling while muted reads a 0 that must not overwrite the remembered
      // volume, or unmuting would be a no-op.
      jest.advanceTimersByTime(100);
      adapter.setMute(false);

      expect(sc.calls[sc.calls.length - 1]).toBe('setVolume(80)');
    });

    it('passes the 0-100 volume straight to the widget', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(sc.calls).toContain('setVolume(40)');
    });

    it('seeks in milliseconds, from an api that speaks seconds', async () => {
      const adapter = await ready();

      adapter.setProgress(12);

      expect(sc.calls).toContain('seekTo(12000)');
    });

    it('resizes the iframe inside the host element', async () => {
      const adapter = await ready();

      adapter.setSize(320, 180);

      expect(iframe.getAttribute('width')).toBe('320');
      expect(iframe.getAttribute('height')).toBe('180');
    });

    it('leaves the size alone when the host element holds no iframe', async () => {
      const adapter = await ready();
      iframe.remove();

      expect(() => adapter.setSize(320, 180)).not.toThrow();
    });

    it('prefers the sound description over its title', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('A description');
    });

    it('falls back to the title when the sound has no description', async () => {
      const adapter = await ready();
      sc.setSound({ description: null, title: 'A title' });

      await expect(adapter.getTitle()).resolves.toBe('A title');
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
          "SoundCloud player doesn't support fullscreen mode",
          "SoundCloud player doesn't support PIP mode",
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

    it('translates widget events into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const durations: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onDurationChange = (d) => durations.push(d);
      sc.setDuration(240_000);

      sc.fire(sc.events.PLAY);
      sc.fire(sc.events.PAUSE);
      sc.fire(sc.events.FINISH);

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      // The widget reports milliseconds; the adapter speaks seconds.
      expect(durations).toEqual([240]);
    });

    it('converts the play-progress position from milliseconds to seconds', async () => {
      const adapter = await ready();
      const times: number[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      const event: PlayProgressEvent = {
        soundId: 293,
        loadedProgress: 0.5,
        currentPosition: 12_500,
        relativePosition: 0.25,
      };

      sc.fire(sc.events.PLAY_PROGRESS, event);

      expect(times).toEqual([12.5]);
    });

    it('polls the widget volume and derives mute from it', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);

      sc.setVolume(70);
      jest.advanceTimersByTime(50);

      expect(volumes).toContain(70);
      expect(mutes).toContain(false);
    });

    it('reports mute once the polled volume reaches zero', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      adapter.onMuteChange = (m) => mutes.push(m);

      sc.setVolume(0);
      jest.advanceTimersByTime(50);

      expect(mutes).toContain(true);
    });

    it('stops polling on destroy', async () => {
      const adapter = await ready();
      const volumes: number[] = [];

      adapter.destroy();
      adapter.onVolumeChange = (v) => volumes.push(v);
      jest.advanceTimersByTime(200);

      expect(volumes).toEqual([]);
    });

    it('stops polling once the owner signals destruction', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      destroy.next(true);
      volumes.length = 0;
      jest.advanceTimersByTime(200);

      expect(volumes).toEqual([]);
    });
  });

  describe('PlayerState', () => {
    it('names the four widget states the player can be in', () => {
      // Plain strings, so they survive a round trip through a postMessage.
      expect(PlayerState.UNSTARTED).toBe('unstarted');
      expect(PlayerState.PLAYING).toBe('playing');
      expect(PlayerState.PAUSED).toBe('paused');
      expect(PlayerState.ENDED).toBe('ended');
    });
  });
});
