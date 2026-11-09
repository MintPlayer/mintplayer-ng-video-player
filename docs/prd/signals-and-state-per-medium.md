# PRD: Signal-based Angular player, and player state reset per medium

Issues: [#100](https://github.com/MintPlayer/mintplayer-ng-video-player/issues/100) (Angular `VideoPlayerComponent`
on signals, without echoing reported state back) and
[#107](https://github.com/MintPlayer/mintplayer-ng-video-player/issues/107) (`playerStateChange` drops `playing` for
the next medium).
Found on: MintPlayer/MintPlayer.Spark#608 (mintplayer.com queue).

Both issues are about the same signal: the player state a consumer follows. #107 makes the core report it correctly
per medium. #100 makes the Angular wrapper pass it on without writing it back. They ship together, because #100's
playlist test (`ended` → next medium) depends on the state #107 emits for the next medium.

## 1. Problem

1. **#107.** `VideoPlayer` pipes the adapters' states through `debounceTime(20)` + `distinctUntilChanged()`
   (`libs/video-player/src/lib/video-player.ts:98-100`). That memory spans media. Medium A ends in `playing`, medium B
   reports `playing`, and the event is dropped. Only YouTube and Vimeo report `unstarted` on a load, so every other
   platform hits this after a playing medium.
2. **#100.** `[(playerState)]` writes every reported state back into the `playerState` setter, which calls
   `adapter.setPlayerState`. For YouTube, `ended` means `stopVideo()`. In a playlist, the `ended` handler loads the next
   medium and the echo then stops it. The same echo exists for `volume` / `mute`: writing a reported volume back opens
   the 2 s settle window (#105), which then reverts a listener who keeps dragging the platform's slider.

## 2. Current state (investigated 2026-11-09)

### 2.1 Core `VideoPlayer`

| What | Where |
|---|---|
| Adapter state reports feed `playerStateObserver$` (only place) | :58 |
| `debounceTime(20)` + `distinctUntilChanged()` → `stateChange` | :98-100 |
| Reused adapter: `loadAndApplySettings` | :39-40, :276-282 |
| New adapter: `destroy` old, `setHtml`, `createPlayer`, then load | :41-77 |
| pip / fullscreen re-seeded to `false` per new adapter; state is not | :75-76 |
| `set playerState` → `adapter.setPlayerState`, unguarded | :214-216 |

### 2.2 Adapters: state on load, `setPlayerState` side effects

| Platform | `unstarted` before `playing` on a load? | Reused? | `setPlayerState` beyond play / pause |
|---|---|---|---|
| youtube | yes (native UNSTARTED) | yes | **`ended` → `stopVideo()`** |
| vimeo | yes (`loaded`) | yes | none |
| soundcloud, dailymotion, mixcloud, twitch, spotify | **no** | yes | none |
| wistia, facebook, file, streamable, vidyard | no (first report is `playing`) | no (new adapter each time) | none |

`EPlayerState` (`libs/player-provider/src/index.ts:75-80`): `unstarted=1, playing=2, paused=3, ended=4`.

### 2.3 Angular `VideoPlayerComponent`

- `@Input()` setters write straight into the core player: `width`, `height`, `playerState`, `volume`, `mute`,
  `isFullscreen`, `isPip`, `autoplay`, `url`. The getters read back from the core.
- `@Output()` `EventEmitter`s, re-emitted through `NgZone.run`.
- `BehaviorSubject`s `url$`, `player$`, `apis$`, `isViewReady$`; `@ViewChild('container')`; constructor `@Inject`.
- Public methods: `setUrl`, `setIsPip`, `getTitle`.
- Spec: jest + jest-preset-angular, TestBed, a fake `IApiService`; assigns inputs directly. 23 tests.
- The angular-demo runs zone.js (`provideZoneChangeDetection`). Angular `~22.2.0`.
- Demos: `video-demo` binds `[(playerState)]`, `[(volume)]`, `[(mute)]`, `[(isPip)]`, `[(isFullscreen)]`.
  `playlist-demo` uses `@ViewChild` + `setUrl`, and `zone.run` in its `(playerStateChange)` handler.

### 2.4 Versioning

The versioning action (MintPlayer.Spark `docs/coverage_package_versioning_PRD.md`, D7/D8) takes an Angular library's
major from the resolved `@angular/core`, and gives **any** API change a **minor**, breaking or not. So the signal
migration ships as `22.x` minor with no version file and no `package.json` edit. `video-player` also gets a minor or
patch from its own diff.

## 3. Goals

- G1. Each new medium starts a fresh state sequence: its first `playing` (or any state) is reported, whatever the
  previous medium's last state was.
- G2. A value the player reported is never written back into the player through a two-way binding. Only values the
  consumer sets reach it.
- G3. `VideoPlayerComponent` uses `input()` / `model()` / `output()` / `viewChild` / `inject` and works without
  zone.js.
- G4. Templates keep compiling: same binding names.

## 4. Requirements

### #107: core

- **F1. Reset per medium.** When `VideoPlayer` starts loading a new medium (a new `videoRequest`, on a reused or a new
  adapter), it emits `unstarted` as `stateChange` right away, unless the last emitted state already is `unstarted`, and
  makes that the dedupe's memory. The adapter's own `unstarted` (YouTube, Vimeo) is then deduped. The dedupe memory is
  an explicit field, not `distinctUntilChanged`, so it can be reset. The emit bypasses the debounce (S3). Each report
  carries the medium generation it was made in, and a report from an older medium is dropped.
- **F2. Spec.** A `playing` → load B on the same adapter → B `playing` → `stateChange` emits `unstarted`, `playing`.
  The same across two platforms. YouTube-like adapter reporting its own `unstarted` → emitted once.

### #100: Angular component

- **F3. Signal API.**
  - `model()`: `playerState`, `volume`, `mute`, `isFullscreen`, `isPip`. Their `…Change` outputs come from `model()`.
  - `input()`: `width`, `height`, `autoplay`, `url`. Only defined values are forwarded, so the core defaults
    (600 × 450, autoplay on) still apply when unbound.
  - `output()`: `progressChange`, `capabilitiesChange`.
  - `viewChild.required('container')`, `inject(VIDEO_APIS)`, `afterNextRender` to hand the host to the core player.
  - `setUrl(url)` stays and overrides the bound `url` until the input changes again (`linkedSignal`).
  - `setIsPip` and `getTitle` stay.
- **F4. No echo.** Per model pair, the component remembers the last value the player reported. A report sets the
  remembered value, then the model. The effect that forwards the model to the core skips a value equal to the
  remembered one, and `undefined`. So `ended` reported, then the consumer loading the next medium, never calls
  `setPlayerState(ended)`.
- **F5. No NgZone.** Reports call `model.set` / `output.emit` directly. S2 confirms that a zone app and a zoneless app
  both refresh the consumer's view when a report arrives outside the Angular zone.
- **F6. Demos.** `playlist-demo` binds `[(playerState)]` (a signal), advances on `ended` through an effect, and gets
  Play / Pause buttons that set the state. No `zone.run`, `NgZone` or `ChangeDetectorRef`. It keeps `setUrl` through
  `viewChild` (D7). `video-demo` stays unchanged, as the compatibility check for existing templates.
- **F7. Specs.** Rewrite the component spec to `fixture.componentRef.setInput` and a host component for two-way
  bindings. New: the playlist test (`ended` reported, host loads the next url, `setStates` never contains `ended`);
  reported volume isn't written back; a consumer-set value is forwarded.

## 5. Spikes

Small jest tests in `ng-video-player` and `video-player`, deleted or turned into specs afterwards.

- **S1. Model echo.** In a host with `[(playerState)]`, the component sets its model from a report. Does the
  component's forwarding effect run for it? Does the host's write-back reach the input as a new value? (Decides
  whether F4's guard is required, or whether signal equality already covers it.)
- **S2. Change detection without `NgZone.run`.** A report that arrives in `runOutsideAngular` sets the model. Does a
  host template that interpolates the two-way bound value update under `provideZoneChangeDetection` (with
  `autoDetectChanges`) and under `provideZonelessChangeDetection`? Same for a plain `(event)` handler that mutates a
  plain field.
- **S3. Reset versus debounce.** If F1 pushes `unstarted` into the debounced stream and B reports `playing` within
  20 ms, is `unstarted` swallowed and `playing` dropped again? (Decides whether F1 emits directly or through the
  stream.)

### Findings

Run 2026-11-09 as throwaway jest specs (Angular 22.2, jest-preset-angular, fake timers for S3).

| Spike | Observed | Consequence |
|---|---|---|
| S1 | The child's forwarding `effect` runs for a value the child set itself from a report (`forwarded: ["playing"]`). The host's two-way write-back carries the same value, so it adds no second run. | F4's guard is required; signal equality alone doesn't stop the echo. |
| S2 | A report from `runOutsideAngular` + `setTimeout` updates both the host's signal binding and a plain field set in its `(event)` handler, under `provideZoneChangeDetection` and under `provideZonelessChangeDetection`. | Drop `NgZone.run` (F5). Model writes and listener calls notify the scheduler in both modes. |
| S3 | `playing` → push `unstarted` → `playing` 5 ms later emits only `["playing"]` in total: the debounce swallows `unstarted`, and the dedupe then drops B's `playing`. With 1 s between them: `["playing","unstarted","playing"]`. | F1 emits `unstarted` directly (not through the debounce) and resets the dedupe memory. A medium generation counter drops A's reports still in the 20 ms debounce when B starts. |

## 6. Decisions

- D1. The reset lives in the core `VideoPlayer`, not in each adapter. It is the only layer that knows a medium
  changed, and it covers every platform. The SoundCloud adapter is not changed (the issue's optional step).
- D2. One PR for both issues (user's request). #107 lands first in the milestones because #100's playlist test relies
  on it.
- D3. `model()` semantics: `…Change` fires when the bound value changes. A report equal to the model's current value
  (e.g. the consumer set `paused`, then the player reports `paused`) emits nothing. Accepted: the consumer already has
  that value.
- D4. Reading the component programmatically changes from properties to signals (`player.volume` →
  `player.volume()`), and the `…$` subjects and `container` become private or signal-based. Per §2.4 this is a minor
  bump, which the issue asks for. The PR description calls it out.
- D5. React and Vue wrappers are out of scope (#100 is Angular-only). If they echo `playerState` too, file an issue.
- D6. Model types (found by building the unchanged `video-demo`). With `model<EPlayerState>()` the output type
  becomes `EPlayerState | undefined`. `(playerStateChange)="handler($event)"` with a handler typed `EPlayerState` then
  fails `strictTemplates`; two-way `[(x)]="field"` bindings compile either way. So `playerState`, `isPip` and
  `isFullscreen` default to `unstarted` / `false` / `false`. A model's default counts as already reported, so it is
  never forwarded. `volume` and `mute` stay `T | undefined`, because #105 needs "unset" (D2 there: adopt the first
  report). A handler typed `number` / `boolean` on `(volumeChange)` / `(muteChange)` needs a `$event!` or a wider
  parameter. The PR calls this out.
- D7. `setUrl(sameUrl)` replayed the medium before. The `currentUrl` `linkedSignal` uses `equal: () => false` to
  keep that. The `playlist-demo` keeps `setUrl` for the same reason (repeat one), and binds `[(playerState)]` for the
  commands.

## 7. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Spikes S1-S3, findings in §5 | Findings recorded |
| M1 | Core reset per medium (F1, F2) | Type-checks |
| M2 | Component on signals, no echo, no zone (F3-F5) + spec rewrite (F7) | Type-checks |
| M3 | Demos (F6), README | Type-checks / builds |
| M4 | Tests for `video-player`, `ng-video-player`, `angular-demo` build, once | Green |

## 8. Acceptance

| Criterion | Unit-tested | In a running app |
|---|---|---|
| Playing medium, then a SoundCloud (no-`unstarted`) medium: `playerStateChange` emits `playing` for it | ✓ (`VideoPlayer` per-medium specs: reused adapter, other platform, within the debounce) | pending |
| Two-way bound `playerState` in a playlist: `ended` → next video does not stop it | ✓ (host-component spec: `setStates` stays empty) | pending |
| Templates using `[(playerState)]`, `[(volume)]`, … compile unchanged | ✓ (`video-demo` builds unchanged under `strictTemplates`) | – |
| Component works in a zoneless host | ✓ (zoneless host spec; spike S2) | – |

## 9. Status

- [x] M0 · [x] M1 · [x] M2 · [x] M3 · [x] M4 (2026-11-09: `video-player` 58 and `ng-video-player` 33 tests green;
  `angular-demo` builds)
- Open: the §8 checks in a running demo app (YouTube → SoundCloud via Next; playlist auto-advance).
