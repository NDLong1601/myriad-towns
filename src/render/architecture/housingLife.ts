import type * as THREE from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { barrel, cypress, lanternPost, person, reseed, shrub } from './diorama';
import { bench, birds, butterflies, cat, flowerRow, planter } from './dioramaDetails';
import { dog } from './dioramaProps';
import { type Lot } from './lot';

// Everyday life around the housing models: people, pets, flower pots, benches and lamps. The
// house recipes fill their lots in different ways, so instead of fixed positions this reads the
// finished geometry, finds the ground that is still empty and puts each prop in the free spot
// nearest to where it belongs.

type Prop =
  | { kind: 'person'; at: Pt; coat: string; hat: string }
  | { kind: 'cat' | 'dog' | 'barrel' | 'lamp' | 'bench' | 'planter' | 'shrub' | 'cypress'; at: Pt }
  | { kind: 'flowers'; at: Pt; bloom: string }
  | { kind: 'birds' | 'butterfly'; at: Pt };
type Pt = readonly [number, number];

const GRID = 14;
const SCALE: Partial<Record<Prop['kind'], number>> = {
  birds: 1.4,
  butterfly: 1.4,
  shrub: 1,
  cypress: 1,
  lamp: 1,
};
const GROUND_TOP = 0.05;
const coats = ['#b0463a', '#5a7a9a', '#7a9a5a', '#9a5a7a', '#d9b14a', '#e8e4d8', '#6a5a8a'];
const hats = ['#d9c38a', '#3a3a3c', '#8a6a3a', '#2c2a28'];

/** Which housing models get a lived-in pass, and how rich it is. */
const tiers: Readonly<Record<string, 'low' | 'mid' | 'high'>> = {
  hut: 'low',
  mountain_hut: 'low',
  fisher_hut: 'low',
  cottage: 'low',
  miner_cottage: 'low',
  fisher_cottage: 'low',
  lumberjack_cottage: 'low',
  gable_homestead: 'mid',
  townhouse: 'mid',
  worker_dormitory: 'mid',
  scholar_salon_house: 'mid',
  merchant_arcade_house: 'mid',
  harbor_inn_house: 'mid',
  maritime_guild_house: 'mid',
  master_miner_lodge: 'mid',
  forester_manor: 'mid',
  tenement: 'mid',
  garden_court: 'high',
  civic_court: 'high',
  boulevard_mansion: 'high',
  metropolitan_residence: 'high',
  villa: 'high',
  manor_estate: 'high',
  apartment_tower: 'high',
  grand_condominium: 'high',
  skyscraper: 'high',
};

export function hasHousingLife(id: string): boolean {
  return id in tiers;
}

/** Marks lot cells covered by anything taller than the ground. */
function blockedCells(
  parts: readonly THREE.BufferGeometry[],
  from: number,
  w: number,
  d: number,
): boolean[] {
  const blocked = new Array<boolean>(GRID * GRID).fill(false);
  for (let i = from; i < parts.length; i++) {
    const g = parts[i]!;
    g.computeBoundingBox();
    const b = g.boundingBox!;
    if (b.max.y <= GROUND_TOP) continue;
    const x0 = Math.floor(((b.min.x - 0.012) / w) * GRID);
    const x1 = Math.floor(((b.max.x + 0.012) / w) * GRID);
    const z0 = Math.floor(((b.min.z - 0.012) / d) * GRID);
    const z1 = Math.floor(((b.max.z + 0.012) / d) * GRID);
    for (let z = Math.max(0, z0); z <= Math.min(GRID - 1, z1); z++)
      for (let x = Math.max(0, x0); x <= Math.min(GRID - 1, x1); x++) blocked[z * GRID + x] = true;
  }
  return blocked;
}

/** Nearest free cell to `want` (lot fractions), kept away from the curb; marks it used. */
function claim(blocked: boolean[], want: Pt): Pt | undefined {
  const wx = Math.min(GRID - 2, Math.max(1, Math.floor(want[0] * GRID)));
  const wz = Math.min(GRID - 2, Math.max(1, Math.floor(want[1] * GRID)));
  let best: [number, number] | undefined;
  let bestD = Infinity;
  for (let z = 1; z < GRID - 1; z++)
    for (let x = 1; x < GRID - 1; x++) {
      if (blocked[z * GRID + x]) continue;
      const dist = (x - wx) ** 2 + (z - wz) ** 2;
      if (dist < bestD) {
        bestD = dist;
        best = [x, z];
      }
    }
  if (!best) return undefined;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const cx = best[0] + dx;
      const cz = best[1] + dz;
      if (cx >= 0 && cz >= 0 && cx < GRID && cz < GRID) blocked[cz * GRID + cx] = true;
    }
  return [(best[0] + 0.5) / GRID, (best[1] + 0.5) / GRID];
}

