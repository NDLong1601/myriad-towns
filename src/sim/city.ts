import { type ChunkKey, chunkKey, tileToChunk } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import {
  type Amounts,
  type BuildingDef,
  type Catalog,
  BASE_CAPACITY,
  DEMOLISH_REFUND,
  START_STOCK,
  isRoadDef,
} from './catalog';
import { FieldStore } from './fields';
import { Progress } from './progress';
import { type Rect, rectDistance } from './geometry';
import type { CheckResult } from './requirements';
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
  /** A building stopped (abandoned) or resumed working: its emits were removed or restored. */
  | { type: 'status'; building: PlacedBuilding; active: boolean }
  | { type: 'unlocked'; ids: readonly string[] }
  | { type: 'trees'; tiles: readonly { x: number; z: number }[] }
  | { type: 'policy'; policy: string; active: boolean };

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
  readonly capacities: Record<string, number> = { ...BASE_CAPACITY };
  readonly progress: Progress;
  /** Sandbox option: placing costs nothing. */
  freeBuild = false;
  /** Extra site checks for placement (towns add the territory rule). */
  readonly siteRules: ((def: BuildingDef, rect: Rect) => CheckResult | null)[] = [];
  private buildings = new Map<number, PlacedBuilding>();
  private inactive = new Set<number>();
  private perDef = new Map<string, number>();
  /** Numeric tile keys: string keys made the rule engine's road lookups the hot spot. */
  private occupancy = new Map<number, number>();
  private spatial = new Map<ChunkKey, Set<number>>();
  private nextUid = 1;
  private listeners: ((e: CityEvent) => void)[] = [];
  private activePolicies = new Set<string>();

  constructor(
    readonly catalog: Catalog,
    readonly terrain: TerrainQuery & { clearedTrees?: Set<string> },
  ) {
    this.progress = new Progress((id) => this.countOf(id));
  }

  /** Number of placed buildings of one type. */
  /** Buildings whose definition carries a tag (roads, bridges and paved roads share "road"). */
  countTag(tag: string): number {
    let n = 0;
    for (const [id, count] of this.perDef) {
      if (count > 0 && this.catalog.has(id) && this.catalog.get(id).tags?.includes(tag)) n += count;
    }
    return n;
  }

  countOf(defId: string): number {
    return this.perDef.get(defId) ?? 0;
  }

  capacityOf(resource: string): number {
    return this.capacities[resource] ?? BASE_CAPACITY[resource] ?? 1000;
  }

  get policies(): ReadonlySet<string> {
    return this.activePolicies;
  }

  isPolicyActive(id: string): boolean {
    return this.activePolicies.has(id);
  }

  setPolicy(id: string, active: boolean): void {
    if (active) this.activePolicies.add(id);
    else this.activePolicies.delete(id);
    for (const l of this.listeners) l({ type: 'policy', policy: id, active });
  }

  setPolicies(policies: Iterable<string>): void {
    this.activePolicies.clear();
    for (const p of policies) this.activePolicies.add(p);
    for (const l of this.listeners) l({ type: 'policy', policy: '', active: false });
  }

  /** False while a building is abandoned (it neither works nor spreads its fields). */
  isActive(uid: number): boolean {
    return this.buildings.has(uid) && !this.inactive.has(uid);
  }

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
    const uid = this.occupancy.get(occKey(x, z));
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
    // Scan rings outward (most buildings touch a road), stopping once no closer ring is left.
    let best = Infinity;
    for (let ring = 1; ring <= maxDistance && best > ring; ring++) {
      const x0 = rect.x - ring;
      const x1 = rect.x + rect.w - 1 + ring;
      const z0 = rect.z - ring;
      const z1 = rect.z + rect.d - 1 + ring;
      for (let z = z0; z <= z1; z++) {
        const edge = z === z0 || z === z1;
        for (let x = x0; x <= x1; x += edge ? 1 : x1 - x0) {
          const b = this.at(x, z);
          if (b && isRoadDef(b.def)) {
            const d = rectDistance(rect, { x, z, w: 1, d: 1 });
            if (d < best) best = d;
          }
        }
      }
    }
    return best <= maxDistance ? best : Infinity;
  }

  /** Next uid to hand out (saved, so uids never repeat after a load). */
  get nextUidValue(): number {
    return this.nextUid;
  }

  _setNextUid(n: number): void {
    this.nextUid = Math.max(this.nextUid, n);
  }

  canAfford(cost: Amounts): boolean {
    if (this.freeBuild) return true;
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
        if (this.occupancy.has(occKey(tx, tz))) throw new Error(`tile ${key} already occupied`);
        this.occupancy.set(occKey(tx, tz), uid);
        if (this.terrain.clearedTrees && this.terrain.tile(tx, tz).flags & TileFlag.Tree) {
          this.terrain.clearedTrees.add(key);
          cut.push(key);
        }
      }
    }
    this.buildings.set(uid, b);
    this.perDef.set(def.id, this.countOf(def.id) + 1);
    this.spatialSet(b).add(uid);
    this.fields.apply(rect, def.emits, 1);
    if (def.storage) {
      for (const [r, n] of Object.entries(def.storage)) {
        this.capacities[r] = (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) + n;
      }
    }
    this.emit({ type: 'added', building: b });
    if (cut.length) this.emit({ type: 'trees', tiles: cut.map(parseKey) });
    return { building: b, cut };
  }

  _remove(uid: number, restoreTrees: readonly string[] = []): PlacedBuilding {
    const b = this.buildings.get(uid);
    if (!b) throw new Error(`no building ${uid}`);
    for (let tz = b.z; tz < b.z + b.def.footprint.d; tz++) {
      for (let tx = b.x; tx < b.x + b.def.footprint.w; tx++) this.occupancy.delete(occKey(tx, tz));
    }
    this.spatialSet(b).delete(uid);
    this.buildings.delete(uid);
    this.perDef.set(b.def.id, this.countOf(b.def.id) - 1);
    if (b.def.storage && !this.inactive.has(uid)) {
      for (const [r, n] of Object.entries(b.def.storage)) {
        this.capacities[r] = Math.max(
          BASE_CAPACITY[r] ?? 0,
          (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) - n,
        );
      }
    }
    // An abandoned building's emits were already taken out.
    if (!this.inactive.delete(uid)) this.fields.apply(rectOf(b.def, b.x, b.z), b.def.emits, -1);
    for (const k of restoreTrees) this.terrain.clearedTrees?.delete(k);
    this.emit({ type: 'removed', building: b });
    if (restoreTrees.length) this.emit({ type: 'trees', tiles: restoreTrees.map(parseKey) });
    return b;
  }

  /**
   * Turns a building into another type in place (upgrade or decline). Footprints must match.
   * Emitted as removed + added with the same uid, so renderers need no extra case.
   */
  _replace(uid: number, def: BuildingDef): PlacedBuilding {
    const old = this.buildings.get(uid);
    if (!old) throw new Error(`no building ${uid}`);
    if (old.def.footprint.w !== def.footprint.w || old.def.footprint.d !== def.footprint.d) {
      throw new Error(`cannot replace ${old.def.id} with ${def.id}: footprints differ`);
    }
    const rect = rectOf(def, old.x, old.z);
    const active = !this.inactive.has(uid);
    if (active) this.fields.apply(rect, old.def.emits, -1);
    const b: PlacedBuilding = { uid, def, x: old.x, z: old.z };
    this.buildings.set(uid, b);
    this.perDef.set(old.def.id, this.countOf(old.def.id) - 1);
    this.perDef.set(def.id, this.countOf(def.id) + 1);
    if (active) {
      if (old.def.storage) {
        for (const [r, n] of Object.entries(old.def.storage)) {
          this.capacities[r] = Math.max(
            BASE_CAPACITY[r] ?? 0,
            (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) - n,
          );
        }
      }
      if (def.storage) {
        for (const [r, n] of Object.entries(def.storage)) {
          this.capacities[r] = (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) + n;
        }
      }
      this.fields.apply(rect, def.emits, 1);
    }
    this.emit({ type: 'removed', building: old });
    this.emit({ type: 'added', building: b });
    return b;
  }

  /** Abandon (false) or reactivate (true) a building. */
  _setActive(uid: number, active: boolean): void {
    const b = this.buildings.get(uid);
    if (!b || active === !this.inactive.has(uid)) return;
    if (active) this.inactive.delete(uid);
    else this.inactive.add(uid);
    if (b.def.storage) {
      for (const [r, n] of Object.entries(b.def.storage)) {
        if (active) {
          this.capacities[r] = (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) + n;
        } else {
          this.capacities[r] = Math.max(
            BASE_CAPACITY[r] ?? 0,
            (this.capacities[r] ?? BASE_CAPACITY[r] ?? 1000) - n,
          );
        }
      }
    }
    this.fields.apply(rectOf(b.def, b.x, b.z), b.def.emits, active ? 1 : -1);
    this.emit({ type: 'status', building: b, active });
  }

  /** Announces buildings that just became available. */
  _unlocked(ids: readonly string[]): void {
    if (ids.length) this.emit({ type: 'unlocked', ids });
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

/** Exact for |x|, |z| < 2^25 (far beyond the floating-origin range). */
function occKey(x: number, z: number): number {
  return (x + 0x2000000) * 0x4000000 + (z + 0x2000000);
}

function parseKey(k: string): { x: number; z: number } {
  const [x, z] = k.split(',').map(Number);
  return { x: x as number, z: z as number };
}
