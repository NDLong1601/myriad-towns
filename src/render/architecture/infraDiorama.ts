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
  meadow,
  off,
  renderBody,
  reseed,
  shingleGable,
  shrub,
  stoneBody,
  tinGable,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import { truck, waterSheet } from './dioramaProps';
import { archWindow, bench, flowerBed, quoins, square } from './civicDiorama';
import {
  clockFace,
  drums,
  faceAt,
  faceBox,
  fence,
  forklift,
  gantry,
  hallFacade,
  iron,
  jibCrane,
  logPile,
  lumberStack,
  pallet,
  pane,
  ridgeLantern,
  signboard,
  timberDark,
} from './industryKit';
import { blockStack, brickBody, railLine, wagon, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Infrastructure: town hall, warehouse, cargo port, bus stop and metro chains, the stockpile and
// the farm-goods store, drawn at the shared civic tile scale (0.77 units a tile).

const grass = '#79a24a';
const limestone = '#d8d0bc';
const marble = '#ece7dc';
const brass = '#c9a24a';
const copper = '#5fa58e';
const slate = '#4d5a66';
const brick = '#a24a35';
const sea = '#3f7f9a';

// ---------------------------------------------------------------------------------------------
// Local kit
// ---------------------------------------------------------------------------------------------

/** Flag on a pole. */
function flag(l: Lot, x: number, z: number, h: number, color: string): void {
  wround(l, x, z, 0.003, 0.004, 0.03, h, '#e9e4d6', 6);
  wbox(l, ...off(l, x, z, 0.022, 0), 0.03 + h - 0.03, 0.04, 0.026, 0.002, color);
}

/** A bus: long body with window band and wheels, facing along x. */
function bus(l: Lot, x: number, z: number, color: string): void {
  wbox(l, x, z, 0.04, 0.2, 0.06, 0.06, color);
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, 0, s * 0.031), 0.065, 0.18, 0.022, 0.002, '#bfe0e6');
  wbox(l, x, z, 0.1, 0.2, 0.006, 0.058, '#e9e4d6');
  for (const a of [-0.07, 0.07])
    for (const s of [-1, 1]) {
      const w = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 10).rotateX(Math.PI / 2);
      l.shape(w, '#1c1f21', ...off(l, x, z, a, s * 0.03), 0.042);
    }
}

/** A tram on rails with a pantograph pole. */
function tram(l: Lot, x: number, z: number, color: string): void {
  railLine(l, 0.02, z, 0.98, z, 0.034, { steel: true });
  wbox(l, x, z, 0.044, 0.22, 0.07, 0.06, color);
  wbox(l, x, z, 0.114, 0.23, 0.01, 0.065, '#e9e4d6');
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, 0, s * 0.031), 0.072, 0.2, 0.026, 0.002, pane, 0, 0, 0.6);
  l.beam([x, 0.124, z], [x + 0.06 / l.spanX, 0.2, z], 0.003, iron);
  l.beam([0.02, 0.2, z], [0.98, 0.2, z], 0.0015, '#2c2a28');
}

/** Waiting passengers. */
function crowd(l: Lot, pts: readonly (readonly [number, number])[]): void {
  const coats = ['#c84a3a', '#3a5a7a', '#5a6a4a', '#8a5a3a', '#6a3a5a', '#2f6f9a'];
  workers(
    l,
    pts.map(
      ([x, z], i) => [x, z, coats[i % coats.length]!, i % 2 ? '#2c2c2e' : '#8a6a3a'] as const,
    ),
  );
}

/** Stacked shipping crates/containers. */
function containers(l: Lot, x: number, z: number, n: number, ry = 0): void {
  const colors = ['#c84a3a', '#2f6f9a', '#3f8a6a', '#d8a832', '#8a5a3a'];
  for (let i = 0; i < n; i++) {
    const [cx, cz] = off(l, x, z, Math.cos(ry) * (i % 3) * 0.1, -Math.sin(ry) * (i % 3) * 0.1);
    const y = 0.034 + Math.floor(i / 3) * 0.05;
    wbox(l, cx, cz, y, 0.095, 0.048, 0.045, colors[(i * 3) % colors.length]!, ry);
    for (let k = 0; k < 5; k++)
      wbox(
        l,
        ...off(l, cx, cz, Math.cos(ry) * (-0.04 + k * 0.02), -Math.sin(ry) * (-0.04 + k * 0.02)),
        y + 0.004,
        0.003,
        0.04,
        0.047,
        '#2c2c2e',
        ry,
      );
  }
}

/** Ship moored at the quay: hull, deckhouse, funnel. */
function ship(l: Lot, x: number, z: number, len: number, hull: string, funnel: string): void {
  const g = new THREE.CapsuleGeometry(len * 0.13, len * 0.75, 4, 10)
    .rotateZ(Math.PI / 2)
    .scale(1, 0.55, 0.9);
  l.shape(g, hull, x, z, 0.03);
  wbox(l, x, z, 0.05, len * 0.9, 0.006, len * 0.2, '#b09a78');
  wbox(l, ...off(l, x, z, len * 0.2, 0), 0.056, len * 0.22, 0.05, len * 0.16, '#e9e4d6');
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      ...off(l, x, z, len * 0.12 + i * len * 0.05, len * 0.081),
      0.075,
      0.012,
      0.012,
      0.002,
      pane,
      0,
      0,
      1,
    );
  wround(l, ...off(l, x, z, len * 0.05, 0), 0.016, 0.018, 0.056, 0.08, funnel, 10);
  wround(l, ...off(l, x, z, len * 0.05, 0), 0.017, 0.017, 0.12, 0.012, '#1c1f21', 10);
  for (const a of [-0.35, -0.15]) containers(l, ...off(l, x, z, len * a, -len * 0.04), 2);
}

/** Quay: water strip along the back edge, stone quay wall with bollards. */
function quay(l: Lot, seed: string, depth = 0.26): void {
  reseed(seed);
  meadow(l, grass, 6);
  waterSheet(l, 0.5, depth / 2, l.spanX, depth * l.spanZ, 0.042, sea);
  wbox(l, 0.5, depth + 0.02, 0.0, l.spanX, 0.042, 0.04, '#9a9282');
  for (let i = 0; i < 8; i++)
    wround(l, (i + 0.5) / 8, depth + 0.03, 0.007, 0.008, 0.042, 0.016, '#2c3134', 8);
  wbox(
    l,
    0.5,
    (1 + depth) / 2 + 0.02,
    0.03,
    l.spanX,
    0.01,
    (1 - depth - 0.04) * l.spanZ,
    '#9a978f',
  );
}

/** Dark stair descending into the ground, with a balustrade round it. */
function stairWell(l: Lot, x: number, z: number, w: number, d: number): void {
  wbox(l, x, z, 0.03, w, 0.012, d, '#1c1f21');
  for (let i = 0; i < 6; i++)
    wbox(
      l,
      ...off(l, x, z, 0, -d / 2 + 0.01 + i * (d / 7)),
      0.032,
      w - 0.02,
      0.006,
      0.01,
      '#4a4f54',
    );
  for (const [a, b, c, e] of [
    [-w / 2, -d / 2, w / 2, -d / 2],
    [-w / 2, -d / 2, -w / 2, d / 2],
    [w / 2, -d / 2, w / 2, d / 2],
  ] as const) {
    l.beam(
      [x + a / l.spanX, 0.07, z + b / l.spanZ],
      [x + c / l.spanX, 0.07, z + e / l.spanZ],
      0.006,
      '#4a5257',
    );
    const n = Math.max(2, Math.round(Math.hypot(c - a, e - b) / 0.03));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      wbox(
        l,
        x + (a + (c - a) * t) / l.spanX,
        z + (b + (e - b) * t) / l.spanZ,
        0.03,
        0.004,
        0.04,
        0.004,
        '#4a5257',
      );
    }
  }
}

