import * as THREE from 'three';
import { off, rand, tone, wbox, wround } from './diorama';
import { type Lot } from './lot';

// Small detail props shared by the newer diorama groups. Positions are lot fractions (x, z),
// sizes and heights are world units; `y` is the height of the surface the prop stands on.

type P3 = [number, number, number];
/** Beam point from a lot-fraction pair and a height. */
export const pt = (a: readonly [number, number], y: number): P3 => [a[0], y, a[1]];

const bloomColors = ['#d6455a', '#f0c24a', '#e8e4d8', '#c25aa8', '#f08a3a'];

/** Small birds standing at (x, z, y). */
export function birds(
  l: Lot,
  list: readonly (readonly [number, number, number])[],
  coat = '#6a5a4a',
): void {
  for (const [x, z, y] of list) {
    wbox(l, x, z, y, 0.012, 0.008, 0.008, coat);
    l.shape(new THREE.SphereGeometry(0.004, 5, 4), coat, ...off(l, x, z, 0.007, 0), y + 0.01);
  }
}

/** Butterflies hovering at (x, z, y). */
export function butterflies(l: Lot, list: readonly (readonly [number, number, number])[]): void {
  for (const [x, z, y] of list) {
    const c = bloomColors[Math.floor(rand() * bloomColors.length)]!;
    wbox(l, ...off(l, x, z, -0.005, 0), y, 0.008, 0.002, 0.012, c, 0.4, 0.5);
    wbox(l, ...off(l, x, z, 0.005, 0), y, 0.008, 0.002, 0.012, c, -0.4, -0.5);
  }
}

/** Cat sitting at height y. */
export function cat(l: Lot, x: number, z: number, y: number, coat = '#c27a3a'): void {
  wbox(l, x, z, y, 0.014, 0.012, 0.02, coat);
  l.shape(new THREE.SphereGeometry(0.0065, 6, 5), coat, ...off(l, x, z, 0, 0.012), y + 0.014);
  wbox(l, ...off(l, x, z, 0.004, -0.012), y, 0.003, 0.016, 0.003, coat);
}

/** Downpipe running down a wall corner. */
export function downpipe(l: Lot, x: number, z: number, y: number, h: number): void {
  wround(l, x, z, 0.004, 0.004, y, h, '#4a4f54', 6);
  wbox(l, x, z, y + h - 0.004, 0.02, 0.008, 0.012, '#4a4f54');
}

/** Projecting cornice board around a body. */
export function cornice(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  color: string,
): void {
  wbox(l, x, z, y, w + 0.03, 0.012, d + 0.03, color);
  wbox(l, x, z, y - 0.012, w + 0.016, 0.012, d + 0.016, tone(color, 0.06));
}

/** Stone steps up to a door facing +z. */
export function steps(l: Lot, x: number, z: number, w: number, n: number, y = 0.036): void {
  for (let i = 0; i < n; i++)
    wbox(
      l,
      ...off(l, x, z, 0, i * 0.016),
      y + (n - 1 - i) * 0.008,
      w + i * 0.01,
      0.008,
      0.016,
      tone('#bdb6a6', 0.1),
    );
}

/** Row of flowers planted in a strip along x. */
export function flowerRow(
  l: Lot,
  x: number,
  z: number,
  len: number,
  bloom: string,
  n = 8,
  y = 0.038,
): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, -len / 2 + ((i + 0.5) * len) / n, 0);
    wbox(l, px, pz, y, 0.003, 0.026, 0.003, '#3f7a3a');
    l.shape(new THREE.SphereGeometry(0.008, 6, 5), tone(bloom, 0.12), px, pz, y + 0.032);
  }
}

/** Clumps of ivy climbing a wall face. */
export function ivy(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  face: '+z' | '+x',
  t: number,
  h: number,
  y0 = 0.036,
): void {
  for (let i = 0; i < 9; i++) {
    const along = t + (rand() - 0.5) * 0.09;
    const [px, pz] =
      face === '+z' ? off(l, x, z, along, d / 2 + 0.006) : off(l, x, z, w / 2 + 0.006, along);
    l.shape(
      new THREE.IcosahedronGeometry(0.012 + rand() * 0.008, 0),
      tone('#3f7a3a', 0.2),
      px,
      pz,
      y0 + 0.015 + rand() * h,
    );
  }
}

/** Cobbled paving. */
export function cobbles(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  n: number,
  y = 0.038,
  color = '#b9b4a6',
): void {
  for (let i = 0; i < n; i++)
    wbox(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      y,
      0.02 + rand() * 0.02,
      0.004,
      0.016 + rand() * 0.016,
      tone(color, 0.18),
      rand() * 3,
    );
}

