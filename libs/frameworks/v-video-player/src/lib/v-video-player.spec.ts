import { flushPromises, mount } from '@vue/test-utils';
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

import VVideoPlayer from './v-video-player.vue';
import type { VVideoPlayerProps } from './types';

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

/** Mounts the component and waits for the async onMounted work to finish. */
async function mountPlayer(props: Partial<VVideoPlayerProps> = {}) {
  const wrapper = mount(VVideoPlayer, { props });
  await flushPromises();
  return { wrapper, player: FakeVideoPlayer.instances[0] };
}

describe('VVideoPlayer', () => {
  beforeEach(() => {
    FakeVideoPlayer.instances.length = 0;
  });

  it('renders the element that will host the player inside its wrapper', async () => {
    const { wrapper } = await mountPlayer();

    const host = wrapper.find('.v-video-player > div');
    expect(host.exists()).toBe(true);
    expect(host.element.children).toHaveLength(0);
  });

  it('constructs the player with every resolved plugin api once the loaders settle', async () => {
    const { player } = await mountPlayer();

    expect(FakeVideoPlayer.instances).toHaveLength(1);
    expect(player.apis.map((api) => (api as { id: string }).id)).toEqual(
      expectedApiIds
    );
  });

  it('hosts the player in the wrapped container element', async () => {
    const { wrapper, player } = await mountPlayer();

    expect(player.host).toBe(wrapper.find('.v-video-player > div').element);
  });

  it('does not construct a second player when props change', async () => {
    const { wrapper } = await mountPlayer({ url: 'https://example.com/a' });

    await wrapper.setProps({ url: 'https://example.com/b', volume: 30 });
    await flushPromises();

    expect(FakeVideoPlayer.instances).toHaveLength(1);
  });

  it('pushes the initial url into the player when one is given', async () => {
    const { player } = await mountPlayer({ url: 'https://example.com/a' });

    expect(player.valuesSetFor('url')).toEqual(['https://example.com/a']);
  });

  it('leaves the url alone when no url prop is given', async () => {
    const { player } = await mountPlayer();

    expect(player.valuesSetFor('url')).toEqual([]);
  });

  it('applies the default volume, mute and player state on mount', async () => {
    const { player } = await mountPlayer();

    expect(player.valuesSetFor('volume')).toEqual([0]);
    expect(player.valuesSetFor('mute')).toEqual([false]);
    expect(player.valuesSetFor('playerState')).toEqual([
      EPlayerState.unstarted,
    ]);
  });

  it('applies the given volume, mute and player state on mount', async () => {
    const { player } = await mountPlayer({
      volume: 55,
      mute: true,
      playerState: EPlayerState.playing,
    });

    expect(player.valuesSetFor('volume')).toEqual([55]);
    expect(player.valuesSetFor('mute')).toEqual([true]);
    expect(player.valuesSetFor('playerState')).toEqual([EPlayerState.playing]);
  });

  it('pushes a changed url into the player', async () => {
    const { wrapper, player } = await mountPlayer({
      url: 'https://example.com/a',
    });

    await wrapper.setProps({ url: 'https://example.com/b' });

    expect(player.valuesSetFor('url')).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });

  it('pushes a changed volume into the player', async () => {
    const { wrapper, player } = await mountPlayer({ volume: 10 });

    await wrapper.setProps({ volume: 90 });

    expect(player.valuesSetFor('volume')).toEqual([10, 90]);
  });

  it('pushes a changed mute into the player', async () => {
    const { wrapper, player } = await mountPlayer({ mute: false });

    await wrapper.setProps({ mute: true });

    expect(player.valuesSetFor('mute')).toEqual([false, true]);
  });

  it('pushes a changed player state into the player', async () => {
    const { wrapper, player } = await mountPlayer({
      playerState: EPlayerState.unstarted,
    });

    await wrapper.setProps({ playerState: EPlayerState.ended });

    expect(player.valuesSetFor('playerState')).toEqual([
      EPlayerState.unstarted,
      EPlayerState.ended,
    ]);
  });

  it('ignores prop changes that arrive before the player is constructed', async () => {
    const wrapper = mount(VVideoPlayer, {
      props: { url: 'https://example.com/a', volume: 10 },
    });

    // Deliberately not flushed yet: the watchers fire while onMounted is still
    // awaiting the plugin loaders, so they have no player to push to.
    await wrapper.setProps({
      url: 'https://example.com/b',
      volume: 90,
      mute: true,
      playerState: EPlayerState.playing,
    });
    await flushPromises();

    const player = FakeVideoPlayer.instances[0];
    expect(player.valuesSetFor('url')).toEqual(['https://example.com/b']);
    expect(player.valuesSetFor('volume')).toEqual([90]);
    expect(player.valuesSetFor('mute')).toEqual([true]);
    expect(player.valuesSetFor('playerState')).toEqual([EPlayerState.playing]);
  });

  it('emits update:volume when the player reports a volume change', async () => {
    const { wrapper, player } = await mountPlayer();

    player.emit('volumeChange', 42);

    expect(wrapper.emitted('update:volume')).toEqual([[42]]);
  });

  it('emits update:mute when the player reports a mute change', async () => {
    const { wrapper, player } = await mountPlayer();

    player.emit('muteChange', true);

    expect(wrapper.emitted('update:mute')).toEqual([[true]]);
  });

  it('emits update:playerState when the player reports a state change', async () => {
    const { wrapper, player } = await mountPlayer();

    player.emit('stateChange', EPlayerState.paused);

    expect(wrapper.emitted('update:playerState')).toEqual([
      [EPlayerState.paused],
    ]);
  });

  it('unsubscribes every handler and destroys the player on unmount', async () => {
    const { wrapper, player } = await mountPlayer();

    wrapper.unmount();

    expect(player.offCalls.map((call) => call.event)).toEqual([
      'volumeChange',
      'muteChange',
      'stateChange',
    ]);
    expect(player.destroyCount).toBe(1);
  });

  it('stops emitting after unmount', async () => {
    const { wrapper, player } = await mountPlayer();

    wrapper.unmount();
    player.emit('volumeChange', 42);

    expect(wrapper.emitted('update:volume')).toBeUndefined();
  });
});
