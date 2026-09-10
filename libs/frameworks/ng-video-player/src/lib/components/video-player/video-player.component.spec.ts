import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ApiPlugin,
  ECapability,
  EPlayerState,
  IApiService,
  PlayerAdapter,
  PlayerOptions,
  PrepareHtmlOptions,
} from '@mintplayer/player-provider';
import { PlayerProgress } from '@mintplayer/player-progress';

import {
  VideoPlayerComponent,
  provideVideoApis,
} from './video-player.component';

interface FakeApi {
  service: IApiService;
  adapters: PlayerAdapter[];
  createPlayerCalls: PlayerOptions[];
  destroyed: number;
  loadedIds: string[];
  sizes: [number, number][];
  setStates: EPlayerState[];
  setVolumes: number[];
  setMutes: boolean[];
  setPips: boolean[];
  setFullscreens: boolean[];
}

/**
 * A platform whose adapter records everything the component asks of it, so the
 * tests can assert on the wrapper's behaviour without a real player SDK.
 */
function fakeApi(id = 'fake'): FakeApi {
  const state: FakeApi = {
    adapters: [],
    createPlayerCalls: [],
    destroyed: 0,
    loadedIds: [],
    sizes: [],
    setStates: [],
    setVolumes: [],
    setMutes: [],
    setPips: [],
    setFullscreens: [],
    service: undefined as unknown as IApiService,
  };

  state.service = <IApiService>{
    get id() {
      return id;
    },
    urlRegexes: [/https:\/\/fake\/(?<id>\w+)/],
    loadApi: () => Promise.resolve(),
    prepareHtml: (options: PrepareHtmlOptions) =>
      `<div id="${options.domId}"></div>`,
    createPlayer: (options: PlayerOptions) => {
      state.createPlayerCalls.push(options);
      const adapter = <PlayerAdapter>{
        get capabilities() {
          return [ECapability.volume, ECapability.mute];
        },
        loadVideoById: (videoId: string) => state.loadedIds.push(videoId),
        setPlayerState: (s: EPlayerState) => state.setStates.push(s),
        setMute: (m: boolean) => state.setMutes.push(m),
        setVolume: (v: number) => state.setVolumes.push(v),
        setProgress: () => undefined,
        setSize: (w: number, h: number) => state.sizes.push([w, h]),
        getTitle: () => Promise.resolve('the title'),
        setPip: (p: boolean) => state.setPips.push(p),
        getPip: () => Promise.resolve(false),
        setFullscreen: (f: boolean) => state.setFullscreens.push(f),
        getFullscreen: () => Promise.resolve(false),
        destroy: () => {
          state.destroyed++;
        },
        onStateChange: () => undefined,
        onMuteChange: () => undefined,
        onVolumeChange: () => undefined,
        onCurrentTimeChange: () => undefined,
        onDurationChange: () => undefined,
        onFullscreenChange: () => undefined,
        onPipChange: () => undefined,
      };
      state.adapters.push(adapter);
      return Promise.resolve(adapter);
    },
  };

  return state;
}

