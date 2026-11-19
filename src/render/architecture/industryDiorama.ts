import * as THREE from 'three';
import {
  barrel,
  boardBody,
  crate,
  door,
  lanternPost,
  meadow,
  off,
  person,
  rand,
  reseed,
  shade,
  shingleGable,
  shrub,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import { smoke, steelSilo, truck } from './dioramaProps';
import {
  blockStack,
  brickBody,
  conveyor,
  floodlight,
  portal,
  railLine,
  rockMass,
  wagon,
  windingWheel,
  windows4,
  workers,
  yard,
} from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2A: heavy industry and energy, drawn as dioramas (2x2 lots drawn in a smaller frame and
// scaled up, see `zoomed` in architectureModels.ts; the steelworks are 3x2).
//   power_plant   -> steam_powerhouse    -> turbine_power_station
//   foundry       -> heavy_foundry
//   factory (sawtooth multi-bay hall)
//   steelworks    -> bessemer_steelworks -> integrated_steel_mill
//   coal_mine     -> colliery_headframe  -> deep_shaft_colliery

const grass = '#79a24a';
const timberDark = '#3d2a19';
const plank = '#6b5a48';
const slate = '#4d5a66';
const concrete = '#b9b6ae';
const cinder = '#5d5750';
const hot = '#ff8a2a';

/** Cinder-and-grass ground with a worn floor patch. */
function site(l: Lot, seed: string, floor: string, patch: [number, number, number, number]): void {
  reseed(seed);
  meadow(l, grass, 22);
  const [x0, z0, x1, z1] = patch;
  wbox(
    l,
    (x0 + x1) / 2,
    (z0 + z1) / 2,
    0.03,
    (x1 - x0) * l.spanX,
    0.008,
    (z1 - z0) * l.spanZ,
    floor,
  );
  for (let i = 0; i < 40; i++)
    wbox(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      0.038,
      0.01 + rand() * 0.02,
      0.004,
      0.01 + rand() * 0.02,
      tone(shade(floor, 0.8), 0.3),
      rand() * 3,
    );
}

// ---------------------------------------------------------------------------------------------
// Detail kit: facades, roof furniture, pipework, fencing and yard clutter shared by every chain.
// ---------------------------------------------------------------------------------------------

type Face = '+z' | '-z' | '+x' | '-x';
const FACES: readonly Face[] = ['+z', '-z', '+x', '-x'];
const pane = '#f2c766';
const iron = '#2c3134';
const hat = '#f2cf4a';

/** Lot position on a body face: `along` runs along the face, `out` away from the wall. */
function faceAt(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: Face,
  along: number,
  out: number,
): [number, number] {
  const s = f[0] === '+' ? 1 : -1;
  return f === '+z' || f === '-z'
    ? off(l, x, z, along, s * (d / 2 + out))
    : off(l, x, z, s * (w / 2 + out), along);
}

/** Box flat against a body face: `a` wide along the face, `th` thick out of it. */
function faceBox(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: Face,
  along: number,
  out: number,
  y: number,
  a: number,
  h: number,
  th: number,
  color: string,
  glow = 0,
): void {
  const [px, pz] = faceAt(l, x, z, w, d, f, along, out);
  if (f === '+z' || f === '-z') wbox(l, px, pz, y, a, h, th, color, 0, 0, glow);
  else wbox(l, px, pz, y, th, h, a, color, 0, 0, glow);
}

/** Tall industrial window: frame, lit glazing, glazing bars, brick lintel with keystone, sill. */
function millWindow(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: Face,
  along: number,
  y: number,
  ww: number,
  wh: number,
  lintel: string,
): void {
  faceBox(l, x, z, w, d, f, along, 0.002, y - 0.004, ww + 0.01, wh + 0.008, 0.004, '#2a2624');
  faceBox(l, x, z, w, d, f, along, 0.004, y, ww, wh, 0.003, pane, 1);
  for (const k of [-1, 1])
    faceBox(l, x, z, w, d, f, along + (k * ww) / 6, 0.006, y, 0.003, wh, 0.003, '#3a3430');
  for (let r = 1; r < 4; r++)
    faceBox(l, x, z, w, d, f, along, 0.006, y + (wh * r) / 4, ww, 0.003, 0.003, '#3a3430');
  faceBox(l, x, z, w, d, f, along, 0.004, y + wh, ww + 0.018, 0.012, 0.008, lintel);
  faceBox(l, x, z, w, d, f, along, 0.007, y + wh + 0.001, 0.008, 0.014, 0.006, '#d9cfb8');
  faceBox(l, x, z, w, d, f, along, 0.006, y - 0.01, ww + 0.014, 0.007, 0.012, '#bdb3a0');
}

/**
 * Dresses a plain body as a brick works hall: plinth, pilasters dividing each face into bays,
 * one or two rows of tall mill windows per bay, string course, corbelled cornice, gutters and
 * downpipes. `skip` leaves a bay free (for a door) as [face, bay index].
 */
function hallFacade(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
  opts: { bay?: number; trim?: string; skip?: [Face, number][]; faces?: readonly Face[] } = {},
): void {
  const bay = opts.bay ?? 0.075;
  const trim = opts.trim ?? '#d9cfb8';
  const pier = shade(color, 0.82);
  const lintel = shade(color, 1.15);
  wbox(l, x, z, y, w + 0.014, 0.026, d + 0.014, shade(color, 0.55));
  wbox(l, x, z, y + h - 0.03, w + 0.012, 0.01, d + 0.012, shade(color, 0.78));
  wbox(l, x, z, y + h - 0.02, w + 0.022, 0.014, d + 0.022, trim);
  const storeys = h > 0.21 ? 2 : 1;
  if (storeys === 2) wbox(l, x, z, y + h * 0.5, w + 0.008, 0.008, d + 0.008, trim);
  for (const f of opts.faces ?? FACES) {
    const len = f === '+z' || f === '-z' ? w : d;
    const n = Math.max(1, Math.round(len / bay));
    const bw = len / n;
    for (let i = 0; i <= n; i++)
      faceBox(l, x, z, w, d, f, -len / 2 + i * bw, 0.003, y + 0.02, 0.016, h - 0.04, 0.008, pier);
    for (let i = 0; i < n; i++) {
      if (opts.skip?.some(([sf, si]) => sf === f && si === i)) continue;
      const t = -len / 2 + (i + 0.5) * bw;
      const ww = Math.min(bw * 0.52, 0.05);
      const rowH = (h - 0.06) / storeys;
      for (let s = 0; s < storeys; s++)
        millWindow(l, x, z, w, d, f, t, y + 0.045 + s * rowH, ww, rowH * 0.62, lintel);
    }
  }
  // Gutters along the eaves, downpipes at the corners.
  for (const sz of [-1, 1])
    wbox(l, ...off(l, x, z, 0, sz * (d / 2 + 0.014)), y + h - 0.012, w + 0.02, 0.01, 0.01, iron);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      wround(
        l,
        ...off(l, x, z, sx * (w / 2 - 0.012), sz * (d / 2 + 0.014)),
        0.004,
        0.004,
        y,
        h - 0.01,
        iron,
        6,
      );
}

/** Raised ventilating lantern along a roof ridge: glazed sides, louvres and its own small roof. */
function ridgeLantern(
  l: Lot,
  x: number,
  z: number,
  along: 'x' | 'z',
  len: number,
  y: number,
  roof: string,
): void {
  const w = 0.05;
  const h = 0.034;
  const [a, b] = along === 'x' ? [len, w] : [w, len];
  wbox(l, x, z, y, a, h, b, '#3a3f42');
  const n = Math.max(3, Math.round(len / 0.03));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (i + 0.5) * (len / n);
    for (const s of [-1, 1]) {
      const [px, pz] =
        along === 'x' ? off(l, x, z, t, s * (w / 2 + 0.002)) : off(l, x, z, s * (w / 2 + 0.002), t);
      if (along === 'x')
        wbox(l, px, pz, y + 0.006, (len / n) * 0.7, h - 0.012, 0.003, pane, 0, 0, 1);
      else wbox(l, px, pz, y + 0.006, 0.003, h - 0.012, (len / n) * 0.7, pane, 0, 0, 1);
    }
  }
  wbox(l, x, z, y + h, a + 0.02, 0.008, b + 0.03, roof);
  wbox(l, x, z, y + h + 0.008, a + 0.02, 0.008, b * 0.4, shade(roof, 0.8));
}

/** Mushroom roof ventilator. */
function cowl(l: Lot, x: number, z: number, y: number, r = 0.014): void {
  wround(l, x, z, r * 0.6, r * 0.7, y, r * 1.6, '#6e777b', 8);
  wround(l, x, z, r * 0.2, r * 1.3, y + r * 1.6, r * 0.8, '#4f585c', 8);
}

/** Simple rung ladder on the +z side of a point (rails plus rungs), from y0 to y1. */
function ladder(l: Lot, x: number, z: number, y0: number, y1: number, out = 0): void {
  const [px, pz] = off(l, x, z, 0, out);
  for (const s of [-1, 1])
    wbox(l, ...off(l, px, pz, s * 0.008, 0), y0, 0.003, y1 - y0, 0.003, iron);
  for (let y = y0 + 0.012; y < y1; y += 0.016) wbox(l, px, pz, y, 0.016, 0.0025, 0.003, iron);
}

/** Railed walkway ring around a cylinder at height y. */
function catwalk(l: Lot, x: number, z: number, r: number, y: number): void {
  const deck = new THREE.RingGeometry(r - 0.004, r + 0.02, 24).rotateX(-Math.PI / 2);
  l.shape(deck, '#4a5257', x, z, y + 0.004);
  l.shape(deck.clone().rotateX(Math.PI), '#4a5257', x, z, y + 0.003);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * (r + 0.014), Math.sin(a) * (r + 0.014)),
      y,
      0.003,
      0.024,
      0.003,
      iron,
    );
  }
  const rail = new THREE.TorusGeometry(r + 0.014, 0.002, 4, 24).rotateX(Math.PI / 2);
  l.shape(rail, iron, x, z, y + 0.024);
}

/** Pipe run between two points with a flange collar at each end. */
function pipe(
  l: Lot,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  r: number,
  color = '#7a8186',
): void {
  l.beam(a, b, r * 2, color);
  for (const p of [a, b])
    wbox(l, p[0], p[2], p[1] - r * 1.4, r * 2.8, r * 2.8, r * 2.8, shade(color, 0.7));
}

/** Pipe rack: T-posts from (x0, z0) to (x1, z1) carrying `n` parallel pipes at height y. */
function pipeRack(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  n = 3,
  colors: readonly string[] = ['#7a8186', '#a0532f', '#c9b04a'],
): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const posts = Math.max(2, Math.round(len / 0.12) + 1);
  const nx = (-(z1 - z0) * l.spanZ) / len;
  const nz = ((x1 - x0) * l.spanX) / len;
  for (let i = 0; i < posts; i++) {
    const t = i / (posts - 1);
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    wbox(l, px, pz, 0.03, 0.008, y - 0.03, 0.008, '#4a5257');
    l.beam(
      [px - (nx * 0.03) / l.spanX, y, pz - (nz * 0.03) / l.spanZ],
      [px + (nx * 0.03) / l.spanX, y, pz + (nz * 0.03) / l.spanZ],
      0.007,
      '#4a5257',
    );
  }
  for (let k = 0; k < n; k++) {
    const o = (k - (n - 1) / 2) * 0.018;
    l.beam(
      [x0 + (nx * o) / l.spanX, y + 0.012, z0 + (nz * o) / l.spanZ],
      [x1 + (nx * o) / l.spanX, y + 0.012, z1 + (nz * o) / l.spanZ],
      0.011,
      colors[k % colors.length]!,
    );
  }
}

