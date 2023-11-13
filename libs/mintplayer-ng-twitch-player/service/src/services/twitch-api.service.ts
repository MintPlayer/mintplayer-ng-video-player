// https://dev.twitch.tv/docs/embed/video-and-clips/#interactive-frames-for-live-streams-and-vods

import { ECapability, EPlayerState, IApiService, PlayerAdapter, PlayerOptions, PrepareHtmlOptions, createPlayerAdapter } from '@mintplayer/ng-player-provider';
import { loadScript } from '@mintplayer/script-loader';
import { Subject, takeUntil, timer } from 'rxjs';

export class TwitchApiService implements IApiService {
  
  public get id() {
    return 'twitch';
  }

  public urlRegexes = [
    new RegExp(/https?:\/\/(www\.)?twitch\.tv\/(?<channel>[0-9A-Za-z]+)$/, 'g'),
    new RegExp(/https?:\/\/(www\.)?twitch\.tv\/videos\/(?<video>[0-9A-Za-z]+)$/, 'g'),
  ];

  public loadApi() {
    return loadScript('https://player.twitch.tv/js/embed/v1.js');
  }

  public prepareHtml(options: PrepareHtmlOptions) {
    return `<div id="${options.domId}" style="max-width:100%"></div>`;
  }

  public match2id(match: RegExpExecArray) {
    if (!match.groups) {
      return '';
    } else {
      return JSON.stringify({
        channel: match.groups['channel'],
        video: match.groups['video'],
        collection: match.groups['collection'],
      });
    }
  }

  public createPlayer(options: PlayerOptions, componentDestroy: Subject<boolean>): Promise<PlayerAdapter> {
    return new Promise((resolvePlayer, rejectPlayer) => {
      if (!options.domId) {
        return rejectPlayer('The Twitch api requires the options.domId to be set');
      }

      if (!options.initialVideoId) {
        return rejectPlayer('The Twitch api requires either channel, video or collection to be set');
      }

      const data = <TwitchVideoRequest>JSON.parse(options.initialVideoId);
      if (!data || (!data.channel && !data.video && !data.collection)) {
        return rejectPlayer('The Twitch api requires either channel, video or collection to be set');
      }

      const destroyRef = new Subject();
      let adapter: PlayerAdapter;
      const player = new Twitch.Player(options.domId, {
        width: options.width,
        height: options.height,
        channel: data.channel,
        video: data.video,
        collection: data.collection,
      });

      player.addEventListener(Twitch.Player.READY, () => {
        adapter = createPlayerAdapter({
          capabilities: [ECapability.mute, ECapability.volume, ECapability.getTitle],
          loadVideoById: (id: string) => {
            const data = <TwitchVideoRequest>JSON.parse(id);
            if (data.video) {
              player.setVideo(data.video, 0);
            } else if (data.channel) {
              player.setChannel(data.channel);
            } else if (data.collection) {
              player.setCollection(data.collection)
            } else {
              throw 'You must pass a video, channel or collection';
            }
          },
          setPlayerState: (state: EPlayerState) => {
            switch (state) {
              case EPlayerState.playing:
                player.play();
                break;
              case EPlayerState.paused:
                player.pause();
                break;
            }
          },
          setMute: (mute) => player.setMuted(mute),
          setVolume: (volume) => player.setVolume(volume / 100),
          setProgress: (time) => player.seek(time),
          setSize: (width, height) => {
            const iframe = options.element.getElementsByTagName('iframe')[0];
            iframe.width = String(width);
            iframe.height = String(height);
          },
          getTitle: () => new Promise((resolve) => {
            const fragments = [player.getChannel(), player.getVideo()].filter(x => !!x);
            resolve(fragments.join(' - '));
          }),
          setFullscreen: (isFullscreen) => {
            if (isFullscreen) {
              console.warn('Twitch player doesn\'t support Fullscreen mode');
              setTimeout(() => adapter.onFullscreenChange(false), 50);
            }
          },
          getFullscreen: () => new Promise((resolve) => resolve(false)),
          setPip: (isPip) => {
            if (isPip) {
              console.warn('Twitch player doesn\'t support PIP mode');
              setTimeout(() => adapter.onPipChange(false), 50);
            }
          },
          getPip: () => new Promise((resolve) => resolve(false)),
          destroy: () => {
            player.destroy();
            destroyRef.next(true);
          }
        });

        if (typeof window !== 'undefined') {
          timer(0, 50)
            .pipe(takeUntil(destroyRef), takeUntil(componentDestroy))
            .subscribe(() => {
              adapter.onMuteChange(player.getMuted());
              adapter.onVolumeChange(player.getVolume() * 100);
              adapter.onCurrentTimeChange(player.getCurrentTime());
            });
        }

        resolvePlayer(adapter);
      });

      player.addEventListener(Twitch.Player.PLAY, () => {
        adapter.onStateChange(EPlayerState.playing);
        adapter.onDurationChange(player.getDuration());
      });
      player.addEventListener(Twitch.Player.PAUSE, () => adapter.onStateChange(EPlayerState.paused));
      player.addEventListener(Twitch.Player.ENDED, () => adapter.onStateChange(EPlayerState.ended));
      player.addEventListener(Twitch.Player.SEEK, () => {
        adapter.onCurrentTimeChange(player.getCurrentTime());
      });
    });
  }
  
}

interface TwitchVideoRequest {
  channel?: string;
  video?: string;
  collection?: string;
}