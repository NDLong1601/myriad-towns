import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  chimney,
  crate,
  cypress,
  door,
  halfTimber,
  horse,
  lanternPost,
  meadow,
  off,
  path,
  railFence,
  rand,
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
import { dog, dryingRack, logBody, smoke, waterSheet } from './dioramaProps';
import {
  beehiveKiln,
  faceAt,
  faceBox,
  iron,
  jibCrane,
  ladder,
  logPile,
  lumberStack,
  pallet,
  pane,
  signboard,
  timberDark,
} from './industryKit';
import { blockStack, rockMass, rubble, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B extras: rural trades drawn as dioramas in the shared 0.77-unit frame.

const grass = '#79a24a';
const snow = '#eef3f4';
const sand = '#e2d2a6';
const salt = '#f4f2ea';

/** Grass lot with a worn yard patch in the given colour. */
function yardGround(
  l: Lot,
  seed: string,
  floor: string,
  patch: [number, number, number, number],
  tufts = 22,
  base = grass,
): void {
  reseed(seed);
  meadow(l, base, tufts);
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
  for (let i = 0; i < 30; i++)
    wbox(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      0.038,
      0.01 + rand() * 0.02,
      0.004,
      0.01 + rand() * 0.02,
      tone(shade(floor, 0.85), 0.3),
      rand() * 3,
    );
}

/** Conifer: trunk and stacked cones, optionally snow-capped. */
function pine(l: Lot, x: number, z: number, h: number, snowy = false): void {
  wround(l, x, z, 0.006, 0.009, 0.03, h * 0.25, '#5b4330', 6);
  for (let i = 0; i < 3; i++) {
    const r = h * (0.24 - i * 0.06);
    const y = 0.03 + h * (0.2 + i * 0.22);
    l.shape(new THREE.ConeGeometry(r, h * 0.36, 8), tone('#3f6a3a', 0.08), x, z, y + h * 0.18);
    if (snowy) l.shape(new THREE.ConeGeometry(r * 0.55, h * 0.16, 8), snow, x, z, y + h * 0.29);
  }
}

/** Tree stump with a pale cut top. */
function stump(l: Lot, x: number, z: number, r = 0.014): void {
  wround(l, x, z, r, r * 1.15, 0.03, 0.02, '#6b4a2c', 8);
  wround(l, x, z, r * 0.9, r * 0.9, 0.05, 0.002, '#d8b27a', 8);
}

/** Split firewood stacked between two posts, under a plank cap. */
function woodStack(l: Lot, x: number, z: number, len: number, ry = 0): void {
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, (Math.cos(ry) * s * len) / 2, (-Math.sin(ry) * s * len) / 2),
      0.03,
      0.008,
      0.08,
      0.008,
      '#5c4630',
    );
  for (let k = 0; k < 4; k++)
    for (let i = 0; i < Math.round(len / 0.018); i++) {
      const t = -len / 2 + 0.009 + i * 0.018;
      const g = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 5).rotateX(Math.PI / 2).rotateY(ry);
      l.shape(
        g,
        tone('#9a7a52', 0.14),
        ...off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t),
        0.04 + k * 0.016,
      );
    }
  wbox(l, x, z, 0.1, len + 0.02, 0.006, 0.04, '#6b5a48', ry);
}

/** Chopping block with an axe and a few split pieces. */
function choppingBlock(l: Lot, x: number, z: number): void {
  stump(l, x, z, 0.016);
  l.beam([x, 0.05, z], [x + 0.02 / l.spanX, 0.08, z + 0.01 / l.spanZ], 0.004, '#8a6a48');
  wbox(l, x + 0.02 / l.spanX, z + 0.01 / l.spanZ, 0.075, 0.012, 0.01, 0.004, '#8a8f94');
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      ...off(l, x, z, 0.03 + rand() * 0.03, -0.02 + rand() * 0.04),
      0.034,
      0.02,
      0.008,
      0.008,
      '#c9a86e',
      rand() * 3,
    );
}

