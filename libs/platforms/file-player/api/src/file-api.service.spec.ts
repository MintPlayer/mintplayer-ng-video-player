import { ECapability, EPlayerState, PlayerAdapter } from '@mintplayer/player-provider';
import { Subject } from 'rxjs';
import { FileApiService } from './file-api.service';

/** What match2id packs into the video id, and prepareHtml unpacks. */
function mediaId(
  tagType: 'audio' | 'video',
  id: string,
  extension: string
) {
  return JSON.stringify({ tagType, id, extension });
}

/** The first regex that matches `url`, run through match2id. */
function idFor(service: FileApiService, url: string) {
  for (const rgx of service.urlRegexes) {
    const match = new RegExp(rgx).exec(url);
    if (match) return service.match2id(match);
  }
  return null;
}

/**
 * jsdom implements none of the media element methods the adapter drives, so
 * they are replaced with recorders. Returns the element plus its call log.
 */
function stubMedia(element: HTMLAudioElement | HTMLVideoElement) {
  const calls: string[] = [];
  element.play = () => {
    calls.push('play');
    return Promise.resolve();
  };
  element.pause = () => {
    calls.push('pause');
  };
  element.load = () => {
    calls.push('load');
  };
  (element as HTMLVideoElement & { fastSeek: (t: number) => void }).fastSeek = (
    t: number
  ) => {
    calls.push(`fastSeek(${t})`);
  };
  return calls;
}

