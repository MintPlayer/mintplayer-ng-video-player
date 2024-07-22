import { Component, DestroyRef, ElementRef, EventEmitter, Inject, InjectionToken, Input, NgZone, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EPlayerState } from '@mintplayer/player-provider';
import { VideoPlayer, fromVideoEvent } from "@mintplayer/video-player";
import * as i0 from "@angular/core";
const VIDEO_APIS = new InjectionToken('VideoApis');
export function provideVideoApis(...platforms) {
    return {
        provide: VIDEO_APIS,
        useFactory: () => Promise.all(platforms.map(loader => loader())),
    };
}
export class VideoPlayerComponent {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlkZW8tcGxheWVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2ZyYW1ld29ya3MvbmctdmlkZW8tcGxheWVyL3NyYy9saWIvY29tcG9uZW50cy92aWRlby1wbGF5ZXIvdmlkZW8tcGxheWVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2ZyYW1ld29ya3MvbmctdmlkZW8tcGxheWVyL3NyYy9saWIvY29tcG9uZW50cy92aWRlby1wbGF5ZXIvdmlkZW8tcGxheWVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBaUIsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUF1QixNQUFNLEVBQWEsTUFBTSxFQUF3QixTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDL00sT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFaEUsT0FBTyxFQUEwQixZQUFZLEVBQWUsTUFBTSw2QkFBNkIsQ0FBQztBQUNoRyxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBCQUEwQixDQUFDOztBQUV2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBYyxXQUFXLENBQUMsQ0FBQztBQUVoRSxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsR0FBRyxTQUFzQjtJQUN4RCxPQUFPO1FBQ0wsT0FBTyxFQUFFLFVBQVU7UUFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7S0FDakUsQ0FBQTtBQUNILENBQUM7QUFRRCxNQUFNLE9BQU8sb0JBQW9CO0lBRS9CLFlBQ1UsSUFBWSxFQUNRLElBQTRC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LElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ2pGLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLENBQUM7OEdBOUpVLG9CQUFvQix3Q0FJckIsVUFBVTtrR0FKVCxvQkFBb0IseW1CQ3JCakMsd0JBQXNCOzsyRkRxQlQsb0JBQW9CO2tCQU5oQyxTQUFTOytCQUNFLGNBQWMsY0FHWixJQUFJOzswQkFNYixNQUFNOzJCQUFDLFVBQVU7a0VBWVAsS0FBSztzQkFBakIsS0FBSztnQkFVTyxNQUFNO3NCQUFsQixLQUFLO2dCQU9XLGNBQWM7c0JBQTlCLE1BQU07Z0JBR00sV0FBVztzQkFBdkIsS0FBSztnQkFLVyxpQkFBaUI7c0JBQWpDLE1BQU07Z0JBaUJNLE1BQU07c0JBQWxCLEtBQUs7Z0JBS1csWUFBWTtzQkFBNUIsTUFBTTtnQkFNTSxJQUFJO3NCQUFoQixLQUFLO2dCQUtXLFVBQVU7c0JBQTFCLE1BQU07Z0JBT00sWUFBWTtzQkFBeEIsS0FBSztnQkFLVyxrQkFBa0I7c0JBQWxDLE1BQU07Z0JBTU0sS0FBSztzQkFBakIsS0FBSztnQkFLVyxXQUFXO3NCQUEzQixNQUFNO2dCQWNhLFFBQVE7c0JBQTNCLEtBQUs7Z0JBVWMsR0FBRztzQkFBdEIsS0FBSztnQkFVSSxrQkFBa0I7c0JBQTNCLE1BQU07Z0JBRWlCLFNBQVM7c0JBQWhDLFNBQVM7dUJBQUMsV0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyVmlld0luaXQsIENvbXBvbmVudCwgRGVzdHJveVJlZiwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbmplY3QsIEluamVjdGlvblRva2VuLCBJbnB1dCwgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdab25lLCBPbkRlc3Ryb3ksIE91dHB1dCwgU3RhdGljUHJvdmlkZXIsIFR5cGUsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyB0YWtlVW50aWxEZXN0cm95ZWQgfSBmcm9tICdAYW5ndWxhci9jb3JlL3J4anMtaW50ZXJvcCc7XHJcbmltcG9ydCB7IFBsYXllclByb2dyZXNzIH0gZnJvbSAnQG1pbnRwbGF5ZXIvcGxheWVyLXByb2dyZXNzJztcclxuaW1wb3J0IHsgQXBpTG9hZGVyLCBFQ2FwYWJpbGl0eSwgRVBsYXllclN0YXRlLCBJQXBpU2VydmljZSB9IGZyb20gJ0BtaW50cGxheWVyL3BsYXllci1wcm92aWRlcic7XHJcbmltcG9ydCB7IFZpZGVvUGxheWVyLCBmcm9tVmlkZW9FdmVudCB9IGZyb20gXCJAbWludHBsYXllci92aWRlby1wbGF5ZXJcIjtcclxuXHJcbmNvbnN0IFZJREVPX0FQSVMgPSBuZXcgSW5qZWN0aW9uVG9rZW48SUFwaVNlcnZpY2U+KCdWaWRlb0FwaXMnKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlVmlkZW9BcGlzKC4uLnBsYXRmb3JtczogQXBpTG9hZGVyW10pOiBTdGF0aWNQcm92aWRlciB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb3ZpZGU6IFZJREVPX0FQSVMsXHJcbiAgICB1c2VGYWN0b3J5OiAoKSA9PiBQcm9taXNlLmFsbChwbGF0Zm9ybXMubWFwKGxvYWRlciA9PiBsb2FkZXIoKSkpLFxyXG4gIH1cclxufVxyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICd2aWRlby1wbGF5ZXInLFxyXG4gIHRlbXBsYXRlVXJsOiAnLi92aWRlby1wbGF5ZXIuY29tcG9uZW50Lmh0bWwnLFxyXG4gIHN0eWxlVXJsczogWycuL3ZpZGVvLXBsYXllci5jb21wb25lbnQuc2NzcyddLFxyXG4gIHN0YW5kYWxvbmU6IHRydWVcclxufSlcclxuZXhwb3J0IGNsYXNzIFZpZGVvUGxheWVyQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSxcclxuICAgIEBJbmplY3QoVklERU9fQVBJUykgcHJpdmF0ZSBhcGlzOiBQcm9taXNlPElBcGlTZXJ2aWNlW10+LFxyXG4gICAgcHJpdmF0ZSBkZXN0cm95OiBEZXN0cm95UmVmLFxyXG4gICkgeyB9XHJcblxyXG4gIHByaXZhdGUgem9uZUVtaXQ8VD4oZW1pdHRlcjogRXZlbnRFbWl0dGVyPFQ+LCB2YWx1ZT86IFQpIHtcclxuICAgIHRoaXMuem9uZS5ydW4oKCkgPT4gZW1pdHRlci5lbWl0KHZhbHVlKSk7XHJcbiAgfVxyXG5cclxuICAvLyNyZWdpb24gd2lkdGhcclxuICBnZXQgd2lkdGgoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXI/LndpZHRoIHx8IDMwMDtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IHdpZHRoKHZhbHVlOiBudW1iZXIpIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICB0aGlzLnBsYXllci53aWR0aCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuICAvLyNlbmRyZWdpb25cclxuICAvLyNyZWdpb24gaGVpZ2h0XHJcbiAgZ2V0IGhlaWdodCgpIHtcclxuICAgIHJldHVybiB0aGlzLnBsYXllcj8uaGVpZ2h0IHx8IDIwMDtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IGhlaWdodCh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIuaGVpZ2h0ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vI2VuZHJlZ2lvblxyXG4gIC8vI3JlZ2lvbiBwcm9ncmVzc1xyXG4gIEBPdXRwdXQoKSBwdWJsaWMgcHJvZ3Jlc3NDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPFBsYXllclByb2dyZXNzPigpO1xyXG4gIC8vI2VuZHJlZ2lvblxyXG4gIC8vI3JlZ2lvbiBwbGF5ZXJTdGF0ZVxyXG4gIEBJbnB1dCgpIHNldCBwbGF5ZXJTdGF0ZSh2YWx1ZTogRVBsYXllclN0YXRlKSB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdGUgPSB2YWx1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgQE91dHB1dCgpIHB1YmxpYyBwbGF5ZXJTdGF0ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RVBsYXllclN0YXRlPigpO1xyXG4gIC8vI2VuZHJlZ2lvblxyXG4gIC8vI3JlZ2lvbiB0aXRsZVxyXG4gIHB1YmxpYyBnZXRUaXRsZSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmcgfCBudWxsPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgICB0aGlzLnBsYXllci5nZXRUaXRsZSgpLnRoZW4odCA9PiByZXNvbHZlKHQpKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgLy8jZW5kcmVnaW9uXHJcbiAgLy8jcmVnaW9uIHZvbHVtZVxyXG4gIGdldCB2b2x1bWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXI/LnZvbHVtZSA/PyA1MDtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IHZvbHVtZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIEBPdXRwdXQoKSBwdWJsaWMgdm9sdW1lQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XHJcbiAgLy8jZW5kcmVnaW9uXHJcbiAgLy8jcmVnaW9uIG11dGVcclxuICBnZXQgbXV0ZSgpIHtcclxuICAgIHJldHVybiB0aGlzLnBsYXllcj8ubXV0ZSA/PyBmYWxzZTtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IG11dGUodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICB0aGlzLnBsYXllci5tdXRlID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIEBPdXRwdXQoKSBwdWJsaWMgbXV0ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcclxuICAvLyNlbmRyZWdpb25cclxuXHJcbiAgLy8jcmVnaW9uIGlzRnVsbHNjcmVlblxyXG4gIGdldCBpc0Z1bGxzY3JlZW4oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXI/LmlzRnVsbHNjcmVlbiA/PyBmYWxzZTtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IGlzRnVsbHNjcmVlbih2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgaWYgKHRoaXMucGxheWVyKSB7XHJcbiAgICAgIHRoaXMucGxheWVyLmlzRnVsbHNjcmVlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuICBAT3V0cHV0KCkgcHVibGljIGlzRnVsbHNjcmVlbkNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcclxuICAvLyNlbmRyZWdpb25cclxuICAvLyNyZWdpb24gaXNQaXBcclxuICBnZXQgaXNQaXAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXI/LmlzUGlwID8/IGZhbHNlO1xyXG4gIH1cclxuICBASW5wdXQoKSBzZXQgaXNQaXAodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICB0aGlzLnBsYXllci5pc1BpcCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuICBAT3V0cHV0KCkgcHVibGljIGlzUGlwQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xyXG4gIHB1YmxpYyBzZXRJc1BpcChpc1BpcDogYm9vbGVhbikge1xyXG4gICAgLy8gVmltZW8gcGlwIHJlcXVlc3RzIG11c3Qgb3JpZ2luYXRlIGZyb20gYSB1c2VyIGdlc3R1cmUuXHJcbiAgICAvLyBIZW5jZSB3aHkgd2UgY2FuJ3QgbWFrZSBpdCBhIGJpbmRhYmxlIHByb3BlcnR5LlxyXG4gICAgLy8gU2FkbHksIGV2ZW4gd2l0aCB0aGlzIGFwcHJvYWNoLCB0aGUgYnJvd3NlciBzZWVtcyB0byB0aGluayB0aGUgZXZlbnQgd2Fzbid0IHVzZXIgaW5pdGlhdGVkIHdoZW4gdGhlIGlmcmFtZSBpc24ndCBmb2N1c2VkLlxyXG4gICAgaWYgKHRoaXMucGxheWVyKSB7XHJcbiAgICAgIHRoaXMucGxheWVyLmlzUGlwID0gaXNQaXA7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vI2VuZHJlZ2lvblxyXG4gIC8vI3JlZ2lvbiBhdXRvcGxheVxyXG4gIHB1YmxpYyBnZXQgYXV0b3BsYXkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXI/LmF1dG9wbGF5IHx8IGZhbHNlO1xyXG4gIH1cclxuICBASW5wdXQoKSBwdWJsaWMgc2V0IGF1dG9wbGF5KHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIuYXV0b3BsYXkgPSB2YWx1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgLy8jZW5kcmVnaW9uXHJcbiAgLy8jcmVnaW9uIHVybFxyXG4gIHB1YmxpYyBnZXQgdXJsKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyPy51cmwgfHwgJyc7XHJcbiAgfVxyXG4gIEBJbnB1dCgpIHB1YmxpYyBzZXQgdXJsKHZhbHVlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuc2V0VXJsKHZhbHVlKTtcclxuICB9XHJcbiAgcHVibGljIHNldFVybCh1cmw6IHN0cmluZyB8IG51bGwpIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICB0aGlzLnBsYXllci51cmwgPSB1cmw7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICBAT3V0cHV0KCkgY2FwYWJpbGl0aWVzQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxFQ2FwYWJpbGl0eVtdPigpO1xyXG5cclxuICBAVmlld0NoaWxkKCdjb250YWluZXInKSBjb250YWluZXIhOiBFbGVtZW50UmVmPEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgcGxheWVyPzogVmlkZW9QbGF5ZXI7XHJcbiAgbmdBZnRlclZpZXdJbml0KCkge1xyXG4gICAgdGhpcy5hcGlzLnRoZW4oKGFwaXMpID0+IHtcclxuICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgVmlkZW9QbGF5ZXIodGhpcy5jb250YWluZXIubmF0aXZlRWxlbWVudCwgYXBpcyk7XHJcbiAgICAgIGZyb21WaWRlb0V2ZW50KHRoaXMucGxheWVyLCAnc3RhdGVDaGFuZ2UnKS5waXBlKHRha2VVbnRpbERlc3Ryb3llZCh0aGlzLmRlc3Ryb3kpKVxyXG4gICAgICAgIC5zdWJzY3JpYmUoKFtzdGF0ZV0pID0+IHRoaXMuem9uZUVtaXQodGhpcy5wbGF5ZXJTdGF0ZUNoYW5nZSwgc3RhdGUpKTtcclxuICAgICAgZnJvbVZpZGVvRXZlbnQodGhpcy5wbGF5ZXIsICdpc1BpcENoYW5nZScpLnBpcGUodGFrZVVudGlsRGVzdHJveWVkKHRoaXMuZGVzdHJveSkpXHJcbiAgICAgICAgLnN1YnNjcmliZSgoW2lzUGlwXSkgPT4gdGhpcy56b25lRW1pdCh0aGlzLmlzUGlwQ2hhbmdlLCBpc1BpcCkpO1xyXG4gICAgICBmcm9tVmlkZW9FdmVudCh0aGlzLnBsYXllciwgJ2lzRnVsbHNjcmVlbkNoYW5nZScpLnBpcGUodGFrZVVudGlsRGVzdHJveWVkKHRoaXMuZGVzdHJveSkpXHJcbiAgICAgICAgLnN1YnNjcmliZSgoW2lzRnVsbHNjcmVlbl0pID0+IHRoaXMuem9uZUVtaXQodGhpcy5pc0Z1bGxzY3JlZW5DaGFuZ2UsIGlzRnVsbHNjcmVlbikpO1xyXG4gICAgICBmcm9tVmlkZW9FdmVudCh0aGlzLnBsYXllciwgJ211dGVDaGFuZ2UnKS5waXBlKHRha2VVbnRpbERlc3Ryb3llZCh0aGlzLmRlc3Ryb3kpKVxyXG4gICAgICAgIC5zdWJzY3JpYmUoKFttdXRlXSkgPT4gdGhpcy56b25lRW1pdCh0aGlzLm11dGVDaGFuZ2UsIG11dGUpKTtcclxuICAgICAgZnJvbVZpZGVvRXZlbnQodGhpcy5wbGF5ZXIsICd2b2x1bWVDaGFuZ2UnKS5waXBlKHRha2VVbnRpbERlc3Ryb3llZCh0aGlzLmRlc3Ryb3kpKVxyXG4gICAgICAgIC5zdWJzY3JpYmUoKFt2b2x1bWVdKSA9PiB0aGlzLnpvbmVFbWl0KHRoaXMudm9sdW1lQ2hhbmdlLCB2b2x1bWUpKTtcclxuICAgICAgZnJvbVZpZGVvRXZlbnQodGhpcy5wbGF5ZXIsICdjYXBhYmlsaXRpZXNDaGFuZ2UnKS5waXBlKHRha2VVbnRpbERlc3Ryb3llZCh0aGlzLmRlc3Ryb3kpKVxyXG4gICAgICAgIC5zdWJzY3JpYmUoKFtjYXBhYmlsaXRpZXNdKSA9PiB0aGlzLnpvbmVFbWl0KHRoaXMuY2FwYWJpbGl0aWVzQ2hhbmdlLCBjYXBhYmlsaXRpZXMpKTtcclxuICAgICAgZnJvbVZpZGVvRXZlbnQodGhpcy5wbGF5ZXIsICdwcm9ncmVzc0NoYW5nZScpLnBpcGUodGFrZVVudGlsRGVzdHJveWVkKHRoaXMuZGVzdHJveSkpXHJcbiAgICAgICAgLnN1YnNjcmliZSgoW3Byb2dyZXNzXSkgPT4gdGhpcy56b25lRW1pdCh0aGlzLnByb2dyZXNzQ2hhbmdlLCBwcm9ncmVzcykpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBuZ09uRGVzdHJveSgpIHtcclxuICAgIHRoaXMucGxheWVyPy5kZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcbiIsIjxkaXYgI2NvbnRhaW5lcj48L2Rpdj4iXX0=