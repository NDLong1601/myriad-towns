/**
 * Building definitions loaded from data/buildings/*.json (validated in CI by scripts/validate-data.ts).
 * Types mirror data/schema/building.schema.json.
 */
import fieldsJson from '../../data/fields.json';
import resourcesJson from '../../data/resources.json';

export type Amounts = Readonly<Record<string, number>>;

export type Requirement =
  | { type: 'near'; building: string; radius: number; min?: number }
  | { type: 'notNear'; building: string; radius: number }
  | { type: 'field'; field: string; min?: number; max?: number }
  | { type: 'terrain'; terrain: string; radius: number; min?: number }
  | { type: 'road'; maxDistance: number; paved?: boolean };

export interface Emit {
  field: string;
  amount: number;
  radius: number;
  falloff?: 'none' | 'linear';
}

export interface BuildingVisual {
  shape:
    | 'house'
    | 'tall'
    | 'block'
    | 'field'
    | 'tower'
    | 'dock'
    | 'road'
    | 'bridge'
    | 'park'
    | 'well'
    | 'mine'
    | 'hall';
  color?: string;
  roof?: string;
  height?: number;
}

export interface BuildingDef {
  id: string;
  category: string;
  nameKey?: string;
  footprint: { w: number; d: number };
  cost: Amounts;
  upkeep?: Amounts;
  produces?: Amounts;
  storage?: Amounts;
  housing?: number;
  emits?: Emit[];
  placeOn?: string[];
  requires?: Requirement[];
  placementRequires?: Requirement[];
  upgrades?: { to: string; when: Requirement[] }[];
  /** Ordered larger forms, each requiring a rectangle of matching active homes. */
  mergeInto?: { to: string; when: Requirement[] }[];
  crop?: { kind: 'berries' | 'grain' | 'vegetables'; ticks: number };
  voyage?: { kind: 'fish' | 'cargo'; ticks: number; range: number };
  decline?: { warnAtTicks?: number; graceTicks?: number; to?: string };
  unlock?: { population?: number; buildings?: Amounts; revealAt?: number };
  visual: BuildingVisual;
  tags?: string[];
  biomes?: string[];
}

export const FIELDS: readonly string[] = fieldsJson.fields;
export const STOCK_RESOURCES: readonly string[] = resourcesJson.stock;
/** Workforce tiers: produced by housing, used by workplaces every tick, never stored. */
export const LABOR_TIERS: readonly string[] = resourcesJson.labor;
export const START_STOCK: Amounts = resourcesJson.start;
export const BASE_CAPACITY: Amounts =
  (resourcesJson as { baseCapacity?: Amounts }).baseCapacity ?? {};
export const DEMOLISH_REFUND: number = resourcesJson.demolishRefund;

const DEFAULT_PLACE_ON = ['land', 'flat'];

export class Catalog {
  readonly defs: readonly BuildingDef[];
  private byId = new Map<string, BuildingDef>();
  /** Category order as first seen in the data. */
  readonly categories: readonly string[];

  constructor(defs: BuildingDef[]) {
    this.defs = defs;
    const cats: string[] = [];
    for (const d of defs) {
      if (this.byId.has(d.id)) throw new Error(`duplicate building id ${d.id}`);
      this.byId.set(d.id, d);
      if (!cats.includes(d.category)) cats.push(d.category);
    }
    this.categories = cats;
  }

  get(id: string): BuildingDef {
    const d = this.byId.get(id);
    if (!d) throw new Error(`unknown building "${id}"`);
    return d;
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  placeOn(def: BuildingDef): readonly string[] {
    return def.placeOn ?? DEFAULT_PLACE_ON;
  }
}

/** All buildings bundled with the game. */
export function loadCatalog(): Catalog {
  const files = import.meta.glob<BuildingDef | BuildingDef[]>('../../data/buildings/*.json', {
    eager: true,
    import: 'default',
  });
  const defs: BuildingDef[] = [];
  for (const path of Object.keys(files).sort()) {
    const v = files[path];
    if (v) defs.push(...(Array.isArray(v) ? v : [v]));
  }
  return new Catalog(defs);
}

/** Roads, paved roads and bridges: anything tagged "road" carries traffic and satisfies road rules. */
export function isRoadDef(def: BuildingDef): boolean {
  return def.tags?.includes('road') === true;
}
