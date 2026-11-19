import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  crate,
  door,
  halfTimber,
  horse,
  lanternPost,
  off,
  path,
  railFence,
  rand,
  renderBody,
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
import { channel, cropBed, truck, waterWheel, windmillSails } from './dioramaProps';
import {
  apron,
  catwalk,
  cowl,
  cyclone,
  drums,
  faceBox,
  fence,
  flume,
  forklift,
  gantry,
  hallFacade,
  hat,
  iron,
  jibCrane,
  ladder,
  logPile,
  lumberStack,
  pallet,
  pane,
  pipe,
  pylon,
  ridgeLantern,
  sawBench,
  sawtoothRoof,
  signboard,
  site,
  slate,
  stack,
  timberDark,
  wigwamBurner,
} from './industryKit';
import { brickBody, railLine, wagon, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B: timber and wind. Every lot is drawn in a 0.77-unit frame and scaled to fill its
// footprint (see `framed` in architectureModels.ts).
//   sawmill  -> flume_sawmill -> timber_mill -> steam_sawmill -> lumber_works
//   windmill -> smock_windmill -> stone_windmill -> multi_vane_mill -> wind_turbine_spire

const sawdust = '#d9b98a';
const plaster = '#e6dcc6';
const limestone = '#d8d0bc';
const copper = '#5fa58e';
const brass = '#b08a3a';

/** Pale sawdust heap. */
function sawdustHeap(l: Lot, x: number, z: number, r: number): void {
  l.shape(new THREE.ConeGeometry(r, r * 0.7, 12), tone(sawdust, 0.06), x, z, 0.03 + r * 0.35);
}

/** Mill race: stone channel with water down the left edge of the lot. */
function race(l: Lot, x: number, z0: number, z1: number, w = 0.09): void {
  channel(l, x, z0, x, z1, w);
}

/** Sacks of flour or grain heaped on a pallet. */
function sacks(l: Lot, x: number, z: number, n: number, color = '#e9e0c8'): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, (i % 3) * 0.026 - 0.026, Math.floor(i / 3) % 2 ? 0.02 : 0);
    const y = 0.03 + Math.floor(i / 6) * 0.018;
    const g = new THREE.SphereGeometry(0.014, 8, 6).scale(1.2, 0.75, 0.9);
    l.shape(g, tone(color, 0.06), px, pz, y + 0.01);
  }
}

/** Grain field strips at the lot edge. */
function fields(l: Lot, x0: number, z0: number, x1: number, z1: number): void {
  cropBed(l, x0, z0, x1, z1, 'grain', 4, 0.045);
}

/** Millstone leaning against a wall (or lying flat). */
function millstone(l: Lot, x: number, z: number, upright = true): void {
  const g = new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16);
  if (upright) g.rotateX(Math.PI / 2);
  l.shape(g, '#a8a296', x, z, upright ? 0.06 : 0.036);
  wround(l, x, z, 0.006, 0.006, upright ? 0.054 : 0.04, 0.014, '#5a5650', 8);
}

/** Fantail: small wind wheel on a frame behind a mill cap, turning the cap into the wind. */
function fantail(l: Lot, x: number, z: number, y: number, r: number): void {
  for (let i = 0; i < 8; i++) {
    const blade = new THREE.BoxGeometry(0.004, r, r * 0.4)
      .translate(0, r / 2, 0)
      .rotateX((i / 8) * Math.PI * 2);
    l.shape(blade, '#e9e1cc', x, z, y);
  }
  wround(l, x, z, 0.006, 0.006, y - 0.003, 0.006, '#3a3530', 8);
}

/** Octagonal tapered body (smock or tower) with weatherboard rings. */
function octTower(
  l: Lot,
  x: number,
  z: number,
  y: number,
  h: number,
  r0: number,
  r1: number,
  color: string,
  rings: number,
  segs = 8,
): void {
  for (let i = 0; i < rings; i++) {
    const t0 = i / rings;
    const t1 = (i + 1) / rings;
    l.shape(
      new THREE.CylinderGeometry(r0 + (r1 - r0) * t1, r0 + (r1 - r0) * t0, h / rings, segs),
      tone(color, 0.05),
      x,
      z,
      y + (t0 + t1) * 0.5 * h,
    );
  }
}

