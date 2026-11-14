import { expect, test } from '@playwright/test';

test('game boots, renders WebGL and shows the HUD', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('./?seed=42');
  await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
    timeout: 15_000,
  });

  const ready = await page.evaluate(() => window.__MYRIAD_READY__);
  expect(ready?.seed).toBe(42);
  await expect(page.locator('#hud')).toContainText('Myriad Towns');
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
