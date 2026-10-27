import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('@mintplayer/r-video-player');
});

test('shows the r-video-player version in the GitHub link', async ({
  page,
}) => {
  await page.goto('/');

  // 'dev' for an unstamped build, the released version for a stamped one.
  await expect(
    page.getByTitle('@mintplayer/r-video-player on GitHub').locator('span'),
  ).toHaveText(/^(dev|\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?)$/);
});
