import { expect, test } from '@playwright/test';

test('the launcher opens the setup and starts the configured city', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('./?speed=0');
  const launcher = page.locator('.mt-launch');
  await expect(launcher.getByRole('heading', { level: 1 })).toContainText('MYRIAD');
  await expect(page.locator('#app canvas')).toHaveCount(0);
  await expect(launcher.locator('.mt-continue')).toHaveAttribute('aria-disabled', 'true');
  await launcher.getByRole('button', { name: 'Ván mới' }).click();
  const dialog = page.locator('.mt-newgame');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await dialog.locator('label:has(input[value="sandbox"])').click();
  await dialog.locator('input[name="free"]').check();
  await dialog.locator('input[name="seed"]').fill('myriad');
  await dialog.locator('input[name="city"]').fill('Bến Gió');
  await dialog.getByRole('radio', { name: 'Ven sông' }).check();
  await dialog.getByRole('radio', { name: 'Dồi dào' }).check();
  await dialog.locator('select[name="surface"]').selectOption('hills');
  await dialog.locator('button[type="submit"]').click();
  await page.waitForURL(/mode=sandbox/);
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  expect(await page.evaluate(() => window.__MYRIAD__!.mode())).toBe('sandbox');
  expect(page.url()).toContain('seed=myriad');
  expect(page.url()).toContain('free=1');
  expect(page.url()).toContain('terrain=hills');
  await expect(page.locator('#hud strong')).toHaveText('Bến Gió');
  expect(await page.evaluate(() => window.__MYRIAD__!.stock())).toMatchObject({
    food: 225,
    wood: 450,
    stone: 300,
  });
  const camera = await page.evaluate(() => window.__MYRIAD__!.camera());
  expect(Math.hypot(camera.x - 0.5, camera.z - 0.5)).toBeGreaterThan(1);
  expect(camera.distance).toBeLessThan(55);
  await expect(page.locator('.mt-items')).toBeHidden();
  await page.getByRole('button', { name: 'Ban đêm' }).click();
  await expect(page.locator('.mt-lighting time')).toHaveText('00:00');
  await expect.poll(() => page.evaluate(() => window.__MYRIAD__!.timeOfDay())).toBe(0);
  await page.getByRole('button', { name: 'Ban ngày' }).click();
  await expect(page.locator('.mt-lighting time')).toHaveText('12:00');
  await expect(page.locator('.mt-newgame')).toHaveCount(0);
});

test('launcher settings apply and the mobile setup stays within its viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.locator('.mt-settings select[name=lang]').selectOption('en');
  await page.getByRole('button', { name: /Lưu và áp dụng/ }).click();
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  const pane = page.locator('.mt-launch-pane');
  await expect(pane.getByRole('heading', { name: 'New game' })).toBeVisible();
  const bounds = (await pane.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
  const play = (await pane.getByRole('button', { name: 'Start' }).boundingBox())!;
  expect(play.y + play.height).toBeLessThanOrEqual(667);
  await pane.getByRole('button', { name: 'Back' }).click();
  await expect(pane).toBeHidden();
});

test('goals mode: the chapter panel shows, a finished chapter offers two packs', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?seed=e2e-goals&speed=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  expect(await page.evaluate(() => window.__MYRIAD__!.mode())).toBe('goals');
  await expect(page.locator('.mt-goals').first()).toBeVisible();
  expect(await page.evaluate(() => window.__MYRIAD__!.goals().chapter)).toBe('settle');

  // Chapter 1 has no pack choice; chapter 2 does.
  await page.evaluate(() => window.__MYRIAD__!.skipChapter());
  expect(await page.evaluate(() => window.__MYRIAD__!.goals().chapter)).toBe('village');
  await page.evaluate(() => window.__MYRIAD__!.skipChapter());
  const pending = await page.evaluate(() => window.__MYRIAD__!.goals().pending);
  expect(pending).toHaveLength(2);
  const choice = page.locator('.mt-choice');
  await expect(choice).toBeVisible();
  await choice.locator(`[data-pack="${pending![0]}"]`).click();
  await expect(choice).toBeHidden();
  const g = await page.evaluate(() => window.__MYRIAD__!.goals());
  expect(g.pending).toBeNull();
  expect(g.chapter).toBe('town');
  expect(errors).toEqual([]);
});

