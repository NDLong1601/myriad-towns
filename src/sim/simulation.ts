/**
 * The town simulation (M3): a fixed-step tick that runs the economy every tick and the
 * rule engine (upgrade / decline / recover) on 1/8 of the buildings per tick.
 *
 * Deterministic: no clocks, no randomness; buildings are visited in uid order.
 * Every decline is announced by a `warn` event at least `warnAtTicks` before it happens.
 */
import { type Amounts, type BuildingDef, LABOR_TIERS } from '@/sim/catalog';
import { type City, type PlacedBuilding, rectOf } from '@/sim/city';
import { TICK_DT, TICK_HZ } from '@/sim/clock';
import { fieldIndex } from '@/sim/fields';
import { type CheckResult, checkRequirement, checkSustain } from '@/sim/requirements';
import { waterRoute, type WaterTile } from '@/sim/waterRoutes';
import type { RegionalTrade } from '@/sim/regionalTrade';

/** Rule-engine stride: each building is checked every RULE_STRIDE ticks (2 s at 1×). */
export const RULE_STRIDE = 8;
export const DEFAULT_WARN_TICKS = 20;
export const DEFAULT_GRACE_TICKS = 80;

/** Workplaces are staffed in this order, so food keeps flowing when labour is short. */
const CATEGORY_PRIORITY = ['food', 'service', 'production', 'nature', 'infrastructure'];

const LABOR = new Set(LABOR_TIERS);
const HOME_FIELDS = ['water_access', 'health', 'leisure', 'greenery', 'pollution', 'noise'].map(
  fieldIndex,
);

export type Problem =
  | { kind: 'labor'; tier: string }
  | { kind: 'input'; resource: string }
  | { kind: 'hungry'; resource: string }
  | { kind: 'requirement'; check: CheckResult };

export interface BuildingState {
  /** Residents in this home. Non-residential and abandoned buildings have none. */
  residents: number;
  /** Has the workers it needs this tick (always true for buildings that need none). */
  staffed: boolean;
  /** Had every input this tick (for housing: was fed). */
  supplied: boolean;
  /** Economic shortages this tick. */
  shortages: Problem[];
  /** Ticks in a row a decline condition has held (counted at rule checks). */
  unmetTicks: number;
  /** Tick at which the pending decline was announced, or -1. */
  warnedAt: number;
}

export type SimEvent =
  | { type: 'warn'; uid: number; defId: string; inTicks: number; problems: Problem[] }
  | { type: 'resolved'; uid: number; defId: string }
  | { type: 'declined'; uid: number; from: string; to: string | null }
  | { type: 'recovered'; uid: number; defId: string }
  | { type: 'upgraded'; uid: number; from: string; to: string }
  | { type: 'unlocked'; ids: readonly string[] };

export interface Flows {
  /** Per second at 1×. */
  produced: Record<string, number>;
  consumed: Record<string, number>;
  /** Labour per tier: available (from fed housing) and used. */
  laborTotal: Record<string, number>;
  laborUsed: Record<string, number>;
  population: number;
  housingCapacity: number;
}

/** Per-type numbers the economy loop needs, precomputed (no Object.entries per tick). */
interface Compiled {
  labor: [string, number][];
  inputs: [string, number][];
  outputs: [string, number][];
  laborOut: [string, number][];
  /** Takes part in the economy at all. */
  economic: boolean;
  /** Has anything for the rule engine to check. */
  ruled: boolean;
}

/** Where buildings belong, for the dormant tier (TownStore implements it). */
export interface TierSource {
  townOfBuilding(b: PlacedBuilding): number;
  /** Bumped whenever membership may have changed. */
  readonly version: number;
}

/** A dormant town's economy, frozen from its last active tick and applied as a rate. */
export interface TownSummary {
  produced: [string, number][];
  consumed: [string, number][];
  population: number;
  housingCapacity: number;
  laborTotal: Record<string, number>;
  laborUsed: Record<string, number>;
}

function compile(def: BuildingDef): Compiled {
  const up = Object.entries(def.upkeep ?? {});
  const pr = Object.entries(def.produces ?? {});
  const c: Compiled = {
    labor: up.filter(([r]) => LABOR.has(r)),
    inputs: up.filter(([r]) => !LABOR.has(r)),
    outputs: pr.filter(([r]) => !LABOR.has(r)),
    laborOut: def.housing ? pr.filter(([r]) => LABOR.has(r)) : [],
    economic: false,
    ruled: false,
  };
  c.economic = up.length + pr.length > 0 || !!def.housing;
  c.ruled = !!(def.requires?.length || def.upgrades?.length || def.housing || c.inputs.length);
  return c;
}

