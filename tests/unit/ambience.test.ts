import { describe, expect, it } from 'vitest';
import { ambientMix } from '@/audio/ambientMix';
import { lightingAt, TICKS_PER_DAY, timeOfDay } from '@/render/dayNight';
import { easeOutBack } from '@/render/buildingRenderer';

const base = { night: 0, water: 0, trees: 0.4, buildings: 0, distance: 40 };

describe('ambientMix', () => {
  it('has birds by day and crickets by night', () => {
    const day = ambientMix(base);
    const night = ambientMix({ ...base, night: 1 });
    expect(day.birds).toBeGreaterThan(0.3);
    expect(day.crickets).toBe(0);
    expect(night.birds).toBe(0);
    expect(night.crickets).toBeGreaterThan(0.3);
  });

  it('hums only near buildings and gurgles only near water', () => {
    expect(ambientMix(base).town).toBe(0);
    expect(ambientMix({ ...base, buildings: 80 }).town).toBeGreaterThan(0.8);
    expect(ambientMix(base).water).toBe(0);
    expect(ambientMix({ ...base, water: 0.5 }).water).toBeGreaterThan(0.8);
  });

  it('a busy town drowns some of the birds', () => {
    expect(ambientMix({ ...base, buildings: 80 }).birds).toBeLessThan(ambientMix(base).birds);
  });

  it('zooming out fades close sounds and raises the wind', () => {
    const near = ambientMix({ ...base, water: 0.5, buildings: 40 });
    const far = ambientMix({ ...base, water: 0.5, buildings: 40, distance: 260 });
    expect(far.wind).toBeGreaterThan(near.wind);
    expect(far.water).toBeLessThan(near.water);
    expect(far.town).toBeLessThan(near.town);
  });

  it('stays within 0..1 for extreme inputs', () => {
    const m = ambientMix({ night: 3, water: 9, trees: 9, buildings: 1e6, distance: -50 });
    for (const v of Object.values(m)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('day and night', () => {
  it('maps ticks to a repeating time of day, starting in the morning', () => {
    expect(timeOfDay(0)).toBeCloseTo(0.3);
    expect(timeOfDay(TICKS_PER_DAY)).toBeCloseTo(0.3);
    expect(timeOfDay(TICKS_PER_DAY * 0.2)).toBeCloseTo(0.5);
  });

  it('noon is bright, midnight is dark but still readable', () => {
    const noon = lightingAt(0.5);
    const midnight = lightingAt(0);
    expect(noon.sunIntensity).toBeGreaterThan(midnight.sunIntensity * 3);
    expect(noon.night).toBe(0);
    expect(midnight.night).toBe(1);
    // Never pitch black: ambient keeps buildings visible.
    expect(midnight.hemiIntensity).toBeGreaterThanOrEqual(0.7);
    expect(midnight.sky.getHSL({ h: 0, s: 0, l: 0 }, 'srgb').l).toBeGreaterThan(0.1);
  });

  it('is continuous across the day and wraps at midnight', () => {
    let prev = lightingAt(0);
    for (let i = 1; i <= 400; i++) {
      const l = lightingAt(i / 400);
      expect(Math.abs(l.sunIntensity - prev.sunIntensity)).toBeLessThan(0.1);
      expect(l.sky.r - prev.sky.r).toBeLessThan(0.08);
      prev = { ...l, sky: l.sky.clone() };
    }
    expect(lightingAt(1).sunIntensity).toBeCloseTo(lightingAt(0).sunIntensity);
  });

  it('keeps the light above the horizon', () => {
    for (let i = 0; i < 48; i++) expect(lightingAt(i / 48).sunDir.y).toBeGreaterThan(0.4);
  });
});

describe('easeOutBack', () => {
  it('starts at 0, overshoots, and settles at 1', () => {
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
    expect(Math.max(...[0.6, 0.7, 0.8].map(easeOutBack))).toBeGreaterThan(1);
    expect(easeOutBack(2)).toBeCloseTo(1);
  });
});
