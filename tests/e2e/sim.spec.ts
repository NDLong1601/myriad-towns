import { type Page, expect, test } from '@playwright/test';

/** Paused game, camera on a flat buildable patch; returns its corner tile. */
async function setup(page: Page): Promise<{ x: number; z: number }> {
  await page.goto('./?seed=e2e-sim&r=3&speed=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const spot = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 5000, stone: 5000, food: 500 });
    for (let r = 0; r < 60; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (const dz of [-r, r]) {
          let ok = true;
          for (let a = 0; a < 14 && ok; a++)
            for (let b = -3; b <= 2 && ok; b++) ok = A.canPlace('road', dx + a, dz + b);
          if (ok) return { x: dx, z: dz };
        }
      }
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.evaluate((s) => window.__MYRIAD__!.teleport(s.x + 6, s.z), spot!);
  await page.waitForTimeout(1000);
  return spot!;
}

test('a village grows: huts upgrade near a well, the panel explains, toasts announce', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = await setup(page);
  const placed = await page.evaluate((s) => {
    const A = window.__MYRIAD__!;
    let n = 0;
    for (let i = 0; i < 14; i++) A.place('road', s.x + i, s.z);
    for (let i = 0; i < 12; i++) if (A.place('hut', s.x + i, s.z + 1)) n++;
    for (let i = 0; i < 3; i++) A.place('berry_field', s.x + i * 2, s.z - 2);
    return n;
  }, s);
  expect(placed).toBe(12);
  // 12 huts × 4 = 48 people ≥ 40: cottages unlock.
  await page.evaluate(() => window.__MYRIAD__!.tick(8));
  expect(await page.evaluate(() => window.__MYRIAD__!.population())).toBe(48);
  await expect(page.locator('.mt-toast', { hasText: /Mở khoá/ })).toBeVisible();
  await page.evaluate((s) => window.__MYRIAD__!.place('well', s.x + 2, s.z + 2), s);
  await page.evaluate(() => window.__MYRIAD__!.tick(16));
  expect(await page.evaluate((s) => window.__MYRIAD__!.buildingAt(s.x + 2, s.z + 1), s)).toBe(
    'cottage',
  );
  await expect(page.locator('.mt-toast', { hasText: /nâng cấp/ })).toBeVisible();
  await expect(page.locator('.mt-simbar')).toContainText('Dân số');

  // Remove the well: cottages lose water, get a warning, then decline back to huts.
  await page.evaluate((s) => window.__MYRIAD__!.demolishAt(s.x + 2, s.z + 2), s);
  await page.evaluate(() => window.__MYRIAD__!.tick(48));
  const st = await page.evaluate((s) => window.__MYRIAD__!.statusAt(s.x + 2, s.z + 1), s);
  expect(st?.problems).toContain('req.fieldMin');
  expect(st?.declineIn).not.toBeNull();
  await expect(page.locator('.mt-toast.warn')).toBeVisible();
  await page.evaluate(() => window.__MYRIAD__!.tick(120));
  expect(await page.evaluate((s) => window.__MYRIAD__!.buildingAt(s.x + 2, s.z + 1), s)).toBe(
    'hut',
  );
  expect(errors).toEqual([]);
});

test('speed buttons and Space control the clock', async ({ page }) => {
  await setup(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.speed())).toBe(0);
  await page.locator('[data-speed="4"]').click();
  expect(await page.evaluate(() => window.__MYRIAD__!.speed())).toBe(4);
  const t0 = await page.evaluate(() => window.__MYRIAD__!.stats().tick);
  // Software rendering is slow here, so wait for ticks rather than a fixed time.
  await expect
    .poll(() => page.evaluate(() => window.__MYRIAD__!.stats().tick), { timeout: 30_000 })
    .toBeGreaterThan(t0 + 8);
  await page.locator('canvas').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.__MYRIAD__!.speed())).toBe(0);
});

test('heatmap key toggles a field overlay; plan mode drafts then builds', async ({ page }) => {
  const s = await setup(page);
  await page.evaluate((s) => {
    const A = window.__MYRIAD__!;
    A.place('well', s.x + 3, s.z + 1);
  }, s);
  await page.keyboard.press('Digit1');
  await expect(page.locator('.mt-heat select')).toHaveValue('water_access');
  await expect(page.locator('.mt-heat-legend')).toBeVisible();
  await page.keyboard.press('Digit1');
  await expect(page.locator('.mt-heat select')).toHaveValue('');

  await page.keyboard.press('KeyP');
  await expect(page.locator('.mt-planbar')).toHaveClass(/on/);
  const before = await page.evaluate(() => window.__MYRIAD__!.buildingCount());
  await page.evaluate((s) => {
    const A = window.__MYRIAD__!;
    for (let i = 0; i < 5; i++) A.plan('road', s.x + i, s.z);
    A.plan('hut', s.x, s.z + 1);
  }, s);
  // Drafts cost nothing and are not buildings.
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(before);
  await expect(page.locator('.mt-planbar')).toContainText('6 bản nháp');
  await page.locator('.mt-planbar [data-act=build]').click();
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(before + 6);
  // One undo step removes the whole plan build.
  await page.keyboard.press('Control+z');
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(before);
});
