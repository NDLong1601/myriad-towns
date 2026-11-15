import { Biome, TileFlag } from '@/world/biomes';
import { sampleTile } from '@/world/terrain';

export const STARTING_AREAS = ['anywhere', 'coast', 'river', 'forest'] as const;
export const SUPPLY_LEVELS = ['limited', 'standard', 'generous'] as const;
const SUPPLY_MULTIPLIERS = { limited: 0.5, standard: 1, generous: 1.5 };

export function initialStockMultiplier(value: string | null): number {
  return value === 'limited' || value === 'generous'
    ? SUPPLY_MULTIPLIERS[value]
    : SUPPLY_MULTIPLIERS.standard;
}

/** Find a dry tile near the requested feature without changing the generated world. */
export function startingTile(seed: number, area: string | null): { x: number; z: number } {
  if (area !== 'coast' && area !== 'river' && area !== 'forest') return { x: 0, z: 0 };
  let fallback: { x: number; z: number } | undefined;
  for (let radius = 0; radius <= 48; radius++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const step = Math.abs(dz) === radius ? 1 : Math.max(1, radius * 2);
      for (let dx = -radius; dx <= radius; dx += step) {
        const x = dx * 16;
        const z = dz * 16;
        const center = sampleTile(seed, x, z);
        if (center.flags & TileFlag.Water || center.biome === Biome.Mountain) continue;
        fallback ??= { x, z };
        if (area === 'forest') {
          if (center.biome === Biome.Forest) return { x, z };
          continue;
        }
        for (const [ox, oz] of WATER_PROBES) {
          const flags = sampleTile(seed, x + ox, z + oz).flags;
          if (flags & TileFlag.Water && Boolean(flags & TileFlag.River) === (area === 'river')) {
            return { x, z };
          }
        }
      }
    }
  }
  return fallback ?? { x: 0, z: 0 };
}

const WATER_PROBES = [
  [8, 0],
  [-8, 0],
  [0, 8],
  [0, -8],
  [16, 0],
  [-16, 0],
  [0, 16],
  [0, -16],
  [12, 12],
  [-12, 12],
  [12, -12],
  [-12, -12],
] as const;