describe('VideoPlayerComponent', () => {
  let component: VideoPlayerComponent;
  let fixture: ComponentFixture<VideoPlayerComponent>;
  let api: FakeApi;

  /** Let the component's debounced pipelines and promise chains settle. */
  async function settle(ms = 50) {
    await jest.advanceTimersByTimeAsync(ms);
    await jest.advanceTimersByTimeAsync(ms);
  }

  async function build(...plugins: ApiPlugin[]) {
    await TestBed.configureTestingModule({
      imports: [VideoPlayerComponent],
      providers: [provideVideoApis(...plugins)],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    api = fakeApi();
  });

  afterEach(() => {
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('creates with no platforms registered', async () => {
    await build();

    expect(component).toBeTruthy();
  });

  it('renders the container the player is hosted in', async () => {
    await build();

    expect(component.container).toBeTruthy();
    expect(component.container.nativeElement.tagName).toBe('DIV');
  });

  it('reports the underlying player defaults', async () => {
    await build();

    expect(component.width).toBe(600);
    expect(component.height).toBe(450);
    expect(component.autoplay).toBe(true);
    expect(component.volume).toBe(0);
    expect(component.mute).toBe(false);
    expect(component.isPip).toBe(false);
    expect(component.isFullscreen).toBe(false);
    expect(component.url).toBe('');
  });

  it('hands the container to the player once the view is ready', async () => {
    await build(() => Promise.resolve(api.service));

    component.url = 'https://fake/abc';
    await settle();

    // A player with no host never builds anything, so this is the assertion
    // that ngAfterViewInit actually wired the two together.
    expect(api.createPlayerCalls).toHaveLength(1);
    expect(api.createPlayerCalls[0].element).toBe(
      component.container.nativeElement
    );
  });

  it('resolves its platform plugins before loading a url', async () => {
    const other = fakeApi('other');
    other.service.urlRegexes = [/https:\/\/other\/(?<id>\w+)/];
    await build(
      () => Promise.resolve(api.service),
      () => Promise.resolve(other.service)
    );

    component.url = 'https://other/def';
    await settle();

    expect(other.createPlayerCalls).toHaveLength(1);
    expect(api.createPlayerCalls).toHaveLength(0);
  });

  describe('inputs', () => {
    beforeEach(async () => {
      await build(() => Promise.resolve(api.service));
      component.url = 'https://fake/abc';
      await settle();
    });

    it('forwards url changes to the player', async () => {
      component.url = 'https://fake/def';
      await settle();

      expect(api.loadedIds).toEqual(['abc', 'def']);
    });

    it('accepts a null url through setUrl', async () => {
      component.setUrl(null);
      await settle();

      expect(api.destroyed).toBe(1);
      expect(component.url).toBe('');
    });

    it('forwards size to the player', () => {
      component.width = 800;
      component.height = 600;

      expect(component.width).toBe(800);
      expect(component.height).toBe(600);
      expect(api.sizes).toEqual([
        [800, 450],
        [800, 600],
      ]);
    });

    it('forwards volume and mute to the player', () => {
      component.volume = 55;
      component.mute = true;

      expect(component.volume).toBe(55);
      expect(component.mute).toBe(true);
      expect(api.setVolumes).toEqual([55]);
      expect(api.setMutes).toEqual([true]);
    });

    it('forwards player state to the player', () => {
      component.playerState = EPlayerState.playing;

      expect(api.setStates).toEqual([EPlayerState.playing]);
    });

    it('forwards autoplay to the player', () => {
      component.autoplay = false;

      expect(component.autoplay).toBe(false);
    });

    it('forwards fullscreen and pip requests', () => {
      component.isFullscreen = true;
      component.isPip = true;
      component.setIsPip(false);

      expect(api.setFullscreens).toEqual([true]);
      // setIsPip exists because Vimeo needs the call to originate from a user
      // gesture, but it goes through the same setter as the input.
      expect(api.setPips).toEqual([true, false]);
    });

    it('reads the title through the player', async () => {
      await expect(component.getTitle()).resolves.toBe('the title');
    });
  });

  describe('outputs', () => {
    beforeEach(async () => {
      await build(() => Promise.resolve(api.service));
      component.url = 'https://fake/abc';
      await settle();
    });

    it('emits capabilitiesChange when the player is created', () => {
      // Emitted during the settle above, before any handler could subscribe,
      // so this asserts on the capabilities the adapter advertised instead.
      expect(api.adapters[0].capabilities).toEqual([
        ECapability.volume,
        ECapability.mute,
      ]);
    });

    it('emits volumeChange when the platform reports a new volume', async () => {
      const seen: number[] = [];
      component.volumeChange.subscribe((v) => seen.push(v));

      api.adapters[0].onVolumeChange(30);
      await settle();

      expect(seen).toEqual([30]);
    });

    it('emits muteChange when the platform reports a new mute', async () => {
      const seen: boolean[] = [];
      component.muteChange.subscribe((m) => seen.push(m));

      api.adapters[0].onMuteChange(true);
      await settle();

      expect(seen).toEqual([true]);
    });

    it('emits playerStateChange when the platform reports playback', async () => {
      const seen: EPlayerState[] = [];
      component.playerStateChange.subscribe((s) => seen.push(s));

      api.adapters[0].onStateChange(EPlayerState.playing);
      await settle();

      expect(seen).toEqual([EPlayerState.playing]);
    });

    it('emits isPipChange and isFullscreenChange', async () => {
      const pips: boolean[] = [];
      const fullscreens: boolean[] = [];
      component.isPipChange.subscribe((p) => pips.push(p));
      component.isFullscreenChange.subscribe((f) => fullscreens.push(f));

      api.adapters[0].onPipChange(true);
      api.adapters[0].onFullscreenChange(true);
      await settle();

      expect(pips).toEqual([true]);
      expect(fullscreens).toEqual([true]);
    });

    it('emits progressChange once both time and duration are known', async () => {
      const seen: PlayerProgress[] = [];
      component.progressChange.subscribe((p) => seen.push(p));

      api.adapters[0].onCurrentTimeChange(12);
      await settle();
      expect(seen).toEqual([]);

      api.adapters[0].onDurationChange(300);
      await settle();

      expect(seen).toEqual([{ currentTime: 12, duration: 300 }]);
    });
  });

  it('destroys the player when the component goes away', async () => {
    await build(() => Promise.resolve(api.service));
    component.url = 'https://fake/abc';
    await settle();

    fixture.destroy();

    expect(api.destroyed).toBe(1);
  });

  it('stops emitting after the component is destroyed', async () => {
    await build(() => Promise.resolve(api.service));
    component.url = 'https://fake/abc';
    await settle();
    const seen: number[] = [];
    component.volumeChange.subscribe((v) => seen.push(v));

    fixture.destroy();
    api.adapters[0].onVolumeChange(99);
    await settle();

    expect(seen).toEqual([]);
  });
});

describe('provideVideoApis', () => {
  it('provides the resolved platform list as a promise', async () => {
    const api = fakeApi();
    const provider = provideVideoApis(() => Promise.resolve(api.service));

    await expect(
      (provider as { useFactory: () => Promise<IApiService[]> }).useFactory()
    ).resolves.toEqual([api.service]);
  });

  it('provides an empty list when no platforms are registered', async () => {
    const provider = provideVideoApis();

    await expect(
      (provider as { useFactory: () => Promise<IApiService[]> }).useFactory()
    ).resolves.toEqual([]);
  });
});
