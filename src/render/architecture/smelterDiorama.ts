import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  crate,
  door,
  horse,
  lanternPost,
  off,
  railFence,
  rand,
  shingleGable,
  shrub,
  stoneBody,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import { channel, smoke, truck, waterWheel } from './dioramaProps';
import {
  apron,
  catwalk,
  drums,
  faceAt,
  faceBox,
  fence,
  forklift,
  gantry,
  gasRack,
  glassDome,
  hallFacade,
  hat,
  hot,
  iron,
  ladder,
  melt,
  pallet,
  pane,
  pipe,
  pipeRack,
  pylon,
  ridgeLantern,
  signboard,
  site,
  stack,
  timberDark,
} from './industryKit';
import { blockStack, brickBody, railLine, rubble, wagon, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B: the smelter chain, drawn in the shared 0.77-unit frame.
//   smelter -> bellows_smelter -> reverberatory_furnace -> blast_furnace
//           -> bessemer_converter -> electric_arc_smelter -> metallurgical_spire

const brass = '#c9a24a';
const copper = '#b8693a';
const verdigris = '#5fa58e';
const clay = '#a8724e';

/** Charcoal clamp: a turf-covered mound gently smoking. */
function charcoalClamp(l: Lot, x: number, z: number, r: number): void {
  const mound = new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(
    1,
    0.55,
    1,
  );
  l.shape(mound, '#4a4238', x, z, 0.03);
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6),
      0.03 + r * 0.3,
      0.02,
      0.006,
      0.02,
      '#5a6a3a',
      a,
    );
  }
  smoke(l, x, z, 0.03 + r * 0.5, 2);
}

/** Heap of ore or slag. */
function heap(l: Lot, x: number, z: number, r: number, color: string, glow = 0): void {
  for (let i = 0; i < 5; i++)
    wbox(
      l,
      x,
      z,
      0.034 + i * 0.012,
      r * 2 - i * r * 0.36,
      0.014,
      r * 1.7 - i * r * 0.3,
      tone(color, 0.25),
      i * 0.7,
      0,
      i > 3 ? glow : 0,
    );
}

/** Pig-iron casting bed: sand floor with a runner and glowing side moulds. */
function pigBed(l: Lot, x: number, z: number, w: number, d: number, hotNow = true): void {
  wbox(l, x, z, 0.03, w, 0.008, d, '#b09a78');
  wbox(l, x, z, 0.038, w * 0.9, 0.004, 0.012, hotNow ? hot : '#5a5f63', 0, 0, hotNow ? 1 : 0);
  const n = Math.max(3, Math.round(w / 0.03));
  for (let i = 0; i < n; i++)
    for (const s of [-1, 1])
      wbox(
        l,
        ...off(l, x, z, -w * 0.42 + (i * w * 0.84) / (n - 1), s * d * 0.28),
        0.038,
        0.01,
        0.004,
        d * 0.4,
        hotNow && i % 2 ? hot : '#6a5a4a',
        0,
        0,
        hotNow && i % 2 ? 1 : 0,
      );
}

/** Copper induction coil: stacked glowing rings. */
function coil(l: Lot, x: number, z: number, y: number, r: number, turns: number): void {
  for (let i = 0; i < turns; i++)
    l.shape(
      new THREE.TorusGeometry(r, 0.006, 6, 20).rotateX(Math.PI / 2),
      copper,
      x,
      z,
      y + i * 0.016,
      i % 2 ? 0.3 : 0,
    );
}

/** Ingots stacked crosswise. */
function ingots(l: Lot, x: number, z: number, layers: number, color = '#7a8186'): void {
  for (let i = 0; i < layers; i++)
    for (let k = 0; k < 3; k++)
      wbox(
        l,
        ...off(l, x, z, i % 2 ? (k - 1) * 0.016 : 0, i % 2 ? 0 : (k - 1) * 0.016),
        0.034 + i * 0.01,
        i % 2 ? 0.012 : 0.05,
        0.009,
        i % 2 ? 0.05 : 0.012,
        color,
      );
}

/** Hot-blast stove: tall domed cylinder. */
function stove(l: Lot, x: number, z: number, h: number, r = 0.035): void {
  wround(l, x, z, r, r * 1.04, 0.03, h, tone('#9a8a78', 0.08), 14);
  for (let k = 1; k < 4; k++)
    wround(l, x, z, r + 0.002, r + 0.002, 0.03 + (k * h) / 4, 0.004, iron, 14);
  l.shape(
    new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    '#8a7a6a',
    x,
    z,
    0.03 + h,
  );
}

