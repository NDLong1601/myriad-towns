import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

const VILLAGE = `
  const A = window.__MYRIAD__;
  A.grant({ wood: 9000, stone: 9000, food: 900 });
  for (let r = 0; r < 60; r++)
    for (let dx = -r; dx <= r; dx++)
      for (const dz of [-r, r]) {
        let ok = true;
        for (let a = 0; a < 16 && ok; a++) for (let c = -3; c <= 6 && ok; c++) ok = A.canPlace('road', dx + a, dz + c);
        if (!ok) continue;
        for (let k = 0; k < 2; k++) {
          for (let i = 0; i < 16; i++) A.place('road', dx + i, dz + k * 4);
          for (let i = 0; i < 14; i++) A.place('hut', dx + i, dz + 1 + k * 4);
        }
        for (let i = 0; i < 4; i++) A.place('berry_field', dx + i * 2, dz - 2);
        A.tick(8);
        A.place('well', dx + 3, dz + 2);
        A.place('well', dx + 10, dz + 2);
        A.tick(60);
        A.teleport(dx + 8, dz + 2);
        return true;
      }
  return false;
`;

test('people appear on the roads as the village grows, and ?traffic=0 hides them', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=sandbox&seed=e2e-traffic&speed=0&autosave=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  expect(await page.evaluate(() => window.__MYRIAD__!.traffic())).toMatchObject({
    pedestrians: 0,
    vehicles: 0,
  });
  expect(await page.evaluate(`(() => {${VILLAGE}})()`)).toBe(true);
  expect(await page.evaluate(() => window.__MYRIAD__!.population())).toBeGreaterThan(10);
  await expect
    .poll(() => page.evaluate(() => window.__MYRIAD__!.traffic().pedestrians), { timeout: 40_000 })
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);

  await page.goto('./?mode=sandbox&seed=e2e-traffic&speed=0&autosave=0&traffic=0');
  await page.waitForFunction(() => window.__MYRIAD__?.ready(), null, { timeout: 30_000 });
  await page.evaluate(`(() => {${VILLAGE}})()`);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => window.__MYRIAD__!.traffic())).toMatchObject({
    pedestrians: 0,
    vehicles: 0,
  });
});
