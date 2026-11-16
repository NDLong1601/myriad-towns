import { expect, test } from '@playwright/test';

test('the thumbnail tray browses buildings with both arrows, drag and keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./?mode=sandbox&seed=e2e-tray-icons&r=2&speed=0&autosave=0&tut=0');
  await page.locator('.mt-tabs [data-cat=production]').click();
  const items = page.locator('.mt-items');
  const previous = page.getByRole('button', { name: 'Công trình trước' });
  const next = page.getByRole('button', { name: 'Công trình tiếp theo' });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const initial = items.locator('.mt-item').first();
  await expect(initial.locator('img')).toBeVisible();
  await expect(initial.locator('.mt-item-text')).toBeVisible();
  await next.click();
  await expect.poll(() => items.evaluate((el) => el.scrollLeft)).toBeGreaterThan(1);
  await previous.click();
  await expect.poll(() => items.evaluate((el) => el.scrollLeft)).toBe(0);

  const bounds = (await items.boundingBox())!;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + bounds.width - 20, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 25, y, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => items.evaluate((el) => el.scrollLeft)).toBeGreaterThan(50);
  await expect(items.locator('[aria-pressed="true"]')).toHaveCount(0);
  await items.focus();
  await page.keyboard.press('End');
  await expect(items.locator('.mt-item').last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(initial).toBeFocused();
});

test('the compact tray still opens a warehouse requirements panel', async ({ page }) => {
  await page.goto('./?mode=sandbox&seed=e2e-warehouse&r=2&speed=0&autosave=0&tut=0');
  await page.locator('.mt-tabs [data-cat=production]').click();
  await page.locator('.mt-item[data-def=warehouse]').click();
  const detail = page.locator('.mt-detail');
  await expect(detail).toContainText('Nhà kho');
  await expect(detail).toContainText('Sức chứa');
  await expect(detail).toContainText('Bãi vật liệu');
});

test('a planted field changes stage in the in-game inspector', async ({ page }) => {
  await page.goto('./?mode=sandbox&seed=e2e-crops&r=2&speed=0&autosave=0&tut=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready());
  const plot = await page.evaluate(() => {
    const api = window.__MYRIAD__!;
    api.grant({ wood: 1000, stone: 1000 });
    for (let z = -24; z < 24; z++) {
      for (let x = -24; x < 24; x++) {
        if (!api.canPlace('road', x, z) || !api.canPlace('road', x - 1, z)) continue;
        if (!api.place('road', x, z) || !api.place('berry_field', x, z + 1)) continue;
        if (!api.place('hut', x - 1, z)) continue;
        api.teleport(x + 0.5, z + 1.5);
        return { x, z: z + 1 };
      }
    }
    return null;
  });
  expect(plot).not.toBeNull();
  await page.waitForFunction(() => window.__MYRIAD__?.ready());
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const canvas = page.locator('#app canvas');
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const inspector = page.locator('.mt-detail');
  await expect(inspector).toContainText('Đất vừa gieo');
  await page.evaluate(() => window.__MYRIAD__!.tick(33));
  await expect(inspector).toContainText('Đang lớn');
});