/** Chain-link style fence: posts, top and bottom rails, a mid wire, along a polyline. */
function fence(l: Lot, pts: readonly (readonly [number, number])[], h = 0.05): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, z0] = pts[i]!;
    const [x1, z1] = pts[i + 1]!;
    const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
    const n = Math.max(1, Math.round(len / 0.06));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      wbox(l, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.03, 0.005, h, 0.005, '#5f686d');
    }
    for (const y of [0.036, 0.03 + h * 0.55, 0.03 + h - 0.002])
      l.beam([x0, y, z0], [x1, y, z1], 0.0025, '#8a9398');
  }
}

/** Steel oil drums in a tight cluster. */
function drums(l: Lot, x: number, z: number, n: number, color = '#2f5d8a'): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, (i % 3) * 0.022, Math.floor(i / 3) * 0.022);
    wround(l, px, pz, 0.01, 0.01, 0.03, 0.03, tone(color, 0.15), 10);
    wround(l, px, pz, 0.0105, 0.0105, 0.04, 0.003, shade(color, 0.7), 10);
    wround(l, px, pz, 0.0105, 0.0105, 0.05, 0.003, shade(color, 0.7), 10);
  }
}

/** Wooden pallet stacked with sacks or boxed goods. */
function pallet(l: Lot, x: number, z: number, load = '#c9b48a', ry = 0): void {
  wbox(l, x, z, 0.03, 0.05, 0.008, 0.04, '#8a6a48', ry);
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      ...off(l, x, z, i % 2 ? 0.012 : -0.012, i < 2 ? 0.009 : -0.009),
      0.038,
      0.022,
      0.016,
      0.016,
      tone(load, 0.12),
      ry,
    );
  wbox(l, x, z, 0.054, 0.04, 0.014, 0.03, tone(load, 0.12), ry);
}

/** Small forklift: counterweighted body, cab cage, mast and forks. */
function forklift(l: Lot, x: number, z: number, ry: number, color = '#e0b02a'): void {
  const at = (dx: number): [number, number] => off(l, x, z, Math.cos(ry) * dx, -Math.sin(ry) * dx);
  wbox(l, x, z, 0.036, 0.05, 0.022, 0.032, color, ry);
  wbox(l, ...at(-0.016), 0.058, 0.018, 0.014, 0.03, shade(color, 0.8), ry);
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, ...at(0.006), Math.sin(ry) * s * 0.013, Math.cos(ry) * s * 0.013),
      0.058,
      0.003,
      0.03,
      0.003,
      iron,
      ry,
    );
  wbox(l, ...at(0.004), 0.088, 0.03, 0.003, 0.032, iron, ry);
  wbox(l, ...at(0.028), 0.036, 0.006, 0.07, 0.028, '#3a3f42', ry);
  wbox(l, ...at(0.044), 0.038, 0.03, 0.003, 0.02, '#3a3f42', ry);
  person(l, ...at(-0.002), 0.046, '#5a7a9a', hat);
  for (const s of [-1, 1])
    for (const dx of [-0.016, 0.016])
      wround(
        l,
        ...off(l, ...at(dx), Math.sin(ry) * s * 0.017, Math.cos(ry) * s * 0.017),
        0.007,
        0.007,
        0.03,
        0.006,
        '#1c1f21',
        8,
      );
}

/** Pressurised gas bottles in a caged rack. */
function gasRack(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.03, 0.07, 0.004, 0.026, '#5f686d');
  for (let i = 0; i < 5; i++)
    wround(
      l,
      ...off(l, x, z, -0.028 + i * 0.014, 0),
      0.005,
      0.005,
      0.034,
      0.04,
      ['#c84a3a', '#3a6a9a', '#8a8f94'][i % 3]!,
      8,
    );
  wbox(l, x, z, 0.06, 0.074, 0.003, 0.03, '#5f686d');
}

/** Name board on posts. */
function signboard(
  l: Lot,
  x: number,
  z: number,
  y: number,
  w: number,
  color: string,
  ry = 0,
): void {
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * s * w * 0.4, -Math.sin(ry) * s * w * 0.4),
      0.03,
      0.005,
      y - 0.03,
      0.005,
      iron,
    );
  wbox(l, x, z, y, w, 0.03, 0.006, color, ry);
  wbox(l, x, z, y + 0.008, w * 0.8, 0.012, 0.008, '#efe7d6', ry);
}

/** Concrete apron of cast slabs with joint lines. */
function apron(l: Lot, x0: number, z0: number, x1: number, z1: number, color = '#9a978f'): void {
  const w = (x1 - x0) * l.spanX;
  const d = (z1 - z0) * l.spanZ;
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, w, 0.004, d, color);
  const nx = Math.max(1, Math.round(w / 0.08));
  const nz = Math.max(1, Math.round(d / 0.08));
  for (let i = 1; i < nx; i++)
    wbox(l, x0 + ((x1 - x0) * i) / nx, (z0 + z1) / 2, 0.0345, 0.003, 0.001, d, shade(color, 0.75));
  for (let i = 1; i < nz; i++)
    wbox(l, (x0 + x1) / 2, z0 + ((z1 - z0) * i) / nz, 0.0345, w, 0.001, 0.003, shade(color, 0.75));
}

/** Scatter of drums, pallets, gas bottles and crates in a rectangle. */
function clutter(l: Lot, x0: number, z0: number, x1: number, z1: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    const r = rand();
    if (r < 0.3) drums(l, x, z, 2 + Math.floor(rand() * 3), rand() < 0.5 ? '#2f5d8a' : '#a0402f');
    else if (r < 0.55) pallet(l, x, z, rand() < 0.5 ? '#c9b48a' : '#8f969a', rand() * 0.4);
    else if (r < 0.7) gasRack(l, x, z);
    else if (r < 0.85) crate(l, x, z, 0.036, '#8a6a48', rand() * 3);
    else barrel(l, x, z);
  }
}

/** Brick chimney stack, tapering, with iron bands, corbelled top, ladder, lamp and smoke. */
function stack(
  l: Lot,
  x: number,
  z: number,
  h: number,
  r = 0.022,
  color = '#9c5640',
  fume = 4,
): void {
  wbox(l, x, z, 0.03, r * 2.8, 0.03, r * 2.8, shade(color, 0.7));
  const rows = Math.round(h / 0.0125);
  for (let i = 0; i < rows; i++)
    wround(
      l,
      x,
      z,
      r * (1 - (0.28 * (i + 1)) / rows),
      r * (1 - (0.28 * i) / rows),
      0.03 + i * 0.0125,
      0.0125,
      tone(color, 0.2),
      12,
    );
  for (let k = 1; k < 4; k++) {
    const t = (k * 0.25 * rows) | 0;
    const rr = r * (1 - (0.28 * t) / rows) + 0.002;
    wround(l, x, z, rr, rr, 0.03 + t * 0.0125, 0.004, iron, 12);
  }
  wround(l, x, z, r * 0.95, r * 0.8, 0.03 + h - 0.02, 0.02, shade(color, 1.1), 12);
  wround(l, x, z, r * 0.9, r * 0.74, 0.03 + h, 0.012, '#2c2a28', 12);
  if (h > 0.3) {
    ladder(l, x, z, 0.06, 0.03 + h - 0.02, r * 0.8 + 0.004);
    wbox(
      l,
      ...off(l, x, z, 0, r * 0.75),
      0.03 + h - 0.004,
      0.007,
      0.007,
      0.007,
      '#ff3b2a',
      0,
      0,
      1,
    );
  }
  if (fume) smoke(l, x, z, 0.04 + h, fume);
}

/** Round steel flue pipe (stovepipe) with smoke. */
function flue(l: Lot, x: number, z: number, y: number, h: number, r = 0.012, fume = 3): void {
  wround(l, x, z, r, r * 1.15, y, h, '#2c3134', 10);
  wround(l, x, z, r * 1.5, r * 1.3, y + h, 0.01, '#1c1f21', 10);
  if (fume) smoke(l, x, z, y + h + 0.01, fume);
}

/** Glowing molten metal: a short emissive cylinder. */
function melt(l: Lot, x: number, z: number, y: number, r: number): void {
  l.shape(new THREE.CylinderGeometry(r, r, 0.006, 14), '#ff9a3a', x, z, y, 1);
}

/** Spoked iron flywheel standing in the plane facing `ry`, bottom at y. */
function flywheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
  const rim = new THREE.TorusGeometry(r, 0.008, 6, 22);
  rim.rotateY(ry + Math.PI / 2);
  l.shape(rim, '#26292b', x, z, y + r);
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.BoxGeometry(0.006, r * 2, 0.006);
    sp.rotateZ((i / 6) * Math.PI);
    sp.rotateY(ry + Math.PI / 2);
    l.shape(sp, '#3a3f42', x, z, y + r);
  }
  const hub = new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10);
  hub.rotateX(Math.PI / 2);
  hub.rotateY(ry);
  l.shape(hub, '#1b1d1f', x, z, y + r);
}

/** Lattice transmission pylon with insulators, returns the cable attachment points. */
function pylon(l: Lot, x: number, z: number, h: number): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    l.beam(
      [x + (a * 0.022) / l.spanX, 0.03, z + (b * 0.022) / l.spanZ],
      [x + (a * 0.006) / l.spanX, 0.03 + h, z + (b * 0.006) / l.spanZ],
      0.004,
      '#8a9298',
    );
  for (let k = 1; k < 5; k++)
    wbox(l, x, z, 0.03 + (k * h) / 5, 0.03 - k * 0.004, 0.004, 0.03 - k * 0.004, '#6e777b');
  for (const y of [0.78, 0.9]) {
    wbox(l, x, z, 0.03 + h * y, 0.1, 0.005, 0.005, '#6e777b', Math.PI / 2);
    for (const s of [-1, 1])
      wround(
        l,
        ...off(l, x, z, 0, s * 0.045),
        0.005,
        0.005,
        0.03 + h * y - 0.022,
        0.022,
        '#cfe6ee',
        8,
      );
  }
}

/** Hyperboloid cooling tower with ribs and a plume. */
function coolingTower(l: Lot, x: number, z: number, h: number, r: number): void {
  const rings = 14;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const rad = r * (1 - 0.28 * Math.sin(t * Math.PI * 0.82) + 0.0 * t);
    const rad2 = r * (1 - 0.28 * Math.sin(Math.min(1, (i + 1) / (rings - 1)) * Math.PI * 0.82));
    wround(
      l,
      x,
      z,
      rad2,
      rad,
      0.03 + (i * h) / rings,
      h / rings + 0.002,
      tone(i % 2 ? '#c4c1b8' : '#b3b0a7', 0.06),
      28,
    );
  }
  const lip = new THREE.RingGeometry(r * 0.66, r * 0.8, 28).rotateX(-Math.PI / 2);
  l.shape(lip, '#8f8c84', x, z, 0.03 + h + 0.006);
  wround(l, x, z, r * 0.68, r * 0.68, 0.03 + h * 0.7, 0.004, '#3a3c3a', 28);
  // Raker legs around the open base, a dark air inlet, catwalk and access ladder.
  wround(l, x, z, r * 0.97, r * 0.97, 0.03, 0.03, '#2a2c2c', 28);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const b = a + Math.PI / 16;
    l.beam(
      [x + (Math.cos(a) * r * 1.02) / l.spanX, 0.03, z + (Math.sin(a) * r * 1.02) / l.spanZ],
      [x + (Math.cos(b) * r * 0.98) / l.spanX, 0.062, z + (Math.sin(b) * r * 0.98) / l.spanZ],
      0.006,
      '#a8a59c',
    );
  }
  catwalk(l, x, z, r * 0.74, 0.03 + h - 0.004);
  for (let i = 0; i < 8; i++)
    wbox(
      l,
      ...off(l, x, z, Math.cos(i) * r * 0.5, Math.sin(i) * r * 0.5),
      0.03 + h - 0.002,
      0.012,
      0.006,
      0.012,
      '#6e6c66',
    );
  smoke(l, x, z, 0.04 + h, 4);
}

