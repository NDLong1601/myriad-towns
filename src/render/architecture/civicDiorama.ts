import * as THREE from 'three';
import {
  barrel,
  cart,
  chimney,
  crate,
  door,
  halfTimber,
  horse,
  lanternPost,
  meadow,
  off,
  rand,
  renderBody,
  reseed,
  shade,
  shingleGable,
  shrub,
  stoneBody,
  tinGable,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import { truck } from './dioramaProps';
import {
  clockFace,
  faceAt,
  faceBox,
  glassDome,
  hallFacade,
  iron,
  pane,
  ridgeLantern,
  signboard,
  timberDark,
} from './industryKit';
import { brickBody, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Civic group: market, clinic, tavern, chapel and library chains plus the single civic sites,
// drawn at the shared tile scale (0.77 units a tile).

const grass = '#79a24a';
const limestone = '#d8d0bc';
const marble = '#ece7dc';
const plaster = '#f2ead8';
const brass = '#c9a24a';
const copper = '#5fa58e';
const slate = '#4d5a66';
const terracotta = '#b4613f';
const sage = '#7f9a7a';

// ---------------------------------------------------------------------------------------------
// Local kit
// ---------------------------------------------------------------------------------------------

/** Lawn with a flagstone square; returns nothing, just lays the ground. */
function square(
  l: Lot,
  seed: string,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  color = '#c4bca8',
  tufts = 16,
): void {
  reseed(seed);
  meadow(l, grass, tufts);
  const w = (x1 - x0) * l.spanX;
  const d = (z1 - z0) * l.spanZ;
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, w, 0.008, d, shade(color, 0.85));
  const n = Math.max(2, Math.round(w / 0.05));
  const m = Math.max(2, Math.round(d / 0.05));
  for (let i = 0; i < n; i++)
    for (let k = 0; k < m; k++)
      wbox(
        l,
        x0 + ((i + 0.5) / n) * (x1 - x0),
        z0 + ((k + 0.5) / m) * (z1 - z0),
        0.038,
        w / n - 0.005,
        0.003,
        d / m - 0.005,
        tone(color, 0.07),
      );
}

/** Market stall: trestle counter with goods and a striped awning on poles. */
function stall(
  l: Lot,
  x: number,
  z: number,
  ry: number,
  stripe: string,
  goods: string[],
  s = 1,
): void {
  const at = (a: number, b: number): [number, number] =>
    off(
      l,
      x,
      z,
      (Math.cos(ry) * a + Math.sin(ry) * b) * s,
      (-Math.sin(ry) * a + Math.cos(ry) * b) * s,
    );
  wbox(l, x, z, 0.03, 0.1 * s, 0.04 * s, 0.04 * s, '#8a6a48', ry);
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      ...at(-0.035 + i * 0.023, 0),
      0.03 + 0.04 * s,
      0.016 * s,
      0.012 * s,
      0.016 * s,
      goods[i % goods.length]!,
      ry + i,
    );
  for (const a of [-0.05, 0.05])
    for (const b of [-0.025, 0.035])
      wbox(l, ...at(a, b), 0.03, 0.004 * s, (b > 0 ? 0.1 : 0.12) * s, 0.004 * s, '#5c4630');
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BoxGeometry(0.0185 * s, 0.004 * s, 0.08 * s).rotateX(-0.25).rotateY(ry);
    l.shape(g, i % 2 ? '#f2efe6' : stripe, ...at(-0.046 + i * 0.0185, 0.005), 0.03 + 0.105 * s);
  }
  // Baskets and sacks on the ground beside the counter.
  for (let i = 0; i < 2; i++)
    wround(l, ...at(-0.03 + i * 0.06, 0.04), 0.008 * s, 0.01 * s, 0.03, 0.014 * s, '#a07a4a', 8);
}

/** Hanging bracket sign. */
function hangingSign(l: Lot, x: number, z: number, y: number, color: string, ry = 0): void {
  wbox(l, x, z, y, 0.05, 0.004, 0.004, iron, ry);
  const [sx, sz] = off(l, x, z, Math.cos(ry) * 0.014, -Math.sin(ry) * 0.014);
  wbox(l, sx, sz, y - 0.04, 0.03, 0.036, 0.004, color, ry);
  wbox(l, sx, sz, y - 0.032, 0.022, 0.018, 0.006, '#e9dfc9', ry);
}

/** Corner quoins: alternating long and short stones up each corner. */
function quoins(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
): void {
  const n = Math.max(3, Math.round(h / 0.03));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      for (let k = 0; k < n; k++) {
        const long = k % 2 === 0;
        wbox(
          l,
          ...off(
            l,
            x,
            z,
            sx * (w / 2 - (long ? 0.01 : 0.006)),
            sz * (d / 2 - (long ? 0.006 : 0.01)),
          ),
          y + k * (h / n) + 0.002,
          long ? 0.03 : 0.018,
          h / n - 0.004,
          long ? 0.018 : 0.03,
          color,
        );
      }
}

/** Arched (or lancet) window: frame, lit glass, mullion and a round head. */
function archWindow(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: '+z' | '-z' | '+x' | '-x',
  along: number,
  y: number,
  ww: number,
  wh: number,
  frame: string,
  glass = pane,
): void {
  faceBox(l, x, z, w, d, f, along, 0.002, y - 0.004, ww + 0.012, wh + 0.008, 0.004, frame);
  faceBox(l, x, z, w, d, f, along, 0.004, y, ww, wh, 0.003, glass, 1);
  faceBox(l, x, z, w, d, f, along, 0.006, y, 0.003, wh, 0.003, frame);
  const head = new THREE.CylinderGeometry(
    ww / 2 + 0.006,
    ww / 2 + 0.006,
    0.005,
    12,
    1,
    false,
    -Math.PI / 2,
    Math.PI,
  );
  head.rotateX(Math.PI / 2);
  if (f === '+x' || f === '-x') head.rotateY(Math.PI / 2);
  l.shape(head, frame, ...faceAt(l, x, z, w, d, f, along, 0.003), y + wh);
  const glassHead = new THREE.CylinderGeometry(
    ww / 2,
    ww / 2,
    0.004,
    12,
    1,
    false,
    -Math.PI / 2,
    Math.PI,
  );
  glassHead.rotateX(Math.PI / 2);
  if (f === '+x' || f === '-x') glassHead.rotateY(Math.PI / 2);
  l.shape(glassHead, glass, ...faceAt(l, x, z, w, d, f, along, 0.005), y + wh, 1);
}

/** Rose window: round glowing disc with tracery spokes. */
function roseWindow(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  f: '+z' | '-z',
  y: number,
  r: number,
): void {
  const disc = new THREE.CylinderGeometry(r, r, 0.004, 20).rotateX(Math.PI / 2);
  l.shape(disc, '#d86a8a', ...faceAt(l, x, z, w, d, f, 0, 0.004), y, 1);
  const ring = new THREE.TorusGeometry(r, 0.006, 6, 20);
  l.shape(ring, limestone, ...faceAt(l, x, z, w, d, f, 0, 0.006), y);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.BoxGeometry(0.004, r * 2, 0.004).rotateZ((i / 4) * Math.PI);
    l.shape(s, limestone, ...faceAt(l, x, z, w, d, f, 0, 0.007), y);
  }
}

/** Flower bed in a low stone kerb. */
function flowerBed(l: Lot, x: number, z: number, w: number, d: number, ry = 0): void {
  wbox(l, x, z, 0.03, w, 0.016, d, '#a49c8c', ry);
  wbox(l, x, z, 0.032, w - 0.01, 0.016, d - 0.01, '#5a4a3a', ry);
  const n = Math.max(2, Math.round((w * d) / 0.0012));
  for (let i = 0; i < n; i++)
    shrub(
      l,
      ...off(l, x, z, (rand() - 0.5) * (w - 0.02), (rand() - 0.5) * (d - 0.02)),
      0.01,
      ['#d84a6a', '#e8c84a', '#8a6ab8', '#4f8a3a'][i % 4],
    );
}

/** Low stone wall between two lot points. */
function stoneWall(l: Lot, x0: number, z0: number, x1: number, z1: number, h = 0.04): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const ry = -Math.atan2((z1 - z0) * l.spanZ, (x1 - x0) * l.spanX);
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, len, h, 0.024, '#a49c8c', ry);
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03 + h, len + 0.006, 0.008, 0.03, '#bdb6a6', ry);
}

/** Red-cross lamp sign for the medical buildings. */
function redCross(l: Lot, x: number, z: number, y: number, s = 0.03): void {
  wbox(l, x, z, y, s, s, 0.006, '#f2efe6');
  wbox(l, x, z, y + s * 0.35, s * 0.8, s * 0.3, 0.008, '#c8392c', 0, 0, 0.6);
  wbox(l, x, z, y + s * 0.1, s * 0.3, s * 0.8, 0.008, '#c8392c', 0, 0, 0.6);
}

/** Bench. */
function bench(l: Lot, x: number, z: number, ry = 0): void {
  wbox(l, x, z, 0.046, 0.06, 0.005, 0.018, '#7a5634', ry);
  wbox(
    l,
    ...off(l, x, z, Math.sin(ry) * 0.009, Math.cos(ry) * -0.009),
    0.05,
    0.06,
    0.02,
    0.004,
    '#7a5634',
    ry,
  );
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * s * 0.025, -Math.sin(ry) * s * 0.025),
      0.03,
      0.004,
      0.016,
      0.016,
      iron,
      ry,
    );
}