export const millDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Sawmills
  // -----------------------------------------------------------------------------------------
  sawmill(l) {
    site(l, 'sawmill', '#8a7458', [0.2, 0.08, 0.95, 0.95]);
    race(l, 0.09, 0.02, 0.98);
    waterWheel(l, 0.17, 0.42, 0.02, 0.085, Math.PI / 2);
    l.beam([0.17, 0.11, 0.42], [0.36, 0.11, 0.42], 0.008, '#3a3530');
    // Open-sided timber shed on posts over the saw bench.
    for (const [x, z] of [
      [0.3, 0.26],
      [0.48, 0.26],
      [0.66, 0.26],
      [0.3, 0.6],
      [0.48, 0.6],
      [0.66, 0.6],
    ] as const) {
      wbox(l, x, z, 0.03, 0.016, 0.17, 0.016, '#5c4630');
      l.beam([x, 0.17, z], [x + (x < 0.5 ? 0.05 : -0.05), 0.2, z], 0.006, '#5c4630');
    }
    for (const z of [0.26, 0.6]) wbox(l, 0.48, z, 0.19, 0.3, 0.016, 0.016, '#5c4630');
    shingleGable(l, 0.48, 0.43, 'x', 0.3, 0.28, 0.2, 0.08, '#6e533b');
    sawBench(l, 0.48, 0.43, 0, 0.2);
    wbox(l, 0.48, 0.43, 0.03, 0.26, 0.004, 0.2, tone(sawdust, 0.1));
    // Log yard, sawn timber drying, sawdust and offcuts.
    logPile(l, 0.8, 0.2, 4, 0.18, Math.PI / 2);
    logPile(l, 0.62, 0.12, 3, 0.16, 0);
    lumberStack(l, 0.72, 0.78, 0.14, 0.06, 6);
    lumberStack(l, 0.88, 0.62, 0.12, 0.06, 4, Math.PI / 2);
    sawdustHeap(l, 0.5, 0.78, 0.05);
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        0.3 + rand() * 0.12,
        0.72 + rand() * 0.12,
        0.034,
        0.03,
        0.008,
        0.01,
        '#9a7a52',
        rand() * 3,
      );
    // Horse and log cart, sawyers, a lantern and a split-rail fence.
    horse(l, 0.32, 0.9, 0);
    cart(l, 0.46, 0.9, 0, 'crates');
    workers(l, [
      [0.42, 0.36, '#6a4a3a', '#3a3a3c'],
      [0.56, 0.5, '#5a6a4a', '#3a3a3c'],
      [0.74, 0.32, '#8a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.68, 0.66, 0.14);
    railFence(l, 0.16, 0.97, 0.97, 0.97);
    railFence(l, 0.97, 0.03, 0.97, 0.97);
    signboard(l, 0.9, 0.9, 0.08, 0.09, '#5c4630');
    shrub(l, 0.94, 0.06, 0.03);
  },

  flume_sawmill(l) {
    site(l, 'flume_sawmill', '#87725a', [0.22, 0.06, 0.95, 0.95]);
    race(l, 0.08, 0.5, 0.98, 0.07);
    // Elevated flume brings water onto an overshot wheel.
    flume(l, 0.1, 0.02, 0.1, 0.3, 0.24, 0.05);
    waterWheel(l, 0.12, 0.42, 0.04, 0.1, Math.PI / 2);
    wbox(l, 0.12, 0.33, 0.22, 0.05, 0.03, 0.05, '#6b4a2c');
    // Enclosed board-and-batten mill shed on a stone footing.
    const hx = 0.46;
    const hz = 0.42;
    stoneBody(l, hx, hz, 0.34, 0.26, 0.03, 0.04, '#9a9282');
    boardBody(l, hx, hz, 0.32, 0.24, 0.07, 0.13, '#8a6a4a');
    windows4(l, hx, hz, 0.32, 0.24, 0.1, 0.036, { shutters: '#4a3a2a' });
    door(l, hx, hz, 0.32, 0.24, '+z', 0.08, 0.07, 0.07, 0.1, timberDark, true);
    shingleGable(l, hx, hz, 'x', 0.32, 0.24, 0.2, 0.09, '#5e4a38', '#8a6a4a');
    cowl(l, hx, hz, 0.29, 0.012);
    l.beam([0.12, 0.14, 0.42], [hx - 0.16 / l.spanX, 0.14, 0.42], 0.008, '#3a3530');
    // Log ramp up into the shed with logs on the skids, a sawdust chute out the back.
    for (const dz of [-0.04, 0.04])
      l.beam(
        [0.86, 0.03, hz + dz / l.spanZ],
        [hx + 0.16 / l.spanX, 0.1, hz + dz / l.spanZ],
        0.01,
        '#5c4630',
      );
    for (let i = 0; i < 3; i++) {
      const log = new THREE.CylinderGeometry(0.013, 0.013, 0.12, 8).rotateX(Math.PI / 2);
      l.shape(log, '#7a5634', 0.7 + i * 0.07, hz, 0.075 - i * 0.012);
    }
    l.beam([hx, 0.12, hz - 0.12 / l.spanZ], [hx + 0.04 / l.spanX, 0.04, 0.12], 0.02, '#6b5a48');
    sawdustHeap(l, hx + 0.05, 0.1, 0.05);
    logPile(l, 0.84, 0.2, 4, 0.2, Math.PI / 2);
    lumberStack(l, 0.6, 0.82, 0.15, 0.06, 7);
    lumberStack(l, 0.8, 0.82, 0.15, 0.06, 5);
    lumberStack(l, 0.34, 0.82, 0.12, 0.05, 4, 0.2);
    horse(l, 0.62, 0.66, Math.PI);
    cart(l, 0.48, 0.66, Math.PI, 'crates');
    workers(l, [
      [0.7, 0.42, '#6a4a3a', '#3a3a3c'],
      [0.3, 0.66, '#5a6a4a', '#3a3a3c'],
      [0.88, 0.48, '#8a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.26, 0.24, 0.14);
    lanternPost(l, 0.9, 0.66, 0.14);
    railFence(l, 0.18, 0.97, 0.97, 0.97);
    railFence(l, 0.97, 0.03, 0.97, 0.97);
    signboard(l, 0.2, 0.92, 0.08, 0.09, '#5c4630');
  },

  timber_mill(l) {
    site(l, 'timber_mill', '#8e7b62', [0.22, 0.05, 0.96, 0.96]);
    race(l, 0.08, 0.02, 0.98, 0.1);
    waterWheel(l, 0.17, 0.36, 0.03, 0.11, Math.PI / 2);
    for (const dz of [-0.035, 0.035])
      wbox(l, ...off(l, 0.17, 0.36, 0, dz), 0.03, 0.01, 0.15, 0.01, '#5a5650');
    // Two-storey rendered mill on a stone plinth, slate roof with a clerestory lantern.
    const hx = 0.46;
    const hz = 0.36;
    stoneBody(l, hx, hz, 0.36, 0.28, 0.03, 0.05, '#9a9282');
    renderBody(l, hx, hz, 0.35, 0.27, 0.08, 0.2, plaster, '#8a7a62');
    windows4(l, hx, hz, 0.35, 0.27, 0.1, 0.04, { frame: '#e9dfc9' });
    windows4(l, hx, hz, 0.35, 0.27, 0.2, 0.04, { frame: '#e9dfc9' });
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      faceBox(l, hx, hz, 0.35, 0.27, f, 0, 0.004, 0.17, 0.4, 0.008, 0.006, '#8a7a62');
    door(l, hx, hz, 0.35, 0.27, '+z', 0, 0.08, 0.08, 0.11, timberDark, true);
    shingleGable(l, hx, hz, 'x', 0.35, 0.27, 0.28, 0.1, slate, plaster);
    ridgeLantern(l, hx, hz, 'x', 0.22, 0.375, '#3f464b');
    // Sack hoist (lucam) jutting from the gable.
    const [lx, lz] = off(l, hx, hz, 0.19, 0);
    wbox(l, lx, lz, 0.22, 0.04, 0.06, 0.06, '#8a6a4a');
    tinGable(l, lx, lz, 'z', 0.06, 0.04, 0.28, 0.02, '#4a4440');
    l.beam([lx, 0.22, lz], [lx, 0.12, lz], 0.002, '#1c1f21');
    // Long saw bed with a reciprocating carriage on rails outside the mill.
    railLine(l, 0.36, 0.66, 0.92, 0.66, 0.036);
    wbox(l, 0.62, 0.66, 0.045, 0.16, 0.012, 0.05, '#6b4a2c');
    const bigLog = new THREE.CylinderGeometry(0.02, 0.022, 0.2, 10).rotateZ(Math.PI / 2);
    l.shape(bigLog, '#7a5634', 0.62, 0.66, 0.078);
    wbox(l, 0.76, 0.66, 0.03, 0.03, 0.12, 0.08, '#5c4630');
    wbox(l, 0.76, 0.66, 0.06, 0.006, 0.07, 0.07, '#c9cdd0');
    jibCrane(l, 0.84, 0.48, 0.24, Math.PI * 0.8, 0.14, '#5c4630', 'log');
    // Open drying shed full of sawn boards.
    for (const [x, z] of [
      [0.3, 0.8],
      [0.56, 0.8],
      [0.3, 0.95],
      [0.56, 0.95],
    ] as const)
      wbox(l, x, z, 0.03, 0.012, 0.13, 0.012, '#5c4630');
    tinGable(l, 0.43, 0.875, 'x', 0.22, 0.13, 0.16, 0.04, '#5a5048');
    lumberStack(l, 0.37, 0.875, 0.08, 0.08, 7);
    lumberStack(l, 0.49, 0.875, 0.08, 0.08, 6);
    logPile(l, 0.86, 0.16, 4, 0.2, Math.PI / 2);
    logPile(l, 0.74, 0.86, 3, 0.16, 0);
    sawdustHeap(l, 0.88, 0.32, 0.04);
    workers(l, [
      [0.56, 0.58, '#6a4a3a', '#3a3a3c'],
      [0.68, 0.74, '#5a6a4a', '#3a3a3c'],
      [0.84, 0.62, '#8a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.28, 0.6, 0.15);
    lanternPost(l, 0.94, 0.94, 0.15);
    fence(l, [
      [0.2, 0.03],
      [0.97, 0.03],
      [0.97, 0.7],
    ]);
    signboard(l, 0.66, 0.5, 0.09, 0.1, '#3a2a22');
  },

  steam_sawmill(l) {
    site(l, 'steam_sawmill', '#7c6d5c', [0.05, 0.05, 0.96, 0.96]);
    // Two-storey mill: brick ground floor, half-timbered upper floor, shingled roof.
    const hx = 0.4;
    const hz = 0.38;
    brickBody(l, hx, hz, 0.4, 0.28, 0.03, 0.12, '#9a4a35');
    hallFacade(l, hx, hz, 0.4, 0.28, 0.03, 0.12, '#9a4a35', { bay: 0.08, skip: [['+z', 2]] });
    door(l, hx, hz, 0.4, 0.28, '+z', 0, 0.03, 0.08, 0.1, timberDark, true);
    halfTimber(l, hx, hz, 0.41, 0.29, 0.15, 0.11, '#e8dcc0');
    windows4(l, hx, hz, 0.41, 0.29, 0.18, 0.036, { frame: '#e9dfc9' });
    shingleGable(l, hx, hz, 'x', 0.41, 0.29, 0.26, 0.11, '#5a4a3c', '#e8dcc0');
    ridgeLantern(l, hx, hz, 'x', 0.24, 0.365, '#3f464b');
    // Boiler house with a tall banded stack and a steam main into the mill.
    brickBody(l, 0.82, 0.22, 0.16, 0.14, 0.03, 0.11, '#8f4a38');
    hallFacade(l, 0.82, 0.22, 0.16, 0.14, 0.03, 0.11, '#8f4a38', { bay: 0.07 });
    tinGable(l, 0.82, 0.22, 'z', 0.14, 0.16, 0.14, 0.04, '#4a4440', '#8f4a38');
    stack(l, 0.92, 0.1, 0.5, 0.022, '#9c5640', 4);
    pipe(l, [0.76, 0.12, 0.22], [hx + 0.2 / l.spanX, 0.12, 0.26], 0.009, '#5a5f63');
    // Log deck: wagons of logs on a siding, a log jack ladder, sawdust conveyor to the burner.
    railLine(l, 0.04, 0.68, 0.96, 0.68, 0.036, { steel: true });
    for (const x of [0.2, 0.36, 0.52]) {
      wagon(l, x, 0.68, 0, null, 0.042, '#4a3a2a');
      for (let k = 0; k < 3; k++) {
        const log = new THREE.CylinderGeometry(0.011, 0.011, 0.075, 8).rotateZ(Math.PI / 2);
        l.shape(log, '#7a5634', ...off(l, x, 0.68, 0, (k - 1) * 0.02), 0.1);
      }
    }
    for (const dz of [-0.03, 0.03])
      l.beam(
        [0.62, 0.036, 0.6 + dz / l.spanZ],
        [0.56, 0.15, hz + 0.14 / l.spanZ + dz / l.spanZ],
        0.008,
        '#5c4630',
      );
    wigwamBurner(l, 0.86, 0.5, 0.22, 0.06);
    l.beam([hx + 0.2 / l.spanX, 0.2, hz], [0.84, 0.18, 0.5], 0.016, '#6b5a48');
    lumberStack(l, 0.7, 0.86, 0.14, 0.07, 8);
    lumberStack(l, 0.88, 0.86, 0.12, 0.07, 6);
    logPile(l, 0.18, 0.88, 4, 0.2, 0);
    logPile(l, 0.1, 0.4, 3, 0.16, Math.PI / 2);
    horse(l, 0.44, 0.88, 0);
    cart(l, 0.56, 0.88, 0, 'crates');
    workers(l, [
      [0.62, 0.56, '#6a4a3a', '#3a3a3c'],
      [0.3, 0.6, '#5a6a4a', '#3a3a3c'],
      [0.74, 0.4, '#8a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.14, 0.62, 0.16);
    lanternPost(l, 0.66, 0.2, 0.16);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.6],
    ]);
    signboard(l, 0.3, 0.95, 0.09, 0.11, '#3a2a22');
  },

  lumber_works(l) {
    site(l, 'lumber_works', '#7a766d', [0.04, 0.04, 0.96, 0.96]);
    // Brick and steel mill hall with a sawtooth roof.
    const hx = 0.4;
    const hz = 0.36;
    brickBody(l, hx, hz, 0.5, 0.32, 0.03, 0.16, '#a34e38');
    hallFacade(l, hx, hz, 0.5, 0.32, 0.03, 0.16, '#a34e38', {
      bay: 0.083,
      skip: [
        ['+z', 1],
        ['+z', 4],
      ],
    });
    for (const t of [-0.12, 0.12]) {
      faceBox(l, hx, hz, 0.5, 0.32, '+z', t, 0.003, 0.03, 0.08, 0.11, 0.006, '#5a6268');
      for (let k = 1; k < 7; k++)
        faceBox(
          l,
          hx,
          hz,
          0.5,
          0.32,
          '+z',
          t,
          0.007,
          0.03 + k * 0.015,
          0.08,
          0.003,
          0.003,
          '#4a5257',
        );
    }
    sawtoothRoof(l, hx, hz, 0.5, 0.32, 0.19, 4, 0.08);
    faceBox(l, hx, hz, 0.5, 0.32, '+z', 0, 0.006, 0.15, 0.3, 0.022, 0.004, '#efe7d6');
    for (let i = 0; i < 8; i++)
      faceBox(
        l,
        hx,
        hz,
        0.5,
        0.32,
        '+z',
        -0.12 + i * 0.034,
        0.008,
        0.154,
        0.02,
        0.014,
        0.003,
        '#2f3a44',
      );
    // Dust extraction: cyclone collector and duct, kiln-drying chambers.
    cyclone(l, 0.82, 0.16, 0.34);
    pipe(l, [0.82, 0.3, 0.16], [hx + 0.2 / l.spanX, 0.24, 0.22], 0.012, '#9aa0a3');
    for (let i = 0; i < 3; i++) {
      const kx = 0.7 + i * 0.1;
      wbox(l, kx, 0.4, 0.03, 0.07, 0.1, 0.12, '#b9b6ae');
      faceBox(l, kx, 0.4, 0.07, 0.12, '+z', 0, 0.002, 0.03, 0.05, 0.08, 0.004, '#6e777b');
      cowl(l, kx, 0.4, 0.13, 0.01);
    }
    stack(l, 0.94, 0.08, 0.62, 0.022, '#8f4a38', 3);
    // Log yard under a gantry crane, a truck delivering, forklift with boards.
    gantry(l, 0.08, 0.6, 0.7, 0.26, 0.24);
    logPile(l, 0.2, 0.7, 5, 0.22, Math.PI / 2);
    logPile(l, 0.44, 0.7, 4, 0.22, Math.PI / 2);
    truck(l, 0.74, 0.62, 0, '#3f6b8a');
    for (let k = 0; k < 3; k++) {
      const log = new THREE.CylinderGeometry(0.011, 0.011, 0.1, 8).rotateZ(Math.PI / 2);
      l.shape(log, '#7a5634', ...off(l, 0.72, 0.62, 0, (k - 1) * 0.018), 0.085);
    }
    lumberStack(l, 0.72, 0.88, 0.12, 0.06, 9);
    lumberStack(l, 0.88, 0.88, 0.12, 0.06, 7);
    forklift(l, 0.62, 0.82, 0.3);
    for (let i = 0; i < 3; i++) pallet(l, 0.1 + i * 0.07, 0.94, '#d2b07a');
    drums(l, 0.94, 0.5, 3, '#2f5d8a');
    workers(l, [
      [0.56, 0.6, '#e8742a', hat],
      [0.3, 0.86, '#e8742a', hat],
      [0.86, 0.72, '#5a7a9a', hat],
    ]);
    fence(l, [
      [0.03, 0.6],
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
    signboard(l, 0.42, 0.96, 0.09, 0.12, '#24476a');
  },

  // -----------------------------------------------------------------------------------------
  // Windmills
  // -----------------------------------------------------------------------------------------
  windmill(l) {
    site(l, 'windmill', '#8f7f62', [0.3, 0.3, 0.7, 0.7]);
    fields(l, 0.04, 0.04, 0.3, 0.5);
    fields(l, 0.72, 0.06, 0.96, 0.44);
    // Post mill: cross trestle and quarter bars carry the main post and the turning buck.
    const cx = 0.5;
    const cz = 0.48;
    for (const ry of [0, Math.PI / 2]) {
      wbox(l, cx, cz, 0.03, 0.2, 0.016, 0.02, '#5c4630', ry);
      for (const s of [-1, 1])
        l.beam(
          [
            cx + (Math.cos(ry) * s * 0.09) / l.spanX,
            0.046,
            cz - (Math.sin(ry) * s * 0.09) / l.spanZ,
          ],
          [cx, 0.16, cz],
          0.01,
          '#5c4630',
        );
    }
    wround(l, cx, cz, 0.014, 0.016, 0.03, 0.18, '#4a3a2a', 8);
    boardBody(l, cx, cz, 0.12, 0.16, 0.18, 0.18, '#a07a52');
    window4(l, cx, cz, 0.12, 0.16, '+x', 0, 0.26, 0.026, { frame: '#efe7d6' });
    shingleGable(l, cx, cz, 'z', 0.16, 0.12, 0.36, 0.06, '#5e4a38', '#a07a52');
    windmillSails(l, cx, cz + 0.08 / l.spanZ, 0.29, 0.22, 0);
    // Tail pole and steps down to the ground at the back.
    l.beam([cx, 0.2, cz - 0.08 / l.spanZ], [cx, 0.034, cz - 0.28 / l.spanZ], 0.012, '#5c4630');
    for (let i = 0; i < 6; i++)
      wbox(l, cx, cz - (0.1 + i * 0.03) / l.spanZ, 0.18 - i * 0.026, 0.05, 0.004, 0.012, '#7a5634');
    wround(l, cx, cz - 0.3 / l.spanZ, 0.02, 0.02, 0.03, 0.01, '#5a5650', 10);
    // Sacks, millstones, a cart, the miller, a hedge and fence.
    sacks(l, 0.66, 0.66, 9);
    millstone(l, 0.36, 0.64);
    millstone(l, 0.4, 0.68, false);
    horse(l, 0.62, 0.86, 0);
    cart(l, 0.76, 0.86, 0, 'barrels');
    path(l, 0.5, 0.62, 0.5, 0.98, 0.06);
    workers(l, [
      [0.58, 0.6, '#e9e0c8', '#8a6a3a'],
      [0.84, 0.66, '#6a4a3a', '#3a3a3c'],
    ]);
    railFence(l, 0.03, 0.55, 0.3, 0.55);
    railFence(l, 0.72, 0.48, 0.97, 0.48);
    for (let i = 0; i < 5; i++) shrub(l, 0.06 + i * 0.05, 0.94, 0.025);
    signboard(l, 0.36, 0.9, 0.08, 0.08, '#5c4630');
  },

  smock_windmill(l) {
    site(l, 'smock_windmill', '#8f7f62', [0.22, 0.26, 0.78, 0.8]);
    fields(l, 0.04, 0.04, 0.26, 0.6);
    // Octagonal brick base, white weatherboarded smock, boat cap, stage gallery and fantail.
    const cx = 0.5;
    const cz = 0.46;
    octTower(l, cx, cz, 0.03, 0.1, 0.11, 0.105, '#a24a35', 6);
    for (const f of ['+z', '+x', '-x'] as const)
      faceBox(l, cx, cz, 0.2, 0.2, f, 0, -0.005, 0.05, 0.03, 0.05, 0.006, pane, 1);
    octTower(l, cx, cz, 0.13, 0.2, 0.1, 0.065, '#f1ece0', 10);
    window4(l, cx, cz, 0.16, 0.16, '+z', 0, 0.22, 0.024, { frame: '#5a4a3a' });
    window4(l, cx, cz, 0.14, 0.14, '+z', 0, 0.27, 0.02, { frame: '#5a4a3a' });
    catwalk(l, cx, cz, 0.105, 0.13);
    const cap = new THREE.SphereGeometry(0.07, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(
      1,
      0.8,
      1.3,
    );
    l.shape(cap, '#5c4632', cx, cz, 0.33);
    windmillSails(l, cx, cz + 0.09 / l.spanZ, 0.36, 0.24, 0);
    l.beam([cx, 0.37, cz - 0.06 / l.spanZ], [cx, 0.39, cz - 0.13 / l.spanZ], 0.008, '#4a3a2a');
    fantail(l, cx, cz - 0.13 / l.spanZ, 0.41, 0.035);
    // Granary with a lean-to, sacks on a cart, a cobbled yard.
    const gx = 0.8;
    const gz = 0.7;
    boardBody(l, gx, gz, 0.16, 0.12, 0.03, 0.1, '#8a6a4a');
    door(l, gx, gz, 0.16, 0.12, '-x', 0, 0.03, 0.05, 0.08, timberDark, true);
    window4(l, gx, gz, 0.16, 0.12, '+z', 0, 0.07, 0.024, { shutters: '#4a3a2a' });
    shingleGable(l, gx, gz, 'x', 0.16, 0.12, 0.13, 0.06, '#5e4a38', '#8a6a4a');
    apron(l, 0.36, 0.62, 0.68, 0.8, '#a59d8c');
    sacks(l, 0.62, 0.72, 12);
    horse(l, 0.4, 0.9, 0);
    cart(l, 0.54, 0.9, 0, 'crates');
    millstone(l, 0.3, 0.7);
    workers(l, [
      [0.46, 0.7, '#e9e0c8', '#8a6a3a'],
      [0.7, 0.56, '#6a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.68, 0.84, 0.14);
    railFence(l, 0.03, 0.62, 0.26, 0.62);
    railFence(l, 0.97, 0.03, 0.97, 0.6);
    for (let i = 0; i < 4; i++) shrub(l, 0.06 + i * 0.05, 0.94, 0.025);
    signboard(l, 0.84, 0.92, 0.08, 0.09, '#5c4630');
  },

  stone_windmill(l) {
    site(l, 'stone_windmill', '#8f8170', [0.18, 0.2, 0.82, 0.86]);
    fields(l, 0.04, 0.04, 0.22, 0.56);
    // Tall tapering stone tower with string courses, windows up its height and a stage gallery.
    const cx = 0.48;
    const cz = 0.42;
    const rings = 22;
    for (let i = 0; i < rings; i++) {
      const t = i / rings;
      const r = 0.1 - 0.035 * t;
      wround(l, cx, cz, r - 0.0015, r, 0.03 + t * 0.36, 0.36 / rings, tone('#bdb3a0', 0.08), 16);
    }
    for (const t of [0.3, 0.62])
      wround(
        l,
        cx,
        cz,
        0.1 - 0.035 * t + 0.004,
        0.1 - 0.035 * t + 0.004,
        0.03 + t * 0.36,
        0.008,
        '#9a9282',
        16,
      );
    for (const [y, rr] of [
      [0.08, 0.1],
      [0.17, 0.092],
      [0.27, 0.085],
      [0.33, 0.078],
    ] as const) {
      faceBox(l, cx, cz, rr * 2, rr * 2, '+z', 0, -0.006, y, 0.026, 0.034, 0.006, '#4a3a2a');
      faceBox(l, cx, cz, rr * 2, rr * 2, '+z', 0, -0.004, y + 0.004, 0.018, 0.026, 0.004, pane, 1);
      faceBox(l, cx, cz, rr * 2, rr * 2, '+x', 0, -0.006, y + 0.04, 0.026, 0.034, 0.006, '#4a3a2a');
    }
    door(l, cx, cz, 0.2, 0.2, '+z', 0.05, 0.03, 0.05, 0.08, timberDark);
    // Timber stage on raking struts with a railing.
    const stage = new THREE.RingGeometry(0.07, 0.15, 20).rotateX(-Math.PI / 2);
    l.shape(stage, '#6b4a2c', cx, cz, 0.19);
    l.shape(stage.clone().rotateX(Math.PI), '#5c4630', cx, cz, 0.188);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      l.beam(
        [cx + (Math.cos(a) * 0.09) / l.spanX, 0.12, cz + (Math.sin(a) * 0.09) / l.spanZ],
        [cx + (Math.cos(a) * 0.145) / l.spanX, 0.188, cz + (Math.sin(a) * 0.145) / l.spanZ],
        0.006,
        '#5c4630',
      );
      wbox(
        l,
        cx + (Math.cos(a) * 0.145) / l.spanX,
        cz + (Math.sin(a) * 0.145) / l.spanZ,
        0.19,
        0.004,
        0.03,
        0.004,
        '#5c4630',
      );
    }
    l.shape(
      new THREE.TorusGeometry(0.145, 0.003, 4, 24).rotateX(Math.PI / 2),
      '#5c4630',
      cx,
      cz,
      0.22,
    );
    const cap = new THREE.SphereGeometry(0.075, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(
      1,
      0.75,
      1.3,
    );
    l.shape(cap, '#4a3a2a', cx, cz, 0.39);
    windmillSails(l, cx, cz + 0.09 / l.spanZ, 0.42, 0.25, 0);
    l.beam([cx, 0.42, cz - 0.06 / l.spanZ], [cx, 0.44, cz - 0.14 / l.spanZ], 0.008, '#4a3a2a');
    fantail(l, cx, cz - 0.14 / l.spanZ, 0.46, 0.04);
    // Miller's house, cart shed, sacks on the hoist, cobbled yard.
    const mx = 0.8;
    const mz = 0.72;
    stoneBody(l, mx, mz, 0.18, 0.14, 0.03, 0.12, '#bdb3a0');
    windows4(l, mx, mz, 0.18, 0.14, 0.07, 0.028, { shutters: '#3f5a4a' });
    door(l, mx, mz, 0.18, 0.14, '-x', 0, 0.03, 0.04, 0.08, timberDark);
    shingleGable(l, mx, mz, 'z', 0.14, 0.18, 0.15, 0.07, slate, '#bdb3a0');
    l.shape(
      new THREE.BoxGeometry(0.02, 0.06, 0.02),
      '#8c5a40',
      ...off(l, mx, mz, 0.06, 0.04),
      0.22,
    );
    apron(l, 0.32, 0.6, 0.66, 0.82, '#a59d8c');
    sacks(l, 0.58, 0.66, 12);
    l.beam([cx, 0.3, cz + 0.08 / l.spanZ], [cx, 0.08, cz + 0.08 / l.spanZ], 0.002, '#1c1f21');
    sacks(l, cx, cz + 0.1 / l.spanZ, 2);
    horse(l, 0.4, 0.9, 0);
    cart(l, 0.54, 0.9, 0, 'crates');
    workers(l, [
      [0.36, 0.66, '#e9e0c8', '#8a6a3a'],
      [0.66, 0.56, '#6a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.3, 0.84, 0.15);
    railFence(l, 0.03, 0.6, 0.22, 0.6);
    for (let i = 0; i < 4; i++) shrub(l, 0.06 + i * 0.05, 0.94, 0.025);
    signboard(l, 0.84, 0.94, 0.08, 0.09, '#3f5a4a');
  },

  multi_vane_mill(l) {
    site(l, 'multi_vane_mill', '#7f7a6e', [0.05, 0.05, 0.95, 0.95]);
    // Steel lattice tower carrying a multi-vane wind wheel and a tail vane.
    const cx = 0.36;
    const cz = 0.4;
    pylon(l, cx, cz, 0.5);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [cx + (a * 0.06) / l.spanX, 0.03, cz + (b * 0.06) / l.spanZ],
        [cx, 0.5, cz],
        0.006,
        '#7e868c',
      );
    catwalk(l, cx, cz, 0.03, 0.51);
    const hubY = 0.56;
    wround(l, ...off(l, cx, cz, 0, 0.02), 0.012, 0.012, hubY - 0.03, 0.03, '#4a5257', 8);
    const vanes = 18;
    for (let i = 0; i < vanes; i++) {
      const a = (i / vanes) * Math.PI * 2;
      const v = new THREE.BoxGeometry(0.03, 0.14, 0.003)
        .translate(0, 0.1, 0)
        .rotateY(0.35)
        .rotateZ(a);
      l.shape(v, i % 2 ? '#e9e4d6' : '#c84a3a', ...off(l, cx, cz, 0, 0.04), hubY);
    }
    for (const r of [0.04, 0.17])
      l.shape(
        new THREE.TorusGeometry(r, 0.003, 4, 30),
        '#4a5257',
        ...off(l, cx, cz, 0, 0.04),
        hubY,
      );
    l.beam([cx, hubY, cz], [cx, hubY + 0.01, cz - 0.2 / l.spanZ], 0.008, '#4a5257');
    wbox(l, cx, cz - 0.22 / l.spanZ, hubY - 0.04, 0.004, 0.09, 0.08, '#c84a3a');
    ladder(l, cx, cz, 0.04, 0.5, 0.04);
    // Brick powerhouse with dynamo hall, cables down the tower, a water tank and pump.
    const px = 0.72;
    const pz = 0.36;
    brickBody(l, px, pz, 0.3, 0.2, 0.03, 0.15, '#9a4a35');
    hallFacade(l, px, pz, 0.3, 0.2, 0.03, 0.15, '#9a4a35', { bay: 0.075, skip: [['+z', 1]] });
    door(l, px, pz, 0.3, 0.2, '+z', -0.04, 0.03, 0.05, 0.1, timberDark);
    tinGable(l, px, pz, 'x', 0.3, 0.2, 0.18, 0.07, '#4f5a60', '#9a4a35');
    ridgeLantern(l, px, pz, 'x', 0.18, 0.25, '#3f464b');
    l.beam([cx, 0.3, cz], [px - 0.15 / l.spanX, 0.15, pz], 0.003, '#1c1f21');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.2, 0.8, a * 0.03, b * 0.03), 0.03, 0.008, 0.16, 0.008, iron);
    wround(l, 0.2, 0.8, 0.05, 0.05, 0.19, 0.08, '#6e777b', 16);
    l.shape(new THREE.ConeGeometry(0.054, 0.03, 16), '#4a5257', 0.2, 0.8, 0.285);
    ladder(l, 0.2, 0.8, 0.04, 0.27, 0.052);
    pipe(l, [0.2, 0.06, 0.8], [0.4, 0.06, 0.8], 0.008);
    wbox(l, 0.44, 0.8, 0.03, 0.06, 0.05, 0.05, '#5a6268');
    // Grain store, sacks and pallets, a lorry, fence and works sign.
    sacks(l, 0.62, 0.66, 12);
    for (let i = 0; i < 3; i++) pallet(l, 0.74 + i * 0.07, 0.66, '#e9e0c8');
    truck(l, 0.7, 0.88, 0, '#7a3a2a');
    workers(l, [
      [0.52, 0.6, '#5a7a9a', '#3a3a3c'],
      [0.84, 0.56, '#6a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.5, 0.86, 0.16);
    fence(l, [
      [0.03, 0.97],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.5],
    ]);
    signboard(l, 0.92, 0.94, 0.09, 0.1, '#3a2a22');
  },

  wind_turbine_spire(l) {
    site(l, 'wind_turbine_spire', '#8a877e', [0.05, 0.05, 0.95, 0.95]);
    // Limestone spire with brass ribs, a verdigris copper dome and observation gallery.
    const cx = 0.42;
    const cz = 0.44;
    wround(l, cx, cz, 0.12, 0.13, 0.03, 0.04, '#bdb3a0', 16);
    const rings = 20;
    for (let i = 0; i < rings; i++) {
      const t = i / rings;
      wround(
        l,
        cx,
        cz,
        0.085 - 0.035 * (t + 1 / rings),
        0.085 - 0.035 * t,
        0.07 + t * 0.4,
        0.4 / rings,
        tone(limestone, 0.05),
        16,
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      l.beam(
        [cx + (Math.cos(a) * 0.087) / l.spanX, 0.07, cz + (Math.sin(a) * 0.087) / l.spanZ],
        [cx + (Math.cos(a) * 0.052) / l.spanX, 0.47, cz + (Math.sin(a) * 0.052) / l.spanZ],
        0.006,
        brass,
      );
    }
    for (const y of [0.16, 0.26, 0.36]) {
      faceBox(l, cx, cz, 0.15, 0.15, '+z', 0, -0.004, y, 0.024, 0.04, 0.005, '#3a3f42');
      faceBox(l, cx, cz, 0.15, 0.15, '+z', 0, -0.002, y + 0.004, 0.016, 0.032, 0.004, pane, 1);
    }
    door(l, cx, cz, 0.17, 0.17, '+z', 0, 0.07, 0.04, 0.08, '#3a4a55');
    catwalk(l, cx, cz, 0.05, 0.47);
    const dome = new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(dome, copper, cx, cz, 0.48);
    wround(l, cx, cz, 0.012, 0.016, 0.53, 0.03, brass, 8);
    // Nacelle and a slender three-blade rotor facing +z.
    const ny = 0.56;
    wbox(l, cx, cz, ny - 0.02, 0.05, 0.05, 0.13, '#e2ded2');
    const nose = new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1, 1.5);
    l.shape(nose, '#e2ded2', ...off(l, cx, cz, 0, 0.075), ny);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      const blade = new THREE.BoxGeometry(0.02, 0.26, 0.006).translate(0, 0.14, 0).rotateZ(a);
      l.shape(blade, '#f2efe6', ...off(l, cx, cz, 0, 0.09), ny);
    }
    wbox(l, cx, cz, ny + 0.03, 0.006, 0.006, 0.006, '#ff3b2a', 0, 0, 1);
    // Substation: transformers, insulators, a control house, cables, security fence.
    for (let i = 0; i < 3; i++) {
      const x = 0.66 + i * 0.1;
      wbox(l, x, 0.22, 0.03, 0.06, 0.07, 0.05, '#7e868c');
      for (const dx of [-0.018, 0, 0.018])
        wround(l, ...off(l, x, 0.22, dx, 0), 0.005, 0.006, 0.1, 0.035, '#d8e6ea', 8);
      for (let f = 0; f < 4; f++)
        wbox(l, ...off(l, x, 0.22, -0.03 + f * 0.02, 0.03), 0.04, 0.045, 0.004, 0.01, '#5a6268');
    }
    pylon(l, 0.92, 0.12, 0.3);
    l.beam([cx, 0.12, cz], [0.66, 0.1, 0.22], 0.003, '#1c1f21');
    renderBody(l, 0.78, 0.6, 0.2, 0.14, 0.03, 0.11, limestone, '#9a9282');
    windows4(l, 0.78, 0.6, 0.2, 0.14, 0.06, 0.03, { frame: brass });
    wbox(l, 0.78, 0.6, 0.14, 0.22, 0.012, 0.16, copper);
    clockStrip(l, 0.78, 0.6);
    apron(l, 0.2, 0.74, 0.62, 0.94);
    truck(l, 0.36, 0.86, 0, '#24476a');
    workers(l, [
      [0.56, 0.62, '#e8742a', hat],
      [0.62, 0.84, '#5a7a9a', hat],
    ]);
    lanternPost(l, 0.16, 0.66, 0.16);
    lanternPost(l, 0.66, 0.44, 0.16);
    fence(l, [
      [0.58, 0.04],
      [0.97, 0.04],
      [0.97, 0.36],
      [0.58, 0.36],
      [0.58, 0.04],
    ]);
    signboard(l, 0.92, 0.84, 0.09, 0.1, '#24476a');
    for (let i = 0; i < 4; i++) shrub(l, 0.06, 0.2 + i * 0.12, 0.03);
    barrel(l, 0.12, 0.84);
    crate(l, 0.16, 0.9, 0.036, '#8a6a48', 0.4);
  },
};

/** Copper ridge strip and brass finials on the substation control house. */
function clockStrip(l: Lot, x: number, z: number): void {
  for (const s of [-1, 1])
    wround(l, ...off(l, x, z, s * 0.1, 0), 0.003, 0.008, 0.152, 0.03, brass, 6);
  wbox(l, x, z, 0.152, 0.2, 0.006, 0.02, shade(copper, 0.85));
}
