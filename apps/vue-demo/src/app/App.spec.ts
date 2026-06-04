import { describe, it, expect } from 'vitest';
import router from '../router';
import { mount } from '@vue/test-utils';
import App from './App.vue';

describe('App', () => {
  it('renders properly', async () => {
    // Stub VVideoPlayer: mounting the real player kicks off provideVideoApis'
    // lazy `import('../api')` for every platform, which settle after the test
    // tears down and surface as an EnvironmentTeardownError. The heading lives
    // in HomeView alongside the player, so stubbing it keeps this assertion.
    const wrapper = mount(App, {
      global: { plugins: [router], stubs: { VVideoPlayer: true } },
    });
    await router.isReady();
    expect(wrapper.text()).toContain('@mintplayer/v-video-player');
  });
});
