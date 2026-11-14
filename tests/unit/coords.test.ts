import { describe, expect, it } from 'vitest';
import {
  CHUNK_AREA,
  CHUNK_SIZE,
  MAX_CHUNK_COORD,
  MIN_CHUNK_COORD,
  chunkKey,
  chunksInRadius,
  indexToLocal,
  localIndex,
  localToTile,
  tileToChunk,
  tileToLocal,
  unpackChunkKey,
} from '@/core/coords';

describe('coords', () => {
  it('maps tiles to chunks with floor division, including negatives', () => {
    expect(tileToChunk(0, 0)).toEqual({ cx: 0, cz: 0 });
    expect(tileToChunk(31, 31)).toEqual({ cx: 0, cz: 0 });
    expect(tileToChunk(32, 0)).toEqual({ cx: 1, cz: 0 });
    expect(tileToChunk(-1, -1)).toEqual({ cx: -1, cz: -1 });
    expect(tileToChunk(-32, -33)).toEqual({ cx: -1, cz: -2 });
  });

  it('local coordinates are always in [0, CHUNK_SIZE)', () => {
    expect(tileToLocal(-1, -32)).toEqual({ lx: 31, lz: 0 });
    expect(tileToLocal(33, 64)).toEqual({ lx: 1, lz: 0 });
  });

  it('tile → (chunk, local) → tile round-trips', () => {
    for (const [x, z] of [
      [0, 0],
      [-1, 5],
      [1000, -1000],
      [-123456, 98765],
    ] as const) {
      const { cx, cz } = tileToChunk(x, z);
      const { lx, lz } = tileToLocal(x, z);
      expect(localToTile(cx, cz, lx, lz)).toEqual({ x, z });
    }
  });

  it('local index round-trips over the whole chunk', () => {
    for (let i = 0; i < CHUNK_AREA; i++) {
      const { lx, lz } = indexToLocal(i);
      expect(localIndex(lx, lz)).toBe(i);
      expect(lx).toBeLessThan(CHUNK_SIZE);
      expect(lz).toBeLessThan(CHUNK_SIZE);
    }
  });

  it('chunk keys are unique and round-trip, including extremes', () => {
    const seen = new Set<number>();
    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        const k = chunkKey(cx, cz);
        expect(seen.has(k)).toBe(false);
        seen.add(k);
        expect(unpackChunkKey(k)).toEqual({ cx, cz });
      }
    }
    for (const [cx, cz] of [
      [MIN_CHUNK_COORD, MIN_CHUNK_COORD],
      [MAX_CHUNK_COORD, MAX_CHUNK_COORD],
      [MIN_CHUNK_COORD, MAX_CHUNK_COORD],
    ] as const) {
      const k = chunkKey(cx, cz);
      expect(Number.isSafeInteger(k)).toBe(true);
      expect(unpackChunkKey(k)).toEqual({ cx, cz });
    }
  });

  it('rejects out-of-range or fractional chunk coordinates', () => {
    expect(() => chunkKey(MAX_CHUNK_COORD + 1, 0)).toThrow(RangeError);
    expect(() => chunkKey(0.5, 0)).toThrow(RangeError);
  });

  it('chunksInRadius lists (2r+1)² chunks, nearest first', () => {
    const list = chunksInRadius({ cx: 10, cz: -4 }, 2);
    expect(list).toHaveLength(25);
    expect(list[0]).toEqual({ cx: 10, cz: -4 });
    expect(new Set(list.map((c) => chunkKey(c.cx, c.cz))).size).toBe(25);
  });
});
