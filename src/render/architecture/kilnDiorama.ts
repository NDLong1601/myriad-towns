import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  door,
  horse,
  lanternPost,
  off,
  railFence,
  shade,
  shingleGable,
  shrub,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import { smoke, truck } from './dioramaProps';
import {
  apron,
  beehiveKiln,
  cowl,
  drums,
  faceAt,
  faceBox,
  fence,
  forklift,
  hallFacade,
  hat,
  hot,
  iron,
  pallet,
  pane,
  ridgeLantern,
  signboard,
  site,
  slate,
  stack,
} from './industryKit';
import { blockStack, brickBody, conveyor, railLine, wagon, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B: the brickworks chain, drawn in the shared 0.77-unit frame.
//   brickworks -> downdraft_kiln -> kiln_works -> tunnel_kiln_works -> ceramics_manufactory

const brick = '#b4613f';
const green = '#c79a72';
const clay = '#b97a54';

/** Drying hack: a long row of green bricks under a low plank roof. */
function hack(l: Lot, x: number, z: number, len: number, ry = 0): void {
  for (let k = 0; k < 4; k++)
    wbox(l, x, z, 0.03 + k * 0.012, len, 0.01, 0.024, tone(green, 0.06), ry);
  for (let i = 0; i <= Math.round(len / 0.06); i++) {
    const t = -len / 2 + i * 0.06;
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t),
      0.03,
      0.006,
      0.07,
      0.006,
      '#5c4630',
    );
  }
  wbox(l, x, z, 0.1, len + 0.02, 0.006, 0.05, '#6b5a48', ry);
}

/** Stack of fired bricks in a cube, some showing pale faces. */
function brickPile(l: Lot, x: number, z: number, n = 3, layers = 3): void {
  blockStack(l, x, z, 0.03, n, n, layers, brick, 0.03);
}

/** Pug mill turned by a horse walking round a gin circle. */
function horseGin(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.03, 0.16, 0.004, 0.16, shade(clay, 0.9));
  wround(l, x, z, 0.02, 0.022, 0.03, 0.06, '#6b4a2c', 10);
  wround(l, x, z, 0.006, 0.006, 0.09, 0.03, '#3a3530', 6);
  l.beam([x, 0.1, z], [x + 0.07 / l.spanX, 0.09, z], 0.008, '#5c4630');
  horse(l, x + 0.08 / l.spanX, z, Math.PI / 2);
  l.shape(
    new THREE.TorusGeometry(0.075, 0.004, 4, 24).rotateX(Math.PI / 2),
    shade(clay, 0.7),
    x,
    z,
    0.035,
  );
}

/** Bottle oven: a brick hovel that narrows into a neck, with a firing glow at its foot. */
function bottleKiln(l: Lot, x: number, z: number, h: number, r: number, color = '#9a4a35'): void {
  const pts = [
    new THREE.Vector2(r, 0),
    new THREE.Vector2(r * 1.02, h * 0.2),
    new THREE.Vector2(r * 0.86, h * 0.5),
    new THREE.Vector2(r * 0.45, h * 0.82),
    new THREE.Vector2(r * 0.34, h * 0.92),
    new THREE.Vector2(r * 0.36, h),
  ];
  l.shape(new THREE.LatheGeometry(pts, 20), color, x, z, 0.03);
  for (const t of [0.15, 0.32, 0.5])
    wround(
      l,
      x,
      z,
      r * (1 - t * 0.3) + 0.003,
      r * (1 - t * 0.3) + 0.003,
      0.03 + h * t,
      0.005,
      iron,
      20,
    );
  wround(l, x, z, r * 0.38, r * 0.38, 0.03 + h - 0.004, 0.012, shade(color, 0.7), 16);
  faceBox(l, x, z, r * 2, r * 2, '+z', 0, -0.004, 0.034, 0.04, 0.05, 0.006, '#3a2a22');
  faceBox(l, x, z, r * 2, r * 2, '+z', 0, -0.002, 0.036, 0.028, 0.03, 0.004, hot, 1);
  smoke(l, x, z, 0.04 + h, 3);
}

/** Kiln car on rails, loaded with a setting of bricks. */
function kilnCar(l: Lot, x: number, z: number, loaded = true, glow = false): void {
  wbox(l, x, z, 0.042, 0.08, 0.016, 0.05, '#4a4f54');
  wbox(l, x, z, 0.058, 0.07, 0.006, 0.044, '#c9b48a');
  if (loaded)
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        x,
        z,
        0.064 + i * 0.012,
        0.064 - i * 0.006,
        0.01,
        0.038,
        glow ? '#d86a3a' : brick,
        0,
        0,
        glow ? 0.4 : 0,
      );
}

