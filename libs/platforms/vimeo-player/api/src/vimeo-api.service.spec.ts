import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject } from 'rxjs';
import { VimeoApiService } from './vimeo-api.service';

// The real loader appends a <script> to the document and waits for it — in
// jsdom that never resolves, and it would reach out to the network if it did.
jest.mock('@mintplayer/script-loader', () => ({
  loadScript: jest.fn(() => Promise.resolve()),
}));
const loadScriptMock = loadScript as jest.MockedFunction<typeof loadScript>;

/** The slice of the Vimeo SDK this service actually drives. */
function fakeVimeo() {
  const calls: string[] = [];
  const state = {
    muted: true,
    volume: 0.65,
    duration: 300,
    title: 'A great vimeo video',
    fullscreen: false,
    pip: false,
  };
  const player = {
    ready: () => Promise.resolve(true),
    destroy: () => {
      calls.push('destroy');
      return Promise.resolve(true);
    },
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    loadVideo: (id: string) => {
      calls.push(`loadVideo(${id})`);
      return Promise.resolve(id);
    },
    getVideoTitle: () => Promise.resolve(state.title),
    getFullscreen: () => Promise.resolve(state.fullscreen),
    requestFullscreen: () => {
      calls.push('requestFullscreen');
      return Promise.resolve(true);
    },
    exitFullscreen: () => {
      calls.push('exitFullscreen');
      return Promise.resolve(true);
    },
    getPictureInPicture: () => Promise.resolve(state.pip),
    requestPictureInPicture: () => {
      calls.push('requestPictureInPicture');
      return Promise.resolve(true);
    },
    exitPictureInPicture: () => {
      calls.push('exitPictureInPicture');
      return Promise.resolve(true);
    },
    getVolume: () => Promise.resolve(state.volume),
    setVolume: (v: number) => calls.push(`setVolume(${v})`),
    setCurrentTime: (t: number) => calls.push(`setCurrentTime(${t})`),
    getDuration: () => Promise.resolve(state.duration),
    getMuted: () => Promise.resolve(state.muted),
    setMuted: (m: boolean) => calls.push(`setMuted(${m})`),
    on: (ev: string, handler: (arg?: unknown) => void) => {
      (handlers[ev] = handlers[ev] ?? []).push(handler);
    },
  };

  const handlers: Record<string, ((arg?: unknown) => void)[]> = {};
  let constructedWith: { domId: string; options: Record<string, unknown> } | null =
    null;

  (globalThis as { Vimeo?: unknown }).Vimeo = {
    Player: function (domId: string, options: Record<string, unknown>) {
      constructedWith = { domId, options };
      return player;
    },
  };

  return {
    calls,
    state,
    player,
    fire: (ev: string, arg?: unknown) => handlers[ev]?.forEach((h) => h(arg)),
    get constructedWith() {
      return constructedWith;
    },
  };
}

