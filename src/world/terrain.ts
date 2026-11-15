/**
 * Pure, per-tile world generation. Every value depends only on (seed, x, z), so chunks can be
 * generated in any order, on any thread, and always line up at their edges. That is what makes
 * the world infinite without storing it.
 *
 * Changing any number here changes every world: bump GEN_VERSION and update golden tests.
 */
import { fbm2, ridge2 } from '@/core/noise';
import { Purpose, hash32, hashFloat } from '@/core/prng';
import { Biome, Resource, TileFlag } from './biomes';

/** Height levels 0..MAX_LEVEL. Tiles below SEA_LEVEL are water. */
export const MAX_LEVEL = 15;
export const SEA_LEVEL = 5;
export const MOUNTAIN_LEVEL = 12;
export const SNOW_LEVEL = 14;

export interface TileSample {
  /** Ground height level (for water tiles, the sea or river bed level). */
  level: number;
  biome: Biome;
  /** TileFlag bits. */
  flags: number;
  resource: Resource;
  /** 0..1, kept for later rules (farming, forests). */
  moisture: number;
}

function sub(seed: number, purpose: number): number {
  return hash32(seed, purpose);
}

/** Domain-warped coordinates shared by elevation and rivers, so rivers follow the land's shape. */
function warp(seed: number, x: number, z: number): [number, number] {
  const wx = x + 48 * fbm2(sub(seed, Purpose.WarpX), x, z, { frequency: 0.004, octaves: 3 });
  const wz = z + 48 * fbm2(sub(seed, Purpose.WarpZ), x, z, { frequency: 0.004, octaves: 3 });
  return [wx, wz];
}

function rawElevation(seed: number, wx: number, wz: number, x: number, z: number): number {
  const detail = fbm2(sub(seed, Purpose.Elevation), wx, wz, { frequency: 0.006, octaves: 5 });
  const continent = fbm2(sub(seed, Purpose.Continent), x, z, { frequency: 0.0009, octaves: 2 });
  // Mostly land with seas and lakes; continent noise makes large-scale coasts.
  const e = 0.5 + 0.42 * detail + 0.38 * continent;
  const c = Math.min(1, Math.max(0, e));
  // Flatten lowlands (buildable) and sharpen peaks.
  return c < 0.55 ? c * 0.95 : 0.5225 + (c - 0.55) * 1.06 + (c - 0.55) ** 2 * 0.9;
}

function isRiver(seed: number, wx: number, wz: number, level: number): boolean {
  if (level < SEA_LEVEL || level >= MOUNTAIN_LEVEL) return false;
  // Ridges of a low-frequency noise form long winding lines; narrower at higher ground.
  const r = ridge2(sub(seed, Purpose.Rivers), wx, wz, 0.0028);
  const width = 0.985 + (level - SEA_LEVEL) * 0.0012;
  return r > width;
}

/** Height level only (cheaper; used for mesh neighbours across chunk edges). */
export function sampleLevel(seed: number, x: number, z: number): number {
  return sampleTile(seed, x, z).level;
}

export function sampleTile(seed: number, x: number, z: number): TileSample {
  const [wx, wz] = warp(seed, x, z);
  const raw = rawElevation(seed, wx, wz, x, z);
  const rawLevel = Math.min(MAX_LEVEL, Math.floor(raw * (MAX_LEVEL + 1)));
  let flags = 0;

  const river = isRiver(seed, wx, wz, rawLevel);
  let level: number;
  if (river) {
    level = SEA_LEVEL - 1;
    flags |= TileFlag.Water | TileFlag.River;
  } else if (rawLevel < SEA_LEVEL) {
    level = SEA_LEVEL - 1;
    flags |= TileFlag.Water;
  } else {
    level = SEA_LEVEL;
  }

  const moisture =
    0.5 + 0.5 * fbm2(sub(seed, Purpose.Moisture), x, z, { frequency: 0.0025, octaves: 4 });
  const temperature =
    0.55 +
    0.5 * fbm2(sub(seed, Purpose.Temperature), x, z, { frequency: 0.0009, octaves: 3 }) -
    Math.max(0, rawLevel - SEA_LEVEL) * 0.035;

  let biome: Biome;
  if (flags & TileFlag.Water) biome = river ? Biome.Temperate : Biome.Ocean;
  else if (rawLevel >= MOUNTAIN_LEVEL) biome = Biome.Mountain;
  else if (temperature < 0.28) biome = Biome.Cold;
  else if (rawLevel === SEA_LEVEL && moisture < 0.75) biome = Biome.Beach;
  else if (moisture < 0.36 && temperature > 0.5) biome = Biome.Steppe;
  else if (moisture > 0.58) biome = Biome.Forest;
  else biome = Biome.Temperate;

  if (
    !(flags & TileFlag.Water) &&
    biome !== Biome.Mountain &&
    fbm2(sub(seed, Purpose.Ruins), x, z, { frequency: 0.012, octaves: 2 }) > 0.62
  ) {
    biome = Biome.Ruins;
  }

  let resource: Resource = Resource.None;
  if (!(flags & TileFlag.Water)) {
    const deposit = fbm2(sub(seed, Purpose.Resources), x, z, { frequency: 0.035, octaves: 2 });
    if (deposit > 0.42) {
      if (rawLevel >= MOUNTAIN_LEVEL - 2) resource = Resource.Iron;
      else if (moisture >= 0.42 && moisture <= 0.55) resource = Resource.Coal;
      else if (moisture > 0.55) resource = Resource.Clay;
      else resource = Resource.Stone;
    } else if (deposit < -0.45 && (biome === Biome.Temperate || biome === Biome.Steppe)) {
      resource = Resource.FertileSoil;
    }

    const treeChance =
      biome === Biome.Forest
        ? 0.6
        : biome === Biome.Temperate
          ? 0.1
          : biome === Biome.Cold
            ? 0.22
            : biome === Biome.Ruins
              ? 0.06
              : biome === Biome.Steppe
                ? 0.025
                : 0;
    // Clumps: density noise scales the base chance between 0.3× and 1.7×.
    const clump =
      1 + 0.7 * fbm2(sub(seed, Purpose.TreeDensity), x, z, { frequency: 0.05, octaves: 2 });
    if (treeChance > 0 && hashFloat(seed, Purpose.Trees, x, z) < treeChance * clump) {
      flags |= TileFlag.Tree;
    } else if (
      (resource === Resource.Stone ||
        resource === Resource.Iron ||
        resource === Resource.Coal ||
        biome === Biome.Mountain) &&
      hashFloat(seed, Purpose.Decoration, x, z) < 0.12
    ) {
      flags |= TileFlag.Rock;
    }
  }

  return { level, biome, flags, resource, moisture };
}
