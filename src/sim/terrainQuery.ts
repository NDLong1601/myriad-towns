import { Biome, Resource, TileFlag } from '@/world/biomes';
import { SEA_LEVEL, type TileSample, sampleTile } from '@/world/terrain';

/** Read access to terrain, including player edits (cut trees). */
export interface TerrainQuery {
  tile(x: number, z: number): TileSample;
}

export function tileKey(x: number, z: number): string {
  return `${x},${z}`;
}

/** Terrain straight from the generator, plus a set of tiles whose trees were cut. */
export class GeneratedTerrain implements TerrainQuery {
  readonly clearedTrees = new Set<string>();
  constructor(readonly seed: number) {}

  tile(x: number, z: number): TileSample {
    const s = sampleTile(this.seed, x, z);
    if (s.flags & TileFlag.Tree && this.clearedTrees.has(tileKey(x, z))) {
      return { ...s, flags: s.flags & ~TileFlag.Tree };
    }
    return s;
  }
}

/**
 * Terrain tags used by data (data/terrain-tags.json). "flat" is a footprint property and is
 * checked by the placement code, so here it is always true.
 */
export function hasTag(q: TerrainQuery, x: number, z: number, tag: string): boolean {
  const s = q.tile(x, z);
  const water = (s.flags & TileFlag.Water) !== 0;
  switch (tag) {
    case 'land':
      return !water;
    case 'flat':
      return true;
    case 'water':
      return water;
    case 'river':
      return (s.flags & TileFlag.River) !== 0;
    case 'forest':
      return (s.flags & TileFlag.Tree) !== 0;
    case 'grass':
      return (
        !water &&
        (s.biome === Biome.Temperate ||
          s.biome === Biome.Forest ||
          s.biome === Biome.Steppe ||
          s.biome === Biome.Ruins)
      );
    case 'beach':
      return s.biome === Biome.Beach;
    case 'steppe':
      return !water && s.biome === Biome.Steppe;
    case 'cold':
      return !water && s.biome === Biome.Cold;
    case 'temperate':
      return !water && s.biome === Biome.Temperate;
    case 'mountain':
      return s.biome === Biome.Mountain;
    case 'ruins':
      return s.biome === Biome.Ruins;
    case 'stone':
      return s.resource === Resource.Stone || s.biome === Biome.Mountain;
    case 'iron':
      return s.resource === Resource.Iron;
    case 'coal':
      return s.resource === Resource.Coal;
    case 'clay':
      return s.resource === Resource.Clay;
    case 'fertile':
      return s.resource === Resource.FertileSoil;
    case 'shore':
      if (water || s.level > SEA_LEVEL + 1) return false;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        if (q.tile(x + dx, z + dz).flags & TileFlag.Water) return true;
      }
      return false;
    default:
      return false;
  }
}
