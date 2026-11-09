import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, InjectionToken, input, linkedSignal, model, ModelSignal, output, StaticProvider, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayerProgress } from '@mintplayer/player-progress';
import { ApiPlugin, ECapability, EPlayerState, IApiService } from '@mintplayer/player-provider';
import { VideoPlayer, VideoEventMap, fromVideoEvent } from "@mintplayer/video-player";

const VIDEO_APIS = new InjectionToken<Promise<IApiService[]>>('VideoApis');

export function provideVideoApis(...platforms: ApiPlugin[]): StaticProvider {
  return {
    provide: VIDEO_APIS,
    useFactory: () => Promise.all(platforms.map(loader => loader())),
  }
}

/** Marks that no reported value is pending, so every model value is forwarded. */
const NOTHING_REPORTED = Symbol('nothing reported');

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent {
  private readonly player = new VideoPlayer();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    inject(VIDEO_APIS).then((apis) => this.player.apis = apis || []);
    afterNextRender(() => this.player.host = this.container().nativeElement);
    this.destroyRef.onDestroy(() => this.player.destroy());

    this.forwardDefined(this.width, (width) => this.player.width = width);
    this.forwardDefined(this.height, (height) => this.player.height = height);
    this.forwardDefined(this.autoplay, (autoplay) => this.player.autoplay = autoplay);
    effect(() => {
      const url = this.currentUrl();
      untracked(() => this.player.url = url);
    });

    this.twoWay(this.playerState, 'stateChange', (state) => this.player.playerState = state);
    this.twoWay(this.volume, 'volumeChange', (volume) => this.player.volume = volume);
    this.twoWay(this.mute, 'muteChange', (mute) => this.player.mute = mute);
    this.twoWay(this.isFullscreen, 'isFullscreenChange', (isFullscreen) => this.player.isFullscreen = isFullscreen);
    this.twoWay(this.isPip, 'isPipChange', (isPip) => this.player.isPip = isPip);

    this.relay('progressChange', (progress) => this.progressChange.emit(progress));
    this.relay('capabilitiesChange', (capabilities) => this.capabilitiesChange.emit(capabilities));
  }

  /** Width in pixels. Unbound, the player's default (600) applies. */
  readonly width = input<number>();
  /** Height in pixels. Unbound, the player's default (450) applies. */
  readonly height = input<number>();
  /** Whether a loaded medium starts playing. Unbound, it does. */
  readonly autoplay = input<boolean>();
  /** The medium to play; `null` or empty clears the player. */
  readonly url = input<string | null>();
  /**
   * The url in effect: the bound `url`, or the last `setUrl` call since it changed.
   * Never equal to its previous value, so `setUrl` with the same url replays the medium.
   */
  private readonly currentUrl = linkedSignal<string | null>(() => this.url() ?? null, { equal: () => false });

  readonly playerState = model<EPlayerState>(EPlayerState.unstarted);
  /**
   * Undefined until the consumer sets it or the player reports it: an unset volume is taken from
   * the first platform that reports one, instead of being forced to a default (#105).
   */
  readonly volume = model<number>();
  /** Undefined until the consumer sets it or the player reports it, like `volume`. */
  readonly mute = model<boolean>();
  readonly isFullscreen = model<boolean>(false);
  readonly isPip = model<boolean>(false);

  readonly progressChange = output<PlayerProgress>();
  readonly capabilitiesChange = output<ECapability[]>();

  readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  /**
   * Plays another medium, without a bound `url`, or replays the current one when given the same url.
   * A later change of the bound `url` takes over again.
   */
  public setUrl(url: string | null) {
    this.currentUrl.set(url);
  }

  public setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why this calls the player synchronously, instead of going through the model.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    this.player.isPip = isPip;
  }

  public getTitle() {
    return this.player.getTitle();
  }

  private forwardDefined<T>(signal: () => T | undefined, apply: (value: T) => void) {
    effect(() => {
      const value = signal();
      if (value !== undefined) {
        untracked(() => apply(value));
      }
    });
  }

  /**
   * Binds a model to the player both ways, without ever writing a value the player reported back
   * into it (#100). The YouTube adapter stops the video on `ended`, so an echoed `ended` would
   * stop the next medium of a playlist.
   *
   * A report sets the model; the forwarding effect then sees the reported value and skips it.
   * A value the consumer sets is forwarded, after which nothing counts as reported until the next
   * report, so the consumer can always set the previous value again.
   *
   * The model's default counts as reported, so it is not forwarded: it is the player's own default.
   */
  private twoWay<K extends keyof VideoEventMap, T extends VideoEventMap[K]>(
    value: ModelSignal<T> | ModelSignal<T | undefined>,
    event: K,
    apply: (value: T) => void,
  ) {
    let reported: T | undefined | typeof NOTHING_REPORTED = value();
    effect(() => {
      const current = value();
      if ((current === undefined) || (current === reported)) {
        return;
      }
      reported = NOTHING_REPORTED;
      untracked(() => apply(current));
    });
    this.relay(event, (report) => {
      reported = report as T;
      (value as ModelSignal<T>).set(report as T);
    });
  }

  private relay<K extends keyof VideoEventMap>(event: K, handler: (args: VideoEventMap[K]) => void) {
    fromVideoEvent(this.player, event)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(handler);
  }
}