/** Saplings in nursery rows. */
function nursery(l: Lot, x0: number, z0: number, x1: number, z1: number): void {
  wbox(
    l,
    (x0 + x1) / 2,
    (z0 + z1) / 2,
    0.03,
    (x1 - x0) * l.spanX,
    0.008,
    (z1 - z0) * l.spanZ,
    '#6f4c34',
  );
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const x = x0 + ((c + 0.5) / 5) * (x1 - x0);
      const z = z0 + ((r + 0.5) / 4) * (z1 - z0);
      wround(l, x, z, 0.002, 0.003, 0.038, 0.02, '#5b4330', 4);
      l.shape(new THREE.ConeGeometry(0.012, 0.03, 6), tone('#4f8a3a', 0.1), x, z, 0.068);
    }
}

/** Wheelbarrow. */
function barrow(l: Lot, x: number, z: number, ry: number, load = '#8a8274'): void {
  wbox(l, x, z, 0.04, 0.04, 0.016, 0.028, '#6b5a48', ry);
  wbox(l, x, z, 0.05, 0.036, 0.008, 0.024, load, ry);
  wround(
    l,
    ...off(l, x, z, Math.cos(ry) * 0.026, -Math.sin(ry) * 0.026),
    0.008,
    0.008,
    0.034,
    0.004,
    '#3a3530',
    8,
  );
}

/** Conical heap of loose material. */
function cone(l: Lot, x: number, z: number, r: number, color: string): void {
  l.shape(new THREE.ConeGeometry(r, r * 0.8, 12), tone(color, 0.05), x, z, 0.03 + r * 0.4);
}

