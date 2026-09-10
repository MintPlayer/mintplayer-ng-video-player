import type { VidyardPlayer } from '@vidyard/embed-code';
import { fromVidyardEvent } from './extensions';

/**
 * A Vidyard player is an old-style emitter: it offers on/off rather than
 * addEventListener, which is exactly the shape fromVidyardEvent has to bridge.
 */
function fakeEmitter() {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  const target = {
    on: (event: string, handler: (...args: unknown[]) => void) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
    },
    off: (event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
    },
  };

  return {
    player: target as unknown as VidyardPlayer,
    fire: (event: string, ...args: unknown[]) =>
      handlers[event]?.slice().forEach((h) => h(...args)),
    listenerCount: (event: string) => (handlers[event] ?? []).length,
  };
}

describe('fromVidyardEvent', () => {
  it('subscribes to the named event only once someone subscribes', () => {
    const emitter = fakeEmitter();

    const play$ = fromVidyardEvent(emitter.player, 'play');
    expect(emitter.listenerCount('play')).toBe(0);

    const subscription = play$.subscribe();
    expect(emitter.listenerCount('play')).toBe(1);

    subscription.unsubscribe();
    expect(emitter.listenerCount('play')).toBe(0);
  });

  it('emits the handler arguments as a tuple', () => {
    const emitter = fakeEmitter();
    const received: unknown[] = [];
    const subscription = fromVidyardEvent(emitter.player, 'play').subscribe((e) =>
      received.push(e)
    );

    emitter.fire('play', 12, emitter.player);

    // The SDK calls the handler with (value, player); the observable hands
    // both over in one emission.
    expect(received).toEqual([[12, emitter.player]]);
    subscription.unsubscribe();
  });

  it('keeps the seek event nested tuple intact', () => {
    const emitter = fakeEmitter();
    const received: unknown[] = [];
    const subscription = fromVidyardEvent(emitter.player, 'seek').subscribe((e) =>
      received.push(e)
    );

    emitter.fire('seek', [3, 42], emitter.player);

    expect(received).toEqual([[[3, 42], emitter.player]]);
    subscription.unsubscribe();
  });

  it('emits every occurrence, not just the first', () => {
    const emitter = fakeEmitter();
    const seconds: number[] = [];
    const subscription = fromVidyardEvent(emitter.player, 'timeupdate').subscribe(
      ([s]) => seconds.push(s)
    );

    emitter.fire('timeupdate', 1, emitter.player);
    emitter.fire('timeupdate', 2, emitter.player);

    expect(seconds).toEqual([1, 2]);
    subscription.unsubscribe();
  });

  it('ignores events other than the one it was asked for', () => {
    const emitter = fakeEmitter();
    const received: unknown[] = [];
    const subscription = fromVidyardEvent(emitter.player, 'pause').subscribe((e) =>
      received.push(e)
    );

    emitter.fire('play', 0, emitter.player);

    expect(received).toEqual([]);
    subscription.unsubscribe();
  });
});
