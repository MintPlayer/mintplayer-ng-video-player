import {
  ECapability,
  EPlayerState,
  IApiService,
  PlayerAdapter,
} from '@mintplayer/player-provider';
import { Subject } from 'rxjs';
import { MixcloudApiService } from './mixcloud-api.service';
import { PlayerWidget } from './remote/widgetApi';

// The real PlayerWidget talks to a cross-origin mixcloud iframe over
// postMessage and never resolves its `ready` deferred in jsdom. Its own
// behaviour is covered by remote/widgetApi.spec.ts.
jest.mock('./remote/widgetApi', () => ({
  PlayerWidget: jest.fn(),
}));
const playerWidgetMock = PlayerWidget as jest.MockedFunction<typeof PlayerWidget>;

type Handler = (...args: never[]) => void;

/** The slice of the mixcloud widget api this service actually drives. */
function fakeWidget(options?: { withoutMethods?: boolean }) {
  const calls: string[] = [];
  let volume = 0.5;
  let currentKey = '/artist/show/';
  const handlers: Record<string, Handler[]> = {};

  /** A Callbacks-shaped event slot, as buildApi would install. */
  const slot = (name: string) => {
    handlers[name] = [];
    return {
      on: (callback: Handler) => handlers[name].push(callback),
      off: (callback: Handler) => {
        handlers[name] = handlers[name].filter((h) => h !== callback);
      },
    };
  };

  let resolveReady: (value: unknown) => void = () => undefined;
  const ready = new Promise((resolve) => (resolveReady = resolve));

  const methods = {
    load: (id: string, autoplay: boolean) => {
      calls.push(`load(${id},${autoplay})`);
      return Promise.resolve(true);
    },
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    seek: (seconds: number) => {
      calls.push(`seek(${seconds})`);
      return Promise.resolve(true);
    },
    getVolume: () => {
      calls.push('getVolume');
      return Promise.resolve(volume);
    },
    setVolume: (value: number) => {
      calls.push(`setVolume(${value})`);
      volume = value;
      return Promise.resolve(true);
    },
    getCurrentKey: () => {
      calls.push('getCurrentKey');
      return Promise.resolve(currentKey);
    },
  };

  const external = {
    ready,
    events: {
      play: slot('play'),
      pause: slot('pause'),
      ended: slot('ended'),
      progress: slot('progress'),
    },
    apiBuilt: true,
    destroy: () => calls.push('destroy'),
    ...(options?.withoutMethods ? {} : methods),
  };

  playerWidgetMock.mockImplementation(
    () => external as unknown as ReturnType<typeof PlayerWidget>
  );

  return {
    calls,
    external,
    resolveReady: () => resolveReady(external),
    fire: (event: string, ...args: unknown[]) =>
      handlers[event].slice().forEach((h) => h(...(args as never[]))),
    handlerCount: (event: string) => handlers[event].length,
    setVolume: (value: number) => (volume = value),
    setCurrentKey: (key: string) => (currentKey = key),
  };
}

