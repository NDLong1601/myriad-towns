import * as THREE from 'three';
import {
  door,
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
  hallFacade,
  iron,
  pane,
  signboard,
  timberDark,
} from './industryKit';
import { brickBody, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Civic group: the library chain and the single civic sites,
// drawn at the shared tile scale (0.77 units a tile).

const grass = '#79a24a';
const limestone = '#d8d0bc';
const marble = '#ece7dc';
const brass = '#c9a24a';
const copper = '#5fa58e';
const slate = '#4d5a66';
const terracotta = '#b4613f';

// ---------------------------------------------------------------------------------------------
// Local kit
// ---------------------------------------------------------------------------------------------

/** Lawn with a flagstone square; returns nothing, just lays the ground. */
export function square(
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

/** Corner quoins: alternating long and short stones up each corner. */
export function quoins(
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
export function archWindow(
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

/** Flower bed in a low stone kerb. */
export function flowerBed(l: Lot, x: number, z: number, w: number, d: number, ry = 0): void {
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

/** Bench. */
export function bench(l: Lot, x: number, z: number, ry = 0): void {
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

export const civicDiorama: Recipes = {
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
