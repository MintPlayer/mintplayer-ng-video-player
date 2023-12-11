import { DestroyRef, EventEmitter, Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { DOCUMENT, isPlatformServer } from "@angular/common";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from "@mintplayer/ng-player-provider";
import { BehaviorSubject, Subject, filter, fromEvent, take, takeUntil, timer } from 'rxjs';

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
                return `
                    <div style="width:${options.width}px;height:${options.height}px;position:relative;margin:0 auto">
                        <div style="height:100%;display:flex;width:100%;flex-direction:column;align-items:center;justify-content:space-around;position:absolute">
                            <audio src="${id}" autoplay="${options.autoplay ? 'on' : 'off'}" controls="on" style="z-index:5"></audio>
                        </div>
                        <div style="height:100%;display:flex;width:100%;flex-direction:column;align-items:center;justify-content:space-around;position:absolute">
                            <canvas width="${options.width}" height="${options.height}"></canvas>
                        </div>
                    </div>`
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

            const divElement = options.element.querySelector('div')!;

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
                            divElement.requestFullscreen();
                        } else {
                            if (this.document.fullscreenElement === divElement) {
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
                        mediaElement.pause();
                        mediaElement.removeAttribute('src');
                        mediaElement.load();
                        if (this.document.pictureInPictureElement === mediaElement) {
                            this.document.exitPictureInPicture();
                        }
                        destroyRef.next(true);
                    }
                });

                if (mediaElement instanceof HTMLAudioElement) {
                    const canvases = options.element.getElementsByTagName('canvas');
                    if (canvases.length > 0) {
                      this.createEqualizer(mediaElement, canvases[0], destroy);
                    }
                }

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

                fromEvent(divElement, 'fullscreenchange')
                    .pipe(takeUntil(destroyRef), takeUntilDestroyed(destroy))
                    .subscribe(() => adapter.onFullscreenChange(this.document.fullscreenElement === divElement));

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

    private createEqualizer(audio: HTMLAudioElement, canvas: HTMLCanvasElement, destroy: DestroyRef) {
        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();

        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        this.frameLooper(analyzer, canvas, destroy);

        destroy.onDestroy(() => {
            analyzer.disconnect();
            source.disconnect();
            audioContext.close();
        });
    }

    private frameLooper(analyser: AnalyserNode, canvas: HTMLCanvasElement, destroy: DestroyRef) {
        const drawContext = canvas.getContext('2d');
        if (!drawContext) {
            throw 'Could not get drawing context';
        }

        let cancelled = false;
        destroy.onDestroy(() => cancelled = true);

        if (typeof window !== 'undefined') {
            const anyWindow = <any>window;
            const callback = (time: DOMHighResTimeStamp) => {
                // const requestAnimationFrameCrossBrowser =
                anyWindow.RequestAnimationFrame =
                    window.requestAnimationFrame(callback) ||
                    anyWindow.msRequestAnimationFrame(callback) ||
                    anyWindow.mozRequestAnimationFrame(callback) ||
                    anyWindow.webkitRequestAnimationFrame(callback);

                const fbc_array = new Uint8Array(analyser.frequencyBinCount);
                const bar_count = window.innerWidth / 2;

                analyser.getByteFrequencyData(fbc_array);

                drawContext.clearRect(0, 0, canvas.width, canvas.height);
                drawContext.fillStyle = "#888888";

                for (let i = 0; i < bar_count; i++) {
                    const bar_pos = i * 4;
                    const bar_width = 2;
                    const bar_height = -(fbc_array[i] / 2);

                    drawContext.fillRect(bar_pos, canvas.height, bar_width, bar_height);
                }

            }

            if (!cancelled) {
                callback(0);
            }
        }
    }
}

interface MediaType {
    tagType: 'audio' | 'video';
    id: string;
    extension: string;
}

// class CancellationToken {
//     private _isCancelled = false;
//     public get isCancelled() {
//         return this._isCancelled;
//     }

//     public cancel() {
//         this._isCancelled = true;
//         this.onCancel.emit();
//     }

//     public onCancel = new EventEmitter();
// }
