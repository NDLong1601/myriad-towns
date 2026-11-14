import * as THREE from 'three';
import type { FloatingOrigin } from './floatingOrigin';

/**
 * Finds the tile under a screen point by walking the ray across the tile grid (DDA) and
 * testing it against each tile's top height. Much cheaper than raycasting chunk meshes,
 * and exact for the blocky terrain (walls included).
 */
export function pickTile(
  camera: THREE.PerspectiveCamera,
  origin: FloatingOrigin,
  ndcX: number,
  ndcY: number,
  /** Surface y at a world tile, or undefined if not loaded. */
  heightAt: (x: number, z: number) => number | undefined,
  maxDistance = 700,
): { x: number; z: number } | null {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const o = ray.ray.origin;
  const dir = ray.ray.direction;
  // World-space start (tile units).
  const sx = o.x + origin.x;
  const sz = o.z + origin.z;
  let tx = Math.floor(sx);
  let tz = Math.floor(sz);
  const stepX = dir.x > 0 ? 1 : -1;
  const stepZ = dir.z > 0 ? 1 : -1;
  const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
  let tMaxX = dir.x !== 0 ? (dir.x > 0 ? tx + 1 - sx : sx - tx) * tDeltaX : Infinity;
  let tMaxZ = dir.z !== 0 ? (dir.z > 0 ? tz + 1 - sz : sz - tz) * tDeltaZ : Infinity;
  let tEnter = 0;
  while (tEnter < maxDistance) {
    const tExit = Math.min(tMaxX, tMaxZ);
    const top = heightAt(tx, tz);
    if (top !== undefined) {
      const yEnter = o.y + dir.y * tEnter;
      const yExit = o.y + dir.y * tExit;
      if (Math.min(yEnter, yExit) <= top) return { x: tx, z: tz };
    }
    tEnter = tExit;
    if (tMaxX < tMaxZ) {
      tMaxX += tDeltaX;
      tx += stepX;
    } else {
      tMaxZ += tDeltaZ;
      tz += stepZ;
    }
  }
  return null;
}
