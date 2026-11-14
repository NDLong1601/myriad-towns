import { describe, expect, it } from 'vitest';
import { AdaptiveResolution, parsePreset, qualitySettings } from '@/render/quality';

const feed = (a: AdaptiveResolution, ms: number, frames: number): number => {
  let changes = 0;
  for (let i = 0; i < frames; i++) if (a.push(ms)) changes++;
  return changes;
};

describe('qualitySettings', () => {
  it('caps pixel ratio by preset and device', () => {
    expect(qualitySettings('medium', 1.88).maxPixelRatio).toBe(1.5);
    expect(qualitySettings('medium', 1).maxPixelRatio).toBe(1);
    expect(qualitySettings('high', 3).maxPixelRatio).toBe(2);
    expect(qualitySettings('low', 2).shadows).toBe(false);
    expect(qualitySettings('high', 2).adaptive).toBe(false);
  });
  it('parses presets', () => {
    expect(parsePreset('low')).toBe('low');
    expect(parsePreset('ultra')).toBeUndefined();
    expect(parsePreset(null)).toBeUndefined();
  });
});

describe('AdaptiveResolution', () => {
  it('keeps full scale when frames match the display rate', () => {
    const a = new AdaptiveResolution(1.5, { min: 0.75, max: 1.5 });
    feed(a, 16.7, 1000);
    expect(a.scale).toBe(1.5);
  });

  it('does not mistake a 30 Hz capped display for a slow GPU', () => {
    const a = new AdaptiveResolution(1.5, { min: 0.75, max: 1.5 });
    feed(a, 33.3, 1000);
    expect(a.scale).toBe(1.5);
    expect(a.displayIntervalMs).toBeCloseTo(33.3, 0);
  });

  it('lowers scale when frames run slower than the display, never below min', () => {
    const a = new AdaptiveResolution(1.5, { min: 0.75, max: 1.5 });
    feed(a, 16.7, 90); // learn a 60 Hz display
    // Mostly fast frames with a slow tail: p90 well above the interval.
    for (let i = 0; i < 2000; i++) a.push(i % 5 === 0 ? 16.7 : 30);
    expect(a.scale).toBeLessThan(1.5);
    expect(a.scale).toBeGreaterThanOrEqual(0.75);
  });

  it('recovers scale once there is headroom again', () => {
    const a = new AdaptiveResolution(1.5, { min: 0.75, max: 1.5 });
    feed(a, 16.7, 90);
    for (let i = 0; i < 600; i++) a.push(i % 5 === 0 ? 16.7 : 30);
    const low = a.scale;
    expect(low).toBeLessThan(1.5);
    feed(a, 16.7, 5000);
    expect(a.scale).toBe(1.5);
  });

  it('ignores hitches over 250 ms', () => {
    const a = new AdaptiveResolution(1.5, { min: 0.75, max: 1.5 });
    feed(a, 16.7, 90);
    feed(a, 1000, 500);
    expect(a.scale).toBe(1.5);
  });
});
