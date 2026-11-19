import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  chimney,
  crate,
  door,
  halfTimber,
  horse,
  lanternPost,
  off,
  path,
  railFence,
  renderBody,
  shade,
  shingleGable,
  shrub,
  stoneBody,
  tinGable,
  wbox,
  window4,
  wround,
} from './diorama';
import { channel, truck, waterWheel } from './dioramaProps';
import {
  apron,
  clockFace,
  drums,
  faceAt,
  faceBox,
  fence,
  flywheel,
  forklift,
  gear,
  glassDome,
  hallFacade,
  hat,
  hot,
  iron,
  jibCrane,
  ladder,
  lumberStack,
  pallet,
  pipe,
  ridgeLantern,
  sawtoothRoof,
  signboard,
  site,
  slate,
  stack,
  timberDark,
} from './industryKit';
import { blockStack, brickBody, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B: the workshop chain, drawn in the shared 0.77-unit frame.
//   workshop -> guild_workshop -> waterwheel_workshop -> steam_manufactory
//            -> precision_manufactory -> grand_artificery

const plaster = '#e8dcc0';
const limestone = '#d8d0bc';
const brass = '#c9a24a';
const copper = '#5fa58e';

/** Carpenter's bench with a vice, tools hung on a rack behind and shavings underneath. */
function workbench(l: Lot, x: number, z: number, ry = 0): void {
  for (const s of [-1, 1])
    for (const t of [-1, 1])
      wbox(
        l,
        ...off(
          l,
          x,
          z,
          Math.cos(ry) * s * 0.04 - Math.sin(ry) * t * 0.012,
          -Math.sin(ry) * s * 0.04 - Math.cos(ry) * t * 0.012,
        ),
        0.03,
        0.006,
        0.036,
        0.006,
        '#5c4630',
      );
  wbox(l, x, z, 0.066, 0.1, 0.008, 0.034, '#9a7a52', ry);
  wbox(
    l,
    ...off(l, x, z, Math.cos(ry) * 0.05, -Math.sin(ry) * 0.05),
    0.07,
    0.01,
    0.014,
    0.014,
    iron,
    ry,
  );
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * (-0.03 + i * 0.02), -Math.sin(ry) * (-0.03 + i * 0.02)),
      0.074,
      0.014,
      0.003,
      0.004,
      i % 2 ? '#8a8f94' : '#7a5634',
      ry,
    );
  wbox(l, x, z, 0.03, 0.08, 0.003, 0.05, '#e3c48e', ry);
}

/** Anvil on a stump. */
function anvil(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.012, 0.014, 0.03, 0.03, '#6b4a2c', 8);
  wbox(l, x, z, 0.06, 0.03, 0.012, 0.014, '#2c3134');
  wbox(l, ...off(l, x, z, 0.018, 0), 0.064, 0.012, 0.006, 0.008, '#2c3134');
}

/** Brick forge hearth with a glowing fire, a hood and leather bellows. */
function forgeHearth(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.03, 0.07, 0.04, 0.05, '#8c4a38');
  wbox(l, x, z, 0.07, 0.04, 0.006, 0.03, hot, 0, 0, 1);
  l.shape(new THREE.ConeGeometry(0.04, 0.05, 4).rotateY(Math.PI / 4), '#5a4a42', x, z, 0.12);
  wround(l, x, z, 0.008, 0.01, 0.14, 0.1, '#5a4a42', 6);
  const bellows = new THREE.ConeGeometry(0.02, 0.05, 4).rotateZ(Math.PI / 2);
  l.shape(bellows, '#6b4a2c', ...off(l, x, z, -0.06, 0), 0.06);
}

/** Treadle grindstone. */
function grindstone(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.03, 0.04, 0.024, 0.02, '#5c4630');
  const stone = new THREE.CylinderGeometry(0.018, 0.018, 0.008, 14).rotateX(Math.PI / 2);
  l.shape(stone, '#b0aa9c', x, z, 0.07);
}

