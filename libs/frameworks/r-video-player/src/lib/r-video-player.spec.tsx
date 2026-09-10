import { render, waitFor } from '@testing-library/react';
import { EPlayerState } from '@mintplayer/player-provider';

/**
 * The fake stands in for the real VideoPlayer, which would otherwise try to
 * dynamically import a dozen SDK loaders. It records everything the wrapper
 * does to it so the specs can assert on the wrapper's side of the contract.
 */
const { FakeVideoPlayer } = vi.hoisted(() => {
  interface PropertySet {
    property: string;
    value: unknown;
  }

  class FakeVideoPlayer {
    static instances: FakeVideoPlayer[] = [];

    readonly apis: unknown[];
    readonly host?: HTMLElement;
    readonly sets: PropertySet[] = [];
    readonly offCalls: { event: string; handler: unknown }[] = [];
    readonly handlers = new Map<string, ((value: never) => void)[]>();
    destroyCount = 0;

    constructor(apis?: unknown[], host?: HTMLElement) {
      this.apis = apis ?? [];
      this.host = host;
      FakeVideoPlayer.instances.push(this);
    }

    set url(value: string | undefined) {
      this.sets.push({ property: 'url', value });
    }

    set volume(value: number) {
      this.sets.push({ property: 'volume', value });
    }

    set mute(value: boolean) {
      this.sets.push({ property: 'mute', value });
    }

    set playerState(value: number) {
      this.sets.push({ property: 'playerState', value });
    }

    on(event: string, handler: (value: never) => void) {
      const existing = this.handlers.get(event) ?? [];
      existing.push(handler);
      this.handlers.set(event, existing);
    }

    off(event: string, handler: (value: never) => void) {
      this.offCalls.push({ event, handler });
      const existing = this.handlers.get(event);
      const index = existing?.indexOf(handler) ?? -1;
      if (existing && index >= 0) {
        existing.splice(index, 1);
      }
    }

    destroy() {
      this.destroyCount++;
    }

    /** Simulates the player raising one of its own events. */
    emit(event: string, value: unknown) {
      [...(this.handlers.get(event) ?? [])].forEach((handler) =>
        handler(value as never)
      );
    }

    valuesSetFor(property: string) {
      return this.sets
        .filter((entry) => entry.property === property)
        .map((entry) => entry.value);
    }
  }

  return { FakeVideoPlayer };
});

vi.mock('@mintplayer/video-player', () => ({ VideoPlayer: FakeVideoPlayer }));

// Every platform plugin does a dynamic import() of an SDK loader, which cannot
// work under jsdom, so each one becomes a loader resolving to a marker api.
vi.mock('@mintplayer/youtube-player', () => ({
  youtubePlugin: () => Promise.resolve({ id: 'youtube' }),
}));
vi.mock('@mintplayer/dailymotion-player', () => ({
  dailymotionPlugin: () => Promise.resolve({ id: 'dailymotion' }),
}));
vi.mock('@mintplayer/vimeo-player', () => ({
  vimeoPlugin: () => Promise.resolve({ id: 'vimeo' }),
}));
vi.mock('@mintplayer/soundcloud-player', () => ({
  soundCloudPlugin: () => Promise.resolve({ id: 'soundcloud' }),
}));
vi.mock('@mintplayer/mixcloud-player', () => ({
  mixCloudPlugin: () => Promise.resolve({ id: 'mixcloud' }),
}));
vi.mock('@mintplayer/twitch-player', () => ({
  twitchPlugin: () => Promise.resolve({ id: 'twitch' }),
}));
vi.mock('@mintplayer/spotify-player', () => ({
  spotifyPlugin: () => Promise.resolve({ id: 'spotify' }),
}));
vi.mock('@mintplayer/streamable-player', () => ({
  streamablePlugin: () => Promise.resolve({ id: 'streamable' }),
}));
vi.mock('@mintplayer/facebook-player', () => ({
  facebookPlugin: () => Promise.resolve({ id: 'facebook' }),
}));
vi.mock('@mintplayer/file-player', () => ({
  filePlugin: () => Promise.resolve({ id: 'file' }),
}));
vi.mock('@mintplayer/vidyard-player', () => ({
  vidyardPlugin: () => Promise.resolve({ id: 'vidyard' }),
}));
vi.mock('@mintplayer/wistia-player', () => ({
  wistiaPlugin: () => Promise.resolve({ id: 'wistia' }),
}));

import { RVideoPlayer, RVideoPlayerInput } from './r-video-player';

const expectedApiIds = [
  'youtube',
  'dailymotion',
  'vimeo',
  'soundcloud',
  'mixcloud',
  'twitch',
  'spotify',
  'streamable',
  'facebook',
  'file',
  'vidyard',
  'wistia',
];

function renderPlayer(overrides: Partial<RVideoPlayerInput> = {}) {
  const setVolume = vi.fn();
  const setMute = vi.fn();
  const setPlayerState = vi.fn();

  const props: RVideoPlayerInput = {
    volumeState: [0, setVolume],
    muteState: [false, setMute],
    playerStateState: [EPlayerState.unstarted, setPlayerState],
    ...overrides,
  };

  const view = render(<RVideoPlayer {...props} />);

  const rerenderWith = (next: Partial<RVideoPlayerInput>) =>
    view.rerender(<RVideoPlayer {...props} {...next} />);

  return { ...view, props, rerenderWith, setVolume, setMute, setPlayerState };
}