export class Simulation {
  tick = 0;
  private compiled = new Map<string, Compiled>();
  private state = new Map<number, BuildingState>();
  private work = new Map<number, number>();
  private routes = new Map<number, readonly WaterTile[]>();
  private order: PlacedBuilding[] = [];
  private byUid: number[] = [];
  private dirty = true;
  private listeners: ((e: SimEvent) => void)[] = [];
  flows: Flows = emptyFlows();
  sharedFlows: Flows = this.flows;
  regionalTrade?: RegionalTrade;
  private canDispatch = (uid: number): boolean => {
    const state = this.state.get(uid);
    return !!state?.staffed && state.supplied;
  };
  /** Sandbox option: buildings never warn or decline. */
  noDecline = false;
  /** Duration of the last tick in ms (filled in by the caller that times it). */
  lastTickMs = 0;
  /** Town membership for the dormant tier; without it every building is active. */
  tiers: TierSource | undefined;
  private tiersVersion = -1;
  private townOfUid = new Map<number, number>();
  private townsWithJobs = new Set<number>();
  private homeFields = new Float64Array(HOME_FIELDS.length);
  private dormant = new Map<number, TownSummary>();
  /** `order` and `byUid` without the buildings of dormant towns (what each tick visits). */
  private runOrder: PlacedBuilding[] = [];
  private runByUid: number[] = [];
  private runDirty = true;

  constructor(readonly city: City) {
    city.on((e) => {
      if (e.type === 'added') {
        const { uid, def } = e.building;
        const capacity = def.housing ?? 0;
        const state = this.state.get(uid);
        if (state) {
          state.residents = Math.min(capacity, state.residents);
        } else {
          this.state.set(uid, freshState(starterHousehold(capacity)));
        }
        this.prepareWork(e.building);
        this.dirty = true;
      } else if (e.type === 'removed') {
        this.work.delete(e.building.uid);
        this.routes.delete(e.building.uid);
        // A replace emits removed + added with the same uid; keep its state in that case.
        if (!city.get(e.building.uid)) this.state.delete(e.building.uid);
        this.dirty = true;
      } else if (e.type === 'status') {
        const s = this.state.get(e.building.uid);
        if (s) s.residents = e.active ? starterHousehold(e.building.def.housing ?? 0) : 0;
      }
    });
    for (const b of city.all()) {
      this.state.set(b.uid, freshState(city.isActive(b.uid) ? (b.def.housing ?? 0) : 0));
      this.prepareWork(b);
    }
    this.refreshPopulation();
  }

  private prepareWork(b: PlacedBuilding): void {
    if (b.def.voyage) this.routes.set(b.uid, waterRoute(this.city.terrain, b, b.def.voyage.range));
    if (b.def.voyage || b.def.crop) this.work.set(b.uid, 0);
  }

  cropStageOf(uid: number): number {
    const crop = this.city.get(uid)?.def.crop;
    return crop ? 1 + Math.floor((4 * (this.work.get(uid) ?? 0)) / crop.ticks) : 0;
  }

  voyageRouteOf(uid: number): readonly WaterTile[] | undefined {
    return this.routes.get(uid);
  }

  voyagePhaseOf(uid: number): number {
    const period = this.city.get(uid)?.def.voyage?.ticks;
    return period ? (this.work.get(uid) ?? 0) / period : 0;
  }

  exportWork(): [number, number][] {
    return [...this.work].filter(([, age]) => age > 0).sort((a, b) => a[0] - b[0]);
  }

  importWork(uid: number, age: number): void {
    const def = this.city.get(uid)?.def;
    const period = def?.crop?.ticks ?? def?.voyage?.ticks;
    if (period && Number.isSafeInteger(age) && age >= 0) this.work.set(uid, age % period);
  }

