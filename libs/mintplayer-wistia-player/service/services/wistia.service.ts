import { loadScript } from '@mintplayer/script-loader';
import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/player-provider';
import { Subject } from 'rxjs';

// https://wistia.com/support/developers/player-api#volumechange

export class WistiaService implements IApiService {

  public get id() {
    return 'wistia';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.|home\.)?wistia\.(com|net)\/(medias|embed)\/(?<id>[0-9A-Za-z]+)/),
  ];

  loadApi() {
    return loadScript('https://fast.wistia.com/assets/external/E-v1.js', { async: true });
  }

  prepareHtml(options: PrepareHtmlOptions) {
    if (!options.domId) {
      throw 'The Wistia api requires the options.domId to be set';
    }

    if (!options.initialVideoId) {
      throw 'The Wistia api requires an initial video id';
    }

    return `<div id="${options.domId}" key="${options.initialVideoId}" class="wistia_embed wistia_async_${options.initialVideoId}" style="width:${options.width ?? 640}px;height:${options.height ?? 360}px;max-width:100%"></div>`;
  }

  public get canReusePlayer() {
    return false;
  }

  createPlayer(options: PlayerOptions, destroy: Subject<boolean>) {
    return new Promise<PlayerAdapter>((resolvePlayer, rejectPlayer) => {
      if (typeof window !== 'undefined') {
        // Do not resolve this promise during SSR
        return;
      }

      if (!options.domId) {
        return rejectPlayer('The YouTube api requires the options.domId to be set');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('The Wistia implementation requires an initial video');
      }

      // TODO: this can probably be moved to a variable on this class
      const wq: (WistiaRequest | WistiaRevokeRequest)[] = (<any>window)._wq = (<any>window)._wq || [];
      const request: WistiaRequest = {
        id: options.domId,
        onReady: (player) => {
          const destroyRef = new Subject();
          const adapter = createPlayerAdapter({
            capabilities: [ECapability.mute, ECapability.volume, ECapability.fullscreen, ECapability.getTitle],
            loadVideoById: (id: string) => {
              player.addToPlaylist(id);
              if (options.autoplay) {
                setTimeout(() => player.play(), 20);
              }
              adapter.onVolumeChange(player.volume() * 100);
            },
            setPlayerState: (state) => {
              switch (state) {
                case EPlayerState.playing:
                  player.play();
                  break;
                case EPlayerState.paused:
                  player.pause();
                  break;
                }
            },
            setMute: (mute) => {
              if (mute) player.mute();
              else player.unmute();
            },
            setVolume: (volume) => player.volume(volume / 100),
            setProgress: (time) => player.time(time),
            setSize: (width, height) => {
              player.width(width);
              player.height(height);
            },
            getTitle: () => new Promise(resolve => resolve(player.name())),
            setFullscreen: (isFullscreen) => {
              if (isFullscreen) {
                player.requestFullscreen();
              } else {
                player.cancelFullscreen();
              }
            },
            getFullscreen: () => new Promise(resolve => resolve(player.inFullscreen())),
            setPip: (isPip) => {
              if (isPip) {
                console.warn('Wistia player doesn\'t support PIP mode');
                setTimeout(() => adapter.onPipChange(false), 50);
              }
            },
            getPip: () => new Promise((resolve) => resolve(false)),
            destroy: () => {
              player.unbind('play', handlers.get('play'));
              player.unbind('pause', handlers.get('pause'));
              player.unbind('end', handlers.get('end'));
              player.unbind('mutechange', handlers.get('mutechange'));
              player.unbind('volumechange', handlers.get('volumechange'));
              player.unbind('timechange', handlers.get('timechange'));
              player.unbind('enterfullscreen', handlers.get('enterfullscreen'));
              player.unbind('cancelfullscreen', handlers.get('cancelfullscreen'));
              // player.unbind('betweentimes', handlers.get('betweentimes'));
              // player.unbind('crosstime', handlers.get('crosstime'));
      
              player.remove();
              destroyRef.next(true);
              wq.push({ revoke: request });
            }
          });
          
          const handlers = new Map<keyof Wistia.WistiaEventMap, any>();
          handlers.set('play', () => {
            adapter.onStateChange(EPlayerState.playing);
            adapter.onDurationChange(player.duration());
          });
          handlers.set('pause', () => adapter.onStateChange(EPlayerState.paused));
          handlers.set('end', () => adapter.onStateChange(EPlayerState.ended));
          handlers.set('volumechange', (volume: number) => adapter.onVolumeChange(volume * 100));
          handlers.set('timechange', (seconds: number) => adapter.onCurrentTimeChange(seconds));
          handlers.set('mutechange', (isMuted: boolean) => adapter.onMuteChange(isMuted));
          handlers.set('enterfullscreen', () => adapter.onFullscreenChange(true));
          handlers.set('cancelfullscreen', () => adapter.onFullscreenChange(false));
          // handlers.set('betweentimes', (val: any) => console.log('val', val));
          // handlers.set('crosstime', () => console.log('crosstime'));

          player.bind('play', handlers.get('play'));
          player.bind('pause', handlers.get('pause'));
          player.bind('end', handlers.get('end'));
          player.bind('timechange', handlers.get('timechange'));
          player.bind('mutechange', handlers.get('mutechange'));
          player.bind('volumechange', handlers.get('volumechange'));
          player.bind('enterfullscreen', handlers.get('enterfullscreen'));
          player.bind('cancelfullscreen', handlers.get('cancelfullscreen'));
          // player.bind('betweentimes', 30, 60, handlers.get('betweentimes'));
          // player.bind('crosstime', 30, handlers.get('crosstime'));

          console.warn('player', player);

          resolvePlayer(adapter);
        }
      };
      wq.push(request);
    });
  }

}

export interface WistiaRequest {
  id: string;
  onReady: (video: Wistia.Player) => void;
}

export interface WistiaRevokeRequest {
  revoke: WistiaRequest;
}


export interface AddToPlaylistOptions {
  playerColor: HtmlColor;
}

export type HtmlColor = 
  `#${string}` |
  `rgb(${number}, ${number}, ${number})` |
  `rgba(${number}, ${number}, ${number}, ${number})`;
