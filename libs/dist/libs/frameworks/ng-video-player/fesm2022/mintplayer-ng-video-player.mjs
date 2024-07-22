import * as i0 from '@angular/core';
import { InjectionToken, EventEmitter, Component, Inject, Input, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import '@mintplayer/player-provider';
import { VideoPlayer, fromVideoEvent } from '@mintplayer/video-player';

const VIDEO_APIS = new InjectionToken('VideoApis');
function provideVideoApis(...platforms) {
    return {
        provide: VIDEO_APIS,
        useFactory: () => Promise.all(platforms.map(loader => loader())),
    };
}
class VideoPlayerComponent {
    constructor(zone, apis, destroy) {
        this.zone = zone;
        this.apis = apis;
        this.destroy = destroy;
        //#endregion
        //#region progress
        this.progressChange = new EventEmitter();
        this.playerStateChange = new EventEmitter();
        this.volumeChange = new EventEmitter();
        this.muteChange = new EventEmitter();
        this.isFullscreenChange = new EventEmitter();
        this.isPipChange = new EventEmitter();
        //#endregion
        this.capabilitiesChange = new EventEmitter();
    }
    zoneEmit(emitter, value) {
        this.zone.run(() => emitter.emit(value));
    }
    //#region width
    get width() {
        return this.player?.width || 300;
    }
    set width(value) {
        if (this.player) {
            this.player.width = value;
        }
    }
    //#endregion
    //#region height
    get height() {
        return this.player?.height || 200;
    }
    set height(value) {
        if (this.player) {
            this.player.height = value;
        }
    }
    //#endregion
    //#region playerState
    set playerState(value) {
        if (this.player) {
            this.player.playerState = value;
        }
    }
    //#endregion
    //#region title
    getTitle() {
        return new Promise((resolve) => {
            if (this.player) {
                this.player.getTitle().then(t => resolve(t));
            }
            else {
                resolve(null);
            }
        });
    }
    //#endregion
    //#region volume
    get volume() {
        return this.player?.volume ?? 50;
    }
    set volume(value) {
        if (this.player) {
            this.player.volume = value;
        }
    }
    //#endregion
    //#region mute
    get mute() {
        return this.player?.mute ?? false;
    }
    set mute(value) {
        if (this.player) {
            this.player.mute = value;
        }
    }
    //#endregion
    //#region isFullscreen
    get isFullscreen() {
        return this.player?.isFullscreen ?? false;
    }
    set isFullscreen(value) {
        if (this.player) {
            this.player.isFullscreen = value;
        }
    }
    //#endregion
    //#region isPip
    get isPip() {
        return this.player?.isPip ?? false;
    }
    set isPip(value) {
        if (this.player) {
            this.player.isPip = value;
        }
    }
    setIsPip(isPip) {
        // Vimeo pip requests must originate from a user gesture.
        // Hence why we can't make it a bindable property.
        // Sadly, even with this approach, the browser seems to think the event wasn't user initiated when the iframe isn't focused.
        if (this.player) {
            this.player.isPip = isPip;
        }
    }
    //#endregion
    //#region autoplay
    get autoplay() {
        return this.player?.autoplay || false;
    }
    set autoplay(value) {
        if (this.player) {
            this.player.autoplay = value;
        }
    }
    //#endregion
    //#region url
    get url() {
        return this.player?.url || '';
    }
    set url(value) {
        this.setUrl(value);
    }
    setUrl(url) {
        if (this.player) {
            this.player.url = url;
        }
    }
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
        });
    }
    ngOnDestroy() {
        this.player?.destroy();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.0.1", ngImport: i0, type: VideoPlayerComponent, deps: [{ token: i0.NgZone }, { token: VIDEO_APIS }, { token: i0.DestroyRef }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.0.1", type: VideoPlayerComponent, isStandalone: true, selector: "video-player", inputs: { width: "width", height: "height", playerState: "playerState", volume: "volume", mute: "mute", isFullscreen: "isFullscreen", isPip: "isPip", autoplay: "autoplay", url: "url" }, outputs: { progressChange: "progressChange", playerStateChange: "playerStateChange", volumeChange: "volumeChange", muteChange: "muteChange", isFullscreenChange: "isFullscreenChange", isPipChange: "isPipChange", capabilitiesChange: "capabilitiesChange" }, viewQueries: [{ propertyName: "container", first: true, predicate: ["container"], descendants: true }], ngImport: i0, template: "<div #container></div>", styles: [""] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.0.1", ngImport: i0, type: VideoPlayerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'video-player', standalone: true, template: "<div #container></div>" }]
        }], ctorParameters: () => [{ type: i0.NgZone }, { type: Promise, decorators: [{
                    type: Inject,
                    args: [VIDEO_APIS]
                }] }, { type: i0.DestroyRef }], propDecorators: { width: [{
                type: Input
            }], height: [{
                type: Input
            }], progressChange: [{
                type: Output
            }], playerState: [{
                type: Input
            }], playerStateChange: [{
                type: Output
            }], volume: [{
                type: Input
            }], volumeChange: [{
                type: Output
            }], mute: [{
                type: Input
            }], muteChange: [{
                type: Output
            }], isFullscreen: [{
                type: Input
            }], isFullscreenChange: [{
                type: Output
            }], isPip: [{
                type: Input
            }], isPipChange: [{
                type: Output
            }], autoplay: [{
                type: Input
            }], url: [{
                type: Input
            }], capabilitiesChange: [{
                type: Output
            }], container: [{
                type: ViewChild,
                args: ['container']
            }] } });

/**
 * Generated bundle index. Do not edit.
 */

export { VideoPlayerComponent, provideVideoApis };
//# sourceMappingURL=mintplayer-ng-video-player.mjs.map