/** Lets every already-resolved SDK promise settle under fake timers. */
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('VimeoApiService', () => {
  let service: VimeoApiService;

  beforeEach(() => {
    loadScriptMock.mockClear();
    service = new VimeoApiService();
  });

  afterEach(() => {
    delete (globalThis as { Vimeo?: unknown }).Vimeo;
  });

  it('identifies itself as the vimeo platform', () => {
    expect(service.id).toBe('vimeo');
  });

  it('loads the SDK straight from vimeo, with no window callback to wait for', () => {
    service.loadApi();

    expect(loadScriptMock).toHaveBeenCalledWith(
      'https://player.vimeo.com/api/player.js'
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
      ['https://vimeo.com/123456789', '123456789'],
      ['https://www.vimeo.com/123456789', '123456789'],
      ['http://vimeo.com/123456789', '123456789'],
    ])('extracts the numeric id from %s', (url, id) => {
      expect(idFor(url)).toBe(id);
    });

    it.each([
      // Only numeric ids count, and the regex is anchored at the end.
      'https://vimeo.com/channels/staffpicks',
      'https://vimeo.com/123456789/abcdef',
      'https://vimeo.com/123456789?share=copy',
      'https://player.vimeo.com/video/123456789',
      'https://vimeo.com/',
      'https://www.youtube.com/watch?v=123456789',
    ])('does not match %s', (url) => {
      expect(idFor(url)).toBeNull();
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
    let vimeo: ReturnType<typeof fakeVimeo>;
    let element: HTMLElement;
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
      // createPlayer starts a timer(0, 50) mute poll, delays autoplay by 600ms
      // and checks the pip result 50ms after asking for it.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
      vimeo = fakeVimeo();
      element = document.createElement('div');
      const inner = document.createElement('div');
      iframe = document.createElement('iframe');
      inner.appendChild(iframe);
      element.appendChild(inner);
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    it('rejects without a dom id to attach to', async () => {
      await expect(
        service.createPlayer(
          {
            width: 600,
            height: 450,
            autoplay: false,
            element,
            initialVideoId: '123456789',
          },
          destroy
        )
      ).rejects.toBe('The Vimeo api requires the options.domId to be set');
    });

    it('rejects without an initial video, since the SDK needs one to construct', async () => {
      await expect(
        service.createPlayer(
          { width: 600, height: 450, autoplay: false, element, domId: 'player1' },
          destroy
        )
      ).rejects.toBe('Vimeo requires an initial video');
    });

    /** createPlayer, awaited past the SDK's ready() promise. */
    async function ready(autoplay = false) {
      const promise = service.createPlayer(
        {
          width: 600,
          height: 450,
          autoplay,
          element,
          domId: 'player1',
          initialVideoId: '123456789',
        },
        destroy
      );
      return (await promise) as PlayerAdapter;
    }

    it('hands the SDK the dom id, the video, the size and the pip option', async () => {
      await ready(true);

      expect(vimeo.constructedWith!.domId).toBe('player1');
      expect(vimeo.constructedWith!.options).toEqual({
        id: '123456789',
        width: 600,
        height: 450,
        autoplay: true,
        // pip:true is what makes the pip button appear in the SDK's controlbar.
        pip: true,
      });
    });

    it('advertises fullscreen, pip, volume, mute and title support', async () => {
      const adapter = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.fullscreen,
        ECapability.pictureInPicture,
        ECapability.volume,
        ECapability.mute,
        ECapability.getTitle,
      ]);
    });

    it('swaps the video without rebuilding the player', async () => {
      const adapter = await ready();

      adapter.loadVideoById('987654321');

      expect(vimeo.calls).toContain('loadVideo(987654321)');
    });

    it('maps player state onto play and pause', async () => {
      const adapter = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither of these has an SDK equivalent.
      adapter.setPlayerState(EPlayerState.ended);
      adapter.setPlayerState(EPlayerState.unstarted);

      expect(vimeo.calls).toEqual(['play', 'pause']);
    });

    it('scales volume from the 0-100 api onto the SDK 0-1 range', async () => {
      const adapter = await ready();

      adapter.setVolume(40);

      expect(vimeo.calls).toContain('setVolume(0.4)');
    });

    it('forwards mute and seek straight through', async () => {
      const adapter = await ready();

      adapter.setMute(true);
      adapter.setProgress(12);

      expect(vimeo.calls).toContain('setMuted(true)');
      expect(vimeo.calls).toContain('setCurrentTime(12)');
    });

    it('resizes the iframe the SDK injected into the host element', async () => {
      const adapter = await ready();

      adapter.setSize(320, 240);

      expect(iframe.getAttribute('width')).toBe('320');
      expect(iframe.getAttribute('height')).toBe('240');
    });

    it('leaves the size alone when the host holds no iframe yet', async () => {
      const adapter = await ready();
      element.innerHTML = '';

      expect(() => adapter.setSize(320, 240)).not.toThrow();
    });

    it('reads the title off the SDK', async () => {
      const adapter = await ready();

      await expect(adapter.getTitle()).resolves.toBe('A great vimeo video');
    });

    it('enters and leaves fullscreen through the SDK', async () => {
      const adapter = await ready();

      adapter.setFullscreen(true);
      adapter.setFullscreen(false);

      expect(vimeo.calls).toEqual(['requestFullscreen', 'exitFullscreen']);
    });

    it('reports the SDK fullscreen state', async () => {
      const adapter = await ready();
      vimeo.state.fullscreen = true;

      await expect(adapter.getFullscreen()).resolves.toBe(true);
    });

    it('warns and corrects itself when the SDK silently refuses pip', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const adapter = await ready();
      const pips: boolean[] = [];
      adapter.onPipChange = (p) => pips.push(p);

      adapter.setPip(true);
      // requestPictureInPicture neither resolves nor rejects when the iframe
      // isn't focused, so the service re-reads the real state 50ms later.
      jest.advanceTimersByTime(60);
      await flush();

      expect(vimeo.calls).toContain('requestPictureInPicture');
      expect(pips).toEqual([false]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('stays quiet when the SDK really did enter pip', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const adapter = await ready();
      const pips: boolean[] = [];
      adapter.onPipChange = (p) => pips.push(p);
      vimeo.state.pip = true;

      adapter.setPip(true);
      jest.advanceTimersByTime(60);
      await flush();

      expect(pips).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('leaves pip through the SDK', async () => {
      const adapter = await ready();

      adapter.setPip(false);

      expect(vimeo.calls).toEqual(['exitPictureInPicture']);
    });

    it('reports the SDK pip state', async () => {
      const adapter = await ready();
      vimeo.state.pip = true;

      await expect(adapter.getPip()).resolves.toBe(true);
    });

    it('reports unstarted, volume and duration once the video is loaded', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const volumes: number[] = [];
      const durations: number[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onDurationChange = (d) => durations.push(d);

      vimeo.fire('loaded');
      await flush();

      expect(states).toEqual([EPlayerState.unstarted]);
      // Scaled back up from the SDK's 0-1 range.
      expect(volumes).toEqual([65]);
      expect(durations).toEqual([300]);
    });

    it('starts autoplay only after the SDK has settled', async () => {
      await ready(true);

      vimeo.fire('loaded');
      expect(vimeo.calls).not.toContain('play');

      jest.advanceTimersByTime(600);
      expect(vimeo.calls).toContain('play');
    });

    it('does not start playback on load when autoplay is off', async () => {
      await ready(false);

      vimeo.fire('loaded');
      jest.advanceTimersByTime(600);

      expect(vimeo.calls).not.toContain('play');
    });

    it('polls the mute state off the SDK', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      adapter.onMuteChange = (m) => mutes.push(m);

      vimeo.fire('loaded');
      jest.advanceTimersByTime(100);
      await flush();

      expect(mutes).toContain(true);
    });

    it('translates SDK events into adapter callbacks', async () => {
      const adapter = await ready();
      const states: EPlayerState[] = [];
      const volumes: number[] = [];
      const times: number[] = [];
      const pips: boolean[] = [];
      const fullscreens: boolean[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onCurrentTimeChange = (t) => times.push(t);
      adapter.onPipChange = (p) => pips.push(p);
      adapter.onFullscreenChange = (f) => fullscreens.push(f);

      vimeo.fire('play');
      vimeo.fire('pause');
      vimeo.fire('ended');
      vimeo.fire('volumechange', { volume: 0.3 });
      vimeo.fire('timeupdate', { seconds: 42 });
      vimeo.fire('enterpictureinpicture');
      vimeo.fire('leavepictureinpicture');
      vimeo.fire('fullscreenchange', { fullscreen: true });

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      expect(volumes).toEqual([30]);
      expect(times).toEqual([42]);
      expect(pips).toEqual([true, false]);
      expect(fullscreens).toEqual([true]);
    });

    it('destroys the SDK player and stops polling on destroy', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      vimeo.fire('loaded');

      adapter.destroy();
      adapter.onMuteChange = (m) => mutes.push(m);
      jest.advanceTimersByTime(200);
      await flush();

      expect(vimeo.calls).toContain('destroy');
      expect(mutes).toEqual([]);
    });

    it('stops polling once the owner signals destruction', async () => {
      const adapter = await ready();
      const mutes: boolean[] = [];
      adapter.onMuteChange = (m) => mutes.push(m);
      vimeo.fire('loaded');

      destroy.next(true);
      mutes.length = 0;
      jest.advanceTimersByTime(200);
      await flush();

      expect(mutes).toEqual([]);
    });
  });
});