/** Display board of glazed tiles in a grid of colours. */
function tileBoard(l: Lot, x: number, z: number, ry: number): void {
  const colors = ['#2f6f9a', '#e9e4d6', '#c84a3a', '#3f8a6a', '#d8a832', '#6a4a8a'];
  wbox(l, x, z, 0.03, 0.006, 0.08, 0.006, iron, ry);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      wbox(
        l,
        ...off(l, x, z, Math.cos(ry) * (-0.03 + c * 0.02), -Math.sin(ry) * (-0.03 + c * 0.02)),
        0.07 + r * 0.02,
        0.018,
        0.018,
        0.006,
        colors[(r * 4 + c) % colors.length]!,
        ry,
      );
}

export const kilnDiorama: Recipes = {
  brickworks(l) {
    site(l, 'brickworks', '#9a7a5c', [0.06, 0.06, 0.94, 0.94]);
    // Two clamp kilns smoking, drying hacks, a horse-driven pug mill and a moulding shed.
    beehiveKiln(l, 0.26, 0.28, 0.08, 0.09, '#a65e40');
    beehiveKiln(l, 0.5, 0.22, 0.09, 0.11, '#a65e40');
    smoke(l, 0.26, 0.28, 0.2, 2);
    smoke(l, 0.5, 0.22, 0.23, 2);
    for (let i = 0; i < 3; i++) hack(l, 0.42, 0.52 + i * 0.08, 0.3);
    horseGin(l, 0.8, 0.26);
    wbox(l, 0.86, 0.5, 0.03, 0.14, 0.004, 0.12, '#8a5a3a');
    wbox(l, 0.86, 0.5, 0.034, 0.12, 0.004, 0.1, '#7a4a32');
    const mx = 0.2;
    const mz = 0.78;
    for (const [dx, dz] of [
      [-0.08, -0.06],
      [0.08, -0.06],
      [-0.08, 0.06],
      [0.08, 0.06],
    ] as const)
      wbox(l, ...off(l, mx, mz, dx, dz), 0.03, 0.012, 0.12, 0.012, '#5c4630');
    shingleGable(l, mx, mz, 'x', 0.18, 0.14, 0.15, 0.05, '#6e5a46');
    wbox(l, mx, mz, 0.03, 0.12, 0.04, 0.05, '#7a5634');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, mx, mz, -0.04 + i * 0.02, 0), 0.07, 0.014, 0.01, 0.026, green);
    brickPile(l, 0.68, 0.8, 3, 3);
    brickPile(l, 0.82, 0.86, 2, 4);
    for (const [x, z] of [
      [0.52, 0.86],
      [0.6, 0.7],
    ] as const) {
      wbox(l, x, z, 0.036, 0.04, 0.012, 0.03, '#6b4a2c', 0.4);
      wround(l, ...off(l, x, z, 0.026, 0), 0.008, 0.008, 0.034, 0.004, '#3a3530', 8);
    }
    workers(l, [
      [0.34, 0.74, '#7a5a3a', '#3a3a3c'],
      [0.62, 0.44, '#6a4a3a', '#8a6a3a'],
      [0.74, 0.62, '#5a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.5, 0.13);
    railFence(l, 0.03, 0.97, 0.97, 0.97);
    railFence(l, 0.97, 0.03, 0.97, 0.97);
    signboard(l, 0.4, 0.94, 0.08, 0.08, '#5c4630');
    shrub(l, 0.06, 0.06, 0.03);
  },

  downdraft_kiln(l) {
    site(l, 'downdraft_kiln', '#957760', [0.05, 0.05, 0.95, 0.95]);
    // Twin iron-banded downdraft kilns feeding one tall stack through a brick flue.
    beehiveKiln(l, 0.26, 0.3, 0.1, 0.12, '#a24a35');
    beehiveKiln(l, 0.56, 0.3, 0.1, 0.12, '#a24a35');
    const [sx, sz] = [0.41, 0.1];
    stack(l, sx, sz, 0.28, 0.024, '#9c5640', 4);
    for (const kx of [0.26, 0.56]) l.beam([kx, 0.04, 0.3], [sx, 0.04, sz], 0.03, '#8c4430');
    // Long drying shed with racks of green ware, fired stacks, coal and a cart.
    const dx = 0.5;
    const dz = 0.64;
    for (let i = 0; i < 5; i++)
      for (const s of [-1, 1])
        wbox(l, ...off(l, dx, dz, -0.24 + i * 0.12, s * 0.06), 0.03, 0.012, 0.13, 0.012, '#5c4630');
    tinGable(l, dx, dz, 'x', 0.5, 0.14, 0.16, 0.05, '#5a5048');
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 3; k++)
        wbox(
          l,
          ...off(l, dx, dz, -0.18 + i * 0.12, 0),
          0.04 + k * 0.035,
          0.1,
          0.006,
          0.09,
          '#6b4a2c',
        );
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 3; k++)
        for (let j = 0; j < 3; j++)
          wbox(
            l,
            ...off(l, dx, dz, -0.18 + i * 0.12 - 0.03 + j * 0.03, 0),
            0.046 + k * 0.035,
            0.02,
            0.012,
            0.06,
            tone(green, 0.05),
          );
    brickPile(l, 0.18, 0.86, 3, 4);
    brickPile(l, 0.34, 0.88, 3, 3);
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.84,
        0.18,
        0.034 + i * 0.012,
        0.14 - i * 0.024,
        0.014,
        0.12 - i * 0.02,
        tone('#26282a', 0.25),
        i * 0.7,
      );
    horse(l, 0.6, 0.88, 0);
    cart(l, 0.74, 0.88, 0, 'crates');
    workers(l, [
      [0.42, 0.44, '#7a5a3a', '#3a3a3c'],
      [0.7, 0.42, '#6a4a3a', '#3a3a3c'],
      [0.5, 0.82, '#5a4a3a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.15);
    lanternPost(l, 0.92, 0.5, 0.15);
    fence(l, [
      [0.03, 0.97],
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.97],
    ]);
    signboard(l, 0.9, 0.92, 0.08, 0.1, '#3a2a22');
  },

  kiln_works(l) {
    site(l, 'kiln_works', '#8f7462', [0.04, 0.04, 0.96, 0.96]);
    // Oval Hoffmann ring kiln: straight sides with rounded ends, a ring of wicket doors.
    const kx = 0.46;
    const kz = 0.38;
    const len = 0.36;
    const r = 0.1;
    const h = 0.1;
    brickBody(l, kx, kz, len, r * 2, 0.03, h, '#a24a35');
    for (const s of [-1, 1]) {
      const end = new THREE.CylinderGeometry(r, r, h, 18, 1, false, s > 0 ? 0 : Math.PI, Math.PI);
      l.shape(end, '#9a4632', ...off(l, kx, kz, (s * len) / 2, 0), 0.03 + h / 2);
    }
    wbox(l, kx, kz, 0.03 + h, len + 0.01, 0.012, r * 2 + 0.01, '#8a4430');
    for (let i = 0; i < 6; i++) {
      const t = -len / 2 + 0.03 + i * ((len - 0.06) / 5);
      for (const f of ['+z', '-z'] as const) {
        faceBox(
          l,
          kx,
          kz,
          len,
          r * 2,
          f,
          t,
          0.003,
          0.034,
          0.03,
          0.05,
          0.006,
          shade('#a24a35', 1.2),
        );
        faceBox(
          l,
          kx,
          kz,
          len,
          r * 2,
          f,
          t,
          0.006,
          0.036,
          0.022,
          0.04,
          0.004,
          i === 2 && f === '+z' ? hot : '#3a2a22',
          i === 2 && f === '+z' ? 1 : 0,
        );
      }
      faceBox(l, kx, kz, len, r * 2, '+z', t, 0.004, 0.03 + h - 0.008, 0.008, 0.008, 0.012, iron);
    }
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        ...off(l, kx, kz, -len / 2 + 0.02 + i * (len / 7.3), 0),
        0.03 + h + 0.012,
        0.012,
        0.012,
        r * 2 + 0.02,
        iron,
      );
    // Kiln shed on posts and a tall central chimney.
    for (const [ddx, ddz] of [
      [-0.24, -0.13],
      [0, -0.13],
      [0.24, -0.13],
      [-0.24, 0.13],
      [0, 0.13],
      [0.24, 0.13],
    ] as const)
      wbox(l, ...off(l, kx, kz, ddx, ddz), 0.03, 0.012, 0.19, 0.012, '#5c4630');
    tinGable(l, kx, kz, 'x', 0.52, 0.28, 0.22, 0.07, '#4a4f54');
    ridgeLantern(l, kx, kz, 'x', 0.3, 0.29, '#3f464b');
    stack(l, kx, kz, 0.36, 0.028, '#9c5640', 4);
    // Clay pit with a narrow-gauge line, brick wagons, stacks and drying sheds.
    railLine(l, 0.04, 0.72, 0.96, 0.72, 0.036);
    for (const x of [0.3, 0.46, 0.62]) {
      wagon(l, x, 0.72, 0, null, 0.042, '#6b5a4a');
      blockStack(l, x, 0.72, 0.06, 2, 1, 2, brick, 0.02);
    }
    wbox(l, 0.86, 0.2, 0.026, 0.16, 0.006, 0.18, shade(clay, 0.8));
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.82 + (i % 3) * 0.04,
        0.14 + Math.floor(i / 3) * 0.08,
        0.03,
        0.03,
        0.012 + i * 0.002,
        0.03,
        tone(clay, 0.1),
        i,
      );
    for (let i = 0; i < 2; i++) hack(l, 0.3 + i * 0.36, 0.9, 0.24);
    brickPile(l, 0.1, 0.86, 2, 4);
    brickPile(l, 0.9, 0.86, 2, 3);
    workers(l, [
      [0.22, 0.6, '#7a5a3a', '#3a3a3c'],
      [0.54, 0.6, '#6a4a3a', '#3a3a3c'],
      [0.78, 0.4, '#5a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.3, 0.16);
    fence(l, [
      [0.03, 0.97],
      [0.03, 0.03],
      [0.7, 0.03],
    ]);
    signboard(l, 0.92, 0.62, 0.08, 0.1, '#3a2a22', Math.PI / 2);
  },

  tunnel_kiln_works(l) {
    site(l, 'tunnel_kiln_works', '#86786c', [0.03, 0.03, 0.97, 0.97]);
    // Long brick kiln hall with the tunnel mouth at one end and cars queuing on the track.
    const hx = 0.5;
    const hz = 0.32;
    brickBody(l, hx, hz, 0.56, 0.22, 0.03, 0.18, '#9a4632');
    hallFacade(l, hx, hz, 0.56, 0.22, 0.03, 0.18, '#9a4632', {
      bay: 0.08,
      faces: ['+z', '-z', '+x'],
    });
    faceBox(l, hx, hz, 0.56, 0.22, '-x', 0, 0.003, 0.03, 0.1, 0.09, 0.008, '#1c1816');
    faceBox(l, hx, hz, 0.56, 0.22, '-x', 0, 0.005, 0.036, 0.07, 0.04, 0.004, hot, 1);
    tinGable(l, hx, hz, 'x', 0.56, 0.22, 0.21, 0.08, '#4a4f54', '#9a4632');
    ridgeLantern(l, hx, hz, 'x', 0.36, 0.29, '#3f464b');
    for (const dx of [-0.16, 0.16])
      stack(l, ...off(l, hx, hz, dx, -0.15), 0.46, 0.024, '#8f4a38', 3);
    railLine(l, 0.02, hz, hx - 0.28 / l.spanX, hz, 0.036, { steel: true });
    kilnCar(l, 0.06, hz);
    kilnCar(l, 0.16, hz, true, true);
    // Clay preparation house with a conveyor to the press, drying chambers, finished packs.
    brickBody(l, 0.2, 0.7, 0.2, 0.16, 0.03, 0.14, '#8c4430');
    hallFacade(l, 0.2, 0.7, 0.2, 0.16, 0.03, 0.14, '#8c4430', { bay: 0.067 });
    tinGable(l, 0.2, 0.7, 'x', 0.2, 0.16, 0.17, 0.05, '#4a4f54', '#8c4430');
    conveyor(l, [0.06, 0.036, 0.9], [0.14, 0.16, 0.74], 3);
    wbox(l, 0.06, 0.92, 0.03, 0.08, 0.03, 0.06, shade(clay, 0.85));
    for (let i = 0; i < 3; i++) {
      const cx = 0.44 + i * 0.09;
      wbox(l, cx, 0.66, 0.03, 0.07, 0.1, 0.1, '#b9b6ae');
      faceBox(l, cx, 0.66, 0.07, 0.1, '+z', 0, 0.002, 0.03, 0.05, 0.08, 0.004, '#6e777b');
      cowl(l, cx, 0.66, 0.13, 0.01);
    }
    for (let i = 0; i < 4; i++) {
      pallet(l, 0.76 + (i % 2) * 0.08, 0.6 + Math.floor(i / 2) * 0.08, brick);
      blockStack(
        l,
        0.76 + (i % 2) * 0.08,
        0.6 + Math.floor(i / 2) * 0.08,
        0.06,
        2,
        2,
        2,
        brick,
        0.018,
      );
    }
    forklift(l, 0.62, 0.86, 0.2);
    truck(l, 0.84, 0.88, 0, '#7a3a2a');
    drums(l, 0.94, 0.12, 3, '#2f5d8a');
    workers(l, [
      [0.36, 0.52, '#e8742a', hat],
      [0.66, 0.52, '#5a7a9a', '#3a3a3c'],
      [0.44, 0.88, '#e8742a', hat],
    ]);
    lanternPost(l, 0.34, 0.86, 0.16);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.5],
    ]);
    signboard(l, 0.3, 0.96, 0.09, 0.11, '#3a2a22');
  },

  ceramics_manufactory(l) {
    site(l, 'ceramics_manufactory', '#857a70', [0.03, 0.03, 0.97, 0.97]);
    // Two-storey works with bands of glazed tile, a clerestory and two banded stacks.
    const hx = 0.44;
    const hz = 0.32;
    brickBody(l, hx, hz, 0.46, 0.26, 0.03, 0.24, '#9a4632');
    hallFacade(l, hx, hz, 0.46, 0.26, 0.03, 0.24, '#9a4632', {
      bay: 0.077,
      trim: '#e9e4d6',
      skip: [
        ['+z', 2],
        ['+z', 3],
      ],
    });
    const bands = ['#2f6f9a', '#e9e4d6', '#3f8a6a'];
    for (const [k, y] of [0.035, 0.145, 0.252].entries())
      for (const f of ['+z', '-z', '+x', '-x'] as const) {
        const ln = f === '+z' || f === '-z' ? 0.46 : 0.26;
        for (let i = 0; i < Math.round(ln / 0.02); i++)
          faceBox(
            l,
            hx,
            hz,
            0.46,
            0.26,
            f,
            -ln / 2 + 0.01 + i * 0.02,
            0.005,
            y,
            0.018,
            0.012,
            0.004,
            i % 2 ? bands[k]! : shade(bands[k]!, 0.8),
          );
      }
    door(l, hx, hz, 0.46, 0.26, '+z', 0, 0.03, 0.08, 0.12, '#2f3a44');
    tinGable(l, hx, hz, 'x', 0.46, 0.26, 0.27, 0.09, slate, '#9a4632');
    ridgeLantern(l, hx, hz, 'x', 0.3, 0.36, '#3f464b');
    for (const dx of [-0.17, 0.17]) {
      const [sx, sz] = off(l, hx, hz, dx, -0.16);
      stack(l, sx, sz, 0.58, 0.026, '#9c5640', 3);
      for (let k = 0; k < 6; k++)
        wround(l, sx, sz, 0.024, 0.024, 0.1 + k * 0.08, 0.02, k % 2 ? '#e9e4d6' : '#2f6f9a', 12);
    }
    // Two bottle ovens in the yard, a showroom with tile boards, packs ready for the lorry.
    bottleKiln(l, 0.82, 0.3, 0.32, 0.08);
    bottleKiln(l, 0.14, 0.72, 0.28, 0.07);
    const sx = 0.56;
    const sz = 0.72;
    wbox(l, sx, sz, 0.03, 0.22, 0.1, 0.12, '#e9e4d6');
    faceBox(l, sx, sz, 0.22, 0.12, '+z', 0, 0.002, 0.04, 0.2, 0.06, 0.004, pane, 0.6);
    wbox(l, sx, sz, 0.13, 0.24, 0.012, 0.14, '#2f6f9a');
    signboard(l, ...faceAt(l, sx, sz, 0.22, 0.12, '+z', 0, 0.02), 0.15, 0.14, '#2f6f9a');
    for (let i = 0; i < 3; i++) tileBoard(l, 0.4 + i * 0.07, 0.92, 0);
    for (let i = 0; i < 4; i++)
      pallet(l, 0.84 + (i % 2) * 0.06, 0.6 + Math.floor(i / 2) * 0.07, '#e9e4d6');
    truck(l, 0.84, 0.9, 0, '#2f6f9a');
    forklift(l, 0.7, 0.88, 0.4);
    workers(l, [
      [0.3, 0.52, '#5a7a9a', '#3a3a3c'],
      [0.62, 0.52, '#e9e4d6', '#3a3a3c'],
      [0.26, 0.88, '#e8742a', hat],
    ]);
    for (const x of [0.06, 0.94]) lanternPost(l, x, 0.5, 0.17);
    fence(l, [
      [0.03, 0.5],
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
    apron(l, 0.3, 0.82, 0.97, 0.97);
    barrel(l, 0.06, 0.92);
    boardBody(l, 0.26, 0.1, 0.12, 0.08, 0.03, 0.06, '#8a6a4a');
    shingleGable(l, 0.26, 0.1, 'x', 0.12, 0.08, 0.09, 0.03, '#6e5a46', '#8a6a4a');
  },
};
