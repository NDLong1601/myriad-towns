import { Box3, type BufferGeometry } from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { civic } from './architecture/civic';
import { coastDiorama } from './architecture/coastDiorama';
import { housing } from './architecture/housing';
import { kilnDiorama } from './architecture/kilnDiorama';
import { landmarks } from './architecture/landmarks';
import { Lot, type Recipe } from './architecture/lot';
import { farmDiorama } from './architecture/farmDiorama';
import { livestockDiorama } from './architecture/livestockDiorama';
import { industryDiorama } from './architecture/industryDiorama';
import { craftDiorama } from './architecture/craftDiorama';
import { millDiorama } from './architecture/millDiorama';
import { miningDiorama } from './architecture/miningDiorama';
import { orchardDiorama } from './architecture/orchardDiorama';
import { siteDetails } from './architecture/siteDetails';
import { smelterDiorama } from './architecture/smelterDiorama';
import { theatreTiers } from './architecture/theatreTiers';
import { transport } from './architecture/transport';
import { weather } from './architecture/weathering';
import { workplaces } from './architecture/workplaces';

/** Groups 2A/2B: every recipe is drawn in a FRAME-unit lot and scaled up to its footprint. */
const framedGroups = [industryDiorama, millDiorama, craftDiorama, smelterDiorama, kilnDiorama];
const FRAME = 0.77;
const framed = new Set(framedGroups.flatMap((group) => Object.keys(group)));

const models = new Map<string, Recipe>(
  [
    housing,
    civic,
    workplaces,
    transport,
    theatreTiers,
    farmDiorama,
    orchardDiorama,
    livestockDiorama,
    coastDiorama,
    miningDiorama,
    ...framedGroups,
  ].flatMap((group) => Object.entries(group)),
);
/** Buildings that get baked contact shadows and tone variation. */
const weathered = new Set([
  ...Object.keys(theatreTiers),
  ...Object.keys(farmDiorama),
  ...Object.keys(orchardDiorama),
  ...Object.keys(livestockDiorama),
  ...Object.keys(coastDiorama),
  ...Object.keys(miningDiorama),
  ...framed,
]);
/** Diorama-style recipes draw their own grounds, so the generic extras are skipped. */
const dioramas = new Set([
  ...Object.keys(farmDiorama),
  ...Object.keys(orchardDiorama),
  ...Object.keys(livestockDiorama),
  ...Object.keys(coastDiorama),
  ...Object.keys(miningDiorama),
  ...framed,
]);
/**
 * Dioramas drawn in a smaller frame and scaled up to fill a larger footprint: the recipe sees a
 * lot of 2 / zoom units, so its fractional layout and world-unit props keep their proportions
 * while the finished model grows by `zoom`.
 */
const zoomed = new Map<string, number>([
  ...Object.keys(miningDiorama).map((id): [string, number] => [id, 1.5]),
]);
const southRows = new Set(['artisan_row_south', 'terrace_residence_south']);
const box = new Box3();
const part = new Box3();

/**
 * Pulls a scaled-up model back inside its lot: props drawn near the edge in world units can poke
 * past it once zoomed. Squeezes x and z by one factor (round towers stay round) and shifts the
 * model so it sits within 0..w and 0..d; heights are untouched.
 */
function fitToLot(parts: BufferGeometry[], from: number, w: number, d: number): void {
  box.makeEmpty();
  for (let i = from; i < parts.length; i++) {
    const g = parts[i]!;
    g.computeBoundingBox();
    box.union(part.copy(g.boundingBox!));
  }
  if (box.isEmpty()) return;
  const eps = 0.0005;
  if (box.min.x >= 0 && box.min.z >= 0 && box.max.x <= w && box.max.z <= d) return;
  const s = Math.min(
    1,
    (w - eps * 2) / (box.max.x - box.min.x),
    (d - eps * 2) / (box.max.z - box.min.z),
  );
  const shift = (lo: number, hi: number, size: number): number => {
    const c = (lo + hi) / 2;
    const half = ((hi - lo) * s) / 2;
    return Math.max(eps - (c - half), 0) - Math.max(c + half - (size - eps), 0) + c;
  };
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const tx = shift(box.min.x, box.max.x, w);
  const tz = shift(box.min.z, box.max.z, d);
  for (let i = from; i < parts.length; i++) {
    const g = parts[i]!;
    g.translate(-cx, 0, -cz);
    g.scale(s, 1, s);
    g.translate(tx, 0, tz);
  }
}

export function architectureModel(def: BuildingDef, parts: BufferGeometry[], variant = 0): boolean {
  const recipe = models.get(def.id);
  if (!recipe) return false;
  const zoom = framed.has(def.id)
    ? Math.min(def.footprint.w, def.footprint.d) / FRAME
    : def.footprint.w >= 2
      ? (zoomed.get(def.id) ?? 1)
      : 1;
  const frame =
    zoom === 1
      ? def
      : { ...def, footprint: { w: def.footprint.w / zoom, d: def.footprint.d / zoom } };
  const lot = new Lot(parts, frame, southRows.has(def.id));
  if (def.crop) lot.stage = variant || 4;
  const from = parts.length;
  recipe(lot);
  if (zoom !== 1) {
    for (let i = from; i < parts.length; i++) parts[i]!.scale(zoom, zoom, zoom);
    fitToLot(parts, from, def.footprint.w, def.footprint.d);
  }
  if (weathered.has(def.id)) weather(parts, from, def.id);
  if (!dioramas.has(def.id)) {
    landmarks[def.id]?.(lot);
    siteDetails[def.id]?.(lot);
  }
  return true;
}
