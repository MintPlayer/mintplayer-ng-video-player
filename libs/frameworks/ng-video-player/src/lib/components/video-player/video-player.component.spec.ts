import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
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

/** A consumer that two-way binds the state, as a playlist does. */
@Component({
  selector: 'test-host',
  imports: [VideoPlayerComponent],
  template: `<video-player [url]="url()" [(playerState)]="playerState" [(volume)]="volume"
    (playerStateChange)="onStateChange($event)" />
    <span id="state">{{ playerState() }}</span>`,
})
class HostComponent {
  url = signal<string | null>('https://fake/abc');
  playerState = signal(EPlayerState.unstarted);
  volume = signal<number | undefined>(undefined);
  next = 'https://fake/def';

  onStateChange(state: EPlayerState) {
    // A playlist advances on `ended`.
    if (state === EPlayerState.ended) {
      this.url.set(this.next);
    }
  }
}

describe('VideoPlayerComponent', () => {
  let component: VideoPlayerComponent;
  let fixture: ComponentFixture<VideoPlayerComponent>;
  let api: FakeApi;

  /** Let the component's effects, debounced pipelines and promise chains settle. */
  async function settle(f: ComponentFixture<unknown> = fixture, ms = 50) {
    f.detectChanges();
    await jest.advanceTimersByTimeAsync(ms);
    f.detectChanges();
    await jest.advanceTimersByTimeAsync(ms);
    f.detectChanges();
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

  function setInput(name: string, value: unknown) {
    fixture.componentRef.setInput(name, value);
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

    expect(component.container().nativeElement.tagName).toBe('DIV');
  });

  it('starts unstarted, and leaves volume and mute unset until the consumer or the player sets them', async () => {
    await build();

    expect(component.playerState()).toBe(EPlayerState.unstarted);
    expect(component.isPip()).toBe(false);
    expect(component.isFullscreen()).toBe(false);
    expect(component.volume()).toBeUndefined();
    expect(component.mute()).toBeUndefined();
  });

  it('does not forward its defaults to the player', async () => {
    await build(() => Promise.resolve(api.service));

    setInput('url', 'https://fake/abc');
    await settle();

    expect(api.setStates).toEqual([]);
    expect(api.setPips).toEqual([]);
    expect(api.setFullscreens).toEqual([]);
    expect(api.setVolumes).toEqual([]);
    expect(api.setMutes).toEqual([]);
  });

  it('hands the container to the player once the view is ready', async () => {
    await build(() => Promise.resolve(api.service));

    setInput('url', 'https://fake/abc');
    await settle();

    // A player with no host never builds anything, so this is the assertion
    // that the component actually wired the two together.
    expect(api.createPlayerCalls).toHaveLength(1);
    expect(api.createPlayerCalls[0].element).toBe(
      component.container().nativeElement
    );
  });

  it('keeps the player defaults for unbound size and autoplay', async () => {
    await build(() => Promise.resolve(api.service));

    setInput('url', 'https://fake/abc');
    await settle();

    expect(api.createPlayerCalls[0]).toMatchObject({ width: 600, height: 450, autoplay: true });
  });

  it('forwards autoplay to the player before it loads', async () => {
    await build(() => Promise.resolve(api.service));

    setInput('autoplay', false);
    setInput('url', 'https://fake/abc');
    await settle();

    expect(api.createPlayerCalls[0].autoplay).toBe(false);
  });

  it('resolves its platform plugins before loading a url', async () => {
    const other = fakeApi('other');
    other.service.urlRegexes = [/https:\/\/other\/(?<id>\w+)/];
    await build(
      () => Promise.resolve(api.service),
      () => Promise.resolve(other.service)
    );

    setInput('url', 'https://other/def');
    await settle();

    expect(other.createPlayerCalls).toHaveLength(1);
    expect(api.createPlayerCalls).toHaveLength(0);
  });

  describe('inputs', () => {
    beforeEach(async () => {
      await build(() => Promise.resolve(api.service));
      setInput('url', 'https://fake/abc');
      await settle();
    });

    it('forwards url changes to the player', async () => {
      setInput('url', 'https://fake/def');
      await settle();

      expect(api.loadedIds).toEqual(['abc', 'def']);
    });

    it('accepts a null url through setUrl', async () => {
      component.setUrl(null);
      await settle();

      expect(api.destroyed).toBe(1);
    });

    it('lets a change of the bound url take over from setUrl', async () => {
      component.setUrl('https://fake/def');
      await settle();
      setInput('url', 'https://fake/ghi');
      await settle();

      expect(api.loadedIds).toEqual(['abc', 'def', 'ghi']);
    });

    it('forwards size to the player', async () => {
      setInput('width', 800);
      await settle();
      setInput('height', 600);
      await settle();

      expect(api.sizes).toEqual([
        [800, 450],
        [800, 600],
      ]);
    });

    it('forwards volume and mute to the player', async () => {
      component.volume.set(55);
      component.mute.set(true);
      await settle();

      expect(api.setVolumes).toContain(55);
      expect(api.setMutes).toContain(true);
    });

    it('forwards player state to the player', async () => {
      component.playerState.set(EPlayerState.playing);
      await settle();

      expect(api.setStates).toEqual([EPlayerState.playing]);
    });

    it('forwards fullscreen and pip requests', async () => {
      component.isFullscreen.set(true);
      component.isPip.set(true);
      await settle();
      // setIsPip exists because Vimeo needs the call to originate from a user
      // gesture: it reaches the player synchronously.
      component.setIsPip(false);

      expect(api.setFullscreens).toEqual([true]);
      expect(api.setPips).toEqual([true, false]);
    });

    it('reads the title through the player', async () => {
      await expect(component.getTitle()).resolves.toBe('the title');
    });
  });

  describe('outputs', () => {
    beforeEach(async () => {
      await build(() => Promise.resolve(api.service));
      setInput('url', 'https://fake/abc');
      await settle();
    });

    it('emits capabilitiesChange when the player is created', async () => {
      const seen: ECapability[][] = [];
      component.capabilitiesChange.subscribe((c) => seen.push(c));

      setInput('url', null);
      await settle();
      setInput('url', 'https://fake/def');
      await settle();

      expect(seen).toEqual([[ECapability.volume, ECapability.mute]]);
    });

    it('emits volumeChange when the platform reports a new volume', async () => {
      const seen: (number | undefined)[] = [];
      component.volume.subscribe((v) => seen.push(v));

      api.adapters[0].onVolumeChange(30);
      await settle();

      expect(seen).toEqual([30]);
      expect(component.volume()).toBe(30);
    });

    it('emits muteChange when the platform reports a new mute', async () => {
      const seen: (boolean | undefined)[] = [];
      component.mute.subscribe((m) => seen.push(m));

      api.adapters[0].onMuteChange(true);
      await settle();

      expect(seen).toEqual([true]);
    });

    it('emits playerStateChange when the platform reports playback', async () => {
      const seen: EPlayerState[] = [];
      component.playerState.subscribe((s) => seen.push(s));

      api.adapters[0].onStateChange(EPlayerState.playing);
      await settle();

      expect(seen).toEqual([EPlayerState.playing]);
    });

    it('emits isPipChange and isFullscreenChange', async () => {
      const pips: boolean[] = [];
      const fullscreens: boolean[] = [];
      component.isPip.subscribe((p) => pips.push(p));
      component.isFullscreen.subscribe((f) => fullscreens.push(f));

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

  describe('reported values are not written back (#100)', () => {
    beforeEach(async () => {
      await build(() => Promise.resolve(api.service));
      setInput('url', 'https://fake/abc');
      await settle();
    });

    it('does not forward a state the player reported', async () => {
      api.adapters[0].onStateChange(EPlayerState.playing);
      await settle();
      api.adapters[0].onStateChange(EPlayerState.ended);
      await settle();

      expect(component.playerState()).toBe(EPlayerState.ended);
      expect(api.setStates).toEqual([]);
    });

    it('does not forward a volume or mute the player reported', async () => {
      api.adapters[0].onVolumeChange(30);
      api.adapters[0].onMuteChange(true);
      await settle();

      expect(api.setVolumes).toEqual([]);
      expect(api.setMutes).toEqual([]);
    });

    it('forwards the consumer setting the reported value again after another one', async () => {
      api.adapters[0].onStateChange(EPlayerState.playing);
      await settle();

      component.playerState.set(EPlayerState.paused);
      await settle();
      // The player hasn't reported `paused` yet; the consumer changes their mind.
      component.playerState.set(EPlayerState.playing);
      await settle();

      expect(api.setStates).toEqual([EPlayerState.paused, EPlayerState.playing]);
    });
  });

  it('destroys the player when the component goes away', async () => {
    await build(() => Promise.resolve(api.service));
    setInput('url', 'https://fake/abc');
    await settle();

    fixture.destroy();

    expect(api.destroyed).toBe(1);
  });

  it('stops emitting after the component is destroyed', async () => {
    await build(() => Promise.resolve(api.service));
    setInput('url', 'https://fake/abc');
    await settle();
    const seen: (number | undefined)[] = [];
    component.volume.subscribe((v) => seen.push(v));

    fixture.destroy();
    api.adapters[0].onVolumeChange(99);
    await jest.advanceTimersByTimeAsync(100);

    expect(seen).toEqual([]);
  });
});

describe('VideoPlayerComponent in a two-way bound host', () => {
  let api: FakeApi;

  async function settle(fixture: ComponentFixture<unknown>, ms = 50) {
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  async function buildHost(zoneless = false) {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideVideoApis(() => Promise.resolve(api.service)),
        ...(zoneless ? [provideZonelessChangeDetection()] : []),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    return fixture;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    api = fakeApi();
  });

  afterEach(() => {
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('does not stop the next video of a playlist when the previous one ended', async () => {
    const fixture = await buildHost();
    const adapter = api.adapters[0];
    adapter.onStateChange(EPlayerState.playing);
    await settle(fixture);

    adapter.onStateChange(EPlayerState.ended);
    await settle(fixture);
    // The host advanced to the next video on `ended`; it starts playing.
    adapter.onStateChange(EPlayerState.playing);
    await settle(fixture);

    expect(api.loadedIds).toEqual(['abc', 'def']);
    expect(api.setStates).not.toContain(EPlayerState.ended);
    expect(api.setStates).toEqual([]);
    expect(fixture.componentInstance.playerState()).toBe(EPlayerState.playing);
  });

  it('forwards a state the host sets', async () => {
    const fixture = await buildHost();
    api.adapters[0].onStateChange(EPlayerState.playing);
    await settle(fixture);

    fixture.componentInstance.playerState.set(EPlayerState.paused);
    await settle(fixture);

    expect(api.setStates).toEqual([EPlayerState.paused]);
  });

  it('does not write a reported volume back through the host', async () => {
    const fixture = await buildHost();

    api.adapters[0].onVolumeChange(40);
    await settle(fixture);

    expect(fixture.componentInstance.volume()).toBe(40);
    expect(api.setVolumes).toEqual([]);
  });

  it('updates a zoneless host when the player reports', async () => {
    const fixture = await buildHost(true);

    api.adapters[0].onStateChange(EPlayerState.playing);
    await jest.advanceTimersByTimeAsync(100);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#state').textContent).toBe(String(EPlayerState.playing));
  });
});

describe('provideVideoApis', () => {
  it('provides the resolved platform list as a promise', async () => {
    const api = fakeApi();
    const provider = provideVideoApis(() => Promise.resolve(api.service));

    await expect(
      (provider as unknown as { useFactory: () => Promise<IApiService[]> }).useFactory()
    ).resolves.toEqual([api.service]);
  });

  it('provides an empty list when no platforms are registered', async () => {
    const provider = provideVideoApis();

    await expect(
      (provider as unknown as { useFactory: () => Promise<IApiService[]> }).useFactory()
    ).resolves.toEqual([]);
  });
});
