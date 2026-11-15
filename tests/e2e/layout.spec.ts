import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('resources stay legible and the shared map dock fits beside or above the tray', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('./?mode=sandbox&seed=e2e-layout&r=2&speed=0&autosave=0&minimap=1');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });

  // Full stock uses the same opaque surface and shows exact, grouped quantities.
  await page.evaluate(() =>
    window.__MYRIAD__!.grant({
      food: 154550,
      stone: 5152,
      ore: 2000,
      coal: 2000,
      goods: 2000,
      energy: 2000,
      knowledge: 2000,
    }),
  );
  const chips = page.locator('.mt-resources > [data-res]');
  const food = chips.locator('b').first();
  await expect(food).toHaveText('154.700 / 500');
  const stone = page.locator('[data-res="stone"]');
  await expect(stone).toHaveClass('full');
  await expect(stone.locator('b')).toHaveText('5.352 / 500');
  await expect(stone).toHaveCSS('white-space', 'nowrap');
  const wood = page.locator('[data-res="wood"]');
  await expect(page.locator('.mt-resources > .full')).toHaveCount(7);
  expect(await stone.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
    await wood.evaluate((e) => getComputedStyle(e).backgroundColor),
  );
  const a = (await chips.nth(0).boundingBox())!;
  const b = (await chips.nth(1).boundingBox())!;
  expect(b.y).toBeGreaterThan(a.y + a.height);
  expect(b.x).toBeCloseTo(a.x);

  const placed = await page.evaluate(() => {
    const api = window.__MYRIAD__!;
    for (let z = -20; z <= 20; z++) {
      for (let x = -20; x <= 20; x++) {
        if (!api.canPlace('road', x, z) || !api.canPlace('road', x + 1, z)) continue;
        if (api.place('road', x, z) && api.place('hut', x + 1, z)) {
          api.tick(4);
          return true;
        }
      }
    }
    return false;
  });
  expect(placed).toBe(true);
  const foodChip = page.locator('[data-res="food"]');
  await expect(foodChip.locator('.down')).toHaveText(/^[−-]0,2\/giây$/);
  await expect(page.locator('.mt-labor.warning svg[aria-label="Lao động"]')).toBeVisible();
  const stockAndRateShareRow = await foodChip.evaluate((chip) => {
    const stock = chip.querySelector('b')!.getBoundingClientRect();
    const rate = chip.querySelector('i')!.getBoundingClientRect();
    return rate.left >= stock.right && rate.top < stock.bottom && rate.bottom > stock.top;
  });
  expect(stockAndRateShareRow).toBe(true);

  const dock = page.locator('.mt-minimap-dock');
  const map = dock.locator('.mt-minimap');
  const heat = dock.locator('.mt-heat');
  const menu = page.locator('.mt-menu');
  const mapButton = dock.locator('.mt-minimap-btn');
  const planButton = dock.locator('.mt-plan-btn');
  const heatButton = dock.locator('.mt-heat-btn');
  await expect(menu.locator('.mt-tools .mt-encyclopedia-btn')).toBeVisible();
  await expect(menu.locator('.mt-tools .mt-policy-btn')).toBeVisible();

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 375, height: 667 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    const mapToggle = (await mapButton.boundingBox())!;
    const planToggle = (await planButton.boundingBox())!;
    const heatToggle = (await heatButton.boundingBox())!;
    const mapBox = (await map.boundingBox())!;
    const heatBox = (await heat.boundingBox())!;
    const dockBox = (await dock.boundingBox())!;
    const menuBox = (await menu.boundingBox())!;
    const leftBox = (await page.locator('.mt-left').boundingBox())!;
    expect(leftBox.y + leftBox.height).toBeLessThan(dockBox.y);
    expect(heatToggle.y).toBeCloseTo(mapToggle.y);
    expect(planToggle.y).toBeCloseTo(mapToggle.y);
    expect(planToggle.x).toBeGreaterThan(mapToggle.x + mapToggle.width);
    expect(heatToggle.x).toBeGreaterThan(planToggle.x + planToggle.width);
    expect(mapBox.y + mapBox.height).toBeLessThan(mapToggle.y);
    expect(heatBox.y + heatBox.height).toBeLessThan(heatToggle.y);
    expect(dockBox.x + dockBox.width < menuBox.x || dockBox.y + dockBox.height < menuBox.y).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  await mapButton.click();
  await expect(map).toBeHidden();
  await heatButton.click();
  await expect(heat).toBeHidden();
  await page.goto('./?mode=sandbox&seed=e2e-layout&r=2&speed=0&autosave=0');
  await expect(map).toBeHidden();
  await expect(heat).toBeHidden();
  await mapButton.click();
  await expect(map).toBeVisible();
  expect(errors).toEqual([]);
});

test('construction tray scrolls and collapses; goals collapse automatically on completion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./?mode=goals&seed=e2e-hud-long-world-seed&r=2&speed=0&autosave=0&tut=0');
  await expect(page.locator('.mt-game-seed')).toHaveText('e2e-hud-long-world-seed');
  const help = page.locator('.mt-help');
  await help.click();
  await expect(help).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('KeyH');
  await expect(help).toHaveAttribute('aria-expanded', 'false');

  const tab = page.locator('.mt-tabs [data-cat=infrastructure]');
  const items = page.locator('.mt-items');
  await expect(items).toHaveCSS('scrollbar-width', 'none');
  await page.keyboard.press('Escape');
  await expect(items).toBeHidden();
  await expect(tab).toHaveAttribute('aria-expanded', 'false');
  await tab.click();
  await expect(items).toBeVisible();
  await tab.click();
  await expect(items).toBeHidden();
  await tab.click();

  const goals = page.locator('details.mt-goals:not(.mt-towns)');
  const title = goals.locator('summary');
  await title.click();
  await expect(goals.locator('h3')).toBeHidden();
  await title.click();
  await expect(goals.locator('h3')).toBeVisible();
  for (let i = 0; i < 5; i++) {
    const pending = await page.evaluate(() => {
      const api = window.__MYRIAD__!;
      api.skipChapter();
      return api.goals().pending;
    });
    if (pending?.length) await page.locator('.mt-choice [data-pack]').first().click();
  }
  await expect(title).toContainText('Đã hoàn thành mọi chương');
  await expect(goals).toHaveJSProperty('open', false);

  await page.goto('./?mode=sandbox&seed=e2e-tray&r=2&speed=0&autosave=0');
  await expect(items.locator('.mt-item').first()).toHaveAttribute('data-def', 'road');
  await items.hover();
  await page.mouse.wheel(0, 275);
  await expect.poll(() => items.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
});

test('all nine stockpile icons load with transparent backgrounds', async ({ page }) => {
  await page.goto('./?seed=e2e-icons&r=2&speed=0&autosave=0&tut=0');
  const ids = ['food', 'wood', 'stone', 'ore', 'metal', 'goods', 'energy', 'knowledge', 'charter'];
  await page.waitForFunction(() => !!window.__MYRIAD__);
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
