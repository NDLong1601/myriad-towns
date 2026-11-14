import { type City, rectOf } from './city';
import { BatchCommand, type History, PlaceCommand } from './commands';
import { checkPlacement } from './requirements';
import { tileKey } from './terrainQuery';

export interface PlannedBuilding {
  readonly id: number;
  readonly defId: string;
  readonly x: number;
  readonly z: number;
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

  /**
   * Adds a plan if its footprint is free (of buildings and other plans) and the ground suits it.
   * Cost and requirements are ignored: a plan is allowed to be ahead of the town.
   */
  add(defId: string, x: number, z: number): PlannedBuilding | undefined {
    const def = this.city.catalog.get(defId);
    const site = checkPlacement(this.city, def, x, z).site.filter((s) => s.key !== 'req.locked');
    if (!site.every((s) => s.ok)) return undefined;
    const r = rectOf(def, x, z);
    for (let tz = r.z; tz < r.z + r.d; tz++)
      for (let tx = r.x; tx < r.x + r.w; tx++)
        if (this.tiles.has(tileKey(tx, tz))) return undefined;
    const p: PlannedBuilding = { id: this.nextId++, defId, x, z };
    this.plans.set(p.id, p);
    for (let tz = r.z; tz < r.z + r.d; tz++)
      for (let tx = r.x; tx < r.x + r.w; tx++) this.tiles.set(tileKey(tx, tz), p.id);
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
    const order = this.all().sort(
      (a, b) => Number(b.defId === 'road') - Number(a.defId === 'road') || a.id - b.id,
    );
    const cmds = order.map((p) => ({ p, cmd: new PlaceCommand(p.defId, p.x, p.z) }));
    const batch = new BatchCommand(
      'build plan',
      cmds.map((c) => c.cmd),
    );
    if (!history.run(batch)) return 0;
    // Built plans were removed by the 'added' listener.
    return cmds.filter((c) => c.cmd.placedUid !== undefined).length;
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
