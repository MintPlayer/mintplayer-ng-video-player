import { displayVersion } from './video-player-version.provider';

describe('displayVersion', () => {
  it('shows a stamped version unchanged', () => {
    expect(displayVersion('4.2.0')).toBe('4.2.0');
    expect(displayVersion('5.0.0-next.1')).toBe('5.0.0-next.1');
  });

  it('shows dev for the unstamped placeholder', () => {
    expect(displayVersion('0.0.0-PLACEHOLDER')).toBe('dev');
  });
});
