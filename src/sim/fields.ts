import {
  CHUNK_AREA,
  type ChunkKey,
  chunkKey,
  localIndex,
  tileToChunk,
  tileToLocal,
} from '@/core/coords';
import { FIELDS, type Emit } from './catalog';
import { type Rect, forTilesInRadius } from './geometry';

/** Field values are stored as integers in hundredths, so add then subtract is exact. */
export const FIELD_SCALE = 100;

export function fieldIndex(name: string): number {
  const i = FIELDS.indexOf(name);
  if (i < 0) throw new Error(`unknown field "${name}"`);
  return i;
}

/** Per-tile local values (water access, pollution, ...) that buildings spread around them. */
export class FieldStore {
  private chunks = new Map<ChunkKey, Int32Array>();

  /** Contribution of one emit to a tile at distance `dist` from the emitter. */
  static contribution(e: Emit, dist: number): number {
    const f = e.falloff === 'linear' ? 1 - dist / (e.radius + 1) : 1;
    return Math.round(e.amount * f * FIELD_SCALE);
  }

  /** Add (sign = 1) or remove (sign = -1) a building's emits. */
  apply(rect: Rect, emits: readonly Emit[] | undefined, sign: 1 | -1): void {
    if (!emits) return;
    for (const e of emits) {
      const fi = fieldIndex(e.field);
      forTilesInRadius(rect, e.radius, (x, z, dist) => {
        const v = FieldStore.contribution(e, dist);
        if (v === 0) return;
        const arr = this.chunk(x, z, true) as Int32Array;
        const { lx, lz } = tileToLocal(x, z);
        const idx = fi * CHUNK_AREA + localIndex(lx, lz);
        arr[idx] = (arr[idx] as number) + sign * v;
      });
    }
  }

  /** Raw (scaled) value at a tile. */
  raw(x: number, z: number, field: number): number {
    const arr = this.chunk(x, z, false);
    if (!arr) return 0;
    const { lx, lz } = tileToLocal(x, z);
    return arr[field * CHUNK_AREA + localIndex(lx, lz)] as number;
  }

  /** Value at a tile in data units. */
  get(x: number, z: number, field: string): number {
    return this.raw(x, z, fieldIndex(field)) / FIELD_SCALE;
  }

  /** Sample several fields at one tile with a single chunk lookup and caller-owned storage. */
  sample(x: number, z: number, fields: readonly number[], into: Float64Array): void {
    const arr = this.chunk(x, z, false);
    const { lx, lz } = tileToLocal(x, z);
    const index = localIndex(lx, lz);
    for (let i = 0; i < fields.length; i++)
      into[i] = (arr?.[fields[i]! * CHUNK_AREA + index] ?? 0) / FIELD_SCALE;
  }

  /** Largest value over a footprint (a building benefits from its best tile). */
  maxOver(rect: Rect, field: string): number {
    const fi = fieldIndex(field);
    let best = -Infinity;
    for (let z = rect.z; z < rect.z + rect.d; z++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) best = Math.max(best, this.raw(x, z, fi));
    }
    return best / FIELD_SCALE;
  }

  /** Byte snapshot of all non-empty chunks, for tests. */
  snapshot(): Map<ChunkKey, Int32Array> {
    const out = new Map<ChunkKey, Int32Array>();
    for (const [k, v] of this.chunks) if (v.some((x) => x !== 0)) out.set(k, v.slice());
    return out;
  }

  private chunk(x: number, z: number, create: boolean): Int32Array | undefined {
    const { cx, cz } = tileToChunk(x, z);
    const key = chunkKey(cx, cz);
    let arr = this.chunks.get(key);
    if (!arr && create) {
      arr = new Int32Array(FIELDS.length * CHUNK_AREA);
      this.chunks.set(key, arr);
    }
    return arr;
  }
}
