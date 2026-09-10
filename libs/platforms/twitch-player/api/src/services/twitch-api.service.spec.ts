import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { TwitchApiService } from './twitch-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the Twitch embed SDK this service actually drives. */
function fakeTwitch() {
  const calls: string[] = [];
  const state = {
    channel: 'somestreamer',
    video: '',
    muted: true,
    volume: 0.65,
    currentTime: 42,
    duration: 300,
  };
  const player = {
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    destroy: () => calls.push('destroy'),
    setVideo: (v: string, t: number) => calls.push(`setVideo(${v},${t})`),
    setChannel: (c: string) => calls.push(`setChannel(${c})`),
    setCollection: (c: string) => calls.push(`setCollection(${c})`),
    setMuted: (m: boolean) => calls.push(`setMuted(${m})`),
    setVolume: (v: number) => calls.push(`setVolume(${v})`),
    seek: (t: number) => calls.push(`seek(${t})`),
    getChannel: () => state.channel,
    getVideo: () => state.video,
    getMuted: () => state.muted,
    getVolume: () => state.volume,
    getCurrentTime: () => state.currentTime,
    getDuration: () => state.duration,
  };

  const handlers: Record<string, (() => void)[]> = {};
  let constructedWith: { domId: string; options: Record<string, unknown> } | null =
    null;

  const Player = function (domId: string, options: Record<string, unknown>) {
    constructedWith = { domId, options };
    return {
      ...player,
      addEventListener: (event: string, callback: () => void) => {
        (handlers[event] = handlers[event] ?? []).push(callback);
      },
    };
  };
  Player.READY = 'ready';
  Player.PLAY = 'play';
  Player.PAUSE = 'pause';
  Player.ENDED = 'ended';
  Player.SEEK = 'seek';

  (globalThis as { Twitch?: unknown }).Twitch = { Player };

  return {
    calls,
    state,
    fire: (event: string) => handlers[event]?.forEach((h) => h()),
    get constructedWith() {
      return constructedWith;
    },
  };
}

