import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { YoutubeApiService } from './youtube-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the YouTube iframe SDK this service actually drives. */
function fakeYt() {
  const calls: string[] = [];
  const player = {
    currentTime: 12,
    volume: 65,
    muted: true,
    duration: 240,
    title: 'The video title',
    loadVideoById: (id: string) => calls.push(`loadVideoById(${id})`),
    cueVideoById: (id: string) => calls.push(`cueVideoById(${id})`),
    playVideo: () => calls.push('playVideo'),
    pauseVideo: () => calls.push('pauseVideo'),
    stopVideo: () => calls.push('stopVideo'),
    mute: () => calls.push('mute'),
    unMute: () => calls.push('unMute'),
    setVolume: (v: number) => calls.push(`setVolume(${v})`),
    seekTo: (t: number, allowSeekAhead: boolean) =>
      calls.push(`seekTo(${t},${allowSeekAhead})`),
    setSize: (w: number, h: number) => calls.push(`setSize(${w},${h})`),
    destroy: () => calls.push('destroy'),
    getVideoData: () => ({ title: player.title }),
    getCurrentTime: () => player.currentTime,
    getVolume: () => player.volume,
    isMuted: () => player.muted,
    getDuration: () => player.duration,
  };

  let events: Record<string, (ev: unknown) => void> = {};
  let constructedWith: { domId: string; options: Record<string, unknown> } | null =
    null;

  (globalThis as { YT?: unknown }).YT = {
    Player: function (domId: string, options: Record<string, unknown>) {
      constructedWith = { domId, options };
      events = options['events'] as Record<string, (ev: unknown) => void>;
      return player;
    },
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
  };

  return {
    calls,
    player,
    fire: (event: string, ev: unknown = {}) => events[event]?.(ev),
    get constructedWith() {
      return constructedWith;
    },
  };
}

describe('YoutubeApiService', () => {
  let service: YoutubeApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new YoutubeApiService();
  });

  afterEach(() => {
    delete (globalThis as { YT?: unknown }).YT;
  });

  it('identifies itself as the youtube platform', () => {
    expect(service.id).toBe('youtube');
  });

  it('loads the iframe api and waits for its window callback', () => {
    service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://www.youtube.com/iframe_api',
      { windowCallback: 'onYouTubeIframeAPIReady' }
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
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['http://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      // The id stops at the first parameter separator, so extra params survive.
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', 'dQw4w9WgXcQ'],
      ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://youtu.be/dQw4w9WgXcQ?t=30', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/shorts/abc123XYZ', 'abc123XYZ'],
      ['https://youtube.com/shorts/abc123XYZ', 'abc123XYZ'],
      ['https://m.youtube.com/shorts/abc123XYZ', 'abc123XYZ'],
      ['https://www.youtube.com/live/liveStream1', 'liveStream1'],
      ['https://youtube.com/live/liveStream1', 'liveStream1'],
    ])('extracts the id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      'https://www.youtube.com/watch?list=PL123',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/',
      'https://m.youtube.com/live/liveStream1',
      'https://www.dailymotion.com/video/x8abcde',
      'https://vimeo.com/123456',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
    });

    it('carries one regex per url shape, with no duplicates', () => {
      // Six shapes: desktop watch, mobile watch, youtu.be, shorts, mobile
      // shorts and live.
      const sources = service.urlRegexes.map((r) => r.source);
      expect(sources).toHaveLength(6);
      expect(new Set(sources).size).toBe(6);
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
    let yt: ReturnType<typeof fakeYt>;
    let element: HTMLElement;

    beforeEach(() => {
      // createPlayer starts a timer(0, 50) poll and schedules 50ms
      // self-corrections for fullscreen and pip.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      yt = fakeYt();
      element = document.createElement('div');
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    it('rejects without a dom id to attach to', async () => {
      await expect(
        service.createPlayer({ width: 600, height: 450, autoplay: false, element }, destroy)
      ).rejects.toBe('The YouTube api requires the options.domId to be set');
    });

    it('hands the SDK the dom id, the size and the player vars', async () => {
      const promise = service.createPlayer(
        { width: 800, height: 600, autoplay: true, domId: 'player1', element },
        destroy
      );
      yt.fire('onReady');
      await promise;

      expect(yt.constructedWith!.domId).toBe('player1');
      expect(yt.constructedWith!.options).toMatchObject({
        width: 800,
        height: 600,
        // fs: 1 keeps the SDK's own fullscreen button available.
        playerVars: { fs: 1, autoplay: true },
      });
    });

    it('resolves only once the SDK reports the player is ready', async () => {
      let resolved = false;
      const promise = service
        .createPlayer(
          { width: 600, height: 450, autoplay: false, domId: 'player1', element },
          destroy
        )
        .then((a) => {
          resolved = true;
          return a;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      yt.fire('onReady');
      await expect(promise).resolves.toBeTruthy();
    });

    /** createPlayer plus the onReady handshake. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        { width: 600, height: 450, autoplay, domId: 'player1', element },
        destroy
      );
      yt.fire('onReady');
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

    it('loads the next video straight away when autoplay is on', async () => {
      const adapter = await ready(true);

      adapter.loadVideoById('nextVideo');

      expect(yt.calls).toContain('loadVideoById(nextVideo)');
    });

    it('only cues the next video when autoplay is off', async () => {
      const adapter = await ready(false);

      adapter.loadVideoById('nextVideo');

      expect(yt.calls).toContain('cueVideoById(nextVideo)');
    });

    it('maps player state onto play, pause and stop', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      adapter.setPlayerState(EPlayerState.ended);
      // unstarted has no SDK equivalent.
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(yt.calls).toEqual(['playVideo', 'pauseVideo', 'stopVideo']);
    });

    it('mutes and unmutes through the two separate SDK calls', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setMute(false);

      expect(yt.calls).toEqual(['mute', 'unMute']);
    });

    it('passes the 0-100 volume straight through, since the SDK uses the same range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(yt.calls).toContain('setVolume(40)');
    });

    it('seeks with allowSeekAhead so an unbuffered position still works', async () => {
      const adapter = await ready();

      adapter.setProgress(12);

      expect(yt.calls).toContain('seekTo(12,true)');
    });

    it('resizes through the SDK rather than the iframe attributes', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(yt.calls).toContain('setSize(320,240)');
    });

    it('reads the title off the video data', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('The video title');
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

    it('translates SDK state changes into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const durations: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onDurationChange = (d) => durations.push(d);

      yt.fire('onStateChange', { data: 1 });
      yt.fire('onStateChange', { data: 2 });
      yt.fire('onStateChange', { data: 0 });
      yt.fire('onStateChange', { data: -1 });
      // BUFFERING is not mapped, so it must not reach the adapter.
      yt.fire('onStateChange', { data: 3 });

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
        EPlayerState.unstarted,
      ]);
      // Duration only becomes known once playback starts.
      expect(durations).toEqual([240]);
    });

    it('polls progress, volume and mute off the player', async () => {
      const adapter = await ready();
      const times: number[] = [];
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);

      jest.advanceTimersByTime(100);

      expect(times).toContain(12);
      expect(volumes).toContain(65);
      expect(mutes).toContain(true);
    });

    it('destroys the SDK player and stops polling on destroy', async () => {
      const adapter = await ready();
      const times: number[] = [];

      adapter.destroy();
      adapter.onCurrentTimeChange = (t) => times.push(t);
      jest.advanceTimersByTime(200);

      expect(yt.calls).toContain('destroy');
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
