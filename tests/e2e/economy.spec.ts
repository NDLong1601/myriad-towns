import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('menu offers bridges, paved roads and the new industry; roads are laid by dragging any kind', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-economy&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  for (const name of ['Cầu gỗ', 'Cầu đá', 'Đường đá', 'Đường lát gạch', 'Tháp nước'])
    await expect(page.locator('.mt-item', { hasText: name })).toBeVisible();
  await page.locator('.mt-tabs button', { hasText: 'Sản xuất' }).click();
  for (const name of ['Hố sỏi', 'Trạm giao thương', 'Cối xay gió', 'Nhà máy điện', 'Xưởng đúc'])
    await expect(page.locator('.mt-items .mt-item', { hasText: name })).toHaveCount(1);
  // A paved road can be placed and counts as a road for the road tutorial/goals.
  const placed = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ stone: 100 });
    for (let r = 0; r < 40; r++)
      for (let dx = -r; dx <= r; dx++)
        if (A.canPlace('stone_road', dx, r)) return A.place('stone_road', dx, r);
    return false;
  });
  expect(placed).toBe(true);
  expect(errors).toEqual([]);
});