describe('TwitchApiService', () => {
  let service: TwitchApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new TwitchApiService();
  });

  afterEach(() => {
    delete (globalThis as { Twitch?: unknown }).Twitch;
  });

  it('identifies itself as the twitch platform', () => {
    expect(service.id).toBe('twitch');
  });

  it('loads the embed SDK straight from twitch, with no window callback to wait for', () => {
    service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://player.twitch.tv/js/embed/v1.js'
    );
  });

  describe('urlRegexes', () => {
    /** The id the VideoPlayer would build from `url`, or null. */
    function idFor(url: string) {
      for (const rgx of service.urlRegexes) {
        const match = new RegExp(rgx).exec(url);
        if (match) return service.match2id(match);
      }
      return null;
    }

    it.each([
      'https://www.twitch.tv/somestreamer',
      'https://twitch.tv/somestreamer',
      'http://www.twitch.tv/somestreamer',
    ])('reads a channel out of %s', (url) => {
      expect(JSON.parse(idFor(url) as string)).toEqual({
        channel: 'somestreamer',
      });
    });

    it.each([
      'https://www.twitch.tv/videos/123456789',
      'https://twitch.tv/videos/123456789',
      'http://www.twitch.tv/videos/123456789',
    ])('reads a video out of %s', (url) => {
      expect(JSON.parse(idFor(url) as string)).toEqual({ video: '123456789' });
    });

    it.each([
      // Both regexes are anchored, so a trailing path or query is not a match.
      'https://www.twitch.tv/somestreamer/videos',
      'https://www.twitch.tv/somestreamer?tt_content=hp',
      'https://www.twitch.tv/videos/',
      'https://www.twitch.tv/',
      'https://m.twitch.tv/somestreamer',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });

    it('accepts the underscore Twitch allows in login names, but not a hyphen', () => {
      expect(JSON.parse(idFor('https://www.twitch.tv/some_streamer') as string)).toEqual(
        { channel: 'some_streamer' }
      );
      // Hyphens are not legal in a Twitch login name, so they stay out.
      expect(idFor('https://www.twitch.tv/some-streamer')).toBeNull();
    });
  });

  describe('match2id', () => {
    it('packs the channel, video and collection groups into one id', () => {
      const match = /(?<channel>c)-(?<video>v)-(?<collection>x)/.exec(
        'c-v-x'
      ) as RegExpExecArray;

      expect(JSON.parse(service.match2id(match))).toEqual({
        channel: 'c',
        video: 'v',
        collection: 'x',
      });
    });

    it('yields an empty id for a match with no named groups', () => {
      const match = /twitch/.exec('twitch') as RegExpExecArray;

      expect(service.match2id(match)).toBe('');
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
    let twitch: ReturnType<typeof fakeTwitch>;
    let element: HTMLElement;
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
      // createPlayer starts a timer(0, 50) poll and schedules 50ms
      // self-corrections for fullscreen and pip.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      twitch = fakeTwitch();
      element = document.createElement('div');
      iframe = document.createElement('iframe');
      element.appendChild(iframe);
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    /** Everything but the piece under test in the rejection cases. */
    function options(extra: Record<string, unknown>) {
      return {
        width: 600,
        height: 450,
        autoplay: false,
        element,
        ...extra,
      } as never;
    }

    it('rejects without a dom id to attach to', async () => {
      await expect(
        service.createPlayer(options({ initialVideoId: '{"channel":"x"}' }), destroy)
      ).rejects.toBe('The Twitch api requires the options.domId to be set');
    });

    it('rejects without an initial video id', async () => {
      await expect(
        service.createPlayer(options({ domId: 'player1' }), destroy)
      ).rejects.toBe(
        'The Twitch api requires either channel, video or collection to be set'
      );
    });

    it('rejects an initial video id naming neither channel, video nor collection', async () => {
      await expect(
        service.createPlayer(
          options({ domId: 'player1', initialVideoId: '{"user":"x"}' }),
          destroy
        )
      ).rejects.toBe(
        'The Twitch api requires either channel, video or collection to be set'
      );
    });

    it('rejects a json null, which parses but names nothing', async () => {
      await expect(
        service.createPlayer(
          options({ domId: 'player1', initialVideoId: 'null' }),
          destroy
        )
      ).rejects.toBe(
        'The Twitch api requires either channel, video or collection to be set'
      );
    });

    it('hands the SDK the dom id, the size and the unpacked video request', async () => {
      const promise = service.createPlayer(
        options({
          domId: 'player1',
          initialVideoId: JSON.stringify({ video: '123456789' }),
        }),
        destroy
      );
      twitch.fire('ready');
      await promise;

      expect(twitch.constructedWith!.domId).toBe('player1');
      expect(twitch.constructedWith!.options).toEqual({
        width: 600,
        height: 450,
        channel: undefined,
        video: '123456789',
        collection: undefined,
      });
    });

    it('resolves only once the SDK reports the player is ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer(
          options({ domId: 'player1', initialVideoId: '{"channel":"somestreamer"}' }),
          destroy
        )
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      twitch.fire('ready');
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the READY handshake. */
    async function ready() {
      const promise = service.createPlayer(
        options({ domId: 'player1', initialVideoId: '{"channel":"somestreamer"}' }),
        destroy
      );
      twitch.fire('ready');
      return (await promise) as PlayerAdapter;
    }

    it('advertises mute, volume and title support', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.mute,
        ECapability.volume,
        ECapability.getTitle,
      ]);
    });

    it('switches to another video from the start of it', async () => {
      const adapter = await ready();

      adapter.loadVideoById(JSON.stringify({ video: '123456789' }));

      expect(twitch.calls).toContain('setVideo(123456789,0)');
    });

    it('switches to another channel', async () => {
      const adapter = await ready();

      adapter.loadVideoById(JSON.stringify({ channel: 'otherstreamer' }));

      expect(twitch.calls).toContain('setChannel(otherstreamer)');
    });

    it('switches to a collection', async () => {
      const adapter = await ready();

      adapter.loadVideoById(JSON.stringify({ collection: 'abc123' }));

      expect(twitch.calls).toContain('setCollection(abc123)');
    });

    it('refuses an id naming neither channel, video nor collection', async () => {
      const adapter = await ready();

      expect(() => adapter.loadVideoById('{}')).toThrow(
        'You must pass a video, channel or collection'
      );
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has an SDK equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(twitch.calls).toEqual(['play', 'pause']);
    });

    it('scales volume from the 0-100 api onto the SDK 0-1 range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(twitch.calls).toContain('setVolume(0.4)');
    });

    it('forwards mute and seek straight through', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setProgress(12);

      expect(twitch.calls).toContain('setMuted(true)');
      expect(twitch.calls).toContain('seek(12)');
    });

    it('resizes the iframe the SDK injected into the host element', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(iframe.getAttribute('width')).toBe('320');
      expect(iframe.getAttribute('height')).toBe('240');
    });

    it('ignores a resize arriving before the SDK has injected its iframe', async () => {
      const adapter = await ready();
      element.innerHTML = '';

      // The SDK injects the iframe asynchronously, so an early resize has
      // nothing to apply itself to and must simply do nothing.
      expect(() => adapter.setSize(320, 240)).not.toThrow();
    });

    it('builds the title out of the channel and the video', async () => {
      const adapter = await ready();
      twitch.state.video = '123456789';

      await expect(adapter.getTitle()).resolves.toBe('somestreamer - 123456789');
    });

    it('leaves out the parts of the title the SDK has no value for', async () => {
      const adapter = await ready();
      twitch.state.channel = '';
      twitch.state.video = '123456789';

      await expect(adapter.getTitle()).resolves.toBe('123456789');
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
      const times: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onDurationChange = (d) => durations.push(d);
      adapter.onCurrentTimeChange = (t) => times.push(t);

      twitch.fire('play');
      twitch.fire('pause');
      twitch.fire('ended');
      twitch.state.currentTime = 90;
      twitch.fire('seek');

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      // Duration only becomes known once playback starts.
      expect(durations).toEqual([300]);
      expect(times).toEqual([90]);
    });

    it('polls mute, volume and progress off the player', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      const volumes: number[] = [];
      const times: number[] = [];
      adapter.onMuteChange = (m) => mutes.push(m);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onCurrentTimeChange = (t) => times.push(t);

      jest.advanceTimersByTime(100);

      expect(mutes).toContain(true);
      // Scaled back up from the SDK's 0-1 range.
      expect(volumes).toContain(65);
      expect(times).toContain(42);
    });

    it('destroys the SDK player and stops polling on destroy', async () => {
      const adapter = await ready();
      const times: number[] = [];

      adapter.destroy();
      adapter.onCurrentTimeChange = (t) => times.push(t);
      jest.advanceTimersByTime(200);

      expect(twitch.calls).toContain('destroy');
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
