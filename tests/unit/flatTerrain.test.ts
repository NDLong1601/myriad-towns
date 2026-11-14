import { afterEach, describe, expect, it } from 'vitest';
import { LEVEL_HEIGHT, landY, setFlatTerrain } from '@/world/terrainMesh';
import { SEA_LEVEL } from '@/world/terrain';

describe('flat terrain', () => {
  afterEach(() => setFlatTerrain(true));

  it('draws every land level at shore height by default', () => {
    setFlatTerrain(true);
    for (const level of [SEA_LEVEL, SEA_LEVEL + 3, 15])
      expect(landY(level)).toBe(SEA_LEVEL * LEVEL_HEIGHT);
  });

  it('keeps the stepped hills when asked', () => {
    setFlatTerrain(false);
    expect(landY(9)).toBe(9 * LEVEL_HEIGHT);
    expect(landY(9)).toBeGreaterThan(landY(SEA_LEVEL));
  });
});