const produce = ['#c84a3a', '#e8c84a', '#4f8a3a', '#d8843a', '#8a5aa8', '#e9e0c8'];

export const civicDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Market (2x2)
  // -----------------------------------------------------------------------------------------
  market(l) {
    square(l, 'market', 0.06, 0.06, 0.94, 0.94, '#c9bfa6');
    // Open-air market: rows of striped stalls round a market cross, carts unloading.
    const stripes = ['#c8392c', '#2f6f9a', '#3f8a6a', '#d8a832'];
    // Two facing rows of large stalls along each side of the square, open aisle between.
    let k = 0;
    for (const [z, ry] of [
      [0.16, Math.PI],
      [0.3, 0],
      [0.62, Math.PI],
      [0.76, 0],
    ] as const)
      for (const x of [0.16, 0.36, 0.56, 0.76]) {
        stall(l, x, z, ry, stripes[k % 4]!, produce.slice(k % 4, (k % 4) + 3), 1.7);
        k++;
      }
    // Market cross on steps in the middle aisle.
    for (let i = 0; i < 3; i++)
      wbox(l, 0.46, 0.46, 0.03 + i * 0.012, 0.12 - i * 0.03, 0.012, 0.12 - i * 0.03, limestone);
    wround(l, 0.46, 0.46, 0.014, 0.02, 0.066, 0.22, limestone, 8);
    wbox(l, 0.46, 0.46, 0.25, 0.07, 0.016, 0.016, limestone);
    for (let i = 0; i < 6; i++) barrel(l, 0.9 + (i % 2) * 0.03, 0.4 + Math.floor(i / 2) * 0.03);
    for (let i = 0; i < 6; i++) crate(l, 0.92, 0.6 + i * 0.03, 0.036, produce[i]!, i * 0.4);
    horse(l, 0.62, 0.92, 0);
    cart(l, 0.76, 0.92, 0, 'crates');
    workers(l, [
      [0.2, 0.46, '#c84a3a', '#e9e0c8'],
      [0.3, 0.42, '#3a5a7a', '#8a6a3a'],
      [0.58, 0.46, '#5a6a4a', '#3a3a3c'],
      [0.68, 0.5, '#8a5a3a', '#e9e0c8'],
      [0.12, 0.5, '#6a3a5a', '#3a3a3c'],
      [0.8, 0.44, '#3a6a5a', '#e9e0c8'],
      [0.4, 0.88, '#7a4a2a', '#3a3a3c'],
    ]);
    for (const [x, z] of [
      [0.08, 0.08],
      [0.92, 0.08],
      [0.08, 0.92],
      [0.36, 0.92],
    ] as const)
      lanternPost(l, x, z, 0.16);
    signboard(l, 0.2, 0.94, 0.09, 0.12, '#7a2a2a');
  },

  covered_market(l) {
    square(l, 'covered_market', 0.05, 0.05, 0.95, 0.95, '#c4bca8');
    // Tiled market pavilion on timber columns, stalls inside, a weighhouse at the corner.
    const hx = 0.46;
    const hz = 0.44;
    const w = 0.9;
    const d = 0.62;
    for (let i = 0; i < 6; i++)
      for (const s of [-1, 1]) {
        const [px, pz] = off(
          l,
          hx,
          hz,
          -w / 2 + 0.03 + (i * (w - 0.06)) / 5,
          (s * d) / 2 - s * 0.02,
        );
        wbox(l, px, pz, 0.03, 0.03, 0.03, 0.03, limestone);
        wround(l, px, pz, 0.01, 0.012, 0.06, 0.2, '#6b4a2c', 8);
        l.beam(
          [px, 0.22, pz],
          [px + (s > 0 ? 0 : 0) / l.spanX, 0.26, pz - (s * 0.04) / l.spanZ],
          0.008,
          '#6b4a2c',
        );
      }
    for (const s of [-1, 1])
      wbox(l, ...off(l, hx, hz, 0, (s * d) / 2 - s * 0.02), 0.26, w, 0.02, 0.02, '#5c4630');
    shingleGable(l, hx, hz, 'x', w, d, 0.28, 0.2, terracotta);
    ridgeLantern(l, hx, hz, 'x', 0.5, 0.48, '#8a4a30');
    const stripes = ['#c8392c', '#2f6f9a', '#3f8a6a', '#d8a832'];
    for (let i = 0; i < 4; i++)
      for (const s of [-1, 1])
        stall(
          l,
          ...off(l, hx, hz, -0.3 + i * 0.2, s * 0.13),
          s > 0 ? 0 : Math.PI,
          stripes[(i + (s > 0 ? 1 : 0)) % 4]!,
          produce.slice(i % 3, (i % 3) + 3),
        );
    // Weighhouse with a clock, carts and crowds outside.
    const wx = 0.86;
    const wz = 0.86;
    stoneBody(l, wx, wz, 0.18, 0.16, 0.03, 0.16, limestone);
    windows4(l, wx, wz, 0.18, 0.16, 0.06, 0.03, { frame: '#5a4a3a' });
    shingleGable(l, wx, wz, 'z', 0.16, 0.18, 0.19, 0.08, slate, limestone);
    clockFace(l, wx, wz, 0.18, 0.16, '-x', 0.15, 0.02);
    horse(l, 0.3, 0.9, 0);
    cart(l, 0.44, 0.9, 0, 'barrels');
    for (let i = 0; i < 5; i++) crate(l, 0.6 + i * 0.03, 0.88, 0.036, produce[i]!, i);
    workers(l, [
      [0.2, 0.44, '#c84a3a', '#e9e0c8'],
      [0.4, 0.44, '#3a5a7a', '#8a6a3a'],
      [0.6, 0.44, '#5a6a4a', '#3a3a3c'],
      [0.74, 0.44, '#8a5a3a', '#e9e0c8'],
      [0.6, 0.8, '#6a3a5a', '#3a3a3c'],
    ]);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.06],
      [0.06, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.17);
    signboard(l, 0.16, 0.94, 0.09, 0.14, '#7a2a2a');
  },

  grand_bazaar(l) {
    square(l, 'grand_bazaar', 0.04, 0.04, 0.96, 0.96, '#d2cab6');
    // Central trade hall: limestone arcade, iron-and-glass vault, corner towers with domes.
    const hx = 0.5;
    const hz = 0.42;
    const w = 1.0;
    const d = 0.6;
    renderBody(l, hx, hz, w, d, 0.03, 0.26, limestone, '#a49c8c');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? w : d;
      const n = Math.round(len / 0.09);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        archWindow(l, hx, hz, w, d, f, t, 0.05, 0.05, 0.1, '#8a7a62');
        archWindow(l, hx, hz, w, d, f, t, 0.18, 0.04, 0.05, '#8a7a62');
      }
    }
    wbox(l, hx, hz, 0.29, w + 0.02, 0.02, d + 0.02, '#c4bca8');
    const vault = new THREE.CylinderGeometry(0.2, 0.2, w - 0.2, 20, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(vault, '#bfe0e6', hx, hz, 0.31, 0.35);
    for (let i = 0; i < 9; i++) {
      const rib = new THREE.TorusGeometry(0.201, 0.004, 4, 16, Math.PI).rotateY(Math.PI / 2);
      l.shape(rib, iron, ...off(l, hx, hz, -0.38 + i * 0.095, 0), 0.31);
    }
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const [tx, tz] = off(l, hx, hz, sx * (w / 2 - 0.04), sz * (d / 2 - 0.04));
        wbox(l, tx, tz, 0.03, 0.1, 0.42, 0.1, limestone);
        for (const f of ['+z', '-z', '+x', '-x'] as const)
          archWindow(l, tx, tz, 0.1, 0.1, f, 0, 0.3, 0.03, 0.06, '#8a7a62');
        const dome = new THREE.SphereGeometry(0.055, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        l.shape(dome, copper, tx, tz, 0.45);
        wround(l, tx, tz, 0.003, 0.008, 0.5, 0.05, brass, 6);
      }
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        ...faceAt(l, hx, hz, w, d, '+z', -0.3 + i * 0.2, 0.02),
        0.03,
        0.1,
        0.008,
        0.04,
        ['#c8392c', '#2f6f9a', '#3f8a6a', '#d8a832'][i]!,
      );
    door(l, hx, hz, w, d, '+z', 0, 0.03, 0.1, 0.14, '#2f3a44');
    // Fountain plaza, stalls overflowing outside, lorries and crowds.
    wround(l, 0.5, 0.84, 0.07, 0.075, 0.034, 0.022, marble, 18);
    wround(l, 0.5, 0.84, 0.064, 0.064, 0.056, 0.002, '#5fa2b8', 18);
    wround(l, 0.5, 0.84, 0.01, 0.014, 0.056, 0.05, marble, 8);
    for (let i = 0; i < 4; i++)
      stall(
        l,
        0.12 + i * 0.07 + (i > 1 ? 0.5 : 0),
        0.82,
        0,
        ['#c8392c', '#2f6f9a', '#3f8a6a', '#d8a832'][i]!,
        produce.slice(i, i + 3),
      );
    truck(l, 0.84, 0.94, 0, '#7a2a2a');
    workers(l, [
      [0.3, 0.76, '#c84a3a', '#e9e0c8'],
      [0.42, 0.9, '#3a5a7a', '#2c2c2e'],
      [0.6, 0.76, '#5a6a4a', '#8a6a3a'],
      [0.7, 0.9, '#8a5a3a', '#e9e0c8'],
      [0.2, 0.94, '#6a3a5a', '#2c2c2e'],
    ]);
    for (const [x, z] of [
      [0.04, 0.7],
      [0.96, 0.7],
      [0.36, 0.96],
      [0.64, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.18);
    for (let i = 0; i < 4; i++) shrub(l, 0.06 + i * 0.04, 0.06, 0.02);
  },

  // -----------------------------------------------------------------------------------------
  // Clinic (1x1); the infirmary follows its approved concept art
  // -----------------------------------------------------------------------------------------
  clinic(l) {
    square(l, 'clinic', 0.3, 0.6, 0.7, 0.96, '#c4bca8', 18);
    // Small whitewashed clinic with a porch, a red-cross lamp and a herb patch.
    const hx = 0.46;
    const hz = 0.4;
    renderBody(l, hx, hz, 0.34, 0.26, 0.03, 0.13, plaster, '#a49c8c');
    windows4(l, hx, hz, 0.34, 0.26, 0.06, 0.034, { shutters: '#3f6a5a' });
    door(l, hx, hz, 0.34, 0.26, '+z', 0, 0.03, 0.05, 0.09, '#3f6a5a');
    shingleGable(l, hx, hz, 'x', 0.34, 0.26, 0.16, 0.1, '#7a4a3a', plaster);
    chimney(l, ...off(l, hx, hz, -0.12, -0.04), 0.16, 0.12);
    const [px, pz] = faceAt(l, hx, hz, 0.34, 0.26, '+z', 0, 0.03);
    for (const s of [-1, 1])
      wbox(l, ...off(l, px, pz, s * 0.05, 0.02), 0.03, 0.008, 0.1, 0.008, '#e9e4d6');
    l.shape(new THREE.BoxGeometry(0.14, 0.008, 0.07).rotateX(0.25), '#7a4a3a', px, pz, 0.135);
    redCross(l, ...faceAt(l, hx, hz, 0.34, 0.26, '+z', 0.11, 0.004), 0.1);
    for (let i = 0; i < 3; i++) flowerBed(l, 0.14, 0.7 + i * 0.1, 0.1, 0.06);
    bench(l, 0.8, 0.72, Math.PI / 2);
    horse(l, 0.82, 0.9, 0);
    workers(l, [
      [0.5, 0.7, '#f2efe6', '#3a3a3c'],
      [0.36, 0.8, '#3a5a7a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.66, 0.66, 0.14);
    for (const [x, z] of [
      [0.08, 0.1],
      [0.9, 0.1],
    ] as const)
      shrub(l, x, z, 0.04);
  },

  infirmary(l) {
    square(l, 'infirmary', 0.08, 0.66, 0.92, 0.96, '#c4bca8', 16);
    // Approved concept: cream walls on a stone plinth, ashlar quoins, sage-green and terracotta
    // tile roof with a side dormer.
    const hx = 0.48;
    const hz = 0.38;
    stoneBody(l, hx, hz, 0.46, 0.34, 0.03, 0.04, '#a49c8c');
    renderBody(l, hx, hz, 0.44, 0.32, 0.07, 0.2, '#f5efe2', '#c4bca8');
    quoins(l, hx, hz, 0.44, 0.32, 0.07, 0.2, limestone);
    windows4(l, hx, hz, 0.44, 0.32, 0.1, 0.036, { frame: timberDark });
    windows4(l, hx, hz, 0.44, 0.32, 0.19, 0.036, { frame: timberDark });
    door(l, hx, hz, 0.44, 0.32, '+z', 0, 0.07, 0.06, 0.1, '#3f6a5a');
    shingleGable(l, hx, hz, 'x', 0.44, 0.32, 0.27, 0.13, sage, '#f5efe2');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.2 + i * 0.08, 0.17), 0.27, 0.07, 0.006, 0.01, terracotta);
    const [dx, dz] = off(l, hx, hz, 0.1, 0.1);
    wbox(l, dx, dz, 0.27, 0.07, 0.06, 0.06, '#f5efe2');
    window4(l, dx, dz, 0.07, 0.06, '+z', 0, 0.28, 0.026, { frame: timberDark });
    shingleGable(l, dx, dz, 'z', 0.07, 0.08, 0.33, 0.04, terracotta, '#f5efe2');
    chimney(l, ...off(l, hx, hz, -0.16, -0.06), 0.27, 0.14);
    redCross(l, ...faceAt(l, hx, hz, 0.44, 0.32, '+z', 0.14, 0.004), 0.15);
    // Stone steps, a covered ambulance cart, benches and a walled herb garden.
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        ...faceAt(l, hx, hz, 0.44, 0.32, '+z', 0, 0.015 + i * 0.012),
        0.03,
        0.1,
        0.036 - i * 0.012,
        0.014,
        limestone,
      );
    horse(l, 0.2, 0.86, 0);
    wbox(l, 0.34, 0.86, 0.05, 0.1, 0.05, 0.05, '#f2efe6');
    redCross(l, 0.34, 0.86 + 0.03 / l.spanZ, 0.07, 0.02);
    for (const s of [-1, 1])
      wround(l, ...off(l, 0.34, 0.86, s * 0.035, 0.026), 0.016, 0.016, 0.034, 0.004, '#3a3530', 10);
    bench(l, 0.64, 0.8, 0);
    bench(l, 0.8, 0.8, 0);
    stoneWall(l, 0.06, 0.62, 0.06, 0.96);
    flowerBed(l, 0.12, 0.74, 0.06, 0.14);
    workers(l, [
      [0.5, 0.76, '#f2efe6', '#3a3a3c'],
      [0.7, 0.9, '#3a5a7a', '#8a6a3a'],
    ]);
    for (const [x, z] of [
      [0.92, 0.66],
      [0.5, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.15);
  },

  medical_hall(l) {
    square(l, 'medical_hall', 0.04, 0.04, 0.96, 0.96, '#c9c3b4', 8);
    // Three-storey general hospital: brick wings, a limestone centre with a pediment and dome.
    const hx = 0.5;
    const hz = 0.36;
    for (const s of [-1, 1]) {
      const [wx, wz] = off(l, hx, hz, s * 0.17, 0.02);
      brickBody(l, wx, wz, 0.16, 0.36, 0.03, 0.3, '#a24a35');
      hallFacade(l, wx, wz, 0.16, 0.36, 0.03, 0.3, '#a24a35', { bay: 0.08, trim: limestone });
      tinGable(l, wx, wz, 'z', 0.36, 0.16, 0.33, 0.07, slate, '#a24a35');
    }
    renderBody(l, hx, hz, 0.2, 0.3, 0.03, 0.34, limestone, '#a49c8c');
    windows4(l, hx, hz, 0.2, 0.3, 0.08, 0.034, { frame: brass });
    windows4(l, hx, hz, 0.2, 0.3, 0.18, 0.034, { frame: brass });
    windows4(l, hx, hz, 0.2, 0.3, 0.28, 0.034, { frame: brass });
    wbox(l, hx, hz, 0.37, 0.22, 0.02, 0.32, limestone);
    glassDome(l, hx, hz, 0.39, 0.07, brass);
    door(l, hx, hz, 0.2, 0.3, '+z', 0, 0.03, 0.06, 0.11, '#2f3a44');
    const [px, pz] = faceAt(l, hx, hz, 0.2, 0.3, '+z', 0, 0.03);
    for (const s of [-1, -0.33, 0.33, 1])
      wround(l, ...off(l, px, pz, s * 0.08, 0), 0.008, 0.009, 0.04, 0.12, marble, 8);
    wbox(l, px, pz, 0.16, 0.2, 0.016, 0.05, marble);
    redCross(l, px, pz + 0.026 / l.spanZ, 0.18, 0.03);
    // Ambulance bay, garden courtyard with benches, lamps, staff and visitors.
    apronLine(l);
    truck(l, 0.82, 0.84, 0, '#f2efe6');
    redCross(l, 0.8, 0.84 + 0.03 / l.spanZ, 0.07, 0.02);
    for (let i = 0; i < 4; i++) flowerBed(l, 0.12 + i * 0.12, 0.76, 0.08, 0.06);
    for (let i = 0; i < 3; i++) bench(l, 0.16 + i * 0.16, 0.9, 0);
    workers(l, [
      [0.3, 0.66, '#f2efe6', '#3a3a3c'],
      [0.62, 0.66, '#f2efe6', '#3a3a3c'],
      [0.46, 0.84, '#3a5a7a', '#8a6a3a'],
    ]);
    for (const [x, z] of [
      [0.06, 0.62],
      [0.94, 0.62],
      [0.06, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.17);
  },

  // -----------------------------------------------------------------------------------------
  // Tavern (1x1); the guild tavern follows its approved concept art
  // -----------------------------------------------------------------------------------------
  tavern(l) {
    square(l, 'tavern', 0.2, 0.62, 0.8, 0.96, '#b9ad94', 18);
    // One-storey timber-and-plaster alehouse with a cross gable, barrels and a hitching rail.
    const hx = 0.46;
    const hz = 0.4;
    stoneBody(l, hx, hz, 0.36, 0.26, 0.03, 0.03, '#a49c8c');
    halfTimber(l, hx, hz, 0.35, 0.25, 0.06, 0.11, plaster);
    windows4(l, hx, hz, 0.35, 0.25, 0.08, 0.032, { frame: timberDark });
    door(l, hx, hz, 0.35, 0.25, '+z', -0.06, 0.06, 0.05, 0.08, timberDark);
    shingleGable(l, hx, hz, 'x', 0.35, 0.25, 0.17, 0.1, '#6e5a46', plaster);
    const [gx, gz] = off(l, hx, hz, 0.08, 0.06);
    halfTimber(l, gx, gz, 0.12, 0.16, 0.06, 0.11, plaster);
    shingleGable(l, gx, gz, 'z', 0.16, 0.12, 0.17, 0.08, '#6e5a46', plaster);
    chimney(l, ...off(l, hx, hz, -0.14, -0.04), 0.17, 0.12);
    hangingSign(l, ...faceAt(l, hx, hz, 0.35, 0.25, '+z', -0.13, 0.004), 0.15, '#7a2a2a');
    for (let i = 0; i < 4; i++) barrel(l, 0.74 + (i % 2) * 0.035, 0.72 + Math.floor(i / 2) * 0.04);
    for (const x of [0.3, 0.48]) {
      wbox(l, x, 0.78, 0.05, 0.08, 0.008, 0.05, '#7a5634');
      for (const s of [-1, 1])
        wbox(l, ...off(l, x, 0.78, 0, s * 0.04), 0.04, 0.07, 0.006, 0.014, '#7a5634');
    }
    stoneWall(l, 0.1, 0.92, 0.32, 0.92, 0.03);
    horse(l, 0.2, 0.84, 0);
    workers(l, [
      [0.34, 0.7, '#7a3a2a', '#3a3a3c'],
      [0.52, 0.86, '#3a5a7a', '#8a6a3a'],
      [0.62, 0.72, '#5a6a4a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.64, 0.62, 0.14);
    for (const [x, z] of [
      [0.08, 0.1],
      [0.9, 0.1],
      [0.92, 0.92],
    ] as const)
      shrub(l, x, z, 0.04);
  },

  guild_tavern(l) {
    square(l, 'guild_tavern', 0.06, 0.66, 0.94, 0.96, '#a59d8c', 14);
    // Approved concept: raised stone plinth, cream plaster with rich dark-oak Tudor framing,
    // steep gabled roof, and a beer garden of tables under strung lamps.
    const hx = 0.42;
    const hz = 0.36;
    stoneBody(l, hx, hz, 0.36, 0.42, 0.03, 0.07, '#a49c8c');
    halfTimber(l, hx, hz, 0.34, 0.4, 0.1, 0.24, plaster);
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++)
        l.beam(
          [hx + (s * 0.171) / l.spanX, 0.12, hz + (-0.15 + i * 0.1) / l.spanZ],
          [hx + (s * 0.171) / l.spanX, 0.21, hz + (-0.1 + i * 0.1) / l.spanZ],
          0.008,
          timberDark,
        );
    wbox(l, hx, hz, 0.215, 0.36, 0.012, 0.42, timberDark);
    windows4(l, hx, hz, 0.34, 0.4, 0.13, 0.036, { frame: timberDark });
    windows4(l, hx, hz, 0.34, 0.4, 0.25, 0.034, { frame: timberDark });
    door(l, hx, hz, 0.34, 0.4, '+z', 0, 0.1, 0.06, 0.1, timberDark);
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        ...faceAt(l, hx, hz, 0.34, 0.4, '+z', 0, 0.015 + i * 0.012),
        0.03,
        0.1,
        0.07 - i * 0.022,
        0.014,
        '#bdb6a6',
      );
    shingleGable(l, hx, hz, 'z', 0.4, 0.34, 0.34, 0.2, '#5e4a38', plaster);
    chimney(l, ...off(l, hx, hz, -0.1, -0.1), 0.34, 0.2);
    hangingSign(l, ...faceAt(l, hx, hz, 0.34, 0.4, '+z', -0.12, 0.004), 0.22, '#2a4a7a');
    // Beer garden: trestle tables and benches, barrels, a lamp string between posts.
    for (const [x, z] of [
      [0.76, 0.24],
      [0.76, 0.44],
      [0.76, 0.64],
    ] as const) {
      wbox(l, x, z, 0.05, 0.1, 0.008, 0.05, '#7a5634');
      for (const s of [-1, 1])
        wbox(l, ...off(l, x, z, 0, s * 0.04), 0.04, 0.1, 0.006, 0.014, '#7a5634');
      for (let i = 0; i < 3; i++)
        wround(l, ...off(l, x, z, -0.03 + i * 0.03, 0), 0.005, 0.005, 0.058, 0.014, '#e8c84a', 6);
    }
    for (const z of [0.14, 0.74]) wround(l, 0.92, z, 0.004, 0.005, 0.03, 0.18, '#5c4630', 6);
    l.beam([0.92, 0.2, 0.14], [0.92, 0.2, 0.74], 0.002, '#2c2a28');
    for (let i = 0; i < 7; i++)
      wbox(l, 0.92, 0.18 + i * 0.09, 0.19, 0.008, 0.008, 0.008, '#ffd27a', 0, 0, 1);
    for (let i = 0; i < 6; i++) barrel(l, 0.12 + (i % 3) * 0.03, 0.82 + Math.floor(i / 3) * 0.035);
    horse(l, 0.5, 0.86, 0);
    cart(l, 0.64, 0.86, 0, 'barrels');
    workers(l, [
      [0.7, 0.34, '#7a3a2a', '#3a3a3c'],
      [0.82, 0.54, '#3a5a7a', '#8a6a3a'],
      [0.36, 0.74, '#5a6a4a', '#3a3a3c'],
      [0.72, 0.74, '#6a3a5a', '#e9e0c8'],
    ]);
    lanternPost(l, 0.3, 0.72, 0.15);
    shrub(l, 0.08, 0.1, 0.04);
  },

  grand_inn(l) {
    square(l, 'grand_inn', 0.04, 0.62, 0.96, 0.96, '#bdb6a6', 10);
    // Three-storey coaching inn: dressed stone ground floor, carved half-timbered upper
    // storeys jettied out, slate-and-terracotta roof with twin dormers, a coach arch.
    const hx = 0.46;
    const hz = 0.34;
    stoneBody(l, hx, hz, 0.5, 0.36, 0.03, 0.12, '#b0a894');
    windows4(l, hx, hz, 0.5, 0.36, 0.06, 0.04, { frame: '#5a4a3a' });
    halfTimber(l, hx, hz, 0.53, 0.39, 0.15, 0.11, plaster);
    halfTimber(l, hx, hz, 0.56, 0.42, 0.26, 0.1, plaster);
    windows4(l, hx, hz, 0.53, 0.39, 0.18, 0.036, { frame: timberDark });
    windows4(l, hx, hz, 0.56, 0.42, 0.29, 0.034, { frame: timberDark });
    for (const y of [0.15, 0.26]) wbox(l, hx, hz, y - 0.01, 0.58, 0.012, 0.44, timberDark);
    shingleGable(l, hx, hz, 'x', 0.56, 0.42, 0.36, 0.2, slate, plaster);
    for (let i = 0; i < 7; i++)
      wbox(l, ...off(l, hx, hz, -0.24 + i * 0.08, 0.22), 0.36, 0.07, 0.006, 0.01, terracotta);
    for (const s of [-1, 1]) {
      const [dx, dz] = off(l, hx, hz, s * 0.14, 0.14);
      wbox(l, dx, dz, 0.38, 0.07, 0.06, 0.06, plaster);
      window4(l, dx, dz, 0.07, 0.06, '+z', 0, 0.39, 0.026, { frame: timberDark });
      shingleGable(l, dx, dz, 'z', 0.07, 0.08, 0.44, 0.05, terracotta, plaster);
    }
    for (const s of [-1, 1]) chimney(l, ...off(l, hx, hz, s * 0.24, -0.08), 0.36, 0.22);
    faceBox(l, hx, hz, 0.5, 0.36, '+z', 0.12, 0.002, 0.03, 0.1, 0.11, 0.006, '#2a2420');
    door(l, hx, hz, 0.5, 0.36, '+z', -0.08, 0.03, 0.06, 0.1, timberDark);
    hangingSign(l, ...faceAt(l, hx, hz, 0.5, 0.36, '+z', -0.2, 0.004), 0.14, '#7a2a2a');
    clockFace(l, hx, hz, 0.56, 0.42, '+z', 0.33, 0.025);
    // Coach and horses at the arch, stables, a terrace with tables, lamps.
    horse(l, 0.62, 0.74, 0);
    horse(l, 0.62, 0.8, 0, '#3a2a20');
    wbox(l, 0.76, 0.77, 0.05, 0.1, 0.06, 0.06, '#2a3a5a');
    wbox(l, 0.76, 0.77, 0.11, 0.11, 0.008, 0.07, '#1a2a4a');
    for (const s of [-1, 1])
      wround(l, ...off(l, 0.76, 0.77, s * 0.04, 0.034), 0.02, 0.02, 0.03, 0.004, '#3a3530', 10);
    for (const x of [0.16, 0.32]) {
      wbox(l, x, 0.8, 0.05, 0.08, 0.008, 0.05, '#7a5634');
      for (const s of [-1, 1])
        wbox(l, ...off(l, x, 0.8, 0, s * 0.04), 0.04, 0.07, 0.006, 0.014, '#7a5634');
    }
    for (let i = 0; i < 4; i++) barrel(l, 0.9 + (i % 2) * 0.03, 0.66 + Math.floor(i / 2) * 0.035);
    workers(l, [
      [0.24, 0.7, '#7a3a2a', '#3a3a3c'],
      [0.46, 0.76, '#3a5a7a', '#8a6a3a'],
      [0.5, 0.9, '#5a6a4a', '#2c2c2e'],
      [0.88, 0.86, '#6a3a5a', '#e9e0c8'],
    ]);
    for (const [x, z] of [
      [0.06, 0.66],
      [0.94, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.16);
  },

  // -----------------------------------------------------------------------------------------
  // Chapel (1x1); the parish church follows its approved concept art
  // -----------------------------------------------------------------------------------------
  chapel(l) {
    square(l, 'chapel', 0.42, 0.66, 0.58, 0.96, '#b9b2a2', 20);
    // Wayside stone chapel: arched oak door, small front belfry, lancets and a rose window.
    const hx = 0.5;
    const hz = 0.42;
    stoneBody(l, hx, hz, 0.22, 0.34, 0.03, 0.18, '#bdb3a0');
    for (const t of [-0.08, 0.05])
      for (const f of ['+x', '-x'] as const)
        archWindow(l, hx, hz, 0.22, 0.34, f, t, 0.07, 0.026, 0.07, '#8a8274');
    roseWindow(l, hx, hz, 0.22, 0.34, '+z', 0.16, 0.026);
    archWindow(l, hx, hz, 0.22, 0.34, '+z', 0, 0.03, 0.05, 0.07, timberDark, '#5a3a24');
    shingleGable(l, hx, hz, 'z', 0.34, 0.22, 0.21, 0.16, slate, '#bdb3a0');
    const [bx, bz] = off(l, hx, hz, 0, 0.17);
    wbox(l, bx, bz, 0.37, 0.05, 0.06, 0.03, '#bdb3a0');
    faceBox(l, bx, bz, 0.05, 0.03, '+z', 0, 0.002, 0.38, 0.026, 0.036, 0.004, '#2c2a28');
    wround(l, bx, bz, 0.01, 0.012, 0.385, 0.02, brass, 8);
    l.shape(new THREE.ConeGeometry(0.035, 0.07, 4).rotateY(Math.PI / 4), slate, bx, bz, 0.465);
    wbox(l, bx, bz, 0.5, 0.004, 0.04, 0.004, brass);
    wbox(l, bx, bz, 0.52, 0.022, 0.004, 0.004, brass);
    // Churchyard: headstones, a yew, a lychgate on the path and flowers.
    for (let i = 0; i < 8; i++) {
      const x = i < 4 ? 0.14 + (i % 2) * 0.08 : 0.78 + (i % 2) * 0.08;
      const z = 0.3 + Math.floor((i % 4) / 2) * 0.2;
      wbox(l, x, z, 0.03, 0.03, 0.04, 0.008, tone('#a8a296', 0.08), (rand() - 0.5) * 0.3);
    }
    l.shape(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 1.3, 1), '#3f5a3a', 0.16, 0.82, 0.1);
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.5, 0.9, s * 0.05, 0), 0.03, 0.01, 0.1, 0.01, '#5c4630');
    l.shape(new THREE.BoxGeometry(0.14, 0.01, 0.06).rotateX(0.0), '#5c4630', 0.5, 0.9, 0.135);
    shingleGable(l, 0.5, 0.9, 'x', 0.12, 0.05, 0.13, 0.04, slate);
    flowerBed(l, 0.82, 0.86, 0.12, 0.06);
    workers(l, [[0.4, 0.74, '#2c2c2e', '#2c2c2e']]);
    lanternPost(l, 0.64, 0.72, 0.13);
    stoneWall(l, 0.04, 0.96, 0.4, 0.96, 0.03);
    stoneWall(l, 0.6, 0.96, 0.96, 0.96, 0.03);
  },

  parish_church(l) {
    square(l, 'parish_church', 0.36, 0.72, 0.64, 0.96, '#bdb6a6', 18);
    // Approved concept: limestone nave with stepped buttresses and lancet windows, a rose window
    // in the front gable, a square bell tower, and a walled forecourt with flower beds.
    const hx = 0.5;
    const hz = 0.4;
    stoneBody(l, hx, hz, 0.28, 0.42, 0.03, 0.04, '#9a9282');
    stoneBody(l, hx, hz, 0.26, 0.4, 0.07, 0.2, limestone);
    for (const t of [-0.15, -0.05, 0.05, 0.15])
      for (const s of [-1, 1]) {
        wbox(l, ...off(l, hx, hz, s * 0.14, t), 0.07, 0.026, 0.12, 0.024, '#bdb6a6');
        wbox(l, ...off(l, hx, hz, s * 0.136, t), 0.19, 0.016, 0.06, 0.02, limestone);
      }
    for (const t of [-0.1, 0, 0.1])
      for (const f of ['+x', '-x'] as const)
        archWindow(l, hx, hz, 0.26, 0.4, f, t, 0.1, 0.028, 0.1, '#8a8274', '#8ab0d8');
    roseWindow(l, hx, hz, 0.26, 0.4, '+z', 0.21, 0.036);
    archWindow(l, hx, hz, 0.26, 0.4, '+z', 0, 0.07, 0.05, 0.08, timberDark, '#5a3a24');
    shingleGable(l, hx, hz, 'z', 0.4, 0.26, 0.27, 0.2, slate, limestone);
    for (const e of [-1, 1])
      for (let k = 0; k < 4; k++)
        for (const s of [-1, 1])
          wbox(
            l,
            ...off(l, hx, hz, s * (0.11 - k * 0.028), e * 0.2),
            0.27 + k * 0.045,
            0.03,
            0.045,
            0.03,
            limestone,
          );
    // Bell tower at the back with louvred openings, pinnacles and a spire.
    const [tx, tz] = off(l, hx, hz, 0, -0.26);
    stoneBody(l, tx, tz, 0.12, 0.12, 0.03, 0.48, limestone);
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      archWindow(l, tx, tz, 0.12, 0.12, f, 0, 0.38, 0.04, 0.06, '#8a8274', '#2c2a28');
      archWindow(l, tx, tz, 0.12, 0.12, f, 0, 0.18, 0.02, 0.06, '#8a8274');
    }
    clockFace(l, tx, tz, 0.12, 0.12, '+z', 0.3, 0.024);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.shape(
        new THREE.ConeGeometry(0.012, 0.06, 4),
        limestone,
        ...off(l, tx, tz, a * 0.055, b * 0.055),
        0.54,
      );
    l.shape(new THREE.ConeGeometry(0.06, 0.22, 8).rotateY(Math.PI / 8), slate, tx, tz, 0.62);
    wbox(l, tx, tz, 0.73, 0.004, 0.05, 0.004, brass);
    wbox(l, tx, tz, 0.75, 0.026, 0.004, 0.004, brass);
    // Forecourt: low stone garden walls, rose and lavender beds, flagstone walk, two lamps.
    for (const s of [-1, 1]) {
      stoneWall(l, 0.5 + s * 0.14, 0.94, 0.5 + s * 0.46, 0.94);
      stoneWall(l, 0.5 + s * 0.46, 0.66, 0.5 + s * 0.46, 0.94);
      flowerBed(l, 0.5 + s * 0.28, 0.84, 0.16, 0.06);
      lanternPost(l, 0.5 + s * 0.12, 0.88, 0.14);
    }
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.1 + (i % 2) * 0.08,
        0.22 + Math.floor(i / 2) * 0.12,
        0.03,
        0.03,
        0.04,
        0.008,
        '#a8a296',
      );
    workers(l, [
      [0.44, 0.8, '#2c2c2e', '#2c2c2e'],
      [0.56, 0.84, '#6a3a5a', '#e9e0c8'],
    ]);
    for (const [x, z] of [
      [0.88, 0.2],
      [0.9, 0.42],
    ] as const)
      shrub(l, x, z, 0.04, '#3f5a3a');
  },

  sanctuary_chapel(l) {
    square(l, 'sanctuary_chapel', 0.06, 0.06, 0.94, 0.94, '#d8d2c5', 6);
    // Gothic sanctuary in white limestone: pinnacled buttresses, a verdigris roof with a gilded
    // crest, a sculpted portal under a radiant rose window, and twin front towers with spires.
    const hx = 0.5;
    const hz = 0.42;
    stoneBody(l, hx, hz, 0.3, 0.46, 0.03, 0.05, '#bdb6a6');
    stoneBody(l, hx, hz, 0.28, 0.44, 0.08, 0.26, marble);
    for (const t of [-0.17, -0.06, 0.05, 0.16])
      for (const s of [-1, 1]) {
        const [px, pz] = off(l, hx, hz, s * 0.16, t);
        wbox(l, px, pz, 0.08, 0.03, 0.22, 0.026, '#e2dccf');
        l.shape(new THREE.ConeGeometry(0.014, 0.08, 4), '#e2dccf', px, pz, 0.34);
        l.beam([px, 0.3, pz], [hx + (s * 0.13) / l.spanX, 0.33, pz], 0.01, '#e2dccf');
      }
    for (const t of [-0.12, 0, 0.12])
      for (const f of ['+x', '-x'] as const)
        archWindow(l, hx, hz, 0.28, 0.44, f, t, 0.12, 0.034, 0.14, brass, '#8ab0d8');
    shingleGable(l, hx, hz, 'z', 0.44, 0.28, 0.34, 0.24, '#5fa58e', marble);
    wbox(l, hx, hz, 0.58, 0.014, 0.02, 0.46, brass);
    roseWindow(l, hx, hz, 0.28, 0.44, '+z', 0.27, 0.05);
    archWindow(l, hx, hz, 0.28, 0.44, '+z', 0, 0.08, 0.07, 0.1, brass, '#5a3a24');
    for (const s of [-1, 1]) {
      const [tx, tz] = off(l, hx, hz, s * 0.12, 0.2);
      stoneBody(l, tx, tz, 0.1, 0.1, 0.03, 0.56, marble);
      for (const f of ['+z', '+x', '-x'] as const)
        archWindow(l, tx, tz, 0.1, 0.1, f, 0, 0.44, 0.03, 0.08, brass, '#2c2a28');
      l.shape(new THREE.ConeGeometry(0.055, 0.3, 8).rotateY(Math.PI / 8), '#5fa58e', tx, tz, 0.74);
      wround(l, tx, tz, 0.002, 0.006, 0.89, 0.05, brass, 6);
    }
    // Cloister garden, statues, fountain and pilgrims.
    for (let i = 0; i < 4; i++) flowerBed(l, 0.16 + i * 0.22, 0.86, 0.14, 0.06);
    wround(l, 0.5, 0.76, 0.05, 0.055, 0.034, 0.02, marble, 16);
    wround(l, 0.5, 0.76, 0.045, 0.045, 0.054, 0.002, '#5fa2b8', 16);
    for (const s of [-1, 1]) {
      const [sx, sz] = off(l, 0.5, 0.74, s * 0.2, 0);
      wbox(l, sx, sz, 0.03, 0.03, 0.04, 0.03, '#d8d2c5');
      wround(l, sx, sz, 0.008, 0.012, 0.07, 0.05, marble, 8);
      l.shape(new THREE.SphereGeometry(0.009, 8, 6), marble, sx, sz, 0.128);
    }
    for (const [x, z] of [
      [0.1, 0.1],
      [0.9, 0.1],
      [0.1, 0.7],
      [0.9, 0.7],
    ] as const)
      lanternPost(l, x, z, 0.17);
    workers(l, [
      [0.36, 0.74, '#2c2c2e', '#2c2c2e'],
      [0.64, 0.78, '#6a3a5a', '#e9e0c8'],
      [0.44, 0.92, '#3a5a7a', '#8a6a3a'],
    ]);
  },

  // -----------------------------------------------------------------------------------------
  // Library (3x3); the grand library follows its approved concept art
  // -----------------------------------------------------------------------------------------
  public_library(l) {
    square(l, 'public_library', 0.08, 0.08, 0.92, 0.92, '#c4bca8', 12);
    // Brick library with a central domed reading rotunda and a four-column entrance portico.
    const hx = 0.5;
    const hz = 0.4;
    brickBody(l, hx, hz, 0.9, 0.5, 0.03, 0.26, '#a24a35');
    hallFacade(l, hx, hz, 0.9, 0.5, 0.03, 0.26, '#a24a35', {
      bay: 0.1,
      trim: limestone,
      skip: [['+z', 4]],
    });
    tinGable(l, hx, hz, 'x', 0.9, 0.5, 0.29, 0.12, slate, '#a24a35');
    wround(l, hx, hz, 0.17, 0.18, 0.29, 0.1, limestone, 20);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      wbox(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.175, Math.sin(a) * 0.175),
        0.31,
        0.04,
        0.06,
        0.004,
        pane,
        -a + Math.PI / 2,
        0,
        1,
      );
    }
    const dome = new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(dome, '#6e777b', hx, hz, 0.39);
    wround(l, hx, hz, 0.02, 0.03, 0.55, 0.05, limestone, 10);
    const [px, pz] = faceAt(l, hx, hz, 0.9, 0.5, '+z', 0, 0.06);
    for (const s of [-1, -0.33, 0.33, 1])
      wround(l, ...off(l, px, pz, s * 0.1, 0), 0.013, 0.015, 0.05, 0.2, limestone, 10);
    for (let i = 0; i < 3; i++)
      wbox(l, px, pz + (0.04 + i * 0.02) / l.spanZ, 0.03, 0.26, 0.02 - i * 0.005, 0.02, limestone);
    wbox(l, px, pz, 0.25, 0.26, 0.03, 0.1, limestone);
    door(l, hx, hz, 0.9, 0.5, '+z', 0, 0.03, 0.08, 0.14, timberDark);
    // Forecourt: lawns, trees, benches, a bicycle rack of book carts, readers.
    for (const s of [-1, 1]) {
      flowerBed(l, 0.5 + s * 0.28, 0.82, 0.3, 0.08);
      for (let i = 0; i < 3; i++) shrub(l, 0.5 + s * (0.18 + i * 0.1), 0.92, 0.04, '#3f6a3a');
      bench(l, 0.5 + s * 0.16, 0.72, 0);
      lanternPost(l, 0.5 + s * 0.08, 0.78, 0.17);
    }
    workers(l, [
      [0.38, 0.7, '#3a5a7a', '#8a6a3a'],
      [0.62, 0.74, '#6a3a5a', '#e9e0c8'],
      [0.5, 0.86, '#5a6a4a', '#2c2c2e'],
    ]);
    signboard(l, 0.86, 0.72, 0.09, 0.14, '#2f3a44');
  },

  grand_library(l) {
    square(l, 'grand_library', 0.04, 0.04, 0.96, 0.96, '#c2baa6', 8);
    // Approved concept: rusticated plinth and warm limestone block with quoins, tall arched
    // reading-room windows glowing between pilasters, a carved entablature and balustrade.
    const hx = 0.5;
    const hz = 0.4;
    const w = 1.2;
    const d = 0.7;
    stoneBody(l, hx, hz, w + 0.04, d + 0.04, 0.03, 0.1, '#8a8274', 0.05);
    stoneBody(l, hx, hz, w, d, 0.13, 0.4, limestone, 0.05);
    quoins(l, hx, hz, w, d, 0.13, 0.4, '#e2dccf');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? w : d;
      const n = Math.round(len / 0.16);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        if (f === '+z' && Math.abs(t) < 0.2) continue;
        archWindow(l, hx, hz, w, d, f, t, 0.2, 0.06, 0.22, timberDark);
        faceBox(l, hx, hz, w, d, f, t + len / n / 2, 0.006, 0.13, 0.03, 0.4, 0.01, '#e2dccf');
        wbox(
          l,
          ...faceAt(l, hx, hz, w, d, f, t + len / n / 2, 0.012),
          0.5,
          0.04,
          0.03,
          0.04,
          '#e2dccf',
        );
      }
    }
    wbox(l, hx, hz, 0.53, w + 0.04, 0.04, d + 0.04, '#e2dccf');
    wbox(l, hx, hz, 0.57, w + 0.02, 0.02, d + 0.02, '#c4bca8');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? w : d;
      for (let i = 0; i < Math.round(len / 0.03); i++)
        faceBox(
          l,
          hx,
          hz,
          w,
          d,
          f,
          -len / 2 + 0.015 + i * 0.03,
          -0.012,
          0.59,
          0.01,
          0.04,
          0.01,
          '#e2dccf',
        );
    }
    tinGable(l, hx, hz, 'x', w - 0.08, d - 0.08, 0.59, 0.16, '#786b59');
    // Portico with Corinthian columns and a pediment over the grand stair.
    const [px, pz] = faceAt(l, hx, hz, w, d, '+z', 0, 0.1);
    for (let i = 0; i < 6; i++) {
      const [cx, cz] = off(l, px, pz, -0.2 + i * 0.08, 0);
      wround(l, cx, cz, 0.016, 0.018, 0.13, 0.4, '#efe9dc', 12);
      wbox(l, cx, cz, 0.52, 0.04, 0.02, 0.04, '#e2dccf');
    }
    wbox(l, px, pz, 0.54, 0.48, 0.04, 0.2, '#e2dccf');
    const ped = new THREE.Shape();
    ped.moveTo(-0.25, 0);
    ped.lineTo(0.25, 0);
    ped.lineTo(0, 0.1);
    ped.closePath();
    l.shape(
      new THREE.ExtrudeGeometry(ped, { depth: 0.2, bevelEnabled: false }).translate(0, 0, -0.1),
      '#efe9dc',
      px,
      pz,
      0.58,
    );
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        px,
        pz + (0.11 + i * 0.022) / l.spanZ,
        0.03,
        0.5 - i * 0.02,
        0.1 - i * 0.016,
        0.022,
        '#d8d0bc',
      );
    door(l, hx, hz, w, d, '+z', 0, 0.13, 0.1, 0.2, timberDark);
    // Forecourt gardens, reading benches, lamps, statues of scholars.
    for (const s of [-1, 1]) {
      flowerBed(l, 0.5 + s * 0.3, 0.84, 0.4, 0.1);
      for (let i = 0; i < 2; i++) bench(l, 0.5 + s * (0.22 + i * 0.14), 0.74, 0);
      const [sx, sz] = off(l, 0.5, 0.74, s * 0.12, 0);
      wbox(l, sx, sz, 0.03, 0.05, 0.06, 0.05, limestone);
      wround(l, sx, sz, 0.012, 0.016, 0.09, 0.08, '#c4bca8', 8);
      l.shape(new THREE.SphereGeometry(0.014, 8, 6), '#c4bca8', sx, sz, 0.185);
      for (const k of [0.1, 0.4]) lanternPost(l, 0.5 + s * k, 0.92, 0.18);
    }
    workers(l, [
      [0.36, 0.72, '#3a5a7a', '#8a6a3a'],
      [0.64, 0.7, '#6a3a5a', '#e9e0c8'],
      [0.46, 0.9, '#5a6a4a', '#2c2c2e'],
      [0.58, 0.86, '#7a3a2a', '#2c2c2e'],
    ]);
    for (const [x, z] of [
      [0.06, 0.08],
      [0.94, 0.08],
    ] as const)
      shrub(l, x, z, 0.06, '#3f6a3a');
  },

  royal_archive(l) {
    square(l, 'royal_archive', 0.02, 0.02, 0.98, 0.98, '#d8d2c4', 4);
    // Beaux-Arts archive: two-storey marble block, a soaring ribbed verdigris-and-gold dome,
    // two wing cupolas, a six-column gilded portico and twin forecourt fountains.
    const hx = 0.5;
    const hz = 0.38;
    const w = 1.25;
    const d = 0.7;
    stoneBody(l, hx, hz, w + 0.04, d + 0.04, 0.03, 0.08, '#a49c8c', 0.05);
    renderBody(l, hx, hz, w, d, 0.11, 0.46, marble, '#c4bca8');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? w : d;
      const n = Math.round(len / 0.14);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        if (f === '+z' && Math.abs(t) < 0.24) continue;
        archWindow(l, hx, hz, w, d, f, t, 0.16, 0.05, 0.14, brass);
        window4(l, hx, hz, w, d, f, t, 0.38, 0.05, { frame: brass });
      }
    }
    wbox(l, hx, hz, 0.57, w + 0.04, 0.04, d + 0.04, '#e2dccf');
    wbox(l, hx, hz, 0.61, w, 0.03, d, '#c4bca8');
    // Central dome on a colonnaded drum.
    wround(l, hx, hz, 0.25, 0.27, 0.64, 0.06, '#e2dccf', 28);
    wround(l, hx, hz, 0.22, 0.22, 0.7, 0.16, marble, 28);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      wround(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.23, Math.sin(a) * 0.23),
        0.01,
        0.011,
        0.7,
        0.16,
        '#efe9dc',
        8,
      );
      wbox(
        l,
        ...off(l, hx, hz, Math.cos(a + 0.2) * 0.222, Math.sin(a + 0.2) * 0.222),
        0.72,
        0.05,
        0.1,
        0.004,
        pane,
        -a - 0.2 + Math.PI / 2,
        0,
        1,
      );
    }
    const dome = new THREE.SphereGeometry(0.23, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(
      1,
      1.15,
      1,
    );
    l.shape(dome, copper, hx, hz, 0.86);
    for (let i = 0; i < 12; i++) {
      const rib = new THREE.TorusGeometry(0.232, 0.006, 4, 16, Math.PI / 2)
        .scale(1, 1.15, 1)
        .rotateY((i / 12) * Math.PI * 2);
      l.shape(rib, brass, hx, hz, 0.86);
    }
    wround(l, hx, hz, 0.04, 0.05, 1.16, 0.08, brass, 12);
    l.shape(new THREE.SphereGeometry(0.03, 10, 8), '#ffd27a', hx, hz, 1.27, 1);
    for (const s of [-1, 1]) {
      const [cx, cz] = off(l, hx, hz, s * 0.46, 0);
      wround(l, cx, cz, 0.09, 0.1, 0.64, 0.08, '#e2dccf', 16);
      const cup = new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      l.shape(cup, copper, cx, cz, 0.72);
      wround(l, cx, cz, 0.004, 0.012, 0.8, 0.06, brass, 6);
    }
    // Six-column portico with a gilded pediment and a grand stair.
    const [px, pz] = faceAt(l, hx, hz, w, d, '+z', 0, 0.12);
    for (let i = 0; i < 6; i++)
      wround(l, ...off(l, px, pz, -0.25 + i * 0.1, 0), 0.02, 0.022, 0.11, 0.44, '#efe9dc', 12);
    wbox(l, px, pz, 0.55, 0.58, 0.05, 0.24, '#e2dccf');
    const ped = new THREE.Shape();
    ped.moveTo(-0.3, 0);
    ped.lineTo(0.3, 0);
    ped.lineTo(0, 0.12);
    ped.closePath();
    l.shape(
      new THREE.ExtrudeGeometry(ped, { depth: 0.24, bevelEnabled: false }).translate(0, 0, -0.12),
      brass,
      px,
      pz,
      0.6,
    );
    for (let i = 0; i < 7; i++)
      wbox(
        l,
        px,
        pz + (0.13 + i * 0.02) / l.spanZ,
        0.03,
        0.62 - i * 0.02,
        0.09 - i * 0.012,
        0.022,
        '#d8d0bc',
      );
    door(l, hx, hz, w, d, '+z', 0, 0.11, 0.12, 0.22, '#2f3a44');
    // Twin fountains, parterre gardens, statues, lamps and visitors.
    for (const s of [-1, 1]) {
      const [fx, fz] = off(l, 0.5, 0.78, s * 0.4, 0);
      wround(l, fx, fz, 0.12, 0.125, 0.034, 0.03, marble, 24);
      wround(l, fx, fz, 0.11, 0.11, 0.064, 0.002, '#5fa2b8', 24);
      wround(l, fx, fz, 0.03, 0.04, 0.064, 0.05, marble, 12);
      wround(l, fx, fz, 0.012, 0.016, 0.114, 0.06, marble, 8);
      l.shape(new THREE.ConeGeometry(0.02, 0.05, 8).rotateX(Math.PI), '#bfe0e6', fx, fz, 0.2, 0.3);
      flowerBed(l, 0.5 + s * 0.2, 0.92, 0.3, 0.06);
      for (const k of [0.08, 0.3, 0.44]) lanternPost(l, 0.5 + s * k, 0.66, 0.2);
    }
    workers(l, [
      [0.4, 0.72, '#3a5a7a', '#8a6a3a'],
      [0.6, 0.74, '#6a3a5a', '#e9e0c8'],
      [0.5, 0.86, '#2c2c2e', '#2c2c2e'],
      [0.28, 0.86, '#7a3a2a', '#2c2c2e'],
      [0.72, 0.86, '#5a6a4a', '#2c2c2e'],
    ]);
  },

  // -----------------------------------------------------------------------------------------
  // Single civic sites
  // -----------------------------------------------------------------------------------------
  community_classroom(l) {
    square(l, 'community_classroom', 0.08, 0.6, 0.92, 0.94, '#c4bca8', 20);
    // Timber schoolroom with a bell, an open-air classroom of benches facing a blackboard,
    // a vegetable plot and a playground with a swing.
    const hx = 0.46;
    const hz = 0.24;
    stoneBody(l, hx, hz, 0.6, 0.3, 0.03, 0.03, '#a49c8c');
    renderBody(l, hx, hz, 0.58, 0.28, 0.06, 0.16, '#e8dcc0', '#8a6a48');
    windows4(l, hx, hz, 0.58, 0.28, 0.09, 0.04, { frame: '#2f6f9a' });
    door(l, hx, hz, 0.58, 0.28, '+z', 0, 0.06, 0.06, 0.1, '#2f6f9a');
    shingleGable(l, hx, hz, 'x', 0.58, 0.28, 0.22, 0.12, '#8a4a30', '#e8dcc0');
    const [bx, bz] = off(l, hx, hz, 0.2, 0);
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, bx, bz, a * 0.02, b * 0.02), 0.32, 0.006, 0.06, 0.006, '#e8dcc0');
    wround(l, bx, bz, 0.012, 0.016, 0.33, 0.022, brass, 10);
    l.shape(new THREE.ConeGeometry(0.035, 0.04, 4).rotateY(Math.PI / 4), '#8a4a30', bx, bz, 0.4);
    // Outdoor classroom.
    wbox(l, 0.46, 0.46, 0.03, 0.16, 0.12, 0.012, '#2a3a2a');
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.46, 0.46, s * 0.08, 0), 0.03, 0.008, 0.14, 0.008, '#7a5634');
    for (let r = 0; r < 3; r++)
      for (const s of [-1, 1]) {
        const [x, z] = off(l, 0.46, 0.46, s * 0.09, 0.08 + r * 0.07);
        wbox(l, x, z, 0.045, 0.12, 0.006, 0.02, '#7a5634');
        for (const k of [-1, 1])
          wbox(l, ...off(l, x, z, k * 0.05, 0), 0.03, 0.006, 0.015, 0.016, '#5c4630');
      }
    workers(l, [
      [0.46, 0.5, '#3a5a7a', '#2c2c2e'],
      [0.36, 0.62, '#c84a3a', '#e8c84a'],
      [0.56, 0.62, '#2f6f9a', '#e8c84a'],
      [0.36, 0.7, '#3f8a6a', '#e8c84a'],
      [0.56, 0.7, '#d8843a', '#e8c84a'],
    ]);
    // Vegetable plot and swing.
    for (let i = 0; i < 4; i++) {
      wbox(l, 0.14, 0.42 + i * 0.07, 0.03, 0.12, 0.012, 0.04, '#6f4c34');
      for (let k = 0; k < 4; k++)
        shrub(l, ...off(l, 0.14, 0.42 + i * 0.07, -0.045 + k * 0.03, 0), 0.01, '#4f8a3a');
    }
    for (const s of [-1, 1])
      l.beam([0.82 + (s * 0.05) / l.spanX, 0.03, 0.5], [0.82, 0.16, 0.5], 0.008, '#7a5634');
    l.beam(
      [0.82, 0.16, 0.5 - 0.05 / l.spanZ],
      [0.82, 0.16, 0.5 + 0.05 / l.spanZ],
      0.008,
      '#7a5634',
    );
    for (const s of [-1, 1])
      l.beam(
        [0.82, 0.16, 0.5 + (s * 0.015) / l.spanZ],
        [0.82, 0.07, 0.5 + (s * 0.015) / l.spanZ],
        0.002,
        '#2c2a28',
      );
    wbox(l, 0.82, 0.5, 0.068, 0.012, 0.004, 0.036, '#c84a3a');
    for (const [x, z] of [
      [0.12, 0.88],
      [0.88, 0.88],
      [0.5, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.15);
    for (let i = 0; i < 5; i++) shrub(l, 0.2 + i * 0.12, 0.8, 0.03, '#3f6a3a');
    signboard(l, 0.88, 0.7, 0.09, 0.12, '#2f6f9a', Math.PI / 2);
  },

  research_campus(l) {
    square(l, 'research_campus', 0.04, 0.04, 0.96, 0.96, '#c9c3b4', 10);
    // A quad of brick laboratories round a lawn: a lecture hall with a clock, an observatory
    // dome, a glasshouse, a lab block with roof vents, paths, trees and scholars.
    const lab = (x: number, z: number, w: number, d: number, h: number): void => {
      brickBody(l, x, z, w, d, 0.03, h, '#a24a35');
      hallFacade(l, x, z, w, d, 0.03, h, '#a24a35', { bay: 0.15, trim: limestone });
    };
    lab(0.28, 0.2, 1.0, 0.36, 0.3);
    tinGable(l, 0.28, 0.2, 'x', 1.0, 0.36, 0.33, 0.12, slate, '#a24a35');
    clockFace(l, 0.28, 0.2, 1.0, 0.36, '+z', 0.24, 0.04);
    const [cx, cz] = off(l, 0.28, 0.2, 0, 0.18);
    wbox(l, cx, cz, 0.03, 0.14, 0.38, 0.08, limestone);
    l.shape(new THREE.ConeGeometry(0.09, 0.14, 4).rotateY(Math.PI / 4), slate, cx, cz, 0.48);
    lab(0.8, 0.3, 0.4, 0.7, 0.24);
    for (let i = 0; i < 4; i++) {
      const [vx, vz] = off(l, 0.8, 0.3, 0, -0.27 + i * 0.18);
      wbox(l, vx, vz, 0.27, 0.32, 0.02, 0.6, '#3a3f42');
      wround(l, vx, vz, 0.02, 0.025, 0.29, 0.06, '#8a8f94', 10);
    }
    // Observatory: round drum, a slatted silver dome with the shutter open and a telescope.
    const ox = 0.2;
    const oz = 0.66;
    wround(l, ox, oz, 0.16, 0.17, 0.03, 0.24, limestone, 20);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, ox, oz, Math.cos(a) * 0.165, Math.sin(a) * 0.165),
        0.12,
        0.04,
        0.06,
        0.004,
        pane,
        -a + Math.PI / 2,
        0,
        1,
      );
    }
    const od = new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 1.8, 0, Math.PI / 2);
    l.shape(od, '#c9cdd0', ox, oz, 0.27);
    l.beam([ox, 0.3, oz], [ox + 0.08 / l.spanX, 0.42, oz + 0.04 / l.spanZ], 0.03, '#3a3f42');
    // Glasshouse with a white frame.
    const gx = 0.66;
    const gz = 0.8;
    wbox(l, gx, gz, 0.03, 0.4, 0.04, 0.22, '#e9e4d6');
    wbox(l, gx, gz, 0.07, 0.38, 0.12, 0.2, '#bfe0e6', 0, 0, 0.3);
    const roof = new THREE.CylinderGeometry(0.1, 0.1, 0.38, 14, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(roof, '#bfe0e6', gx, gz, 0.19, 0.3);
    for (let i = 0; i < 9; i++) {
      wbox(l, ...off(l, gx, gz, -0.19 + i * 0.0475, 0), 0.07, 0.006, 0.12, 0.21, '#f2efe6');
      l.shape(
        new THREE.TorusGeometry(0.1, 0.003, 4, 12, Math.PI).rotateY(Math.PI / 2),
        '#f2efe6',
        ...off(l, gx, gz, -0.19 + i * 0.0475, 0),
        0.19,
      );
    }
    for (let i = 0; i < 6; i++) shrub(l, ...off(l, gx, gz, -0.15 + i * 0.06, 0), 0.025, '#4f8a3a');
    // Quad lawn with cross paths, trees, benches and scholars.
    wbox(l, 0.46, 0.56, 0.032, 0.6, 0.004, 0.5, '#79a24a');
    wbox(l, 0.46, 0.56, 0.036, 0.6, 0.002, 0.05, '#d2cab6');
    wbox(l, 0.46, 0.56, 0.036, 0.05, 0.002, 0.5, '#d2cab6');
    for (const [x, z] of [
      [0.38, 0.46],
      [0.54, 0.46],
      [0.38, 0.66],
      [0.54, 0.66],
    ] as const) {
      wround(l, x, z, 0.012, 0.016, 0.03, 0.1, '#5b4330', 6);
      l.shape(new THREE.SphereGeometry(0.07, 10, 8), tone('#4f8a3a', 0.1), x, z, 0.18);
    }
    for (const [x, z, ry] of [
      [0.46, 0.44, 0],
      [0.46, 0.68, Math.PI],
    ] as const)
      bench(l, x, z, ry);
    workers(l, [
      [0.44, 0.52, '#3a5a7a', '#2c2c2e'],
      [0.5, 0.6, '#f2efe6', '#2c2c2e'],
      [0.62, 0.56, '#6a3a5a', '#2c2c2e'],
      [0.3, 0.44, '#5a6a4a', '#2c2c2e'],
      [0.7, 0.66, '#f2efe6', '#2c2c2e'],
    ]);
    for (const [x, z] of [
      [0.06, 0.4],
      [0.94, 0.74],
      [0.4, 0.94],
      [0.06, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.18);
    truck(l, 0.9, 0.92, 0, '#2f3a44');
    signboard(l, 0.2, 0.94, 0.09, 0.16, '#2f3a44');
  },

  herb_garden(l) {
    square(l, 'herb_garden', 0.42, 0.42, 0.58, 0.96, '#b9ad94', 20);
    // Physic garden: raised herb beds, a potting shed, cold frames, beehives and a sundial.
    for (const [x, z] of [
      [0.2, 0.2],
      [0.2, 0.44],
      [0.2, 0.68],
      [0.8, 0.44],
      [0.8, 0.68],
    ] as const) {
      wbox(l, x, z, 0.03, 0.2, 0.03, 0.12, '#7a5634');
      wbox(l, x, z, 0.06, 0.18, 0.004, 0.1, '#5a4a3a');
      for (let i = 0; i < 6; i++)
        shrub(
          l,
          ...off(l, x, z, -0.07 + (i % 3) * 0.07, i < 3 ? -0.025 : 0.025),
          0.018,
          ['#4f8a3a', '#7aa85a', '#8a6ab8', '#5a7a3a', '#c8b84a', '#6a9a6a'][i]!,
        );
    }
    const sx = 0.78;
    const sz = 0.18;
    renderBody(l, sx, sz, 0.16, 0.12, 0.03, 0.1, '#e8dcc0', '#8a6a48');
    window4(l, sx, sz, 0.16, 0.12, '+z', 0.03, 0.06, 0.026, { shutters: '#3f6a5a' });
    door(l, sx, sz, 0.16, 0.12, '-x', 0, 0.03, 0.04, 0.07, '#3f6a5a');
    shingleGable(l, sx, sz, 'x', 0.16, 0.12, 0.13, 0.06, terracotta, '#e8dcc0');
    for (let i = 0; i < 3; i++) {
      const [fx, fz] = off(l, 0.2, 0.9, -0.08 + i * 0.08, 0);
      wbox(l, fx, fz, 0.03, 0.07, 0.03, 0.05, '#e9e4d6');
      l.shape(new THREE.BoxGeometry(0.07, 0.004, 0.05).rotateX(0.3), '#bfe0e6', fx, fz, 0.065, 0.3);
    }
    for (let i = 0; i < 3; i++) {
      const [hx2, hz2] = off(l, 0.82, 0.9, -0.06 + i * 0.06, 0);
      wbox(l, hx2, hz2, 0.03, 0.03, 0.02, 0.03, '#7a5634');
      for (let k = 0; k < 3; k++)
        wbox(l, hx2, hz2, 0.05 + k * 0.012, 0.034 - k * 0.004, 0.012, 0.034 - k * 0.004, '#e8c84a');
    }
    wbox(l, 0.5, 0.56, 0.03, 0.03, 0.06, 0.03, limestone);
    l.shape(new THREE.ConeGeometry(0.02, 0.03, 3).rotateZ(Math.PI / 2), brass, 0.5, 0.56, 0.1);
    workers(l, [
      [0.36, 0.5, '#5a6a4a', '#d8c08a'],
      [0.64, 0.74, '#6a3a5a', '#d8c08a'],
    ]);
    lanternPost(l, 0.5, 0.88, 0.13);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.94],
    ] as const)
      shrub(l, x, z, 0.04, '#3f6a3a');
  },
};

/** Painted ambulance bay lines in front of the hospital. */
function apronLine(l: Lot): void {
  wbox(l, 0.82, 0.84, 0.0395, 0.18, 0.001, 0.1, '#b0aca2');
  for (const s of [-1, 1])
    wbox(l, ...off(l, 0.82, 0.84, s * 0.08, 0), 0.04, 0.004, 0.001, 0.1, '#e8c84a');
}
