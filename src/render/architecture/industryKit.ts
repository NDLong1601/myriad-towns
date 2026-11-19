import * as THREE from 'three';
import {
  barrel,
  crate,
  meadow,
  off,
  person,
  rand,
  reseed,
  shade,
  tone,
  wbox,
  wround,
} from './diorama';
import { smoke } from './dioramaProps';
import { type Lot } from './lot';

// Shared detail kit for the industry dioramas (Groups 2A and 2B).

export const grass = '#79a24a';
export const timberDark = '#3d2a19';
export const plank = '#6b5a48';
export const slate = '#4d5a66';
export const concrete = '#b9b6ae';
export const cinder = '#5d5750';
export const hot = '#ff8a2a';

/** Cinder-and-grass ground with a worn floor patch. */
export function site(
  l: Lot,
  seed: string,
  floor: string,
  patch: [number, number, number, number],
): void {
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

export type Face = '+z' | '-z' | '+x' | '-x';
export const FACES: readonly Face[] = ['+z', '-z', '+x', '-x'];
export const pane = '#f2c766';
export const iron = '#2c3134';
export const hat = '#f2cf4a';

/** Lot position on a body face: `along` runs along the face, `out` away from the wall. */
export function faceAt(
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
export function faceBox(
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
export function millWindow(
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
export function hallFacade(
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
export function ridgeLantern(
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
export function cowl(l: Lot, x: number, z: number, y: number, r = 0.014): void {
  wround(l, x, z, r * 0.6, r * 0.7, y, r * 1.6, '#6e777b', 8);
  wround(l, x, z, r * 0.2, r * 1.3, y + r * 1.6, r * 0.8, '#4f585c', 8);
}

/** Simple rung ladder on the +z side of a point (rails plus rungs), from y0 to y1. */
export function ladder(l: Lot, x: number, z: number, y0: number, y1: number, out = 0): void {
  const [px, pz] = off(l, x, z, 0, out);
  for (const s of [-1, 1])
    wbox(l, ...off(l, px, pz, s * 0.008, 0), y0, 0.003, y1 - y0, 0.003, iron);
  for (let y = y0 + 0.012; y < y1; y += 0.016) wbox(l, px, pz, y, 0.016, 0.0025, 0.003, iron);
}

/** Railed walkway ring around a cylinder at height y. */
export function catwalk(l: Lot, x: number, z: number, r: number, y: number): void {
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
export function pipe(
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
export function pipeRack(
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
export function fence(l: Lot, pts: readonly (readonly [number, number])[], h = 0.05): void {
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
export function drums(l: Lot, x: number, z: number, n: number, color = '#2f5d8a'): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, (i % 3) * 0.022, Math.floor(i / 3) * 0.022);
    wround(l, px, pz, 0.01, 0.01, 0.03, 0.03, tone(color, 0.15), 10);
    wround(l, px, pz, 0.0105, 0.0105, 0.04, 0.003, shade(color, 0.7), 10);
    wround(l, px, pz, 0.0105, 0.0105, 0.05, 0.003, shade(color, 0.7), 10);
  }
}

/** Wooden pallet stacked with sacks or boxed goods. */
export function pallet(l: Lot, x: number, z: number, load = '#c9b48a', ry = 0): void {
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
export function forklift(l: Lot, x: number, z: number, ry: number, color = '#e0b02a'): void {
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
export function gasRack(l: Lot, x: number, z: number): void {
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
export function signboard(
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
export function apron(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  color = '#9a978f',
): void {
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
export function clutter(l: Lot, x0: number, z0: number, x1: number, z1: number, n: number): void {
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
export function stack(
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
export function flue(
  l: Lot,
  x: number,
  z: number,
  y: number,
  h: number,
  r = 0.012,
  fume = 3,
): void {
  wround(l, x, z, r, r * 1.15, y, h, '#2c3134', 10);
  wround(l, x, z, r * 1.5, r * 1.3, y + h, 0.01, '#1c1f21', 10);
  if (fume) smoke(l, x, z, y + h + 0.01, fume);
}

/** Glowing molten metal: a short emissive cylinder. */
export function melt(l: Lot, x: number, z: number, y: number, r: number): void {
  l.shape(new THREE.CylinderGeometry(r, r, 0.006, 14), '#ff9a3a', x, z, y, 1);
}

/** Spoked iron flywheel standing in the plane facing `ry`, bottom at y. */
export function flywheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
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
export function pylon(l: Lot, x: number, z: number, h: number): void {
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
export function coolingTower(l: Lot, x: number, z: number, h: number, r: number): void {
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

// ---------------------------------------------------------------------------------------------
// Group 2B additions: timber, kilns, mills and workshop furniture.
// ---------------------------------------------------------------------------------------------

/** Pyramid of logs lying along `ry` (0 = along x), with pale end grain. */
export function logPile(
  l: Lot,
  x: number,
  z: number,
  rows: number,
  len: number,
  ry = 0,
  r = 0.012,
): void {
  for (let row = 0; row < rows; row++) {
    const n = rows - row;
    for (let k = 0; k < n; k++) {
      const across = (k - (n - 1) / 2) * r * 2.05;
      const [px, pz] = off(l, x, z, -Math.sin(ry) * across, Math.cos(ry) * across);
      const y = 0.03 + r + row * r * 1.75;
      const log = new THREE.CylinderGeometry(r, r * 1.04, len, 8).rotateZ(Math.PI / 2).rotateY(ry);
      l.shape(log, tone('#7a5634', 0.14), px, pz, y);
      for (const s of [-1, 1]) {
        const cap = new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.003, 8)
          .rotateZ(Math.PI / 2)
          .rotateY(ry);
        l.shape(
          cap,
          '#d8b27a',
          ...off(
            l,
            px,
            pz,
            Math.cos(ry) * s * (len / 2 + 0.001),
            -Math.sin(ry) * s * (len / 2 + 0.001),
          ),
          y,
        );
      }
    }
  }
}

/** Air-drying stack of sawn boards with spacer sticks between the layers. */
export function lumberStack(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  layers: number,
  ry = 0,
  color = '#d2b07a',
): void {
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * s * w * 0.35, -Math.sin(ry) * s * w * 0.35),
      0.03,
      0.012,
      0.012,
      d + 0.01,
      '#5a5f63',
      ry,
    );
  for (let i = 0; i < layers; i++) {
    const y = 0.042 + i * 0.011;
    wbox(l, x, z, y, w, 0.007, d, tone(color, 0.08), ry);
    for (const s of [-1, 0, 1])
      wbox(
        l,
        ...off(l, x, z, Math.cos(ry) * s * w * 0.4, -Math.sin(ry) * s * w * 0.4),
        y + 0.007,
        0.004,
        0.004,
        d + 0.006,
        '#7a5634',
        ry,
      );
  }
  wbox(l, x, z, 0.042 + layers * 0.011, w + 0.012, 0.004, d + 0.01, '#5a4a3a', ry);
}

/** Saw bench: timber table, upright circular blade, a log on the carriage. */
export function sawBench(l: Lot, x: number, z: number, ry = 0, len = 0.16): void {
  const along = (t: number): [number, number] => off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t);
  for (const t of [-len / 2 + 0.01, len / 2 - 0.01])
    for (const s of [-1, 1])
      wbox(
        l,
        ...off(l, ...along(t), Math.sin(ry) * s * 0.022, Math.cos(ry) * s * 0.022),
        0.03,
        0.008,
        0.04,
        0.008,
        '#4a3a2a',
      );
  wbox(l, x, z, 0.07, len, 0.008, 0.05, '#8a6a48', ry);
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, Math.sin(ry) * s * 0.02, Math.cos(ry) * s * 0.02),
      0.078,
      len,
      0.004,
      0.004,
      '#5a5f63',
      ry,
    );
  const blade = new THREE.CylinderGeometry(0.03, 0.03, 0.003, 18).rotateX(Math.PI / 2).rotateY(ry);
  l.shape(blade, '#c9cdd0', x, z, 0.09);
  wround(l, x, z, 0.004, 0.004, 0.075, 0.03, '#2c3134', 6);
  const log = new THREE.CylinderGeometry(0.014, 0.015, len * 0.7, 8)
    .rotateZ(Math.PI / 2)
    .rotateY(ry);
  l.shape(log, '#7a5634', ...along(-len * 0.12), 0.092);
}

/** Elevated timber flume on trestles carrying water from (x0, z0) to (x1, z1). */
export function flume(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  w = 0.05,
): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const ry = -Math.atan2((z1 - z0) * l.spanZ, (x1 - x0) * l.spanX);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  wbox(l, cx, cz, y, len, 0.008, w, '#6b4a2c', ry);
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, cx, cz, Math.sin(ry) * s * w * 0.5, Math.cos(ry) * s * w * 0.5),
      y,
      len,
      0.03,
      0.006,
      '#7a5634',
      ry,
    );
  wbox(l, cx, cz, y + 0.012, len, 0.004, w - 0.012, '#4f93b0', ry, 0, 0.15);
  const n = Math.max(2, Math.round(len / 0.1));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    for (const s of [-1, 1])
      wbox(
        l,
        ...off(l, px, pz, Math.sin(ry) * s * w * 0.45, Math.cos(ry) * s * w * 0.45),
        0.03,
        0.008,
        y - 0.03,
        0.008,
        '#5c4630',
      );
    wbox(l, px, pz, y * 0.5, 0.006, 0.006, w + 0.01, '#5c4630', ry + Math.PI / 2 - Math.PI / 2);
  }
}

/** Timber or steel jib crane: mast, braced jib, hook block and a hanging load. */
export function jibCrane(
  l: Lot,
  x: number,
  z: number,
  h: number,
  ry: number,
  reach = 0.16,
  color = '#5c4630',
  load?: string,
): void {
  wround(l, x, z, 0.01, 0.012, 0.03, h, color, 8);
  const [ex, ez] = off(l, x, z, Math.cos(ry) * reach, -Math.sin(ry) * reach);
  l.beam([x, 0.03 + h, z], [ex, 0.03 + h - 0.01, ez], 0.012, color);
  const [mx, mz] = off(l, x, z, Math.cos(ry) * reach * 0.5, -Math.sin(ry) * reach * 0.5);
  l.beam([x, 0.03 + h * 0.6, z], [mx, 0.03 + h - 0.006, mz], 0.006, color);
  l.beam([ex, 0.03 + h - 0.012, ez], [ex, 0.03 + h * 0.45, ez], 0.002, '#1c1f21');
  wbox(l, ex, ez, 0.03 + h * 0.42, 0.012, 0.014, 0.012, '#2c3134');
  if (load === 'log') {
    const log = new THREE.CylinderGeometry(0.014, 0.015, 0.14, 8)
      .rotateZ(Math.PI / 2)
      .rotateY(ry + Math.PI / 2);
    l.shape(log, '#7a5634', ex, ez, 0.03 + h * 0.36);
  } else if (load) wbox(l, ex, ez, 0.03 + h * 0.3, 0.04, 0.03, 0.04, load);
}

/** Overhead gantry crane: two A-frames and a bridge with a trolley and hoist. */
export function gantry(
  l: Lot,
  x0: number,
  x1: number,
  z: number,
  h: number,
  span = 0.2,
  color = '#d8a832',
): void {
  for (const x of [x0, x1]) {
    for (const s of [-1, 1])
      l.beam([x, 0.03, z + (s * span) / 2 / l.spanZ], [x, 0.03 + h, z], 0.014, color);
    wbox(l, x, z, 0.03, 0.03, 0.01, span + 0.02, '#3a3f42');
  }
  wbox(l, (x0 + x1) / 2, z, 0.03 + h, (x1 - x0) * l.spanX + 0.03, 0.022, 0.03, color);
  const tx = x0 + (x1 - x0) * 0.4;
  wbox(l, tx, z, 0.03 + h - 0.02, 0.04, 0.02, 0.05, '#3a3f42');
  l.beam([tx, 0.03 + h - 0.02, z], [tx, 0.03 + h * 0.4, z], 0.003, '#1c1f21');
  wbox(l, tx, z, 0.03 + h * 0.36, 0.014, 0.016, 0.014, '#2c3134');
}

/** Beehive (downdraft) kiln: brick drum, domed crown, iron bands, glowing firing door. */
export function beehiveKiln(
  l: Lot,
  x: number,
  z: number,
  r: number,
  h: number,
  color = '#a65e40',
  doorFace: Face = '+z',
): void {
  const rows = Math.max(3, Math.round(h / 0.016));
  for (let i = 0; i < rows; i++)
    wround(
      l,
      x,
      z,
      r * (1 - i * 0.012),
      r * (1 - (i - 1) * 0.012),
      0.03 + (i * h) / rows,
      h / rows,
      tone(color, 0.12),
      20,
    );
  const dome = new THREE.SphereGeometry(r * 0.96, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.7, 1);
  l.shape(dome, shade(color, 1.06), x, z, 0.03 + h);
  for (const t of [0.25, 0.6, 0.92])
    wround(l, x, z, r + 0.003, r + 0.003, 0.03 + h * t, 0.005, '#2c2a28', 20);
  wround(l, x, z, 0.012, 0.016, 0.03 + h + r * 0.64, 0.02, '#5a3a2a', 10);
  faceBox(l, x, z, r * 2, r * 2, doorFace, 0, -0.004, 0.034, 0.04, 0.05, 0.006, '#3a2a22');
  faceBox(l, x, z, r * 2, r * 2, doorFace, 0, -0.002, 0.036, 0.03, 0.03, 0.004, hot, 1);
  faceBox(l, x, z, r * 2, r * 2, doorFace, 0, 0, 0.086, 0.05, 0.01, 0.01, shade(color, 1.2));
}

/** Toothed gear wheel standing in the plane facing `ry`, centred at height y. */
export function gear(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  ry: number,
  color = '#b08a3a',
): void {
  const rim = new THREE.TorusGeometry(r, r * 0.16, 6, 20).rotateY(ry);
  l.shape(rim, color, x, z, y);
  const teeth = 14;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = new THREE.BoxGeometry(r * 0.24, r * 0.3, r * 0.24)
      .translate(0, r * 1.18, 0)
      .rotateZ(a)
      .rotateY(ry);
    l.shape(t, color, x, z, y);
  }
  for (let i = 0; i < 4; i++) {
    const s = new THREE.BoxGeometry(r * 0.12, r * 2, r * 0.1)
      .rotateZ((i / 4) * Math.PI)
      .rotateY(ry);
    l.shape(s, shade(color, 0.85), x, z, y);
  }
}

/** Clock face on a body face: dial, rim, hour marks and hands. */
export function clockFace(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: Face,
  y: number,
  r: number,
): void {
  const flat = f === '+z' || f === '-z';
  const s = f[0] === '+' ? 1 : -1;
  const dial = new THREE.CylinderGeometry(r, r, 0.004, 24).rotateX(Math.PI / 2);
  if (!flat) dial.rotateY(Math.PI / 2);
  l.shape(dial, '#f3ecd8', ...faceAt(l, x, z, w, d, f, 0, 0.004), y, 0.3);
  const rim = new THREE.TorusGeometry(r, 0.004, 4, 24);
  if (!flat) rim.rotateY(Math.PI / 2);
  l.shape(rim, '#b08a3a', ...faceAt(l, x, z, w, d, f, 0, 0.006), y);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    faceBox(
      l,
      x,
      z,
      w,
      d,
      f,
      Math.sin(a) * r * 0.8 * s,
      0.007,
      y + Math.cos(a) * r * 0.8 - 0.002,
      0.004,
      0.004,
      0.002,
      '#2c2a28',
    );
  }
  faceBox(l, x, z, w, d, f, 0, 0.008, y, 0.003, r * 0.7, 0.002, '#2c2a28');
  faceBox(l, x, z, w, d, f, r * 0.25 * s, 0.008, y, r * 0.5, 0.003, 0.002, '#2c2a28');
}

/** Ribbed glass dome on a drum, with a lantern finial. */
export function glassDome(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  frame = '#b08a3a',
): void {
  wround(l, x, z, r * 1.04, r * 1.04, y, 0.02, frame, 20);
  const glass = new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  l.shape(glass, '#bfe0e6', x, z, y + 0.02, 0.35);
  for (let i = 0; i < 8; i++) {
    const rib = new THREE.TorusGeometry(r + 0.002, 0.003, 4, 16, Math.PI / 2)
      .rotateZ(0)
      .rotateY((i / 8) * Math.PI * 2);
    l.shape(rib, frame, x, z, y + 0.02);
  }
  wround(l, x, z, r * 0.12, r * 0.18, y + 0.02 + r - 0.004, r * 0.25, frame, 10);
  wround(l, x, z, 0.002, r * 0.08, y + 0.02 + r * 1.2, r * 0.3, frame, 6);
}

/** Sawtooth roof over a hall: bays with slate slopes and glazed north lights facing -x. */
export function sawtoothRoof(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  bays: number,
  rise = 0.08,
  color = '#4f5a60',
): void {
  const run = w / bays;
  const a = Math.atan2(rise, run);
  for (let i = 0; i < bays; i++) {
    const bx = -w / 2 + (i + 0.5) * run;
    const [cx, cz] = off(l, x, z, bx, 0);
    l.shape(
      new THREE.BoxGeometry(Math.hypot(run, rise), 0.01, d + 0.02).rotateZ(-a),
      color,
      cx,
      cz,
      y + rise / 2,
    );
    for (let k = 0; k < 5; k++)
      l.shape(
        new THREE.BoxGeometry(Math.hypot(run, rise), 0.004, 0.005).rotateZ(-a),
        shade(color, 0.8),
        ...off(l, cx, cz, 0, -d / 2 + ((k + 0.5) * d) / 5),
        y + rise / 2 + 0.007,
      );
    const [gx, gz] = off(l, cx, cz, -run / 2, 0);
    wbox(l, gx, gz, y, 0.01, rise, d, '#3a3f42');
    wbox(
      l,
      ...off(l, gx, gz, 0.002, 0),
      y + 0.008,
      0.008,
      rise - 0.014,
      d - 0.03,
      '#cfe6f0',
      0,
      0,
      1,
    );
    const n = Math.max(3, Math.round(d / 0.06));
    for (let k = 0; k <= n; k++)
      wbox(
        l,
        ...off(l, gx, gz, 0.004, -d / 2 + 0.015 + (k * (d - 0.03)) / n),
        y + 0.008,
        0.008,
        rise - 0.014,
        0.004,
        '#2c3134',
      );
  }
}

/** Cyclone dust collector on legs with its duct. */
export function cyclone(l: Lot, x: number, z: number, h: number): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    wbox(l, ...off(l, x, z, a * 0.025, b * 0.025), 0.03, 0.006, h * 0.55, 0.006, '#5a5f63');
  l.shape(
    new THREE.ConeGeometry(0.035, h * 0.3, 14).rotateX(Math.PI),
    '#9aa0a3',
    x,
    z,
    0.03 + h * 0.5,
  );
  wround(l, x, z, 0.035, 0.035, 0.03 + h * 0.65, h * 0.25, '#9aa0a3', 14);
  wround(l, x, z, 0.012, 0.012, 0.03 + h * 0.9, h * 0.12, '#7a8186', 10);
}

/** Wigwam burner for sawmill offcuts: tall steel cone with a mesh cap and glow at the door. */
export function wigwamBurner(l: Lot, x: number, z: number, h: number, r: number): void {
  l.shape(new THREE.CylinderGeometry(r * 0.3, r, h, 18, 1, true), '#6e5a4a', x, z, 0.03 + h / 2);
  l.shape(
    new THREE.CylinderGeometry(r * 0.3, r, h, 18, 1, true).scale(0.98, 1, 0.98),
    '#2a2420',
    x,
    z,
    0.03 + h / 2,
  );
  for (const t of [0.3, 0.6])
    wround(
      l,
      x,
      z,
      r * (1 - 0.7 * t) + 0.002,
      r * (1 - 0.7 * t) + 0.002,
      0.03 + h * t,
      0.004,
      '#3a2f28',
      18,
    );
  const cap = new THREE.SphereGeometry(r * 0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  l.shape(cap, '#4a4440', x, z, 0.03 + h);
  wbox(l, ...off(l, x, z, 0, r * 0.98), 0.03, 0.04, 0.03, 0.004, hot, 0, 0, 1);
  smoke(l, x, z, 0.04 + h + r * 0.3, 3);
}
