import { type Page, expect, test } from '@playwright/test';

/** Moves the camera to a buildable spot and returns the tile under the screen centre. */
async function setup(page: Page): Promise<{ x: number; z: number }> {
  await page.goto('./?seed=e2e-build&r=3');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const spot = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 1000, stone: 1000 });
    for (let r = 0; r < 40; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (const dz of [-r, r]) {
          // A 5×5 patch of land free for a hut, with room for a road below it.
          let ok = true;
          for (let a = -2; a <= 2 && ok; a++)
            for (let b = -2; b <= 2 && ok; b++) ok = A.canPlace('road', dx + a, dz + b);
          if (ok) return { x: dx, z: dz };
        }
      }
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.evaluate((s) => window.__MYRIAD__!.teleport(s.x + 0.5, s.z + 0.5), spot!);
  await page.waitForTimeout(1200); // camera easing + ground height settle
  return spot!;
}

test('place from the menu, undo with Ctrl+Z, demolish with X', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = await setup(page);
  await page.evaluate((s) => {
    for (let dx = -2; dx <= 2; dx++) window.__MYRIAD__!.place('road', s.x + dx, s.z + 2);
  }, s);
  const base = await page.evaluate(() => window.__MYRIAD__!.buildingCount());

  await page.getByRole('button', { name: /Nhà ở/ }).click();
  await page.locator('.mt-items button', { hasText: 'Lều tranh' }).click();
  const box = (await page.locator('canvas').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.move(cx + 1, cy + 1);
  await expect(page.locator('.mt-panel')).toBeVisible();
  await expect(page.locator('.mt-panel')).toContainText('Lều tranh');
  await page.mouse.click(cx, cy);
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(base + 1);

  await page.keyboard.press('Control+z');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(base);
  await page.keyboard.press('Control+y');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(base + 1);

  await page.keyboard.press('KeyX');
  await page.mouse.move(cx + 2, cy);
  await page.mouse.click(cx, cy);
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(base);
  expect(errors).toEqual([]);
});

test('drag lays a road in one undo step', async ({ page }) => {
  await setup(page);
  const base = await page.evaluate(() => window.__MYRIAD__!.buildingCount());
  await expect(page.getByRole('button', { name: 'Hạ tầng' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.locator('.mt-items button', { hasText: 'Đường đất' }).click();
  const box = (await page.locator('canvas').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 60, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy, { steps: 10 });
  await page.mouse.up();
  const placed = (await page.evaluate(() => window.__MYRIAD__!.buildingCount())) - base;
  expect(placed).toBeGreaterThan(2);
  await page.keyboard.press('Control+z');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(base);
});
