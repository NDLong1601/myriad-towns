/**
 * Towns (M4b). The first building founds the first town; a Town hall founds another one far
 * away. Each town has a territory whose radius grows with its population; in Goals mode
 * buildings must go inside a territory, so the map opens up as towns grow or new ones are founded.
 *
 * A building belongs to the town with the nearest centre, which only changes when a town is
 * founded or removed (not when territories grow), so the simulation can cache it.
 */
import type { BuildingDef } from './catalog';
import { type City, type PlacedBuilding } from './city';
import type { Rect } from './geometry';
import type { CheckResult } from './requirements';

export const TOWN_HALL = 'town_hall';
/** Territory radius in tiles: BASE + PER_SQRT_POP × √population. */
export const TERRITORY_BASE = 28;
export const TERRITORY_PER_SQRT_POP = 3;
/** A new town's centre must be at least this far from every other centre. */
export const MIN_TOWN_GAP = 64;

export interface Town {
  readonly id: number;
  readonly x: number;
  readonly z: number;
  /** Building that founded it (first building or a town hall). */
  readonly hallUid: number;
  population: number;
  happiness: number;
}

export type TownEvent =
  { type: 'founded'; town: Town } | { type: 'removed'; town: Town } | { type: 'changed' };

export function territoryRadius(population: number): number {
  return TERRITORY_BASE + TERRITORY_PER_SQRT_POP * Math.sqrt(Math.max(0, population));
}

function centre(def: BuildingDef, x: number, z: number): { x: number; z: number } {
  return { x: x + def.footprint.w / 2, z: z + def.footprint.d / 2 };
}

export class TownStore {
  /** Goals mode: buildings must be placed inside a territory. */
  enforceTerritory = false;
  /** Bumped whenever membership may change (founding or removal). */
  version = 0;
  private towns: Town[] = [];
  /** While a save loads, buildings come back without founding towns. */
  private restoring = false;
  private nextId = 1;
  private listeners: ((e: TownEvent) => void)[] = [];

  constructor(private readonly city: City) {
    city.siteRules.push((def, rect) => this.siteCheck(def, rect));
    city.on((e) => {
      if (e.type === 'added') this.onAdded(e.building);
      else if (e.type === 'removed') this.onRemoved(e.building);
      else if (e.type === 'stock') this.updatePopulation();
    });
  }

  on(fn: (e: TownEvent) => void): void {
    this.listeners.push(fn);
  }

  all(): readonly Town[] {
    return this.towns;
  }

  get(id: number): Town | undefined {
    return this.towns.find((t) => t.id === id);
  }

  radiusOf(t: Town): number {
    return territoryRadius(t.population);
  }

