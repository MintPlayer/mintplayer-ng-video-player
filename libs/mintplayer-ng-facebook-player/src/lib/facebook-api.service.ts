import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, DestroyRef, PLATFORM_ID } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { loadScript } from '@mintplayer/script-loader';
import { takeUntil, timer, Subject, BehaviorSubject, debounceTime, pairwise, combineLatest, filter, take } from 'rxjs';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from "@mintplayer/ng-player-provider";

@Injectable({
    providedIn: 'root'
})
export class FacebookApiService implements IApiService {

    constructor(@Inject(PLATFORM_ID) private platformId: any) {
    }

    public get id() {
        return 'facebook';
    }

    public get canReusePlayer() {
        return false;
    }

    public urlRegexes: RegExp[] = [
        new RegExp(/^(?<id>https?:\/\/(www\.)?facebook\.com\/(?<user>[^/?]+)\/videos\/(?<video>[0-9]+)[/?]*)/, 'g'),
    ];

    public loadApi() {
        return loadScript('https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0', { windowCallback: 'fbAsyncInit' });
    }

    public prepareHtml(options: PrepareHtmlOptions) {
        if (!options.initialVideoId) {
            throw 'The Facebook api requires an initial video id';
        }
    
        if (/[\s<>"]/.exec(options.initialVideoId)) {
            // Using encodeURIComponent here doesn't work, so fend off injection manually.
            throw `The url contains invalid characters:\n${options.initialVideoId}`;
        }

        return `<div id="${options.domId}" class="fb-video" data-href="${options.initialVideoId}" data-width="${options.width}" data-height="${options.height}" data-autoplay="true" data-allowfullscreen="true" data-controls="true"></div>`;
    }

    public createPlayer(options: PlayerOptions, destroy: DestroyRef): Promise<PlayerAdapter> {
        return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
            const lastPlayerInstance$ = new BehaviorSubject<FB.Player | undefined>(undefined);
            let events: FB.PlayerSubscription[] | undefined;
            let disableVolumeChange = false;
            const destroyRef = new Subject();

            FB.init({
                xfbml: true,
                version: 'v2.5'
            });

            FB.Event.subscribe('xfbml.ready', (message) => {
                // For some reason this method is triggered even up to 4 times
                // When starting a new video. The last instance is the only one
                // we can use to control the player.
                if ((message.type === 'video') && (message.id === options.domId)) {
                    lastPlayerInstance$.next(message.instance);
                }
            });

            const adapter = createPlayerAdapter({
                capabilities: [ECapability.mute, ECapability.volume],
                loadVideoById: (id) => {
                    // No method for this
                },
                setPlayerState: (state) => {
                    const player = lastPlayerInstance$.value;
                    switch (state) {
                        case EPlayerState.playing:
                            if (player) {
                                adapter.onDurationChange(player.getDuration());
                                player.play();
                            }
                            break;
                        case EPlayerState.paused:
                            if (player) {
                                player.pause();
                            }
                            break;
                    }
                },
                setMute: (mute) => {
                    const player = lastPlayerInstance$.value;
                    if (player) {
                        disableVolumeChange = true;
                        mute ? player.mute() : player.unmute();
                        setTimeout(() => disableVolumeChange = false, 20);
                    }
                },
                setVolume: (volume) => {
                    const player = lastPlayerInstance$.value;
                    if (!disableVolumeChange && player) {
                        player.setVolume(volume / 100);
                    }
                },
                setProgress: (time) => {
                    const player = lastPlayerInstance$.value;
                    player && player.seek(time);
                },
                setSize: (width, height) => {},
                getTitle: () => new Promise((resolve, reject) => reject('The Facebook player doesn\'t allow getting the title')),
                setFullscreen: (fullscreen) => {
                    throw 'The Facebook player doesn\'t allow fullscreen mode';
                },
                getFullscreen: () => new Promise((resolve) => resolve(false)),
                setPip: (isPip) => {
                    throw 'The Facebook player doesn\'t allow PiP mode';
                },
                getPip: () => new Promise((resolve) => resolve(false)),
                destroy: () => {
                    events && events.forEach((ev) => ev.release());
                    destroyRef.next(true);
                }
            });
            
            lastPlayerInstance$.pipe(debounceTime(500), pairwise()).subscribe(([previous, next]) => {
                if (previous && events) {
                    events.forEach((ev) => ev.release());
                }

                if (next) {
                    events = [
                        next.subscribe('startedPlaying', () => adapter.onStateChange(EPlayerState.playing)),
                        next.subscribe('paused', () => adapter.onStateChange(EPlayerState.paused)),
                        next.subscribe('finishedPlaying', () => adapter.onStateChange(EPlayerState.ended)),
                    ];
                }
            });
            
            if (!isPlatformServer(this.platformId)) {
                combineLatest([lastPlayerInstance$.pipe(debounceTime(500)), timer(0, 50)])
                    .pipe(filter(([player]) => !!player))
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(([player]) => {
                        if (player) {
                            // Progress
                            const currentTime = player.getCurrentPosition();
                            adapter.onCurrentTimeChange(currentTime);
                            
                            // Volume
                            if (!disableVolumeChange) {
                                const vol = player.getVolume();
                                const mute = player.isMuted();

                                if (!mute || (vol !== 0)) {
                                    adapter.onVolumeChange(vol * 100);
                                }
                            }
                            
                            // Mute
                            const currentMute = player.isMuted();
                            adapter.onMuteChange(currentMute);
                        }
                    });
            }
                
            lastPlayerInstance$.pipe(debounceTime(1500), filter((p) => !!p), take(1), takeUntilDestroyed(destroy)).subscribe((player) => {
                if (options.autoplay && player) {
                    setTimeout(() => player.play(), 50);
                }
            });

            resolvePlayer(adapter);
        });
    }
}