import { describe, expect, it } from 'vitest';
import { MINIMAP_SIZE, TILES_PER_PIXEL, pixelToWorld, worldToPixel } from '@/ui/minimap';

describe('minimap coordinate conversions', () => {
  const camX = 100;
  const camZ = -200;
  const size = MINIMAP_SIZE; // 160
  const cx = size / 2; // 80
  const cy = size / 2; // 80
  const scale = TILES_PER_PIXEL; // 4

  it('maps center pixel (80, 80) exactly to camera position (camX, camZ)', () => {
    const world = pixelToWorld(cx, cy, camX, camZ, size, scale);
    expect(world.x).toBe(camX);
    expect(world.z).toBe(camZ);

    const pixel = worldToPixel(camX, camZ, camX, camZ, size, scale);
    expect(pixel.px).toBe(cx);
    expect(pixel.py).toBe(cy);
  });

  it('maps cardinal directions correctly (North-up)', () => {
    // North is -z (up in minimap -> py < cy)
    const northPixel = pixelToWorld(cx, cy - 20, camX, camZ, size, scale);
    expect(northPixel.x).toBe(camX);
    expect(northPixel.z).toBe(camZ - 20 * scale); // z decreases going North

    // South is +z (down in minimap -> py > cy)
    const southPixel = pixelToWorld(cx, cy + 20, camX, camZ, size, scale);
    expect(southPixel.x).toBe(camX);
    expect(southPixel.z).toBe(camZ + 20 * scale); // z increases going South

    // East is +x (right in minimap -> px > cx)
    const eastPixel = pixelToWorld(cx + 20, cy, camX, camZ, size, scale);
    expect(eastPixel.x).toBe(camX + 20 * scale); // x increases going East
    expect(eastPixel.z).toBe(camZ);

    // West is -x (left in minimap -> px < cx)
    const westPixel = pixelToWorld(cx - 20, cy, camX, camZ, size, scale);
    expect(westPixel.x).toBe(camX - 20 * scale); // x decreases going West
    expect(westPixel.z).toBe(camZ);
  });

  it('inverts pixelToWorld with worldToPixel (round-trip pixel -> world -> pixel)', () => {
    const testPoints = [
      { px: 0, py: 0 },
      { px: 40, py: 60 },
      { px: 80, py: 80 },
      { px: 120, py: 140 },
      { px: 160, py: 160 },
      { px: 13.5, py: 97.25 },
    ];

    for (const pt of testPoints) {
      const world = pixelToWorld(pt.px, pt.py, camX, camZ, size, scale);
      const pixel = worldToPixel(world.x, world.z, camX, camZ, size, scale);
      expect(pixel.px).toBeCloseTo(pt.px, 5);
      expect(pixel.py).toBeCloseTo(pt.py, 5);
    }
  });

  it('inverts worldToPixel with pixelToWorld (round-trip world -> pixel -> world)', () => {
    const testWorldCoords = [
      { wx: 0, wz: 0 },
      { wx: 100, wz: -200 },
      { wx: -500, wz: 800 },
      { wx: 124.5, wz: -198.75 },
    ];

    for (const pt of testWorldCoords) {
      const pixel = worldToPixel(pt.wx, pt.wz, camX, camZ, size, scale);
      const world = pixelToWorld(pixel.px, pixel.py, camX, camZ, size, scale);
      expect(world.x).toBeCloseTo(pt.wx, 5);
      expect(world.z).toBeCloseTo(pt.wz, 5);
    }
  });

  it('respects custom size and scale parameters', () => {
    const customSize = 200;
    const customScale = 2;
    const world = pixelToWorld(150, 50, 0, 0, customSize, customScale);
    // cx = 100, cy = 100.
    // px - cx = 50 -> world.x = 50 * 2 = 100
    // py - cy = -50 -> world.z = -50 * 2 = -100
    expect(world.x).toBe(100);
    expect(world.z).toBe(-100);

    const pixel = worldToPixel(100, -100, 0, 0, customSize, customScale);
    expect(pixel.px).toBe(150);
    expect(pixel.py).toBe(50);
  });
});