describe('MixcloudApiService', () => {
  let service: MixcloudApiService;

  beforeEach(() => {
    playerWidgetMock.mockReset();
    service = new MixcloudApiService();
  });

  it('identifies itself as the mixcloud platform', () => {
    expect(service.id).toBe('mixcloud');
  });

  it('does not advertise player reuse, so the VideoPlayer rebuilds the iframe', () => {
    // canReusePlayer is optional on IApiService and mixcloud never sets it,
    // so the VideoPlayer falls back to tearing the iframe down.
    expect((service as IApiService).canReusePlayer).toBeUndefined();
  });

  it('needs no external script and flips apiReady once loaded', async () => {
    const states: boolean[] = [];
    service.apiReady$.subscribe((ready) => states.push(ready));

    await service.loadApi();

    // The widget script is embedded in the iframe, so loadApi resolves at once.
    expect(states).toEqual([false, true]);
  });

  describe('urlRegexes', () => {
    /** The id the VideoPlayer would extract from `url`, or null. */
    function idFor(url: string) {
      for (const rgx of service.urlRegexes) {
        const match = new RegExp(rgx).exec(url);
        if (match) return service.match2id(match);
      }
      return null;
    }

    it.each([
      ['https://www.mixcloud.com/artist/show', '/artist/show/'],
      ['https://www.mixcloud.com/artist/show/', '/artist/show/'],
      ['http://www.mixcloud.com/artist/show', '/artist/show/'],
      ['https://mixcloud.com/artist/show', '/artist/show/'],
      ['http://mixcloud.com/artist/show', '/artist/show/'],
      ['https://www.mixcloud.com/some-artist/some-show-2/', '/some-artist/some-show-2/'],
      ['https://www.mixcloud.com/Artist123/Show456', '/Artist123/Show456/'],
    ])('turns %s into the feed key %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it('extracts the id as a named group so match2id can find it', () => {
      const match = new RegExp(service.urlRegexes[0]).exec(
        'https://www.mixcloud.com/artist/show/'
      );

      expect(match?.groups?.['id']).toBe('/artist/show');
    });

    it.each([
      'https://www.mixcloud.com/artist',
      'https://www.mixcloud.com/',
      'https://www.youtube.com/watch?v=abc',
      // Underscores are not in the character class.
      'https://www.mixcloud.com/artist_name/show',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });

    it('still matches a url with trailing junk, because the regex is unanchored', () => {
      // Not a bug so much as a consequence: everything after the show slug is
      // simply ignored rather than rejected.
      expect(idFor('https://www.mixcloud.com/artist/show?utm=1')).toBe(
        '/artist/show/'
      );
    });

    it.each([
      'https://wwwXmixcloud.com/artist/show',
      'https://www-mixcloud.com/artist/show',
      'https://wwwmixcloud.com/artist/show',
    ])('rejects the lookalike host %s', (url) => {
      // The dot in `(www\.){0,1}` is escaped, so only a literal `www.` prefix
      // is accepted - anything else in its place is a different host.
      expect(idFor(url)).toBeNull();
    });

    it('accepts the host with and without the www. prefix, and nothing between', () => {
      expect(idFor('https://www.mixcloud.com/artist/show')).toBe(
        '/artist/show/'
      );
      expect(idFor('https://mixcloud.com/artist/show')).toBe('/artist/show/');
    });

    it('rejects a match that carries no named groups', () => {
      const match = /https:\/\/www\.mixcloud\.com\/.+/.exec(
        'https://www.mixcloud.com/artist/show'
      ) as RegExpExecArray;

      expect(() => service.match2id(match)).toThrow(
        'match2id - match.groups is undefined'
      );
    });
  });

  describe('prepareHtml', () => {
    /** The single element prepareHtml renders. */
    function render(options: Parameters<MixcloudApiService['prepareHtml']>[0]) {
      const container = document.createElement('div');
      container.innerHTML = service.prepareHtml(options);
      return container.querySelector('iframe')!;
    }

    it('rejects a request with no initial video id', () => {
      expect(() => service.prepareHtml({ width: 600, height: 450 })).toThrow(
        'The MixCloud api requires an initial video id'
      );
    });

    it('renders the widget iframe for the requested feed', () => {
      const iframe = render({
        domId: 'player1',
        width: 600,
        height: 450,
        autoplay: false,
        initialVideoId: '/artist/show/',
      });

      expect(iframe.id).toBe('player1');
      expect(iframe.getAttribute('allow')).toBe('autoplay');
      // max-width so the widget cannot overflow its column.
      expect(iframe.getAttribute('style')).toContain('max-width:100%');
      expect(iframe.getAttribute('src')).toBe(
        'https://www.mixcloud.com/widget/iframe/?autoplay=0&feed=%2Fartist%2Fshow%2F'
      );
    });

    it('asks the widget to autoplay when requested', () => {
      const iframe = render({
        domId: 'player1',
        autoplay: true,
        initialVideoId: '/artist/show/',
      });

      expect(iframe.getAttribute('src')).toContain('autoplay=1');
    });

    it('url-encodes the feed so its slashes survive the query string', () => {
      const iframe = render({
        domId: 'player1',
        initialVideoId: '/artist/show with spaces&more/',
      });

      expect(iframe.getAttribute('src')).toContain(
        'feed=%2Fartist%2Fshow%20with%20spaces%26more%2F'
      );
    });

    it('ignores width and height, since the iframe is sized later', () => {
      const iframe = render({
        width: 800,
        height: 600,
        initialVideoId: '/artist/show/',
      });

      expect(iframe.hasAttribute('width')).toBe(false);
      expect(iframe.hasAttribute('height')).toBe(false);
    });

    it('lets a hostile domId break out of the id attribute', () => {
      // BUG (looks wrong): unlike the file player, prepareHtml does not strip
      // quotes from domId, so a caller-supplied id can inject markup. Asserted
      // as-is so the suite reflects today's behaviour.
      const html = service.prepareHtml({
        domId: 'x" onload="alert(1)',
        initialVideoId: '/artist/show/',
      });

      expect(html).toContain('onload="alert(1)"');
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;
    let widget: ReturnType<typeof fakeWidget>;
    let element: HTMLElement;
    let frame: HTMLIFrameElement;

    beforeEach(() => {
      // createPlayer starts a timer(0, 50) volume poll.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      widget = fakeWidget();
      element = document.createElement('div');
      frame = document.createElement('iframe');
      element.appendChild(frame);
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
      ).rejects.toBe('The MixCloud api requires the options.element to be set');
      expect(playerWidgetMock).not.toHaveBeenCalled();
    });

    it('rejects when the host holds no iframe', async () => {
      await expect(
        service.createPlayer(
          {
            width: 600,
            height: 450,
            autoplay: false,
            element: document.createElement('div'),
          },
          destroy
        )
      ).rejects.toBe("There doesn't seem to be an iframe");
    });

    it('hands the widget shim the iframe it found in the host', async () => {
      const promise = service.createPlayer(
        { width: 600, height: 450, autoplay: false, element },
        destroy
      );
      widget.resolveReady();
      await promise;

      expect(playerWidgetMock).toHaveBeenCalledWith(frame);
    });

    it('resolves only once the widget reports it is ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer({ width: 600, height: 450, autoplay: false, element }, destroy)
        .then((adapter) => {
          resolved = true;
          return adapter;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      widget.resolveReady();
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the ready handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        { width: 600, height: 450, autoplay, element },
        destroy
      );
      widget.resolveReady();
      return (await promise) as PlayerAdapter;
    }

    it('advertises volume and title support, but not mute or fullscreen', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.volume,
        ECapability.getTitle,
      ]);
    });

    it('swaps the feed through the widget, carrying the autoplay preference', async () => {
      const adapter = await ready(true);

      adapter.loadVideoById('/other-artist/other-show/');

      expect(widget.calls).toContain('load(/other-artist/other-show/,true)');
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has a widget equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(widget.calls.filter((c) => c === 'play' || c === 'pause')).toEqual([
        'play',
        'pause',
      ]);
    });

    it('scales volume from the 0-100 api onto the widget 0-1 range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(widget.calls).toContain('setVolume(0.4)');
    });

    it('forwards a seek straight through', async () => {
      const adapter = await ready();

      adapter.setProgress(12);

      expect(widget.calls).toContain('seek(12)');
    });

    it('refuses to mute, because the widget has no mute control', async () => {
      const adapter = await ready();

      expect(() => adapter.setMute(true)).toThrow(
        "MixCloud doesn't allow mute"
      );
    });

    it('resizes the iframe itself', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(frame.getAttribute('width')).toBe('320');
      expect(frame.getAttribute('height')).toBe('240');
    });

    it('reports the current feed key as the title', async () => {
      widget.setCurrentKey('/artist/another-show/');
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('/artist/another-show/');
    });

    it('refuses fullscreen and picture-in-picture', async () => {
      const adapter = await ready();

      expect(() => adapter.setFullscreen(true)).toThrow(
        "MixCloud doesn't support fullscreen"
      );
      expect(() => adapter.setPip(true)).toThrow(
        "MixCloud doesn't support picture-in-picture"
      );
      await expect(adapter.getFullscreen()).resolves.toBe(false);
      await expect(adapter.getPip()).resolves.toBe(false);
    });

    it('translates widget events into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const times: number[] = [];
      const durations: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onDurationChange = (d) => durations.push(d);

      widget.fire('play');
      widget.fire('pause');
      widget.fire('ended');
      widget.fire('progress', 30, 240);

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      expect(times).toEqual([30]);
      expect(durations).toEqual([240]);
    });

    it('polls the widget volume and scales it up to the 0-100 api', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      widget.setVolume(0.25);
      jest.advanceTimersByTime(0);
      await Promise.resolve();
      await Promise.resolve();

      expect(volumes).toEqual([25]);
    });

    it('keeps polling the volume every 50ms', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      jest.advanceTimersByTime(120);
      await Promise.resolve();
      await Promise.resolve();

      // t = 0, 50 and 100.
      expect(volumes).toEqual([50, 50, 50]);
    });

    it('unhooks its event handlers and tears down the widget on destroy', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      adapter.destroy();
      widget.fire('play');
      widget.fire('pause');
      widget.fire('ended');
      widget.fire('progress', 1, 2);

      expect(states).toEqual([]);
      expect(widget.handlerCount('play')).toBe(0);
      expect(widget.handlerCount('progress')).toBe(0);
      expect(widget.calls).toContain('destroy');
    });

    it('stops polling shortly after destroy', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      adapter.destroy();
      // The poll is only cancelled 50ms later, so one more tick can land.
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      volumes.length = 0;
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();

      expect(volumes).toEqual([]);
    });

    it('stops polling as soon as the owner signals destruction', async () => {
      const adapter = await ready();
      const volumes: number[] = [];
      adapter.onVolumeChange = (v) => volumes.push(v);

      destroy.next(true);
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();

      expect(volumes).toEqual([]);
    });

    describe('when the widget never described its methods', () => {
      beforeEach(() => {
        widget = fakeWidget({ withoutMethods: true });
      });

      it('leaves the playback controls as no-ops instead of crashing', async () => {
        const adapter = await ready();

        expect(() => adapter.loadVideoById('/a/b/')).not.toThrow();
        expect(() => adapter.setPlayerState(EPlayerState.playing)).not.toThrow();
        expect(() => adapter.setPlayerState(EPlayerState.paused)).not.toThrow();
        expect(() => adapter.setVolume(50)).not.toThrow();
        expect(() => adapter.setProgress(5)).not.toThrow();
        expect(widget.calls).toEqual([]);
      });

      it('rejects getTitle, because there is no way to ask', async () => {
        const adapter = await ready();

        await expect(adapter.getTitle()).rejects.toBe(
          'Player not yet initialized'
        );
      });

      it('emits no volume while polling, since there is nothing to read', async () => {
        const adapter = await ready();
        const volumes: number[] = [];
        adapter.onVolumeChange = (v) => volumes.push(v);

        jest.advanceTimersByTime(200);
        await Promise.resolve();

        expect(volumes).toEqual([]);
      });
    });
  });
});
