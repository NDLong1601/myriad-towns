import { describe, expect, it } from 'vitest';
import { seedFromString } from '@/core/prng';
import { initialStockMultiplier, startingTile } from '@/ui/gameStart';
import { Biome, TileFlag } from '@/world/biomes';
import { sampleTile } from '@/world/terrain';

describe('new game setup', () => {
  const seed = seedFromString('myriad');

  it('keeps the default origin and stock for legacy links', () => {
    expect(startingTile(seed, null)).toEqual({ x: 0, z: 0 });
    expect(initialStockMultiplier(null)).toBe(1);
    expect(initialStockMultiplier('unrecognized')).toBe(1);
    expect(initialStockMultiplier('limited')).toBe(0.5);
    expect(initialStockMultiplier('generous')).toBe(1.5);
  });

  it.each(['coast', 'river', 'forest'] as const)(
    'finds dry land for %s deterministically',
    (area) => {
      const spot = startingTile(seed, area);
      expect(startingTile(seed, area)).toEqual(spot);
      const tile = sampleTile(seed, spot.x, spot.z);
      expect(tile.flags & TileFlag.Water).toBe(0);
      if (area === 'forest') {
        expect(tile.biome).toBe(Biome.Forest);
        return;
      }
      const probes = Array.from({ length: 33 }, (_, i) => i - 16);
      expect(
        probes.some((dx) =>
          probes.some((dz) => {
            const flags = sampleTile(seed, spot.x + dx, spot.z + dz).flags;
            return (
              Boolean(flags & TileFlag.Water) &&
              Boolean(flags & TileFlag.River) === (area === 'river')
            );
          }),
        ),
      ).toBe(true);
    },
  );
});