export const smelterDiorama: Recipes = {
  smelter(l) {
    site(l, 'smelter', '#7a6a58', [0.08, 0.08, 0.92, 0.92]);
    // Clay bloomery furnace with tuyere and bellows, under a thatched lean-to.
    const fx = 0.42;
    const fz = 0.4;
    wround(l, fx, fz, 0.035, 0.06, 0.03, 0.16, clay, 14);
    for (let i = 0; i < 4; i++)
      wround(
        l,
        fx,
        fz,
        0.06 - i * 0.006 + 0.002,
        0.06 - i * 0.006 + 0.002,
        0.05 + i * 0.035,
        0.004,
        '#7a4a2e',
        14,
      );
    wround(l, fx, fz, 0.03, 0.035, 0.19, 0.01, '#5a3a2a', 14);
    melt(l, fx, fz, 0.198, 0.026);
    smoke(l, fx, fz, 0.21, 3);
    faceBox(l, fx, fz, 0.12, 0.12, '+z', 0, -0.004, 0.034, 0.03, 0.03, 0.004, hot, 1);
    for (const s of [-1, 1]) {
      const b = new THREE.ConeGeometry(0.02, 0.06, 4).rotateZ(Math.PI / 2);
      l.shape(b, '#6b4a2c', ...off(l, fx, fz, -0.1, s * 0.025), 0.06);
    }
    l.beam([fx - 0.07 / 0.77, 0.06, fz], [fx - 0.03 / 0.77, 0.05, fz], 0.006, '#5a3a2a');
    // Thatched lean-to over the bellows and the smiths, beside (not over) the furnace mouth.
    const [sx, sz] = off(l, fx, fz, -0.16, 0);
    for (const [dx, dz] of [
      [-0.07, -0.1],
      [0.06, -0.1],
      [-0.07, 0.1],
      [0.06, 0.1],
    ] as const)
      wbox(l, ...off(l, sx, sz, dx, dz), 0.03, 0.012, 0.15 - (dx < 0 ? 0.03 : 0), 0.012, '#5c4630');
    l.shape(new THREE.BoxGeometry(0.16, 0.014, 0.24).rotateZ(-0.22), '#c9a85a', sx, sz, 0.17);
    for (let i = 0; i < 6; i++)
      l.shape(
        new THREE.BoxGeometry(0.17, 0.004, 0.006).rotateZ(-0.22),
        '#b08f48',
        ...off(l, sx, sz, 0, -0.1 + i * 0.04),
        0.18,
      );
    // Charcoal clamp, ore heap, slag, blooms on the anvil, wood store.
    charcoalClamp(l, 0.76, 0.24, 0.1);
    heap(l, 0.2, 0.72, 0.05, '#8a4a3a');
    heap(l, 0.66, 0.66, 0.045, '#3a3532');
    wround(l, 0.5, 0.66, 0.012, 0.014, 0.03, 0.03, '#6b4a2c', 8);
    wbox(l, 0.5, 0.66, 0.06, 0.03, 0.012, 0.014, iron);
    wbox(l, 0.53, 0.68, 0.034, 0.024, 0.014, 0.02, '#5a4a42');
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 4 - i; k++) {
        const log = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6).rotateX(Math.PI / 2);
        l.shape(
          log,
          tone('#7a5634', 0.12),
          0.84 + (k * 0.017 + i * 0.0085) / 0.77,
          0.6,
          0.038 + i * 0.014,
        );
      }
    horse(l, 0.4, 0.88, 0);
    cart(l, 0.54, 0.88, 0, 'barrels');
    workers(l, [
      [0.32, 0.56, '#6a4a3a', '#3a3a3c'],
      [0.56, 0.5, '#5a4a3a', '#3a3a3c'],
      [0.7, 0.42, '#7a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.2, 0.3, 0.13);
    railFence(l, 0.03, 0.97, 0.97, 0.97);
    railFence(l, 0.03, 0.03, 0.03, 0.97);
    for (let i = 0; i < 3; i++) shrub(l, 0.84 + i * 0.05, 0.9, 0.025);
    signboard(l, 0.18, 0.92, 0.08, 0.08, '#5c4630');
  },

  bellows_smelter(l) {
    site(l, 'bellows_smelter', '#7a6c5c', [0.2, 0.06, 0.94, 0.94]);
    channel(l, 0.08, 0.02, 0.08, 0.98, 0.09);
    waterWheel(l, 0.16, 0.5, 0.02, 0.1, Math.PI / 2);
    // Square stone furnace stack, tapering, with a casting arch and a charging bridge.
    const fx = 0.54;
    const fz = 0.36;
    for (let i = 0; i < 8; i++) {
      const w = 0.2 - i * 0.012;
      stoneBody(l, fx, fz, w, w, 0.03 + i * 0.035, 0.035, '#a49c8c', 0.035);
    }
    wbox(l, fx, fz, 0.31, 0.1, 0.02, 0.1, '#7a7264');
    melt(l, fx, fz, 0.33, 0.03);
    smoke(l, fx, fz, 0.34, 4);
    faceBox(l, fx, fz, 0.2, 0.2, '+z', 0, 0.002, 0.03, 0.07, 0.08, 0.008, '#3a3430');
    faceBox(l, fx, fz, 0.2, 0.2, '+z', 0, 0.006, 0.03, 0.04, 0.05, 0.004, hot, 1);
    for (const s of [-1, 1])
      faceBox(l, fx, fz, 0.2, 0.2, '+z', s * 0.05, 0.004, 0.11, 0.012, 0.02, 0.006, '#7a7264');
    // Charging bridge from the bank down to the furnace mouth.
    rubble(l, 0.86, 0.14, 0.03, 10, 0.08, '#8a8270');
    wbox(l, 0.86, 0.14, 0.03, 0.14, 0.1, 0.12, '#7a7264');
    l.beam([0.82, 0.13, 0.14], [fx + 0.06 / 0.77, 0.31, fz - 0.02 / 0.77], 0.03, '#6b4a2c');
    // Bellows house on the wheel: twin great bellows driven by cams off the shaft.
    const bx = 0.3;
    const bz = 0.5;
    boardBody(l, bx, bz, 0.16, 0.14, 0.03, 0.1, '#7a5a3c');
    shingleGable(l, bx, bz, 'z', 0.14, 0.16, 0.13, 0.06, '#5e4a38', '#7a5a3c');
    for (const s of [-1, 1]) {
      const b = new THREE.ConeGeometry(0.03, 0.12, 4).rotateZ(-Math.PI / 2).rotateY(Math.PI / 4);
      l.shape(b, '#5a3a24', ...off(l, bx, bz, 0.14, s * 0.03), 0.07);
    }
    l.beam([0.16, 0.12, 0.5], [bx, 0.12, 0.5], 0.008, '#3a3530');
    l.beam(
      [bx + 0.18 / 0.77, 0.07, 0.5],
      [fx - 0.1 / 0.77, 0.06, fz + 0.04 / 0.77],
      0.012,
      '#4a3a2a',
    );
    // Charcoal barn, ore and slag heaps, pigs on the casting floor.
    boardBody(l, 0.82, 0.62, 0.14, 0.16, 0.03, 0.1, '#6b5a48');
    door(l, 0.82, 0.62, 0.14, 0.16, '-x', 0, 0.03, 0.06, 0.08, timberDark, true);
    shingleGable(l, 0.82, 0.62, 'z', 0.16, 0.14, 0.13, 0.06, '#5e4a38', '#6b5a48');
    heap(l, 0.36, 0.84, 0.05, '#8a4a3a');
    heap(l, 0.86, 0.88, 0.045, '#2a2826');
    pigBed(l, 0.56, 0.62, 0.16, 0.1);
    ingots(l, 0.66, 0.84, 3);
    horse(l, 0.52, 0.9, 0);
    cart(l, 0.66, 0.9, 0, 'crates');
    workers(l, [
      [0.46, 0.56, '#6a4a3a', '#3a3a3c'],
      [0.66, 0.5, '#5a4a3a', '#3a3a3c'],
      [0.36, 0.7, '#7a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.7, 0.28, 0.14);
    railFence(l, 0.18, 0.97, 0.97, 0.97);
    signboard(l, 0.24, 0.92, 0.08, 0.09, '#5c4630');
  },

  reverberatory_furnace(l) {
    site(l, 'reverberatory_furnace', '#6f665c', [0.05, 0.05, 0.95, 0.95]);
    // Long low brick furnace bound with iron buckstays and tie rods, chimney at the flue end.
    const fx = 0.42;
    const fz = 0.38;
    brickBody(l, fx, fz, 0.42, 0.16, 0.03, 0.1, '#9a4632');
    const arch = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 14, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(arch, '#8c4430', fx, fz, 0.13);
    for (let i = 0; i < 7; i++) {
      const t = -0.18 + i * 0.06;
      for (const s of [-1, 1])
        wbox(l, ...off(l, fx, fz, t, s * 0.085), 0.03, 0.01, 0.17, 0.01, iron);
      wbox(l, ...off(l, fx, fz, t, 0), 0.205, 0.006, 0.006, 0.18, iron);
    }
    for (const t of [-0.12, 0, 0.12]) {
      faceBox(l, fx, fz, 0.42, 0.16, '+z', t, 0.004, 0.05, 0.04, 0.04, 0.006, '#3a3430');
      faceBox(l, fx, fz, 0.42, 0.16, '+z', t, 0.008, 0.055, 0.028, 0.026, 0.004, hot, 1);
    }
    stack(l, ...off(l, fx, fz, 0.26, 0), 0.4, 0.026, '#9c5640', 4);
    wbox(l, ...off(l, fx, fz, -0.25, 0), 0.03, 0.08, 0.12, 0.12, '#8c4430');
    // Casting shed: iron columns and a corrugated roof over the tapping floor.
    for (const [x, z] of [
      [0.2, 0.62],
      [0.44, 0.62],
      [0.68, 0.62],
      [0.2, 0.88],
      [0.44, 0.88],
      [0.68, 0.88],
    ] as const)
      wround(l, x, z, 0.007, 0.008, 0.03, 0.15, iron, 8);
    tinGable(l, 0.44, 0.75, 'x', 0.42, 0.22, 0.18, 0.05, '#4a4f54');
    pigBed(l, 0.44, 0.75, 0.3, 0.12);
    // Coal and ore yard on a rail siding, ingot stacks, tools.
    railLine(l, 0.04, 0.16, 0.96, 0.16, 0.036, { steel: true });
    wagon(l, 0.3, 0.16, 0, '#2a2c2e', 0.042, '#6e6e70');
    wagon(l, 0.48, 0.16, 0, '#8a4a3a', 0.042, '#6e6e70');
    heap(l, 0.86, 0.36, 0.05, '#26282a');
    heap(l, 0.88, 0.56, 0.04, '#8a4a3a');
    ingots(l, 0.86, 0.8, 4);
    ingots(l, 0.9, 0.9, 3);
    barrel(l, 0.08, 0.5);
    barrel(l, 0.1, 0.56);
    workers(l, [
      [0.32, 0.56, '#6a4a3a', '#3a3a3c'],
      [0.56, 0.7, '#5a4a3a', '#3a3a3c'],
      [0.74, 0.46, '#7a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.3, 0.15);
    lanternPost(l, 0.92, 0.66, 0.15);
    fence(l, [
      [0.03, 0.97],
      [0.97, 0.97],
    ]);
    signboard(l, 0.12, 0.94, 0.08, 0.1, '#3a2a22');
  },

  blast_furnace(l) {
    site(l, 'blast_furnace', '#665e56', [0.04, 0.04, 0.96, 0.96]);
    // Iron-banded furnace stack on a brick hearth with a bustle pipe and two hot-blast stoves.
    const bx = 0.4;
    const bz = 0.34;
    wbox(l, bx, bz, 0.03, 0.18, 0.06, 0.18, '#8c4430');
    wround(l, bx, bz, 0.055, 0.075, 0.09, 0.26, '#6a4a3a', 16);
    for (let i = 1; i < 5; i++)
      wround(l, bx, bz, 0.077 - i * 0.004, 0.077 - i * 0.004, 0.09 + i * 0.05, 0.005, iron, 16);
    wround(l, bx, bz, 0.04, 0.055, 0.35, 0.06, '#5a3e30', 16);
    l.shape(
      new THREE.TorusGeometry(0.085, 0.008, 6, 20).rotateX(Math.PI / 2),
      '#5a5f63',
      bx,
      bz,
      0.11,
    );
    catwalk(l, bx, bz, 0.06, 0.34);
    ladder(l, bx, bz, 0.09, 0.34, 0.08);
    smoke(l, bx, bz, 0.42, 3);
    faceBox(l, bx, bz, 0.18, 0.18, '+z', 0, 0.004, 0.034, 0.05, 0.04, 0.004, hot, 1);
    for (const [dx, dz] of [
      [-0.16, -0.06],
      [-0.16, 0.06],
    ] as const) {
      const [sx, sz] = off(l, bx, bz, dx, dz);
      stove(l, sx, sz, 0.3);
      l.beam([sx, 0.2, sz], [bx, 0.11, bz], 0.012, '#4a4440');
    }
    stack(l, ...off(l, bx, bz, -0.28, 0), 0.46, 0.02, '#8f4a38', 3);
    // Skip hoist up to the furnace top, with a skip car on the incline.
    for (const s of [-1, 1])
      l.beam(
        [0.84, 0.034, bz + (s * 0.02) / 0.77],
        [bx + 0.03 / 0.77, 0.38, bz + (s * 0.02) / 0.77],
        0.008,
        '#4d5559',
      );
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const x = 0.84 + (bx + 0.03 / 0.77 - 0.84) * t;
      wbox(l, x, bz, 0.03, 0.008, 0.004 + 0.35 * t, 0.008, '#4d5559');
    }
    wbox(l, 0.84 + (bx - 0.84) * 0.45, bz, 0.2, 0.04, 0.026, 0.034, '#2c2a28');
    wbox(l, 0.86, bz, 0.03, 0.08, 0.05, 0.08, '#5a5f63');
    // Cast house: open shed over the glowing pig bed.
    for (const [x, z] of [
      [0.16, 0.56],
      [0.66, 0.56],
      [0.16, 0.84],
      [0.66, 0.84],
    ] as const)
      wround(l, x, z, 0.008, 0.01, 0.03, 0.16, iron, 8);
    tinGable(l, 0.41, 0.7, 'x', 0.4, 0.24, 0.19, 0.06, '#4a4f54');
    ridgeLantern(l, 0.41, 0.7, 'x', 0.24, 0.25, '#3f464b');
    pigBed(l, 0.41, 0.7, 0.34, 0.16);
    // Ore and coke bins, a loco with wagons, ingots, crew in leathers.
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.76 + i * 0.07, 0.56, 0.03, 0.06, 0.05, 0.06, '#5a5f63');
      wbox(
        l,
        0.76 + i * 0.07,
        0.56,
        0.08,
        0.05,
        0.008,
        0.05,
        ['#8a4a3a', '#2a2c2e', '#c9c4b6'][i]!,
      );
    }
    railLine(l, 0.04, 0.94, 0.96, 0.94, 0.036, { steel: true });
    wagon(l, 0.3, 0.94, 0, '#8a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.46, 0.94, 0, '#2a2c2e', 0.042, '#6e6e70');
    ingots(l, 0.86, 0.76, 4);
    workers(l, [
      [0.3, 0.62, '#6a4a3a', '#3a3a3c'],
      [0.52, 0.8, '#5a4a3a', '#3a3a3c'],
      [0.72, 0.42, '#7a5a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.06, 0.54, 0.16);
    lanternPost(l, 0.94, 0.44, 0.16);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.4],
    ]);
    signboard(l, 0.88, 0.86, 0.08, 0.1, '#3a2a22');
  },

  bessemer_converter(l) {
    site(l, 'bessemer_converter', '#615a54', [0.03, 0.03, 0.97, 0.97]);
    // Converter hall: brick end walls, open-sided front with a tilted converter pouring.
    const hx = 0.44;
    const hz = 0.36;
    brickBody(l, hx, hz, 0.46, 0.28, 0.03, 0.2, '#8c4430');
    hallFacade(l, hx, hz, 0.46, 0.28, 0.03, 0.2, '#8c4430', {
      bay: 0.092,
      faces: ['-z', '+x', '-x'],
    });
    faceBox(l, hx, hz, 0.46, 0.28, '+z', 0, 0.002, 0.03, 0.4, 0.17, 0.006, '#1c1816');
    tinGable(l, hx, hz, 'x', 0.46, 0.28, 0.23, 0.1, '#4a4f54', '#8c4430');
    ridgeLantern(l, hx, hz, 'x', 0.3, 0.33, '#3f464b');
    for (const dx of [-0.14, 0.14]) stack(l, ...off(l, hx, hz, dx, -0.1), 0.5, 0.024, '#8f4a38', 4);
    // Tilted converter on trunnions, a stream of molten steel into the ladle, a spray of sparks.
    const [cx, cz] = faceAt(l, hx, hz, 0.46, 0.28, '+z', -0.06, 0.06);
    for (const s of [-1, 1])
      wbox(l, ...off(l, cx, cz, s * 0.06, 0), 0.03, 0.02, 0.12, 0.03, '#4a4f54');
    const conv = new THREE.SphereGeometry(0.05, 14, 10).scale(1, 1.35, 1).rotateZ(-0.7);
    l.shape(conv, '#5a4a42', cx, cz, 0.14);
    const mouth = new THREE.CylinderGeometry(0.02, 0.035, 0.05, 12).rotateZ(-0.7);
    l.shape(mouth, '#5a4a42', ...off(l, cx, cz, 0.05, 0), 0.19);
    l.beam([cx + 0.07 / 0.77, 0.2, cz], [cx + 0.12 / 0.77, 0.08, cz], 0.012, '#ffb347');
    wround(l, ...off(l, cx, cz, 0.13, 0), 0.035, 0.03, 0.03, 0.05, '#4a4440', 12);
    melt(l, ...off(l, cx, cz, 0.13, 0), 0.08, 0.03);
    for (let i = 0; i < 24; i++)
      wbox(
        l,
        ...off(l, cx, cz, 0.06 + (rand() - 0.3) * 0.14, (rand() - 0.5) * 0.14),
        0.1 + rand() * 0.2,
        0.007,
        0.007,
        0.007,
        '#ffb347',
        rand() * 3,
        0,
        1,
      );
    // Ladle crane across the yard, ingot moulds on a bogie line, scrap and lime.
    gantry(l, 0.12, 0.88, 0.66, 0.26, 0.16, '#d8a832');
    railLine(l, 0.04, 0.8, 0.96, 0.8, 0.036, { steel: true });
    for (let i = 0; i < 4; i++) {
      const x = 0.22 + i * 0.12;
      wbox(l, x, 0.8, 0.042, 0.08, 0.02, 0.05, '#3a3f42');
      for (const s of [-1, 1])
        wbox(
          l,
          ...off(l, x, 0.8, s * 0.02, 0),
          0.062,
          0.022,
          0.04,
          0.022,
          i < 2 ? '#c84a2a' : '#4a4f54',
          0,
          0,
          i < 2 ? 0.6 : 0,
        );
    }
    heap(l, 0.86, 0.9, 0.045, '#6e6a62');
    heap(l, 0.1, 0.92, 0.04, '#e9e4d6');
    ingots(l, 0.08, 0.6, 4);
    workers(l, [
      [0.62, 0.6, '#e8742a', hat],
      [0.3, 0.6, '#6a4a3a', '#3a3a3c'],
      [0.8, 0.52, '#5a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.94, 0.62, 0.16);
    fence(l, [
      [0.03, 0.5],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.5],
    ]);
    signboard(l, 0.5, 0.96, 0.08, 0.1, '#3a2a22');
  },

  electric_arc_smelter(l) {
    site(l, 'electric_arc_smelter', '#7e7b74', [0.03, 0.03, 0.97, 0.97]);
    // Steel-frame melt shop clad in glass, with the arc furnace visible through the front.
    const hx = 0.4;
    const hz = 0.36;
    wbox(l, hx, hz, 0.03, 0.46, 0.02, 0.3, '#9a978f');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.46 : 0.3;
      faceBox(l, hx, hz, 0.46, 0.3, f, 0, -0.004, 0.05, len, 0.2, 0.004, '#9ec7d4', 0.25);
      const n = Math.round(len / 0.06);
      for (let i = 0; i <= n; i++)
        faceBox(
          l,
          hx,
          hz,
          0.46,
          0.3,
          f,
          -len / 2 + (i * len) / n,
          0,
          0.03,
          0.01,
          0.24,
          0.01,
          '#4a5257',
        );
      for (const y of [0.05, 0.12, 0.19, 0.25])
        faceBox(l, hx, hz, 0.46, 0.3, f, 0, 0.001, y, len, 0.006, 0.008, '#4a5257');
    }
    wbox(l, hx, hz, 0.27, 0.48, 0.016, 0.32, '#5a6268');
    for (let i = 0; i < 4; i++)
      wbox(l, ...off(l, hx, hz, -0.15 + i * 0.1, 0), 0.286, 0.06, 0.03, 0.2, '#7a8186');
    // Arc furnace: squat shell, three graphite electrodes, copper coils glowing.
    // Open charging bay in the glass front, lit by the melt inside.
    faceBox(l, hx, hz, 0.46, 0.3, '+z', -0.06, 0.004, 0.03, 0.14, 0.13, 0.004, '#1c1816');
    faceBox(l, hx, hz, 0.46, 0.3, '+z', -0.06, 0.006, 0.04, 0.1, 0.06, 0.003, '#ffb347', 1);
    faceBox(l, hx, hz, 0.46, 0.3, '+z', -0.06, 0.008, 0.16, 0.15, 0.012, 0.012, '#d8a832');
    const [ex, ez] = off(l, hx, hz, -0.06, 0.02);
    wround(l, ex, ez, 0.07, 0.065, 0.05, 0.08, '#4a4f54', 18);
    melt(l, ex, ez, 0.131, 0.06);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      wround(
        l,
        ...off(l, ex, ez, Math.cos(a) * 0.025, Math.sin(a) * 0.025),
        0.008,
        0.008,
        0.13,
        0.12,
        '#2a2c2e',
        8,
      );
      wbox(
        l,
        ...off(l, ex, ez, Math.cos(a) * 0.025, Math.sin(a) * 0.025),
        0.13,
        0.012,
        0.012,
        0.012,
        '#ffd27a',
        0,
        0,
        1,
      );
    }
    coil(l, ex, ez, 0.06, 0.078, 4);
    wbox(l, ex, ez, 0.25, 0.1, 0.012, 0.03, copper);
    // Fume filter tower (bag house) with ducts, transformer yard, gas bottles, a forklift.
    const tx = 0.84;
    const tz = 0.22;
    wbox(l, tx, tz, 0.03, 0.12, 0.54, 0.12, '#b9b6ae');
    for (let i = 0; i < 9; i++)
      faceBox(
        l,
        tx,
        tz,
        0.12,
        0.12,
        '+z',
        0,
        0.002,
        0.06 + i * 0.055,
        0.1,
        0.008,
        0.004,
        '#8f8c84',
      );
    ladder(l, tx, tz, 0.04, 0.57, 0.064);
    wround(l, tx, tz, 0.02, 0.025, 0.57, 0.06, '#8f969a', 12);
    smoke(l, tx, tz, 0.64, 2);
    pipe(l, [hx, 0.3, hz], [tx, 0.3, tz], 0.016, '#9aa0a3');
    pipeRack(l, 0.66, 0.4, 0.66, 0.6, 0.14, 3, ['#c9b04a', '#4a7a9a', '#a0532f']);
    for (let i = 0; i < 2; i++) {
      const x = 0.78 + i * 0.12;
      wbox(l, x, 0.6, 0.03, 0.08, 0.08, 0.06, '#7e868c');
      for (const dx of [-0.02, 0, 0.02])
        wround(l, ...off(l, x, 0.6, dx, 0), 0.005, 0.006, 0.11, 0.04, '#d8e6ea', 8);
      for (let f = 0; f < 4; f++)
        wbox(l, ...off(l, x, 0.6, -0.03 + f * 0.02, 0.034), 0.04, 0.05, 0.004, 0.012, '#5a6268');
    }
    pylon(l, 0.94, 0.94, 0.32);
    l.beam([0.94, 0.3, 0.94], [0.9, 0.12, 0.6], 0.003, '#1c1f21');
    apron(l, 0.06, 0.62, 0.62, 0.96);
    forklift(l, 0.3, 0.76, 0.4);
    for (let i = 0; i < 3; i++) pallet(l, 0.12 + i * 0.07, 0.9, '#8f969a');
    gasRack(l, 0.5, 0.88);
    drums(l, 0.52, 0.7, 3, '#2f5d8a');
    workers(l, [
      [0.46, 0.66, '#e8742a', hat],
      [0.2, 0.68, '#5a7a9a', hat],
      [0.6, 0.84, '#f2cf4a', hat],
    ]);
    lanternPost(l, 0.06, 0.6, 0.17);
    fence(l, [
      [0.7, 0.97],
      [0.97, 0.97],
      [0.97, 0.03],
      [0.5, 0.03],
    ]);
    signboard(l, 0.06, 0.96, 0.09, 0.12, '#24476a');
  },

  metallurgical_spire(l) {
    site(l, 'metallurgical_spire', '#7a766e', [0.03, 0.03, 0.97, 0.97]);
    // Domed brass-and-glass base hall, round, ringed by buttress stacks.
    const cx = 0.46;
    const cz = 0.42;
    wround(l, cx, cz, 0.17, 0.18, 0.03, 0.03, '#a49c8c', 24);
    wround(l, cx, cz, 0.16, 0.16, 0.06, 0.1, '#7a4a3a', 24);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const [px, pz] = off(l, cx, cz, Math.cos(a) * 0.16, Math.sin(a) * 0.16);
      wbox(l, px, pz, 0.08, 0.04, 0.06, 0.004, pane, -a + Math.PI / 2, 0, 1);
      wbox(
        l,
        ...off(l, cx, cz, Math.cos(a + 0.26) * 0.163, Math.sin(a + 0.26) * 0.163),
        0.06,
        0.012,
        0.1,
        0.012,
        brass,
      );
    }
    wround(l, cx, cz, 0.165, 0.165, 0.16, 0.012, brass, 24);
    glassDome(l, cx, cz, 0.172, 0.12, brass);
    // The spire: tiered copper and brass drums with glowing crucible bands, crowned finial.
    const tiers: [number, number, number, string][] = [
      [0.07, 0.29, 0.1, copper],
      [0.058, 0.39, 0.08, brass],
      [0.048, 0.47, 0.08, verdigris],
      [0.038, 0.55, 0.07, copper],
    ];
    for (const [r, y, h, c] of tiers) {
      wround(l, cx, cz, r * 0.92, r, y, h, c, 16);
      wround(l, cx, cz, r + 0.004, r + 0.004, y + h * 0.4, 0.008, '#ffb347', 16);
      l.shape(
        new THREE.TorusGeometry(r + 0.004, 0.003, 4, 16).rotateX(Math.PI / 2),
        brass,
        cx,
        cz,
        y + h,
      );
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      l.beam(
        [cx + (Math.cos(a) * 0.13) / 0.77, 0.17, cz + (Math.sin(a) * 0.13) / 0.77],
        [cx + (Math.cos(a) * 0.06) / 0.77, 0.44, cz + (Math.sin(a) * 0.06) / 0.77],
        0.01,
        brass,
      );
    }
    catwalk(l, cx, cz, 0.058, 0.47);
    l.shape(new THREE.ConeGeometry(0.03, 0.08, 8), verdigris, cx, cz, 0.66);
    wround(l, cx, cz, 0.002, 0.006, 0.7, 0.05, brass, 6);
    l.shape(new THREE.SphereGeometry(0.012, 10, 8), '#ffd27a', cx, cz, 0.755, 1);
    // Four buttress stacks with brass caps around the hall.
    for (const [dx, dz] of [
      [-0.22, -0.16],
      [0.22, -0.16],
      [-0.22, 0.16],
      [0.22, 0.16],
    ] as const) {
      const [sx, sz] = off(l, cx, cz, dx, dz);
      stack(l, sx, sz, 0.36, 0.018, '#7a3e2c', 2);
      wround(l, sx, sz, 0.022, 0.02, 0.39, 0.012, brass, 10);
    }
    // Crucible cars, an ingot store, trucks and forklift, a lit forecourt.
    railLine(l, 0.04, 0.84, 0.96, 0.84, 0.036, { steel: true });
    for (let i = 0; i < 3; i++) {
      const x = 0.24 + i * 0.16;
      wbox(l, x, 0.84, 0.042, 0.08, 0.02, 0.05, '#3a3f42');
      wround(l, x, 0.84, 0.026, 0.02, 0.062, 0.04, '#5a4a42', 12);
      melt(l, x, 0.84, 0.102, 0.022);
    }
    ingots(l, 0.88, 0.7, 5, brass);
    ingots(l, 0.8, 0.66, 4, copper);
    truck(l, 0.2, 0.68, 0, '#24476a');
    forklift(l, 0.64, 0.7, 0.3);
    workers(l, [
      [0.36, 0.7, '#e8742a', hat],
      [0.72, 0.6, '#5a7a9a', hat],
      [0.5, 0.94, '#f2cf4a', hat],
    ]);
    for (const [x, z] of [
      [0.06, 0.6],
      [0.94, 0.56],
    ] as const)
      lanternPost(l, x, z, 0.17);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
    signboard(l, 0.94, 0.94, 0.09, 0.12, '#2f3a44');
    crate(l, 0.08, 0.94, 0.036, '#8a6a48', 0.3);
    blockStack(l, 0.1, 0.1, 0.03, 2, 2, 2, '#6e6a62');
  },
};