/** Round "M" metro sign on a post. */
function metroSign(l: Lot, x: number, z: number, h = 0.16): void {
  wround(l, x, z, 0.004, 0.005, 0.03, h, '#2c3134', 6);
  const disc = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 16).rotateX(Math.PI / 2);
  l.shape(disc, '#c8392c', x, z, 0.03 + h, 0.6);
  wbox(l, x, z, 0.03 + h - 0.009, 0.004, 0.018, 0.008, '#f2efe6');
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, s * 0.008, 0), 0.03 + h - 0.009, 0.004, 0.018, 0.008, '#f2efe6');
}

/** Staddle stone: mushroom-shaped pier that keeps rats out of a granary. */
function staddle(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.008, 0.014, 0.03, 0.05, '#a49c8c', 8);
  wround(l, x, z, 0.022, 0.02, 0.08, 0.012, '#bdb6a6', 10);
}

/** Sacks on a pallet. */
function sacks(l: Lot, x: number, z: number, n: number, color = '#d8c8a0'): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, (i % 3) * 0.024 - 0.024, Math.floor(i / 3) % 2 ? 0.02 : 0);
    const g = new THREE.SphereGeometry(0.013, 8, 6).scale(1.2, 0.75, 0.9);
    l.shape(g, tone(color, 0.06), px, pz, 0.04 + Math.floor(i / 6) * 0.016);
  }
}

/** Street tree: trunk and a round crown. */
function tree(l: Lot, x: number, z: number, h: number): void {
  wround(l, x, z, 0.008, 0.011, 0.03, h * 0.45, '#5b4330', 6);
  l.shape(new THREE.SphereGeometry(h * 0.32, 10, 8), tone('#4f8a3a', 0.1), x, z, 0.03 + h * 0.7);
}

/** Cafe table under a parasol with two chairs. */
function cafeTable(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.016, 0.016, 0.06, 0.003, '#e9e4d6', 10);
  wround(l, x, z, 0.002, 0.002, 0.03, 0.03, '#2c2c2e', 4);
  wround(l, x, z, 0.0015, 0.0015, 0.06, 0.05, '#e9e4d6', 4);
  l.shape(new THREE.ConeGeometry(0.04, 0.018, 8), '#c8392c', x, z, 0.119);
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, s * 0.024, 0), 0.03, 0.012, 0.02, 0.012, '#5a3a2a');
}