/** Wooden rain barrel. */
export function rainButt(l: Lot, x: number, z: number, y = 0.036): void {
  wround(l, x, z, 0.018, 0.02, y, 0.05, '#7a5232', 10);
  wround(l, x, z, 0.019, 0.019, y + 0.014, 0.004, '#3a3530', 10);
  wround(l, x, z, 0.019, 0.019, y + 0.034, 0.004, '#3a3530', 10);
}

/** Wooden bench facing +z. */
export function bench(l: Lot, x: number, z: number, y = 0.036, ry = 0): void {
  wbox(l, x, z, y + 0.016, 0.1, 0.008, 0.034, '#6b4a2a', ry);
  wbox(l, ...off(l, x, z, 0, -0.016), y + 0.026, 0.1, 0.03, 0.006, '#6b4a2a', ry);
  for (const t of [-0.04, 0.04]) wbox(l, ...off(l, x, z, t, 0), y, 0.008, 0.016, 0.026, '#4a3a2a');
}

/** Vertical ladder fixed to a wall: rails and rungs, facing +z or +x. */
export function ladder(
  l: Lot,
  x: number,
  z: number,
  y: number,
  h: number,
  face: '+z' | '+x' = '+z',
  color = '#4a4f54',
): void {
  const alongX = face === '+z';
  for (const s of [-1, 1]) {
    const [px, pz] = alongX ? off(l, x, z, s * 0.012, 0) : off(l, x, z, 0, s * 0.012);
    wbox(l, px, pz, y, 0.003, h, 0.003, color);
  }
  for (let i = 1; i < h / 0.018; i++)
    wbox(l, x, z, y + i * 0.018, alongX ? 0.026 : 0.004, 0.003, alongX ? 0.004 : 0.026, color);
}

/** Straight pipe run between two points, with a flange at each end. */
export function pipe(l: Lot, a: P3, b: P3, r = 0.006, color = '#5a6a72'): void {
  l.beam(a, b, r, color);
  for (const p of [a, b])
    l.shape(new THREE.SphereGeometry(r * 1.5, 6, 5), shade2(color), p[0], p[2], p[1]);
}

function shade2(color: string): string {
  return tone(color, 0.08);
}

/** Upright cylindrical tank with hoops and a domed lid. */
export function tank(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  h: number,
  color: string,
): void {
  wround(l, x, z, r, r, y, h, color, 16);
  for (const t of [0.25, 0.6, 0.9])
    wround(l, x, z, r * 1.03, r * 1.03, y + h * t, 0.006, '#3a3f42', 16);
  l.shape(
    new THREE.SphereGeometry(r * 0.96, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    tone(color, 0.08),
    x,
    z,
    y + h,
  );
}

/** Pressure gauge on a post: a small dial with a red needle. */
export function gauge(l: Lot, x: number, z: number, y: number): void {
  wbox(l, x, z, y, 0.006, 0.03, 0.006, '#4a4f54');
  wround(l, x, z, 0.011, 0.011, y + 0.03, 0.006, '#e8e4d8', 10);
  wbox(l, ...off(l, x, z, 0, 0.004), y + 0.038, 0.002, 0.012, 0.002, '#b0463a');
}

/** Spoked gear standing in the plane facing +z (teeth as small blocks). */
export function gear(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  color = '#6a6a70',
  teeth = 10,
): void {
  const rim = new THREE.TorusGeometry(r, r * 0.16, 5, 18);
  l.shape(rim, color, x, z, y + r);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.BoxGeometry(r * 0.3, r * 0.34, r * 0.3);
    tooth.rotateZ(a);
    tooth.translate(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 0);
    l.shape(tooth, color, x, z, y + r);
  }
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.BoxGeometry(r * 0.12, r * 1.9, r * 0.12);
    sp.rotateZ((i / 3) * Math.PI);
    l.shape(sp, color, x, z, y + r);
  }
}

/** Low brick or stone planter with shrubs, as a neat piece of site dressing. */
export function planter(l: Lot, x: number, z: number, w: number, color = '#8a6a48'): void {
  wbox(l, x, z, 0.036, w, 0.02, 0.04, color);
  for (let i = 0; i < Math.max(2, Math.round(w / 0.03)); i++)
    l.shape(
      new THREE.IcosahedronGeometry(0.014, 0),
      tone('#4f8a3a', 0.2),
      ...off(l, x, z, -w / 2 + 0.015 + i * 0.03, 0),
      0.062,
    );
}
