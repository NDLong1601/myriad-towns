import { describe, expect, it } from 'vitest';
import { FloatingOrigin } from '@/render/floatingOrigin';

describe('FloatingOrigin', () => {
  it('stays put near the origin and jumps by whole chunks when far', () => {
    const o = new FloatingOrigin(1024);
    let shifts = 0;
    o.onShift(() => shifts++);
    expect(o.follow(500, -800)).toBe(false);
    expect(o.follow(1_000_000.7, -1_000_000.2)).toBe(true);
    expect(shifts).toBe(1);
    expect(Math.abs(o.x % 32)).toBe(0);
    expect(Math.abs(o.z % 32)).toBe(0);
    const local = o.toLocal(1_000_000.7, -1_000_000.2);
    expect(Math.abs(local.x)).toBeLessThan(64);
    expect(Math.abs(local.z)).toBeLessThan(64);
    expect(o.toWorld(local.x, local.z).x).toBeCloseTo(1_000_000.7, 6);
  });
});
