import * as THREE from 'three';
import {
  barrel,
  cart,
  chimney,
  crate,
  door,
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
};

/** Painted ambulance bay lines in front of the hospital. */
function apronLine(l: Lot): void {
  wbox(l, 0.82, 0.84, 0.0395, 0.18, 0.001, 0.1, '#b0aca2');
  for (const s of [-1, 1])
    wbox(l, ...off(l, 0.82, 0.84, s * 0.08, 0), 0.04, 0.004, 0.001, 0.1, '#e8c84a');
}
