/**
 * Points of interest: ruins scattered over the infinite map, explored when the town reaches them.
 *
 * Placement is a pure function of (seed, chunk), like terrain, so nothing is stored until a POI
 * is explored. Exploring = any building with a footprint within EXPLORE_RADIUS of the POI.
 */
import { CHUNK_SIZE, tileToChunk } from '@/core/coords';
import { Purpose, rngFor } from '@/core/prng';
import { TileFlag } from '@/world/biomes';
import type { Amounts } from './catalog';
import { type City, type PlacedBuilding, rectOf } from './city';
import { rectDistance } from './geometry';

export const EXPLORE_RADIUS = 2;
/** Share of chunks that hold a POI. */
const CHANCE = 0.22;
/** Salt so POIs do not reuse the ruins-biome stream. */
const SALT = 0x701;

export type PoiKind = 'cache' | 'granary' | 'library' | 'relic';
const KINDS: readonly PoiKind[] = ['cache', 'granary', 'library', 'relic'];

export interface Poi {
  readonly key: string;
  readonly kind: PoiKind;
  readonly x: number;
  readonly z: number;
  readonly reward: Amounts;
}

function rewardFor(kind: PoiKind, roll: number): Amounts {
  const k = 1 + Math.floor(roll * 3); // 1..3
  switch (kind) {
    case 'cache':
      return { wood: 30 * k, stone: 20 * k };
    case 'granary':
      return { food: 40 * k };
    case 'library':
      return { knowledge: 5 * k, stone: 10 * k };
    case 'relic':
      return { goods: 8 * k, stone: 15 * k };
  }
}

/** The POI of a chunk, if it has one (deterministic for a seed). */
export function poiInChunk(
  seed: number,
  cx: number,
  cz: number,
  isLand: (x: number, z: number) => boolean,
): Poi | undefined {
  // Keep the start area clear so the first village has room.
  if (Math.abs(cx) <= 0 && Math.abs(cz) <= 0) return undefined;
  const rng = rngFor(seed, Purpose.Ruins, cx, cz, SALT);
  if (rng.nextFloat() >= CHANCE) return undefined;
  const kind = KINDS[Math.floor(rng.nextFloat() * KINDS.length)] as PoiKind;
  const roll = rng.nextFloat();
  // A few tries for a land tile away from the chunk edge.
  for (let i = 0; i < 6; i++) {
    const x = cx * CHUNK_SIZE + 4 + Math.floor(rng.nextFloat() * (CHUNK_SIZE - 8));
    const z = cz * CHUNK_SIZE + 4 + Math.floor(rng.nextFloat() * (CHUNK_SIZE - 8));
    if (isLand(x, z)) return { key: `${cx},${cz}`, kind, x, z, reward: rewardFor(kind, roll) };
  }
  return undefined;
}

export type PoiEvent = { type: 'explored'; poi: Poi };

/** Explored POIs (the only state; saved in M5) and the exploring rule. */
export class PoiStore {
  private explored = new Set<string>();
  private listeners: ((e: PoiEvent) => void)[] = [];

  constructor(
    private readonly city: City,
    readonly seed: number,
  ) {
    city.on((e) => {
      if (e.type === 'added') this.checkNear(e.building);
    });
  }

  on(fn: (e: PoiEvent) => void): void {
    this.listeners.push(fn);
  }

  get exploredCount(): number {
    return this.explored.size;
  }

  isExplored(key: string): boolean {
    return this.explored.has(key);
  }

  /** POIs in the chunks around a chunk (radius in chunks). */
  around(cx: number, cz: number, radius: number): Poi[] {
    const out: Poi[] = [];
    for (let z = cz - radius; z <= cz + radius; z++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const p = poiInChunk(this.seed, x, z, this.isLand);
        if (p) out.push(p);
      }
    }
    return out;
  }

  private readonly isLand = (x: number, z: number): boolean =>
    (this.city.terrain.tile(x, z).flags & TileFlag.Water) === 0;

  private checkNear(b: PlacedBuilding): void {
    const rect = rectOf(b.def, b.x, b.z);
    const { cx, cz } = tileToChunk(b.x, b.z);
    for (const p of this.around(cx, cz, 1)) {
      if (this.explored.has(p.key)) continue;
      if (rectDistance(rect, { x: p.x, z: p.z, w: 1, d: 1 }) > EXPLORE_RADIUS) continue;
      this.explored.add(p.key);
      this.city._addStock(p.reward, 1);
      for (const l of this.listeners) l({ type: 'explored', poi: p });
    }
  }
}
