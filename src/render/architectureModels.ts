import type { BufferGeometry } from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { civic } from './architecture/civic';
import { housing } from './architecture/housing';
import { landmarks } from './architecture/landmarks';
import { Lot, type Recipe } from './architecture/lot';
import { siteDetails } from './architecture/siteDetails';
import { theatreTiers } from './architecture/theatreTiers';
import { transport } from './architecture/transport';
import { weather } from './architecture/weathering';
import { workplaces } from './architecture/workplaces';

const models = new Map<string, Recipe>(
  [housing, civic, workplaces, transport, theatreTiers].flatMap((group) => Object.entries(group)),
);
/** Buildings that get baked contact shadows and tone variation. */
const weathered = new Set(Object.keys(theatreTiers));
const southRows = new Set(['artisan_row_south', 'terrace_residence_south']);

export function architectureModel(def: BuildingDef, parts: BufferGeometry[]): boolean {
  const recipe = models.get(def.id);
  if (!recipe) return false;
  const lot = new Lot(parts, def, southRows.has(def.id));
  const from = parts.length;
  recipe(lot);
  if (weathered.has(def.id)) weather(parts, from, def.id);
  landmarks[def.id]?.(lot);
  siteDetails[def.id]?.(lot);
  return true;
}