/** Resolves once the plugin promises have been awaited and the player exists. */
async function firstPlayer() {
  await waitFor(() => expect(FakeVideoPlayer.instances).toHaveLength(1));
  return FakeVideoPlayer.instances[0];
}

describe('RVideoPlayer', () => {
  beforeEach(() => {
    FakeVideoPlayer.instances.length = 0;
  });

  it('renders a styled container wrapping the element that will host the player', () => {
    const { container } = renderPlayer();

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.tagName).toBe('DIV');
    expect(outer.className).toBeTruthy();
    expect(outer.children).toHaveLength(1);
    expect(outer.children[0].tagName).toBe('DIV');
    expect(outer.children[0].children).toHaveLength(0);
  });

  it('constructs the player with every resolved plugin api once the loaders settle', async () => {
    renderPlayer();

    const player = await firstPlayer();
    expect(player.apis.map((api) => (api as { id: string }).id)).toEqual(
      expectedApiIds
    );
  });

  it('hosts the player in the inner container element', async () => {
    const { container } = renderPlayer();

    const player = await firstPlayer();
    expect(player.host).toBe(container.firstElementChild?.firstElementChild);
  });

  it('does not construct a second player when the component re-renders', async () => {
    const { rerenderWith } = renderPlayer({ url: 'https://example.com/a' });

    await firstPlayer();
    rerenderWith({ url: 'https://example.com/b' });
    rerenderWith({ volumeState: [80, vi.fn()] });

    expect(FakeVideoPlayer.instances).toHaveLength(1);
  });

  it('pushes a changed url into the player', async () => {
    const { rerenderWith } = renderPlayer({ url: 'https://example.com/a' });

    const player = await firstPlayer();
    rerenderWith({ url: 'https://example.com/b' });

    expect(player.valuesSetFor('url')).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });

  it('pushes a changed volume into the player', async () => {
    const { rerenderWith, setVolume } = renderPlayer();

    const player = await firstPlayer();
    rerenderWith({ volumeState: [65, setVolume] });

    expect(player.valuesSetFor('volume')).toEqual([0, 65]);
  });

  it('pushes a changed mute into the player', async () => {
    const { rerenderWith, setMute } = renderPlayer();

    const player = await firstPlayer();
    rerenderWith({ muteState: [true, setMute] });

    expect(player.valuesSetFor('mute')).toEqual([false, true]);
  });

  it('pushes a changed player state into the player', async () => {
    const { rerenderWith, setPlayerState } = renderPlayer();

    const player = await firstPlayer();
    rerenderWith({ playerStateState: [EPlayerState.playing, setPlayerState] });

    expect(player.valuesSetFor('playerState')).toEqual([
      EPlayerState.unstarted,
      EPlayerState.playing,
    ]);
  });

  it('pushes the initial url, volume, mute and player state once the player exists', async () => {
    renderPlayer({
      url: 'https://example.com/a',
      volumeState: [70, vi.fn()],
      muteState: [true, vi.fn()],
      playerStateState: [EPlayerState.playing, vi.fn()],
    });

    const player = await firstPlayer();

    // The player is constructed asynchronously, so each pushing effect has to
    // re-run once it appears — nothing here changed after the initial render.
    expect(player.valuesSetFor('url')).toEqual(['https://example.com/a']);
    expect(player.valuesSetFor('volume')).toEqual([70]);
    expect(player.valuesSetFor('mute')).toEqual([true]);
    expect(player.valuesSetFor('playerState')).toEqual([EPlayerState.playing]);
  });

  it('feeds the player volumeChange event back into the volume setter', async () => {
    const { setVolume } = renderPlayer();

    const player = await firstPlayer();
    await waitFor(() => expect(player.handlers.get('volumeChange')).toBeDefined());
    player.emit('volumeChange', 42);

    expect(setVolume).toHaveBeenCalledWith(42);
  });

  it('feeds the player muteChange event back into the mute setter', async () => {
    const { setMute } = renderPlayer();

    const player = await firstPlayer();
    await waitFor(() => expect(player.handlers.get('muteChange')).toBeDefined());
    player.emit('muteChange', true);

    expect(setMute).toHaveBeenCalledWith(true);
  });

  it('feeds the player stateChange event back into the player state setter', async () => {
    const { setPlayerState } = renderPlayer();

    const player = await firstPlayer();
    await waitFor(() => expect(player.handlers.get('stateChange')).toBeDefined());
    player.emit('stateChange', EPlayerState.paused);

    expect(setPlayerState).toHaveBeenCalledWith(EPlayerState.paused);
  });

  it('subscribes to each player event exactly once', async () => {
    const { rerenderWith } = renderPlayer();

    const player = await firstPlayer();
    await waitFor(() => expect(player.handlers.get('stateChange')).toBeDefined());
    rerenderWith({ url: 'https://example.com/b' });

    expect(player.handlers.get('volumeChange')).toHaveLength(1);
    expect(player.handlers.get('muteChange')).toHaveLength(1);
    expect(player.handlers.get('stateChange')).toHaveLength(1);
  });
});
