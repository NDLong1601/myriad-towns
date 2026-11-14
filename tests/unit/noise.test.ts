import { describe, expect, it } from 'vitest';
import { fbm2, ridge2, simplex2 } from '@/core/noise';

describe('noise', () => {
  it('is deterministic per seed and differs between seeds', () => {
    expect(simplex2(1, 3.3, -7.1)).toBe(simplex2(1, 3.3, -7.1));
    expect(simplex2(1, 3.3, -7.1)).not.toBe(simplex2(2, 3.3, -7.1));
  });

  it('stays within [-1, 1] and actually varies', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 20000; i++) {
      const v = simplex2(9, (i % 200) * 0.137, Math.floor(i / 200) * 0.173 - 50);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeGreaterThanOrEqual(-1.05);
    expect(max).toBeLessThanOrEqual(1.05);
    expect(max - min).toBeGreaterThan(1.2);
  });

  it('is continuous: tiny steps give tiny changes', () => {
    for (let i = 0; i < 500; i++) {
      const x = i * 0.731 - 100;
      const y = i * 0.419 + 20;
      expect(Math.abs(simplex2(5, x, y) - simplex2(5, x + 1e-4, y))).toBeLessThan(0.01);
    }
  });

  it('works far from the origin', () => {
    const v = fbm2(3, 1_000_000.5, -2_000_000.25, { frequency: 0.01, octaves: 4 });
    expect(Number.isFinite(v)).toBe(true);
    expect(Math.abs(v)).toBeLessThanOrEqual(1.05);
  });

  it('ridge2 is in [0, 1]', () => {
    for (let i = 0; i < 1000; i++) {
      const r = ridge2(4, i * 1.3, i * -0.7, 0.05);
      expect(r).toBeGreaterThanOrEqual(-0.05);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
