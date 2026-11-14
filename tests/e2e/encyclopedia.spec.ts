import { expect, test } from '@playwright/test';

test.describe('building encyclopedia panel', () => {
  test.beforeEach(() => {
    test.setTimeout(120_000);
  });
  test('press B, type "giếng", one result; click Xây -> panel closes and tool "well" is active', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const backdrop = page.locator('.mt-encyclopedia-backdrop');
    await expect(backdrop).toBeHidden();

    // Press KeyB to open encyclopedia
    await page.keyboard.press('KeyB');
    await expect(backdrop).toBeVisible();

    // Type "giếng" into search
    const searchInput = page.locator('.mt-encyclopedia-search');
    await expect(searchInput).toBeFocused();
    await searchInput.fill('giếng');

    // Only 1 card matches
    const cards = page.locator('.mt-encyclopedia-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Giếng nước');

    // Click "Xây"
    await cards.first().locator('.mt-encyclopedia-build-btn').click();

    // Modal closes
    await expect(backdrop).toBeHidden();

    // Tool "well" is selected and active in the build menu
    const wellBtn = page.locator('.mt-items button[data-def="well"]');
    await expect(wellBtn).toHaveClass(/active/);

    expect(errors).toEqual([]);
  });

  test('typing "x" in search box does not trigger demolish mode', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const backdrop = page.locator('.mt-encyclopedia-backdrop');
    const demolishBtn = page.locator('button[data-tool="demolish"]');
    await expect(demolishBtn).not.toHaveClass(/active/);

    // Open encyclopedia
    await page.keyboard.press('KeyB');
    await expect(backdrop).toBeVisible();

    const searchInput = page.locator('.mt-encyclopedia-search');
    await searchInput.focus();
    await page.keyboard.press('KeyX');

    // Input receives the letter 'x'
    await expect(searchInput).toHaveValue('x');

    // Demolish mode was NOT triggered
    await expect(demolishBtn).not.toHaveClass(/active/);

    expect(errors).toEqual([]);
  });

  test('open via 📖 button, and Esc only closes modal without cancelling active tool', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const backdrop = page.locator('.mt-encyclopedia-backdrop');

    // Select a tool first
    await page.getByRole('button', { name: /Nhà ở/ }).click();
    const hutBtn = page.locator('.mt-items button[data-def="hut"]');
    await hutBtn.click();
    await expect(hutBtn).toHaveClass(/active/);

    // Open encyclopedia by clicking 📖 button
    const openBtn = page.locator('.mt-encyclopedia-btn');
    await expect(openBtn).toBeVisible();
    await openBtn.click();
    await expect(backdrop).toBeVisible();

    // Press Escape: closes modal, but does NOT cancel active tool
    await page.keyboard.press('Escape');
    await expect(backdrop).toBeHidden();
    await expect(hutBtn).toHaveClass(/active/);

    expect(errors).toEqual([]);
  });
});
