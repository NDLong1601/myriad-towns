import { describe, expect, it } from 'vitest';
import { Purpose, Rng, hash32, hashFloat, rngFor, seedFromString } from '@/core/prng';

describe('hash32', () => {
  it('is deterministic and order-sensitive', () => {
    expect(hash32(1, 2, 3)).toBe(hash32(1, 2, 3));
    expect(hash32(1, 2)).not.toBe(hash32(2, 1));
    expect(hash32(0)).not.toBe(hash32(0, 0));
  });

  it('returns uint32 and hashFloat stays in [0, 1)', () => {
    for (let i = -500; i < 500; i++) {
      const h = hash32(42, i, -i);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
      const f = hashFloat(42, i);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('neighbouring tiles get unrelated values (rough uniformity)', () => {
    const buckets = new Array<number>(10).fill(0);
    for (let x = 0; x < 100; x++) {
      for (let z = 0; z < 100; z++) {
        const b = Math.floor(hashFloat(7, x, z) * 10);
        buckets[b] = (buckets[b] ?? 0) + 1;
      }
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(850);
      expect(count).toBeLessThan(1150);
    }
  });
});

describe('Rng', () => {
  it('same seed → same sequence; different seed → different sequence', () => {
    const a = new Rng(123);
    const b = new Rng(123);
    const c = new Rng(124);
    const sa = Array.from({ length: 20 }, () => a.nextU32());
    const sb = Array.from({ length: 20 }, () => b.nextU32());
    const sc = Array.from({ length: 20 }, () => c.nextU32());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it('nextInt stays in range and hits both ends', () => {
    const r = new Rng(9);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.nextInt(-2, 2);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(2);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([-1, -2, 0, 1, 2].sort());
    expect(() => r.nextInt(3, 1)).toThrow(RangeError);
  });

  it('state snapshot resumes the exact stream', () => {
    const r = new Rng(77);
    for (let i = 0; i < 5; i++) r.nextU32();
    const resumed = Rng.fromState(r.getState());
    expect(Array.from({ length: 10 }, () => resumed.nextU32())).toEqual(
      Array.from({ length: 10 }, () => r.nextU32()),
    );
  });

  it('rngFor separates purposes at the same place', () => {
    const trees = rngFor(1, Purpose.Trees, 0, 0).nextU32();
    const ore = rngFor(1, Purpose.Resources, 0, 0).nextU32();
    expect(trees).not.toBe(ore);
    expect(rngFor(1, Purpose.Trees, 0, 0).nextU32()).toBe(trees);
  });
});

describe('seedFromString', () => {
  it('uses digits as the number and hashes other text', () => {
    expect(seedFromString('42')).toBe(42);
    expect(seedFromString(' 42 ')).toBe(42);
    expect(seedFromString('hello')).toBe(seedFromString('hello'));
    expect(seedFromString('hello')).not.toBe(seedFromString('Hello'));
  });
});

// Golden values: if these change, every saved world changes. Only update together with GEN_VERSION.
describe('golden (generation stability)', () => {
  it('matches recorded outputs', () => {
    expect({
      hash: [hash32(42), hash32(42, 0, 0), hash32(42, -1, 7, Purpose.Trees)],
      seq: Array.from(
        { length: 4 },
        (
          (r) => () =>
            r.nextU32()
        )(new Rng(42)),
      ),
      seed: seedFromString('myriad'),
    }).toMatchInlineSnapshot(`
      {
        "hash": [
          2329426286,
          3793932886,
          4198783016,
        ],
        "seed": 1213098121,
        "seq": [
          572256218,
          306246411,
          411849184,
          301752417,
        ],
      }
    `);
  });
});
