import { render } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(getByText(/@mintplayer\/r\-video\-player/i)).toBeTruthy();
  });

  it('shows the r-video-player version in the GitHub link', () => {
    const { getByTitle } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    const link = getByTitle('@mintplayer/r-video-player on GitHub');
    expect(link.querySelector('span')?.textContent).toMatch(
      /^(dev|\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?)$/,
    );
  });
});