/** Heap of castings, gears and bar stock awaiting machining. */
function partsHeap(l: Lot, x: number, z: number): void {
  for (let i = 0; i < 4; i++)
    gear(
      l,
      ...off(l, x, z, (i % 2) * 0.03 - 0.015, Math.floor(i / 2) * 0.02),
      0.04 + (i % 2) * 0.01,
      0.012,
      Math.PI / 2,
      '#6e777b',
    );
  blockStack(l, ...off(l, x, z, 0.05, 0), 0.03, 2, 1, 2, '#5a5f63', 0.02);
}

/** Bracket sign hanging from a wall. */
function bracketSign(l: Lot, x: number, z: number, y: number, color: string): void {
  wbox(l, x, z, y, 0.05, 0.004, 0.004, iron);
  wbox(l, ...off(l, x, z, 0.012, 0), y - 0.04, 0.03, 0.036, 0.004, color);
  wbox(l, ...off(l, x, z, 0.012, 0), y - 0.03, 0.022, 0.016, 0.006, '#d9c9a8');
}

/** Columned portico in front of a face. */
function portico(l: Lot, x: number, z: number, w: number, d: number, h: number): void {
  for (const s of [-1, -0.33, 0.33, 1])
    wround(l, ...off(l, x, z, (s * w) / 2, 0), 0.01, 0.011, 0.04, h, limestone, 10);
  wbox(l, x, z, 0.03, w + 0.04, 0.012, d + 0.03, shade(limestone, 0.9));
  wbox(l, x, z, 0.04 + h, w + 0.03, 0.02, d + 0.02, limestone);
  const ped = new THREE.Shape();
  ped.moveTo(-w / 2 - 0.015, 0);
  ped.lineTo(w / 2 + 0.015, 0);
  ped.lineTo(0, 0.04);
  ped.closePath();
  const g = new THREE.ExtrudeGeometry(ped, { depth: d + 0.02, bevelEnabled: false }).translate(
    0,
    0,
    -(d + 0.02) / 2,
  );
  l.shape(g, limestone, x, z, 0.06 + h);
}

