/**
 * Render quality: pixel-ratio cap and adaptive resolution.
 *
 * The game is fill-rate bound on integrated GPUs with high-DPI screens, so the cheapest
 * lever is the number of pixels drawn. `AdaptiveResolution` lowers the render scale when
 * frames run slow and raises it again when there is headroom.
 *
 * "Slow" is measured against the display's own frame interval, estimated from the fastest
 * recent frames, so a browser capped at 30 Hz (energy saver, remote desktop) is not mistaken
 * for a slow GPU.
 */

export type QualityPreset = 'low' | 'medium' | 'high';

export interface QualitySettings {
  /** Highest pixel ratio used (already capped by the device pixel ratio). */
  maxPixelRatio: number;
  /** Lowest pixel ratio adaptive resolution may drop to. */
  minPixelRatio: number;
  /** Whether adaptive resolution runs at all. */
  adaptive: boolean;
  shadows: boolean;
  shadowMapSize: number;
}

/** Settings for a preset on a device with the given devicePixelRatio. */
export function qualitySettings(preset: QualityPreset, devicePixelRatio: number): QualitySettings {
  const dpr = Math.max(1, devicePixelRatio || 1);
  switch (preset) {
    case 'low':
      return {
        maxPixelRatio: Math.min(dpr, 1),
        minPixelRatio: 0.6,
        adaptive: true,
        shadows: false,
        shadowMapSize: 1024,
      };
    case 'medium':
      return {
        maxPixelRatio: Math.min(dpr, 1.5),
        minPixelRatio: 0.75,
        adaptive: true,
        shadows: true,
        shadowMapSize: 2048,
      };
    case 'high':
      return {
        maxPixelRatio: Math.min(dpr, 2),
        minPixelRatio: Math.min(dpr, 1),
        adaptive: false,
        shadows: true,
        shadowMapSize: 2048,
      };
  }
}

export function parsePreset(value: string | null): QualityPreset | undefined {
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}

export interface AdaptiveOptions {
  min: number;
  max: number;
  /** Frames per evaluation window. */
  window?: number;
  /** Multiplicative step per adjustment. */
  step?: number;
}

/**
 * Pure controller: feed it frame durations (ms), read `scale` (a pixel ratio).
 * Deterministic, no timers, so it is unit-tested directly.
 */
export class AdaptiveResolution {
  scale: number;
  private readonly min: number;
  private readonly max: number;
  private readonly windowSize: number;
  private readonly step: number;
  private samples: number[] = [];
  /** Estimated display frame interval (ms): low percentile of recent frames, slowly forgotten. */
  private interval = 1000 / 60;
  private intervalSeen = false;
  private calmWindows = 0;
  /** Windows to wait after a change before judging again (the new size needs to settle). */
  private cooldown = 0;

  constructor(start: number, opts: AdaptiveOptions) {
    this.min = opts.min;
    this.max = Math.max(opts.min, opts.max);
    this.scale = clamp(start, this.min, this.max);
    this.windowSize = opts.window ?? 45;
    this.step = opts.step ?? 0.85;
  }

  get displayIntervalMs(): number {
    return this.interval;
  }

  /** Returns true when `scale` changed. */
  push(frameMs: number): boolean {
    // Ignore hitches from tab switches, GC pauses and loading spikes.
    if (!(frameMs > 0) || frameMs > 250) return false;
    this.samples.push(frameMs);
    if (this.samples.length < this.windowSize) return false;

    const sorted = this.samples.slice().sort((a, b) => a - b);
    this.samples = [];
    const fastest = sorted[Math.floor(sorted.length * 0.1)] as number;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] as number;

    // Display interval estimate: never faster than 240 Hz, adopts faster readings at once.
    const reading = Math.max(1000 / 240, fastest);
    if (!this.intervalSeen || reading < this.interval) this.interval = reading;
    else this.interval += (reading - this.interval) * 0.1;
    this.intervalSeen = true;

    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }

    const ratio = p90 / this.interval;
    if (ratio > 1.3 && this.scale > this.min) {
      this.scale = clamp(this.scale * this.step, this.min, this.max);
      this.calmWindows = 0;
      this.cooldown = 1;
      return true;
    }
    if (ratio < 1.1) {
      // Raise slowly: only after several calm windows, to avoid oscillating.
      if (++this.calmWindows >= 4 && this.scale < this.max) {
        this.scale = clamp(this.scale / this.step, this.min, this.max);
        this.calmWindows = 0;
        this.cooldown = 1;
        return true;
      }
    } else {
      this.calmWindows = 0;
    }
    return false;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
