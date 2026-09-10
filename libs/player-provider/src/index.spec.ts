import {
  ECapability,
  EPlayerState,
  PlayerAdapterRequired,
  createPlayerAdapter,
} from './index';

/** A required-props bag whose every member records that it was called. */
function requiredProps(): PlayerAdapterRequired & { calls: string[] } {
  const calls: string[] = [];
  const record =
    <T>(name: string, result?: T) =>
    (...args: unknown[]) => {
      calls.push(`${name}(${args.join(',')})`);
      return result as T;
    };

  return {
    calls,
    loadVideoById: record('loadVideoById'),
    setPlayerState: record('setPlayerState'),
    setMute: record('setMute'),
    setVolume: record('setVolume'),
    setProgress: record('setProgress'),
    setSize: record('setSize'),
    getTitle: record('getTitle', Promise.resolve('a title')),
    setPip: record('setPip'),
    getPip: record('getPip', Promise.resolve(false)),
    setFullscreen: record('setFullscreen'),
    getFullscreen: record('getFullscreen', Promise.resolve(false)),
    destroy: record('destroy'),
    get capabilities() {
      return [ECapability.volume];
    },
  };
}

describe('createPlayerAdapter', () => {
  it('keeps every required member reachable on the returned adapter', async () => {
    const props = requiredProps();
    const adapter = createPlayerAdapter(props);

    adapter.loadVideoById('abc');
    adapter.setPlayerState(EPlayerState.playing);
    adapter.setMute(true);
    adapter.setVolume(40);
    adapter.setProgress(12);
    adapter.setSize(320, 240);
    adapter.setPip(true);
    adapter.setFullscreen(true);
    adapter.destroy();

    await expect(adapter.getTitle()).resolves.toBe('a title');
    await expect(adapter.getPip()).resolves.toBe(false);
    await expect(adapter.getFullscreen()).resolves.toBe(false);

    expect(props.calls).toEqual([
      'loadVideoById(abc)',
      'setPlayerState(2)',
      'setMute(true)',
      'setVolume(40)',
      'setProgress(12)',
      'setSize(320,240)',
      'setPip(true)',
      'setFullscreen(true)',
      'destroy()',
      'getTitle()',
      'getPip()',
      'getFullscreen()',
    ]);
  });

  it('carries the capabilities through', () => {
    const adapter = createPlayerAdapter({
      ...requiredProps(),
      get capabilities() {
        return [ECapability.fullscreen, ECapability.mute];
      },
    });

    expect(adapter.capabilities).toEqual([
      ECapability.fullscreen,
      ECapability.mute,
    ]);
  });

  it('reads capabilities once, at construction', () => {
    // Documenting a consequence of the object spread, not endorsing it: the
    // spread evaluates the getter, so the adapter holds a snapshot. Platforms
    // whose capability set depends on runtime feature detection therefore have
    // to have detected before calling createPlayerAdapter.
    let caps = [ECapability.volume];
    const adapter = createPlayerAdapter({
      ...requiredProps(),
      get capabilities() {
        return caps;
      },
    });

    caps = [ECapability.getTitle];

    expect(adapter.capabilities).toEqual([ECapability.volume]);
  });

  it('installs warning stubs for every event callback', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = createPlayerAdapter(requiredProps());

    // A platform that never wires these up must not crash the VideoPlayer, and
    // must not be silent about it either.
    adapter.onStateChange(EPlayerState.playing);
    adapter.onMuteChange(true);
    adapter.onVolumeChange(50);
    adapter.onCurrentTimeChange(3);
    adapter.onDurationChange(300);
    adapter.onFullscreenChange(true);
    adapter.onPipChange(true);

    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      'onStateChange is not registered',
      'onMuteChange is not registered',
      'onVolumeChange is not registered',
      'onCurrentTimeChange is not registered',
      'onDurationChange is not registered',
      'onFullscreenChange is not registered',
      'onPipChange is not registered',
    ]);
    warn.mockRestore();
  });

  it('lets a caller override a stub without touching the others', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = createPlayerAdapter(requiredProps());
    const seen: number[] = [];

    // This is how VideoPlayer wires itself up: assign over the stub.
    adapter.onVolumeChange = (volume) => seen.push(volume);
    adapter.onVolumeChange(70);
    adapter.onMuteChange(true);

    expect(seen).toEqual([70]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('onMuteChange is not registered');
    warn.mockRestore();
  });
});

describe('EPlayerState', () => {
  // The numeric values are part of the published contract: platform adapters
  // and the framework wrappers exchange them across package boundaries, so a
  // renumbering is a breaking change and has to break a test.
  it('has stable numeric values', () => {
    expect(EPlayerState.unstarted).toBe(1);
    expect(EPlayerState.playing).toBe(2);
    expect(EPlayerState.paused).toBe(3);
    expect(EPlayerState.ended).toBe(4);
  });
});

describe('ECapability', () => {
  it('has stable numeric values', () => {
    expect(ECapability.fullscreen).toBe(0);
    expect(ECapability.pictureInPicture).toBe(1);
    expect(ECapability.volume).toBe(2);
    expect(ECapability.mute).toBe(3);
    expect(ECapability.getTitle).toBe(4);
  });
});
