/**
 * Biome and tile-flag ids stored in chunk arrays. Values are saved to disk: never renumber,
 * only append.
 */
export const Biome = {
  Ocean: 0,
  Beach: 1,
  Temperate: 2,
  Forest: 3,
  Steppe: 4,
  Cold: 5,
  Mountain: 6,
  Ruins: 7,
} as const;
export type Biome = (typeof Biome)[keyof typeof Biome];
export const BIOME_COUNT = 8;

export const BIOME_NAMES: Record<Biome, string> = {
  [Biome.Ocean]: 'ocean',
  [Biome.Beach]: 'beach',
  [Biome.Temperate]: 'temperate',
  [Biome.Forest]: 'forest',
  [Biome.Steppe]: 'steppe',
  [Biome.Cold]: 'cold',
  [Biome.Mountain]: 'mountain',
  [Biome.Ruins]: 'ruins',
};

/** Bit flags per tile. */
export const TileFlag = {
  Water: 1 << 0,
  River: 1 << 1,
  Tree: 1 << 2,
  Rock: 1 << 3,
} as const;

/** Natural resource deposit per tile. */
export const Resource = {
  None: 0,
  Stone: 1,
  Iron: 2,
  Clay: 3,
  FertileSoil: 4,
  Coal: 5,
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];
