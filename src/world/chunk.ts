import { CHUNK_AREA, CHUNK_SIZE, localIndex, localToTile } from '@/core/coords';
import { sampleTile } from './terrain';

/** Generated (or later, edited) contents of one chunk. Arrays are indexed by localIndex(lx, lz). */
export interface ChunkData {
  cx: number;
  cz: number;
  level: Uint8Array;
  biome: Uint8Array;
  flags: Uint8Array;
  resource: Uint8Array;
}

export function generateChunk(seed: number, cx: number, cz: number): ChunkData {
  const level = new Uint8Array(CHUNK_AREA);
  const biome = new Uint8Array(CHUNK_AREA);
  const flags = new Uint8Array(CHUNK_AREA);
  const resource = new Uint8Array(CHUNK_AREA);
  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const { x, z } = localToTile(cx, cz, lx, lz);
      const s = sampleTile(seed, x, z);
      const i = localIndex(lx, lz);
      level[i] = s.level;
      biome[i] = s.biome;
      flags[i] = s.flags;
      resource[i] = s.resource;
    }
  }
  return { cx, cz, level, biome, flags, resource };
}

/** Typed arrays of a chunk, for postMessage transfer lists. */
export function chunkBuffers(c: ChunkData): ArrayBuffer[] {
  return [c.level.buffer, c.biome.buffer, c.flags.buffer, c.resource.buffer] as ArrayBuffer[];
}

/** Stable content hash, used by golden tests to detect accidental generation changes. */
export function hashChunk(c: ChunkData): number {
  let h = 0x811c9dc5;
  for (const arr of [c.level, c.biome, c.flags, c.resource]) {
    for (let i = 0; i < arr.length; i++) {
      h ^= arr[i] as number;
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}
