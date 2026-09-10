import { PlayerProgress } from './index';

/**
 * This package is types only — there is no runtime code to exercise, so the
 * point of this spec is that the barrel still resolves and the shape still
 * looks the way every consumer destructures it. Without it the project emits
 * no coverage report at all, and a library missing from the report is
 * indistinguishable from a library at 100%.
 */
describe('@mintplayer/player-progress', () => {
  it('re-exports PlayerProgress through the package barrel', () => {
    const progress: PlayerProgress = { currentTime: 12, duration: 300 };

    expect(progress.currentTime).toBe(12);
    expect(progress.duration).toBe(300);
  });

  it('describes progress in seconds on both members', () => {
    // Both halves are plain numbers of seconds, which is what lets the
    // VideoPlayer combine two independent adapter callbacks into one event.
    const progress: PlayerProgress = { currentTime: 0, duration: 0 };

    expect(typeof progress.currentTime).toBe('number');
    expect(typeof progress.duration).toBe('number');
  });
});
