import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from "@mintplayer/video-player";
import { youtubePlugin } from '@mintplayer/youtube-player';
import { dailymotionPlugin } from '@mintplayer/dailymotion-player';
import { vimeoPlugin } from '@mintplayer/vimeo-player';
import { soundCloudPlugin } from '@mintplayer/soundcloud-player';
import { mixCloudPlugin } from '@mintplayer/mixcloud-player';
import { twitchPlugin } from '@mintplayer/twitch-player';
import { spotifyPlugin } from '@mintplayer/spotify-player';
import { streamablePlugin } from '@mintplayer/streamable-player';
import { facebookPlugin } from '@mintplayer/facebook-player';
import { filePlugin } from '@mintplayer/file-player';
import { vidyardPlugin } from '@mintplayer/vidyard-player';
import { wistiaPlugin } from '@mintplayer/wistia-player';
import styles from './r-video-player.module.scss';
import { EPlayerState } from '@mintplayer/player-provider';

export namespace ReactX {
  export type State<T> = [T, React.Dispatch<React.SetStateAction<T>>]
}

export interface RVideoPlayerInput {
  url?: string;
  volumeState: ReactX.State<number>;
  muteState: ReactX.State<boolean>;
  playerStateState: ReactX.State<EPlayerState>;
}

export function RVideoPlayer({ url, volumeState, muteState, playerStateState }: RVideoPlayerInput) {

  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [volume, setVolume] = volumeState;
  const [mute, setMute] = muteState;
  const [playerState, setPlayerState] = playerStateState;
  const [player, setPlayer] = useState<VideoPlayer>();

  useEffect(() => {
    Promise.all([youtubePlugin, dailymotionPlugin, vimeoPlugin, soundCloudPlugin, mixCloudPlugin, twitchPlugin, spotifyPlugin, streamablePlugin, facebookPlugin, filePlugin, vidyardPlugin, wistiaPlugin]
      .map(loader => loader())
    ).then((apis) => {
      if (!player) {
        setPlayer(new VideoPlayer(videoContainerRef.current!, apis));
      }
    });
  }, []);

  useEffect(() => {
    player && (player.url = url);
  }, [url]);

  useEffect(() => {
    player && (player.volume = volume);
  }, [volume]);
  
  useEffect(() => {
    player && player.on('volumeChange', (vol) => setVolume(vol));
  }, [player]);

  useEffect(() => {
    player && (player.mute = mute);
  }, [mute]);

  useEffect(() => {
    player && player.on('muteChange', (mute) => {
      setMute(mute);
    });
  }, [player]);

  useEffect(() => {
    player && (player.playerState = playerState);
  }, [playerState]);

  useEffect(() => {
    player && player.on('stateChange', (state) => {
      setPlayerState(state);
    });
  }, [player])

  return (
    <div className={styles['container']}>
      <div ref={videoContainerRef}></div>
    </div>
  );
}

export default RVideoPlayer;
