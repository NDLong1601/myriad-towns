import { TileFlag } from '@/world/biomes';
import type { PlacedBuilding } from './city';
import type { TerrainQuery } from './terrainQuery';

export interface WaterTile {
  x: number;
  z: number;
}
const DIRECTIONS = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
] as const;

/** Find an out-and-back route through face-connected water. Its result depends only on terrain. */
export function waterRoute(
  terrain: TerrainQuery,
  building: PlacedBuilding,
  range: number,
): WaterTile[] {
  const queue: (WaterTile & { parent: number; depth: number })[] = [];
  const seen = new Set<string>();
  const right = building.x + building.def.footprint.w - 1;
  const bottom = building.z + building.def.footprint.d - 1;
  const add = (x: number, z: number, parent: number, depth: number): void => {
    const key = `${x},${z}`;
    if (seen.has(key) || !(terrain.tile(x, z).flags & TileFlag.Water)) return;
    seen.add(key);
    queue.push({ x, z, parent, depth });
  };
  for (let radius = 1; radius <= 2 && queue.length === 0; radius++) {
    for (let z = building.z - radius; z <= bottom + radius; z++) {
      for (let x = building.x - radius; x <= right + radius; x++) {
        const dx = Math.max(building.x - x, x - right, 0);
        const dz = Math.max(building.z - z, z - bottom, 0);
        if (dx + dz === radius) add(x, z, -1, 0);
      }
    }
  }
  for (let i = 0; i < queue.length && queue.length < 640; i++) {
    const tile = queue[i]!;
    if (tile.depth >= range) break;
    for (const [dx, dz] of DIRECTIONS) add(tile.x + dx, tile.z + dz, i, tile.depth + 1);
  }
  const route: WaterTile[] = [];
  for (let i = queue.length - 1; i >= 0; i = queue[i]!.parent) {
    const { x, z } = queue[i]!;
    route.push({ x, z });
  }
  return route.length > 1 ? route.reverse() : [];
}
