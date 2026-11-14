import { expect, test } from '@playwright/test';

test.describe('debug overlay', () => {
  test('open /?debug=1: overlay visible, shows draw calls > 0, and F3 hides it', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&debug=1');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 15_000,
    });

    const overlay = page.locator('#debug-overlay');
    await expect(overlay).toBeVisible();

    // The overlay should display draw calls > 0
    await expect(overlay).toContainText(/Draw call.*: [1-9]\d*/);

    // Pressing F3 toggles visibility: becomes hidden
    await page.keyboard.press('F3');
    await expect(overlay).toBeHidden();

    // Pressing F3 again makes it visible
    await page.keyboard.press('F3');
    await expect(overlay).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('default: overlay is hidden until F3 is pressed', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 15_000,
    });

    const overlay = page.locator('#debug-overlay');
    await expect(overlay).toBeHidden();

    await page.keyboard.press('F3');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(/Draw call.*: [1-9]\d*/);

    expect(errors).toEqual([]);
  });
});