test('building next to ruins explores them once and pays the reward', async ({ page }) => {
  await page.goto('./?seed=e2e-poi&speed=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const result = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 5000, stone: 5000 });
    const pois = A.poisNear(0, 0).filter((p) => !p.explored);
    for (const p of pois) {
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [2, 0],
        [0, 2],
      ] as const) {
        if (A.canPlace('road', p.x + dx, p.z + dz)) {
          const before = A.explored();
          A.place('road', p.x + dx, p.z + dz);
          const after = A.explored();
          // A second road next to it must not pay again.
          for (const [ex, ez] of [
            [-1, 0],
            [0, -1],
            [1, 1],
          ] as const)
            if (A.canPlace('road', p.x + ex, p.z + ez)) {
              A.place('road', p.x + ex, p.z + ez);
              break;
            }
          return { before, after, again: A.explored() };
        }
      }
    }
    return null;
  });
  expect(result).not.toBeNull();
  expect(result!.after).toBe(result!.before + 1);
  expect(result!.again).toBe(result!.after);
});

test('a town hall far away founds a second town that sleeps while the camera is away', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?seed=e2e-towns&mode=sandbox&speed=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const r = await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 5000, stone: 5000 });
    const find = (cx: number, cz: number, def: string): { x: number; z: number } | null => {
      for (let r = 0; r < 40; r++)
        for (let dx = -r; dx <= r; dx++)
          for (const dz of [-r, r])
            if (A.canPlace(def, cx + dx, cz + dz)) return { x: cx + dx, z: cz + dz };
      return null;
    };
    const a = find(0, 0, 'road')!;
    A.place('road', a.x, a.z);
    const h = find(300, 0, 'town_hall')!;
    const placed = A.place('town_hall', h.x, h.z);
    return { placed, towns: A.towns().length };
  });
  expect(r).toEqual({ placed: true, towns: 2 });
  await expect(page.locator('.mt-towns li')).toHaveCount(2);
  // Camera at the origin: the far town sleeps.
  await page.evaluate(() => window.__MYRIAD__!.updateTiers());
  expect(await page.evaluate(() => window.__MYRIAD__!.towns().map((t) => t.dormant))).toEqual([
    false,
    true,
  ]);
  await expect(page.locator('.mt-towns em')).toHaveCount(1);
  // Click the far town in the list: the camera flies there and it wakes up.
  await page.locator('.mt-towns button').nth(1).click();
  await page.evaluate(() => window.__MYRIAD__!.updateTiers());
  expect(await page.evaluate(() => window.__MYRIAD__!.towns()[1]!.dormant)).toBe(false);
  expect(errors).toEqual([]);
});

// Software WebGL on CI renders about one frame a second; the tutorial checks run between frames.
const SLOW_POLL = { timeout: 30_000 };

test('the tutorial advances as the player does each step, and can be skipped', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('./?seed=e2e-tut&mode=goals&tut=1&speed=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  const card = page.locator('.mt-tutorial');
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => window.__MYRIAD__!.tutorialStep())).toBe('camera');
  await page.evaluate(() => window.__MYRIAD__!.teleport(8, 8));
  await expect
    .poll(() => page.evaluate(() => window.__MYRIAD__!.tutorialStep()), SLOW_POLL)
    .toBe('road');
  await page.evaluate(() => {
    const A = window.__MYRIAD__!;
    A.grant({ wood: 500, stone: 500 });
    for (let r = 0; r < 40; r++)
      for (let dx = -r; dx <= r; dx++)
        for (const dz of [-r, r]) {
          let ok = true;
          for (let i = 0; i < 6 && ok; i++) ok = A.canPlace('road', 8 + dx + i, 8 + dz);
          if (ok) {
            for (let i = 0; i < 6; i++) A.place('road', 8 + dx + i, 8 + dz);
            return;
          }
        }
  });
  await expect
    .poll(() => page.evaluate(() => window.__MYRIAD__!.tutorialStep()), SLOW_POLL)
    .toBe('hut');
  await card.getByRole('button').click();
  await expect(card).toHaveCount(0);
  expect(page.url()).not.toContain('tut=1');
  expect(await page.evaluate(() => localStorage.getItem('mt.tutorialDone'))).toBe('1');
});
