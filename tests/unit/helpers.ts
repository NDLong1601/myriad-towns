import { loadCatalog } from '@/sim/catalog';
import { City } from '@/sim/city';
import { History } from '@/sim/commands';
import { type TerrainQuery, tileKey } from '@/sim/terrainQuery';
import { Biome, Resource, TileFlag } from '@/world/biomes';
import type { TileSample } from '@/world/terrain';

/** Flat temperate grass everywhere, with a few configurable tiles. */
export class FakeTerrain implements TerrainQuery {
  readonly clearedTrees = new Set<string>();
  special = new Map<string, Partial<TileSample>>();
  tile(x: number, z: number): TileSample {
    const base: TileSample = {
      level: 6,
      biome: Biome.Temperate,
      flags: 0,
      resource: Resource.None,
      moisture: 0.5,
    };
    const s = { ...base, ...this.special.get(tileKey(x, z)) };
    if (s.flags & TileFlag.Tree && this.clearedTrees.has(tileKey(x, z))) s.flags &= ~TileFlag.Tree;
    return s;
  }
}

export function makeCity(opts: { sandbox?: boolean } = {}) {
  const terrain = new FakeTerrain();
  const city = new City(loadCatalog(), terrain);
  city.stock.wood = 1e6;
  city.stock.stone = 1e6;
  city.progress.sandbox = opts.sandbox ?? true;
  const history = new History(city);
  return { terrain, city, history };
}
