import { expect, type Page, test } from '@playwright/test';

async function openCity(page: Page, query: string): Promise<void> {
  await page.goto(`./?${query}&seed=e2e-management&r=2&speed=0&autosave=0`);
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
}

async function flatPatch(page: Page): Promise<{ x: number; z: number }> {
  const spot = await page.evaluate(() => {
    const game = window.__MYRIAD__!;
    for (let z = -20; z <= 20; z++) {
      for (let x = -20; x <= 20; x++) {
        const fits = Array.from({ length: 5 }, (_, dx) => x + dx).every(
          (tx) => game.canPlace('road', tx, z) && game.canPlace('road', tx, z + 1),
        );
        if (fits) return { x, z };
      }
    }
    return null;
  });
  if (!spot) throw new Error('No buildable patch for the management scenario');
  return spot;
}

test('blueprints persist and stamp a rotated neighbourhood on a small screen', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 667 });
  await openCity(page, 'lang=en&mode=sandbox&free=1');
  const spot = await flatPatch(page);
  const draft = await page.evaluate(({ x, z }) => {
    const game = window.__MYRIAD__!;
    game.teleport(x + 1, z + 0.5);
    return [game.plan('road', x, z), game.plan('hut', x + 1, z)];
  }, spot);
  expect(draft).toEqual([true, true]);

  const panel = page.locator('.mt-planbar');
  await panel.getByText('Estimated operation', { exact: true }).click();
  await expect(panel.getByText('Workers provided')).toBeVisible();
  await panel.getByText('Estimated operation', { exact: true }).click();
  const library = panel.locator('.mt-blueprint-library');
  await library.getByText('Neighbourhood blueprints', { exact: true }).click();
  await library.getByLabel('Blueprint name').fill('River homes');
  await library.getByRole('button', { name: 'Save current draft' }).click();
  await library.getByRole('button', { name: 'Place at view centre' }).click();
  await expect(library.getByRole('status')).toContainText('does not fit');
  await expect(panel).toContainText('2 drafts');

  await page.reload();
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  await page.locator('.mt-plan-btn').click();
  await library.getByText('Neighbourhood blueprints', { exact: true }).click();
  await expect(library.getByLabel('Choose a blueprint').locator('option:checked')).toHaveText(
    'River homes',
  );
  await library.getByLabel('Layout rotation').selectOption('90');
  await page.evaluate(({ x, z }) => window.__MYRIAD__!.teleport(x + 4.5, z + 1), spot);
  await library.getByRole('button', { name: 'Place at view centre' }).click();
  await expect(library.getByRole('status')).toHaveText('Placed 2 drafts.');
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(0);
  await panel.getByRole('button', { name: 'Build plan' }).click();
  const buildings = await page.evaluate(
    ({ x, z }) => [
      window.__MYRIAD__!.buildingAt(x + 4, z),
      window.__MYRIAD__!.buildingAt(x + 4, z + 1),
    ],
    spot,
  );
  expect(buildings).toEqual(['road', 'hut']);
});

test('ongoing food shortages are grouped and jump to an affected home', async ({ page }) => {
  await openCity(page, 'lang=vi&mode=sandbox&free=1');
  const spot = await flatPatch(page);
  const placed = await page.evaluate(({ x, z }) => {
    const game = window.__MYRIAD__!;
    const built = [
      game.place('road', x, z),
      game.place('hut', x + 1, z),
      game.place('hut', x, z + 1),
    ];
    game.grant({ food: -(game.stock().food ?? 0) });
    game.tick(16);
    return built;
  }, spot);
  expect(placed).toEqual([true, true, true]);

  const alerts = page.locator('.mt-progress-alerts');
  await alerts.locator('summary').click();
  const food = alerts.getByRole('button').filter({ hasText: /2 công trình.*Thiếu/s });
  await expect(food).toHaveCount(1);
  await food.click();
  const centre = await page.evaluate(() => window.__MYRIAD__!.camera());
  expect(centre.x).toBeCloseTo(spot.x + 1.5);
  expect(centre.z).toBeCloseTo(spot.z + 0.5);
});

test('a chapter shows the alternative route alongside its main objectives', async ({ page }) => {
  await openCity(page, 'lang=vi&mode=goals');
  await page.evaluate(() => window.__MYRIAD__!.skipChapter());
  await expect(
    page.locator('.mt-goal-path').filter({ hasText: 'Mục tiêu thay thế' }),
  ).toBeVisible();
  await expect(page.locator('.mt-goal-path')).toHaveCount(2);
});

test('the well preview shows gains before building and risk before demolition', async ({
  page,
}) => {
  await openCity(page, 'lang=en&mode=sandbox&free=1');
  const spot = await flatPatch(page);
  const placed = await page.evaluate(({ x, z }) => {
    const game = window.__MYRIAD__!;
    game.teleport(x + 2.5, z + 1.5);
    return [game.place('road', x, z + 1), game.place('hut', x + 1, z + 1)];
  }, spot);
  expect(placed).toEqual([true, true]);
  await page.locator('.mt-tabs [data-cat=service]').click();
  await page.locator('.mt-item[data-def=well]').click();
  const canvas = (await page.locator('#app canvas').boundingBox())!;
  const cx = canvas.x + canvas.width / 2;
  const cy = canvas.y + canvas.height / 2;
  await page.waitForTimeout(1000);
  await page.mouse.move(cx, cy);
  const preview = page.locator('.mt-panel');
  await expect(preview).toContainText('1 nearby buildings would meet new conditions');
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(2);
  await page.mouse.click(cx, cy);
  await page.evaluate(() => window.__MYRIAD__!.tick(16));
  await page.keyboard.press('KeyX');
  await page.mouse.move(cx + 1, cy + 1);
  await expect(preview).toContainText('1 nearby buildings could lose a requirement');
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(3);
});

test('regional reserves and specialization follow the town through a save', async ({ page }) => {
  await openCity(page, 'lang=en&mode=sandbox&free=1');
  const spot = await flatPatch(page);
  expect(await page.evaluate(({ x, z }) => window.__MYRIAD__!.place('road', x, z), spot)).toBe(
    true,
  );
  const trade = page.getByRole('button', { name: 'Regional trade' });
  await trade.click();
  const dlg = page.getByRole('dialog', { name: 'Regional trade' });
  await dlg.getByLabel('Specialization').selectOption('farming');
  await expect(dlg.getByText('Food +25%, goods −10%.')).toBeVisible();
  await dlg.getByRole('button', { name: 'Open local reserve' }).click();
  await dlg.getByRole('button', { name: 'Deposit to town' }).click();
  await expect(dlg.getByText(/Local 25\/500/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trade).toBeFocused();
  await page.keyboard.press('Control+s');
  await expect(page.locator('.mt-toast').filter({ hasText: /Saved/i })).toBeVisible();
  await page.reload();
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  await trade.click();
  await expect(dlg.getByLabel('Specialization')).toHaveValue('farming');
  await expect(dlg.getByText(/Local 25\/500/)).toBeVisible();
});