export const infraDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Town hall (2x2); the neoclassical civic hall follows its approved concept art
  // -----------------------------------------------------------------------------------------
  town_hall(l) {
    square(l, 'town_hall', 0.06, 0.06, 0.94, 0.94, '#c4bca8', 10);
    // Two-storey brick moot hall with a clock cupola, flag, steps and a town square.
    const hx = 0.5;
    const hz = 0.36;
    brickBody(l, hx, hz, 0.7, 0.36, 0.03, 0.24, brick);
    hallFacade(l, hx, hz, 0.7, 0.36, 0.03, 0.24, brick, {
      bay: 0.1,
      trim: limestone,
      skip: [['+z', 3]],
    });
    door(l, hx, hz, 0.7, 0.36, '+z', 0, 0.03, 0.07, 0.12, timberDark);
    shingleGable(l, hx, hz, 'x', 0.7, 0.36, 0.27, 0.14, slate, brick);
    const cup = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    l.shape(cup, '#e9e4d6', hx, hz, 0.46);
    for (const f of ['+z', '+x', '-x'] as const) clockFace(l, hx, hz, 0.1, 0.1, f, 0.46, 0.03);
    l.shape(new THREE.ConeGeometry(0.075, 0.1, 4).rotateY(Math.PI / 4), slate, hx, hz, 0.56);
    wround(l, hx, hz, 0.002, 0.005, 0.61, 0.05, brass, 6);
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        ...faceAt(l, hx, hz, 0.7, 0.36, '+z', 0, 0.02 + i * 0.016),
        0.03,
        0.18,
        0.036 - i * 0.012,
        0.018,
        limestone,
      );
    // Square: notice board, memorial, benches, lamps and townsfolk.
    wbox(l, 0.5, 0.8, 0.03, 0.08, 0.03, 0.08, limestone);
    wround(l, 0.5, 0.8, 0.012, 0.018, 0.06, 0.16, limestone, 8);
    l.shape(new THREE.SphereGeometry(0.016, 8, 6), brass, 0.5, 0.8, 0.23);
    wbox(l, 0.2, 0.7, 0.03, 0.006, 0.12, 0.006, '#5c4630');
    wbox(l, 0.2, 0.7, 0.1, 0.07, 0.05, 0.006, '#7a5634');
    for (let i = 0; i < 4; i++)
      wbox(l, ...off(l, 0.2, 0.7, -0.024 + i * 0.016, 0.004), 0.11, 0.012, 0.016, 0.002, '#efe7d6');
    for (const [x, z] of [
      [0.32, 0.86],
      [0.68, 0.86],
    ] as const)
      bench(l, x, z, 0);
    flag(l, 0.84, 0.66, 0.28, '#c8392c');
    crowd(l, [
      [0.36, 0.7],
      [0.62, 0.72],
      [0.44, 0.92],
      [0.76, 0.84],
    ]);
    for (const [x, z] of [
      [0.08, 0.6],
      [0.92, 0.6],
      [0.08, 0.94],
      [0.92, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.17);
    for (let i = 0; i < 3; i++) flowerBed(l, 0.2 + i * 0.3, 0.1, 0.16, 0.05);
  },

  civic_hall(l) {
    square(l, 'civic_hall', 0.04, 0.04, 0.96, 0.96, '#cfc8b8', 6);
    // Approved concept: neoclassical civic hall in limestone with quoins, a columned portico
    // and pediment, tall arched windows, a balustrade and a clock in the pediment.
    const hx = 0.5;
    const hz = 0.36;
    stoneBody(l, hx, hz, 0.86, 0.46, 0.03, 0.06, '#a49c8c');
    renderBody(l, hx, hz, 0.84, 0.44, 0.09, 0.3, limestone, '#bdb6a6');
    quoins(l, hx, hz, 0.84, 0.44, 0.09, 0.3, '#e2dccf');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.84 : 0.44;
      const n = Math.round(len / 0.1);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        if (f === '+z' && Math.abs(t) < 0.14) continue;
        archWindow(l, hx, hz, 0.84, 0.44, f, t, 0.13, 0.04, 0.14, timberDark);
      }
    }
    wbox(l, hx, hz, 0.39, 0.88, 0.03, 0.48, '#e2dccf');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.86 : 0.46;
      for (let i = 0; i < Math.round(len / 0.03); i++)
        faceBox(
          l,
          hx,
          hz,
          0.86,
          0.46,
          f,
          -len / 2 + 0.015 + i * 0.03,
          -0.01,
          0.42,
          0.008,
          0.035,
          0.008,
          '#e2dccf',
        );
    }
    tinGable(l, hx, hz, 'x', 0.78, 0.38, 0.42, 0.1, slate);
    // Columned cupola on the ridge with a copper dome and a gilded finial.
    wround(l, hx, hz, 0.075, 0.08, 0.5, 0.03, '#e2dccf', 16);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wround(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.06, Math.sin(a) * 0.06),
        0.006,
        0.007,
        0.53,
        0.08,
        '#efe9dc',
        6,
      );
    }
    wround(l, hx, hz, 0.05, 0.05, 0.53, 0.08, pane, 12);
    wround(l, hx, hz, 0.072, 0.072, 0.61, 0.015, '#e2dccf', 16);
    const cdome = new THREE.SphereGeometry(0.065, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(cdome, copper, hx, hz, 0.625);
    wround(l, hx, hz, 0.002, 0.008, 0.69, 0.05, brass, 6);
    const [px, pz] = faceAt(l, hx, hz, 0.84, 0.44, '+z', 0, 0.06);
    for (let i = 0; i < 4; i++)
      wround(l, ...off(l, px, pz, -0.12 + i * 0.08, 0), 0.014, 0.016, 0.06, 0.3, '#efe9dc', 10);
    wbox(l, px, pz, 0.36, 0.32, 0.04, 0.12, '#e2dccf');
    const ped = new THREE.Shape();
    ped.moveTo(-0.17, 0);
    ped.lineTo(0.17, 0);
    ped.lineTo(0, 0.08);
    ped.closePath();
    l.shape(
      new THREE.ExtrudeGeometry(ped, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06),
      '#efe9dc',
      px,
      pz,
      0.4,
    );
    clockFace(l, px, pz, 0.32, 0.12, '+z', 0.425, 0.022);
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        px,
        pz + (0.07 + i * 0.018) / l.spanZ,
        0.03,
        0.36 - i * 0.02,
        0.03 - i * 0.007,
        0.02,
        '#d8d0bc',
      );
    door(l, hx, hz, 0.84, 0.44, '+z', 0, 0.09, 0.07, 0.14, timberDark);
    for (const s of [-1, 1]) flag(l, 0.5 + s * 0.12, 0.66, 0.3, s < 0 ? '#c8392c' : '#2f6f9a');
    for (let i = 0; i < 2; i++) flowerBed(l, 0.24 + i * 0.52, 0.86, 0.3, 0.08);
    for (const [x, z] of [
      [0.3, 0.74],
      [0.7, 0.74],
    ] as const)
      bench(l, x, z, 0);
    crowd(l, [
      [0.42, 0.72],
      [0.58, 0.76],
      [0.5, 0.9],
      [0.2, 0.7],
      [0.8, 0.7],
    ]);
    for (const [x, z] of [
      [0.06, 0.66],
      [0.94, 0.66],
      [0.36, 0.94],
      [0.64, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.18);
  },

  magistrate_palace(l) {
    square(l, 'magistrate_palace', 0.03, 0.03, 0.97, 0.97, '#d8d2c4', 4);
    // Admiral's palace: three-storey marble block with mansard wings, a central tower with a
    // copper dome and gilded lantern, a forecourt with a fountain, guards and flags.
    const hx = 0.5;
    const hz = 0.34;
    stoneBody(l, hx, hz, 0.96, 0.48, 0.03, 0.06, '#a49c8c');
    renderBody(l, hx, hz, 0.94, 0.46, 0.09, 0.4, marble, '#c4bca8');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.94 : 0.46;
      const n = Math.round(len / 0.09);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        if (f === '+z' && Math.abs(t) < 0.1) continue;
        archWindow(l, hx, hz, 0.94, 0.46, f, t, 0.12, 0.035, 0.1, brass);
        window4(l, hx, hz, 0.94, 0.46, f, t, 0.28, 0.035, { frame: brass });
        window4(l, hx, hz, 0.94, 0.46, f, t, 0.4, 0.03, { frame: brass });
      }
    }
    for (const s of [-1, 1]) {
      const [wx, wz] = off(l, hx, hz, s * 0.33, 0);
      const mans = new THREE.BoxGeometry(0.3, 0.1, 0.48);
      l.shape(mans, slate, wx, wz, 0.54);
      for (const f of ['+z', '-z'] as const)
        for (const t of [-0.08, 0.08]) {
          const [dx, dz] = faceAt(l, wx, wz, 0.3, 0.48, f, t, -0.004);
          wbox(l, dx, dz, 0.51, 0.04, 0.05, 0.03, '#e2dccf');
          wbox(l, dx, dz, 0.52, 0.026, 0.03, 0.034, pane, 0, 0, 1);
        }
    }
    const tx = hx;
    const tz = hz;
    wbox(l, tx, tz, 0.49, 0.22, 0.22, 0.22, marble);
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      clockFace(l, tx, tz, 0.22, 0.22, f, 0.62, 0.04);
    wbox(l, tx, tz, 0.71, 0.24, 0.02, 0.24, brass);
    const dome = new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(
      1,
      1.3,
      1,
    );
    l.shape(dome, copper, tx, tz, 0.73);
    wround(l, tx, tz, 0.018, 0.022, 0.86, 0.05, brass, 10);
    l.shape(new THREE.SphereGeometry(0.014, 10, 8), '#ffd27a', tx, tz, 0.925, 1);
    const [px, pz] = faceAt(l, hx, hz, 0.94, 0.46, '+z', 0, 0.06);
    for (let i = 0; i < 4; i++)
      wround(l, ...off(l, px, pz, -0.09 + i * 0.06, 0), 0.012, 0.014, 0.09, 0.3, '#efe9dc', 10);
    wbox(l, px, pz, 0.39, 0.24, 0.03, 0.12, brass);
    door(l, hx, hz, 0.94, 0.46, '+z', 0, 0.09, 0.07, 0.14, '#2f3a44');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        px,
        pz + (0.07 + i * 0.018) / l.spanZ,
        0.03,
        0.3 - i * 0.02,
        0.06 - i * 0.014,
        0.02,
        '#d8d0bc',
      );
    // Forecourt: fountain, parterres, sentry boxes with guards, flags and carriages.
    wround(l, 0.5, 0.8, 0.12, 0.125, 0.034, 0.024, marble, 24);
    wround(l, 0.5, 0.8, 0.11, 0.11, 0.058, 0.002, '#5fa2b8', 24);
    wround(l, 0.5, 0.8, 0.02, 0.03, 0.058, 0.06, marble, 10);
    wround(l, 0.5, 0.8, 0.008, 0.012, 0.118, 0.05, brass, 8);
    for (const s of [-1, 1]) {
      flowerBed(l, 0.5 + s * 0.3, 0.82, 0.22, 0.12);
      const [gx, gz] = off(l, 0.5, 0.68, s * 0.18, 0);
      wbox(l, gx, gz, 0.03, 0.04, 0.09, 0.04, '#e9e4d6');
      wbox(l, gx, gz, 0.12, 0.05, 0.02, 0.05, '#2f3a44');
      crowd(l, [[0.5 + (s * 0.24) / l.spanX, 0.68]]);
      flag(l, 0.5 + s * 0.4, 0.64, 0.34, s < 0 ? '#c8392c' : '#d8a832');
    }
    horse(l, 0.14, 0.94, 0);
    wbox(l, 0.26, 0.94, 0.05, 0.08, 0.06, 0.05, '#2a3a5a');
    for (const [x, z] of [
      [0.04, 0.6],
      [0.96, 0.6],
      [0.04, 0.96],
      [0.96, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.2);
  },

  // -----------------------------------------------------------------------------------------
  // Warehouse (2x2)
  // -----------------------------------------------------------------------------------------
  warehouse(l) {
    square(l, 'warehouse', 0.04, 0.04, 0.96, 0.96, '#a8a292', 4);
    // Two-storey half-timbered warehouse on a brick ground floor, loading docks and two hoists.
    const hx = 0.46;
    const hz = 0.4;
    brickBody(l, hx, hz, 0.7, 0.42, 0.03, 0.14, brick);
    hallFacade(l, hx, hz, 0.7, 0.42, 0.03, 0.14, brick, {
      bay: 0.1,
      skip: [
        ['+z', 1],
        ['+z', 5],
      ],
    });
    halfTimber(l, hx, hz, 0.7, 0.42, 0.17, 0.12, '#e8dcc0');
    windows4(l, hx, hz, 0.7, 0.42, 0.21, 0.034, { frame: timberDark });
    shingleGable(l, hx, hz, 'x', 0.7, 0.42, 0.29, 0.14, '#6e5a46', '#e8dcc0');
    for (const t of [-0.22, 0.22]) {
      door(l, hx, hz, 0.7, 0.42, '+z', t, 0.03, 0.08, 0.1, timberDark, true);
      const [lx, lz] = faceAt(l, hx, hz, 0.7, 0.42, '+z', t, 0.03);
      wbox(l, lx, lz, 0.2, 0.06, 0.08, 0.05, '#e8dcc0');
      shingleGable(l, lx, lz, 'z', 0.05, 0.06, 0.28, 0.03, '#6e5a46');
      wbox(l, ...off(l, lx, lz, 0, 0.03), 0.27, 0.004, 0.004, 0.05, iron);
      l.beam([lx, 0.27, lz + 0.05 / l.spanZ], [lx, 0.1, lz + 0.05 / l.spanZ], 0.002, '#1c1f21');
      crate(l, lx, lz + 0.05 / l.spanZ, 0.08, '#8a6a48');
    }
    wbox(l, ...faceAt(l, hx, hz, 0.7, 0.42, '+z', 0, 0.03), 0.03, 0.62, 0.03, 0.05, '#8a8274');
    // Yard: carts and horses, barrels, sacks, crates and porters.
    horse(l, 0.2, 0.86, 0);
    cart(l, 0.34, 0.86, 0, 'barrels');
    horse(l, 0.62, 0.9, Math.PI);
    cart(l, 0.48, 0.9, Math.PI, 'crates');
    for (let i = 0; i < 6; i++) barrel(l, 0.84 + (i % 2) * 0.035, 0.66 + Math.floor(i / 2) * 0.035);
    sacks(l, 0.86, 0.88, 9);
    for (let i = 0; i < 4; i++)
      crate(l, 0.1 + (i % 2) * 0.05, 0.16 + Math.floor(i / 2) * 0.04, 0.036, '#8a6a48', i * 0.3);
    crowd(l, [
      [0.3, 0.72],
      [0.6, 0.72],
      [0.8, 0.8],
    ]);
    for (const [x, z] of [
      [0.06, 0.66],
      [0.94, 0.5],
      [0.94, 0.06],
    ] as const)
      lanternPost(l, x, z, 0.16);
    signboard(l, 0.08, 0.94, 0.08, 0.12, '#5a3a2a');
  },

  distribution_depot(l) {
    square(l, 'distribution_depot', 0.03, 0.03, 0.97, 0.97, '#a8a292', 2);
    // Brick depot with a row of loading bays under canopies and a dispatch control tower.
    const hx = 0.44;
    const hz = 0.36;
    brickBody(l, hx, hz, 0.76, 0.46, 0.03, 0.26, brick);
    hallFacade(l, hx, hz, 0.76, 0.46, 0.03, 0.26, brick, { bay: 0.095, faces: ['-z', '+x', '-x'] });
    for (let i = 0; i < 4; i++) {
      const t = -0.27 + i * 0.18;
      faceBox(l, hx, hz, 0.76, 0.46, '+z', t, 0.002, 0.03, 0.12, 0.12, 0.006, '#5a6268');
      for (let k = 1; k < 8; k++)
        faceBox(
          l,
          hx,
          hz,
          0.76,
          0.46,
          '+z',
          t,
          0.006,
          0.03 + k * 0.015,
          0.12,
          0.003,
          0.003,
          '#4a5257',
        );
      faceBox(l, hx, hz, 0.76, 0.46, '+z', t, 0.004, 0.18, 0.06, 0.05, 0.004, pane, 1);
      const [cx, cz] = faceAt(l, hx, hz, 0.76, 0.46, '+z', t, 0.03);
      wbox(l, cx, cz, 0.15, 0.15, 0.008, 0.06, '#4f5a60');
    }
    tinGable(l, hx, hz, 'x', 0.76, 0.46, 0.29, 0.1, slate, brick);
    ridgeLantern(l, hx, hz, 'x', 0.5, 0.39, '#3f464b');
    const [tx, tz] = off(l, hx, hz, 0.44, -0.12);
    brickBody(l, tx, tz, 0.12, 0.12, 0.03, 0.42, brick);
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      faceBox(l, tx, tz, 0.12, 0.12, f, 0, 0.002, 0.38, 0.1, 0.05, 0.004, pane, 1);
    wbox(l, tx, tz, 0.45, 0.14, 0.012, 0.14, '#4f5a60');
    wround(l, tx, tz, 0.003, 0.004, 0.46, 0.08, iron, 6);
    // Lorries backed up to the bays, pallets, forklift, drivers.
    for (let i = 0; i < 3; i++)
      truck(l, 0.18 + i * 0.26, 0.84, Math.PI / 2, ['#3f6b8a', '#7a3a2a', '#3f8a6a'][i]!);
    for (let i = 0; i < 4; i++) pallet(l, 0.12 + i * 0.07, 0.62, i % 2 ? '#c9b48a' : '#8f969a');
    forklift(l, 0.56, 0.66, 0.4);
    drums(l, 0.9, 0.62, 3, '#2f5d8a');
    crowd(l, [
      [0.34, 0.68],
      [0.74, 0.66],
    ]);
    for (const [x, z] of [
      [0.04, 0.5],
      [0.96, 0.5],
      [0.04, 0.96],
      [0.96, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.18);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
  },

  automated_logistics_hub(l) {
    square(l, 'automated_logistics_hub', 0.02, 0.02, 0.98, 0.98, '#a8a292', 2);
    // Three-storey brick-and-steel hub with an arcade, a clock tower and a rooftop crane, plus a
    // container yard under a gantry.
    const hx = 0.4;
    const hz = 0.34;
    brickBody(l, hx, hz, 0.66, 0.46, 0.03, 0.4, brick);
    hallFacade(l, hx, hz, 0.66, 0.46, 0.03, 0.4, brick, { bay: 0.094, trim: limestone });
    const [ax, az] = faceAt(l, hx, hz, 0.66, 0.46, '+z', 0, 0.04);
    for (let i = 0; i < 7; i++) {
      wbox(l, ...off(l, ax, az, -0.3 + i * 0.1, 0), 0.03, 0.02, 0.12, 0.02, limestone);
    }
    wbox(l, ax, az, 0.15, 0.64, 0.02, 0.08, limestone);
    tinGable(l, hx, hz, 'x', 0.66, 0.46, 0.43, 0.08, slate, brick);
    const [cx, cz] = off(l, hx, hz, -0.36, 0.1);
    brickBody(l, cx, cz, 0.12, 0.12, 0.03, 0.62, brick);
    for (const f of ['+z', '+x', '-x', '-z'] as const)
      clockFace(l, cx, cz, 0.12, 0.12, f, 0.56, 0.035);
    l.shape(new THREE.ConeGeometry(0.09, 0.12, 4).rotateY(Math.PI / 4), slate, cx, cz, 0.71);
    jibCrane(l, ...off(l, hx, hz, 0.2, -0.1), 0.2, 0.3, 0.16, '#d8a832', '#2f6f9a');
    gantry(l, 0.76, 0.98, 0.5, 0.36, 0.5);
    containers(l, 0.78, 0.36, 6, Math.PI / 2);
    containers(l, 0.9, 0.36, 5, Math.PI / 2);
    for (let i = 0; i < 2; i++) truck(l, 0.2 + i * 0.3, 0.86, 0, ['#3f6b8a', '#7a3a2a'][i]!);
    forklift(l, 0.66, 0.78, 0.2);
    for (let i = 0; i < 4; i++) pallet(l, 0.1 + i * 0.07, 0.68, '#c9b48a');
    crowd(l, [
      [0.3, 0.7],
      [0.5, 0.72],
      [0.82, 0.86],
    ]);
    for (const [x, z] of [
      [0.04, 0.6],
      [0.96, 0.92],
      [0.6, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.2);
    fence(l, [
      [0.02, 0.02],
      [0.98, 0.02],
    ]);
  },

  // -----------------------------------------------------------------------------------------
  // Cargo port (3x2): water along the back edge
  // -----------------------------------------------------------------------------------------
  cargo_port(l) {
    quay(l, 'cargo_port');
    // Stone quay, a timber harbour crane, a freight shed and stacks of crates; a ship alongside.
    ship(l, 0.42, 0.12, 0.7, '#3a4a5a', '#c8392c');
    jibCrane(l, 0.72, 0.36, 0.3, Math.PI / 2, 0.2, '#5c4630', '#8a6a48');
    const sx = 0.36;
    const sz = 0.66;
    boardBody(l, sx, sz, 0.6, 0.3, 0.03, 0.16, '#7a6a52');
    windows4(l, sx, sz, 0.6, 0.3, 0.08, 0.034, { frame: '#e9dfc9' });
    for (const t of [-0.15, 0.15])
      door(l, sx, sz, 0.6, 0.3, '-z', t, 0.03, 0.1, 0.12, timberDark, true);
    tinGable(l, sx, sz, 'x', 0.6, 0.3, 0.19, 0.08, '#5a5f63', '#7a6a52');
    containers(l, 0.74, 0.62, 5);
    for (let i = 0; i < 6; i++) barrel(l, 0.06 + (i % 3) * 0.03, 0.4 + Math.floor(i / 3) * 0.035);
    for (let i = 0; i < 5; i++) crate(l, 0.6 + i * 0.04, 0.4, 0.04, '#8a6a48', i * 0.4);
    horse(l, 0.74, 0.9, 0);
    cart(l, 0.86, 0.9, 0, 'crates');
    crowd(l, [
      [0.5, 0.4],
      [0.3, 0.42],
      [0.66, 0.84],
    ]);
    for (const [x, z] of [
      [0.04, 0.36],
      [0.96, 0.36],
      [0.04, 0.92],
      [0.96, 0.7],
    ] as const)
      lanternPost(l, x, z, 0.16);
    signboard(l, 0.1, 0.92, 0.08, 0.12, '#2f4a6a');
  },

  trade_harbor(l) {
    quay(l, 'trade_harbor');
    // Twin harbour cranes over the berth, a two-storey brick customs house, a rail spur.
    ship(l, 0.46, 0.12, 0.9, '#2f3a44', '#d8a832');
    for (const x of [0.3, 0.66]) {
      for (const s of [-1, 1])
        l.beam([x + (s * 0.04) / l.spanX, 0.03, 0.36], [x, 0.32, 0.36], 0.012, '#c84a3a');
      wbox(l, x, 0.36, 0.32, 0.06, 0.05, 0.06, '#c84a3a');
      l.beam([x, 0.36, 0.36], [x, 0.38, 0.12], 0.012, '#c84a3a');
      l.beam([x, 0.38, 0.14], [x, 0.16, 0.14], 0.002, '#1c1f21');
      wbox(l, x, 0.14, 0.12, 0.06, 0.03, 0.04, '#3f8a6a');
    }
    const cx = 0.3;
    const cz = 0.7;
    brickBody(l, cx, cz, 0.36, 0.24, 0.03, 0.26, brick);
    hallFacade(l, cx, cz, 0.36, 0.24, 0.03, 0.26, brick, {
      bay: 0.09,
      trim: limestone,
      skip: [['+z', 1]],
    });
    door(l, cx, cz, 0.36, 0.24, '+z', -0.045, 0.03, 0.06, 0.11, timberDark);
    shingleGable(l, cx, cz, 'x', 0.36, 0.24, 0.29, 0.12, slate, brick);
    clockFace(l, cx, cz, 0.36, 0.24, '+z', 0.24, 0.025);
    flag(l, 0.52, 0.7, 0.32, '#2f6f9a');
    railLine(l, 0.56, 0.46, 0.98, 0.46, 0.036, { steel: true });
    for (const x of [0.66, 0.8, 0.94]) wagon(l, x, 0.46, 0, null, 0.042, '#4a4f54');
    containers(l, 0.66, 0.6, 6);
    containers(l, 0.66, 0.78, 4);
    truck(l, 0.62, 0.92, 0, '#3f6b8a');
    crowd(l, [
      [0.5, 0.42],
      [0.2, 0.44],
      [0.5, 0.86],
    ]);
    for (const [x, z] of [
      [0.04, 0.4],
      [0.96, 0.36],
      [0.04, 0.94],
      [0.96, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.18);
  },

  imperial_seaport(l) {
    quay(l, 'imperial_seaport');
    // Marble customs palace with a copper dome, twin gilded cranes, a great steamship.
    ship(l, 0.48, 0.12, 1.1, '#1c2a3a', '#c8392c');
    for (const x of [0.22, 0.74]) {
      for (const s of [-1, 1])
        l.beam([x + (s * 0.05) / l.spanX, 0.03, 0.37], [x, 0.38, 0.37], 0.014, brass);
      wbox(l, x, 0.37, 0.38, 0.07, 0.06, 0.07, '#d6a83a');
      l.beam([x, 0.42, 0.37], [x, 0.44, 0.1], 0.014, brass);
      l.beam([x, 0.44, 0.12], [x, 0.2, 0.12], 0.002, '#1c1f21');
      wbox(l, x, 0.12, 0.16, 0.06, 0.03, 0.04, '#2f6f9a');
    }
    const px = 0.42;
    const pz = 0.72;
    stoneBody(l, px, pz, 0.62, 0.32, 0.03, 0.05, '#a49c8c');
    renderBody(l, px, pz, 0.6, 0.3, 0.08, 0.26, marble, '#c4bca8');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.6 : 0.3;
      const n = Math.round(len / 0.08);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        if (f === '+z' && Math.abs(t) < 0.08) continue;
        archWindow(l, px, pz, 0.6, 0.3, f, t, 0.12, 0.034, 0.1, brass);
      }
    }
    wbox(l, px, pz, 0.34, 0.62, 0.02, 0.32, '#e2dccf');
    wround(l, px, pz, 0.1, 0.11, 0.36, 0.06, marble, 20);
    const dome = new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(dome, copper, px, pz, 0.42);
    wround(l, px, pz, 0.014, 0.018, 0.52, 0.04, brass, 8);
    door(l, px, pz, 0.6, 0.3, '+z', 0, 0.08, 0.06, 0.12, '#2f3a44');
    for (const s of [-1, 1])
      flag(l, px + (s * 0.36) / l.spanX, 0.86, 0.34, s < 0 ? '#c8392c' : '#d8a832');
    containers(l, 0.82, 0.62, 6);
    containers(l, 0.82, 0.8, 5);
    truck(l, 0.9, 0.94, 0, '#7a2a2a');
    crowd(l, [
      [0.36, 0.44],
      [0.56, 0.42],
      [0.42, 0.92],
      [0.7, 0.9],
    ]);
    for (const [x, z] of [
      [0.04, 0.4],
      [0.96, 0.4],
      [0.04, 0.94],
      [0.62, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.2);
  },

  // -----------------------------------------------------------------------------------------
  // Bus stop (1x1)
  // -----------------------------------------------------------------------------------------
  bus_stop(l) {
    square(l, 'bus_stop', 0.04, 0.5, 0.96, 0.96, '#b0aca2', 20);
    // Glass and steel shelter with a bench and timetable; a bus pulling in, people waiting.
    const sx = 0.5;
    const sz = 0.72;
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, sx, sz, a * 0.1, b * 0.035), 0.03, 0.006, 0.12, 0.006, '#4a5257');
    wbox(l, ...off(l, sx, sz, 0, -0.035), 0.04, 0.2, 0.1, 0.003, '#bfe0e6', 0, 0, 0.3);
    wbox(l, sx, sz, 0.15, 0.22, 0.008, 0.09, '#2f6f9a');
    bench(l, sx, sz - 0.02 / l.spanZ, 0);
    wbox(l, ...off(l, sx, sz, 0.1, 0), 0.04, 0.004, 0.08, 0.04, '#efe7d6');
    bus(l, 0.5, 0.38, '#d8a832');
    crowd(l, [
      [0.36, 0.76],
      [0.64, 0.8],
      [0.72, 0.68],
    ]);
    lanternPost(l, 0.14, 0.7, 0.14);
    wround(l, 0.86, 0.72, 0.003, 0.004, 0.03, 0.12, iron, 6);
    wbox(l, 0.86, 0.72, 0.13, 0.03, 0.03, 0.004, '#2f6f9a', 0, 0, 0.5);
    wbox(l, 0.5, 0.38, 0.0295, 0.77, 0.001, 0.1, '#4a4a4a');
    shrub(l, 0.08, 0.94, 0.03);
    shrub(l, 0.92, 0.94, 0.03);
  },

  tram_pavilion(l) {
    square(l, 'tram_pavilion', 0.04, 0.5, 0.96, 0.96, '#b9b2a2', 18);
    // Ornate cast-iron and timber pavilion with clocks and lanterns; a tram at the platform.
    const sx = 0.5;
    const sz = 0.72;
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      wround(l, ...off(l, sx, sz, a * 0.11, b * 0.05), 0.005, 0.006, 0.03, 0.16, '#2f4a3a', 8);
      l.beam(
        [sx + (a * 0.11) / l.spanX, 0.15, sz + (b * 0.05) / l.spanZ],
        [sx + (a * 0.07) / l.spanX, 0.19, sz + (b * 0.05) / l.spanZ],
        0.004,
        '#2f4a3a',
      );
    }
    shingleGable(l, sx, sz, 'x', 0.26, 0.13, 0.19, 0.06, '#2f4a3a');
    for (const f of ['+z', '-z'] as const) clockFace(l, sx, sz, 0.08, 0.14, f, 0.165, 0.016);
    for (const a of [-0.11, 0.11])
      wbox(l, ...off(l, sx, sz, a, 0.06), 0.14, 0.012, 0.016, 0.012, '#ffd27a', 0, 0, 1);
    bench(l, sx, sz, 0);
    tram(l, 0.5, 0.38, '#c84a3a');
    crowd(l, [
      [0.36, 0.78],
      [0.62, 0.8],
      [0.7, 0.66],
      [0.3, 0.64],
    ]);
    lanternPost(l, 0.12, 0.88, 0.14);
    lanternPost(l, 0.88, 0.88, 0.14);
    for (let i = 0; i < 3; i++) flowerBed(l, 0.24 + i * 0.26, 0.94, 0.12, 0.04);
  },

  grand_transit_kiosk(l) {
    square(l, 'grand_transit_kiosk', 0.04, 0.48, 0.96, 0.96, '#c4bca8', 16);
    // Art-nouveau octagonal kiosk in verdigris copper with stained glass; tram and bus.
    const sx = 0.5;
    const sz = 0.72;
    wround(l, sx, sz, 0.11, 0.115, 0.03, 0.02, limestone, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      wround(
        l,
        ...off(l, sx, sz, Math.cos(a) * 0.1, Math.sin(a) * 0.1),
        0.005,
        0.006,
        0.05,
        0.16,
        copper,
        8,
      );
      const g = Math.PI / 8;
      wbox(
        l,
        ...off(l, sx, sz, Math.cos(a + g) * 0.092, Math.sin(a + g) * 0.092),
        0.06,
        0.07,
        0.1,
        0.003,
        ['#d86a8a', '#8ab0d8', '#d8a832', '#8ad8a0'][i % 4]!,
        -(a + g) + Math.PI / 2,
        0,
        0.6,
      );
    }
    const dome = new THREE.SphereGeometry(0.11, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)
      .rotateY(Math.PI / 8)
      .scale(1, 1.3, 1);
    l.shape(dome, copper, sx, sz, 0.21);
    wround(l, sx, sz, 0.004, 0.012, 0.34, 0.06, brass, 8);
    l.shape(new THREE.SphereGeometry(0.01, 8, 6), '#ffd27a', sx, sz, 0.41, 1);
    tram(l, 0.36, 0.36, '#2f6f9a');
    bus(l, 0.8, 0.22, '#3f8a6a');
    crowd(l, [
      [0.3, 0.74],
      [0.7, 0.76],
      [0.5, 0.92],
      [0.76, 0.62],
    ]);
    for (const [x, z] of [
      [0.1, 0.6],
      [0.9, 0.6],
      [0.1, 0.94],
      [0.9, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.16);
  },

  // -----------------------------------------------------------------------------------------
  // Metro (2x2)
  // -----------------------------------------------------------------------------------------
  metro_station(l) {
    square(l, 'metro_station', 0.04, 0.04, 0.96, 0.96, '#b9b6ae', 8);
    // Concrete and glass entrance: a stair down behind a balustrade, a glass ticket hall, the
    // round "M" sign, bicycle racks and a newspaper kiosk.
    stairWell(l, 0.36, 0.5, 0.18, 0.3);
    const tx = 0.66;
    const tz = 0.4;
    wbox(l, tx, tz, 0.03, 0.3, 0.12, 0.22, '#8f8c84');
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      faceBox(
        l,
        tx,
        tz,
        0.3,
        0.22,
        f,
        0,
        0.002,
        0.04,
        f === '+z' || f === '-z' ? 0.26 : 0.18,
        0.09,
        0.004,
        '#bfe0e6',
        0.35,
      );
    wbox(l, tx, tz, 0.15, 0.34, 0.016, 0.26, '#6e6c66');
    door(l, tx, tz, 0.3, 0.22, '+z', 0, 0.03, 0.06, 0.09, '#2f3a44');
    metroSign(l, 0.2, 0.32, 0.18);
    metroSign(l, 0.84, 0.66, 0.18);
    for (let i = 0; i < 4; i++) {
      const [bx, bz] = off(l, 0.6, 0.78, i * 0.04, 0);
      for (const s of [-1, 1]) {
        const w = new THREE.TorusGeometry(0.012, 0.002, 4, 10).rotateY(Math.PI / 2);
        l.shape(w, '#2c2c2e', ...off(l, bx, bz, 0, s * 0.016), 0.044);
      }
      wbox(l, bx, bz, 0.046, 0.003, 0.003, 0.03, ['#c8392c', '#2f6f9a', '#3f8a6a', '#d8a832'][i]!);
    }
    wbox(l, 0.2, 0.74, 0.03, 0.08, 0.08, 0.06, '#3f8a6a');
    wbox(l, 0.2, 0.74, 0.11, 0.1, 0.01, 0.08, '#2f4a3a');
    crowd(l, [
      [0.36, 0.76],
      [0.5, 0.66],
      [0.7, 0.62],
      [0.8, 0.84],
    ]);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.06],
      [0.06, 0.94],
      [0.94, 0.94],
    ] as const)
      lanternPost(l, x, z, 0.17);
    for (let i = 0; i < 3; i++) flowerBed(l, 0.26 + i * 0.24, 0.92, 0.16, 0.05);
    for (const [x, z] of [
      [0.12, 0.12],
      [0.5, 0.12],
      [0.88, 0.3],
      [0.12, 0.56],
    ] as const)
      tree(l, x, z, 0.2);
    for (const [x, z] of [
      [0.62, 0.92],
      [0.88, 0.86],
    ] as const)
      cafeTable(l, x, z);
    bus(l, 0.4, 0.06 + 0.0, '#2f6f9a');
  },

  central_metro_plaza(l) {
    square(l, 'central_metro_plaza', 0.03, 0.03, 0.97, 0.97, '#c4bca8', 6);
    // Vaulted iron-and-glass pavilion over a broad stair, entrances on all four sides, kiosks.
    const hx = 0.5;
    const hz = 0.44;
    stairWell(l, hx, hz, 0.36, 0.3);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        wround(l, ...off(l, hx, hz, sx * 0.24, sz * 0.2), 0.008, 0.01, 0.03, 0.26, iron, 8);
    for (const sz of [-1, 1])
      wbox(l, ...off(l, hx, hz, 0, sz * 0.2), 0.28, 0.5, 0.012, 0.012, iron);
    const vault = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 18, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(vault, '#bfe0e6', hx, hz, 0.28, 0.35);
    for (let i = 0; i < 7; i++) {
      const rib = new THREE.TorusGeometry(0.221, 0.004, 4, 14, Math.PI).rotateY(Math.PI / 2);
      l.shape(rib, iron, ...off(l, hx, hz, -0.24 + i * 0.08, 0), 0.28);
    }
    metroSign(l, 0.14, 0.2, 0.22);
    metroSign(l, 0.86, 0.68, 0.22);
    for (const [x, z] of [
      [0.16, 0.78],
      [0.84, 0.2],
    ] as const) {
      wbox(l, x, z, 0.03, 0.08, 0.08, 0.06, '#2f6f9a');
      wbox(l, x, z, 0.11, 0.1, 0.01, 0.08, '#24476a');
    }
    for (let i = 0; i < 3; i++) bench(l, 0.3 + i * 0.2, 0.84, 0);
    crowd(l, [
      [0.36, 0.74],
      [0.5, 0.7],
      [0.64, 0.76],
      [0.26, 0.6],
      [0.76, 0.6],
    ]);
    for (const [x, z] of [
      [0.05, 0.05],
      [0.95, 0.05],
      [0.05, 0.95],
      [0.95, 0.95],
    ] as const)
      lanternPost(l, x, z, 0.18);
    for (let i = 0; i < 2; i++) flowerBed(l, 0.3 + i * 0.4, 0.94, 0.24, 0.05);
    for (const [x, z] of [
      [0.12, 0.42],
      [0.88, 0.42],
      [0.3, 0.12],
      [0.7, 0.12],
    ] as const)
      tree(l, x, z, 0.2);
    for (const [x, z] of [
      [0.26, 0.86],
      [0.74, 0.86],
    ] as const)
      cafeTable(l, x, z);
  },

  grand_terminus(l) {
    square(l, 'grand_terminus', 0.02, 0.02, 0.98, 0.98, '#d2cab6', 4);
    // Three-storey Beaux-Arts terminus with a four-faced clock tower, arched train shed windows
    // and twin fountains in the forecourt.
    const hx = 0.5;
    const hz = 0.34;
    stoneBody(l, hx, hz, 0.92, 0.46, 0.03, 0.06, '#a49c8c');
    renderBody(l, hx, hz, 0.9, 0.44, 0.09, 0.36, limestone, '#bdb6a6');
    for (const f of ['+z', '-z', '+x', '-x'] as const) {
      const len = f === '+z' || f === '-z' ? 0.9 : 0.44;
      const n = Math.round(len / 0.11);
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (i + 0.5) * (len / n);
        archWindow(l, hx, hz, 0.9, 0.44, f, t, 0.12, 0.05, 0.12, '#8a7a62');
        window4(l, hx, hz, 0.9, 0.44, f, t, 0.33, 0.032, { frame: '#8a7a62' });
      }
    }
    wbox(l, hx, hz, 0.45, 0.92, 0.02, 0.46, '#e2dccf');
    const roof = new THREE.CylinderGeometry(0.22, 0.22, 0.86, 18, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2);
    l.shape(roof, '#bfe0e6', hx, hz, 0.47, 0.3);
    for (let i = 0; i < 10; i++) {
      const rib = new THREE.TorusGeometry(0.221, 0.004, 4, 14, Math.PI).rotateY(Math.PI / 2);
      l.shape(rib, iron, ...off(l, hx, hz, -0.4 + i * 0.09, 0), 0.47);
    }
    const [tx, tz] = faceAt(l, hx, hz, 0.9, 0.44, '+z', 0.3, -0.06);
    wbox(l, tx, tz, 0.03, 0.12, 0.72, 0.12, limestone);
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      clockFace(l, tx, tz, 0.12, 0.12, f, 0.64, 0.038);
    l.shape(new THREE.ConeGeometry(0.085, 0.14, 4).rotateY(Math.PI / 4), copper, tx, tz, 0.82);
    wround(l, tx, tz, 0.002, 0.006, 0.89, 0.05, brass, 6);
    door(l, hx, hz, 0.9, 0.44, '+z', 0, 0.09, 0.1, 0.16, '#2f3a44');
    for (const s of [-1, 1]) {
      const [fx, fz] = off(l, 0.5, 0.8, s * 0.42, 0);
      wround(l, fx, fz, 0.09, 0.095, 0.034, 0.024, marble, 20);
      wround(l, fx, fz, 0.08, 0.08, 0.058, 0.002, '#5fa2b8', 20);
      wround(l, fx, fz, 0.01, 0.014, 0.058, 0.07, marble, 8);
    }
    tram(l, 0.5, 0.94, '#c84a3a');
    crowd(l, [
      [0.36, 0.7],
      [0.5, 0.74],
      [0.64, 0.7],
      [0.42, 0.84],
      [0.6, 0.86],
    ]);
    for (const [x, z] of [
      [0.04, 0.66],
      [0.96, 0.66],
      [0.3, 0.84],
      [0.7, 0.84],
    ] as const)
      lanternPost(l, x, z, 0.2);
    flag(l, 0.12, 0.66, 0.36, '#2f6f9a');
  },

  // -----------------------------------------------------------------------------------------
  // Stockpile and farm-goods store (2x2)
  // -----------------------------------------------------------------------------------------
  stockpile(l) {
    square(l, 'stockpile', 0.04, 0.04, 0.96, 0.96, '#9a8a6e', 6);
    // Timber-decked yard with three bays (logs, dressed stone, bricks), a tool shed and a derrick.
    for (const [x, kind] of [
      [0.22, 'logs'],
      [0.5, 'stone'],
      [0.78, 'brick'],
    ] as const) {
      wbox(l, x, 0.42, 0.03, 0.36, 0.008, 0.5, '#8a6a48');
      for (let i = 0; i < 7; i++)
        wbox(l, ...off(l, x, 0.42, -0.15 + i * 0.05, 0), 0.038, 0.003, 0.002, 0.5, '#5c4630');
      for (const s of [-1, 1])
        wbox(l, ...off(l, x, 0.42, s * 0.18, 0), 0.03, 0.012, 0.06, 0.5, '#6b4a2c');
      if (kind === 'logs') logPile(l, x, 0.42, 4, 0.3, Math.PI / 2, 0.014);
      else if (kind === 'stone') blockStack(l, x, 0.42, 0.04, 4, 6, 3, '#cfc9b9', 0.05);
      else blockStack(l, x, 0.42, 0.04, 5, 7, 3, '#b4613f', 0.036);
    }
    boardBody(l, 0.18, 0.86, 0.2, 0.12, 0.03, 0.1, '#7a6a52');
    door(l, 0.18, 0.86, 0.2, 0.12, '-z', 0, 0.03, 0.05, 0.08, timberDark, true);
    window4(l, 0.18, 0.86, 0.2, 0.12, '+x', 0, 0.06, 0.024, { shutters: '#4a3a2a' });
    tinGable(l, 0.18, 0.86, 'x', 0.2, 0.12, 0.13, 0.05, '#5a5048', '#7a6a52');
    jibCrane(l, 0.5, 0.86, 0.26, Math.PI / 2, 0.24, '#5c4630', '#cfc9b9');
    lumberStack(l, 0.82, 0.86, 0.2, 0.08, 5);
    horse(l, 0.36, 0.94, 0);
    cart(l, 0.5, 0.96, 0, 'crates');
    crowd(l, [
      [0.36, 0.72],
      [0.64, 0.72],
      [0.9, 0.7],
    ]);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.06],
      [0.06, 0.7],
      [0.94, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.15);
    fence(l, [
      [0.03, 0.03],
      [0.97, 0.03],
    ]);
  },

  grain_store(l) {
    square(l, 'grain_store', 0.04, 0.04, 0.96, 0.96, '#a59d8c', 12);
    // Timber granary raised on staddle stones, a ramp and hoist, sacks, carts and a weighbridge.
    const gx = 0.46;
    const gz = 0.4;
    for (let i = 0; i < 4; i++)
      for (const s of [-1, 1]) staddle(l, ...off(l, gx, gz, -0.24 + i * 0.16, s * 0.14));
    wbox(l, gx, gz, 0.092, 0.6, 0.02, 0.34, '#6b4a2c');
    boardBody(l, gx, gz, 0.56, 0.3, 0.11, 0.2, '#9a7a52');
    stoneBody(l, gx, gz, 0.58, 0.32, 0.11, 0.03, '#a49c8c');
    windows4(l, gx, gz, 0.56, 0.3, 0.18, 0.03, { shutters: '#4a3a2a' });
    door(l, gx, gz, 0.56, 0.3, '+z', 0, 0.11, 0.08, 0.12, timberDark, true);
    shingleGable(l, gx, gz, 'x', 0.56, 0.3, 0.31, 0.16, '#7a5a3a', '#9a7a52');
    ridgeLantern(l, gx, gz, 'x', 0.3, 0.47, '#5a4a3a');
    const [hx2, hz2] = faceAt(l, gx, gz, 0.56, 0.3, '+x', 0, 0.03);
    wbox(l, hx2, hz2, 0.31, 0.06, 0.004, 0.004, iron);
    l.beam([hx2 + 0.03 / l.spanX, 0.31, hz2], [hx2 + 0.03 / l.spanX, 0.12, hz2], 0.002, '#1c1f21');
    sacks(l, hx2 + 0.03 / l.spanX, hz2, 2);
    l.beam([gx, 0.1, gz + 0.16 / l.spanZ], [gx, 0.03, gz + 0.3 / l.spanZ], 0.07, '#7a5634');
    for (let i = 0; i < 3; i++) sacks(l, 0.2 + i * 0.12, 0.76, 6);
    wbox(l, 0.76, 0.8, 0.03, 0.2, 0.012, 0.1, '#5a5f63');
    wbox(l, 0.76, 0.8, 0.042, 0.18, 0.004, 0.08, '#8a8274');
    for (const [x, z] of [
      [0.1, 0.62],
      [0.24, 0.62],
    ] as const) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        l.beam(
          [x + (Math.cos(a) * 0.02) / l.spanX, 0.03, z + (Math.sin(a) * 0.02) / l.spanZ],
          [x, 0.11, z],
          0.008,
          '#d8b860',
        );
      }
    }
    for (let i = 0; i < 4; i++) crate(l, 0.86, 0.3 + i * 0.05, 0.036, '#8a6a48', i * 0.3);
    sacks(l, 0.86, 0.5, 9);
    tree(l, 0.1, 0.12, 0.2);
    tree(l, 0.88, 0.12, 0.18);
    horse(l, 0.62, 0.92, 0);
    cart(l, 0.76, 0.92, 0, 'crates');
    crowd(l, [
      [0.36, 0.68],
      [0.56, 0.7],
      [0.86, 0.66],
    ]);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.06],
      [0.06, 0.94],
      [0.94, 0.6],
    ] as const)
      lanternPost(l, x, z, 0.15);
  },
};
