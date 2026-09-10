import { Deferred } from './deferred';
import {
  Callbacks,
  MixcloudPlayerExternalWidgetApiRPC,
  MixcloudPlayerWidgetApiRPC,
  PlayerWidget,
} from './widgetApi';

/**
 * The widget lives in a cross-origin iframe, so `contentWindow` is replaced
 * with a recorder: jsdom would hand back either null (detached) or a real
 * window whose postMessage we cannot observe per-call.
 */
function harness() {
  const iframe = document.createElement('iframe');
  const otherWindow = { postMessage: jest.fn() };
  Object.defineProperty(iframe, 'contentWindow', {
    value: otherWindow,
    configurable: true,
  });
  return { iframe, otherWindow };
}

/** Everything the shim has posted into the iframe so far, parsed. */
function sent(otherWindow: { postMessage: jest.Mock }) {
  return otherWindow.postMessage.mock.calls.map((call) => JSON.parse(call[0]));
}

/**
 * Dispatch a message at the jsdom window the way the widget iframe would.
 * `source` cannot go through MessageEventInit (jsdom only accepts a real
 * window there), so it is defined onto the event afterwards.
 */
function postFromWidget(
  source: unknown,
  payload: unknown,
  origin: string = window.location.origin
) {
  const event = new MessageEvent('message', {
    data: typeof payload === 'string' ? payload : JSON.stringify(payload),
    origin,
  });
  Object.defineProperty(event, 'source', { value: source, configurable: true });
  window.dispatchEvent(event);
  return event;
}

/** A well-formed widget envelope. */
function envelope(type: string, data?: unknown) {
  return { mixcloud: 'playerWidget', type, data };
}

const API = {
  methods: ['play', 'pause', 'getVolume', 'setVolume'],
  events: ['play', 'pause', 'progress'],
};

describe('Callbacks', () => {
  it('calls every registered callback with the given context and arguments', () => {
    const callbacks = Callbacks();
    const seen: unknown[][] = [];
    const contexts: unknown[] = [];
    callbacks.external.on(function (this: unknown, ...args: unknown[]) {
      contexts.push(this);
      seen.push(args);
    });
    callbacks.external.on((...args: unknown[]) => seen.push(args));
    const context = { name: 'external' };

    callbacks.apply(context, [1, 'two']);

    expect(seen).toEqual([
      [1, 'two'],
      [1, 'two'],
    ]);
    expect(contexts).toEqual([context]);
  });

  it('stops calling a callback once it is turned off', () => {
    const callbacks = Callbacks();
    const kept: number[] = [];
    const dropped: number[] = [];
    const keptHandler = () => kept.push(1);
    const droppedHandler = () => dropped.push(1);
    callbacks.external.on(keptHandler);
    callbacks.external.on(droppedHandler);

    callbacks.external.off(droppedHandler);
    callbacks.apply(null, []);

    expect(kept).toEqual([1]);
    expect(dropped).toEqual([]);
  });

  it('ignores an off for a callback that was never on', () => {
    const callbacks = Callbacks();
    const calls: number[] = [];
    callbacks.external.on(() => calls.push(1));

    expect(() => callbacks.external.off(() => undefined)).not.toThrow();
    callbacks.apply(null, []);

    expect(calls).toEqual([1]);
  });

  it('registers the same callback twice and calls it twice', () => {
    const callbacks = Callbacks();
    let count = 0;
    const handler = () => count++;
    callbacks.external.on(handler);
    callbacks.external.on(handler);

    callbacks.apply(null, []);

    expect(count).toBe(2);
  });

  it('removes every copy of a callback with a single off', () => {
    const callbacks = Callbacks();
    let count = 0;
    const handler = () => count++;
    callbacks.external.on(handler);
    callbacks.external.on(handler);

    // off filters the whole array rather than splicing one entry.
    callbacks.external.off(handler);
    callbacks.apply(null, []);

    expect(count).toBe(0);
  });

  it('does nothing when nothing is registered', () => {
    expect(() => Callbacks().apply(null, [1])).not.toThrow();
  });
});

