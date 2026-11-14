import { expect, test } from '@playwright/test';

test.describe('infinite world', () => {
  test('streams chunks while travelling, without leaking', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=e2e&r=3');
    await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });

    const R = 3;
    const maxLoaded = (2 * (R + 2) + 1) ** 2;
    const stops: [number, number][] = [
      [200, 0],
      [400, 300],
      [-5000, 7000],
      [1_000_000, -1_000_000],
      [1_000_200, -1_000_100],
      [0, 0],
    ];
    for (const [x, z] of stops) {
      await page.evaluate((p) => window.__MYRIAD__?.teleport(p.x, p.z), { x, z });
      await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
      const s = await page.evaluate(() => window.__MYRIAD__!.stats());
      expect(s.loaded).toBeLessThanOrEqual(maxLoaded);
      expect(s.meshes).toBe(s.loaded);
      // GPU geometries are freed with their chunks.
      expect(s.geometries).toBeLessThanOrEqual(maxLoaded + 10);
    }

    // Far from 0 the render origin follows, so GPU coordinates stay small.
    await page.evaluate(() => window.__MYRIAD__?.teleport(1_000_000, -1_000_000));
    await page.waitForTimeout(300);
    const origin = await page.evaluate(() => window.__MYRIAD__!.origin());
    expect(Math.abs(origin.x - 1_000_000)).toBeLessThan(1100);
    expect(errors).toEqual([]);
  });

  test('camera: drag pans, Q rotates, wheel zooms', async ({ page }) => {
    await page.goto('./?seed=e2e&r=2');
    await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
    const before = await page.evaluate(() => window.__MYRIAD__!.camera());

    await page.mouse.move(640, 360);
    await page.mouse.down();
    await page.mouse.move(400, 300, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.press('KeyQ');
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);

    const after = await page.evaluate(() => window.__MYRIAD__!.camera());
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(5);
    expect(Math.abs(after.yaw - before.yaw)).toBeGreaterThan(1.2);
    expect(after.distance).toBeGreaterThan(before.distance);
  });
});
