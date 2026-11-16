import { LABOR_TIERS, type Amounts, isRoadDef } from '@/sim/catalog';
import { type City, rectOf } from '@/sim/city';
import { BatchCommand, type History, PlaceCommand } from '@/sim/commands';
import type { Rect } from '@/sim/geometry';
import { checkPlacement } from '@/sim/requirements';
import { tileKey } from '@/sim/terrainQuery';

export interface PlannedBuilding {
  readonly id: number;
  readonly defId: string;
  readonly x: number;
  readonly z: number;
}

type BlueprintPiece = Omit<PlannedBuilding, 'id'>;
export type Blueprint = readonly BlueprintPiece[];
export type BlueprintRotation = 0 | 90 | 180 | 270;

export interface PlanOperations {
  consumed: Record<string, number>;
  produced: Record<string, number>;
  workersNeeded: Record<string, number>;
  workersProvided: Record<string, number>;
}

const MAX_BLUEPRINT_PIECES = 512;
// City packs tile coordinates into the occupancy index with 26 bits per axis.
const TILE_LIMIT = 2 ** 25;

function addOperatingAmounts(
  stock: Record<string, number>,
  workers: Record<string, number>,
  amounts: Amounts | undefined,
): void {
  if (!amounts) return;
  for (const [key, n] of Object.entries(amounts)) {
    const dest = LABOR_TIERS.includes(key) ? workers : stock;
    dest[key] = (dest[key] ?? 0) + n;
  }
}

function rotatedPosition(rect: Rect, w: number, d: number, rotation: BlueprintRotation) {
  switch (rotation) {
    case 0:
      return { x: rect.x, z: rect.z };
    case 90:
      return { x: d - rect.z - rect.d, z: rect.x };
    case 180:
      return { x: w - rect.x - rect.w, z: d - rect.z - rect.d };
    case 270:
      return { x: rect.z, z: w - rect.x - rect.w };
  }
}

function reserve(rect: Rect, covered: Set<string>): boolean {
  for (let z = rect.z; z < rect.z + rect.d; z++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const key = tileKey(x, z);
      if (covered.has(key)) return false;
      covered.add(key);
    }
  }
  return true;
}

/**
 * Plan mode: ghost buildings that cost nothing and do not affect the simulation.
 * "Build plan" turns every plan that is valid and affordable into real buildings, as one undo step.
 */
export class PlanStore {
  private plans = new Map<number, PlannedBuilding>();
  private tiles = new Map<string, number>();
  private nextId = 1;
  private listeners: (() => void)[] = [];
  /** While on, the build tool draws plans instead of buildings. */
  private modeOn = false;

  constructor(private readonly city: City) {
    // A real building placed over a plan replaces it.
    city.on((e) => {
      if (e.type !== 'added') return;
      const { building: b } = e;
      const hit = new Set<number>();
      for (let z = b.z; z < b.z + b.def.footprint.d; z++)
        for (let x = b.x; x < b.x + b.def.footprint.w; x++) {
          const id = this.tiles.get(tileKey(x, z));
          if (id !== undefined) hit.add(id);
        }
      for (const id of hit) this.drop(id);
      if (hit.size) this.changed();
    });
  }

  on(fn: () => void): void {
    this.listeners.push(fn);
  }

  get mode(): boolean {
    return this.modeOn;
  }

  setMode(on: boolean): void {
    this.modeOn = on;
    this.changed();
  }

  get count(): number {
    return this.plans.size;
  }

  all(): PlannedBuilding[] {
    return [...this.plans.values()];
  }

  at(x: number, z: number): PlannedBuilding | undefined {
    const id = this.tiles.get(tileKey(x, z));
    return id === undefined ? undefined : this.plans.get(id);
  }

