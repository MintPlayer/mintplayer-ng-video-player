// eslint-disable-next-line @typescript-eslint/no-unused-vars
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './app.module.scss';

import { RVideoPlayer } from '@mintplayer/r-video-player';
import { useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';

import { Route, Routes, Link } from 'react-router-dom';
import { EPlayerState } from '@mintplayer/player-provider';

export function App() {
  const urlState = useState<string | undefined>();
  const volumeState = useState<number>(0);
  const muteState = useState<boolean>(false);
  const muteRef = useRef<HTMLInputElement>(null);
  const playerStateState = useState<EPlayerState>(EPlayerState.unstarted);
  
  const [url, setUrl] = urlState;
  const [volume, setVolume] = volumeState;
  const [mute, setMute] = muteState;
  const [playerState, setPlayerState] = playerStateState;
  const videos = [
    'https://www.youtube.com/watch?v=tt2k8PGm-TI',
    'https://www.youtube.com/watch?v=YykjpeuMNEk',
    'https://www.youtube.com/watch?v=yFKhgF_vkgs',
    'https://www.youtube.com/live/gCNeDWCI0vo?app=desktop&feature=share',
    'https://www.dailymotion.com/video/x2yhuhb',
    'https://www.dailymotion.com/video/x20zq3f',
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

  return (
    <>
      <h1 className='text-center'>@mintplayer/r-video-player</h1>
      <Container>
        <Row className='mb-3'>
          <Col lg="6">
            <ListGroup className='mb-3'>
              {videos.map(video => <ListGroupItem onClick={() => setUrl(video)} className='cursor-pointer overflow-hidden text-truncate truncate-start'>{video}</ListGroupItem>)}
            </ListGroup>
          </Col>
          <Col lg="6" className='text-center'>
            <div className='d-block text-center'>
              <RVideoPlayer url={url} volumeState={volumeState} muteState={muteState} playerStateState={playerStateState} />
              <Row>
                <Col md="6" className='text-center'>
                </Col>
                <Col md="6" className='text-center'>
                  {
                    (playerState !== EPlayerState.playing)
                    ? <Button variant='secondary' onClick={() => setPlayerState(EPlayerState.playing)}>Play</Button>
                    : <Button variant='secondary' onClick={() => setPlayerState(EPlayerState.paused)}>Pause</Button>
                  }
                </Col>
              </Row>
              <Row>
                <Col md="6" className='text-center'>
                  <label>
                    <label>{ volume }</label>
                    <Form.Range value={volume} onChange={(ev) => setVolume(parseFloat(ev.currentTarget.value))} min="0" max="100" />
                  </label>
                </Col>
                <Col md="6" className='text-center'>
                  <Form.Check type='checkbox' label='Mute' ref={muteRef} checked={mute} onChange={ev => setMute(ev.currentTarget.checked)} />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
      <ButtonGroup>
        {/* <Button onClick={incrementVolume} variant="primary">Increment Volume</Button>
        <Button onClick={incrementLikes} variant="primary">Increment Likes</Button> */}
      </ButtonGroup>

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
    </>
  );
}

export default App;
