/**
 * Coordinate contract for the infinite world.
 *
 * - World tiles are addressed by integer (x, z). y is up and is never part of a tile address.
 * - The world is split into square chunks of CHUNK_SIZE × CHUNK_SIZE tiles.
 * - Chunk (cx, cz) covers tiles x ∈ [cx·S, cx·S + S), z ∈ [cz·S, cz·S + S).
 * - Negative coordinates are valid everywhere: division always floors toward -∞.
 *
 * Owner: Claude (core). Changing anything here is a breaking change for world/sim/render/io.
 */

/** Tiles per chunk edge. Must be a power of two (bit tricks below rely on it). */
export const CHUNK_SIZE = 32;
export const CHUNK_SHIFT = 5; // log2(CHUNK_SIZE)
export const CHUNK_MASK = CHUNK_SIZE - 1;
/** Tiles per chunk. */
export const CHUNK_AREA = CHUNK_SIZE * CHUNK_SIZE;

/**
 * Chunk coordinates must fit in ±2^25 so a key packs into a safe integer.
 * That is ±33 million chunks, or about ±1 billion tiles in each direction.
 */
export const MAX_CHUNK_COORD = 2 ** 25 - 1;
export const MIN_CHUNK_COORD = -(2 ** 25);
const KEY_OFFSET = 2 ** 25;
const KEY_STRIDE = 2 ** 26;

export interface TileCoord {
  readonly x: number;
  readonly z: number;
}

export interface ChunkCoord {
  readonly cx: number;
  readonly cz: number;
}

/** Packed chunk id, usable as a Map key. Always a non-negative safe integer. */
export type ChunkKey = number & { readonly __brand: 'ChunkKey' };

export function isValidChunkCoord(cx: number, cz: number): boolean {
  return (
    Number.isInteger(cx) &&
    Number.isInteger(cz) &&
    cx >= MIN_CHUNK_COORD &&
    cx <= MAX_CHUNK_COORD &&
    cz >= MIN_CHUNK_COORD &&
    cz <= MAX_CHUNK_COORD
  );
}

export function chunkKey(cx: number, cz: number): ChunkKey {
  if (!isValidChunkCoord(cx, cz)) {
    throw new RangeError(`Chunk coordinate out of range: (${cx}, ${cz})`);
  }
  return ((cx + KEY_OFFSET) * KEY_STRIDE + (cz + KEY_OFFSET)) as ChunkKey;
}

export function unpackChunkKey(key: ChunkKey): ChunkCoord {
  const cz = (key % KEY_STRIDE) - KEY_OFFSET;
  const cx = Math.floor(key / KEY_STRIDE) - KEY_OFFSET;
  return { cx, cz };
}

/** Chunk containing world tile (x, z). Works for negative tiles. */
export function tileToChunk(x: number, z: number): ChunkCoord {
  return { cx: Math.floor(x / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) };
}

/** Tile position inside its chunk, each in [0, CHUNK_SIZE). Works for negative tiles. */
export function tileToLocal(x: number, z: number): { lx: number; lz: number } {
  return { lx: mod(x, CHUNK_SIZE), lz: mod(z, CHUNK_SIZE) };
}

/** Row-major index into a chunk's per-tile arrays (length CHUNK_AREA). */
export function localIndex(lx: number, lz: number): number {
  return lz * CHUNK_SIZE + lx;
}

export function indexToLocal(index: number): { lx: number; lz: number } {
  return { lx: index & CHUNK_MASK, lz: index >> CHUNK_SHIFT };
}

/** World tile for a local position in chunk (cx, cz). Inverse of tileToChunk + tileToLocal. */
export function localToTile(cx: number, cz: number, lx: number, lz: number): TileCoord {
  return { x: cx * CHUNK_SIZE + lx, z: cz * CHUNK_SIZE + lz };
}

/** Chebyshev distance in chunks; used for load/unload rings around the camera. */
export function chunkRingDistance(a: ChunkCoord, b: ChunkCoord): number {
  return Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cz - b.cz));
}

/** All chunks within Chebyshev radius r of center, nearest rings first. */
export function chunksInRadius(center: ChunkCoord, r: number): ChunkCoord[] {
  const out: ChunkCoord[] = [{ cx: center.cx, cz: center.cz }];
  for (let ring = 1; ring <= r; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) === ring) {
          out.push({ cx: center.cx + dx, cz: center.cz + dz });
        }
      }
    }
  }
  return out;
}

/** Mathematical modulo: result always in [0, n). */
function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
