/** Simulation ticks per second at 1× speed. All rates in data are per second at 1×. */
export const TICK_HZ = 4;
/** Seconds of game time per tick. */
export const TICK_DT = 1 / TICK_HZ;

export type Speed = 0 | 1 | 2 | 4;
export const SPEEDS: readonly Speed[] = [0, 1, 2, 4];

/**
 * Fixed-step clock: turns real frame time into a whole number of ticks.
 * Faster speeds run more ticks per frame; a long stall drops time instead of
 * running hundreds of ticks at once (no "spiral of death").
 */
export class SimClock {
  speed: Speed = 1;
  /** Speed to restore when unpausing. */
  private lastSpeed: Exclude<Speed, 0> = 1;
  private acc = 0;

  constructor(readonly maxTicksPerFrame = 16) {}

  setSpeed(s: Speed): void {
    if (s !== 0) this.lastSpeed = s;
    this.speed = s;
  }

  togglePause(): void {
    this.setSpeed(this.speed === 0 ? this.lastSpeed : 0);
  }

  /** Real seconds since the last frame → ticks to run now. */
  advance(dtSeconds: number): number {
    if (this.speed === 0 || !(dtSeconds > 0)) return 0;
    this.acc += Math.min(dtSeconds, 0.5) * this.speed * TICK_HZ;
    // The epsilon absorbs float error (60 × 1/60 × 4 = 3.9999…).
    let n = Math.floor(this.acc + 1e-9);
    this.acc = Math.max(0, this.acc - n);
    if (n > this.maxTicksPerFrame) {
      n = this.maxTicksPerFrame;
      this.acc = 0;
    }
    return n;
  }
}
