import * as THREE from 'three';
import { hash32 } from '@/core/prng';
import type { BuildingDef } from '@/sim/catalog';

export const DAY_SKY = '#aec9d0';
export const DAY_SUN = '#fff0db';
export const DAY_FILL = '#e6eff6';
export const DAY_BOUNCE = '#a4a18a';
export const DAY_KEY_INTENSITY = 1.78;
export const DAY_FILL_INTENSITY = 1.32;

const finishes: Readonly<Record<string, readonly [wall: string, roof: string]>> = {
  garden_court: ['#c5bca4', '#456e68'],
  civic_court: ['#cfc1a9', '#74647b'],
  artisan_row_east: ['#c3b59d', '#75615b'],
  artisan_row_south: ['#c3b59d', '#75615b'],
  terrace_residence_east: ['#d2c5aa', '#586a71'],
  terrace_residence_south: ['#d2c5aa', '#586a71'],
  town_house: ['#d2c5aa', '#536a7b'],
  townhouse: ['#d2c5aa', '#536a7b'],
  villa: ['#d2c5aa', '#a0634d'],
  tenement: ['#b9b3a5', '#686f66'],
  apartment_tower: ['#cbc2b4', '#687581'],
};

const neutral = new THREE.Color(1, 1, 1);
const variations = [neutral, new THREE.Color(1.13, 0.98, 0.83), new THREE.Color(0.9, 1.02, 1.11)];

/** Paint used by the shared geometry for the world, construction previews and catalogue. */
export function visualDefinition(def: BuildingDef): BuildingDef {
  const paint = finishes[def.id];
  if (!paint) return def;
  return { ...def, visual: { ...def.visual, color: paint[0], roof: paint[1] } };
}

/** Local paint variation keeps the catalogue silhouette and status tint in one instance batch. */
export function lotFinish(id: string, x: number, z: number): THREE.Color {
  if (!finishes[id]) return neutral;
  return variations[hash32(0x4d3956, x, z) % variations.length] ?? neutral;
}
