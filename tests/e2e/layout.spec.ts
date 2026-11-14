import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('resources form a column; minimap and heat map have corner toggles that persist', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 760 });
  await page.goto('./?mode=sandbox&seed=e2e-layout&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });

  // Resource chips stack vertically in the top-right corner.
  const chips = page.locator('.mt-resources span');
  expect(await chips.count()).toBeGreaterThanOrEqual(3);
  const a = (await chips.nth(0).boundingBox())!;
  const b = (await chips.nth(1).boundingBox())!;
  expect(b.y).toBeGreaterThan(a.y + a.height - 1);
  expect(Math.abs(b.x - a.x)).toBeLessThan(2);

  // The minimap sits on the left, the heat map panel on the right.
  const map = page.locator('.mt-minimap');
  await expect(map).toBeVisible();
  expect((await map.boundingBox())!.x).toBeLessThan(100);
  const heat = page.locator('.mt-heat');
  await expect(heat).toBeVisible();
  const mapButton = page.locator('.mt-minimap-btn');
  const heatButton = page.locator('.mt-heat-btn');

  for (const viewport of [
    { width: 1280, height: 760 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    const left = (await mapButton.boundingBox())!;
    const right = (await heatButton.boundingBox())!;
    const minimap = (await map.boundingBox())!;
    const panel = (await heat.boundingBox())!;
    expect(right.y).toBeCloseTo(left.y, 0);
    expect(right.width).toBe(left.width);
    expect(minimap.y + minimap.height).toBeLessThan(left.y);
    expect(panel.y + panel.height).toBeLessThan(right.y);
    expect(minimap.x + minimap.width).toBeLessThan(panel.x);
    expect(panel.x + panel.width).toBeCloseTo(right.x + right.width, 0);
  }
  await page.setViewportSize({ width: 1280, height: 760 });

  // Toggles.
  await page.locator('.mt-minimap-btn').click();
  await expect(map).toBeHidden();
  await page.locator('.mt-heat-btn').click();
  await expect(heat).toBeHidden();
  await page.reload();
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  await expect(page.locator('.mt-minimap')).toBeHidden();
  await expect(page.locator('.mt-heat')).toBeHidden();
  await page.locator('.mt-minimap-btn').click();
  await expect(page.locator('.mt-minimap')).toBeVisible();
  expect(errors).toEqual([]);
});

test('all nine stockpile icons load with transparent backgrounds', async ({ page }) => {
  await page.goto('./?seed=e2e-icons&r=2&speed=0&autosave=0&tut=0');
  const ids = ['food', 'wood', 'stone', 'ore', 'metal', 'goods', 'energy', 'knowledge', 'charter'];
  await page.evaluate((resources) => {
    window.__MYRIAD__!.grant(Object.fromEntries(resources.map((r) => [r, 1])));
  }, ids);
  for (const id of ids) {
    const icon = page.locator(`.mt-resources [data-res="${id}"] img`);
    await expect(icon).toBeVisible();
    const image = await icon.evaluate(async (el: HTMLImageElement) => {
      await el.decode();
      const canvas = document.createElement('canvas');
      canvas.width = el.naturalWidth;
      canvas.height = el.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(el, 0, 0);
      return { width: el.naturalWidth, alpha: ctx.getImageData(0, 0, 1, 1).data[3] };
    });
    expect(image).toEqual({ width: 64, alpha: 0 });
  }
});

test('flat land by default: buildings and roads share one ground height', async ({ page }) => {
  await page.goto('./?mode=sandbox&seed=e2e-flat&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const ys = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    const out = new Set<number>();
    for (let x = -30; x < 30; x += 3) for (let z = -30; z < 30; z += 3) out.add(A.groundY(x, z));
    return [...out];
  });
  // Land (one height) and water (another): never a staircase of hills.
  expect(ys.length).toBeLessThanOrEqual(2);
});
