import { DestroyRef, Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { DOCUMENT, isPlatformServer } from "@angular/common";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from "@mintplayer/ng-player-provider";
import { Subject, fromEvent, take, takeUntil, timer } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FileApiService implements IApiService {
    constructor(@Inject(PLATFORM_ID) private platformId: object, @Inject(DOCUMENT) doc: any) {
        this.document = doc;
    }

    private document: Document;

    public get id() {
        return 'file';
    }

    public get canReusePlayer() {
        return false;
    }

    public urlRegexes: RegExp[] = [
        new RegExp(/(?<id>https?:\/\/.+\.(?<audiotype>m4a|m4b|mp4a|mpga|mp2|mp2a|mp3|m2a|m3a|wav|weba|aac|oga|spx))/, 'g'),
        new RegExp(/(?<id>https?:\/\/.+\.(?<videotype>mp4|og[gv]|webm|mov|m4v))/, 'g'),
    ];

    public loadApi() {
        return Promise.resolve();
    }

    match2id(match: RegExpExecArray) {
        if (!match.groups) {
            throw 'match2id - match.groups is undefined';
        }

        const type = match.groups['audiotype'] ? 'audio' : match.groups['videotype'] ? 'video' : '';
        if (type === '') {
            throw 'Cannot match type';
        }

        return JSON.stringify(<MediaType>{
            tagType: type,
            id: match.groups['id'],
            extension: match.groups['audiotype'] ?? match.groups['videotype'],
        });
    }

    public prepareHtml(options: PrepareHtmlOptions) {
        if (!options.initialVideoId) {
            throw 'The Facebook api requires an initial video id';
        }
  
        const info: MediaType = JSON.parse(options.initialVideoId);
        const id = info.id.replace(/["<>]/, '');
        switch (info.tagType) {
            case 'audio':
                return `<audio src="${id}" autoplay="${options.autoplay ? 'on' : 'off'}" controls="on"></audio>`
            case 'video':
                return `<video src="${id}" style="max-width:100%" autoplay="${options.autoplay ? 'on' : 'off'}" width="${options.width ?? 500}" height="${options.height ?? 300}" controls></video>`
            default:
                throw `Unsupported media type: ${info.extension}`;
        }
    }

    public createPlayer(options: PlayerOptions, destroy: DestroyRef) {
        return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
            if (!options.element) {
                return rejectPlayer('The FilePlayer requires the options.element to be set');
            }

            const mediaElement: HTMLAudioElement | HTMLVideoElement | null = options.element.querySelector('audio, video');
            if (!mediaElement) {
                return rejectPlayer('There doesn\'t seem to be an audio or video element');
            }

            const destroyRef = new Subject();
            let adapter: PlayerAdapter;
            fromEvent(mediaElement, 'canplay')
                .pipe(take(1), takeUntil(destroyRef), takeUntilDestroyed(destroy))
                .subscribe(() => {
                adapter = createPlayerAdapter({
                    capabilities: [ECapability.volume, ECapability.mute, ECapability.fullscreen, ECapability.pictureInPicture],
                    loadVideoById: (id: string) => {
                        // throw 'File player cannot be reused';
                    },
                    setPlayerState: (state: EPlayerState) => {
                        switch (state) {
                            case EPlayerState.playing:
                                mediaElement.play();
                                break;
                            case EPlayerState.paused:
                                mediaElement.pause();
                                break;
                        }
                    },
                    setMute: (mute) => mediaElement.muted = mute,
                    setVolume: (volume) => mediaElement.volume = volume / 100,
                    setProgress: (time) => mediaElement.fastSeek(time),
                    setSize: (width, height) => {
                        if (mediaElement instanceof HTMLVideoElement) {
                            mediaElement.width = width;
                            mediaElement.height = height;
                        }
                    },
                    getTitle: () => new Promise((resolve, reject) => {
                        reject('File player doesn\'t support getting the title');
                    }),
                    setFullscreen: (isFullscreen) => {
                        if (isFullscreen) {
                            mediaElement.requestFullscreen({
                                // navigationUI: 'hide'
                            });
                        } else {
                            if (this.document.fullscreenElement === mediaElement) {
                                this.document.exitFullscreen();
                            }
                        }
                    },
                    getFullscreen: () => new Promise((resolve) => resolve(false)),
                    setPip: (isPip) => {
                        if (mediaElement instanceof HTMLVideoElement) {
                            if (isPip) {
                                mediaElement.requestPictureInPicture();
                            } else {
                                if (this.document.pictureInPictureElement === mediaElement) {
                                    this.document.exitPictureInPicture();
                                }
                            }
                        }
                    },
                    getPip: () => new Promise((resolve) => resolve(false)),
                    destroy: () => {
                        destroyRef.next(true);
                    }
                });

                fromEvent(mediaElement, 'volumechange')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => {
                        adapter.onVolumeChange(mediaElement.volume * 100);
                        adapter.onMuteChange(mediaElement.muted);
                    });

                fromEvent(mediaElement, 'enterpictureinpicture')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onPipChange(true));
                    
                fromEvent(mediaElement, 'leavepictureinpicture')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onPipChange(false));
                
                fromEvent(mediaElement, 'fullscreenchange')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onFullscreenChange(this.document.fullscreenElement === mediaElement));

                fromEvent(mediaElement, 'play')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onStateChange(EPlayerState.playing));
                    
                fromEvent(mediaElement, 'pause')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onStateChange(EPlayerState.paused));
            
                fromEvent(mediaElement, 'ended')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onStateChange(EPlayerState.ended));
                
                if (!isPlatformServer(this.platformId)) {
                    timer(0, 50)
                        .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                        .subscribe(() => {
                            adapter.onCurrentTimeChange(mediaElement.currentTime);
                            adapter.onDurationChange(mediaElement.duration);
                        });
                }

                setTimeout(() => {
                    adapter.onVolumeChange(mediaElement.volume * 100);
                    adapter.onMuteChange(mediaElement.muted);
                }, 20);

                resolvePlayer(adapter);
            });
        });
    }
}

interface MediaType {
    tagType: 'audio' | 'video';
    id: string;
    extension: string;
}