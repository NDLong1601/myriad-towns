/**
 * Seeded 2D simplex noise, fBm and domain warping.
 *
 * Self-contained (no dependency) so output can never change under us through a package upgrade:
 * world generation must give the same result for the same seed forever (see GEN_VERSION).
 * Gradients come from hash32 on the lattice point, so there is no permutation table to build
 * and any seed works instantly.
 */
import { hash32 } from './prng';

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

// 12 gradient directions spread evenly on the circle.
const GRAD_X = new Float64Array(12);
const GRAD_Y = new Float64Array(12);
for (let i = 0; i < 12; i++) {
  GRAD_X[i] = Math.cos((i / 12) * Math.PI * 2);
  GRAD_Y[i] = Math.sin((i / 12) * Math.PI * 2);
}

function corner(seed: number, i: number, j: number, x: number, y: number): number {
  let t = 0.5 - x * x - y * y;
  if (t <= 0) return 0;
  const g = hash32(seed, i, j) % 12;
  t *= t;
  return t * t * ((GRAD_X[g] as number) * x + (GRAD_Y[g] as number) * y);
}

/** Simplex noise at (x, y), roughly in [-1, 1]. */
export function simplex2(seed: number, x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = 1 - i1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  // 99.2 scales the theoretical max to about 1.
  return (
    99.2 *
    (corner(seed, i, j, x0, y0) +
      corner(seed, i + i1, j + j1, x1, y1) +
      corner(seed, i + 1, j + 1, x2, y2))
  );
}

export interface FbmOptions {
  /** Base frequency in cycles per tile. */
  frequency: number;
  octaves: number;
  /** Amplitude multiplier per octave. */
  gain?: number;
  /** Frequency multiplier per octave. */
  lacunarity?: number;
}

/** Fractal Brownian motion, normalised to roughly [-1, 1]. Each octave gets its own seed. */
export function fbm2(seed: number, x: number, y: number, o: FbmOptions): number {
  const gain = o.gain ?? 0.5;
  const lacunarity = o.lacunarity ?? 2;
  let amp = 1;
  let freq = o.frequency;
  let sum = 0;
  let norm = 0;
  for (let k = 0; k < o.octaves; k++) {
    sum += amp * simplex2(hash32(seed, k), x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** Ridged noise: 1 at the ridge lines of the underlying noise, falling to 0 away from them. */
export function ridge2(seed: number, x: number, y: number, frequency: number): number {
  return 1 - Math.abs(simplex2(seed, x * frequency, y * frequency));
}