export const craftDiorama: Recipes = {
  workshop(l) {
    site(l, 'workshop', '#8a7a62', [0.1, 0.12, 0.92, 0.92]);
    // Plank artisan shed with a shingle roof and an open-fronted lean-to workshop.
    const hx = 0.38;
    const hz = 0.36;
    stoneBody(l, hx, hz, 0.3, 0.22, 0.03, 0.03, '#9a9282');
    boardBody(l, hx, hz, 0.29, 0.21, 0.06, 0.12, '#9a7a52');
    windows4(l, hx, hz, 0.29, 0.21, 0.09, 0.032, { shutters: '#5a6a3a' });
    door(l, hx, hz, 0.29, 0.21, '+z', -0.07, 0.06, 0.05, 0.09, timberDark);
    shingleGable(l, hx, hz, 'x', 0.29, 0.21, 0.18, 0.09, '#6e5a46', '#9a7a52');
    chimney(l, ...off(l, hx, hz, -0.1, -0.05), 0.18, 0.12);
    // Lean-to on posts sheltering the benches.
    const lx = 0.72;
    for (const [dx, dz] of [
      [-0.07, -0.08],
      [0.07, -0.08],
      [-0.07, 0.08],
      [0.07, 0.08],
    ] as const)
      wbox(
        l,
        ...off(l, lx, hz, dx, dz),
        0.03,
        0.012,
        0.15 - (dx < 0 ? -0.02 : 0.02),
        0.012,
        '#5c4630',
      );
    l.shape(new THREE.BoxGeometry(0.18, 0.01, 0.2).rotateZ(-0.2), '#6e5a46', lx, hz, 0.17);
    workbench(l, lx, hz - 0.04 / l.spanZ, 0);
    grindstone(l, lx + 0.05 / l.spanX, hz + 0.06 / l.spanZ);
    // Yard: timber rack, barrels and crates, a hand cart, the craftsman and an apprentice.
    lumberStack(l, 0.2, 0.74, 0.12, 0.05, 4, 0.3);
    barrel(l, 0.5, 0.62);
    barrel(l, 0.54, 0.66);
    for (let i = 0; i < 3; i++) crate(l, 0.62 + i * 0.05, 0.72, 0.036, '#8a6a48', i * 0.3);
    cart(l, 0.42, 0.84, 0.3, 'crates');
    workers(l, [
      [0.66, 0.46, '#6a4a3a', '#3a3a3c'],
      [0.48, 0.52, '#5a6a4a', '#8a6a3a'],
    ]);
    bracketSign(l, ...faceAt(l, hx, hz, 0.29, 0.21, '+z', 0.08, 0.02), 0.16, '#5a3a2a');
    path(l, 0.3, 0.48, 0.3, 0.98, 0.05);
    lanternPost(l, 0.2, 0.52, 0.13);
    railFence(l, 0.03, 0.97, 0.97, 0.97);
    railFence(l, 0.03, 0.03, 0.03, 0.97);
    for (let i = 0; i < 3; i++) shrub(l, 0.8 + i * 0.06, 0.9, 0.025);
  },

  guild_workshop(l) {
    site(l, 'guild_workshop', '#8f8574', [0.06, 0.08, 0.94, 0.94]);
    // Jettied Tudor guild hall: stone ground floor, timber-framed upper floor, steep roof.
    const hx = 0.4;
    const hz = 0.38;
    stoneBody(l, hx, hz, 0.32, 0.24, 0.03, 0.11, '#a49c8c');
    windows4(l, hx, hz, 0.32, 0.24, 0.06, 0.034, { frame: '#d9c9a8' });
    door(l, hx, hz, 0.32, 0.24, '+z', 0, 0.03, 0.06, 0.08, timberDark);
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        ...faceAt(l, hx, hz, 0.32, 0.24, '+z', -0.13 + i * 0.052, 0.012),
        0.12,
        0.008,
        0.01,
        0.024,
        '#3d2a19',
      );
    halfTimber(l, hx, hz, 0.35, 0.27, 0.14, 0.12, plaster);
    windows4(l, hx, hz, 0.35, 0.27, 0.18, 0.034, { frame: '#3d2a19' });
    shingleGable(l, hx, hz, 'x', 0.35, 0.27, 0.26, 0.12, '#5e4a38', plaster);
    for (const s of [-1, 1]) {
      const [dx, dz] = off(l, hx, hz, s * 0.08, 0.1);
      wbox(l, dx, dz, 0.27, 0.05, 0.05, 0.05, plaster);
      window4(l, dx, dz, 0.05, 0.05, '+z', 0, 0.28, 0.024, { frame: '#3d2a19' });
      shingleGable(l, dx, dz, 'z', 0.06, 0.06, 0.32, 0.04, '#5e4a38', plaster);
    }
    chimney(l, ...off(l, hx, hz, -0.12, -0.06), 0.26, 0.11);
    // Hoist beam on the gable with a crate on the rope.
    const [gx, gz] = faceAt(l, hx, hz, 0.35, 0.27, '+x', 0, 0.04);
    wbox(l, gx, gz, 0.33, 0.08, 0.012, 0.012, '#3d2a19');
    l.beam([gx, 0.33, gz], [gx, 0.14, gz], 0.002, '#1c1f21');
    crate(l, gx, gz, 0.11, '#8a6a48');
    // Side forge: open lean-to with the hearth, anvil, quench tub and racks of iron.
    const fx = 0.78;
    const fz = 0.42;
    for (const [dx, dz] of [
      [-0.07, -0.08],
      [0.07, -0.08],
      [-0.07, 0.08],
      [0.07, 0.08],
    ] as const)
      wbox(l, ...off(l, fx, fz, dx, dz), 0.03, 0.012, 0.15, 0.012, '#5c4630');
    tinGable(l, fx, fz, 'z', 0.2, 0.17, 0.18, 0.04, '#4a4440');
    forgeHearth(l, fx, fz - 0.04 / l.spanZ);
    anvil(l, fx - 0.03 / l.spanX, fz + 0.04 / l.spanZ);
    wround(l, fx + 0.05 / l.spanX, fz + 0.05 / l.spanZ, 0.014, 0.014, 0.03, 0.02, '#6b4a2c', 10);
    wround(l, fx + 0.05 / l.spanX, fz + 0.05 / l.spanZ, 0.012, 0.012, 0.05, 0.002, '#4f93b0', 10);
    // Cobbled yard, guild banner, carts, apprentices.
    apron(l, 0.2, 0.62, 0.9, 0.86, '#a59d8c');
    for (const s of [-1, 1]) {
      const [bx, bz] = faceAt(l, hx, hz, 0.35, 0.27, '+z', s * 0.12, 0.012);
      wbox(l, bx, bz, 0.14, 0.03, 0.08, 0.004, s < 0 ? '#7a2a2a' : '#2a4a7a');
      wbox(l, bx, bz, 0.18, 0.012, 0.012, 0.006, '#c9a24a');
    }
    horse(l, 0.52, 0.9, 0);
    cart(l, 0.66, 0.9, 0, 'barrels');
    for (let i = 0; i < 4; i++)
      crate(l, 0.22 + (i % 2) * 0.05, 0.7 + Math.floor(i / 2) * 0.04, 0.036, '#8a6a48', i);
    workbench(l, 0.6, 0.68, 0);
    grindstone(l, 0.82, 0.72);
    workers(l, [
      [0.44, 0.66, '#6a3a3a', '#3a3a3c'],
      [0.7, 0.58, '#3a4a6a', '#3a3a3c'],
      [0.86, 0.6, '#5a6a4a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.16, 0.6, 0.15);
    lanternPost(l, 0.92, 0.8, 0.15);
    railFence(l, 0.03, 0.97, 0.97, 0.97);
    signboard(l, 0.18, 0.92, 0.08, 0.09, '#5a3a2a');
  },

  waterwheel_workshop(l) {
    site(l, 'waterwheel_workshop', '#8e8371', [0.2, 0.06, 0.94, 0.94]);
    channel(l, 0.08, 0.02, 0.08, 0.98, 0.09);
    waterWheel(l, 0.16, 0.38, 0.02, 0.1, Math.PI / 2);
    // Two-storey workshop: stone ground floor, boarded upper floor, slate roof with a lucam.
    const hx = 0.46;
    const hz = 0.36;
    stoneBody(l, hx, hz, 0.36, 0.26, 0.03, 0.12, '#a49c8c');
    windows4(l, hx, hz, 0.36, 0.26, 0.065, 0.04, { frame: '#d9c9a8' });
    door(l, hx, hz, 0.36, 0.26, '+z', 0.04, 0.03, 0.07, 0.09, timberDark, true);
    boardBody(l, hx, hz, 0.36, 0.26, 0.15, 0.11, '#7a6a52');
    windows4(l, hx, hz, 0.36, 0.26, 0.18, 0.036, { frame: '#e9dfc9' });
    shingleGable(l, hx, hz, 'x', 0.36, 0.26, 0.26, 0.14, slate, '#7a6a52');
    ridgeLantern(l, hx, hz, 'x', 0.2, 0.385, '#3f464b');
    const [lx, lz] = faceAt(l, hx, hz, 0.36, 0.26, '+z', -0.08, 0.03);
    wbox(l, lx, lz, 0.2, 0.06, 0.08, 0.05, '#7a6a52');
    tinGable(l, lx, lz, 'z', 0.06, 0.06, 0.28, 0.03, '#4a4440');
    // Exposed gearing: a pit wheel on the axle meshing a wallower; line shaft on brackets.
    gear(l, 0.24, 0.38, 0.13, 0.05, Math.PI / 2, '#6b4a2c');
    gear(l, 0.27, 0.38, 0.14, 0.025, 0, '#6b4a2c');
    l.beam([0.16, 0.12, 0.38], [hx - 0.18 / l.spanX, 0.12, 0.38], 0.008, '#3a3530');
    // Yard: machine castings, a jib crane loading a cart, tool racks, workers.
    jibCrane(l, 0.78, 0.64, 0.2, Math.PI, 0.12, '#4a3a2a', '#6e777b');
    horse(l, 0.56, 0.86, 0);
    cart(l, 0.7, 0.86, 0, 'crates');
    partsHeap(l, 0.36, 0.7);
    partsHeap(l, 0.88, 0.4);
    workbench(l, 0.58, 0.64, 0);
    drums(l, 0.3, 0.86, 3, '#6b4a2c');
    workers(l, [
      [0.48, 0.6, '#5a6a7a', '#3a3a3c'],
      [0.66, 0.72, '#6a4a3a', '#3a3a3c'],
      [0.84, 0.76, '#5a6a4a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.26, 0.6, 0.15);
    fence(l, [
      [0.2, 0.97],
      [0.97, 0.97],
      [0.97, 0.03],
      [0.2, 0.03],
    ]);
    signboard(l, 0.9, 0.9, 0.08, 0.09, '#3a2a22');
  },

  steam_manufactory(l) {
    site(l, 'steam_manufactory', '#7c7468', [0.04, 0.04, 0.96, 0.96]);
    // Red-brick works hall with a sawtooth roof of north lights.
    const hx = 0.42;
    const hz = 0.36;
    brickBody(l, hx, hz, 0.5, 0.32, 0.03, 0.16, '#a34e38');
    hallFacade(l, hx, hz, 0.5, 0.32, 0.03, 0.16, '#a34e38', { bay: 0.083, skip: [['+z', 2]] });
    door(l, hx, hz, 0.5, 0.32, '+z', -0.04, 0.03, 0.07, 0.11, timberDark, true);
    sawtoothRoof(l, hx, hz, 0.5, 0.32, 0.19, 4, 0.08);
    faceBox(l, hx, hz, 0.5, 0.32, '+z', 0.12, 0.006, 0.15, 0.2, 0.022, 0.004, '#efe7d6');
    // Brass boiler on a brick setting with its stack, steam pipe and engine flywheel.
    const bx = 0.82;
    const bz = 0.2;
    wbox(l, bx, bz, 0.03, 0.2, 0.05, 0.08, '#8c4a38');
    const shell = new THREE.CylinderGeometry(0.032, 0.032, 0.2, 16).rotateZ(Math.PI / 2);
    l.shape(shell, brass, bx, bz, 0.11);
    for (let i = 0; i < 5; i++)
      wround(l, ...off(l, bx, bz, -0.08 + i * 0.04, 0), 0.034, 0.034, 0.08, 0.004, '#8a6a2a', 16);
    for (const s of [-1, 1]) {
      const end = new THREE.CylinderGeometry(0.033, 0.033, 0.004, 16).rotateZ(Math.PI / 2);
      l.shape(end, '#8a6a2a', ...off(l, bx, bz, s * 0.1, 0), 0.11);
    }
    wround(l, ...off(l, bx, bz, -0.03, 0), 0.012, 0.016, 0.14, 0.03, brass, 10);
    stack(l, 0.94, 0.12, 0.42, 0.02, '#9c5640', 4);
    pipe(l, [bx, 0.17, bz], [hx + 0.25 / l.spanX, 0.17, 0.28], 0.008, brass);
    flywheel(l, 0.84, 0.44, 0.03, 0.07, Math.PI / 2);
    wbox(l, 0.84, 0.44, 0.03, 0.06, 0.04, 0.03, '#2f3234');
    // Goods yard: crates, drums, a cart and horse, finished machines under tarps.
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.2 + i * 0.1, 0.72, 0.03, 0.07, 0.05, 0.06, '#4a5a4a');
      wbox(l, 0.2 + i * 0.1, 0.72, 0.08, 0.074, 0.006, 0.064, '#3a4a3a');
    }
    for (let i = 0; i < 6; i++)
      crate(l, 0.56 + (i % 3) * 0.05, 0.7 + Math.floor(i / 3) * 0.04, 0.036, '#8a6a48', i * 0.2);
    drums(l, 0.82, 0.62, 4, '#2f5d8a');
    horse(l, 0.36, 0.9, 0);
    cart(l, 0.5, 0.9, 0, 'crates');
    workers(l, [
      [0.3, 0.6, '#5a6a7a', '#3a3a3c'],
      [0.64, 0.58, '#6a4a3a', '#3a3a3c'],
      [0.76, 0.34, '#5a6a4a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.6, 0.16);
    lanternPost(l, 0.7, 0.86, 0.16);
    fence(l, [
      [0.03, 0.97],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.55],
    ]);
    signboard(l, 0.86, 0.92, 0.09, 0.11, '#3a2a22');
  },

  precision_manufactory(l) {
    site(l, 'precision_manufactory', '#878278', [0.04, 0.04, 0.96, 0.96]);
    // Two-storey brick manufactory dressed in limestone with a barrel-vaulted skylight.
    const hx = 0.44;
    const hz = 0.34;
    brickBody(l, hx, hz, 0.52, 0.3, 0.03, 0.24, '#9a4632');
    hallFacade(l, hx, hz, 0.52, 0.3, 0.03, 0.24, '#9a4632', {
      bay: 0.087,
      trim: limestone,
      skip: [
        ['+z', 2],
        ['+z', 3],
      ],
    });
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        for (let k = 0; k < 7; k++)
          wbox(
            l,
            ...off(l, hx, hz, sx * 0.258, sz * 0.148),
            0.05 + k * 0.032,
            0.024,
            0.016,
            0.024,
            limestone,
          );
    wbox(l, hx, hz, 0.27, 0.54, 0.02, 0.32, limestone);
    const vault = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(vault, '#bfe0e6', hx, hz, 0.29, 0.35);
    for (let i = 0; i < 9; i++) {
      const rib = new THREE.TorusGeometry(0.081, 0.003, 4, 12, Math.PI).rotateY(Math.PI / 2);
      l.shape(rib, iron, ...off(l, hx, hz, -0.2 + i * 0.05, 0), 0.29);
    }
    for (const s of [-1, 1]) {
      wbox(l, ...off(l, hx, hz, 0, s * 0.11), 0.29, 0.42, 0.012, 0.06, '#4f5a60');
    }
    portico(l, ...faceAt(l, hx, hz, 0.52, 0.3, '+z', 0, 0.035), 0.12, 0.05, 0.14);
    door(l, hx, hz, 0.52, 0.3, '+z', 0, 0.03, 0.06, 0.12, '#2f3a44');
    // Golden gear emblem on the parapet.
    gear(l, ...faceAt(l, hx, hz, 0.52, 0.3, '+z', 0, 0.01), 0.31, 0.04, 0, '#d6a83a');
    // Water tower, delivery trucks, pallets of crated instruments, forklift.
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.88, 0.16, a * 0.026, b * 0.026), 0.03, 0.008, 0.26, 0.008, iron);
    wround(l, 0.88, 0.16, 0.044, 0.044, 0.29, 0.07, '#6e777b', 16);
    l.shape(new THREE.ConeGeometry(0.048, 0.03, 16), '#4a5257', 0.88, 0.16, 0.375);
    ladder(l, 0.88, 0.16, 0.04, 0.36, 0.046);
    apron(l, 0.06, 0.62, 0.94, 0.95);
    truck(l, 0.3, 0.8, 0, '#24476a');
    truck(l, 0.56, 0.8, 0, '#7a3a2a');
    for (let i = 0; i < 4; i++)
      pallet(l, 0.76 + (i % 2) * 0.07, 0.7 + Math.floor(i / 2) * 0.08, '#c9b48a');
    forklift(l, 0.86, 0.9, 0.4);
    workers(l, [
      [0.2, 0.66, '#3a4a6a', hat],
      [0.44, 0.68, '#5a6a7a', '#3a3a3c'],
      [0.66, 0.92, '#e8742a', hat],
    ]);
    for (const x of [0.06, 0.94]) lanternPost(l, x, 0.58, 0.17);
    fence(l, [
      [0.03, 0.56],
      [0.03, 0.03],
      [0.8, 0.03],
    ]);
    signboard(l, 0.12, 0.94, 0.09, 0.12, '#24476a');
    stack(l, 0.06, 0.08, 0.6, 0.02, '#8f4a38', 2);
  },

  grand_artificery(l) {
    site(l, 'grand_artificery', '#8c877c', [0.03, 0.03, 0.97, 0.97]);
    // Three-storey limestone-and-brick artificery: a central block and two domed wings.
    const hx = 0.5;
    const hz = 0.3;
    renderBody(l, hx, hz, 0.3, 0.26, 0.03, 0.3, limestone, '#a49c8c');
    windows4(l, hx, hz, 0.3, 0.26, 0.07, 0.04, { frame: brass });
    windows4(l, hx, hz, 0.3, 0.26, 0.16, 0.04, { frame: brass });
    windows4(l, hx, hz, 0.3, 0.26, 0.25, 0.04, { frame: brass });
    for (const s of [-1, 1]) {
      const [wx, wz] = off(l, hx, hz, s * 0.25, 0.02);
      brickBody(l, wx, wz, 0.2, 0.24, 0.03, 0.22, '#9a4632');
      hallFacade(l, wx, wz, 0.2, 0.24, 0.03, 0.22, '#9a4632', { bay: 0.067, trim: limestone });
      wbox(l, wx, wz, 0.25, 0.22, 0.016, 0.26, limestone);
      glassDome(l, wx, wz, 0.266, 0.075, brass);
    }
    wbox(l, hx, hz, 0.33, 0.32, 0.02, 0.28, limestone);
    portico(l, ...faceAt(l, hx, hz, 0.3, 0.26, '+z', 0, 0.035), 0.16, 0.05, 0.16);
    door(l, hx, hz, 0.3, 0.26, '+z', 0, 0.03, 0.06, 0.13, '#2f3a44');
    // Astronomical clock tower rising from the centre with a copper spire.
    const tx = hx;
    const tz = hz - 0.02 / 0.77;
    wbox(l, tx, tz, 0.35, 0.1, 0.16, 0.1, limestone);
    for (const f of ['+z', '+x', '-x', '-z'] as const)
      clockFace(l, tx, tz, 0.1, 0.1, f, 0.43, 0.035);
    wbox(l, tx, tz, 0.51, 0.11, 0.012, 0.11, brass);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wround(l, ...off(l, tx, tz, a * 0.04, b * 0.04), 0.004, 0.005, 0.52, 0.05, brass, 6);
    l.shape(new THREE.ConeGeometry(0.06, 0.14, 8).rotateY(Math.PI / 8), copper, tx, tz, 0.64);
    wround(l, tx, tz, 0.002, 0.006, 0.71, 0.05, brass, 6);
    gear(l, tx, tz, 0.545, 0.03, 0, '#d6a83a');
    // Courtyard: a giant gear sculpture on a plinth, a fountain, lamps, crated orders and lorries.
    apron(l, 0.08, 0.6, 0.92, 0.96, '#b0aca2');
    wbox(l, 0.3, 0.78, 0.034, 0.06, 0.03, 0.04, limestone);
    gear(l, 0.3, 0.78, 0.13, 0.055, Math.PI / 4, '#d6a83a');
    gear(l, ...off(l, 0.3, 0.78, 0.05, 0.02), 0.09, 0.03, Math.PI / 4, brass);
    wround(l, 0.62, 0.8, 0.06, 0.065, 0.034, 0.02, limestone, 20);
    wround(l, 0.62, 0.8, 0.055, 0.055, 0.05, 0.003, '#4f93b0', 20);
    wround(l, 0.62, 0.8, 0.008, 0.012, 0.05, 0.06, brass, 8);
    truck(l, 0.82, 0.68, Math.PI / 2, '#24476a');
    for (let i = 0; i < 3; i++) pallet(l, 0.9, 0.84 + i * 0.05, '#c9b48a');
    for (const [x, z] of [
      [0.12, 0.64],
      [0.46, 0.64],
      [0.78, 0.92],
      [0.12, 0.92],
    ] as const)
      lanternPost(l, x, z, 0.17);
    workers(l, [
      [0.4, 0.7, '#3a4a6a', '#2c2c2e'],
      [0.52, 0.9, '#6a3a3a', '#2c2c2e'],
      [0.7, 0.66, '#5a6a7a', hat],
    ]);
    for (let i = 0; i < 4; i++) shrub(l, 0.06 + i * 0.05, 0.08, 0.025);
    for (let i = 0; i < 4; i++) shrub(l, 0.8 + i * 0.05, 0.08, 0.025);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
    signboard(l, 0.5, 0.97, 0.09, 0.14, '#2f3a44');
    barrel(l, 0.92, 0.6);
  },
};
