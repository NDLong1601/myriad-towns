import type { BufferGeometry } from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { civic } from './architecture/civic';
import { housing } from './architecture/housing';
import { Lot, type Recipe } from './architecture/lot';
import { transport } from './architecture/transport';
import { workplaces } from './architecture/workplaces';

const models = new Map<string, Recipe>(
  [housing, civic, workplaces, transport].flatMap((group) => Object.entries(group)),
);
const southRows = new Set(['artisan_row_south', 'terrace_residence_south']);

export function architectureModel(def: BuildingDef, parts: BufferGeometry[]): boolean {
  const recipe = models.get(def.id);
  if (!recipe) return false;
  recipe(new Lot(parts, def, southRows.has(def.id)));
  return true;
}
