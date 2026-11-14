import { expect, test } from '@playwright/test';

test.describe('minimap', () => {
  test.beforeEach(() => {
    test.setTimeout(120_000);
  });

  test('clicking minimap teleports the camera toward clicked point', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2&speed=0');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const minimap = page.locator('.mt-minimap');
    await expect(minimap).toBeVisible();

    const initialCam = await page.evaluate(() => window.__MYRIAD__!.camera());

    const box = (await minimap.boundingBox())!;
    expect(box).not.toBeNull();

    // Click in the upper-right quadrant of the minimap (East: +x, North: -z)
    // Minimap is 160x160. Center is (80, 80).
    // Radius is 80. (px-80)^2 + (py-80)^2 <= 6400.
    // At px=120, py=50: (40)^2 + (-30)^2 = 1600 + 900 = 2500 <= 6400 (well inside the circle)
    const clickX = box.x + box.width * (120 / 160);
    const clickY = box.y + box.height * (50 / 160);

    await page.mouse.click(clickX, clickY);

    // Software WebGL under parallel load can take a while to process the click.
    await expect
      .poll(
        async () => {
          const cam = await page.evaluate(() => window.__MYRIAD__!.camera());
          return Math.hypot(cam.x - initialCam.x, cam.z - initialCam.z);
        },
        { timeout: 20_000 },
      )
      .toBeGreaterThan(10);

    const newCam = await page.evaluate(() => window.__MYRIAD__!.camera());
    // Click was to the East (+x) and North (-z)
    expect(newCam.x).toBeGreaterThan(initialCam.x + 10);
    expect(newCam.z).toBeLessThan(initialCam.z - 10);

    expect(errors).toEqual([]);
  });

  test('M key toggles minimap visibility, and typing in input does not toggle', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2&speed=0');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const minimap = page.locator('.mt-minimap');
    await expect(minimap).toBeVisible();

    // Press KeyM -> hidden
    await page.keyboard.press('KeyM');
    await expect(minimap).toBeHidden();

    // Press KeyM again -> visible
    await page.keyboard.press('KeyM');
    await expect(minimap).toBeVisible();

    // Open encyclopedia with KeyB to get an input field
    await page.keyboard.press('KeyB');
    const searchInput = page.locator('.mt-encyclopedia-search');
    await expect(searchInput).toBeFocused();

    // Type 'm' in the search box
    await page.keyboard.press('KeyM');
    await expect(searchInput).toHaveValue('m');

    // Minimap is STILL visible (not toggled by typing 'm' in input)
    await expect(minimap).toBeVisible();

    // Close encyclopedia
    await page.keyboard.press('Escape');
    await expect(searchInput).toBeHidden();

    expect(errors).toEqual([]);
  });

  test('placing a building redraws minimap without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./?seed=42&r=2&speed=0');
    await page.waitForFunction(() => window.__MYRIAD_READY__ !== undefined, null, {
      timeout: 60_000,
    });

    const minimap = page.locator('.mt-minimap');
    await expect(minimap).toBeVisible();

    // Find a valid spot near camera and place a road and a hut
    const placed = await page.evaluate(() => {
      const A = window.__MYRIAD__!;
      A.grant({ wood: 1000, stone: 1000 });
      const cam = A.camera();
      const cx = Math.floor(cam.x);
      const cz = Math.floor(cam.z);
      for (let r = 0; r < 20; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (A.canPlace('road', cx + dx, cz + dz)) {
              const okRoad = A.place('road', cx + dx, cz + dz);
              if (okRoad) {
                // Now try placing a hut adjacent to the road
                A.place('hut', cx + dx + 1, cz + dz);
                return { x: cx + dx, z: cz + dz };
              }
            }
          }
        }
      }
      return null;
    });

    expect(placed).not.toBeNull();

    // Give a few frames for view/minimap update
    await page.waitForTimeout(300);

    // Verify minimap element and canvas are still present and visible without any errors
    await expect(minimap).toBeVisible();
    expect(errors).toEqual([]);
  });
});
