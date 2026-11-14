import * as THREE from 'three';

/** Game ticks in one day (4 ticks/s: a day is 10 minutes of play). */
export const TICKS_PER_DAY = 2400;

export interface Lighting {
  sky: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  /** Unit vector from the target towards the light (sun by day, moon by night). */
  sunDir: THREE.Vector3;
  /** 0 at noon … 1 at midnight; lamps and night sounds follow it. */
  night: number;
}

interface Key {
  t: number;
  sky: string;
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  night: number;
}

// t = 0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset. Nights stay readable (ambient never too low).
const KEYS: Key[] = [
  { t: 0.0, sky: '#1b2a45', sun: '#9fb4ff', sunI: 0.45, hemiSky: '#6d84b8', hemiGround: '#2b3242', hemiI: 0.75, night: 1 },
  { t: 0.2, sky: '#2c3d5e', sun: '#a9b8f0', sunI: 0.5, hemiSky: '#7488b8', hemiGround: '#323a44', hemiI: 0.8, night: 0.9 },
  { t: 0.27, sky: '#f0b48a', sun: '#ff9c5a', sunI: 1.5, hemiSky: '#ecbea4', hemiGround: '#524840', hemiI: 0.85, night: 0.35 },
  { t: 0.35, sky: '#a9d2e3', sun: '#ffe9c8', sunI: 1.8, hemiSky: '#dceeff', hemiGround: '#5a6b48', hemiI: 1.05, night: 0 },
  { t: 0.5, sky: '#9cc9dc', sun: '#fff1d6', sunI: 2.0, hemiSky: '#dceeff', hemiGround: '#5a6b48', hemiI: 1.1, night: 0 },
  { t: 0.65, sky: '#a3cadb', sun: '#ffe6c2', sunI: 1.85, hemiSky: '#dceeff', hemiGround: '#5a6b48', hemiI: 1.05, night: 0 },
  { t: 0.74, sky: '#e99a74', sun: '#ff8040', sunI: 1.6, hemiSky: '#e8a888', hemiGround: '#4a3c3a', hemiI: 0.8, night: 0.4 },
  { t: 0.82, sky: '#2f3a5c', sun: '#a9b8f0', sunI: 0.5, hemiSky: '#7488b8', hemiGround: '#323a44', hemiI: 0.8, night: 0.9 },
  { t: 1.0, sky: '#1b2a45', sun: '#9fb4ff', sunI: 0.45, hemiSky: '#6d84b8', hemiGround: '#2b3242', hemiI: 0.75, night: 1 },
];

const ca = new THREE.Color();
const cb = new THREE.Color();
function mix(a: string, b: string, f: number, out: THREE.Color): THREE.Color {
  return out.copy(ca.set(a)).lerp(cb.set(b), f);
}

/** Time of day in [0, 1) for a game tick; `offset` shifts it (the game starts in the morning). */
export function timeOfDay(tick: number, offset = 0.3): number {
  const t = (tick / TICKS_PER_DAY + offset) % 1;
  return t < 0 ? t + 1 : t;
}

/** Light and sky for a time of day (0 midnight, 0.5 noon). Pure; writes into `out` if given. */
export function lightingAt(time: number, out?: Lighting): Lighting {
  const t = ((time % 1) + 1) % 1;
  let i = 0;
  while (i < KEYS.length - 2 && (KEYS[i + 1] as Key).t <= t) i++;
  const a = KEYS[i] as Key;
  const b = KEYS[i + 1] as Key;
  const raw = (t - a.t) / (b.t - a.t);
  const f = raw * raw * (3 - 2 * raw); // smoothstep between keys
  const o: Lighting = out ?? {
    sky: new THREE.Color(),
    sunColor: new THREE.Color(),
    sunIntensity: 0,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    hemiIntensity: 0,
    sunDir: new THREE.Vector3(),
    night: 0,
  };
  mix(a.sky, b.sky, f, o.sky);
  mix(a.sun, b.sun, f, o.sunColor);
  mix(a.hemiSky, b.hemiSky, f, o.hemiSky);
  mix(a.hemiGround, b.hemiGround, f, o.hemiGround);
  o.sunIntensity = a.sunI + (b.sunI - a.sunI) * f;
  o.hemiIntensity = a.hemiI + (b.hemiI - a.hemiI) * f;
  o.night = a.night + (b.night - a.night) * f;
  // By day the sun crosses from east to west; by night the moon does the same half a day later.
  const day = t >= 0.25 && t < 0.75;
  const arc = day ? (t - 0.25) / 0.5 : (((t + 0.25) % 1) / 0.5);
  const azimuth = Math.PI * arc; // 0 east … π west
  // Stay at least ~25° up so shadows never stretch across the whole map.
  const elevation = 0.45 + 0.75 * Math.sin(Math.PI * arc);
  o.sunDir
    .set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), 0.45 * Math.cos(elevation))
    .normalize();
  return o;
}