describe('FileApiService', () => {
  let service: FileApiService;

  beforeEach(() => {
    service = new FileApiService();
  });

  it('identifies itself as the file platform', () => {
    expect(service.id).toBe('file');
  });

  it('refuses player reuse', () => {
    // Every url produces a different element, so the VideoPlayer has to
    // rebuild rather than call loadVideoById.
    expect(service.canReusePlayer).toBe(false);
  });

  it('needs no external script', async () => {
    await expect(service.loadApi()).resolves.toBeUndefined();
  });

  describe('urlRegexes', () => {
    const audio = ['m4a', 'm4b', 'mp4a', 'mpga', 'mp2', 'mp2a', 'mp3', 'm2a', 'm3a', 'wav', 'weba', 'aac', 'oga', 'spx'];
    const video = ['mp4', 'ogg', 'ogv', 'webm', 'mov', 'm4v'];

    it.each(audio)('recognises .%s as audio', (extension) => {
      const id = idFor(service, `https://host/track.${extension}`);
      expect(id && JSON.parse(id)).toEqual({
        tagType: 'audio',
        id: `https://host/track.${extension}`,
        extension,
      });
    });

    it.each(video)('recognises .%s as video', (extension) => {
      const id = idFor(service, `https://host/clip.${extension}`);
      expect(id && JSON.parse(id)).toEqual({
        tagType: 'video',
        id: `https://host/clip.${extension}`,
        extension,
      });
    });

    it('accepts plain http as well as https', () => {
      expect(idFor(service, 'http://host/track.mp3')).not.toBeNull();
    });

    it('does not match a url with no media extension', () => {
      expect(idFor(service, 'https://host/page.html')).toBeNull();
    });
  });

  describe('match2id', () => {
    it('rejects a match with no named groups', () => {
      const match = /https:\/\/host\/.+/.exec(
        'https://host/track.mp3'
      ) as RegExpExecArray;

      expect(() => service.match2id(match)).toThrow(
        'match2id - match.groups is undefined'
      );
    });

    it('rejects a match with neither an audio nor a video type', () => {
      const match = /(?<id>https:\/\/host\/.+)/.exec(
        'https://host/track.mp3'
      ) as RegExpExecArray;

      expect(() => service.match2id(match)).toThrow('Cannot match type');
    });
  });

  describe('prepareHtml', () => {
    it('rejects a request with no initial video id', () => {
      expect(() => service.prepareHtml({ width: 600, height: 450 })).toThrow(
        'The File api requires an initial video id'
      );
    });

    it('renders an audio element over a canvas for the equalizer', () => {
      const html = service.prepareHtml({
        width: 600,
        height: 450,
        autoplay: true,
        initialVideoId: mediaId('audio', 'https://host/track.mp3', 'mp3'),
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const audio = container.querySelector('audio')!;
      expect(audio.getAttribute('src')).toBe('https://host/track.mp3');
      expect(audio.hasAttribute('autoplay')).toBe(true);
      // The canvas is what createEqualizer draws the spectrum onto.
      const canvas = container.querySelector('canvas')!;
      expect(canvas.getAttribute('width')).toBe('600');
      expect(canvas.getAttribute('height')).toBe('450');
    });

    it('renders a video element at the requested size', () => {
      const html = service.prepareHtml({
        width: 800,
        height: 600,
        autoplay: false,
        initialVideoId: mediaId('video', 'https://host/clip.mp4', 'mp4'),
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const video = container.querySelector('video')!;
      expect(video.getAttribute('src')).toBe('https://host/clip.mp4');
      expect(video.getAttribute('width')).toBe('800');
      expect(video.getAttribute('height')).toBe('600');
      expect(video.hasAttribute('autoplay')).toBe(false);
      expect(video.hasAttribute('controls')).toBe(true);
    });

    it('falls back to 500x300 for a video with no size', () => {
      const html = service.prepareHtml({
        initialVideoId: mediaId('video', 'https://host/clip.mp4', 'mp4'),
      });
      const container = document.createElement('div');
      container.innerHTML = html;

      const video = container.querySelector('video')!;
      expect(video.getAttribute('width')).toBe('500');
      expect(video.getAttribute('height')).toBe('300');
    });

    it('strips every quote and angle bracket from the url, not just the first', () => {
      // The id lands in a src="" attribute, so one surviving quote is enough
      // to close the attribute and inject markup into the host page.
      const html = service.prepareHtml({
        width: 600,
        height: 450,
        initialVideoId: mediaId(
          'video',
          'https://host/a".mp4" onerror="alert(1)"><script>x</script',
          'mp4'
        ),
      });

      expect(html).not.toContain('<script');
      expect(html).not.toContain('onerror="');
      const container = document.createElement('div');
      container.innerHTML = html;
      expect(container.querySelectorAll('video')).toHaveLength(1);
      expect(container.querySelector('video')!.hasAttribute('onerror')).toBe(
        false
      );
    });

    it('rejects a media type it cannot render', () => {
      expect(() =>
        service.prepareHtml({
          initialVideoId: JSON.stringify({
            tagType: 'subtitle',
            id: 'https://host/x.vtt',
            extension: 'vtt',
          }),
        })
      ).toThrow('Unsupported media type: vtt');
    });
  });

  describe('createPlayer', () => {
    let destroy: Subject<boolean>;

    beforeEach(() => {
      // createPlayer starts a timer(0, 50) progress poll. Under real timers it
      // would keep firing through every assertion below, reading a NaN
      // duration off a media element jsdom never loads.
      jest.useFakeTimers();
      destroy = new Subject<boolean>();
    });

    afterEach(() => {
      destroy.next(true);
      destroy.complete();
      jest.useRealTimers();
    });

    /** A host div holding a stubbed video element, ready for createPlayer. */
    function videoHost() {
      const element = document.createElement('div');
      const inner = document.createElement('div');
      const video = document.createElement('video');
      inner.appendChild(video);
      element.appendChild(inner);
      document.body.appendChild(element);
      const calls = stubMedia(video);
      return { element, inner, video, calls };
    }

    it('rejects without a host element', async () => {
      await expect(
        service.createPlayer(
          { width: 600, height: 450, autoplay: false, element: null as unknown as HTMLElement },
          destroy
        )
      ).rejects.toBe('The FilePlayer requires the options.element to be set');
    });

    it('rejects when the host holds no audio or video element', async () => {
      const element = document.createElement('div');

      await expect(
        service.createPlayer(
          { width: 600, height: 450, autoplay: false, element },
          destroy
        )
      ).rejects.toBe("There doesn't seem to be an audio or video element");
    });

    it('waits for canplay before resolving an adapter', async () => {
      const { element, video } = videoHost();
      let resolved = false;
      const promise = service
        .createPlayer({ width: 600, height: 450, autoplay: false, element }, destroy)
        .then((adapter) => {
          resolved = true;
          return adapter;
        });

      await Promise.resolve();
      expect(resolved).toBe(false);

      video.dispatchEvent(new Event('canplay'));
      const adapter = await promise;

      expect(adapter).toBeTruthy();
      adapter.destroy();
      element.remove();
    });

    /** createPlayer + the canplay handshake, in one step. */
    async function ready() {
      const host = videoHost();
      const promise = service.createPlayer(
        { width: 600, height: 450, autoplay: false, element: host.element },
        destroy
      );
      host.video.dispatchEvent(new Event('canplay'));
      const adapter: PlayerAdapter = await promise;
      return { ...host, adapter };
    }

    it('advertises volume, mute, fullscreen and pip', async () => {
      const { adapter, element } = await ready();

      expect(adapter.capabilities).toEqual([
        ECapability.volume,
        ECapability.mute,
        ECapability.fullscreen,
        ECapability.pictureInPicture,
      ]);
      adapter.destroy();
      element.remove();
    });

    it('maps player state onto play and pause', async () => {
      const { adapter, calls, element } = await ready();

      adapter.setPlayerState(EPlayerState.playing);
      adapter.setPlayerState(EPlayerState.paused);
      // Neither unstarted nor ended has a media-element equivalent.
      adapter.setPlayerState(EPlayerState.unstarted);
      adapter.setPlayerState(EPlayerState.ended);

      expect(calls).toEqual(['play', 'pause']);
      adapter.destroy();
      element.remove();
    });

    it('scales volume from the 0-100 api onto the 0-1 element', async () => {
      const { adapter, video, element } = await ready();

      adapter.setVolume(40);

      expect(video.volume).toBeCloseTo(0.4);
      adapter.destroy();
      element.remove();
    });

    it('forwards mute and seek straight through', async () => {
      const { adapter, video, calls, element } = await ready();

      adapter.setMute(true);
      adapter.setProgress(12);

      expect(video.muted).toBe(true);
      expect(calls).toContain('fastSeek(12)');
      adapter.destroy();
      element.remove();
    });

    it('resizes the video element', async () => {
      const { adapter, video, element } = await ready();

      adapter.setSize(320, 240);

      expect(video.width).toBe(320);
      expect(video.height).toBe(240);
      adapter.destroy();
      element.remove();
    });

    it('has no title to offer', async () => {
      const { adapter, element } = await ready();

      await expect(adapter.getTitle()).rejects.toBe(
        "File player doesn't support getting the title"
      );
      adapter.destroy();
      element.remove();
    });

    it('reports pip and fullscreen as false when asked directly', async () => {
      const { adapter, element } = await ready();

      await expect(adapter.getPip()).resolves.toBe(false);
      await expect(adapter.getFullscreen()).resolves.toBe(false);
      adapter.destroy();
      element.remove();
    });

    it('translates element events into adapter callbacks', async () => {
      const { adapter, video, element } = await ready();
      const states: EPlayerState[] = [];
      const pips: boolean[] = [];
      const volumes: number[] = [];
      const mutes: boolean[] = [];
      adapter.onStateChange = (s) => states.push(s);
      adapter.onPipChange = (p) => pips.push(p);
      adapter.onVolumeChange = (v) => volumes.push(v);
      adapter.onMuteChange = (m) => mutes.push(m);

      video.dispatchEvent(new Event('play'));
      video.dispatchEvent(new Event('pause'));
      video.dispatchEvent(new Event('ended'));
      video.dispatchEvent(new Event('enterpictureinpicture'));
      video.dispatchEvent(new Event('leavepictureinpicture'));
      video.volume = 0.7;
      video.muted = true;
      video.dispatchEvent(new Event('volumechange'));

      expect(states).toEqual([
        EPlayerState.playing,
        EPlayerState.paused,
        EPlayerState.ended,
      ]);
      expect(pips).toEqual([true, false]);
      expect(volumes[volumes.length - 1]).toBeCloseTo(70);
      expect(mutes[mutes.length - 1]).toBe(true);
      adapter.destroy();
      element.remove();
    });

    it('requests fullscreen on the wrapper div, not the media element', async () => {
      const { adapter, inner, element } = await ready();
      const requests: string[] = [];
      inner.requestFullscreen = () => {
        requests.push('request');
        return Promise.resolve();
      };

      adapter.setFullscreen(true);

      expect(requests).toEqual(['request']);
      adapter.destroy();
      element.remove();
    });

    it('only exits fullscreen when it is the one in fullscreen', async () => {
      const { adapter, inner, element } = await ready();
      let exits = 0;
      (document as Document & { exitFullscreen: () => Promise<void> }).exitFullscreen =
        () => {
          exits++;
          return Promise.resolve();
        };

      adapter.setFullscreen(false);
      expect(exits).toBe(0);

      Object.defineProperty(document, 'fullscreenElement', {
        value: inner,
        configurable: true,
      });
      adapter.setFullscreen(false);
      expect(exits).toBe(1);

      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true,
      });
      adapter.destroy();
      element.remove();
    });

    it('requests and exits picture-in-picture on the video element', async () => {
      const { adapter, video, element } = await ready();
      const calls: string[] = [];
      (
        video as unknown as { requestPictureInPicture: () => Promise<unknown> }
      ).requestPictureInPicture = () => {
        calls.push('enter');
        return Promise.resolve({});
      };
      (document as Document & { exitPictureInPicture: () => Promise<void> }).exitPictureInPicture =
        () => {
          calls.push('exit');
          return Promise.resolve();
        };

      adapter.setPip(true);
      adapter.setPip(false);
      expect(calls).toEqual(['enter']);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        configurable: true,
      });
      adapter.setPip(false);
      expect(calls).toEqual(['enter', 'exit']);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: null,
        configurable: true,
      });
      adapter.destroy();
      element.remove();
    });

    it('does nothing for loadVideoById, since the player cannot be reused', async () => {
      const { adapter, element } = await ready();

      expect(() => adapter.loadVideoById('https://host/other.mp4')).not.toThrow();
      adapter.destroy();
      element.remove();
    });

    it('stops playback and drops the source on destroy', async () => {
      const { adapter, video, calls, element } = await ready();
      video.setAttribute('src', 'https://host/clip.mp4');

      adapter.destroy();

      expect(calls).toContain('pause');
      expect(calls).toContain('load');
      expect(video.hasAttribute('src')).toBe(false);
      element.remove();
    });

    it('stops emitting after destroy', async () => {
      const { adapter, video, element } = await ready();
      const states: EPlayerState[] = [];

      adapter.destroy();
      adapter.onStateChange = (s) => states.push(s);
      video.dispatchEvent(new Event('play'));

      expect(states).toEqual([]);
      element.remove();
    });

    it('stops emitting once the owner signals destruction', async () => {
      const { adapter, video, element } = await ready();
      const states: EPlayerState[] = [];
      adapter.onStateChange = (s) => states.push(s);

      destroy.next(true);
      video.dispatchEvent(new Event('play'));

      expect(states).toEqual([]);
      element.remove();
    });

    /**
     * The audio branch additionally builds a Web Audio equalizer over the
     * canvas that prepareHtml renders. jsdom has neither AudioContext, nor
     * ResizeObserver, nor a 2d canvas context, so all three are stubbed —
     * without them createEqualizer throws and the whole audio path is
     * unreachable from a test.
     */
    describe('audio', () => {
      let audioNodes: string[];
      let originalAudioContext: unknown;
      let originalResizeObserver: unknown;
      let originalGetContext: unknown;
      let analyzer: { fftSize: number; frequencyBinCount: number; disconnect: () => void; connect: () => void; getByteFrequencyData: (a: Uint8Array) => void };

      beforeEach(() => {
        audioNodes = [];
        analyzer = {
          fftSize: 0,
          frequencyBinCount: 8,
          connect: () => audioNodes.push('analyzer.connect'),
          disconnect: () => audioNodes.push('analyzer.disconnect'),
          getByteFrequencyData: (array: Uint8Array) => array.fill(128),
        };

        originalAudioContext = (globalThis as { AudioContext?: unknown }).AudioContext;
        (globalThis as { AudioContext?: unknown }).AudioContext = class {
          createAnalyser() {
            return analyzer;
          }
          createMediaElementSource() {
            return {
              connect: () => audioNodes.push('source.connect'),
              disconnect: () => audioNodes.push('source.disconnect'),
            };
          }
          get destination() {
            return {};
          }
          close() {
            audioNodes.push('context.close');
            return Promise.resolve();
          }
        };

        originalResizeObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
          constructor(private cb: (entries: unknown[]) => void) {
            resizeCallbacks.push((width: number) =>
              this.cb([{ contentRect: { width } }])
            );
          }
          observe() {
            audioNodes.push('observe');
          }
          unobserve() {
            audioNodes.push('unobserve');
          }
          disconnect() {
            /* not used */
          }
        };

        originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = (() => ({
          clearRect: () => undefined,
          fillRect: () => undefined,
          fillStyle: '',
        })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
      });

      const resizeCallbacks: ((width: number) => void)[] = [];

      afterEach(() => {
        resizeCallbacks.length = 0;
        (globalThis as { AudioContext?: unknown }).AudioContext = originalAudioContext;
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver = originalResizeObserver;
        HTMLCanvasElement.prototype.getContext =
          originalGetContext as typeof HTMLCanvasElement.prototype.getContext;
      });

      /** A host rendered by prepareHtml, so the real audio+canvas structure. */
      async function readyAudio() {
        const element = document.createElement('div');
        element.innerHTML = service.prepareHtml({
          width: 600,
          height: 450,
          autoplay: false,
          initialVideoId: mediaId('audio', 'https://host/track.mp3', 'mp3'),
        });
        document.body.appendChild(element);
        const audio = element.querySelector('audio')!;
        const calls = stubMedia(audio);

        const promise = service.createPlayer(
          { width: 600, height: 450, autoplay: false, element },
          destroy
        );
        audio.dispatchEvent(new Event('canplay'));
        const adapter: PlayerAdapter = await promise;
        return { element, audio, calls, adapter };
      }

      it('wires the equalizer between the audio element and the output', async () => {
        const { adapter, element } = await readyAudio();

        expect(audioNodes).toContain('source.connect');
        expect(audioNodes).toContain('analyzer.connect');
        expect(audioNodes).toContain('observe');
        adapter.destroy();
        element.remove();
      });

      it('sizes the fft to a power of two derived from the canvas width', async () => {
        const { adapter, element } = await readyAudio();

        // 600 / 4 = 150, log2(150) rounds to 7, so 2^7.
        expect(analyzer.fftSize).toBe(128);

        resizeCallbacks.forEach((fire) => fire(2048));
        expect(analyzer.fftSize).toBe(512);
        adapter.destroy();
        element.remove();
      });

      it('leaves an audio element unsized, having no video box to resize', async () => {
        const { adapter, audio, element } = await readyAudio();

        adapter.setSize(320, 240);

        expect(audio.getAttribute('width')).toBeNull();
        adapter.destroy();
        element.remove();
      });

      it('reports fullscreen against the wrapper div for audio', async () => {
        const { adapter, element } = await readyAudio();
        const div = element.querySelector('div')!;
        const fullscreens: boolean[] = [];
        adapter.onFullscreenChange = (f) => fullscreens.push(f);

        div.dispatchEvent(new Event('fullscreenchange'));

        expect(fullscreens).toEqual([false]);
        adapter.destroy();
        element.remove();
      });

      it('tears the whole audio graph down when the owner signals destruction', async () => {
        const { adapter, element } = await readyAudio();

        destroy.next(true);

        expect(audioNodes).toContain('analyzer.disconnect');
        expect(audioNodes).toContain('source.disconnect');
        expect(audioNodes).toContain('context.close');
        expect(audioNodes).toContain('unobserve');
        adapter.destroy();
        element.remove();
      });

      it('ignores pip on audio, which has no video surface', async () => {
        const { adapter, element } = await readyAudio();
        const calls: string[] = [];
        (
          document as Document & { exitPictureInPicture: () => Promise<void> }
        ).exitPictureInPicture = () => {
          calls.push('exit');
          return Promise.resolve();
        };

        adapter.setPip(true);
        adapter.setPip(false);

        expect(calls).toEqual([]);
        adapter.destroy();
        element.remove();
      });
    });
  });
});
