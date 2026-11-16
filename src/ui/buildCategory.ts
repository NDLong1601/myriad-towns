import type { BuildingDef } from '@/sim/catalog';

/** Display categories leave the simulation's production priorities intact. */
export function buildCategory(def: BuildingDef): string {
  if (def.category !== 'infrastructure') return def.category;
  if (
    def.visual.shape === 'road' ||
    def.visual.shape === 'bridge' ||
    def.tags?.some((tag) => tag === 'port' || tag === 'pier' || tag === 'transit') ||
    def.id === 'rail_track' ||
    def.id === 'rail_station' ||
    def.id === 'airfield'
  )
    return 'infrastructure';
  if (def.tags?.includes('agriculture')) return 'food';
  if (def.tags?.includes('storage')) return 'production';
  return 'service';
}
