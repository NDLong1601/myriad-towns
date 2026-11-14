import { type ChunkKey, chunkKey, tileToChunk } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import {
  type Amounts,
  type BuildingDef,
  type Catalog,
  DEMOLISH_REFUND,
  START_STOCK,
} from './catalog';
import { FieldStore } from './fields';
import { type Rect, rectDistance } from './geometry';
import { type TerrainQuery, tileKey } from './terrainQuery';

export interface PlacedBuilding {
  readonly uid: number;
  readonly def: BuildingDef;
  readonly x: number;
  readonly z: number;
}

export type CityEvent =
  | { type: 'added'; building: PlacedBuilding }
  | { type: 'removed'; building: PlacedBuilding }
  | { type: 'stock' }
  | { type: 'trees'; tiles: readonly { x: number; z: number }[] };

/** Largest footprint edge in data; bounds spatial lookups. */
const MAX_FOOTPRINT = 8;

export function rectOf(def: BuildingDef, x: number, z: number): Rect {
  return { x, z, w: def.footprint.w, d: def.footprint.d };
}

/**
 * Everything the player has built, plus the derived indexes the rules need:
 * tile occupancy, a per-chunk spatial index and the local fields. Mutations go through
 * commands (commands.ts) so they can be undone exactly.
 */
export class City {
  readonly fields = new FieldStore();
  readonly stock: Record<string, number> = { ...START_STOCK };
  private buildings = new Map<number, PlacedBuilding>();
  private occupancy = new Map<string, number>();
  private spatial = new Map<ChunkKey, Set<number>>();
  private nextUid = 1;
  private listeners: ((e: CityEvent) => void)[] = [];

  constructor(
    readonly catalog: Catalog,
    readonly terrain: TerrainQuery & { clearedTrees?: Set<string> },
  ) {}

  on(fn: (e: CityEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  get count(): number {
    return this.buildings.size;
  }

  all(): IterableIterator<PlacedBuilding> {
    return this.buildings.values();
  }

  get(uid: number): PlacedBuilding | undefined {
    return this.buildings.get(uid);
  }

  /** Building covering a tile, if any. */
  at(x: number, z: number): PlacedBuilding | undefined {
    const uid = this.occupancy.get(tileKey(x, z));
    return uid === undefined ? undefined : this.buildings.get(uid);
  }

  /** Buildings whose footprint is within r of rect (optionally only of one type). */
  near(rect: Rect, r: number, defId?: string, excludeUid?: number): PlacedBuilding[] {
    const reach = r + MAX_FOOTPRINT;
    const c0 = tileToChunk(rect.x - reach, rect.z - reach);
    const c1 = tileToChunk(rect.x + rect.w + reach, rect.z + rect.d + reach);
    const out: PlacedBuilding[] = [];
    for (let cz = c0.cz; cz <= c1.cz; cz++) {
      for (let cx = c0.cx; cx <= c1.cx; cx++) {
        const set = this.spatial.get(chunkKey(cx, cz));
        if (!set) continue;
        for (const uid of set) {
          const b = this.buildings.get(uid);
          if (!b || uid === excludeUid || (defId !== undefined && b.def.id !== defId)) continue;
          if (rectDistance(rect, rectOf(b.def, b.x, b.z)) <= r) out.push(b);
        }
      }
    }
    return out;
  }

  /** Distance from rect to the nearest road tile, or Infinity if none within maxDistance. */
  roadDistance(rect: Rect, maxDistance: number): number {
    let best = Infinity;
    for (let z = rect.z - maxDistance; z < rect.z + rect.d + maxDistance; z++) {
      for (let x = rect.x - maxDistance; x < rect.x + rect.w + maxDistance; x++) {
        const b = this.at(x, z);
        if (b && b.def.id === 'road') {
          const d = rectDistance(rect, { x, z, w: 1, d: 1 });
          if (d < best) best = d;
        }
      }
    }
    return best <= maxDistance ? best : Infinity;
  }

  canAfford(cost: Amounts): boolean {
    return Object.entries(cost).every(([r, n]) => (this.stock[r] ?? 0) >= n);
  }

  refundOf(def: BuildingDef): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [r, n] of Object.entries(def.cost)) out[r] = Math.floor(n * DEMOLISH_REFUND);
    return out;
  }

  // ---- Low-level mutations, used by commands only. Each has an exact inverse. ----

  /** Adds a building. Returns the tiles whose trees were cut (to restore on undo). */
  _add(
    def: BuildingDef,
    x: number,
    z: number,
    uid = this.nextUid++,
  ): { building: PlacedBuilding; cut: string[] } {
    const b: PlacedBuilding = { uid, def, x, z };
    if (uid >= this.nextUid) this.nextUid = uid + 1;
    const rect = rectOf(def, x, z);
    const cut: string[] = [];
    for (let tz = z; tz < z + def.footprint.d; tz++) {
      for (let tx = x; tx < x + def.footprint.w; tx++) {
        const key = tileKey(tx, tz);
        if (this.occupancy.has(key)) throw new Error(`tile ${key} already occupied`);
        this.occupancy.set(key, uid);
        if (this.terrain.clearedTrees && this.terrain.tile(tx, tz).flags & TileFlag.Tree) {
          this.terrain.clearedTrees.add(key);
          cut.push(key);
        }
      }
    }
    this.buildings.set(uid, b);
    this.spatialSet(b).add(uid);
    this.fields.apply(rect, def.emits, 1);
    this.emit({ type: 'added', building: b });
    if (cut.length) this.emit({ type: 'trees', tiles: cut.map(parseKey) });
    return { building: b, cut };
  }

  _remove(uid: number, restoreTrees: readonly string[] = []): PlacedBuilding {
    const b = this.buildings.get(uid);
    if (!b) throw new Error(`no building ${uid}`);
    for (let tz = b.z; tz < b.z + b.def.footprint.d; tz++) {
      for (let tx = b.x; tx < b.x + b.def.footprint.w; tx++) this.occupancy.delete(tileKey(tx, tz));
    }
    this.spatialSet(b).delete(uid);
    this.buildings.delete(uid);
    this.fields.apply(rectOf(b.def, b.x, b.z), b.def.emits, -1);
    for (const k of restoreTrees) this.terrain.clearedTrees?.delete(k);
    this.emit({ type: 'removed', building: b });
    if (restoreTrees.length) this.emit({ type: 'trees', tiles: restoreTrees.map(parseKey) });
    return b;
  }

  _addStock(amounts: Amounts, sign: 1 | -1): void {
    for (const [r, n] of Object.entries(amounts)) this.stock[r] = (this.stock[r] ?? 0) + sign * n;
    this.emit({ type: 'stock' });
  }

  private spatialSet(b: PlacedBuilding): Set<number> {
    const { cx, cz } = tileToChunk(b.x, b.z);
    const key = chunkKey(cx, cz);
    let s = this.spatial.get(key);
    if (!s) {
      s = new Set();
      this.spatial.set(key, s);
    }
    return s;
  }

  private emit(e: CityEvent): void {
    for (const l of this.listeners) l(e);
  }
}

function parseKey(k: string): { x: number; z: number } {
  const [x, z] = k.split(',').map(Number);
  return { x: x as number, z: z as number };
}
