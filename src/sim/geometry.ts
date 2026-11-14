/** Footprint rectangles and the distance rule shared by every radius check. */
export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

/**
 * Distance between two rectangles of tiles, in tiles: Euclidean distance between their closest
 * tiles: 0 when they overlap, 1 when edge-adjacent, √2 when diagonal.
 */
export function rectDistance(a: Rect, b: Rect): number {
  const dx = Math.max(a.x - (b.x + b.w - 1), 0, b.x - (a.x + a.w - 1));
  const dz = Math.max(a.z - (b.z + b.d - 1), 0, b.z - (a.z + a.d - 1));
  return Math.sqrt(dx * dx + dz * dz);
}

/** Tile (tx, tz) is within radius r of rect when its distance to the rect's nearest tile ≤ r. */
export function tileInRadius(rect: Rect, tx: number, tz: number, r: number): boolean {
  return rectDistance(rect, { x: tx, z: tz, w: 1, d: 1 }) <= r;
}

/** Calls fn for every tile within radius r of rect (including the rect itself). */
export function forTilesInRadius(
  rect: Rect,
  r: number,
  fn: (x: number, z: number, dist: number) => void,
): void {
  for (let z = rect.z - r; z < rect.z + rect.d + r; z++) {
    for (let x = rect.x - r; x < rect.x + rect.w + r; x++) {
      const dist = rectDistance(rect, { x, z, w: 1, d: 1 });
      if (dist <= r) fn(x, z, dist);
    }
  }
}
