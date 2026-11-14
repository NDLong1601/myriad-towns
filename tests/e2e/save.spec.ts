import { type Page, expect, test } from '@playwright/test';

// Saving and booting a saved game run alongside software WebGL on CI, where a frame can take
// hundreds of ms: give URL changes the same budget as a page boot.
const SLOW = { timeout: 30_000 };
// Each test boots the game two or three times.
test.describe.configure({ timeout: 120_000 });

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
}

/** A few buildings near the origin, then a few ticks so there is state to keep. */
async function buildSomething(page: Page): Promise<number> {
  return page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 5000, stone: 5000, food: 500 });
    for (let r = 0; r < 60; r++)
      for (let dx = -r; dx <= r; dx++)
        for (const dz of [-r, r]) {
          let ok = true;
          for (let i = 0; i < 10 && ok; i++)
            for (let j = 0; j <= 1 && ok; j++) ok = A.canPlace('road', dx + i, dz + j);
          if (!ok) continue;
          for (let i = 0; i < 10; i++) A.place('road', dx + i, dz);
          for (let i = 0; i < 6; i++) A.place('hut', dx + i, dz + 1);
          A.place('berry_field', dx + 7, dz + 1);
          A.tick(24);
          return A.buildingCount();
        }
    return 0;
  });
}

test('save, reload and continue with the same state; Ctrl+S saves', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?seed=e2e-save&mode=goals&speed=0&autosave=0');
  await ready(page);
  const count = await buildSomething(page);
  expect(count).toBeGreaterThan(10);
  const hash = await page.evaluate(() => window.__MYRIAD__!.hash());
  await page.keyboard.press('Control+s');
  await expect(page).toHaveURL(/load=/, SLOW);
  await expect(page.locator('.mt-toast').first()).toContainText('e2e-save', SLOW);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(count);
  expect(await page.evaluate(() => window.__MYRIAD__!.hash())).toBe(hash);
  expect(await page.evaluate(() => window.__MYRIAD__!.mode())).toBe('goals');
  expect(errors).toEqual([]);
});

test('export a save to a file and import it back as a new slot', async ({ page }) => {
  await page.goto('./?seed=e2e-export&mode=sandbox&speed=0&autosave=0');
  await ready(page);
  const count = await buildSomething(page);
  await page.evaluate(() => window.__MYRIAD__!.save());
  await page.getByRole('button', { name: /💾/ }).click();
  const dialog = page.locator('.mt-saves');
  const row = dialog.locator('li.current');
  await expect(row).toBeVisible(SLOW);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    row.getByRole('button', { name: /Xuất|Export/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.mtsave$/);
  const path = await download.path();
  const before = page.url();
  await dialog.locator('input[type=file]').setInputFiles(path);
  await expect.poll(() => page.url(), SLOW).not.toBe(before);
  await ready(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(count);
  expect(await page.evaluate(() => window.__MYRIAD__!.mode())).toBe('sandbox');
  // Both slots are listed now.
  await page.getByRole('button', { name: /💾/ }).click();
  await expect(page.locator('.mt-saves li[data-id]')).toHaveCount(2, SLOW);
});

test('the new-game screen offers to continue the latest save', async ({ page }) => {
  await page.goto('./?seed=e2e-continue&mode=goals&speed=0&autosave=0');
  await ready(page);
  await buildSomething(page);
  await page.evaluate(() => window.__MYRIAD__!.save());
  await page.goto('./?speed=0');
  const cont = page.locator('.mt-continue');
  await expect(cont).toBeVisible({ timeout: 30_000 });
  await expect(cont).toContainText('e2e-continue');
  await cont.click();
  await expect(page).toHaveURL(/load=/, SLOW);
  await ready(page);
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBeGreaterThan(10);
});

test('settings: language and view distance apply after reload and keep the game', async ({
  page,
}) => {
  await page.goto('./?seed=e2e-settings&mode=goals&speed=0&autosave=0');
  await ready(page);
  const count = await buildSomething(page);
  await page.getByRole('button', { name: '⚙' }).click();
  const form = page.locator('.mt-settings');
  await form.locator('select[name=lang]').selectOption('en');
  await form.locator('input[name=radius]').fill('3');
  await form.getByRole('button', { name: /Lưu và áp dụng/ }).click();
  await expect(page).toHaveURL(/load=/, SLOW);
  await ready(page);
  await expect(page.getByRole('button', { name: /Save/ })).toBeVisible(SLOW);
  expect(await page.evaluate(() => window.__MYRIAD__!.buildingCount())).toBe(count);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('mt.settings') ?? '{}'));
  expect(s).toMatchObject({ lang: 'en', radius: 3 });
});
