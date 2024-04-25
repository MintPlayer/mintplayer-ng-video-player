import { useEffect, useRef, useState } from "react";
import { ApiLoader, IApiService } from '@mintplayer/player-provider';
import { youtubeLoader } from '@mintplayer/youtube-player';
import { vimeoLoader } from '@mintplayer/vimeo-player';
import { soundCloudLoader } from '@mintplayer/soundcloud-player';
import { mixCloudLoader } from '@mintplayer/mixcloud-player';
import { twitchLoader } from '@mintplayer/twitch-player';
import { spotifyLoader } from '@mintplayer/spotify-player';
import { streamableLoader } from '@mintplayer/streamable-player';
import { facebookLoader } from '@mintplayer/facebook-player';
import { fileLoader } from '@mintplayer/file-player';
import { vidyardLoader } from '@mintplayer/vidyard-player';
import { wistiaLoader } from '@mintplayer/wistia-player';
import { VideoPlayer } from '@mintplayer/video-player';

export interface VideoPlayerData {
  videoUrl: string | null;
}

/*
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 This is a starter component and can be deleted.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 Delete this file and get started with your project!
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
// export function NxWelcome({ title }: NxWelcomeData) {
//   return (
//     <>
//       <div className="wrapper">
        
//       </div>
//     </>
//   );

//   useEffect(() => {

//   }, [])
// }

// export default NxWelcome;

export function RVideoPlayer({videoUrl}: VideoPlayerData) {

  const rootElement = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false)
  useEffect(() => {
    if (didMountRef.current) {
      const apiLoaders: ApiLoader[] = [
        youtubeLoader,
        vimeoLoader,
        soundCloudLoader,
        mixCloudLoader,
        twitchLoader,
        spotifyLoader,
        streamableLoader,
        facebookLoader,
        fileLoader,
        vidyardLoader,
        wistiaLoader,
      ];
  
      Promise.all(apiLoaders.map(loader => loader())).then((apis) => {
        const player = new VideoPlayer(rootElement.current!, apis);
        player.url = videoUrl;
      });
    } else didMountRef.current = true
  });

  // componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any) {
  //   console.log('changed', {prevProps, prevState, snapshot});
  // }

  // const [url, setUrl] = useState(null);

  // useEffect(() => {
  //   // console.log('test', {url, setUrl});
  // }, [videoUrl]);

  return (
    <div ref={rootElement}>Test</div>
  )

  // componentDidMount() {
  // }
}