// ---------------------------------------------------------------------------------------------

export const industryDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Power
  // -----------------------------------------------------------------------------------------
  power_plant(l) {
    site(l, 'power_plant', cinder, [0.08, 0.08, 0.94, 0.94]);
    // Weathered plank engine shed with a lean-to boiler and the big flywheel outside.
    const sx = 0.38;
    const sz = 0.42;
    boardBody(l, sx, sz, 0.34, 0.26, 0.03, 0.15, plank);
    windows4(l, sx, sz, 0.34, 0.26, 0.08, 0.036, { shutters: '#3a2f28' });
    door(l, sx, sz, 0.34, 0.26, '+z', 0.07, 0.03, 0.05, 0.1, timberDark);
    tinGable(l, sx, sz, 'x', 0.34, 0.26, 0.18, 0.08, '#4a4440', plank);
    brickBody(l, ...off(l, sx, sz, 0.24, -0.02), 0.16, 0.16, 0.03, 0.12, '#8c4a38');
    wround(l, ...off(l, sx, sz, 0.24, -0.02), 0.06, 0.06, 0.15, 0.04, '#2c2a28', 12);
    flue(l, ...off(l, sx, sz, -0.06, -0.06), 0.18, 0.12, 0.013, 4);
    flywheel(l, ...off(l, sx, sz, 0.05, 0.19), 0.03, 0.085, Math.PI / 2);
    wbox(l, ...off(l, sx, sz, 0.05, 0.19), 0.03, 0.2, 0.03, 0.05, '#2f3234');
    // Coal heap, tipping cart on rails, wood stack, crew and lamps.
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.74,
        0.34,
        0.036 + i * 0.012,
        0.18 - i * 0.026,
        0.014,
        0.16 - i * 0.022,
        tone('#26282a', 0.25),
        i * 0.5,
      );
    railLine(l, 0.56, 0.7, 0.9, 0.7);
    wagon(l, 0.72, 0.7, 0, '#2a2c2e');
    wagon(l, 0.84, 0.7, 0, '#2a2c2e');
    blockStack(l, 0.2, 0.78, 0.036, 3, 2, 2, '#8a6a48');
    workers(l, [
      [0.5, 0.62, '#6a6a70', '#3a3a3c'],
      [0.62, 0.5, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.54, 0.84, 0.16);
    lanternPost(l, 0.3, 0.12, 0.16);
    yard(l, 0.1, 0.55, 0.3, 0.7, 'ore', 4);
    shrub(l, 0.92, 0.1, 0.04);
    // Boiler fittings: steam main into the shed, safety valve dome, gauge and riveted bands.
    const [bx, bz] = off(l, sx, sz, 0.24, -0.02);
    wround(l, bx, bz, 0.016, 0.02, 0.19, 0.03, '#3a3f42', 10);
    wround(l, bx, bz, 0.006, 0.006, 0.22, 0.02, '#b08a3a', 8);
    pipe(l, [bx, 0.13, bz], [sx + 0.17 / l.spanX, 0.13, bz], 0.008, '#5a5f63');
    for (const dy of [0.06, 0.1]) wbox(l, bx, bz, dy, 0.165, 0.004, 0.165, '#3a3836');
    faceBox(l, bx, bz, 0.16, 0.16, '+z', 0.03, 0.004, 0.1, 0.018, 0.018, 0.004, '#e9e4d6');
    // Elevated feed-water tank on a timber trestle.
    for (const [dx, dz] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.16, 0.2, dx * 0.03, dz * 0.03), 0.03, 0.01, 0.16, 0.01, '#5c4630');
    for (const y of [0.08, 0.14]) wbox(l, 0.16, 0.2, y, 0.07, 0.006, 0.07, '#4a3a2a');
    wround(l, 0.16, 0.2, 0.045, 0.045, 0.19, 0.07, '#7a5a3c', 16);
    for (const y of [0.205, 0.235]) wround(l, 0.16, 0.2, 0.047, 0.047, y, 0.005, iron, 16);
    l.shape(new THREE.ConeGeometry(0.05, 0.03, 16), '#4a4440', 0.16, 0.2, 0.275);
    pipe(l, [0.16, 0.19, 0.2 + 0.045 / l.spanZ], [0.16, 0.06, 0.2 + 0.045 / l.spanZ], 0.005);
    // Roof cowls, telegraph pole bringing the line out, fence, sign and stores.
    for (const dx of [-0.1, 0.1]) cowl(l, ...off(l, sx, sz, dx, 0), 0.26);
    wround(l, 0.92, 0.56, 0.006, 0.008, 0.03, 0.3, '#5c4630', 8);
    wbox(l, 0.92, 0.56, 0.3, 0.07, 0.008, 0.008, '#5c4630', Math.PI / 2);
    l.beam([0.92, 0.31, 0.56], [sx + 0.17 / l.spanX, 0.15, sz], 0.002, '#1c1f21');
    fence(l, [
      [0.04, 0.96],
      [0.04, 0.04],
      [0.96, 0.04],
      [0.96, 0.5],
    ]);
    signboard(l, 0.84, 0.92, 0.09, 0.11, '#2f4a3a');
    drums(l, 0.6, 0.86, 4, '#2f5d8a');
    clutter(l, 0.12, 0.82, 0.4, 0.92, 4);
  },

  steam_powerhouse(l) {
    site(l, 'steam_powerhouse', cinder, [0.06, 0.06, 0.95, 0.95]);
    // Two-storey red-brick powerhouse with arched windows and twin stacks.
    const hx = 0.4;
    const hz = 0.44;
    brickBody(l, hx, hz, 0.46, 0.3, 0.03, 0.27, '#a24a35');
    hallFacade(l, hx, hz, 0.46, 0.3, 0.03, 0.27, '#a24a35', {
      bay: 0.092,
      trim: '#e2d6bc',
      skip: [['+z', 2]],
    });
    door(l, hx, hz, 0.46, 0.3, '+z', 0, 0.03, 0.07, 0.11, timberDark);
    faceBox(l, hx, hz, 0.46, 0.3, '+z', 0, 0.006, 0.15, 0.09, 0.05, 0.004, '#2a2624');
    faceBox(l, hx, hz, 0.46, 0.3, '+z', 0, 0.008, 0.155, 0.08, 0.04, 0.003, pane, 1);
    signboard(l, ...faceAt(l, hx, hz, 0.46, 0.3, '+z', 0, 0.012), 0.215, 0.16, '#2f3a44');
    shingleGable(l, hx, hz, 'x', 0.46, 0.3, 0.3, 0.11, slate, '#a24a35');
    ridgeLantern(l, hx, hz, 'x', 0.3, 0.405, '#3f464b');
    for (const dx of [-0.12, 0.12])
      stack(l, ...off(l, hx, hz, dx, -0.26), 0.44, 0.024, '#9c5640', 4);
    // Dynamo hall annexe, coal bunker with wagon, pylons carrying cable.
    brickBody(l, 0.8, 0.28, 0.2, 0.2, 0.03, 0.14, '#8f4a38');
    hallFacade(l, 0.8, 0.28, 0.2, 0.2, 0.03, 0.14, '#8f4a38', { bay: 0.066, trim: '#e2d6bc' });
    tinGable(l, 0.8, 0.28, 'z', 0.2, 0.2, 0.17, 0.06, '#4f5a60', '#8f4a38');
    cowl(l, 0.8, 0.28, 0.23);
    // Coal conveyor from the bunker up into the boiler house, feed pipes, stores and a fence.
    conveyor(l, [0.74, 0.12, 0.58], [0.6, 0.24, 0.52], 3);
    pipeRack(l, 0.66, 0.4, 0.72, 0.4, 0.12, 2);
    pipe(l, [0.66, 0.2, 0.36], [0.72, 0.2, 0.3], 0.01, '#8a6a4a');
    for (const [x, z] of [
      [0.08, 0.34],
      [0.08, 0.46],
    ] as const) {
      wround(l, x, z, 0.03, 0.03, 0.03, 0.09, '#9aa0a3', 14);
      for (const y of [0.05, 0.08, 0.11]) wround(l, x, z, 0.031, 0.031, y, 0.004, '#5a5f63', 14);
      ladder(l, x, z, 0.04, 0.12, 0.034);
    }
    fence(l, [
      [0.04, 0.96],
      [0.04, 0.04],
      [0.54, 0.04],
    ]);
    forklift(l, 0.42, 0.66, 0.3);
    clutter(l, 0.3, 0.88, 0.5, 0.95, 3);
    wbox(l, 0.78, 0.64, 0.036, 0.2, 0.08, 0.12, '#3a3836');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.78,
        0.64,
        0.116 + i * 0.008,
        0.18 - i * 0.02,
        0.012,
        0.1 - i * 0.012,
        tone('#202224', 0.25),
      );
    railLine(l, 0.5, 0.82, 0.95, 0.82, 0.036, { steel: true });
    wagon(l, 0.66, 0.82, 0, '#26282a', 0.042, '#6e6e70');
    wagon(l, 0.8, 0.82, 0, '#26282a', 0.042, '#6e6e70');
    pylon(l, 0.62, 0.16, 0.3);
    pylon(l, 0.94, 0.5, 0.3);
    l.beam(
      [0.62, 0.3 + 0.03 * 0.78 + 0.03, 0.16],
      [0.94, 0.3 + 0.03 * 0.78 + 0.03, 0.5],
      0.002,
      '#1c1f21',
    );
    workers(l, [
      [0.26, 0.74, '#6a6a70', '#3a3a3c'],
      [0.56, 0.72, '#8a4a3a', '#3a3a3c'],
      [0.68, 0.7, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.2, 0.7, 0.16);
    lanternPost(l, 0.9, 0.7, 0.16);
    yard(l, 0.06, 0.78, 0.3, 0.95, 'ore', 4);
    shrub(l, 0.92, 0.92, 0.04);
  },

  turbine_power_station(l) {
    site(l, 'turbine_power_station', '#8a8982', [0.05, 0.05, 0.95, 0.95]);
    // Concrete turbine hall with ribbed glazing, big cooling tower, steam plume.
    const hx = 0.34;
    const hz = 0.62;
    wbox(l, hx, hz, 0.03, 0.62, 0.22, 0.3, concrete);
    wbox(l, hx, hz, 0.25, 0.64, 0.02, 0.32, '#8f8c84');
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        ...off(l, hx, hz, -0.26 + i * 0.104, 0.15),
        0.1,
        0.05,
        0.1,
        0.004,
        '#cfe6f0',
        0,
        0,
        1,
      );
    windows4(l, hx, hz, 0.62, 0.3, 0.1, 0.04, { frame: '#d8dde0' });
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.26 + i * 0.104, 0), 0.16, 0.012, 0.004, 0.3, '#8f8c84');
    for (let i = 0; i < 3; i++)
      wround(l, ...off(l, hx, hz, -0.2 + i * 0.2, 0), 0.028, 0.03, 0.27, 0.05, '#a9a79f', 14);
    coolingTower(l, 0.7, 0.3, 0.55, 0.17);
    // Switchyard: transformers, insulators and lattice pylons with cable.
    for (let i = 0; i < 4; i++) {
      const x = 0.12 + i * 0.12;
      wbox(l, x, 0.2, 0.036, 0.075, 0.07, 0.06, '#7e868c');
      for (const dx of [-0.02, 0, 0.02])
        wround(l, ...off(l, x, 0.2, dx, 0), 0.006, 0.007, 0.106, 0.04, '#d8e6ea', 8);
      for (let f = 0; f < 4; f++)
        wbox(l, ...off(l, x, 0.2, -0.04 + f * 0.026, 0.034), 0.04, 0.05, 0.004, 0.012, '#5a6268');
    }
    pylon(l, 0.12, 0.08, 0.34);
    pylon(l, 0.46, 0.08, 0.34);
    l.beam(
      [0.12, 0.3 + 0.03 * 0.9 + 0.045, 0.08],
      [0.46, 0.3 + 0.03 * 0.9 + 0.045, 0.08],
      0.002,
      '#1c1f21',
    );
    for (const [x, z] of [
      [0.9, 0.62],
      [0.9, 0.8],
    ] as const)
      steelSilo(l, x, z, 0.04, 0.22);
    truck(l, 0.64, 0.9, 0, '#3f6b8a');
    workers(l, [
      [0.58, 0.46, '#e8742a', '#f2cf4a'],
      [0.24, 0.4, '#e8742a', '#f2cf4a'],
      [0.5, 0.84, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.08, 0.5, 0.3);
    floodlight(l, 0.94, 0.45, 0.3);
    floodlight(l, 0.1, 0.94, 0.26);
    shrub(l, 0.94, 0.94, 0.04);
    // Concrete frame expressed on the hall: plinth, columns, a coping, and an entrance canopy.
    wbox(l, hx, hz, 0.03, 0.635, 0.03, 0.315, '#8f8c84');
    for (const f of FACES) {
      const len = f === '+z' || f === '-z' ? 0.62 : 0.3;
      const n = Math.max(2, Math.round(len / 0.1));
      for (let i = 0; i <= n; i++)
        faceBox(
          l,
          hx,
          hz,
          0.62,
          0.3,
          f,
          -len / 2 + (i * len) / n,
          0.004,
          0.03,
          0.018,
          0.22,
          0.008,
          '#a8a59c',
        );
    }
    const [ex, ez] = faceAt(l, hx, hz, 0.62, 0.3, '+z', -0.05, 0.03);
    wbox(l, ex, ez, 0.11, 0.12, 0.01, 0.06, '#6e6c66');
    faceBox(l, hx, hz, 0.62, 0.3, '+z', -0.05, 0.003, 0.03, 0.06, 0.075, 0.004, '#3a4a55');
    // Roof plant on the turbine hall: ventilators, a gantry rail and a stair tower.
    for (let i = 0; i < 5; i++) cowl(l, ...off(l, hx, hz, -0.24 + i * 0.12, -0.09), 0.27, 0.012);
    for (const dz of [-0.13, 0.13])
      wbox(l, ...off(l, hx, hz, 0, dz), 0.27, 0.6, 0.012, 0.012, '#d8a832');
    wbox(l, ...off(l, hx, hz, 0.12, 0), 0.282, 0.03, 0.02, 0.27, '#d8a832');
    wbox(l, ...off(l, hx, hz, 0.33, 0.06), 0.03, 0.06, 0.28, 0.06, '#7e868c');
    for (let i = 0; i < 6; i++)
      faceBox(
        l,
        ...off(l, hx, hz, 0.33, 0.06),
        0.06,
        0.06,
        '+x',
        0,
        0.002,
        0.05 + i * 0.04,
        0.03,
        0.012,
        0.003,
        pane,
        1,
      );
    // Steam mains from the hall across to the tower, condensate pipes, perimeter fence.
    pipeRack(l, hx + 0.24 / l.spanX, 0.5, 0.62, 0.42, 0.2, 3, ['#c9c4b6', '#a0532f', '#4a7a9a']);
    pipe(l, [0.62, 0.21, 0.42], [0.66, 0.08, 0.42], 0.012, '#c9c4b6');
    fence(l, [
      [0.04, 0.3],
      [0.04, 0.03],
      [0.96, 0.03],
      [0.96, 0.5],
    ]);
    apron(l, 0.42, 0.84, 0.96, 0.97);
    forklift(l, 0.3, 0.9, -0.4);
    drums(l, 0.04, 0.72, 3, '#a0402f');
    signboard(l, 0.52, 0.94, 0.1, 0.12, '#24476a');
  },

  // -----------------------------------------------------------------------------------------
  // Foundry and factory
  // -----------------------------------------------------------------------------------------
  foundry(l) {
    site(l, 'foundry', '#6a625a', [0.08, 0.08, 0.94, 0.94]);
    // Open brick shed on arches with a glowing crucible, casting moulds and an anvil.
    for (const [x, z] of [
      [0.18, 0.2],
      [0.56, 0.2],
      [0.18, 0.6],
      [0.56, 0.6],
    ] as const) {
      brickBody(l, x, z, 0.07, 0.07, 0.03, 0.2, '#9a4a35');
    }
    for (const z of [0.2, 0.6]) {
      wbox(l, 0.37, z, 0.226, 0.5, 0.034, 0.08, '#8a4a38');
      wbox(l, 0.37, z, 0.26, 0.5, 0.012, 0.09, '#2c2a28');
    }
    brickBody(l, 0.18, 0.4, 0.07, 0.4, 0.03, 0.2, '#8f4430');
    tinGable(l, 0.37, 0.4, 'x', 0.55, 0.5, 0.265, 0.07, '#4a4440');
    // Furnace and crucible.
    brickBody(l, 0.34, 0.4, 0.17, 0.17, 0.03, 0.1, '#7a3a2a');
    l.shape(new THREE.CylinderGeometry(0.06, 0.05, 0.05, 16), '#3a3836', 0.34, 0.4, 0.15);
    melt(l, 0.34, 0.4, 0.197, 0.052);
    wbox(l, 0.34, 0.4, 0.13, 0.09, 0.02, 0.01, hot, 0, 0, 1);
    // Glowing channel to moulds, casting sand beds, anvil, tools.
    wbox(l, 0.5, 0.4, 0.036, 0.2, 0.01, 0.018, hot, 0, 0, 1);
    for (let i = 0; i < 4; i++) wbox(l, 0.46 + i * 0.07, 0.5, 0.036, 0.05, 0.012, 0.05, '#4a3f36');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.46 + i * 0.07,
        0.5,
        0.048,
        0.03,
        0.004,
        0.03,
        i % 2 ? hot : '#2c2c2e',
        0,
        0,
        i % 2 ? 1 : 0,
      );
    wbox(l, 0.5, 0.3, 0.036, 0.05, 0.05, 0.03, '#2c3134');
    wbox(l, 0.5, 0.3, 0.086, 0.07, 0.014, 0.03, '#3a3f42');
    wbox(l, 0.72, 0.3, 0.036, 0.1, 0.02, 0.06, '#8a6a48');
    for (let i = 0; i < 6; i++)
      wbox(l, 0.7 + i * 0.012, 0.3, 0.056, 0.01, 0.01, 0.03, '#3a3f42', i);
    flue(l, 0.18, 0.18, 0.2, 0.18, 0.02, 4);
    // Charcoal/ore piles, barrels, crew and fire glow on the floor.
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.8,
        0.7,
        0.036 + i * 0.012,
        0.14 - i * 0.024,
        0.014,
        0.12 - i * 0.02,
        tone('#26282a', 0.25),
        i * 0.7,
      );
    barrel(l, 0.62, 0.8);
    barrel(l, 0.66, 0.84);
    workers(l, [
      [0.44, 0.7, '#8a4a3a', '#3a3a3c'],
      [0.58, 0.44, '#6a6a70', '#3a3a3c'],
      [0.3, 0.8, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.94, 0.5, 0.16);
    lanternPost(l, 0.1, 0.9, 0.16);
    yard(l, 0.6, 0.55, 0.9, 0.62, 'ore', 4);
    // Brick pattern-shop and office with a lean-to roof.
    brickBody(l, 0.84, 0.16, 0.14, 0.12, 0.03, 0.12, '#93432f');
    hallFacade(l, 0.84, 0.16, 0.14, 0.12, 0.03, 0.12, '#93432f', { bay: 0.07, skip: [['+z', 0]] });
    door(l, 0.84, 0.16, 0.14, 0.12, '+z', -0.035, 0.03, 0.04, 0.08, timberDark);
    tinGable(l, 0.84, 0.16, 'x', 0.14, 0.12, 0.15, 0.04, '#4a4440', '#93432f');
    cowl(l, 0.84, 0.16, 0.19, 0.01);
    // Ridge vents on the casting shed, a ladle on its stand, sand heaps and flask stacks.
    for (const dx of [-0.15, 0, 0.15]) cowl(l, ...off(l, 0.37, 0.4, dx, 0), 0.335);
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.82, 0.42, s * 0.03, 0), 0.03, 0.008, 0.07, 0.008, iron);
    wbox(l, 0.82, 0.42, 0.1, 0.07, 0.008, 0.008, iron);
    wround(l, 0.82, 0.42, 0.026, 0.02, 0.06, 0.036, '#4a4440', 12);
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.4 + rand() * 0.1,
        0.84 + rand() * 0.08,
        0.034,
        0.04 - i * 0.004,
        0.012 + i * 0.002,
        0.03,
        tone('#c9a66b', 0.1),
        rand() * 3,
      );
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 3 - i; k++)
        wbox(
          l,
          ...off(l, 0.24, 0.84, k * 0.03 + i * 0.015, 0),
          0.034 + i * 0.022,
          0.026,
          0.02,
          0.026,
          '#5a5f63',
        );
    fence(l, [
      [0.04, 0.96],
      [0.04, 0.04],
      [0.96, 0.04],
    ]);
    drums(l, 0.74, 0.86, 3, '#a0402f');
    gasRack(l, 0.9, 0.36);
    signboard(l, 0.88, 0.94, 0.09, 0.1, '#3a2a22');
  },

  heavy_foundry(l) {
    site(l, 'heavy_foundry', '#5f5851', [0.06, 0.06, 0.95, 0.95]);
    // Gabled brick foundry with a cupola furnace, vent cap and an overhead crane hoist.
    const hx = 0.4;
    const hz = 0.44;
    brickBody(l, hx, hz, 0.5, 0.32, 0.03, 0.2, '#93432f');
    hallFacade(l, hx, hz, 0.5, 0.32, 0.03, 0.2, '#93432f', {
      bay: 0.071,
      skip: [
        ['+z', 1],
        ['+z', 2],
      ],
    });
    door(l, hx, hz, 0.5, 0.32, '+z', -0.1, 0.03, 0.09, 0.13, timberDark);
    wbox(l, ...off(l, hx, hz, -0.1, 0.162), 0.03, 0.09, 0.12, 0.004, hot, 0, 0, 1);
    shingleGable(l, hx, hz, 'x', 0.5, 0.32, 0.23, 0.11, slate, '#93432f');
    ridgeLantern(l, hx, hz, 'x', 0.36, 0.335, '#3f464b');
    // Cupola furnace: tall riveted cylinder with a spark arrester cone and a glowing tap hole.
    const [cx, cz] = off(l, hx, hz, 0.3, 0.1);
    wround(l, cx, cz, 0.05, 0.055, 0.03, 0.34, '#5a5f63', 14);
    for (let i = 1; i < 6; i++)
      wround(l, cx, cz, 0.056, 0.056, 0.03 + i * 0.056, 0.006, '#2f3436', 14);
    l.shape(new THREE.ConeGeometry(0.06, 0.07, 14), '#3a3f42', cx, cz, 0.4);
    wbox(l, ...off(l, cx, cz, 0.052, 0), 0.08, 0.02, 0.04, 0.04, hot, 0, 0, 1);
    smoke(l, cx, cz, 0.44, 4);
    // Overhead crane gantry across the yard with a chain and a ladle.
    for (const x of [0.16, 0.66]) {
      wbox(l, x, 0.8, 0.03, 0.03, 0.3, 0.03, '#d8a832');
      wbox(l, x, 0.9, 0.03, 0.03, 0.3, 0.03, '#d8a832');
    }
    wbox(l, 0.41, 0.8, 0.33, 0.58, 0.02, 0.03, '#d8a832');
    wbox(l, 0.41, 0.9, 0.33, 0.58, 0.02, 0.03, '#d8a832');
    wbox(l, 0.4, 0.85, 0.31, 0.04, 0.03, 0.18, '#3a3f42');
    l.beam([0.4, 0.31, 0.85], [0.4, 0.15, 0.85], 0.003, '#2c3134');
    wround(l, 0.4, 0.85, 0.03, 0.022, 0.12, 0.034, '#4a4440', 10);
    melt(l, 0.4, 0.85, 0.153, 0.026);
    // Cooling yard: covered shed with castings, vents, ingots, crew.
    for (const [x, z] of [
      [0.82, 0.62],
      [0.82, 0.9],
    ] as const)
      wbox(l, x, z, 0.03, 0.012, 0.14, 0.012, '#6b4a2c');
    tinGable(l, 0.82, 0.76, 'z', 0.34, 0.2, 0.17, 0.04, '#5a5f63');
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        0.82 + (i % 2 ? 0.03 : -0.03),
        0.66 + Math.floor(i / 2) * 0.07,
        0.036,
        0.05,
        0.03,
        0.03,
        tone('#4a4f54', 0.25),
      );
    stack(l, 0.1, 0.2, 0.4, 0.02, '#8f4a38', 3);
    workers(l, [
      [0.5, 0.7, '#8a4a3a', '#3a3a3c'],
      [0.3, 0.7, '#5a7a9a', '#3a3a3c'],
      [0.7, 0.54, '#e8742a', '#f2cf4a'],
    ]);
    lanternPost(l, 0.9, 0.3, 0.16);
    lanternPost(l, 0.1, 0.66, 0.16);
    yard(l, 0.8, 0.2, 0.94, 0.42, 'ore', 4);
    // Cupola charging platform with ladder, blast main into the hall, sand silo and stores.
    catwalk(l, cx, cz, 0.056, 0.26);
    ladder(l, cx, cz, 0.04, 0.27, 0.07);
    pipe(l, [cx, 0.16, cz], [hx + 0.25 / l.spanX, 0.16, cz], 0.012, '#5a5f63');
    steelSilo(l, 0.1, 0.42, 0.04, 0.2);
    ladder(l, 0.1, 0.42, 0.06, 0.26, 0.046);
    for (let i = 0; i < 4; i++) cowl(l, ...off(l, hx, hz, -0.18 + i * 0.12, 0.09), 0.3, 0.011);
    fence(l, [
      [0.04, 0.96],
      [0.04, 0.04],
      [0.96, 0.04],
    ]);
    forklift(l, 0.6, 0.66, 2.6);
    drums(l, 0.04, 0.86, 3, '#2f5d8a');
    gasRack(l, 0.24, 0.12);
    signboard(l, 0.92, 0.56, 0.09, 0.1, '#3a2a22', Math.PI / 2);
  },

  factory(l) {
    site(l, 'factory', '#7a766d', [0.05, 0.05, 0.95, 0.95]);
    // Long multi-bay brick hall with a sawtooth roof: each bay glazed on its steep face.
    const hx = 0.46;
    const hz = 0.5;
    brickBody(l, hx, hz, 0.7, 0.5, 0.03, 0.18, '#a34e38');
    hallFacade(l, hx, hz, 0.7, 0.5, 0.03, 0.18, '#a34e38', {
      bay: 0.078,
      trim: '#e0d5bb',
      skip: [
        ['+z', 1],
        ['+z', 4],
        ['+z', 6],
      ],
    });
    for (let i = 0; i < 4; i++) {
      const bx = hx - 0.26 + i * 0.173;
      // Sawtooth bay: a slate slope falling towards +x, and a vertical glazed face towards -x.
      const rise = 0.1;
      const run = 0.173;
      const slope = new THREE.BoxGeometry(Math.hypot(run, rise), 0.012, 0.52);
      slope.rotateZ(-Math.atan2(rise, run));
      l.shape(slope, '#4f5a60', bx, hz, 0.21 + rise / 2);
      for (let k = 0; k < 6; k++)
        l.shape(
          new THREE.BoxGeometry(Math.hypot(run, rise), 0.004, 0.006).rotateZ(
            -Math.atan2(rise, run),
          ),
          '#3f484d',
          bx,
          hz + (-0.22 + k * 0.088) / l.spanZ,
          0.218 + rise / 2,
        );
      const [gx, gz] = off(l, bx, hz, -run / 2, 0);
      wbox(l, gx, gz, 0.21, 0.012, rise, 0.52, '#3a3f42');
      wbox(l, ...off(l, gx, gz, 0.002, 0), 0.218, 0.01, rise - 0.016, 0.48, '#cfe6f0', 0, 0, 1);
      for (let k = 0; k <= 8; k++)
        wbox(
          l,
          ...off(l, gx, gz, 0.004, -0.24 + k * 0.06),
          0.218,
          0.01,
          rise - 0.016,
          0.004,
          '#2c3134',
        );
      wbox(l, ...off(l, gx, gz, 0.004, 0), 0.21 + rise / 2, 0.01, 0.004, 0.48, '#2c3134');
    }
    wbox(l, hx, hz, 0.19, 0.72, 0.024, 0.52, '#3a3f42');
    // Loading bays with roller doors, crates, trucks and a gantry crane yard.
    for (let i = 0; i < 3; i++)
      wbox(l, ...off(l, hx, hz, -0.2 + i * 0.2, 0.252), 0.03, 0.12, 0.1, 0.006, '#5a6268');
    truck(l, 0.4, 0.9, 0, '#c93a2a');
    truck(l, 0.72, 0.9, 0, '#3f6b8a');
    for (let i = 0; i < 6; i++)
      crate(l, 0.2 + (i % 3) * 0.05, 0.84 + Math.floor(i / 3) * 0.04, 0.036, '#8a6a48');
    for (const x of [0.12, 0.28]) stack(l, x, 0.16, 0.4 + (x > 0.2 ? 0.08 : 0), 0.02, '#8f4a38', 3);
    for (const dx of [-0.14, 0.14]) flue(l, ...off(l, hx, hz, dx, -0.1), 0.215, 0.14, 0.014, 2);
    for (const z of [0.2, 0.8]) wbox(l, 0.92, z, 0.03, 0.03, 0.26, 0.03, '#d8a832');
    wbox(l, 0.92, 0.5, 0.29, 0.03, 0.02, 0.62, '#d8a832');
    l.beam([0.92, 0.29, 0.5], [0.92, 0.12, 0.5], 0.003, '#2c3134');
    wbox(l, 0.92, 0.5, 0.06, 0.06, 0.06, 0.06, '#7a5a3a');
    workers(l, [
      [0.5, 0.82, '#5a7a9a', '#3a3a3c'],
      [0.62, 0.86, '#8a4a3a', '#3a3a3c'],
      [0.84, 0.66, '#e8742a', '#f2cf4a'],
    ]);
    lanternPost(l, 0.1, 0.9, 0.16);
    floodlight(l, 0.94, 0.9, 0.26);
    // Canopies over the loading doors, painted company name, rooftop water tank and plant.
    for (let i = 0; i < 3; i++) {
      const [px, pz] = faceAt(l, hx, hz, 0.7, 0.5, '+z', -0.2 + i * 0.2, 0.025);
      wbox(l, px, pz, 0.15, 0.14, 0.008, 0.05, '#4f5a60');
      for (const s of [-1, 1])
        l.beam(
          [px + (s * 0.06) / l.spanX, 0.15, pz],
          [px + (s * 0.06) / l.spanX, 0.13, pz - 0.02 / l.spanZ],
          0.003,
          iron,
        );
      faceBox(l, hx, hz, 0.7, 0.5, '+z', -0.2 + i * 0.2, 0.004, 0.03, 0.14, 0.006, 0.03, '#c9b04a');
    }
    faceBox(l, hx, hz, 0.7, 0.5, '+z', 0, 0.007, 0.168, 0.44, 0.024, 0.004, '#efe7d6');
    for (let i = 0; i < 9; i++)
      faceBox(
        l,
        hx,
        hz,
        0.7,
        0.5,
        '+z',
        -0.17 + i * 0.0425,
        0.009,
        0.172,
        0.026,
        0.016,
        0.003,
        '#2f3a44',
      );
    const [wx, wz] = off(l, hx, hz, 0.26, 0.12);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, wx, wz, a * 0.022, b * 0.022), 0.25, 0.006, 0.08, 0.006, iron);
    wround(l, wx, wz, 0.036, 0.036, 0.33, 0.055, '#6e777b', 14);
    l.shape(new THREE.ConeGeometry(0.04, 0.025, 14), '#4a5257', wx, wz, 0.397);
    ladder(l, wx, wz, 0.25, 0.385, 0.038);
    for (let i = 0; i < 4; i++) cowl(l, ...off(l, hx, hz, -0.26 + i * 0.173, -0.18), 0.262, 0.011);
    // Pallets at the doors, drums, gas bottles and a forklift at work.
    for (let i = 0; i < 4; i++) pallet(l, 0.18 + i * 0.07, 0.95, i % 2 ? '#8f969a' : '#c9b48a');
    forklift(l, 0.62, 0.82, 0.2);
    drums(l, 0.86, 0.08, 4, '#2f5d8a');
  },

  // -----------------------------------------------------------------------------------------
  // Steelworks (3 x 2)
  // -----------------------------------------------------------------------------------------
  steelworks(l) {
    site(l, 'steelworks', '#5a5048', [0.05, 0.08, 0.95, 0.94]);
    // Puddling furnace: brick body, arched firing door glowing, tall stack; trip hammer by a wheel.
    brickBody(l, 0.34, 0.42, 0.26, 0.24, 0.03, 0.16, '#8c4430');
    wbox(l, ...off(l, 0.34, 0.42, 0, 0.122), 0.034, 0.08, 0.06, 0.004, hot, 0, 0, 1);
    wbox(l, ...off(l, 0.34, 0.42, 0.132, 0), 0.034, 0.08, 0.004, 0.06, hot, 0, 0, 1);
    wbox(l, 0.34, 0.42, 0.19, 0.3, 0.02, 0.28, '#2c2a28');
    stack(l, ...off(l, 0.34, 0.42, -0.08, -0.06), 0.34, 0.026, '#8f4a38', 4);
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.34, 0.42, s * 0.05, 0.14), 0.036, 0.05, 0.05, 0.04, '#3a3836');
    // Trip hammer on a timber frame driven by a water wheel.
    wbox(l, 0.66, 0.5, 0.03, 0.14, 0.02, 0.1, '#6b4a2c');
    for (const dz of [-0.05, 0.05])
      wbox(l, ...off(l, 0.66, 0.5, 0, dz), 0.03, 0.012, 0.16, 0.012, '#5a3e22');
    wbox(l, 0.66, 0.5, 0.19, 0.012, 0.012, 0.11, '#5a3e22');
    l.beam([0.62, 0.17, 0.5], [0.7, 0.2, 0.5], 0.008, '#4a3220');
    wbox(l, ...off(l, 0.66, 0.5, 0.07, 0), 0.15, 0.04, 0.03, 0.03, '#2c3134');
    wbox(l, 0.7, 0.5, 0.036, 0.06, 0.04, 0.05, '#3a3f42');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.84, 0.5, 0, Math.cos(a) * 0.08),
        0.1 + Math.sin(a) * 0.08,
        0.004,
        0.02,
        0.02,
        '#7a5634',
        a,
      );
    }
    // Glowing slag heap, ingots, coke and the iron-wheeled cart.
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.18,
        0.78,
        0.036 + i * 0.012,
        0.18 - i * 0.024,
        0.014,
        0.14 - i * 0.02,
        tone(i > 3 ? '#e06a2a' : '#26282a', 0.25),
        i * 0.7,
        0,
        i > 3 ? 1 : 0,
      );
    railLine(l, 0.4, 0.78, 0.95, 0.78, 0.036, { steel: true });
    wagon(l, 0.6, 0.78, 0, '#2a2c2e', 0.042, '#6e6e70');
    wagon(l, 0.74, 0.78, 0, '#2a2c2e', 0.042, '#6e6e70');
    blockStack(l, 0.5, 0.66, 0.036, 4, 1, 2, '#6a6f74');
    workers(l, [
      [0.5, 0.58, '#8a4a3a', '#3a3a3c'],
      [0.56, 0.34, '#6a6a70', '#3a3a3c'],
      [0.24, 0.62, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.94, 0.3, 0.16);
    lanternPost(l, 0.08, 0.9, 0.16);
    yard(l, 0.06, 0.18, 0.18, 0.55, 'ore', 4);
    // Ironmaster's office in brick with a slate roof and bell.
    brickBody(l, 0.74, 0.17, 0.22, 0.12, 0.03, 0.13, '#93432f');
    hallFacade(l, 0.74, 0.17, 0.22, 0.12, 0.03, 0.13, '#93432f', { bay: 0.073, skip: [['+z', 1]] });
    door(l, 0.74, 0.17, 0.22, 0.12, '+z', 0, 0.03, 0.045, 0.085, timberDark);
    shingleGable(l, 0.74, 0.17, 'x', 0.22, 0.12, 0.16, 0.06, slate, '#93432f');
    wbox(l, 0.74, 0.17, 0.22, 0.02, 0.03, 0.02, '#e2d6bc');
    wround(l, 0.74, 0.17, 0.006, 0.01, 0.228, 0.012, '#b08a3a', 8);
    // Timber forge shed sheltering the trip hammer.
    for (const [dx, dz] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.64, 0.5, dx * 0.1, dz * 0.08), 0.03, 0.014, 0.24, 0.014, '#5a3e22');
    tinGable(l, 0.64, 0.5, 'x', 0.22, 0.18, 0.27, 0.05, '#4a4440');
    cowl(l, 0.64, 0.5, 0.32, 0.012);
    // Furnace charging ramp, coke heap, bar stacks, fence, sign and stores.
    l.beam([0.2, 0.034, 0.3], [0.28, 0.16, 0.38], 0.03, '#6b4a2c');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.42,
        0.18,
        0.036 + i * 0.012,
        0.14 - i * 0.024,
        0.014,
        0.1 - i * 0.016,
        tone('#3a3532', 0.25),
        i * 0.7,
      );
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 6; k++)
        wbox(
          l,
          ...off(l, 0.36, 0.66, 0, k * 0.012),
          0.036 + i * 0.01,
          0.14,
          0.008,
          0.008,
          '#5a5f63',
        );
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.04],
      [0.97, 0.04],
      [0.97, 0.6],
    ]);
    signboard(l, 0.9, 0.92, 0.09, 0.12, '#3a2a22');
    clutter(l, 0.78, 0.6, 0.94, 0.7, 3);
  },

  bessemer_steelworks(l) {
    site(l, 'bessemer_steelworks', '#58504a', [0.04, 0.06, 0.96, 0.94]);
    // Steel lattice tower carrying a pear-shaped Bessemer converter in a spray of sparks.
    const tx = 0.3;
    const tz = 0.36;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [tx + (a * 0.075) / l.spanX, 0.03, tz + (b * 0.075) / l.spanZ],
        [tx + (a * 0.06) / l.spanX, 0.36, tz + (b * 0.06) / l.spanZ],
        0.007,
        '#7a4a30',
      );
    for (let k = 1; k < 7; k++) {
      const y = 0.03 + k * 0.05;
      wbox(l, tx, tz, y, 0.15 - k * 0.003, 0.005, 0.15 - k * 0.003, '#8a5a3c');
      l.beam(
        [tx - 0.07 / l.spanX, y, tz - 0.07 / l.spanZ],
        [tx + 0.07 / l.spanX, y + 0.05, tz + 0.07 / l.spanZ],
        0.003,
        '#6a4228',
      );
    }
    const conv = new THREE.SphereGeometry(0.07, 16, 12);
    conv.scale(1, 1.35, 1);
    l.shape(conv, '#7a4a30', tx, tz, 0.44);
    wround(l, tx, tz, 0.028, 0.05, 0.5, 0.07, '#7a4a30', 14);
    melt(l, tx, tz, 0.572, 0.028);
    wbox(l, tx, tz, 0.59, 0.03, 0.06, 0.03, hot, 0, 0, 1);
    for (let i = 0; i < 20; i++)
      wbox(
        l,
        tx + ((rand() - 0.5) * 0.4) / l.spanX,
        tz + ((rand() - 0.5) * 0.4) / l.spanZ,
        0.5 + rand() * 0.28,
        0.008,
        0.008,
        0.008,
        '#ffb347',
        rand() * 3,
        0,
        1,
      );
    // Ladle car on rails, ingot moulds and a pouring gantry.
    railLine(l, 0.08, 0.62, 0.95, 0.62, 0.036, { steel: true });
    wagon(l, 0.4, 0.62, 0, '#5a5f63', 0.042, '#4a4f54');
    wround(l, 0.6, 0.62, 0.04, 0.034, 0.05, 0.05, '#4a4440', 12);
    melt(l, 0.6, 0.62, 0.1, 0.036);
    for (let i = 0; i < 5; i++) wbox(l, 0.18 + i * 0.07, 0.72, 0.036, 0.05, 0.034, 0.04, '#2c2c2e');
    // Rolling-mill shed with glowing windows, converter hall, stacks and lights.
    brickBody(l, 0.72, 0.32, 0.4, 0.26, 0.03, 0.18, '#8c4430');
    hallFacade(l, 0.72, 0.32, 0.4, 0.26, 0.03, 0.18, '#8c4430', { bay: 0.08 });
    tinGable(l, 0.72, 0.32, 'x', 0.4, 0.26, 0.21, 0.09, '#4a4f54', '#8c4430');
    ridgeLantern(l, 0.72, 0.32, 'x', 0.28, 0.3, '#3f464b');
    for (const dx of [-0.12, 0.12])
      stack(l, ...off(l, 0.72, 0.32, dx, -0.1), 0.46, 0.022, '#8f4a38', 3);
    conveyor(l, [0.52, 0.036, 0.42], [0.58, 0.14, 0.34], 3);
    workers(l, [
      [0.26, 0.58, '#e8742a', '#f2cf4a'],
      [0.5, 0.7, '#6a6a70', '#3a3a3c'],
      [0.76, 0.58, '#8a4a3a', '#3a3a3c'],
    ]);
    floodlight(l, 0.06, 0.8, 0.28);
    floodlight(l, 0.94, 0.8, 0.28);
    lanternPost(l, 0.5, 0.9, 0.16);
    yard(l, 0.06, 0.84, 0.4, 0.95, 'ore', 4);
    // Fume hood over the converter mouth, duct to a riveted steel stack, operator's pulpit.
    wbox(l, tx, tz, 0.66, 0.1, 0.03, 0.1, '#4a4f54');
    l.beam([tx, 0.68, tz], [0.1, 0.6, 0.18], 0.03, '#4a4f54');
    wround(l, 0.1, 0.18, 0.026, 0.03, 0.03, 0.66, '#5a5f63', 14);
    for (let i = 1; i < 6; i++)
      wround(l, 0.1, 0.18, 0.031, 0.031, 0.03 + i * 0.11, 0.005, iron, 14);
    ladder(l, 0.1, 0.18, 0.05, 0.66, 0.03);
    wbox(l, 0.1, 0.18, 0.68, 0.008, 0.008, 0.008, '#ff3b2a', 0, 0, 1);
    const [px, pz] = off(l, tx, tz, 0.11, 0.06);
    wbox(l, px, pz, 0.2, 0.07, 0.06, 0.06, '#5a5f63');
    for (const f of ['+z', '+x'] as const)
      faceBox(l, px, pz, 0.07, 0.06, f, 0, 0.002, 0.22, 0.05, 0.03, 0.003, pane, 1);
    wbox(l, px, pz, 0.26, 0.08, 0.008, 0.07, '#3a3f42');
    ladder(l, tx, tz, 0.04, 0.36, 0.08);
    // Pipe rack to the mill, ingot stacks, a fence along the back and the works sign.
    pipeRack(l, 0.42, 0.5, 0.92, 0.5, 0.16, 3);
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 3 - i; k++)
        wbox(
          l,
          ...off(l, 0.86, 0.9, k * 0.034 + i * 0.017, 0),
          0.034 + i * 0.016,
          0.03,
          0.016,
          0.03,
          '#6a6f74',
        );
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.6],
    ]);
    forklift(l, 0.68, 0.84, 0);
    signboard(l, 0.6, 0.95, 0.09, 0.12, '#3a2a22');
    gasRack(l, 0.48, 0.12);
  },

  integrated_steel_mill(l) {
    site(l, 'integrated_steel_mill', '#524b46', [0.03, 0.05, 0.97, 0.95]);
    // Blast furnace stack with four Cowper stoves, big pipework and a great mill hall.
    const bx = 0.3;
    const bz = 0.32;
    wround(l, bx, bz, 0.05, 0.085, 0.03, 0.4, '#6a4a3a', 18);
    wround(l, bx, bz, 0.03, 0.05, 0.43, 0.3, '#5a3e30', 18);
    wround(l, bx, bz, 0.04, 0.03, 0.73, 0.05, '#3a2c24', 18);
    for (let i = 1; i < 6; i++)
      wround(l, bx, bz, 0.09 - i * 0.01, 0.09 - i * 0.01, 0.03 + i * 0.1, 0.006, '#2c2a28', 18);
    wbox(l, ...off(l, bx, bz, 0.085, 0.0), 0.12, 0.03, 0.04, 0.04, hot, 0, 0, 1);
    smoke(l, bx, bz, 0.8, 4);
    for (let i = 0; i < 4; i++) {
      const [sx, sz] = off(l, bx, bz, 0.17 + (i % 2) * 0.11, -0.05 + Math.floor(i / 2) * 0.12);
      wround(l, sx, sz, 0.04, 0.042, 0.03, 0.5 - i * 0.02, tone('#9a8a78', 0.1), 14);
      l.shape(
        new THREE.SphereGeometry(0.041, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        '#8a7a6a',
        sx,
        sz,
        0.53 - i * 0.02,
      );
      l.beam([sx, 0.38, sz], [bx, 0.38 + (i % 2) * 0.02, bz], 0.012, '#4a4440');
    }
    l.beam([bx, 0.8, bz], [bx + 0.2 / l.spanX, 0.5, bz + 0.1 / l.spanZ], 0.016, '#3a3f42');
    // Mill hall with arched glowing windows and a sawtooth-ish clerestory.
    brickBody(l, 0.72, 0.34, 0.5, 0.3, 0.03, 0.2, '#7e3d2c');
    hallFacade(l, 0.72, 0.34, 0.5, 0.3, 0.03, 0.2, '#7e3d2c', { bay: 0.083 });
    tinGable(l, 0.72, 0.34, 'x', 0.5, 0.3, 0.23, 0.1, '#3f464b', '#7e3d2c');
    ridgeLantern(l, 0.72, 0.34, 'x', 0.38, 0.33, '#2f3438');
    for (const dx of [-0.16, 0, 0.16])
      stack(l, ...off(l, 0.72, 0.34, dx, -0.12), 0.44 + dx, 0.02, '#7e3d2c', 3);
    // Torpedo cars carrying molten iron, tracks, piping and floodlights.
    railLine(l, 0.04, 0.68, 0.96, 0.68, 0.036, { steel: true });
    railLine(l, 0.04, 0.76, 0.96, 0.76, 0.036, { steel: true });
    for (let i = 0; i < 3; i++) {
      const cx = 0.28 + i * 0.22;
      wbox(l, cx, 0.68, 0.042, 0.17, 0.03, 0.05, '#2c3134');
      const tp = new THREE.CapsuleGeometry(0.036, 0.1, 6, 14);
      tp.rotateZ(Math.PI / 2);
      l.shape(tp, '#8a5a44', cx, 0.68, 0.1);
      wbox(l, cx, 0.68, 0.132, 0.03, 0.006, 0.03, hot, 0, 0, 1);
    }
    wagon(l, 0.4, 0.76, 0, '#6a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.56, 0.76, 0, null, 0.042, '#6e6e70');
    for (let i = 0; i < 5; i++)
      l.beam(
        [0.4 + i * 0.1, 0.46 - i * 0.01, 0.52],
        [0.44 + i * 0.1, 0.46 - i * 0.01, 0.52],
        0.01,
        '#4a4f54',
      );
    l.beam([0.22, 0.36, 0.2], [0.58, 0.36, 0.52], 0.01, '#4a4f54');
    workers(l, [
      [0.46, 0.84, '#e8742a', '#f2cf4a'],
      [0.2, 0.84, '#e8742a', '#f2cf4a'],
      [0.8, 0.6, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.06, 0.58, 0.32);
    floodlight(l, 0.94, 0.58, 0.32);
    floodlight(l, 0.5, 0.94, 0.28);
    yard(l, 0.06, 0.84, 0.3, 0.95, 'ore', 4);
    // Furnace platforms and ladders, top gas downcomer into a dust catcher.
    catwalk(l, bx, bz, 0.085, 0.43);
    catwalk(l, bx, bz, 0.05, 0.72);
    ladder(l, bx, bz, 0.04, 0.73, 0.1);
    const [dx, dz] = [0.08, 0.14];
    wround(l, dx, dz, 0.042, 0.042, 0.18, 0.18, '#7a7f84', 16);
    l.shape(new THREE.ConeGeometry(0.042, 0.1, 16).rotateX(Math.PI), '#6a6f74', dx, dz, 0.13);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, dx, dz, a * 0.03, b * 0.03), 0.03, 0.008, 0.16, 0.008, iron);
    l.beam([bx, 0.76, bz], [dx, 0.4, dz], 0.022, '#5a5f63');
    wround(l, dx, dz, 0.01, 0.03, 0.36, 0.04, '#6a6f74', 12);
    // Inclined skip hoist charging the furnace top, with its skip car.
    for (const s of [-1, 1])
      l.beam(
        [0.08, 0.034, 0.5 + (s * 0.02) / l.spanZ],
        [bx, 0.74, bz + (s * 0.02) / l.spanZ],
        0.01,
        '#4d5559',
      );
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      wbox(
        l,
        0.08 + (bx - 0.08) * t,
        0.5 + (bz - 0.5) * t,
        0.034 + 0.7 * t,
        0.006,
        0.006,
        0.05,
        '#4d5559',
      );
      if (i % 2 === 0)
        wbox(
          l,
          0.08 + (bx - 0.08) * t,
          0.5 + (bz - 0.5) * t,
          0.03,
          0.008,
          0.004 + 0.7 * t,
          0.008,
          '#4d5559',
        );
    }
    wbox(l, 0.08 + (bx - 0.08) * 0.4, 0.5 + (bz - 0.5) * 0.4, 0.31, 0.04, 0.026, 0.034, '#2c2a28');
    // Ore and coke bunkers beside the hoist, fence, sign, works traffic.
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.08 + i * 0.06, 0.58, 0.03, 0.06, 0.06, 0.05, '#5a5f63');
      wbox(l, 0.08 + i * 0.06, 0.58, 0.09, 0.05, 0.008, 0.04, i === 1 ? '#2a2c2e' : '#7a4a3a');
    }
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.56],
    ]);
    forklift(l, 0.72, 0.88, 0.4);
    signboard(l, 0.84, 0.95, 0.09, 0.12, '#2f3a44');
    drums(l, 0.62, 0.86, 3, '#a0402f');
  },

  // -----------------------------------------------------------------------------------------
  // Coal
  // -----------------------------------------------------------------------------------------
  coal_mine(l) {
    site(l, 'coal_mine', '#3f3d3b', [0.08, 0.28, 0.94, 0.94]);
    const rock = '#6a6660';
    rockMass(l, 0.05, 0.05, 0.62, 0.3, 0.036, 0.09, rock, grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.4, 0.16, 0.126, 0.06, shade(rock, 0.95), grass, 0.06);
    portal(l, 0.3, 0.3, 0.14, 0.11, 0.036, '+z', '#5c4630');
    // Coal tipple: timber trestle with a chute into a wagon, sorting screens and hand carts.
    for (const [x, z] of [
      [0.6, 0.4],
      [0.74, 0.4],
      [0.6, 0.6],
      [0.74, 0.6],
    ] as const)
      wbox(l, x, z, 0.036, 0.016, 0.22, 0.016, '#5c4630');
    wbox(l, 0.67, 0.5, 0.25, 0.2, 0.016, 0.26, '#6b5a48');
    l.beam([0.6, 0.25, 0.4], [0.66, 0.1, 0.74], 0.02, '#4a3a2a');
    l.beam([0.74, 0.25, 0.4], [0.8, 0.1, 0.74], 0.02, '#4a3a2a');
    wbox(l, 0.67, 0.5, 0.266, 0.17, 0.02, 0.22, '#1d1f21');
    railLine(l, 0.3, 0.3, 0.3, 0.96);
    railLine(l, 0.72, 0.62, 0.72, 0.96);
    wagon(l, 0.3, 0.5, Math.PI / 2, '#1d1f21');
    wagon(l, 0.3, 0.68, Math.PI / 2, '#1d1f21');
    wagon(l, 0.72, 0.84, Math.PI / 2, '#1d1f21');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.9,
        0.7,
        0.036 + i * 0.014,
        0.2 - i * 0.034,
        0.016,
        0.18 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    for (const [x, z] of [
      [0.46, 0.5],
      [0.46, 0.62],
    ] as const) {
      wbox(l, x, z, 0.036, 0.09, 0.012, 0.07, '#6b4a2c', 0.3);
      for (let i = 0; i < 5; i++)
        wbox(l, x - 0.03 + i * 0.016, z, 0.05, 0.004, 0.012, 0.07, '#8a8f94');
    }
    boardBody(l, 0.16, 0.74, 0.2, 0.16, 0.03, 0.1, '#7a6a52');
    windows4(l, 0.16, 0.74, 0.2, 0.16, 0.055, 0.032, { shutters: '#3a2f28' });
    door(l, 0.16, 0.74, 0.2, 0.16, '+x', 0, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, 0.16, 0.74, 'z', 0.16, 0.2, 0.13, 0.07, '#4a4440', '#7a6a52');
    workers(l, [
      [0.42, 0.42, '#5a5f63', '#3a3a3c'],
      [0.5, 0.82, '#6a6a70', '#3a3a3c'],
      [0.84, 0.52, '#8a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.2, 0.4, 0.14);
    lanternPost(l, 0.88, 0.9, 0.14);
    shrub(l, 0.92, 0.1, 0.04);
    // Plank screening house roofed over the tipple, with a hoist pulley on the gable.
    tinGable(l, 0.67, 0.5, 'z', 0.24, 0.18, 0.286, 0.06, '#4a4440');
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.67, 0.5, s * 0.075, 0), 0.25, 0.006, 0.04, 0.2, '#6b5a48');
    windingWheel(l, ...off(l, 0.67, 0.5, 0, -0.13), 0.33, 0.022, Math.PI / 2);
    // Ventilation fan house: small brick engine house and a flared evasé chimney.
    brickBody(l, 0.88, 0.3, 0.1, 0.1, 0.03, 0.1, '#8c4a38');
    hallFacade(l, 0.88, 0.3, 0.1, 0.1, 0.03, 0.1, '#8c4a38', { bay: 0.05 });
    tinGable(l, 0.88, 0.3, 'z', 0.1, 0.1, 0.13, 0.035, '#4a4440', '#8c4a38');
    wround(l, ...off(l, 0.88, 0.3, 0, 0.09), 0.036, 0.02, 0.03, 0.2, '#6a4a3a', 12);
    wround(l, ...off(l, 0.88, 0.3, 0, 0.09), 0.037, 0.037, 0.22, 0.008, iron, 12);
    // Pit-prop log stacks, a fence round the workings and the colliery sign.
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 4 - i; k++) {
        const log = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8).rotateZ(Math.PI / 2);
        l.shape(
          log,
          tone('#8a6a48', 0.12),
          ...off(l, 0.42, 0.88, 0, k * 0.017 + i * 0.0085),
          0.038 + i * 0.015,
        );
      }
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.5],
    ]);
    signboard(l, 0.56, 0.95, 0.09, 0.1, '#2a2c2e');
    drums(l, 0.04, 0.4, 2, '#a0402f');
  },

  colliery_headframe(l) {
    site(l, 'colliery_headframe', '#3b3937', [0.06, 0.2, 0.95, 0.95]);
    // Steel lattice pithead gear with twin sheave wheels, a brick winding house and chimney.
    const hx = 0.58;
    const hz = 0.28;
    const top = 0.62;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [hx + (a * 0.1) / l.spanX, 0.036, hz + (b * 0.1) / l.spanZ],
        [hx + (a * 0.02) / l.spanX, top, hz + (b * 0.02) / l.spanZ],
        0.008,
        '#4d5559',
      );
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const;
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      const t2 = Math.min(1, t + 1 / 9);
      const r = 0.1 - 0.08 * t;
      const r2 = 0.1 - 0.08 * t2;
      const y = 0.036 + (top - 0.036) * t;
      const y2 = 0.036 + (top - 0.036) * t2;
      for (let c = 0; c < 4; c++) {
        const [a, b] = corners[c]!;
        const [a2, b2] = corners[(c + 1) % 4]!;
        l.beam(
          [hx + (a * r) / l.spanX, y, hz + (b * r) / l.spanZ],
          [hx + (a2 * r) / l.spanX, y, hz + (b2 * r) / l.spanZ],
          0.004,
          '#566066',
        );
        l.beam(
          [hx + (a * r) / l.spanX, y, hz + (b * r) / l.spanZ],
          [hx + (a2 * r2) / l.spanX, y2, hz + (b2 * r2) / l.spanZ],
          0.003,
          '#4a5257',
        );
      }
    }
    wbox(l, hx, hz, top, 0.1, 0.02, 0.1, '#d8a832');
    for (const dx of [-0.03, 0.03]) windingWheel(l, ...off(l, hx, hz, 0, dx), top + 0.05, 0.04, 0);
    l.beam([hx, top, hz], [hx, 0.06, hz], 0.002, '#1c1f21');
    brickBody(l, 0.28, 0.46, 0.3, 0.22, 0.03, 0.14, '#9a4a35');
    hallFacade(l, 0.28, 0.46, 0.3, 0.22, 0.03, 0.14, '#9a4a35', {
      bay: 0.1,
      trim: '#e9dfc9',
      skip: [['+z', 1]],
    });
    door(l, 0.28, 0.46, 0.3, 0.22, '+z', 0, 0.03, 0.05, 0.095, timberDark);
    shingleGable(l, 0.28, 0.46, 'x', 0.3, 0.22, 0.17, 0.09, slate, '#9a4a35');
    ridgeLantern(l, 0.28, 0.46, 'x', 0.16, 0.255, '#3f464b');
    stack(l, ...off(l, 0.28, 0.46, -0.1, -0.06), 0.42, 0.02, '#9c5640', 4);
    l.beam(
      [hx - 0.05 / l.spanX, top + 0.02, hz + 0.03 / l.spanZ],
      [0.3, 0.17, 0.46],
      0.002,
      '#2c3134',
    );
    // Coal bunker pouring into wagons on steel rails, coal stocks and crew.
    wbox(l, 0.74, 0.62, 0.036, 0.22, 0.14, 0.14, '#4a4846');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.74,
        0.62,
        0.176 + i * 0.01,
        0.2 - i * 0.04,
        0.01,
        0.12 - i * 0.03,
        tone('#1c1e20', 0.3),
      );
    railLine(l, 0.05, 0.84, 0.95, 0.84, 0.036, { steel: true });
    wagon(l, 0.4, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.56, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.72, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.16,
        0.72,
        0.036 + i * 0.014,
        0.22 - i * 0.04,
        0.016,
        0.18 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    workers(l, [
      [0.46, 0.68, '#5a5f63', '#3a3a3c'],
      [0.62, 0.74, '#6a6a70', '#3a3a3c'],
      [0.36, 0.66, '#8a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.4, 0.16);
    lanternPost(l, 0.9, 0.4, 0.16);
    yard(l, 0.6, 0.4, 0.9, 0.5, 'ore', 3);
    // Shaft collar: the cage at bank with its gate, a banksman's hut and the landing deck.
    wbox(l, hx, hz, 0.03, 0.12, 0.02, 0.12, '#5a5f63');
    wbox(l, hx, hz, 0.05, 0.05, 0.08, 0.05, '#3a3f42');
    faceBox(l, hx, hz, 0.05, 0.05, '+z', 0, 0.002, 0.055, 0.04, 0.06, 0.003, '#d8a832');
    wbox(l, hx, hz, 0.13, 0.056, 0.006, 0.056, '#2c3134');
    boardBody(l, ...off(l, hx, hz, 0.1, 0.1), 0.05, 0.05, 0.03, 0.07, '#6b5a48');
    faceBox(
      l,
      ...off(l, hx, hz, 0.1, 0.1),
      0.05,
      0.05,
      '+z',
      0,
      0.003,
      0.06,
      0.026,
      0.02,
      0.003,
      pane,
      1,
    );
    wbox(l, ...off(l, hx, hz, 0.1, 0.1), 0.1, 0.064, 0.008, 0.064, '#3a3836');
    // Lamp room and pithead baths: a low brick range with a roof lantern.
    brickBody(l, 0.86, 0.16, 0.16, 0.1, 0.03, 0.1, '#93432f');
    hallFacade(l, 0.86, 0.16, 0.16, 0.1, 0.03, 0.1, '#93432f', { bay: 0.054, skip: [['+z', 1]] });
    door(l, 0.86, 0.16, 0.16, 0.1, '+z', 0, 0.03, 0.035, 0.07, timberDark);
    tinGable(l, 0.86, 0.16, 'x', 0.16, 0.1, 0.13, 0.035, '#4a4440', '#93432f');
    cowl(l, 0.86, 0.16, 0.165, 0.009);
    // Pit-prop stacks, fence, sign, stores.
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 4 - i; k++) {
        const log = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8).rotateX(Math.PI / 2);
        l.shape(
          log,
          tone('#8a6a48', 0.12),
          ...off(l, 0.08, 0.56, k * 0.017 + i * 0.0085, 0),
          0.038 + i * 0.015,
        );
      }
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.6],
    ]);
    signboard(l, 0.88, 0.95, 0.09, 0.1, '#2a2c2e');
    gasRack(l, 0.46, 0.94);
  },

  deep_shaft_colliery(l) {
    site(l, 'deep_shaft_colliery', '#363432', [0.05, 0.18, 0.96, 0.96]);
    // Enclosed headgear tower clad in dark sheet with a pyramid cap and lit slit windows.
    const hx = 0.62;
    const hz = 0.26;
    wbox(l, hx, hz, 0.03, 0.2, 0.5, 0.2, '#3a3f43');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, 0, 0.102), 0.1 + i * 0.07, 0.03, 0.04, 0.004, '#f2c766', 0, 0, 1);
    windows4(l, hx, hz, 0.2, 0.2, 0.3, 0.036, { frame: '#586067' });
    for (let i = 0; i < 12; i++)
      wbox(l, ...off(l, hx, hz, -0.095 + i * 0.0173, 0.103), 0.03, 0.002, 0.48, 0.003, '#2a2e31');
    const cap = new THREE.ConeGeometry(0.16, 0.14, 4);
    cap.rotateY(Math.PI / 4);
    l.shape(cap, '#2f3438', hx, hz, 0.6);
    wbox(l, hx, hz, 0.67, 0.012, 0.1, 0.012, '#1c1f21');
    // Washery hall, inclined conveyors and three coal silos.
    brickBody(l, 0.28, 0.5, 0.34, 0.26, 0.03, 0.18, '#7a4a38');
    hallFacade(l, 0.28, 0.5, 0.34, 0.26, 0.03, 0.18, '#7a4a38', { bay: 0.085, trim: '#cfc3ab' });
    tinGable(l, 0.28, 0.5, 'x', 0.34, 0.26, 0.21, 0.09, '#3f464b', '#7a4a38');
    ridgeLantern(l, 0.28, 0.5, 'x', 0.22, 0.295, '#2f3438');
    conveyor(l, [0.55, 0.3, 0.3], [0.38, 0.22, 0.46], 3);
    conveyor(l, [0.4, 0.2, 0.62], [0.72, 0.34, 0.7], 5);
    for (const [x, z, h] of [
      [0.78, 0.5, 0.34],
      [0.86, 0.66, 0.3],
      [0.74, 0.8, 0.26],
    ] as const) {
      steelSilo(l, x, z, 0.05, h);
    }
    railLine(l, 0.05, 0.9, 0.95, 0.9, 0.036, { steel: true });
    wagon(l, 0.3, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.46, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.62, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    truck(l, 0.2, 0.72, 0, '#3a3f43');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.12,
        0.38,
        0.036 + i * 0.014,
        0.2 - i * 0.04,
        0.016,
        0.16 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    stack(l, ...off(l, 0.28, 0.5, -0.12, -0.08), 0.52, 0.024, '#586067', 3);
    workers(l, [
      [0.5, 0.76, '#e8742a', '#f2cf4a'],
      [0.4, 0.8, '#e8742a', '#f2cf4a'],
      [0.56, 0.5, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.08, 0.3, 0.3);
    floodlight(l, 0.94, 0.4, 0.3);
    floodlight(l, 0.08, 0.94, 0.26);
    // Tower: plinth, zig-zag escape stair, louvred winder room, aviation light.
    wbox(l, hx, hz, 0.03, 0.23, 0.03, 0.23, '#6e6c66');
    const [ex, ez] = off(l, hx, hz, -0.125, 0);
    for (let i = 0; i < 6; i++) {
      const y = 0.06 + i * 0.075;
      wbox(l, ex, ez, y, 0.04, 0.005, 0.12, '#4d5559');
      l.beam(
        [ex, y, ez + ((i % 2 ? 1 : -1) * 0.05) / l.spanZ],
        [ex, y + 0.075, ez - ((i % 2 ? 1 : -1) * 0.05) / l.spanZ],
        0.012,
        '#d8a832',
      );
    }
    wbox(l, ex, ez, 0.03, 0.006, 0.5, 0.006, '#4d5559');
    for (const f of FACES)
      for (let i = 0; i < 5; i++)
        faceBox(l, hx, hz, 0.2, 0.2, f, 0, 0.003, 0.46 + i * 0.012, 0.16, 0.004, 0.006, '#22272a');
    wbox(l, hx, hz, 0.676, 0.008, 0.008, 0.008, '#ff3b2a', 0, 0, 1);
    // Control room with a long window band, a concrete ventilation fan drift, fencing.
    wbox(l, 0.86, 0.14, 0.03, 0.16, 0.08, 0.1, '#c9c4b6');
    faceBox(l, 0.86, 0.14, 0.16, 0.1, '+z', 0, 0.002, 0.06, 0.14, 0.025, 0.003, pane, 1);
    faceBox(l, 0.86, 0.14, 0.16, 0.1, '-x', 0, 0.002, 0.06, 0.08, 0.025, 0.003, pane, 1);
    wbox(l, 0.86, 0.14, 0.11, 0.17, 0.01, 0.11, '#5a5f63');
    for (let i = 0; i < 3; i++) cowl(l, ...off(l, 0.86, 0.14, -0.05 + i * 0.05, 0), 0.12, 0.009);
    wbox(l, 0.3, 0.14, 0.03, 0.12, 0.05, 0.08, '#a8a59c');
    wround(l, ...off(l, 0.3, 0.14, -0.07, 0), 0.04, 0.022, 0.03, 0.16, '#a8a59c', 14);
    fence(l, [
      [0.03, 0.96],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.3],
    ]);
    forklift(l, 0.56, 0.66, -0.4);
    signboard(l, 0.88, 0.96, 0.09, 0.1, '#24476a');
  },
};
