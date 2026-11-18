import type { BufferGeometry } from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { civic } from './architecture/civic';
import { coastDiorama } from './architecture/coastDiorama';
import { housing } from './architecture/housing';
import { landmarks } from './architecture/landmarks';
import { Lot, type Recipe } from './architecture/lot';
import { farmDiorama } from './architecture/farmDiorama';
import { livestockDiorama } from './architecture/livestockDiorama';
import { industryDiorama } from './architecture/industryDiorama';
import { miningDiorama } from './architecture/miningDiorama';
import { orchardDiorama } from './architecture/orchardDiorama';
import { siteDetails } from './architecture/siteDetails';
import { theatreTiers } from './architecture/theatreTiers';
import { transport } from './architecture/transport';
import { weather } from './architecture/weathering';
import { workplaces } from './architecture/workplaces';

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
    industryDiorama,
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
  ...Object.keys(industryDiorama),
]);
/** Diorama-style recipes draw their own grounds, so the generic extras are skipped. */
const dioramas = new Set([
  ...Object.keys(farmDiorama),
  ...Object.keys(orchardDiorama),
  ...Object.keys(livestockDiorama),
  ...Object.keys(coastDiorama),
  ...Object.keys(miningDiorama),
  ...Object.keys(industryDiorama),
]);
/**
 * Dioramas drawn in a smaller frame and scaled up to fill a larger footprint: the recipe sees a
 * lot of 2 / zoom units, so its fractional layout and world-unit props keep their proportions
 * while the finished model grows by `zoom`.
 */
const zoomed = new Map<string, number>([
  ...Object.keys(miningDiorama).map((id): [string, number] => [id, 1.5]),
  // Group 2A is drawn at the same 2x2 frame scale but fills 3x3 lots (steelworks 4x3).
  ...Object.keys(industryDiorama).map((id): [string, number] => [
    id,
    id.includes('steel') ? 2 : 2.25,
  ]),
]);
const southRows = new Set(['artisan_row_south', 'terrace_residence_south']);

export function architectureModel(def: BuildingDef, parts: BufferGeometry[], variant = 0): boolean {
  const recipe = models.get(def.id);
  if (!recipe) return false;
  const zoom = def.footprint.w >= 2 ? (zoomed.get(def.id) ?? 1) : 1;
  const frame =
    zoom === 1
      ? def
      : { ...def, footprint: { w: def.footprint.w / zoom, d: def.footprint.d / zoom } };
  const lot = new Lot(parts, frame, southRows.has(def.id));
  if (def.crop) lot.stage = variant || 4;
  const from = parts.length;
  recipe(lot);
  if (zoom !== 1) for (let i = from; i < parts.length; i++) parts[i]!.scale(zoom, zoom, zoom);
  if (weathered.has(def.id)) weather(parts, from, def.id);
  if (!dioramas.has(def.id)) {
    landmarks[def.id]?.(lot);
    siteDetails[def.id]?.(lot);
  }
  return true;
}
