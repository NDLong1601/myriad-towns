/**
 * Deterministic randomness contract.
 *
 * Everything in world generation and simulation must be reproducible from the world seed,
 * so the same seed always builds the same world and saves only need to store player edits.
 * Math.random is banned in core/world/sim by ESLint; use these instead.
 *
 * - hash32(...)       stateless: same inputs → same 32-bit output. Use for per-tile/per-chunk values.
 * - Rng               stateful sfc32 stream. Use when you need many numbers in sequence.
 * - rngFor(seed, ...) a fresh Rng for one purpose at one place, e.g. rngFor(seed, cx, cz, Purpose.Trees).
 *
 * Owner: Claude (core). Changing any output here changes every generated world: bump genVersion.
 */

/** Distinct streams so, e.g., tree placement never shifts when ore placement changes. */
export const Purpose = {
  Elevation: 1,
  Moisture: 2,
  Temperature: 3,
  Rivers: 4,
  Resources: 5,
  Trees: 6,
  PointsOfInterest: 7,
  Decoration: 8,
  Events: 9,
} as const;
export type Purpose = (typeof Purpose)[keyof typeof Purpose];

/** Final avalanche step of MurmurHash3. Maps a 32-bit int to a well-mixed 32-bit uint. */
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Stateless hash of any number of integers to a uint32. Order matters: hash32(1, 2) ≠ hash32(2, 1).
 * Inputs are truncated to int32, so pass integers (tile or chunk coordinates, ids, seeds).
 */
export function hash32(...values: number[]): number {
  let h = 0x9e3779b9;
  for (const v of values) {
    let k = Math.imul(v | 0, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }
  h ^= values.length;
  return fmix32(h);
}

/** hash32 scaled to [0, 1). */
export function hashFloat(...values: number[]): number {
  return hash32(...values) / 4294967296;
}

/** Turn a user-typed seed ("hello", "42") into a uint32. Pure digits are used as the number itself. */
export function seedFromString(text: string): number {
  const trimmed = text.trim();
  if (/^\d{1,10}$/.test(trimmed)) {
    const n = Number(trimmed);
    if (n <= 0xffffffff) return n >>> 0;
  }
  // FNV-1a over UTF-16 code units, then mixed.
  let h = 0x811c9dc5;
  for (let i = 0; i < trimmed.length; i++) {
    h ^= trimmed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return fmix32(h);
}

/** sfc32: small, fast, good-quality 32-bit generator. State is four uint32 words. */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    // Expand one seed into four words, then discard early outputs to decorrelate.
    this.a = hash32(seed, 0xa341316c);
    this.b = hash32(seed, 0xc8013ea4);
    this.c = hash32(seed, 0xad90777d);
    this.d = 1;
    for (let i = 0; i < 12; i++) this.nextU32();
  }

  /** Next uint32 in [0, 2^32). */
  nextU32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Float in [0, 1). */
  nextFloat(): number {
    return this.nextU32() / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`nextInt: invalid range [${min}, ${max}]`);
    }
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.nextFloat() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('pick: empty array');
    return items[this.nextInt(0, items.length - 1)] as T;
  }

  /** Snapshot for saves; restore with Rng.fromState. */
  getState(): [number, number, number, number] {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }

  static fromState(state: readonly [number, number, number, number]): Rng {
    const r = new Rng(0);
    [r.a, r.b, r.c, r.d] = [state[0] | 0, state[1] | 0, state[2] | 0, state[3] | 0];
    return r;
  }
}

/** A fresh stream for one purpose at one place. Example: rngFor(worldSeed, Purpose.Trees, cx, cz). */
export function rngFor(worldSeed: number, purpose: Purpose, ...coords: number[]): Rng {
  return new Rng(hash32(worldSeed, purpose, ...coords));
}