  /** Sum of the cost of every plan. */
  totalCost(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const p of this.plans.values()) {
      for (const [r, n] of Object.entries(this.city.catalog.get(p.defId).cost))
        out[r] = (out[r] ?? 0) + n;
    }
    return out;
  }

  /** Rates from building definitions, assuming full occupancy and normal operation. */
  operations(): PlanOperations {
    const sum: PlanOperations = {
      consumed: {},
      produced: {},
      workersNeeded: {},
      workersProvided: {},
    };
    for (const p of this.plans.values()) {
      const { upkeep, produces } = this.city.catalog.get(p.defId);
      addOperatingAmounts(sum.consumed, sum.workersNeeded, upkeep);
      addOperatingAmounts(sum.produced, sum.workersProvided, produces);
    }
    return sum;
  }

  captureBlueprint(): Blueprint | undefined {
    if (!this.count || this.count > MAX_BLUEPRINT_PIECES) return undefined;
    const draft = this.all();
    const x0 = Math.min(...draft.map((p) => p.x));
    const z0 = Math.min(...draft.map((p) => p.z));
    return draft.map(({ defId, x, z }) => ({ defId, x: x - x0, z: z - z0 }));
  }

  /** Validates untrusted data from the local blueprint library against the current catalog. */
  readBlueprint(raw: unknown): Blueprint | undefined {
    if (!Array.isArray(raw) || !raw.length || raw.length > MAX_BLUEPRINT_PIECES) return undefined;
    const pieces: BlueprintPiece[] = [];
    const covered = new Set<string>();
    for (const entry of raw as unknown[]) {
      if (!entry || typeof entry !== 'object') return undefined;
      const { defId, x, z } = entry as Partial<Record<keyof BlueprintPiece, unknown>>;
      if (
        typeof defId !== 'string' ||
        !this.city.catalog.has(defId) ||
        typeof x !== 'number' ||
        typeof z !== 'number' ||
        !Number.isSafeInteger(x) ||
        !Number.isSafeInteger(z) ||
        x < 0 ||
        z < 0 ||
        x >= TILE_LIMIT * 2 ||
        z >= TILE_LIMIT * 2
      ) {
        return undefined;
      }
      if (!reserve(rectOf(this.city.catalog.get(defId), x, z), covered)) return undefined;
      pieces.push({ defId, x, z });
    }
    return pieces;
  }

  blueprintSize(blueprint: Blueprint): { w: number; d: number; quarterTurns: boolean } {
    let w = 0;
    let d = 0;
    let quarterTurns = true;
    for (const p of blueprint) {
      const size = this.city.catalog.get(p.defId).footprint;
      w = Math.max(w, p.x + size.w);
      d = Math.max(d, p.z + size.d);
      quarterTurns &&= size.w === size.d;
    }
    return { w, d, quarterTurns };
  }

  /** Stamps a whole layout at its new upper-left corner, or leaves the draft untouched. */
  stampBlueprint(blueprint: Blueprint, x: number, z: number, rotation: BlueprintRotation): number {
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z) || !blueprint.length) return 0;
    const { w, d, quarterTurns } = this.blueprintSize(blueprint);
    if (!quarterTurns && (rotation === 90 || rotation === 270)) return 0;
    const covered = new Set<string>();
    const pending: { defId: string; rect: Rect }[] = [];
    for (const p of blueprint) {
      const relative = rectOf(this.city.catalog.get(p.defId), p.x, p.z);
      const offset = rotatedPosition(relative, w, d, rotation);
      const rect = this.draftSite(p.defId, x + offset.x, z + offset.z);
      if (!rect || !reserve(rect, covered)) return 0;
      pending.push({ defId: p.defId, rect });
    }
    for (const { defId, rect } of pending) this.insert(defId, rect);
    this.changed();
    return pending.length;
  }

  /**
   * Adds a plan if its footprint is free (of buildings and other plans) and the ground suits it.
   * Cost and requirements are ignored: a plan is allowed to be ahead of the town.
   */
  add(defId: string, x: number, z: number): PlannedBuilding | undefined {
    const rect = this.draftSite(defId, x, z);
    if (!rect) return undefined;
    const p = this.insert(defId, rect);
    this.changed();
    return p;
  }

  remove(id: number): void {
    if (this.drop(id)) this.changed();
  }

  clear(): void {
    this.plans.clear();
    this.tiles.clear();
    this.changed();
  }

  /**
   * Builds plans in the order they were drawn (roads first, so buildings find them).
   * Plans that cannot be built yet stay. Returns how many were built.
   */
  build(history: History): number {
    const isRoad = (id: string): number =>
      Number(this.city.catalog.has(id) && isRoadDef(this.city.catalog.get(id)));
    const order = this.all().sort((a, b) => isRoad(b.defId) - isRoad(a.defId) || a.id - b.id);
    const cmds = order.map((p) => ({ p, cmd: new PlaceCommand(p.defId, p.x, p.z) }));
    const batch = new BatchCommand(
      'build plan',
      cmds.map((c) => c.cmd),
    );
    if (!history.run(batch)) return 0;
    // Built plans were removed by the 'added' listener.
    return cmds.filter((c) => c.cmd.placedUid !== undefined).length;
  }

  private draftSite(defId: string, x: number, z: number): Rect | undefined {
    const def = this.city.catalog.get(defId);
    const rect = rectOf(def, x, z);
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(z) ||
      x < -TILE_LIMIT ||
      z < -TILE_LIMIT ||
      x + rect.w > TILE_LIMIT ||
      z + rect.d > TILE_LIMIT
    ) {
      return undefined;
    }
    const { site } = checkPlacement(this.city, def, x, z);
    if (!site.every((s) => s.ok || s.key === 'req.locked')) return undefined;
    for (let tz = z; tz < z + rect.d; tz++)
      for (let tx = x; tx < x + rect.w; tx++) if (this.tiles.has(tileKey(tx, tz))) return undefined;
    return rect;
  }

  private insert(defId: string, rect: Rect): PlannedBuilding {
    const p = { id: this.nextId++, defId, x: rect.x, z: rect.z };
    this.plans.set(p.id, p);
    for (let z = rect.z; z < rect.z + rect.d; z++)
      for (let x = rect.x; x < rect.x + rect.w; x++) this.tiles.set(tileKey(x, z), p.id);
    return p;
  }

  private drop(id: number): boolean {
    const p = this.plans.get(id);
    if (!p) return false;
    const r = rectOf(this.city.catalog.get(p.defId), p.x, p.z);
    for (let tz = r.z; tz < r.z + r.d; tz++)
      for (let tx = r.x; tx < r.x + r.w; tx++) this.tiles.delete(tileKey(tx, tz));
    this.plans.delete(id);
    return true;
  }

  private changed(): void {
    for (const l of this.listeners) l();
  }
}