  on(fn: (e: SimEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  stateOf(uid: number): BuildingState | undefined {
    return this.state.get(uid);
  }

  get population(): number {
    return this.flows.population;
  }

  get housingCapacity(): number {
    return this.flows.housingCapacity;
  }

  residentsOf(uid: number): number {
    return this.state.get(uid)?.residents ?? 0;
  }

  /** Occupancy changes outlive the economy tick so paused saves still report their residents. */
  refreshPopulation(): void {
    let population = 0;
    let housingCapacity = 0;
    for (const b of this.city.all()) {
      if (!b.def.housing || !this.city.isActive(b.uid)) continue;
      housingCapacity += b.def.housing;
      population += this.residentsOf(b.uid);
    }
    this.flows.population = population;
    this.flows.housingCapacity = housingCapacity;
  }

  exportResidents(): [number, number][] {
    this.refreshOrder();
    const out: [number, number][] = [];
    for (const uid of this.byUid) {
      if (this.city.get(uid)?.def.housing) out.push([uid, this.residentsOf(uid)]);
    }
    return out;
  }

  importResidents(uid: number, count: number): void {
    const home = this.city.get(uid);
    const state = this.state.get(uid);
    if (!home?.def.housing || !state || !Number.isSafeInteger(count) || count < 0) return;
    state.residents = this.city.isActive(uid) ? Math.min(count, home.def.housing) : 0;
  }

  /** Ticks until a pending decline happens, if one is pending. */
  declineIn(uid: number): number | undefined {
    const s = this.state.get(uid);
    const b = this.city.get(uid);
    if (!s || !b || s.warnedAt < 0) return undefined;
    const { warn, grace } = declineTimes(b.def);
    return Math.max(0, Math.max(grace - s.unmetTicks, s.warnedAt + warn - this.tick));
  }

  /** Every reason this building is not working fully or may decline, for the "Why?" panel. */
  problemsOf(uid: number): Problem[] {
    const b = this.city.get(uid);
    const s = this.state.get(uid);
    if (!b || !s) return [];
    const out: Problem[] = [...s.shortages];
    for (const c of checkSustain(this.city, uid))
      if (!c.ok) out.push({ kind: 'requirement', check: c });
    return out;
  }

  /** Per-building state for saves: [uid, flags (1 staffed, 2 supplied), unmetTicks, warnedAt]. */
  exportStates(): number[][] {
    this.refreshOrder();
    return this.byUid.map((uid) => {
      const s = this.state.get(uid) as BuildingState;
      return [uid, (s.staffed ? 1 : 0) | (s.supplied ? 2 : 0), s.unmetTicks, s.warnedAt];
    });
  }

  /** Restores one building's state (after the building itself was re-added). */
  importState(uid: number, flags: number, unmetTicks: number, warnedAt: number): void {
    this.state.set(uid, {
      // Legacy saves assumed every occupied plot was full.
      residents: this.city.isActive(uid) ? (this.city.get(uid)?.def.housing ?? 0) : 0,
      staffed: (flags & 1) !== 0,
      supplied: (flags & 2) !== 0,
      shortages: [],
      unmetTicks,
      warnedAt,
    });
  }

  /** Towns currently simulated as a summary. */
  dormantTowns(): number[] {
    return [...this.dormant.keys()];
  }

  isDormant(town: number): boolean {
    return this.dormant.has(town);
  }

  summaryOf(town: number): TownSummary | undefined {
    return this.dormant.get(town);
  }

  /**
   * Puts a town to sleep (its economy continues as a fixed rate, no rule checks) or wakes it
   * (full simulation resumes from the per-building state it had when it fell asleep).
   */
  setDormant(town: number, dormant: boolean): void {
    if (dormant === this.dormant.has(town)) return;
    this.runDirty = true;
    if (!dormant) {
      this.dormant.delete(town);
      return;
    }
    this.refreshOrder();
    const sum: TownSummary = {
      produced: [],
      consumed: [],
      population: 0,
      housingCapacity: 0,
      laborTotal: {},
      laborUsed: {},
    };
    const prod: Record<string, number> = {};
    const cons: Record<string, number> = {};
    for (const b of this.order) {
      if (this.townOfUid.get(b.uid) !== town || !this.city.isActive(b.uid)) continue;
      const s = this.state.get(b.uid) as BuildingState;
      const c = this.info(b.def);
      if (b.def.housing) {
        sum.population += s.residents;
        sum.housingCapacity += b.def.housing;
        if (s.supplied)
          for (const [r, n] of c.laborOut)
            sum.laborTotal[r] =
              (sum.laborTotal[r] ?? 0) + Math.floor((n * s.residents) / b.def.housing);
      }
      if (!s.staffed) continue;
      for (const [r, n] of c.labor) sum.laborUsed[r] = (sum.laborUsed[r] ?? 0) + n;
      if (!s.supplied) continue;
      const occupancy = b.def.housing ? s.residents / b.def.housing : 1;
      for (const [r, n] of c.inputs) cons[r] = (cons[r] ?? 0) + n * occupancy;
      for (const [r, n] of c.outputs) prod[r] = (prod[r] ?? 0) + n * occupancy;
    }
    sum.produced = Object.entries(prod).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    sum.consumed = Object.entries(cons).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    this.dormant.set(town, sum);
  }

  private asleep(uid: number): boolean {
    return this.dormant.size > 0 && this.dormant.has(this.townOfUid.get(uid) ?? -1);
  }

  /** Rebuilds the per-tick lists after membership or the dormant set changed. */
  private refreshRun(): void {
    this.refreshOrder();
    if (!this.runDirty) return;
    this.runDirty = false;
    if (!this.dormant.size) {
      this.runOrder = this.order;
      this.runByUid = this.byUid;
      return;
    }
    this.runOrder = this.order.filter((b) => !this.asleep(b.uid));
    this.runByUid = this.byUid.filter((uid) => !this.asleep(uid));
  }

  step(): void {
    this.refreshRun();
    this.economy();
    this.rules();
    this.regionalTrade?.tick(this.canDispatch);
    const fresh = this.city.progress.update(this.flows.population, this.city.catalog.defs);
    if (fresh.length) {
      this.city._unlocked(fresh);
      this.emit({ type: 'unlocked', ids: fresh });
    }
    this.tick++;
  }

  /** Runs `n` ticks; returns the time it took in ms per tick (0 if no clock is available). */
  run(n: number, now?: () => number): void {
    const t0 = now?.() ?? 0;
    for (let i = 0; i < n; i++) this.step();
    if (now && n > 0) this.lastTickMs = (now() - t0) / n;
  }

  /** Stable hash of the whole simulated state, for determinism tests. */
  hash(): number {
    let h = 0x811c9dc5 ^ this.tick;
    const mix = (v: number): void => {
      h = Math.imul(h ^ (v | 0), 0x01000193) >>> 0;
    };
    for (const r of Object.keys(this.city.stock).sort()) {
      mix(Math.round((this.city.stock[r] ?? 0) * 1000));
      for (const ch of r) mix(ch.charCodeAt(0));
    }
    this.refreshOrder();
    for (const uid of this.byUid) {
      const b = this.city.get(uid) as PlacedBuilding;
      const s = this.state.get(uid) as BuildingState;
      mix(uid);
      for (const ch of b.def.id) mix(ch.charCodeAt(0));
      mix(this.city.isActive(uid) ? 1 : 0);
      mix(s.unmetTicks);
      mix(s.warnedAt);
      mix((s.staffed ? 1 : 0) | (s.supplied ? 2 : 0));
      if (b.def.housing) mix(s.residents);
      if (this.work.has(uid)) mix(this.work.get(uid) ?? 0);
    }
    return h >>> 0;
  }

  // ---------------------------------------------------------------- economy

  /** Each home considers a move once per second, staggered by uid. */
  private migrate(b: PlacedBuilding, state: BuildingState, capacity: number): void {
    const values = this.homeFields;
    this.city.fields.sample(b.x, b.z, HOME_FIELDS, values);
    const amenities = values[0]! + values[1]! + values[2]! + values[3]! / 2;
    const pollution = values[4]!;
    const town = this.townOfUid.get(b.uid) ?? -1;
    const pressure =
      pollution * (this.policyActive(town, 'green_city') ? 0.5 : 1) + values[5]! / 2 - amenities;
    const fed = state.supplied && this.hasInputs(b, Math.max(1, state.residents) / capacity);
    const desired = !fed || state.unmetTicks > 0 || pressure >= 4 ? 0.5 : pressure >= 2 ? 0.75 : 1;
    const target = Math.ceil(capacity * desired);
    const jobs = this.townsWithJobs.has(this.townOfUid.get(b.uid) ?? -1);
    const pace = Math.max(1, Math.ceil(capacity / (jobs || amenities >= 1 ? 4 : 8)));
    state.residents += Math.max(-pace, Math.min(pace, target - state.residents));
  }

  private economy(): void {
    const city = this.city;
    const flows = emptyFlows();
    const trade = this.regionalTrade;
    const localProduction: Record<string, number> = {};
    const localConsumption: Record<string, number> = {};
    const localLabor = trade?.hasReserves ? new Map<number, Record<string, number>>() : undefined;
    trade?.fundPolicies(flows.consumed, localConsumption);
    const free: Record<string, number> = {};
    for (const tier of LABOR_TIERS) free[tier] = 0;

    // 1. Labour comes from residents who were fed on the previous tick.
    const migrationPhase = this.tick % TICK_HZ;
    for (const b of this.runOrder) {
      if (!b.def.housing || !city.isActive(b.uid)) continue;
      const s = this.state.get(b.uid) as BuildingState;
      if (b.uid % TICK_HZ === migrationPhase) this.migrate(b, s, b.def.housing);
      flows.population += s.residents;
      flows.housingCapacity += b.def.housing;
      if (!s.supplied) continue;
      let labor = free;
      if (localLabor) {
        const town = this.townOfUid.get(b.uid) ?? -1;
        if (trade?.reserve(town)) {
          labor = localLabor.get(town) ?? {};
          localLabor.set(town, labor);
        }
      }
      for (const [r, n] of this.info(b.def).laborOut) {
        const workers = Math.floor((n * s.residents) / b.def.housing);
        labor[r] = (labor[r] ?? 0) + workers;
        flows.laborTotal[r] = (flows.laborTotal[r] ?? 0) + workers;
      }
    }

    // 2. Staff, then run, every active building in priority order (housing last).
    const stock = city.stock;
    // Buildings of dormant towns are not in runOrder: their towns run as a summary below.
    for (const b of this.runOrder) {
      const s = this.state.get(b.uid) as BuildingState;
      const c = this.info(b.def);
      const town = trade ? (this.townOfUid.get(b.uid) ?? -1) : -1;
      const labor = trade?.reserve(town) ? localLabor?.get(town) : free;
      if (s.shortages.length) s.shortages = [];
      const voyageTicks = b.def.voyage?.ticks ?? 0;
      if (!city.isActive(b.uid) || (voyageTicks && !this.routes.get(b.uid)?.length)) {
        s.staffed = false;
        s.supplied = false;
        continue;
      }
      s.staffed = true;
      for (const [r, n] of c.labor) {
        if ((labor?.[r] ?? 0) < n) {
          s.staffed = false;
          s.shortages.push({ kind: 'labor', tier: r });
        }
      }
      if (!s.staffed) {
        s.supplied = false;
        continue;
      }
      if (labor) {
        for (const [r, n] of c.labor) {
          labor[r] = (labor[r] ?? 0) - n;
          flows.laborUsed[r] = (flows.laborUsed[r] ?? 0) + n;
        }
      }

      s.supplied = true;
      const occupancy = b.def.housing ? Math.max(1, s.residents) / b.def.housing : 1;
      for (const [r, n] of c.inputs) {
        const supply = trade?.operatingStock(town, r) ?? stock;
        if ((supply[r] ?? 0) < n * occupancy * TICK_DT) {
          s.supplied = false;
          s.shortages.push(
            b.def.housing ? { kind: 'hungry', resource: r } : { kind: 'input', resource: r },
          );
        }
      }
      if (!s.supplied) continue;
      const period = voyageTicks || b.def.crop?.ticks || 0;
      let arrived = false;
      if (period) {
        const age = ((this.work.get(b.uid) ?? 0) + 1) % period;
        this.work.set(b.uid, age);
        arrived = age === 0;
      }
      for (const [r, n] of c.inputs) {
        const rate = n * occupancy;
        const supply = trade?.operatingStock(town, r) ?? stock;
        supply[r] = (supply[r] ?? 0) - rate * TICK_DT;
        flows.consumed[r] = (flows.consumed[r] ?? 0) + rate;
        if (supply !== stock) localConsumption[r] = (localConsumption[r] ?? 0) + rate;
      }
      for (const [r, n] of c.outputs) {
        let mult = b.def.housing ? s.residents / b.def.housing : 1;
        if (this.policyActive(town, 'industrial_drive') && industrialResource(r)) {
          mult *= 1.25;
        }
        mult *= trade?.outputFactor(town, r) ?? 1;
        const supply = trade?.operatingStock(town, r) ?? stock;
        const cap = supply === stock ? city.capacityOf(r) : trade!.capacity(r);
        const cur = supply[r] ?? 0;
        const elapsed = (voyageTicks || 1) * TICK_DT;
        const add = Math.min(Math.max(0, cap - cur), n * mult * elapsed);
        if (!voyageTicks || arrived) supply[r] = cur + add;
        const rate = add / elapsed;
        flows.produced[r] = (flows.produced[r] ?? 0) + rate;
        if (supply !== stock) localProduction[r] = (localProduction[r] ?? 0) + rate;
      }
    }
    // Policy maintenance costs and benefits
    if (city.isPolicyActive('green_city')) {
      const take = Math.min(stock.goods ?? 0, 0.2 * TICK_DT);
      stock.goods = (stock.goods ?? 0) - take;
      flows.consumed.goods = (flows.consumed.goods ?? 0) + take / TICK_DT;
    }
    if (city.isPolicyActive('public_transit_subsidy')) {
      const take = Math.min(stock.goods ?? 0, 0.3 * TICK_DT);
      stock.goods = (stock.goods ?? 0) - take;
      flows.consumed.goods = (flows.consumed.goods ?? 0) + take / TICK_DT;
    }
    if (city.isPolicyActive('healthcare_focus')) {
      const take = Math.min(stock.food ?? 0, 0.4 * TICK_DT);
      stock.food = (stock.food ?? 0) - take;
      flows.consumed.food = (flows.consumed.food ?? 0) + take / TICK_DT;
    }
    if (city.isPolicyActive('night_economy')) {
      const cap = city.capacityOf('goods');
      const cur = stock.goods ?? 0;
      const add = Math.min(Math.max(0, cap - cur), 0.2 * TICK_DT);
      stock.goods = cur + add;
      flows.produced.goods = (flows.produced.goods ?? 0) + add / TICK_DT;
    }
    // 3. Dormant towns: their frozen rates. They keep to their own labour; consumption takes
    // what the stock has, so a far town can run short but never drives stock negative.
    for (const [town, sum] of this.dormant) {
      flows.population += sum.population;
      flows.housingCapacity += sum.housingCapacity;
      for (const [r, n] of Object.entries(sum.laborTotal))
        flows.laborTotal[r] = (flows.laborTotal[r] ?? 0) + n;
      for (const [r, n] of Object.entries(sum.laborUsed))
        flows.laborUsed[r] = (flows.laborUsed[r] ?? 0) + n;
      for (const [r, n] of sum.consumed) {
        const take = Math.min(stock[r] ?? 0, n * TICK_DT);
        stock[r] = (stock[r] ?? 0) - take;
        flows.consumed[r] = (flows.consumed[r] ?? 0) + take / TICK_DT;
      }
      for (const [r, n] of sum.produced) {
        const cap = city.capacityOf(r);
        const cur = stock[r] ?? 0;
        const industry =
          this.policyActive(town, 'industrial_drive') && industrialResource(r) ? 1.25 : 1;
        const add = Math.min(
          Math.max(0, cap - cur),
          n * TICK_DT * industry * (trade?.outputFactor(town, r) ?? 1),
        );
        stock[r] = cur + add;
        flows.produced[r] = (flows.produced[r] ?? 0) + add / TICK_DT;
      }
    }
    this.flows = flows;
    this.sharedFlows = trade?.hasReserves
      ? {
          ...flows,
          produced: withoutLocal(flows.produced, localProduction),
          consumed: withoutLocal(flows.consumed, localConsumption),
        }
      : flows;
    // Stock listeners (resource bar, menu affordability) hear about it once per game second.
    if (this.tick % TICK_HZ === 0) city._addStock({}, 1);
  }

  // ------------------------------------------------------------ rule engine

  private rules(): void {
    const city = this.city;
    const phase = this.tick % RULE_STRIDE;
    const changes: (() => void)[] = [];
    for (let i = phase; i < this.runByUid.length; i += RULE_STRIDE) {
      const uid = this.runByUid[i] as number;
      const b = city.get(uid);
      const s = this.state.get(uid);
      if (!b || !s || !this.info(b.def).ruled) continue;

      if (!city.isActive(uid)) {
        // Abandoned: comes back once its requirements hold and its inputs are in stock again.
        if (this.hasInputs(b) && checkSustain(city, uid).every((c) => c.ok)) {
          changes.push(() => {
            city._setActive(uid, true);
            s.unmetTicks = 0;
            s.warnedAt = -1;
            // Housing starts fed so it can produce labour on its first tick back.
            s.supplied = true;
            this.emit({ type: 'recovered', uid, defId: b.def.id });
          });
        }
        continue;
      }

      const sustain = this.noDecline ? undefined : checkSustain(city, uid);
      if (sustain && (sustain.some((c) => !c.ok) || s.shortages.some((p) => p.kind === 'hungry'))) {
        s.unmetTicks += RULE_STRIDE;
        const { warn, grace } = declineTimes(b.def);
        if (s.warnedAt < 0 && s.unmetTicks >= grace - warn) {
          s.warnedAt = this.tick;
          this.emit({
            type: 'warn',
            uid,
            defId: b.def.id,
            inTicks: Math.max(warn, grace - s.unmetTicks),
            problems: [
              ...s.shortages.filter((p) => p.kind === 'hungry'),
              ...sustain
                .filter((c) => !c.ok)
                .map((c) => ({ kind: 'requirement' as const, check: c })),
            ],
          });
        } else if (s.warnedAt >= 0 && s.unmetTicks >= grace && this.tick - s.warnedAt >= warn) {
          changes.push(() => this.decline(b, s));
        }
        continue;
      }

      if (s.warnedAt >= 0) this.emit({ type: 'resolved', uid, defId: b.def.id });
      s.unmetTicks = 0;
      s.warnedAt = -1;
      if (!s.supplied) continue;
      const merge = b.def.mergeInto && this.findMerge(b);
      if (merge) {
        changes.push(() => {
          const residents = merge.members.reduce((n, home) => n + this.residentsOf(home.uid), 0);
          const merged = city._merge(merge.target, merge.x, merge.z, merge.members);
          if (merged) {
            this.importResidents(merged.uid, residents);
            this.emit({ type: 'upgraded', uid: merged.uid, from: b.def.id, to: merged.def.id });
          }
        });
        continue;
      }
      const target = this.upgradeTarget(b);
      if (target) {
        changes.push(() => {
          city._replace(uid, target);
          this.emit({ type: 'upgraded', uid, from: b.def.id, to: target.id });
        });
      }
    }
    // Apply after checking, so every building in this slice saw the same city.
    for (const c of changes) c();
  }

  private findMerge(
    b: PlacedBuilding,
  ): { target: BuildingDef; x: number; z: number; members: PlacedBuilding[] } | undefined {
    const city = this.city;
    for (const rule of b.def.mergeInto ?? []) {
      if (!city.catalog.has(rule.to)) continue;
      const target = city.catalog.get(rule.to);
      if (!city.progress.isUnlocked(target)) continue;
      const { w, d } = target.footprint;
      for (let z = b.z - d + 1; z <= b.z; z++) {
        for (let x = b.x - w + 1; x <= b.x; x++) {
          const rect = rectOf(target, x, z);
          if (!rule.when.every((req) => checkRequirement(city, req, rect).ok)) continue;
          const members: PlacedBuilding[] = [];
          let level: number | undefined;
          for (let dz = 0; dz < d; dz++) {
            for (let dx = 0; dx < w; dx++) {
              const home = city.at(x + dx, z + dz);
              if (
                home?.def !== b.def ||
                !city.isActive(home.uid) ||
                this.asleep(home.uid) ||
                !this.state.get(home.uid)?.supplied ||
                !checkSustain(city, home.uid).every((c) => c.ok)
              )
                continue;
              const ground = city.terrain.tile(x + dx, z + dz).level;
              level ??= ground;
              if (ground === level) members.push(home);
            }
          }
          if (
            members.length === w * d &&
            (target.requires ?? []).every((req) => checkRequirement(city, req, rect).ok)
          ) {
            return { target, x, z, members };
          }
        }
      }
    }
    return undefined;
  }

  /** Enough stock for one second of this building's material upkeep. */
  private hasInputs(b: PlacedBuilding, occupancy = 1): boolean {
    const town = this.regionalTrade ? (this.townOfUid.get(b.uid) ?? -1) : -1;
    for (const [r, n] of this.info(b.def).inputs) {
      const stock = this.regionalTrade?.operatingStock(town, r) ?? this.city.stock;
      if ((stock[r] ?? 0) < n * occupancy) return false;
    }
    return true;
  }

  private policyActive(town: number, id: string): boolean {
    return this.regionalTrade?.isPolicyActive(town, id) ?? this.city.isPolicyActive(id);
  }

  private info(def: BuildingDef): Compiled {
    let c = this.compiled.get(def.id);
    if (!c) {
      c = compile(def);
      this.compiled.set(def.id, c);
    }
    return c;
  }

  private upgradeTarget(b: PlacedBuilding): BuildingDef | undefined {
    const city = this.city;
    const rect = rectOf(b.def, b.x, b.z);
    for (const u of b.def.upgrades ?? []) {
      if (!city.catalog.has(u.to)) continue;
      const to = city.catalog.get(u.to);
      if (to.footprint.w !== b.def.footprint.w || to.footprint.d !== b.def.footprint.d) continue;
      if (!city.progress.isUnlocked(to)) continue;
      if (!u.when.every((r) => checkRequirement(city, r, rect, b.uid).ok)) continue;
      // Do not upgrade into something that would immediately start declining.
      if (!(to.requires ?? []).every((r) => checkRequirement(city, r, rect, b.uid).ok)) continue;
      return to;
    }
    return undefined;
  }

  private decline(b: PlacedBuilding, s: BuildingState): void {
    const city = this.city;
    s.unmetTicks = 0;
    s.warnedAt = -1;
    const toId = b.def.decline?.to;
    if (toId && city.catalog.has(toId)) {
      city._replace(b.uid, city.catalog.get(toId));
      this.emit({ type: 'declined', uid: b.uid, from: b.def.id, to: toId });
    } else {
      city._setActive(b.uid, false);
      this.emit({ type: 'declined', uid: b.uid, from: b.def.id, to: null });
    }
  }

  // ----------------------------------------------------------------- helpers

  private refreshOrder(): void {
    if (this.tiers && this.tiers.version !== this.tiersVersion) this.dirty = true;
    if (!this.dirty) return;
    this.dirty = false;
    const all = [...this.city.all()];
    for (const b of all) if (!this.state.has(b.uid)) this.state.set(b.uid, freshState());
    for (const uid of [...this.state.keys()]) if (!this.city.get(uid)) this.state.delete(uid);
    this.byUid = all.map((b) => b.uid).sort((a, b) => a - b);
    this.runDirty = true;
    this.townOfUid.clear();
    if (this.tiers) {
      this.tiersVersion = this.tiers.version;
      for (const b of all) this.townOfUid.set(b.uid, this.tiers.townOfBuilding(b));
    }
    this.townsWithJobs.clear();
    for (const b of all) {
      if (this.info(b.def).labor.length) this.townsWithJobs.add(this.townOfUid.get(b.uid) ?? -1);
    }
    const rank = (d: BuildingDef): number => {
      if (d.housing) return CATEGORY_PRIORITY.length + 1;
      const i = CATEGORY_PRIORITY.indexOf(d.category);
      return i < 0 ? CATEGORY_PRIORITY.length : i;
    };
    // Buildings with no economy (roads, wells) are left out of the per-tick loop.
    this.order = all
      .filter((b) => this.info(b.def).economic)
      .sort((a, b) => rank(a.def) - rank(b.def) || a.uid - b.uid);
  }

  private emit(e: SimEvent): void {
    for (const l of this.listeners) l(e);
  }
}

function withoutLocal(
  all: Record<string, number>,
  local: Record<string, number>,
): Record<string, number> {
  const shared = { ...all };
  for (const r in local) shared[r] = Math.max(0, (shared[r] ?? 0) - (local[r] ?? 0));
  return shared;
}

function industrialResource(r: string): boolean {
  return r === 'ore' || r === 'coal' || r === 'metal' || r === 'wood' || r === 'goods';
}

export function declineTimes(def: BuildingDef): { warn: number; grace: number } {
  const warn = def.decline?.warnAtTicks ?? DEFAULT_WARN_TICKS;
  const grace = Math.max(warn, def.decline?.graceTicks ?? DEFAULT_GRACE_TICKS);
  return { warn, grace };
}

/** Net change per second of each stock resource. */
export function netFlows(f: Flows): Amounts {
  const out: Record<string, number> = {};
  for (const [r, n] of Object.entries(f.produced)) out[r] = (out[r] ?? 0) + n;
  for (const [r, n] of Object.entries(f.consumed)) out[r] = (out[r] ?? 0) - n;
  return out;
}

function starterHousehold(capacity: number): number {
  return Math.ceil(capacity / 2);
}

function freshState(residents = 0): BuildingState {
  // Start supplied so new housing provides labour on its first tick.
  return { residents, staffed: true, supplied: true, shortages: [], unmetTicks: 0, warnedAt: -1 };
}

function emptyFlows(): Flows {
  return {
    produced: {},
    consumed: {},
    laborTotal: {},
    laborUsed: {},
    population: 0,
    housingCapacity: 0,
  };
}
