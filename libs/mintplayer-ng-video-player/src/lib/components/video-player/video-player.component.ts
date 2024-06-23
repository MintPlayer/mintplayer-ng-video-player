import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Inject, InjectionToken, Input, ModuleWithProviders, NgZone, OnDestroy, Output, StaticProvider, Type, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayerProgress } from '@mintplayer/player-progress';
import { ApiLoader, ECapability, EPlayerState, IApiService, SphericalProperties, VideoQuality } from '@mintplayer/player-provider';
import { VideoPlayer, fromVideoEvent } from "@mintplayer/video-player";

const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');

export function provideVideoApis(...platforms: ApiLoader[]): StaticProvider {
  return {
    provide: VIDEO_APIS,
    useFactory: () => Promise.all(platforms.map(loader => loader())),
  }
}

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  standalone: true
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {

  constructor(
    private zone: NgZone,
    @Inject(VIDEO_APIS) private apis: Promise<IApiService[]>,
    private destroy: DestroyRef,
  ) { }

  private zoneEmit<T>(emitter: EventEmitter<T>, value?: T) {
    this.zone.run(() => emitter.emit(value));
  }

  //#region width
  get width() {
    return this.player?.width || 300;
  }
  @Input() set width(value: number) {
    if (this.player) {
      this.player.width = value;
    }
  }
  //#endregion
  //#region height
  get height() {
    return this.player?.height || 200;
  }
  @Input() set height(value: number) {
    if (this.player) {
      this.player.height = value;
    }
  }
  //#endregion
  //#region progress
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  //#endregion
  //#region playerState
  @Input() set playerState(value: EPlayerState) {
    if (this.player) {
      this.player.playerState = value;
    }
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
  //#endregion
  //#region title
  public getTitle() {
    return new Promise<string | null>((resolve) => {
      if (this.player) {
        this.player.getTitle().then(t => resolve(t));
      } else {
        resolve(null);
      }
    });
  }
  //#endregion
  //#region volume
  get volume() {
    return this.player?.volume ?? 50;
  }
  @Input() set volume(value: number) {
    if (this.player) {
      this.player.volume = value;
    }
  }
  @Output() public volumeChange = new EventEmitter<number>();
  //#endregion
  //#region mute
  get mute() {
    return this.player?.mute ?? false;
  }
  @Input() set mute(value: boolean) {
    if (this.player) {
      this.player.mute = value;
    }
  }
  @Output() public muteChange = new EventEmitter<boolean>();
  //#endregion

  //#region isFullscreen
  get isFullscreen() {
    return this.player?.isFullscreen ?? false;
  }
  @Input() set isFullscreen(value: boolean) {
    if (this.player) {
      this.player.isFullscreen = value;
    }
  }
  @Output() public isFullscreenChange = new EventEmitter<boolean>();
  //#endregion
  //#region isPip
  get isPip() {
    return this.player?.isPip ?? false;
  }
  @Input() set isPip(value: boolean) {
    if (this.player) {
      this.player.isPip = value;
    }
  }
  @Output() public isPipChange = new EventEmitter<boolean>();
  public setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why we can't make it a bindable property.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    if (this.player) {
      this.player.isPip = isPip;
    }
  }
  //#endregion
  //#region autoplay
  public get autoplay() {
    return this.player?.autoplay || false;
  }
  @Input() public set autoplay(value: boolean) {
    if (this.player) {
      this.player.autoplay = value;
    }
  }
  //#endregion
  //#region url
  public get url() {
    return this.player?.url || '';
  }
  @Input() public set url(value: string) {
    this.setUrl(value);
  }
  public setUrl(url: string | null) {
    if (this.player) {
      this.player.url = url;
    }
  }
  //#endregion
  //#region quality
  public get quality() {
    return this.player?.quality || 'auto';
  }
  @Input() public set quality(value: VideoQuality | undefined) {
    if (this.player) {
      this.player.quality = value || 'auto';
    }
  }
  @Output() public qualityChange = new EventEmitter<VideoQuality>();
  //#endregion
  //#region quality
  public get qualities() {
    return this.player?.qualities || [];
  }
  @Output() public qualitiesChange = new EventEmitter<VideoQuality[]>();
  //#endregion
  //#region playbackRate
  public get playbackRate() {
    return this.player?.playbackRate || 1;
  }
  @Input() public set playbackRate(value: number) {
    if (this.player) {
      this.player.playbackRate = value;
    }
  }
  @Output() public playbackRateChange = new EventEmitter<number>();
  //#endregion
  //#region sphericalProperties
  public get sphericalProperties() {
    return this.player?.sphericalProperties || {};
  }
  @Input() public set sphericalProperties(value: SphericalProperties) {
    if (this.player) {
      this.player.sphericalProperties = value;
    }
  }
  @Output() public sphericalPropertiesChange = new EventEmitter<SphericalProperties>();
  //#endregion

  

  @Output() capabilitiesChange = new EventEmitter<ECapability[]>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  player?: VideoPlayer;
  ngAfterViewInit() {
    this.apis.then((apis) => {
      this.player = new VideoPlayer(this.container.nativeElement, apis);
      fromVideoEvent(this.player, 'stateChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([state]) => this.zoneEmit(this.playerStateChange, state));
      fromVideoEvent(this.player, 'isPipChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([isPip]) => this.zoneEmit(this.isPipChange, isPip));
      fromVideoEvent(this.player, 'isFullscreenChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([isFullscreen]) => this.zoneEmit(this.isFullscreenChange, isFullscreen));
      fromVideoEvent(this.player, 'muteChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([mute]) => this.zoneEmit(this.muteChange, mute));
      fromVideoEvent(this.player, 'volumeChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([volume]) => this.zoneEmit(this.volumeChange, volume));
      fromVideoEvent(this.player, 'capabilitiesChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([capabilities]) => this.zoneEmit(this.capabilitiesChange, capabilities));
      fromVideoEvent(this.player, 'progressChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([progress]) => this.zoneEmit(this.progressChange, progress));
      fromVideoEvent(this.player, 'qualityChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([quality]) => this.zoneEmit(this.qualityChange, quality));
      fromVideoEvent(this.player, 'qualitiesChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([qualities]) => this.zoneEmit(this.qualitiesChange, qualities));
      fromVideoEvent(this.player, 'playbackRateChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([playbackRate]) => this.zoneEmit(this.playbackRateChange, playbackRate));
      fromVideoEvent(this.player, 'sphericalPropertiesChange').pipe(takeUntilDestroyed(this.destroy))
        .subscribe(([sphericalProperties]) => this.zoneEmit(this.sphericalPropertiesChange, sphericalProperties));
    });
  }

  ngOnDestroy() {
    this.player?.destroy();
  }
}