  /** Town with the nearest centre, or -1 when there is none. */
  townOf(x: number, z: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const t of this.towns) {
      const d = (t.x - x) ** 2 + (t.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = t.id;
      }
    }
    return best;
  }

  townOfBuilding(b: PlacedBuilding): number {
    const c = centre(b.def, b.x, b.z);
    return this.townOf(c.x, c.z);
  }

  /** Distance from a point to the nearest territory edge (≤ 0 inside one). */
  outsideBy(x: number, z: number): number {
    let best = Infinity;
    for (const t of this.towns)
      best = Math.min(best, Math.hypot(t.x - x, t.z - z) - this.radiusOf(t));
    return best;
  }

  /** Counts housing per town and calculates town happiness (called once a game second). */
  updatePopulation(): void {
    if (!this.towns.length) return;
    const pop = new Map<number, number>();
    const hapSum = new Map<number, number>();
    const hapCount = new Map<number, number>();

    for (const b of this.city.all()) {
      if (!b.def.housing || !this.city.isActive(b.uid)) continue;
      const id = this.townOfBuilding(b);
      pop.set(id, (pop.get(id) ?? 0) + b.def.housing);

      // Amenities vs disamenities
      const greenery = this.city.fields.get(b.x, b.z, 'greenery');
      const leisure = this.city.fields.get(b.x, b.z, 'leisure');
      const health = this.city.fields.get(b.x, b.z, 'health');
      const faith = this.city.fields.get(b.x, b.z, 'faith');
      const education = this.city.fields.get(b.x, b.z, 'education');
      const commerce = this.city.fields.get(b.x, b.z, 'commerce');
      const connectivity = this.city.fields.get(b.x, b.z, 'connectivity');
      const pollution = this.city.fields.get(b.x, b.z, 'pollution');
      const noise = this.city.fields.get(b.x, b.z, 'noise');

      const pos =
        greenery * 3 +
        leisure * 4 +
        health * 5 +
        faith * 3 +
        education * 3 +
        commerce * 2 +
        connectivity * 2;
      const pollFactor = this.city.isPolicyActive('green_city') ? 3 : 6;
      const neg = pollution * pollFactor + noise * 3;
      const score = Math.max(0, Math.min(100, Math.round(50 + pos - neg)));
      hapSum.set(id, (hapSum.get(id) ?? 0) + score);
      hapCount.set(id, (hapCount.get(id) ?? 0) + 1);
    }
    let changed = false;
    for (const t of this.towns) {
      const p = pop.get(t.id) ?? 0;
      if (p !== t.population) {
        t.population = p;
        changed = true;
      }
      const count = hapCount.get(t.id) ?? 0;
      let h = count > 0 ? Math.round((hapSum.get(t.id) ?? 0) / count) : 75;
      if (this.city.isPolicyActive('healthcare_focus')) h = Math.min(100, h + 10);
      if (this.city.isPolicyActive('green_city')) h = Math.min(100, h + 5);
      if (this.city.isPolicyActive('industrial_drive')) h = Math.max(0, h - 5);
      if (h !== t.happiness) {
        t.happiness = h;
        changed = true;
      }
    }
    if (changed) this.emit({ type: 'changed' });
  }

  private siteCheck(def: BuildingDef, rect: Rect): CheckResult | null {
    if (!this.towns.length) return null; // the first building founds the first town
    const c = { x: rect.x + rect.w / 2, z: rect.z + rect.d / 2 };
    if (def.id === TOWN_HALL) {
      let nearest = Infinity;
      for (const t of this.towns) nearest = Math.min(nearest, Math.hypot(t.x - c.x, t.z - c.z));
      return {
        ok: nearest >= MIN_TOWN_GAP,
        key: 'req.townGap',
        params: { need: MIN_TOWN_GAP, have: Math.floor(nearest) },
      };
    }
    if (!this.enforceTerritory) return null;
    const out = this.outsideBy(c.x, c.z);
    return out <= 0 ? null : { ok: false, key: 'req.territory', params: { d: Math.ceil(out) } };
  }

  snapshot(): {
    towns: { id: number; x: number; z: number; hallUid: number; happiness?: number }[];
    nextId: number;
  } {
    return {
      towns: this.towns.map((t) => ({
        id: t.id,
        x: t.x,
        z: t.z,
        hallUid: t.hallUid,
        happiness: t.happiness,
      })),
      nextId: this.nextId,
    };
  }

  /** Call before re-adding the saved buildings; `done()` afterwards recounts populations. */
  restore(s: ReturnType<TownStore['snapshot']>): { done: () => void } {
    this.towns = s.towns.map((t) => ({ ...t, population: 0, happiness: t.happiness ?? 75 }));
    this.nextId = s.nextId;
    this.version++;
    this.restoring = true;
    return {
      done: () => {
        this.restoring = false;
        this.updatePopulation();
        this.emit({ type: 'changed' });
      },
    };
  }

  private onAdded(b: PlacedBuilding): void {
    if (this.restoring) return;
    // A replace (upgrade) re-adds the same uid: not a new town.
    if (this.towns.some((t) => t.hallUid === b.uid)) return;
    if (this.towns.length && b.def.id !== TOWN_HALL) return;
    const c = centre(b.def, b.x, b.z);
    const town: Town = {
      id: this.nextId++,
      x: c.x,
      z: c.z,
      hallUid: b.uid,
      population: 0,
      happiness: 75,
    };
    this.towns.push(town);
    this.version++;
    this.emit({ type: 'founded', town });
  }

  private onRemoved(b: PlacedBuilding): void {
    if (this.restoring) return;
    if (this.city.get(b.uid)) return; // replaced in place, still there
    const i = this.towns.findIndex((t) => t.hallUid === b.uid);
    if (i < 0) return;
    const town = this.towns[i] as Town;
    // The first town is founded by whatever was built first: keep it while anything else stands.
    if (b.def.id !== TOWN_HALL && this.city.count > 0) return;
    this.towns.splice(i, 1);
    this.version++;
    this.emit({ type: 'removed', town });
  }

  private emit(e: TownEvent): void {
    for (const l of this.listeners) l(e);
  }
}
