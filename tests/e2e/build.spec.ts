import { type Page, expect, test } from '@playwright/test';
import { Resource, TileFlag } from '../../src/world/biomes';

/** Moves the camera to a buildable spot and returns the tile under the screen centre. */
async function setup(page: Page, extra = ''): Promise<{ x: number; z: number }> {
  await page.goto(`./?seed=e2e-build&r=3${extra}`);
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

test('drag previews and lays rail in one undo step', async ({ page }) => {
  await setup(page, '&mode=sandbox&speed=0&autosave=0');
  await page.locator('.mt-item[data-def=rail_track]').click();
  const box = (await page.locator('#app canvas').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 58, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 61, cy, { steps: 8 });
  const estimate = page.locator('.mt-panel h3');
  await expect(estimate).toHaveText(/^Đường ray × (?:[3-9]|[1-9]\d+)$/);
  const estimatedCount = Number((await estimate.textContent())!.split('×')[1]);
  await page.mouse.up();
  const count = await page.evaluate(() => window.__MYRIAD__!.buildingCount());
  expect(count).toBe(estimatedCount);
  await page.keyboard.press('Control+z');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(0);
  await page.keyboard.press('Control+y');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(count);
});

test('transport has its own tab and other tabs list unlocked buildings first', async ({ page }) => {
  await page.goto('./?mode=sandbox&unlock=0&seed=e2e-categories&r=2&speed=0&autosave=0');
  const buildItems = page.locator('.mt-items');
  await expect(buildItems.locator('[data-def=road]')).toBeVisible();
  await expect(buildItems.locator('[data-def=stockpile]')).toHaveCount(0);
  await expect(buildItems.locator('[data-def=grain_store]')).toHaveCount(0);
  await page.locator('.mt-tabs [data-cat=food]').click();
  await expect(buildItems.locator('[data-def=grain_store]')).toBeAttached();
  await page.locator('.mt-tabs [data-cat=production]').click();
  await expect(buildItems.locator('[data-def=stockpile]')).toBeAttached();
  await expect(buildItems.locator('.mt-item.locked').first()).toBeAttached();
  const order = await buildItems
    .locator('.mt-item')
    .evaluateAll((items) => items.map((item) => Number(item.classList.contains('locked'))));
  expect(order[0]).toBe(0);
  expect(order).toEqual([...order].sort());
});

test('deposit map is accessible and roads cover exposed rocks through undo and reload', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('./?mode=sandbox&seed=e2e-build&r=2&speed=0&autosave=0');
  const map = page.getByRole('button', { name: 'Bản đồ mỏ tài nguyên' });
  await map.click();
  await expect(map).toHaveAttribute('aria-pressed', 'true');
  const legend = page.locator('.mt-deposit-legend');
  await expect(legend).toContainText('Bãi đá');
  await expect(legend).toContainText('Mỏ đất sét');
  await expect(legend).toContainText('Quặng sắt');
  await expect(page.locator('.mt-heat-legend')).toBeHidden();
  await page.keyboard.press('KeyG');
  await expect(legend).toBeHidden();
  await page.waitForFunction(() => window.__MYRIAD__?.ready());
  const spot = await page.evaluate(
    ({ rock, stone }) => {
      const api = window.__MYRIAD__!;
      const camera = api.camera();
      const cx = Math.floor(camera.x);
      const cz = Math.floor(camera.z);
      for (let z = cz - 45; z <= cz + 45; z++) {
        for (let x = cx - 45; x <= cx + 45; x++) {
          const tile = api.terrainAt(x, z);
          if (
            tile.resource === stone &&
            (tile.loadedFlags ?? 0) & rock &&
            api.canPlace('road', x, z)
          )
            return { x, z };
        }
      }
      return null;
    },
    { rock: TileFlag.Rock, stone: Resource.Stone },
  );
  expect(spot).not.toBeNull();
  await page.evaluate((s) => window.__MYRIAD__!.teleport(s.x + 0.5, s.z + 0.5), spot!);
  const covered = () =>
    page.evaluate(
      ({ s, flag }) => Boolean((window.__MYRIAD__?.terrainAt(s.x, s.z).loadedFlags ?? 0) & flag),
      { s: spot!, flag: TileFlag.Covered },
    );
  expect(await page.evaluate((s) => window.__MYRIAD__!.place('road', s.x, s.z), spot!)).toBe(true);
  await expect.poll(covered).toBe(true);
  await page.evaluate(() => window.__MYRIAD__!.undo());
  await expect.poll(covered).toBe(false);
  await page.evaluate(() => window.__MYRIAD__!.redo());
  await expect.poll(covered).toBe(true);
  await page.waitForFunction(() => window.__MYRIAD__?.ready());
  expect(await page.evaluate(() => window.__MYRIAD__!.save())).toBe(true);
  await expect(page).toHaveURL(/load=/);
  await page.reload();
  await expect.poll(covered, { timeout: 30_000 }).toBe(true);
  expect(await page.evaluate((s) => window.__MYRIAD__!.terrainAt(s.x, s.z).resource, spot!)).toBe(
    Resource.Stone,
  );
  expect(await page.evaluate((s) => window.__MYRIAD__!.demolishAt(s.x, s.z), spot!)).toBe(true);
  await expect.poll(covered).toBe(false);
});