function plan(tier: 'low' | 'mid' | 'high', pick: (n: number) => number): Prop[] {
  const person = (at: Pt, i: number): Prop => ({
    kind: 'person',
    at,
    coat: coats[pick(coats.length) + (i % 2)]!,
    hat: hats[pick(hats.length)]!,
  });
  const props: Prop[] = [person([0.5, 0.88], 0)];
  props.push(pick(2) ? { kind: 'cat', at: [0.2, 0.84] } : { kind: 'dog', at: [0.78, 0.84] });
  props.push({ kind: 'birds', at: [0.6, 0.8] });
  props.push({ kind: 'flowers', at: [0.3, 0.92], bloom: '#e24864' });
  props.push({ kind: 'barrel', at: [0.88, 0.7] });
  if (tier !== 'low') {
    props.push(person([0.7, 0.9], 1));
    props.push({ kind: 'lamp', at: [0.88, 0.9] });
    props.push({ kind: 'bench', at: [0.14, 0.7] });
    props.push({ kind: 'planter', at: [0.5, 0.96] });
    props.push({ kind: 'butterfly', at: [0.3, 0.6] });
  }
  if (tier === 'high') {
    props.push(person([0.36, 0.84], 0));
    props.push({ kind: 'lamp', at: [0.12, 0.9] });
    props.push({ kind: 'shrub', at: [0.1, 0.5] });
    props.push({ kind: 'cypress', at: [0.92, 0.5] });
    props.push({ kind: 'flowers', at: [0.7, 0.96], bloom: '#f0c24a' });
  }
  if (tier === 'low') props.push({ kind: 'shrub', at: [0.12, 0.6] });
  return props;
}

/** Adds the lived-in props to a housing model that was just built into `parts` from `from`. */
export function addHousingLife(
  l: Lot,
  parts: THREE.BufferGeometry[],
  from: number,
  def: BuildingDef,
): void {
  const tier = tiers[def.id];
  if (!tier) return;
  const blocked = blockedCells(parts, from, def.footprint.w, def.footprint.d);
  let n = 0;
  reseed(`${def.id}-life`);
  const pick = (m: number): number => {
    n = (n * 31 + def.id.length * 7 + 5) % 9973;
    return n % m;
  };
  const y = 0.036;
  for (const prop of plan(tier, pick)) {
    const at = claim(blocked, prop.at);
    if (!at) continue;
    const [x, z] = at;
    const first = parts.length;
    switch (prop.kind) {
      case 'person':
        person(l, x, z, y, prop.coat, prop.hat);
        break;
      case 'cat':
        cat(l, x, z, y, '#c27a3a');
        break;
      case 'dog':
        dog(l, x, z, 0.5);
        break;
      case 'barrel':
        barrel(l, x, z, y);
        break;
      case 'lamp':
        lanternPost(l, x, z, 0.16);
        break;
      case 'bench':
        bench(l, x, z, y, 0);
        break;
      case 'planter':
        planter(l, x, z, 0.1);
        break;
      case 'shrub':
        shrub(l, x, z, 0.034);
        break;
      case 'cypress':
        cypress(l, x, z, 0.2);
        break;
      case 'flowers':
        flowerRow(l, x, z, 0.1, prop.bloom, 5, y);
        break;
      case 'birds':
        birds(l, [[x, z, y]]);
        break;
      case 'butterfly':
        butterflies(l, [[x, z, 0.12]]);
        break;
    }
    // Props are drawn at diorama size; scale them up about their own base so they read at a
    // glance next to a house that fills its lot.
    const k = SCALE[prop.kind] ?? 1.5;
    for (let i = first; i < parts.length; i++) {
      const g = parts[i]!;
      const cx = x * def.footprint.w;
      const cz = z * def.footprint.d;
      g.translate(-cx, -y, -cz);
      g.scale(k, k, k);
      g.translate(cx, y, cz);
    }
  }
}
