import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('menu offers base roads, bridges and production, while paving is automatic', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-economy&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  for (const name of ['Cầu gỗ', 'Đường đất', 'Tháp nước', 'Sân bay nhỏ', 'Ga đường sắt'])
    await expect(page.locator('.mt-item', { hasText: name })).toBeVisible();
  for (const id of ['stone_road', 'brick_road', 'stone_bridge'])
    await expect(page.locator(`.mt-item[data-def="${id}"]`)).toHaveCount(0);
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
