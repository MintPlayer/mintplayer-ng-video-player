# PRD: Keep the listener's volume and mute across media

Issue: [#105](https://github.com/MintPlayer/mintplayer-ng-video-player/issues/105)
Found on: MintPlayer/MintPlayer.Spark#608 (queue sidebar with a volume slider and a mute button)

## 1. Problem

A consumer that binds `[(volume)]` and `[(mute)]` on `<video-player>` loses the listener's choice
whenever the next medium needs another platform. Mute, play a YouTube video, then a Vimeo one: the
Vimeo video starts unmuted. Chrome then pauses it, because it autoplayed and is no longer muted.

There are two causes:

1. `VideoPlayer` doesn't own volume and mute. It forwards them only to the adapter that exists at that
   moment. A new adapter starts at the platform's default. The adapter's first reports then overwrite
   `_volume` / `_mute` and go out as `volumeChange` / `muteChange`, so a two-way binding writes the
   platform default back into the app.
2. Some adapters let `setVolume` clear the mute. Vimeo's SDK unmutes on `setVolume`. SoundCloud
   emulates mute with volume 0 and has no guard.

## 2. Current state (investigated 2026-11-09)

### 2.1 `VideoPlayer` (`libs/video-player/src/lib/video-player.ts`)

| What | Where | Effect |
|---|---|---|
| `set volume` / `set mute` forward only to `playerInfo?.adapter` | :232-245 | A value set before an adapter exists is stored but never applied |
| New adapter: callbacks wired, `capabilitiesChange` fired, `loadVideoById` | :51-72 | No volume/mute applied |
| Reused adapter: `loadVideoById` only | :39-40 | Nothing re-applied after the load |
| Reports: `debounceTime(20)` + `distinctUntilChanged` → `_volume = …` / `_mute = …` + event | :89-94 | Every platform report replaces the listener's choice |
| Setters call `setVolume` / `setMute` without checking capabilities | :234, :244 | Spotify, Mixcloud and Vidyard throw out of the setter |

### 2.2 Adapters

| Platform | Caps vol / mute | `setVolume` | `setMute` | Reporting | Reuse (`loadVideoById`) |
|---|---|---|---|---|---|
| dailymotion | ✓ / ✓ | `setVolume(v/100)` | `setMuted` | 50 ms mute poll + `volumechange` | `player.load` |
| facebook | ✓ / ✓ | `setVolume(v/100)`, skipped during a 20 ms guard | `mute()`/`unmute()` | 50 ms poll | no-op |
| file | ✓ / ✓ | `el.volume` | `el.muted` | `volumechange` + one report after 20 ms | no-op |
| mixcloud | ✓ / – | `setVolume(v/100)` | **throws** | 50 ms poll | `player.load` |
| soundcloud | ✓ / – (mute works) | `setVolume(v)`, **unmutes when muted** | emulated with volume 0 | 50 ms poll; reports volume 0 while muted | `player.load` |
| spotify | – / – | **throws** | **throws** | none | `loadUri` |
| streamable | ✓ / ✓ | `setVolume(v)` | `mute()`/`unmute()` | 50 ms poll | **throws** |
| twitch | ✓ / ✓ | `setVolume(v/100)` | `setMuted` | 50 ms poll | `setVideo`/… |
| vidyard | ✓ / – | `setVolume(v/100)` | **throws** | `volumeChange` event | **throws** |
| vimeo | ✓ / ✓ | `setVolume(v/100)`, **unmutes** | `setMuted` | 50 ms mute poll (a new one per `loaded`, never stopped), `volumechange` | `loadVideo` |
| wistia | ✓ / ✓ | `volume(v/100)` | `mute()`/`unmute()` | `volumechange` / `mutechange` | `addToPlaylist` |
| youtube | ✓ / ✓ | `setVolume(v)` | `mute()`/`unMute()` | 50 ms poll | `loadVideoById` |

Every programmatic change echoes back through a poll or event within about 50 ms. Polls report on
every tick.

### 2.3 Framework wrappers and demos

| Wrapper | Behaviour | Demo |
|---|---|---|
| Angular `VideoPlayerComponent` | `@Input` setters forward to `VideoPlayer`; outputs from its events | `volume = 0` bound two-way |
| React `RVideoPlayer` | `volumeState` / `muteState` are required and always pushed by an effect | `useState(0)` |
| Vue `VueVideoPlayer` | props **default to `volume: 0, mute: false`** and are always pushed in `onMounted` | `volume = 50` |

Today an initial `volume = 0` is harmless only because it is lost (no adapter yet) and the platform's
default then overwrites it. Once `VideoPlayer` keeps the value, an initial 0 means silence. The demos
and the Vue defaults must change with it (F5).

## 3. Goals

- G1. The listener's volume and mute survive every change of medium, on the same platform or another.
- G2. A platform's report replaces them only when the listener changed them in that platform's own UI.
- G3. `setVolume` never clears the mute, on any adapter that has both.
- G4. Setting volume or mute never throws, whatever the platform.

## 4. Requirements

- **F1. Desired state.** `VideoPlayer` holds `{ volume?, mute? }`. It is undefined until the consumer
  sets it or a platform reports it. The `volume` / `mute` getters keep returning `0` / `false` while
  unset.
- **F2. Apply to every adapter.** Right after each `loadVideoById`, on a new adapter (its first load)
  or a reused one, `VideoPlayer` applies the defined settings. It also does this when the load throws,
  since Streamable and Vidyard throw on a reload. Mute goes first when it is `true`, so the medium never
  starts audible. Platform resets that arrive later, when the load completes, are caught by F4 and by
  the adapter itself (F6, Vimeo).
- **F3. Capability filter.** `VideoPlayer` calls `setVolume` only when the adapter lists
  `ECapability.volume`, and `setMute` only when it lists `ECapability.mute`.
- **F4. Settle window.** The window (`VideoPlayer.SETTLE_MS` = 2000 ms, sized by S3) opens on each F2
  apply and on each consumer `volume` / `mute` set that reaches an adapter. A report in that window
  that contradicts the desired state is taken as the platform's default or reset, not as a listener
  action. `VideoPlayer` re-applies instead of adopting it, and emits no event. Re-applies are throttled
  to one per 250 ms and do not extend the window, so a platform that refuses can't loop. Outside the
  window, a contradicting report is a listener action in the platform's UI. It becomes the desired
  state and goes out as an event. A report that matches the desired state emits nothing (volume within
  ±0.5, which absorbs Vimeo's `0.3 * 100` float). Reports that aren't a finite number or a boolean are
  dropped. While the desired state is unset, any valid report is adopted (D2).
- **F5. Wrappers and demos.** Vue's `volume` / `mute` props default to `undefined` and are only pushed
  when defined. Demos start at volume 50, unmuted.
- **F6. Adapters keep mute on `setVolume`.**
  - Vimeo: the adapter tracks volume and mute. It updates them from `setVolume` / `setMute`, the
    `volumechange` event, and the mute poll (except within 150 ms of its own `setMuted`, so a stale read
    can't override it). `setVolume(v).then(() => muted && setMuted(true))`. `loadVideoById` snapshots
    both and restores them once `loadVideo` resolves, because loading resets them (S1). One mute poll per
    adapter, not one per `loaded`. `Vimeo.Player.setVolume` / `setMuted` are typed as returning promises.
  - SoundCloud: while muted, `setVolume` stores the volume and applies it on unmute. Advertise
    `ECapability.mute`. While muted, report the remembered volume, not 0. The poll follows the widget's own
    slider (0 means muted, more than 0 means unmuted), except within 150 ms of our own `setMute`.
  - The others: no change. YouTube, Wistia and Twitch keep the mute on `setVolume` (S2). Wistia's mute loss
    on a new item, and the unmeasured Dailymotion and Facebook, are left to F4.
- **F7. Specs.** Per affected adapter: mute, set a volume, expect it to stay muted. `VideoPlayer`:
  switch platform → the new adapter receives the stored settings; a contradicting report in the window
  is not adopted; one after it is; a missing capability skips the call.

## 5. Spikes

Run on a plain page that loads each platform's SDK directly (Playwright, Chromium), so the result
describes the platform, not our adapter.

- **S1. Vimeo.** Does `setVolume` unmute? Does `setVolume(v).then(() => setMuted(true))` stay muted? Does
  `loadVideo` reset volume or mute, and how long after the call?
- **S2. YouTube, Dailymotion, Twitch, Wistia.** Does `setVolume` while muted unmute? Does loading another
  item reset volume or mute?
- **S3. Timing.** How long after creating a player, or loading an item, does a platform still report its
  own default or reset value? Sizes `SETTLE_MS`.

### Findings

Run 2026-11-09 against a plain page loading each SDK (Chromium via Playwright). Values are `volume/muted`
read back through the SDK.

| Step | Vimeo | YouTube | Wistia | Twitch (live channel) |
|---|---|---|---|---|
| Default after create | 100/false | 100/false | 100/false | 50/false |
| `mute`, then `setVolume(40)` | **40/false (unmuted)** | 40/true | 40/true | 50/true (volume not applied while offline) |
| `setVolume(55); setMuted(true)` without awaiting | 55/true | 55/true | 55/true | 50/true |
| `setVolume(65).then(() => setMuted(true))` | 65/true | 65/true | 65/true | 50/true |
| Load the next item with 30/true set | **100/false (reset)**, as soon as `loadVideo` resolves | brief `undefined/undefined`, then 30/true after 100 ms | brief `0/null`, then **30/false (mute lost)** after 500 ms (`replaceWith`) | not measured (VOD expired) |

- **S1.** Vimeo's `setVolume` unmutes, confirmed. Chaining `setMuted(true)` after the promise keeps it
  muted. Without chaining it held in this run, but the issue measured it failing through the adapter, so
  F6 chains it. `loadVideo` resets **both** volume and mute. That happens when the load resolves, which is
  later than `loadVideoById` returns. So the Vimeo adapter re-applies its own settings after
  `loadVideo` resolves, and the `VideoPlayer` settle window covers it too.
- **S2.** YouTube, Wistia and Twitch keep the mute on `setVolume`. Wistia can lose the mute when it moves
  to another item. Dailymotion and Facebook were not measured. They are covered by the settle window.
- **S3.** Platforms report transient junk while loading (`undefined`, `null`, `0`) for up to about
  500 ms, and Vimeo's reset arrives only after the load resolves. `SETTLE_MS = 2000` after the most
  recent apply. Reports that aren't a finite number or a boolean are dropped.

## 6. Decisions

- D1. The settle window lives in `VideoPlayer`, not in each adapter. It is the only layer that knows the
  desired state, and it also covers platforms we cannot measure (Facebook, Streamable).
- D2. An unset desired state adopts the first report. A consumer that never binds volume gets the first
  platform's volume carried to the next platform, instead of each platform's own default.
- D3. A listener action in the platform's UI inside the settle window is reverted. Accepted: the window
  is short and only opens when a medium loads or the consumer sets a value.
- D4. The public API changes only by additions: `VideoPlayer.SETTLE_MS` (a public static, also used by
  the specs), the Vue props `volume` / `mute` becoming optional, and SoundCloud's capabilities gaining
  `ECapability.mute`. None of these is breaking. The versioning action derives each package's bump from
  its `.d.ts`, so we add no version file and edit no `package.json`. Expect a minor bump for
  `video-player` and `vue-video-player`, and a patch for the rest.
- D5. Vue's `volume` / `mute` lose their `0` / `false` defaults. Because the value now carries over, a
  default 0 would leave every Vue consumer that doesn't bind it at zero volume. The demos start at 50 for
  the same reason.

## 7. Out of scope

- Spotify volume and mute (the embed has no API for them).
- Adding mute to Mixcloud or Vidyard.

## 8. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Spikes S1-S3, findings in §5 | Findings recorded |
| M1 | `VideoPlayer` desired state, apply, capability filter, settle window (F1-F4) + specs | Type-checks |
| M2 | Adapter fixes (F6) + specs | Type-checks |
| M3 | Vue defaults, demos (F5) | Type-checks |
| M4 | READMEs mention that volume and mute persist; tests for touched projects, once | Tests green |

## 9. Acceptance

| Criterion | Unit-tested | In a running app |
|---|---|---|
| Mute, play YouTube, then Vimeo: Vimeo starts muted, and the app's `mute` stays `true` | ✓ (`VideoPlayer` platform switch + settle window; Vimeo restore after load) | pending |
| Volume 30 on YouTube, then SoundCloud: SoundCloud plays at 30 | ✓ (`VideoPlayer` platform switch) | pending |
| Muted on Vimeo, move the volume slider: it stays muted | ✓ (Vimeo and SoundCloud adapter specs) | pending |
| Bind `[volume]` and play a Spotify URL: nothing throws | ✓ (capability filter, throwing adapter) | pending |

## 10. Status

- [x] M0 · [x] M1 · [x] M2 · [x] M3 · [x] M4 (2026-11-09: `video-player`, `vimeo-player`,
  `soundcloud-player`, `vue-video-player` and `player-provider` tests green)
- M2 scope after S2: only Vimeo and SoundCloud needed adapter changes. Wistia's mute loss on a new item,
  and the unmeasured Dailymotion and Facebook, are handled by the `VideoPlayer` settle window.
- PR: [#106](https://github.com/MintPlayer/mintplayer-ng-video-player/pull/106). Open: the §9 checks in a
  running demo app.