describe('PlayerWidget', () => {
  let widgets: MixcloudPlayerExternalWidgetApiRPC[];

  beforeEach(() => {
    widgets = [];
  });

  afterEach(() => {
    // Every widget adds a window message listener in its constructor.
    widgets.forEach((widget) => widget.destroy());
    jest.restoreAllMocks();
  });

  /** A widget plus its recorded iframe window, tracked for teardown. */
  function widget() {
    const { iframe, otherWindow } = harness();
    const external = PlayerWidget(iframe);
    widgets.push(external);
    return { external, otherWindow, iframe };
  }

  it('exposes only the public surface before the api arrives', () => {
    const { external } = widget();

    expect(external.apiBuilt).toBe(false);
    expect(external.events).toEqual({});
    expect(external.ready).toBeInstanceOf(Deferred);
    expect(typeof external.destroy).toBe('function');
    // The methods only exist once the widget has described them.
    expect(external.play).toBeUndefined();
    expect(external.getVolume).toBeUndefined();
  });

  it('asks the iframe for its api as soon as it is constructed', () => {
    const { otherWindow } = widget();

    expect(sent(otherWindow)).toEqual([{ type: 'getApi' }]);
    // Posted to '*' because the iframe origin is not known up front.
    expect(otherWindow.postMessage.mock.calls[0][1]).toBe('*');
  });

  it('asks again when the widget announces it is ready', () => {
    const { otherWindow } = widget();

    postFromWidget(otherWindow, envelope('ready'));

    expect(sent(otherWindow)).toEqual([{ type: 'getApi' }, { type: 'getApi' }]);
  });

  it('resolves ready with the populated api once the widget describes it', async () => {
    const { external, otherWindow } = widget();

    postFromWidget(otherWindow, envelope('api', API));

    await expect(external.ready).resolves.toBe(external);
    expect(external.apiBuilt).toBe(true);
    expect(typeof external.play).toBe('function');
    expect(typeof external.setVolume).toBe('function');
    expect(Object.keys(external.events)).toEqual(['play', 'pause', 'progress']);
  });

  it('ignores a second api description, so event handlers survive a re-announce', async () => {
    const { external, otherWindow } = widget();
    postFromWidget(otherWindow, envelope('api', API));
    await external.ready;
    const playEvents = external.events['play'];

    postFromWidget(
      otherWindow,
      envelope('api', { methods: ['seek'], events: ['ended'] })
    );

    expect(external.events['play']).toBe(playEvents);
    expect((external as unknown as Record<string, unknown>)['seek']).toBeUndefined();
    expect(external.events['ended']).toBeUndefined();
  });

  describe('built methods', () => {
    it('posts a method call with an incrementing id and the given arguments', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;
      otherWindow.postMessage.mockClear();

      external.setVolume!(0.4);
      external.play!();

      expect(sent(otherWindow)).toEqual([
        { type: 'method', data: { methodId: 1, methodName: 'setVolume', args: [0.4] } },
        { type: 'method', data: { methodId: 2, methodName: 'play', args: [] } },
      ]);
    });

    it('resolves the call when the widget answers with that method id', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;

      const volume = external.getVolume!();
      postFromWidget(
        otherWindow,
        envelope('methodResponse', { methodId: 1, value: 0.75 })
      );

      await expect(volume).resolves.toBe(0.75);
    });

    it('keeps concurrent calls apart by method id', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;

      const first = external.getVolume!();
      const second = external.getVolume!();
      postFromWidget(
        otherWindow,
        envelope('methodResponse', { methodId: 2, value: 0.2 })
      );
      postFromWidget(
        otherWindow,
        envelope('methodResponse', { methodId: 1, value: 0.1 })
      );

      await expect(first).resolves.toBe(0.1);
      await expect(second).resolves.toBe(0.2);
    });

    it('ignores a response for a method id it does not know', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;
      const volume = external.getVolume!();

      expect(() =>
        postFromWidget(
          otherWindow,
          envelope('methodResponse', { methodId: 99, value: 1 })
        )
      ).not.toThrow();
      // A duplicate answer is dropped too: the entry is deleted on resolve.
      postFromWidget(
        otherWindow,
        envelope('methodResponse', { methodId: 1, value: 0.5 })
      );
      expect(() =>
        postFromWidget(
          otherWindow,
          envelope('methodResponse', { methodId: 1, value: 0.9 })
        )
      ).not.toThrow();

      await expect(volume).resolves.toBe(0.5);
    });
  });

  describe('events', () => {
    it('forwards a widget event to every handler registered for it', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;
      const progress: number[][] = [];
      const contexts: unknown[] = [];
      external.events['progress'].on(function (
        this: unknown,
        ...args: number[]
      ) {
        contexts.push(this);
        progress.push(args);
      });

      postFromWidget(
        otherWindow,
        envelope('event', { eventName: 'progress', args: [12, 240] })
      );

      expect(progress).toEqual([[12, 240]]);
      // Handlers are applied with the public api as `this`.
      expect(contexts).toEqual([external]);
    });

    it('stops forwarding to a handler that was turned off', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;
      const plays: number[] = [];
      const handler = () => plays.push(1);
      external.events['play'].on(handler);

      external.events['play'].off(handler);
      postFromWidget(
        otherWindow,
        envelope('event', { eventName: 'play', args: [] })
      );

      expect(plays).toEqual([]);
    });

    it('ignores an event name the api description never mentioned', async () => {
      const { external, otherWindow } = widget();
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;
      const plays: number[] = [];
      external.events['play'].on(() => plays.push(1));

      postFromWidget(
        otherWindow,
        envelope('event', { eventName: 'unknown', args: [] })
      );

      expect(plays).toEqual([]);
      // The guard keeps the window listener alive, so a known event still
      // dispatches afterwards instead of the shim going deaf.
      postFromWidget(
        otherWindow,
        envelope('event', { eventName: 'play', args: [] })
      );
      expect(plays).toEqual([1]);
    });

    it('ignores a message type it does not understand', () => {
      const { iframe } = harness();
      const api = new MixcloudPlayerWidgetApiRPC(iframe);
      widgets.push(api.external);

      expect(() => api.receiveMessage('somethingElse', {})).not.toThrow();
      expect(api.external.apiBuilt).toBe(false);
    });
  });

  describe('message filtering', () => {
    it('rejects a message from an unexpected origin', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { external, otherWindow } = widget();

      postFromWidget(otherWindow, envelope('api', API), 'https://evil.example');

      expect(external.apiBuilt).toBe(false);
      expect(error).toHaveBeenCalledWith(
        'Playerwidget received message from incorrect origin',
        { expected: 'https://www.mixcloud.com', got: 'https://evil.example' }
      );
    });

    it.each([
      'https://www.mixcloud.com',
      'https://player-widget.mixcloud.com',
    ])('accepts a message from %s', async (origin) => {
      const { external, otherWindow } = widget();

      postFromWidget(otherWindow, envelope('api', API), origin);

      await expect(external.ready).resolves.toBe(external);
    });

    it('accepts a message from the hosting page origin', async () => {
      // Same-origin is allowed so debug_api.html can drive the shim; it also
      // means any same-origin frame can impersonate the widget.
      const { external, otherWindow } = widget();

      postFromWidget(otherWindow, envelope('api', API), window.location.origin);

      await expect(external.ready).resolves.toBe(external);
    });

    it('rejects data that is not JSON', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { external, otherWindow } = widget();

      postFromWidget(otherWindow, 'not json at all');

      expect(external.apiBuilt).toBe(false);
      expect(error.mock.calls[0][0]).toBe(
        'Playerwidget received malformed JSON data'
      );
    });

    it('rejects JSON that is not stamped as a player widget message', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { external, otherWindow } = widget();

      postFromWidget(otherWindow, { type: 'api', data: API });

      expect(external.apiBuilt).toBe(false);
      expect(error).toHaveBeenCalledWith(
        'Playerwidget received incorrect data'
      );
    });

    it('ignores a valid message that came from a different window', () => {
      const { external } = widget();

      postFromWidget({ postMessage: jest.fn() }, envelope('api', API));

      expect(external.apiBuilt).toBe(false);
    });

    it('routes a message only to the widget whose iframe sent it', async () => {
      const first = widget();
      const second = widget();

      postFromWidget(second.otherWindow, envelope('api', API));

      await expect(second.external.ready).resolves.toBe(second.external);
      expect(first.external.apiBuilt).toBe(false);
    });
  });

  describe('destroy', () => {
    it('stops listening, so later widget messages are ignored', () => {
      const { iframe, otherWindow } = harness();
      const external = PlayerWidget(iframe);

      external.destroy();
      postFromWidget(otherWindow, envelope('api', API));

      expect(external.apiBuilt).toBe(false);
    });

    it('leaves an already built api in place', async () => {
      const { iframe, otherWindow } = harness();
      const external = PlayerWidget(iframe);
      postFromWidget(otherWindow, envelope('api', API));
      await external.ready;

      external.destroy();

      // destroy only unhooks the window listener; the methods stay callable
      // and keep posting into an iframe that is about to go away.
      expect(typeof external.play).toBe('function');
      expect(external.apiBuilt).toBe(true);
    });

    it('can be called twice without complaining', () => {
      const { iframe } = harness();
      const external = PlayerWidget(iframe);

      external.destroy();

      expect(() => external.destroy()).not.toThrow();
    });
  });

  describe('debug mode', () => {
    afterEach(() => {
      delete (window as unknown as Record<string, unknown>)['testingPlayerApi'];
      jest.resetModules();
    });

    it('skips the origin check when the page is flagged as the api tester', async () => {
      // DEBUG is read once at module load, so the flag has to be set first.
      (window as unknown as Record<string, unknown>)['testingPlayerApi'] = true;
      let reloaded: typeof import('./widgetApi') | undefined;
      jest.isolateModules(() => {
        reloaded = require('./widgetApi') as typeof import('./widgetApi');
      });
      const { iframe, otherWindow } = harness();
      const external = reloaded!.PlayerWidget(iframe);

      postFromWidget(otherWindow, envelope('api', API), 'https://evil.example');

      await expect(external.ready).resolves.toBe(external);
      external.destroy();
    });
  });
});
