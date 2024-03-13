// import { BehaviorSubject, combineLatest, Observable, Subject, takeUntil } from 'rxjs';
// import { VideoRequest } from './video-request';

// export class VideoPlayerCoreComponent {
//     constructor(private destroy: Subject<boolean>) {
//         this.videoRequest$
//           .pipe(takeUntil(destroy))
//           .subscribe(videoRequest => {
//             if (videoRequest) {
//               videoRequest.api.loadApi().then(() => {
//                 if ((videoRequest.api.id === this.playerInfo?.platformId) && (videoRequest.api.canReusePlayer !== false)) {
//                   this.playerInfo?.adapter.loadVideoById(videoRequest.id);
//                 } else {
//                   this.playerInfo?.adapter?.destroy();
//                   setHtml(videoRequest);
//                   videoRequest.api.createPlayer({
//                     width: this.width,
//                     height: this.height,
//                     autoplay: this.autoplay,
//                     domId: this.domId,
//                     element: this.container.nativeElement,
//                     initialVideoId: videoRequest.id,
//                   }, this.destroyed$).then(adapter => {
//                     this.playerInfo = {
//                       platformId: videoRequest.api.id,
//                       videoId: videoRequest.id,
//                       adapter: adapter,
//                     };
    
//                     adapter.onStateChange = (state) => this.playerStateObserver$.next(state);
//                     adapter.onMuteChange = (mute) => this.muteObserver$.next(mute);
//                     adapter.onVolumeChange = (volume) => this.volumeObserver$.next(volume);
//                     adapter.onCurrentTimeChange = (progress) => this.currentTimeObserver$.next(progress);
//                     adapter.onDurationChange = (duration) => this.durationObserver$.next(duration);
//                     adapter.onPipChange = (isPip) => this.pipObserver$.next(isPip);
//                     adapter.onFullscreenChange = (isFullscreen) => this.fullscreenObserver$.next(isFullscreen);
//                     this.capabilitiesChange.emit(adapter.capabilities);
//                   }).then(() => {
//                     if (videoRequest !== null) {
//                       if (typeof videoRequest.id !== 'undefined') {
//                         this.playerInfo?.adapter.loadVideoById(videoRequest.id);
//                       }
//                     }
//                   });
    
//                   this.pipObserver$.next(false);
//                   this.fullscreenObserver$.next(false);
//                 }
//               });
    
//             } else {
//               // Cancel all timers / Clear the html
//               this.playerInfo?.adapter?.destroy();
//               if (this.container && this.container.nativeElement) {
//                 this.container.nativeElement.innerHTML = '';
//               }
//             }
//           });
//     }

//     private videoRequest$ = new BehaviorSubject<VideoRequest | null>(null);
// }