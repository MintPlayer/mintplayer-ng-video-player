// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from "react";
import styles from './app.module.scss';

import { RVideoPlayer } from './nx-welcome';

import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  const videos: string[] = [
    'https://www.youtube.com/watch?v=tt2k8PGm-TI',
    'https://www.youtube.com/watch?v=YykjpeuMNEk',
    'https://www.youtube.com/watch?v=yFKhgF_vkgs',
    'https://www.youtube.com/live/gCNeDWCI0vo?app=desktop&feature=share',
    'https://vimeo.com/14190306',
    'https://vimeo.com/82932655',
    'https://soundcloud.com/dario-g/sunchyme-radio-edit',
    'https://soundcloud.com/oasisofficial/whatever',
    'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
    'spotify:track:0FDzzruyVECATHXKHFs9eJ',
    'https://www.twitch.tv/jankos',
    'https://www.twitch.tv/dearlola1',
    'https://www.twitch.tv/videos/1920198035',
    'https://www.mixcloud.com/TheChilloutTent/the-chill-out-tent-warriors-of-the-dystotheque',
    'https://www.mixcloud.com/gaby-songs/chillout-your-mind-vol32',
    'https://www.mixcloud.com/radiomonaco/good-vibes-djm4t-29092023',
    'https://www.facebook.com/MetaCanada/videos/801193189918934',
    'https://www.facebook.com/iShareitHD/videos/1269681903839169',
    'https://www.facebook.com/watch/?v=379257177188135',
    'https://video.vidyard.com/watch/6eK8VUFScWLqX2PqgF5S44?',
    'https://video.vidyard.com/watch/TKMKV6sdGhz3Fz5vgAAAw9?',
    'https://home.wistia.com/medias/e4a27b971d',
    'https://home.wistia.com/medias/29b0fbf547',
    'https://streamable.com/moo',
    'https://streamable.com/ifjh',
  ];

  const [url, setUrl] = React.useState<string | null>(null);

  function playVideo(value: string) {
    // console.log('value', {value});
    setUrl(value);
  }

  const listItems = videos.map(video => <li key={video} onClick={() => playVideo(video)} className='list-group-item cursor-pointer'>{video}</li>);

  return (
    <div>
      <div className='d-block text-center'>
        <RVideoPlayer videoUrl={url} />
      </div>
      <div className='d-block'>
        <ul className='list-group'>{listItems}</ul>
      </div>


      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>
            </div>
          }
        />
      </Routes>
      {/* END: routes */}
    </div>
  );
}

export default App;
