import { type Page, expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
}

test('placing a building pops it in, then it settles', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-pop&speed=0&autosave=0');
  await ready(page);
  const placed = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 500, stone: 500 });
    for (let r = 0; r < 40; r++)
      for (let dx = -r; dx <= r; dx++) if (A.canPlace('road', dx, r)) return A.place('road', dx, r);
    return false;
  });
  expect(placed).toBe(true);
  expect(await page.evaluate(() => window.__MYRIAD__!.audio().popping)).toBeGreaterThan(0);
  await page.waitForFunction(() => window.__MYRIAD__!.audio().popping === 0, null, {
    timeout: 15_000,
  });
  expect(errors).toEqual([]);
});

test('time of day follows game ticks and can be fixed', async ({ page }) => {
  await page.goto('./?mode=sandbox&seed=e2e-day&speed=0&autosave=0');
  await ready(page);
  const t0 = await page.evaluate(() => window.__MYRIAD__!.timeOfDay());
  expect(t0).not.toBeNull();
  await page.evaluate(() => window.__MYRIAD__!.tick(600));
  await page.waitForFunction(
    (before) => {
      const now = window.__MYRIAD__!.timeOfDay();
      return now !== null && Math.abs(now - (before as number) - 0.25) < 0.01;
    },
    t0,
    { timeout: 10_000 },
  );
  await page.evaluate(() => window.__MYRIAD__!.timeOfDay(0.95));
  await page.waitForFunction(() => window.__MYRIAD__!.timeOfDay() === 0.95);
});

test('?daynight=0 keeps the fixed daylight', async ({ page }) => {
  await page.goto('./?mode=sandbox&seed=e2e-day&speed=0&autosave=0&daynight=0');
  await ready(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.timeOfDay())).toBeNull();
});

test('audio starts on the first click; mute is remembered', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-audio&speed=0&autosave=0');
  await ready(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.audio().started)).toBe(false);
  const mute = page.locator('.mt-mute');
  await expect(mute).toHaveText('🔊');
  await mute.click();
  await expect(mute).toHaveText('🔇');
  const a = await page.evaluate(() => window.__MYRIAD__!.audio());
  expect(a.started).toBe(true);
  expect(a.muted).toBe(true);
  await page.reload();
  await ready(page);
  await expect(page.locator('.mt-mute')).toHaveText('🔇');
  expect(errors).toEqual([]);
});