export const ruralDiorama: Recipes = {
  woodcutter(l) {
    yardGround(l, 'woodcutter', '#8a7458', [0.18, 0.2, 0.82, 0.86], 26);
    // Log cabin with a stone chimney, a wood store and the chopping yard.
    const hx = 0.4;
    const hz = 0.36;
    logBody(l, hx, hz, 0.24, 0.18, 0.03, 0.12);
    window4(l, hx, hz, 0.24, 0.18, '+z', 0.06, 0.07, 0.028, { shutters: '#5a6a3a' });
    door(l, hx, hz, 0.24, 0.18, '+z', -0.05, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, hx, hz, 'x', 0.24, 0.18, 0.15, 0.08, '#5e4a38', '#8a6142');
    chimney(l, ...off(l, hx, hz, 0.1, -0.03), 0.12, 0.13, '#8a8274');
    smoke(l, ...off(l, hx, hz, 0.1, -0.03), 0.28, 2);
    woodStack(l, 0.74, 0.3, 0.16, Math.PI / 2);
    choppingBlock(l, 0.56, 0.62);
    wbox(l, 0.36, 0.68, 0.03, 0.006, 0.04, 0.05, '#5c4630', 0.6);
    wbox(l, 0.42, 0.68, 0.03, 0.006, 0.04, 0.05, '#5c4630', -0.6);
    const sawLog = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8).rotateZ(Math.PI / 2);
    l.shape(sawLog, '#7a5634', 0.39, 0.68, 0.074);
    logPile(l, 0.7, 0.78, 4, 0.16);
    horse(l, 0.28, 0.88, 0);
    cart(l, 0.42, 0.88, 0, 'crates');
    workers(l, [
      [0.6, 0.56, '#8a3a2a', '#3a3a3c'],
      [0.32, 0.6, '#5a6a4a', '#8a6a3a'],
    ]);
    for (const [x, z, h] of [
      [0.08, 0.1, 0.28],
      [0.2, 0.06, 0.24],
      [0.9, 0.12, 0.3],
      [0.08, 0.5, 0.26],
      [0.92, 0.56, 0.26],
      [0.1, 0.9, 0.22],
    ] as const)
      pine(l, x, z, h);
    for (const [x, z] of [
      [0.62, 0.14],
      [0.86, 0.9],
      [0.2, 0.72],
    ] as const)
      stump(l, x, z);
    lanternPost(l, 0.6, 0.4, 0.12);
    signboard(l, 0.86, 0.72, 0.07, 0.08, '#5c4630', Math.PI / 2);
  },

  forester(l) {
    yardGround(l, 'forester', '#8a7a5e', [0.16, 0.36, 0.86, 0.9], 26);
    // Ranger's house with a porch, a timber fire-lookout tower and a tree nursery.
    const hx = 0.36;
    const hz = 0.5;
    boardBody(l, hx, hz, 0.24, 0.18, 0.03, 0.11, '#6a7a52');
    windows4(l, hx, hz, 0.24, 0.18, 0.06, 0.028, { shutters: '#3a4a2a' });
    door(l, hx, hz, 0.24, 0.18, '+z', 0, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, hx, hz, 'x', 0.24, 0.18, 0.14, 0.08, '#5e4a38', '#6a7a52');
    const [px, pz] = faceAt(l, hx, hz, 0.24, 0.18, '+z', 0, 0.04);
    wbox(l, px, pz, 0.03, 0.24, 0.012, 0.07, '#7a5634');
    for (const s of [-1, 1])
      wbox(l, ...off(l, px, pz, s * 0.11, 0.03), 0.04, 0.008, 0.08, 0.008, '#5c4630');
    l.shape(new THREE.BoxGeometry(0.26, 0.008, 0.08).rotateX(0.25), '#5e4a38', px, pz, 0.12);
    chimney(l, ...off(l, hx, hz, -0.1, 0), 0.14, 0.1);
    // Lookout tower: braced legs, ladder, cabin with windows and a pyramid roof.
    const tx = 0.76;
    const tz = 0.24;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [tx + (a * 0.05) / l.spanX, 0.03, tz + (b * 0.05) / l.spanZ],
        [tx + (a * 0.03) / l.spanX, 0.32, tz + (b * 0.03) / l.spanZ],
        0.008,
        '#5c4630',
      );
    for (const y of [0.1, 0.18, 0.26]) wbox(l, tx, tz, y, 0.08, 0.006, 0.08, '#5c4630');
    ladder(l, tx, tz, 0.03, 0.32, 0.05);
    wbox(l, tx, tz, 0.32, 0.08, 0.05, 0.08, '#7a6a52');
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      faceBox(l, tx, tz, 0.08, 0.08, f, 0, 0.002, 0.335, 0.06, 0.025, 0.003, pane, 1);
    l.shape(new THREE.ConeGeometry(0.07, 0.05, 4).rotateY(Math.PI / 4), '#5e4a38', tx, tz, 0.395);
    nursery(l, 0.56, 0.6, 0.84, 0.84);
    railFence(l, 0.54, 0.58, 0.86, 0.58);
    lumberStack(l, 0.26, 0.82, 0.1, 0.05, 4);
    barrow(l, 0.46, 0.8, 0.4, '#6f4c34');
    dog(l, 0.5, 0.64, 0.4);
    workers(l, [
      [0.5, 0.72, '#3a5a3a', '#4a5a3a'],
      [0.7, 0.72, '#5a6a4a', '#8a6a3a'],
    ]);
    for (const [x, z, h] of [
      [0.08, 0.08, 0.3],
      [0.24, 0.12, 0.28],
      [0.44, 0.08, 0.32],
      [0.08, 0.32, 0.26],
      [0.94, 0.5, 0.26],
      [0.94, 0.86, 0.24],
      [0.08, 0.94, 0.22],
    ] as const)
      pine(l, x, z, h);
    signboard(l, 0.2, 0.94, 0.08, 0.1, '#3a5a3a');
  },

  fur_trapper(l) {
    yardGround(l, 'fur_trapper', '#d8dfe0', [0.14, 0.2, 0.86, 0.86], 10, snow);
    // Snowbound log cabin, hide-drying racks, a dog sled and trapping gear.
    const hx = 0.42;
    const hz = 0.38;
    logBody(l, hx, hz, 0.24, 0.18, 0.03, 0.11, '#7a5434');
    window4(l, hx, hz, 0.24, 0.18, '+z', 0.06, 0.06, 0.026, { shutters: '#5a3a2a' });
    door(l, hx, hz, 0.24, 0.18, '+z', -0.05, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, hx, hz, 'x', 0.24, 0.18, 0.14, 0.08, '#4a3a2a', '#7a5434');
    shingleGable(l, hx, hz, 'x', 0.22, 0.16, 0.152, 0.074, snow);
    chimney(l, ...off(l, hx, hz, -0.1, 0), 0.14, 0.12, '#8a8274');
    smoke(l, ...off(l, hx, hz, -0.1, 0), 0.28, 2);
    dryingRack(l, 0.74, 0.3, Math.PI / 2, true);
    dryingRack(l, 0.74, 0.54, Math.PI / 2, true);
    // Sled with furs, a team of dogs, traps on pegs, firewood and a snow-covered canoe.
    wbox(l, 0.4, 0.74, 0.036, 0.12, 0.008, 0.05, '#8a6a48');
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.4, 0.74, 0, s * 0.024), 0.03, 0.13, 0.006, 0.006, '#3a3530');
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        ...off(l, 0.4, 0.74, -0.03 + i * 0.03, 0),
        0.046,
        0.026,
        0.014,
        0.04,
        ['#8a6a4a', '#5a4a3a', '#c9b49a'][i]!,
      );
    for (let i = 0; i < 4; i++)
      dog(
        l,
        0.56 + (i % 2) * 0.05,
        0.72 + Math.floor(i / 2) * 0.05,
        0,
        i % 2 ? '#d8d0c0' : '#5a5048',
      );
    for (let i = 0; i < 4; i++) {
      const t = new THREE.TorusGeometry(0.012, 0.002, 4, 10).rotateX(Math.PI / 2);
      l.shape(t, iron, ...off(l, hx, hz, -0.12 + i * 0.03, 0.095), 0.06 + (i % 2) * 0.012);
    }
    woodStack(l, 0.2, 0.62, 0.12, Math.PI / 2);
    const canoe = new THREE.SphereGeometry(0.03, 10, 6).scale(3.2, 0.5, 1);
    l.shape(canoe, '#8a3a2a', 0.66, 0.9, 0.04);
    l.shape(canoe.clone().scale(0.95, 0.6, 0.9), snow, 0.66, 0.9, 0.05);
    workers(l, [
      [0.5, 0.6, '#6a4a3a', '#5a4a3a'],
      [0.28, 0.82, '#3a4a5a', '#8a6a3a'],
    ]);
    for (const [x, z, h] of [
      [0.08, 0.08, 0.3],
      [0.26, 0.06, 0.26],
      [0.9, 0.1, 0.28],
      [0.08, 0.42, 0.26],
      [0.92, 0.76, 0.24],
      [0.1, 0.9, 0.24],
    ] as const)
      pine(l, x, z, h, true);
    lanternPost(l, 0.62, 0.4, 0.12);
    signboard(l, 0.86, 0.92, 0.07, 0.08, '#5c4630');
  },

  stone_cutter(l) {
    yardGround(l, 'stone_cutter', '#a39c8c', [0.08, 0.3, 0.94, 0.94], 14);
    // A cut rock face along the back, blocks being dressed and lifted by a timber derrick.
    const rock = '#bdb6a6';
    rockMass(l, 0.04, 0.04, 0.96, 0.26, 0.036, 0.1, rock, grass);
    rockMass(l, 0.04, 0.04, 0.6, 0.16, 0.136, 0.08, shade(rock, 0.95), grass);
    for (let i = 0; i < 6; i++)
      wbox(l, 0.1 + i * 0.15, 0.265, 0.04, 0.004, 0.08, 0.004, shade(rock, 0.75));
    jibCrane(l, 0.72, 0.42, 0.26, Math.PI * 0.7, 0.16, '#5c4630', '#cfc9b9');
    for (const [dx, dz] of [
      [-0.04, -0.04],
      [0.04, -0.04],
      [0, 0.05],
    ] as const)
      l.beam(
        [0.72, 0.29, 0.42],
        [0.72 + dx / l.spanX, 0.03, 0.42 + dz / l.spanZ],
        0.006,
        '#5c4630',
      );
    // Mason's lodge: open-fronted stone shed with a banker bench and a dressed block on it.
    const sx = 0.3;
    const sz = 0.5;
    stoneBody(l, sx, sz, 0.2, 0.14, 0.03, 0.1, '#a49c8c');
    faceBox(l, sx, sz, 0.2, 0.14, '+z', 0, 0.002, 0.03, 0.14, 0.08, 0.004, '#3a3430');
    tinGable(l, sx, sz, 'x', 0.2, 0.14, 0.13, 0.05, '#5a5048');
    wbox(l, ...faceAt(l, sx, sz, 0.2, 0.14, '+z', 0, 0.04), 0.03, 0.1, 0.04, 0.04, '#8a8274');
    wbox(l, ...faceAt(l, sx, sz, 0.2, 0.14, '+z', 0, 0.04), 0.07, 0.04, 0.03, 0.03, '#d8d2c2');
    blockStack(l, 0.56, 0.74, 0.03, 3, 2, 3, '#cfc9b9');
    blockStack(l, 0.82, 0.68, 0.03, 2, 2, 2, '#c4beae');
    rubble(l, 0.4, 0.8, 0.03, 14, 0.1, '#bdb6a6');
    rubble(l, 0.84, 0.36, 0.03, 8, 0.06, '#bdb6a6');
    horse(l, 0.2, 0.86, 0);
    cart(l, 0.34, 0.86, 0, 'crates');
    barrow(l, 0.66, 0.9, 0.3, '#cfc9b9');
    workers(l, [
      [0.36, 0.66, '#8a8274', '#3a3a3c'],
      [0.64, 0.6, '#6a5a4a', '#3a3a3c'],
      [0.86, 0.52, '#5a6a7a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.12, 0.5, 0.13);
    signboard(l, 0.9, 0.92, 0.07, 0.08, '#5c4630');
  },

  gravel_pit(l) {
    yardGround(l, 'gravel_pit', '#9a917e', [0.06, 0.06, 0.94, 0.94], 14);
    // Sunken pit with stepped banks, a screening frame and graded heaps.
    wbox(l, 0.42, 0.38, 0.026, 0.42, 0.006, 0.38, '#7d7564');
    for (let i = 0; i < 3; i++) {
      const w = 0.5 - i * 0.04;
      const d = 0.46 - i * 0.04;
      for (const s of [-1, 1]) {
        wbox(
          l,
          ...off(l, 0.42, 0.38, 0, s * (d / 2)),
          0.03,
          w,
          0.014 - i * 0.004,
          0.02,
          tone('#8a8270', 0.06),
        );
        wbox(
          l,
          ...off(l, 0.42, 0.38, s * (w / 2), 0),
          0.03,
          0.02,
          0.014 - i * 0.004,
          d,
          tone('#8a8270', 0.06),
        );
      }
    }
    rubble(l, 0.42, 0.38, 0.03, 30, 0.18, '#a39a86');
    // Inclined riddle screen on legs, a chute and three heaps of graded gravel.
    l.shape(new THREE.BoxGeometry(0.14, 0.006, 0.08).rotateZ(0.5), '#6b5a48', 0.74, 0.5, 0.11);
    for (let i = 0; i < 7; i++)
      l.shape(
        new THREE.BoxGeometry(0.14, 0.004, 0.003).rotateZ(0.5),
        '#8a8f94',
        0.74,
        0.5 + (-0.03 + i * 0.01) / l.spanZ,
        0.116,
      );
    for (const [dx, dz, h] of [
      [-0.05, -0.035, 0.18],
      [-0.05, 0.035, 0.18],
      [0.05, -0.035, 0.06],
      [0.05, 0.035, 0.06],
    ] as const)
      wbox(l, ...off(l, 0.74, 0.5, dx, dz), 0.03, 0.008, h, 0.008, '#5c4630');
    cone(l, 0.78, 0.74, 0.07, '#a8a090');
    cone(l, 0.6, 0.82, 0.06, '#8f887a');
    cone(l, 0.86, 0.26, 0.06, '#c2baa6');
    for (let i = 0; i < 3; i++)
      l.beam(
        [0.2 + i * 0.02, 0.031, 0.22 + i * 0.01],
        [0.4 + i * 0.02, 0.031, 0.42 + i * 0.01],
        0.012,
        '#7a5634',
      );
    barrow(l, 0.36, 0.5, 0.6, '#a8a090');
    barrow(l, 0.62, 0.62, -0.3, '#8f887a');
    horse(l, 0.24, 0.86, 0);
    cart(l, 0.38, 0.86, 0, 'crates');
    workers(l, [
      [0.44, 0.32, '#6a5a4a', '#3a3a3c'],
      [0.32, 0.42, '#5a6a7a', '#3a3a3c'],
      [0.7, 0.62, '#8a5a3a', '#3a3a3c'],
    ]);
    for (let i = 0; i < 4; i++)
      wbox(l, 0.06 + i * 0.04, 0.06, 0.03, 0.03, 0.03, 0.02, '#c9a24a', i * 0.3);
    railFence(l, 0.03, 0.03, 0.97, 0.03);
    lanternPost(l, 0.1, 0.7, 0.13);
    signboard(l, 0.9, 0.92, 0.07, 0.08, '#5c4630');
    shrub(l, 0.94, 0.06, 0.03);
  },

  salt_pan(l) {
    yardGround(l, 'salt_pan', '#d9c9a0', [0.04, 0.04, 0.96, 0.96], 6, sand);
    // Grid of shallow evaporating pans: brine in some, crusted white salt in others.
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const x = 0.2 + c * 0.2;
        const z = 0.2 + r * 0.2;
        wbox(l, x, z, 0.03, 0.15, 0.012, 0.15, '#a8957a');
        const stage = (r * 3 + c) % 3;
        if (stage === 2) {
          wbox(l, x, z, 0.04, 0.13, 0.004, 0.13, salt);
          for (let i = 0; i < 6; i++)
            wbox(
              l,
              ...off(l, x, z, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.1),
              0.044,
              0.02,
              0.004,
              0.02,
              '#ffffff',
              rand() * 3,
            );
        } else waterSheet(l, x, z, 0.13, 0.13, 0.046, stage ? '#9cc8cf' : '#5fa2b8');
      }
    // Brine channel, salt heaps being raked, a salt barn with a windpump.
    wbox(l, 0.4, 0.06, 0.03, 0.66, 0.01, 0.04, '#a8957a');
    waterSheet(l, 0.4, 0.06, 0.62, 0.025, 0.036);
    for (const [x, z, r] of [
      [0.86, 0.3, 0.05],
      [0.88, 0.46, 0.045],
      [0.84, 0.6, 0.04],
    ] as const)
      cone(l, x, z, r, salt);
    for (const [x, z] of [
      [0.62, 0.28],
      [0.42, 0.6],
    ] as const) {
      l.beam([x, 0.04, z], [x + 0.05 / l.spanX, 0.09, z], 0.003, '#8a6a48');
      wbox(l, x, z, 0.036, 0.004, 0.006, 0.03, '#8a6a48');
    }
    const bx = 0.2;
    const bz = 0.86;
    boardBody(l, bx, bz, 0.22, 0.12, 0.03, 0.09, '#9a8a6a');
    door(l, bx, bz, 0.22, 0.12, '-z', 0.04, 0.03, 0.05, 0.07, timberDark, true);
    window4(l, bx, bz, 0.22, 0.12, '+x', 0, 0.06, 0.024, { shutters: '#3a5a7a' });
    shingleGable(l, bx, bz, 'x', 0.22, 0.12, 0.12, 0.06, '#7a6a52', '#9a8a6a');
    const wx = 0.48;
    const wz = 0.86;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [wx + (a * 0.03) / l.spanX, 0.03, wz + (b * 0.03) / l.spanZ],
        [wx, 0.3, wz],
        0.005,
        '#7a8186',
      );
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      l.shape(
        new THREE.BoxGeometry(0.012, 0.06, 0.002).translate(0, 0.04, 0).rotateZ(a),
        '#e9e4d6',
        ...off(l, wx, wz, 0, 0.012),
        0.31,
      );
    }
    l.beam([wx, 0.31, wz], [wx, 0.31, wz - 0.08 / l.spanZ], 0.004, '#7a8186');
    wbox(l, wx, wz - 0.09 / l.spanZ, 0.29, 0.003, 0.04, 0.04, '#c84a3a');
    for (let i = 0; i < 3; i++) barrow(l, 0.66 + i * 0.06, 0.8, 0.3, salt);
    for (let i = 0; i < 4; i++) {
      wround(
        l,
        0.84 + (i % 2) * 0.04,
        0.88 + Math.floor(i / 2) * 0.04,
        0.014,
        0.014,
        0.03,
        0.03,
        '#d8cfb8',
        10,
      );
      wround(
        l,
        0.84 + (i % 2) * 0.04,
        0.88 + Math.floor(i / 2) * 0.04,
        0.012,
        0.012,
        0.06,
        0.006,
        salt,
        10,
      );
    }
    workers(l, [
      [0.6, 0.3, '#e9e4d6', '#d8c08a'],
      [0.4, 0.62, '#3a5a7a', '#d8c08a'],
      [0.76, 0.5, '#e9e4d6', '#d8c08a'],
    ]);
    signboard(l, 0.06, 0.6, 0.07, 0.08, '#3a5a7a', Math.PI / 2);
    shrub(l, 0.96, 0.96, 0.025, '#7a9a4a');
  },

  trading_post(l) {
    yardGround(l, 'trading_post', '#9a8a6e', [0.06, 0.06, 0.94, 0.94], 14);
    // Two-storey timber store with a false front, a porch, signs and goods on display.
    const hx = 0.44;
    const hz = 0.36;
    boardBody(l, hx, hz, 0.34, 0.24, 0.03, 0.2, '#9a7a52');
    windows4(l, hx, hz, 0.34, 0.24, 0.13, 0.032, { frame: '#efe7d6' });
    door(l, hx, hz, 0.34, 0.24, '+z', 0, 0.03, 0.06, 0.09, timberDark, true);
    for (const s of [-1, 1])
      faceBox(l, hx, hz, 0.34, 0.24, '+z', s * 0.1, 0.004, 0.05, 0.07, 0.06, 0.004, pane, 1);
    shingleGable(l, hx, hz, 'z', 0.24, 0.34, 0.23, 0.08, '#5e4a38', '#9a7a52');
    const [fx, fz] = faceAt(l, hx, hz, 0.34, 0.24, '+z', 0, 0.006);
    wbox(l, fx, fz, 0.23, 0.36, 0.08, 0.01, '#8a6a48');
    wbox(l, fx, fz, 0.25, 0.26, 0.04, 0.016, '#efe7d6');
    for (let i = 0; i < 8; i++)
      wbox(l, ...off(l, fx, fz, -0.1 + i * 0.028, 0.01), 0.262, 0.018, 0.016, 0.004, '#7a2a2a');
    const [px, pz] = faceAt(l, hx, hz, 0.34, 0.24, '+z', 0, 0.05);
    wbox(l, px, pz, 0.03, 0.36, 0.012, 0.09, '#7a5634');
    for (const s of [-1, -0.33, 0.33, 1])
      wbox(l, ...off(l, px, pz, s * 0.17, 0.04), 0.04, 0.01, 0.11, 0.01, '#5c4630');
    l.shape(new THREE.BoxGeometry(0.38, 0.008, 0.1).rotateX(0.2), '#5e4a38', px, pz, 0.15);
    // Goods out front: barrels, sacks, crates and tools; a hitching rail with horses.
    for (let i = 0; i < 3; i++) barrel(l, ...off(l, px, pz, -0.15 + i * 0.03, 0.02));
    for (let i = 0; i < 3; i++)
      crate(
        l,
        ...off(l, px, pz, 0.08 + i * 0.03, 0.02),
        0.044,
        i % 2 ? '#c84a3a' : '#8a6a48',
        i * 0.3,
      );
    railFence(l, 0.14, 0.76, 0.5, 0.76, '#6b4a2c', 1);
    horse(l, 0.24, 0.82, Math.PI / 2);
    horse(l, 0.38, 0.82, Math.PI / 2, '#3a2a20');
    cart(l, 0.7, 0.8, 0, 'barrels');
    horse(l, 0.82, 0.8, 0, '#9a7a5a');
    for (let i = 0; i < 3; i++) pallet(l, 0.82, 0.26 + i * 0.1, i % 2 ? '#c9b48a' : '#8a6a48');
    lumberStack(l, 0.1, 0.36, 0.1, 0.06, 4, Math.PI / 2);
    blockStack(l, 0.1, 0.56, 0.03, 2, 2, 2, '#c4beae');
    wround(l, 0.62, 0.62, 0.004, 0.006, 0.03, 0.34, '#efe7d6', 6);
    wbox(l, ...off(l, 0.62, 0.62, 0.035, 0), 0.31, 0.06, 0.036, 0.003, '#2a4a7a');
    workers(l, [
      [0.5, 0.6, '#6a3a3a', '#3a3a3c'],
      [0.58, 0.68, '#3a4a6a', '#8a6a3a'],
      [0.3, 0.6, '#5a6a4a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.14, 0.6, 0.15);
    lanternPost(l, 0.74, 0.6, 0.15);
    path(l, 0.44, 0.62, 0.44, 0.98, 0.08);
    signboard(l, 0.9, 0.94, 0.08, 0.09, '#5c4630');
  },

  craft_studio(l) {
    yardGround(l, 'craft_studio', '#a8987c', [0.06, 0.08, 0.94, 0.94], 18);
    // Half-timbered studio house with a big north-light window and a potter's yard.
    const hx = 0.4;
    const hz = 0.34;
    stoneBody(l, hx, hz, 0.36, 0.24, 0.03, 0.05, '#a49c8c');
    halfTimber(l, hx, hz, 0.36, 0.24, 0.08, 0.14, '#ecdfc4');
    windows4(l, hx, hz, 0.36, 0.24, 0.12, 0.034, { frame: '#3d2a19' });
    door(l, hx, hz, 0.36, 0.24, '+z', 0.08, 0.03, 0.05, 0.1, '#3a5a4a');
    shingleGable(l, hx, hz, 'x', 0.36, 0.24, 0.22, 0.12, '#6e4a38', '#ecdfc4');
    l.shape(
      new THREE.BoxGeometry(0.16, 0.006, 0.1).rotateX(-0.75),
      '#bfe0e6',
      ...off(l, hx, hz, -0.06, -0.06),
      0.28,
      0.3,
    );
    chimney(l, ...off(l, hx, hz, 0.14, 0), 0.22, 0.12);
    // Potter's corner: wheel, a small kiln, shelves of pots drying.
    beehiveKiln(l, 0.78, 0.26, 0.06, 0.07, '#a65e40');
    smoke(l, 0.78, 0.26, 0.15, 2);
    wround(l, 0.62, 0.62, 0.02, 0.022, 0.03, 0.03, '#6b4a2c', 10);
    wround(l, 0.62, 0.62, 0.018, 0.018, 0.06, 0.004, '#8a8274', 12);
    wround(l, 0.62, 0.62, 0.008, 0.01, 0.064, 0.016, '#b87b58', 10);
    for (let k = 0; k < 3; k++) {
      wbox(l, 0.84, 0.56, 0.05 + k * 0.035, 0.12, 0.004, 0.03, '#7a5634');
      for (let i = 0; i < 4; i++)
        wround(
          l,
          ...off(l, 0.84, 0.56, -0.045 + i * 0.03, 0),
          0.007,
          0.009,
          0.054 + k * 0.035,
          0.018,
          ['#b87b58', '#2f6f9a', '#e9e4d6', '#3f8a6a'][(i + k) % 4]!,
          8,
        );
    }
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.84, 0.56, s * 0.06, 0), 0.03, 0.006, 0.12, 0.03, '#5c4630');
    // Weaver's loom under an awning, an easel, a bench and a cottage garden.
    l.shape(
      new THREE.BoxGeometry(0.2, 0.008, 0.1).rotateX(0.25),
      '#c84a3a',
      ...faceAt(l, hx, hz, 0.36, 0.24, '+z', -0.08, 0.05),
      0.15,
    );
    for (const s of [-1, 1])
      wbox(
        l,
        ...faceAt(l, hx, hz, 0.36, 0.24, '+z', -0.08 + s * 0.09, 0.09),
        0.03,
        0.006,
        0.11,
        0.006,
        '#5c4630',
      );
    const [lx, lz] = faceAt(l, hx, hz, 0.36, 0.24, '+z', -0.08, 0.06);
    for (const s of [-1, 1])
      wbox(l, ...off(l, lx, lz, s * 0.03, 0), 0.03, 0.006, 0.07, 0.03, '#7a5634');
    wbox(l, lx, lz, 0.05, 0.06, 0.04, 0.003, '#d8a832');
    for (const s of [-1, 1])
      l.beam(
        [0.4 + (s * 0.012) / l.spanX, 0.03, 0.66],
        [0.4, 0.12, 0.66 - 0.01 / l.spanZ],
        0.004,
        '#7a5634',
      );
    wbox(l, 0.4, 0.66, 0.08, 0.05, 0.04, 0.004, '#efe7d6');
    wbox(l, 0.4, 0.66, 0.09, 0.03, 0.02, 0.006, '#4f8ab0');
    wbox(l, 0.24, 0.62, 0.05, 0.1, 0.006, 0.03, '#7a5634');
    for (let i = 0; i < 12; i++)
      shrub(
        l,
        0.1 + (i % 6) * 0.05,
        0.84 + Math.floor(i / 6) * 0.06,
        0.02,
        ['#4f8a3a', '#d84a6a', '#e8c84a'][i % 3],
      );
    for (const x of [0.66, 0.92]) cypress(l, x, 0.9, 0.18);
    workers(l, [
      [0.58, 0.68, '#7a4a6a', '#3a3a3c'],
      [0.36, 0.72, '#3a5a6a', '#d8c08a'],
    ]);
    lanternPost(l, 0.62, 0.44, 0.14);
    railFence(l, 0.03, 0.78, 0.5, 0.78, '#8a6342', 1);
    signboard(l, 0.9, 0.74, 0.08, 0.1, '#3a5a4a', Math.PI / 2);
  },
};
