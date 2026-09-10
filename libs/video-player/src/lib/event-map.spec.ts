import { ECapability, EPlayerState } from '@mintplayer/player-provider';
import { fromVideoEvent } from './event-map';
import { VideoPlayer } from './video-player';

/**
 * `fromVideoEvent` is `fromEvent` pointed at a VideoPlayer, which is not an
 * EventTarget. It works because rxjs also accepts a jQuery-style emitter — an
 * object with matching `on`/`off` methods — and VideoPlayer has exactly that
 * pair. These tests pin that binding down, because it is invisible at the call
 * site and would break silently if `on`/`off` were ever renamed.
 */
describe('fromVideoEvent', () => {
  let player: VideoPlayer;

  beforeEach(() => {
    player = new VideoPlayer();
  });

  afterEach(() => {
    player.destroy();
  });

  it('registers a handler for the named event on subscribe', () => {
    const on = jest.spyOn(player, 'on');

    const subscription = fromVideoEvent(player, 'volumeChange').subscribe();

    expect(on).toHaveBeenCalledWith('volumeChange', expect.any(Function));
    subscription.unsubscribe();
  });

  it('emits the payload the player hands its handler', () => {
    const on = jest.spyOn(player, 'on');
    const seen: number[] = [];
    const subscription = fromVideoEvent(player, 'volumeChange').subscribe((v) =>
      seen.push(v)
    );

    const handler = on.mock.calls[0][1] as (volume: number) => void;
    handler(42);
    handler(43);

    expect(seen).toEqual([42, 43]);
    subscription.unsubscribe();
  });

  it('removes the same handler again on unsubscribe', () => {
    const on = jest.spyOn(player, 'on');
    const off = jest.spyOn(player, 'off');
    const subscription = fromVideoEvent(player, 'muteChange').subscribe();
    const handler = on.mock.calls[0][1];

    subscription.unsubscribe();

    // The identical function reference, or off() silently keeps the handler
    // registered and the subscription leaks for the life of the player.
    expect(off).toHaveBeenCalledWith('muteChange', handler);
  });

  it('stops emitting after unsubscribe', () => {
    const on = jest.spyOn(player, 'on');
    const seen: boolean[] = [];
    const subscription = fromVideoEvent(player, 'muteChange').subscribe((m) =>
      seen.push(m)
    );
    const handler = on.mock.calls[0][1] as (mute: boolean) => void;

    handler(true);
    subscription.unsubscribe();
    handler(false);

    expect(seen).toEqual([true]);
  });

  it('gives each subscriber its own registration', () => {
    const on = jest.spyOn(player, 'on');
    const first: number[] = [];
    const second: number[] = [];
    const observable = fromVideoEvent(player, 'volumeChange');

    const a = observable.subscribe((v) => first.push(v));
    const b = observable.subscribe((v) => second.push(v));

    expect(on).toHaveBeenCalledTimes(2);
    (on.mock.calls[0][1] as (v: number) => void)(10);
    (on.mock.calls[1][1] as (v: number) => void)(20);

    expect(first).toEqual([10]);
    expect(second).toEqual([20]);
    a.unsubscribe();
    b.unsubscribe();
  });

  it('covers every event name in the map', () => {
    // A name dropped from VideoEventMap stops this compiling, which is the
    // point: this is the surface the framework wrappers bind against.
    const names = [
      'progressChange',
      'stateChange',
      'volumeChange',
      'muteChange',
      'isFullscreenChange',
      'isPipChange',
      'capabilitiesChange',
    ] as const;
    const on = jest.spyOn(player, 'on');

    const subscriptions = names.map((name) =>
      fromVideoEvent(player, name).subscribe()
    );

    expect(on.mock.calls.map(([name]) => name)).toEqual([...names]);
    subscriptions.forEach((s) => s.unsubscribe());
  });

  it('narrows the payload type per event name', () => {
    // Compile-time assertions: none of these callbacks would typecheck if the
    // map paired an event with the wrong payload.
    const subscriptions = [
      fromVideoEvent(player, 'volumeChange').subscribe((v: number) =>
        v.toFixed(0)
      ),
      fromVideoEvent(player, 'muteChange').subscribe((m: boolean) => !m),
      fromVideoEvent(player, 'stateChange').subscribe((s: EPlayerState) =>
        s.valueOf()
      ),
      fromVideoEvent(player, 'capabilitiesChange').subscribe(
        (c: ECapability[]) => c.length
      ),
      fromVideoEvent(player, 'progressChange').subscribe(
        (p: { currentTime: number; duration: number }) => p.duration
      ),
    ];

    expect(subscriptions).toHaveLength(5);
    subscriptions.forEach((s) => s.unsubscribe());
  });
});
