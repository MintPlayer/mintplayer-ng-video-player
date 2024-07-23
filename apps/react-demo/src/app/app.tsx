// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';

import { RVideoPlayer } from '@mintplayer/r-video-player';
import { useState } from 'react';

import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  const [count, setCount] = useState(0);
  const [likes, setLikes] = useState(0);


  const incrementCount = () => {
    setCount(count + 1);
  };

  const incrementLikes = () => {
    setLikes(likes + 1);
  };

  return (
    <div>
      <RVideoPlayer title="react-demo" counter={count} likes={likes} />
      <button onClick={incrementCount}>Increment Count</button>
      <button onClick={incrementLikes}>Increment Likes</button>
      { count } / { likes }
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
