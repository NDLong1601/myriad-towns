import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('menu offers base roads, bridges and production, while paving is automatic', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-economy&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  for (const name of ['Cầu gỗ', 'Đường đất', 'Sân bay nhỏ', 'Ga đường sắt'])
    await expect(page.locator('.mt-item', { hasText: name })).toBeVisible();
  await expect(page.locator('.mt-item', { hasText: 'Tháp nước' })).toHaveCount(0);
  for (const id of ['stone_road', 'brick_road', 'stone_bridge'])
    await expect(page.locator(`.mt-item[data-def="${id}"]`)).toHaveCount(0);
  await page.getByRole('button', { name: 'Dịch vụ' }).click();
  await expect(page.locator('.mt-item', { hasText: 'Tháp nước' })).toHaveCount(1);
  await page.locator('.mt-tabs button', { hasText: 'Sản xuất' }).click();
  for (const name of ['Hố sỏi', 'Trạm giao thương', 'Cối xay gió', 'Nhà máy điện', 'Xưởng đúc'])
    await expect(page.locator('.mt-items .mt-item', { hasText: name })).toHaveCount(1);
  const placed = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ stone: 100 });
    for (let r = 0; r < 40; r++)
      for (let dx = -r; dx <= r; dx++)
        if (A.canPlace('road', dx, r))
          return !A.canPlace('stone_road', dx, r) && A.place('road', dx, r);
    return false;
  });
  expect(placed).toBe(true);
  expect(errors).toEqual([]);
});

test('resource inspector forecasts depletion, explains a shortage, and jumps to its site', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./?mode=sandbox&seed=e2e-layout&r=2&speed=0&autosave=0&lang=en');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const home = await page.evaluate(() => {
    const api = window.__MYRIAD__!;
    for (let z = -20; z <= 20; z++) {
      for (let x = -20; x <= 20; x++) {
        if (!api.canPlace('road', x, z) || !api.canPlace('road', x + 1, z)) continue;
        if (api.place('road', x, z) && api.place('hut', x + 1, z)) {
          api.tick(12);
          return { x: x + 1.5, z: z + 0.5 };
        }
      }
    }
    return null;
  });
  expect(home).not.toBeNull();
  const food = page.locator('.mt-resources').getByRole('button', { name: 'Food', exact: true });
  await food.focus();
  await food.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Shared stock · Food' });
  await expect(panel).toBeVisible();
  await expect(panel.locator('.mt-economy-forecast')).toContainText('empty in about');
  const bounds = (await panel.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(food).toBeFocused();

  await page.evaluate(() => {
    const api = window.__MYRIAD__!;
    api.grant({ food: -(api.stock().food ?? 0) });
    api.tick(12);
  });
  await expect(food).toBeFocused();
  await food.press('Enter');
  await expect(panel.locator('.mt-economy-forecast')).toHaveText('This reserve is empty.');
  const site = panel.getByRole('button', { name: /Go to .*Shortage of Food/ });
  await site.click();
  await expect(panel).toBeHidden();
  const camera = await page.evaluate(() => window.__MYRIAD__!.camera());
  expect(camera.x).toBeCloseTo(home!.x);
  expect(camera.z).toBeCloseTo(home!.z);
});
