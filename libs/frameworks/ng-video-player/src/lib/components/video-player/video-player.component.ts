import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Inject, InjectionToken, Input, ModuleWithProviders, NgZone, OnDestroy, Output, StaticProvider, Type, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayerProgress } from '@mintplayer/player-progress';
import { ApiLoader, ECapability, EPlayerState, IApiService } from '@mintplayer/player-provider';
import { VideoPlayer, fromVideoEvent } from "@mintplayer/video-player";
import { BehaviorSubject, combineLatest, filter, take } from 'rxjs';

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
  ) {
    this.apis.then((apis) => this.apis$.next(apis));
  
    const player = new VideoPlayer();
    fromVideoEvent(player, 'stateChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([state]) => this.zoneEmit(this.playerStateChange, state));
    fromVideoEvent(player, 'isPipChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([isPip]) => this.zoneEmit(this.isPipChange, isPip));
    fromVideoEvent(player, 'isFullscreenChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([isFullscreen]) => this.zoneEmit(this.isFullscreenChange, isFullscreen));
    fromVideoEvent(player, 'muteChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([mute]) => this.zoneEmit(this.muteChange, mute));
    fromVideoEvent(player, 'volumeChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([volume]) => this.zoneEmit(this.volumeChange, volume));
    fromVideoEvent(player, 'capabilitiesChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([capabilities]) => this.zoneEmit(this.capabilitiesChange, capabilities));
    fromVideoEvent(player, 'progressChange').pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([progress]) => this.zoneEmit(this.progressChange, progress));
    this.player$ = new BehaviorSubject<VideoPlayer>(player);

    combineLatest([this.url$, this.player$])
      .pipe(filter(([url, player]) => !!player), takeUntilDestroyed())
      .subscribe(([url, player]) => player!.url = url);
      
    combineLatest([this.apis$, this.player$])
      .pipe(filter(([apis, player]) => !!apis), take(1), takeUntilDestroyed())
      .subscribe(([apis, player]) => player.apis = apis || []);

    combineLatest([this.isViewReady$, this.player$])
      .pipe(filter(([isViewReady, player]) => isViewReady), take(1), takeUntilDestroyed())
      .subscribe(([_, player]) => player.host = this.container.nativeElement);
  }

  private zoneEmit<T>(emitter: EventEmitter<T>, value?: T) {
    this.zone.run(() => emitter.emit(value));
  }

  //#region width
  get width() {
    return this.player$.value?.width || 300;
  }
  @Input() set width(value: number) {
    this.player$.value.width = value;
  }
  //#endregion
  //#region height
  get height() {
    return this.player$.value?.height || 200;
  }
  @Input() set height(value: number) {
    this.player$.value.height = value;
  }
  //#endregion
  //#region progress
  @Output() public progressChange = new EventEmitter<PlayerProgress>();
  //#endregion
  //#region playerState
  @Input() set playerState(value: EPlayerState) {
    this.player$.value.playerState = value;
  }
  @Output() public playerStateChange = new EventEmitter<EPlayerState>();
  //#endregion
  //#region title
  public getTitle() {
    return new Promise<string | null>((resolve) => {
      this.player$.value.getTitle().then(t => resolve(t));
    });
  }
  //#endregion
  //#region volume
  get volume() {
    return this.player$.value.volume;
  }
  @Input() set volume(value: number) {
    this.player$.value.volume = value;
  }
  @Output() public volumeChange = new EventEmitter<number>();
  //#endregion
  //#region mute
  get mute() {
    return this.player$.value.mute;
  }
  @Input() set mute(value: boolean) {
    this.player$.value.mute = value;
  }
  @Output() public muteChange = new EventEmitter<boolean>();
  //#endregion

  //#region isFullscreen
  get isFullscreen() {
    return this.player$.value.isFullscreen;
  }
  @Input() set isFullscreen(value: boolean) {
    this.player$.value.isFullscreen = value;
  }
  @Output() public isFullscreenChange = new EventEmitter<boolean>();
  //#endregion
  //#region isPip
  get isPip() {
    return this.player$.value.isPip;
  }
  @Input() set isPip(value: boolean) {
    this.player$.value.isPip = value;
  }
  @Output() public isPipChange = new EventEmitter<boolean>();
  public setIsPip(isPip: boolean) {
    // Vimeo pip requests must originate from a user gesture.
    // Hence why we can't make it a bindable property.
    // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
    this.player$.value.isPip = isPip;
  }
  //#endregion
  //#region autoplay
  public get autoplay() {
    return this.player$.value.autoplay;
  }
  @Input() public set autoplay(value: boolean) {
    this.player$.value.autoplay = value;
  }
  //#endregion
  //#region url
  url$ = new BehaviorSubject<string | null>(null);
  public get url() {
    return this.url$.value || '';
  }
  @Input() public set url(value: string) {
    this.setUrl(value);
  }
  public setUrl(url: string | null) {
    this.url$.next(url);
  }
  //#endregion

  @Output() capabilitiesChange = new EventEmitter<ECapability[]>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  isViewReady$ = new BehaviorSubject<boolean>(false);
  player$: BehaviorSubject<VideoPlayer>;
  apis$ = new BehaviorSubject<IApiService[] | undefined>(undefined);
  ngAfterViewInit() {
    this.isViewReady$.next(true);
  }

  ngOnDestroy() {
    this.player$.value.destroy();
  }
}
