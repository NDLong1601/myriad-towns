import * as THREE from 'three';
import {
  barrel,
  door,
  lanternPost,
  meadow,
  off,
  rand,
  reseed,
  shade,
  shingleGable,
  shrub,
  stoneBody,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import { boat, smoke, waterSheet } from './dioramaProps';
import {
  catwalk,
  faceBox,
  flywheel,
  hallFacade,
  iron,
  ladder,
  pane,
  pipe,
  signboard,
  stack,
  timberDark,
} from './industryKit';
import { brickBody, rockMass, rubble, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Civic group: water supply and lighthouses, drawn at the shared tile scale (0.77 units a tile).
//   well -> cistern_well -> pump_house -> water_tower -> aqueduct_reservoir
//   lighthouse -> harbor_beacon_tower -> imperial_pharos

const grass = '#79a24a';
const limestone = '#d8d0bc';
const marble = '#ece7dc';
const brass = '#c9a24a';
const copper = '#5fa58e';
const slate = '#4d5a66';
const terracotta = '#b4613f';

/** Lawn with a paved square of flagstones in the middle. */
function plaza(
  l: Lot,
  seed: string,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  color = '#b9b2a2',
): void {
  reseed(seed);
  meadow(l, grass, 16);
  const w = (x1 - x0) * l.spanX;
  const d = (z1 - z0) * l.spanZ;
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, w, 0.008, d, shade(color, 0.85));
  const n = Math.max(2, Math.round(w / 0.045));
  const m = Math.max(2, Math.round(d / 0.045));
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
        tone(color, 0.08),
      );
}

/** Water bucket. */
function bucket(l: Lot, x: number, z: number, y = 0.03): void {
  wround(l, x, z, 0.009, 0.007, y, 0.014, '#7a5634', 8);
  wround(l, x, z, 0.0085, 0.0085, y + 0.012, 0.002, '#4f93b0', 8);
}

/** Bench with a back. */
function bench(l: Lot, x: number, z: number, ry = 0): void {
  wbox(l, x, z, 0.046, 0.06, 0.005, 0.018, '#7a5634', ry);
  wbox(
    l,
    ...off(l, x, z, -Math.sin(ry) * -0.009, -Math.cos(ry) * 0.009),
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

/** Fountain basin with a jet. */
function fountain(l: Lot, x: number, z: number, r: number): void {
  wround(l, x, z, r, r * 1.05, 0.03, 0.022, limestone, 18);
  wround(l, x, z, r * 0.9, r * 0.9, 0.05, 0.002, '#5fa2b8', 18);
  wround(l, x, z, 0.008, 0.012, 0.05, 0.03, marble, 8);
  l.shape(new THREE.ConeGeometry(0.012, 0.03, 8).rotateX(Math.PI), '#bfe0e6', x, z, 0.1, 0.3);
}

/** Lantern room: glazed drum, glowing lamp, domed cap and vane. */
function lanternRoom(l: Lot, x: number, z: number, y: number, r: number, cap: string): void {
  catwalk(l, x, z, r * 1.05, y);
  wround(l, x, z, r * 0.9, r * 0.9, y, 0.012, '#2c3134', 12);
  wround(l, x, z, r * 0.82, r * 0.82, y + 0.012, r * 1.2, '#ffe9a8', 12);
  l.shape(
    new THREE.CylinderGeometry(r * 0.82, r * 0.82, r * 1.2, 12, 1, true),
    '#ffe9a8',
    x,
    z,
    y + 0.012 + r * 0.6,
    1,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84),
      y + 0.012,
      0.004,
      r * 1.2,
      0.004,
      '#2c3134',
    );
  }
  const dome = new THREE.SphereGeometry(r * 0.95, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  l.shape(dome, cap, x, z, y + 0.012 + r * 1.2);
  wround(l, x, z, 0.002, 0.005, y + r * 2.2, 0.04, brass, 6);
  wbox(l, x, z, y + r * 2.2 + 0.03, 0.03, 0.004, 0.004, iron);
}

/** Rocky shore along the back of a coastal lot, with sea beyond. */
function shore(l: Lot, seed: string): void {
  reseed(seed);
  meadow(l, grass, 10);
  waterSheet(l, 0.5, 0.12, 0.77, 0.24 * l.spanZ, 0.026);
  rockMass(l, 0.02, 0.18, 0.98, 0.34, 0.03, 0.05, '#8d887c', grass, 0.05);
  rubble(l, 0.5, 0.2, 0.03, 14, 0.36, '#7d786c');
}

export const waterDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Water supply
  // -----------------------------------------------------------------------------------------
  well(l) {
    plaza(l, 'well', 0.2, 0.2, 0.8, 0.8, '#b9ad94');
    // Round stone well with a windlass under a little tiled canopy.
    const cx = 0.5;
    const cz = 0.48;
    for (let i = 0; i < 5; i++)
      wround(l, cx, cz, 0.07, 0.072, 0.03 + i * 0.016, 0.016, tone('#a49c8c', 0.1), 16);
    wround(l, cx, cz, 0.072, 0.072, 0.11, 0.008, '#8a8274', 16);
    wround(l, cx, cz, 0.06, 0.06, 0.1, 0.004, '#2f5d78', 16);
    for (const s of [-1, 1])
      wbox(l, ...off(l, cx, cz, s * 0.072, 0), 0.11, 0.014, 0.17, 0.014, '#5c4630');
    const axle = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 10).rotateZ(Math.PI / 2);
    l.shape(axle, '#7a5634', cx, cz, 0.2);
    l.beam(
      [cx + 0.075 / l.spanX, 0.2, cz],
      [cx + 0.09 / l.spanX, 0.18, cz + 0.02 / l.spanZ],
      0.005,
      '#3a3530',
    );
    l.beam([cx, 0.2, cz], [cx, 0.14, cz], 0.002, '#3a3530');
    bucket(l, cx, cz, 0.12);
    shingleGable(l, cx, cz, 'x', 0.18, 0.12, 0.28, 0.06, terracotta);
    // Stepping stones, a trough, buckets and jugs, villagers drawing water.
    for (const [dx, dz] of [
      [0, 0.12],
      [0, 0.17],
      [0.12, 0],
      [-0.12, 0],
      [0, -0.12],
    ] as const)
      wbox(l, ...off(l, cx, cz, dx, dz), 0.034, 0.03, 0.008, 0.026, '#c4beae', rand());
    wbox(l, 0.76, 0.66, 0.034, 0.12, 0.026, 0.03, '#a49c8c');
    wbox(l, 0.76, 0.66, 0.052, 0.11, 0.004, 0.02, '#4f93b0');
    for (const [x, z] of [
      [0.34, 0.66],
      [0.38, 0.7],
      [0.66, 0.36],
    ] as const)
      bucket(l, x, z);
    for (let i = 0; i < 3; i++)
      wround(l, 0.26 + i * 0.03, 0.36, 0.008, 0.012, 0.03, 0.024, '#b87b58', 8);
    workers(l, [
      [0.42, 0.66, '#c84a3a', '#e9e0c8'],
      [0.62, 0.58, '#3a5a7a', '#8a6a3a'],
    ]);
    bench(l, 0.28, 0.82, 0);
    lanternPost(l, 0.7, 0.84, 0.13);
    for (const [x, z] of [
      [0.1, 0.1],
      [0.9, 0.1],
      [0.1, 0.9],
      [0.9, 0.9],
      [0.9, 0.5],
    ] as const)
      shrub(l, x, z, 0.04);
    for (let i = 0; i < 6; i++)
      shrub(l, 0.08 + rand() * 0.84, 0.94, 0.012, ['#d84a6a', '#e8c84a', '#8a6ab8'][i % 3]);
  },

  cistern_well(l) {
    plaza(l, 'cistern_well', 0.12, 0.12, 0.88, 0.88, '#c4bca8');
    // Octagonal limestone cistern pavilion: columns, slate dome, brass spouts into basins.
    const cx = 0.5;
    const cz = 0.48;
    wround(l, cx, cz, 0.11, 0.115, 0.03, 0.05, limestone, 8);
    wround(l, cx, cz, 0.1, 0.1, 0.08, 0.004, '#2f5d78', 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      wround(
        l,
        ...off(l, cx, cz, Math.cos(a) * 0.1, Math.sin(a) * 0.1),
        0.008,
        0.009,
        0.08,
        0.16,
        marble,
        8,
      );
    }
    wround(l, cx, cz, 0.115, 0.115, 0.24, 0.02, limestone, 8);
    const dome = new THREE.SphereGeometry(0.11, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateY(
      Math.PI / 8,
    );
    l.shape(dome, slate, cx, cz, 0.26);
    wround(l, cx, cz, 0.003, 0.012, 0.36, 0.06, brass, 8);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const [sx, sz] = off(l, cx, cz, Math.cos(a) * 0.13, Math.sin(a) * 0.13);
      l.beam(
        [cx + (Math.cos(a) * 0.1) / l.spanX, 0.07, cz + (Math.sin(a) * 0.1) / l.spanZ],
        [sx, 0.065, sz],
        0.006,
        brass,
      );
      l.beam([sx, 0.065, sz], [sx, 0.04, sz], 0.004, '#9ec7d4');
      const [bx, bz] = off(l, cx, cz, Math.cos(a) * 0.16, Math.sin(a) * 0.16);
      wround(l, bx, bz, 0.03, 0.032, 0.03, 0.016, limestone, 12);
      wround(l, bx, bz, 0.026, 0.026, 0.044, 0.002, '#4f93b0', 12);
    }
    for (const [x, z, ry] of [
      [0.2, 0.84, 0],
      [0.8, 0.84, 0],
      [0.16, 0.2, Math.PI / 2],
    ] as const)
      bench(l, x, z, ry);
    for (const [x, z] of [
      [0.16, 0.5],
      [0.84, 0.5],
    ] as const)
      lanternPost(l, x, z, 0.16);
    workers(l, [
      [0.32, 0.7, '#c84a3a', '#e9e0c8'],
      [0.7, 0.7, '#3a5a7a', '#8a6a3a'],
      [0.66, 0.24, '#5a6a4a', '#3a3a3c'],
    ]);
    for (const [x, z] of [
      [0.06, 0.06],
      [0.94, 0.06],
      [0.06, 0.94],
      [0.94, 0.94],
    ] as const)
      shrub(l, x, z, 0.04);
  },

  pump_house(l) {
    plaza(l, 'pump_house', 0.06, 0.06, 0.94, 0.94, '#a8a292');
    // One-and-a-half storey brick pump house with a flywheel, stack and copper mains.
    const hx = 0.46;
    const hz = 0.4;
    brickBody(l, hx, hz, 0.36, 0.26, 0.03, 0.2, '#a24a35');
    hallFacade(l, hx, hz, 0.36, 0.26, 0.03, 0.2, '#a24a35', {
      bay: 0.09,
      trim: limestone,
      skip: [['+z', 1]],
    });
    door(l, hx, hz, 0.36, 0.26, '+z', -0.045, 0.03, 0.06, 0.11, timberDark, true);
    shingleGable(l, hx, hz, 'x', 0.36, 0.26, 0.23, 0.11, slate, '#a24a35');
    stack(l, ...off(l, hx, hz, 0.14, -0.08), 0.4, 0.02, '#9c5640', 3);
    flywheel(l, ...off(l, hx, hz, 0.24, 0.04), 0.03, 0.08, Math.PI / 2);
    wbox(l, ...off(l, hx, hz, 0.24, 0.04), 0.03, 0.06, 0.03, 0.04, '#2f3234');
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const [ex, ez] = off(l, hx, hz, Math.cos(a) * 0.34, Math.sin(a) * 0.3);
      pipe(l, [hx, 0.05, hz], [ex, 0.05, ez], 0.01, '#b8693a');
      wbox(l, ex, ez, 0.03, 0.03, 0.04, 0.03, '#8a8274');
      wround(l, ex, ez, 0.006, 0.006, 0.07, 0.02, brass, 8);
    }
    for (let i = 0; i < 4; i++) barrel(l, 0.84 + (i % 2) * 0.04, 0.82 + Math.floor(i / 2) * 0.04);
    workers(l, [
      [0.28, 0.7, '#5a6a7a', '#3a3a3c'],
      [0.66, 0.68, '#6a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.14, 0.62, 0.16);
    signboard(l, 0.5, 0.92, 0.08, 0.1, '#2f4a6a');
    for (const [x, z] of [
      [0.06, 0.94],
      [0.94, 0.06],
    ] as const)
      shrub(l, x, z, 0.04);
  },

  water_tower(l) {
    plaza(l, 'water_tower', 0.08, 0.08, 0.92, 0.92, '#a8a292');
    // Riveted tank on a braced steel frame, catwalk, ladder and a brick valve house.
    const cx = 0.48;
    const cz = 0.44;
    const top = 0.7;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const) {
      l.beam(
        [cx + (a * 0.12) / l.spanX, 0.03, cz + (b * 0.12) / l.spanZ],
        [cx + (a * 0.09) / l.spanX, top, cz + (b * 0.09) / l.spanZ],
        0.014,
        '#4a5257',
      );
      wbox(l, ...off(l, cx, cz, a * 0.12, b * 0.12), 0.03, 0.04, 0.02, 0.04, '#8a8274');
    }
    for (const y of [0.18, 0.34, 0.5]) {
      const r = 0.12 - ((y - 0.03) / (top - 0.03)) * 0.03;
      for (const [a, b, c, d] of [
        [-1, -1, 1, -1],
        [1, -1, 1, 1],
        [1, 1, -1, 1],
        [-1, 1, -1, -1],
      ] as const) {
        l.beam(
          [cx + (a * r) / l.spanX, y, cz + (b * r) / l.spanZ],
          [cx + (c * r) / l.spanX, y, cz + (d * r) / l.spanZ],
          0.006,
          '#4a5257',
        );
        l.beam(
          [cx + (a * r) / l.spanX, y, cz + (b * r) / l.spanZ],
          [cx + (c * (r - 0.02)) / l.spanX, y + 0.16, cz + (d * (r - 0.02)) / l.spanZ],
          0.004,
          '#5a6268',
        );
      }
    }
    wround(l, cx, cz, 0.003, 0.016, 0.03, top, '#5a6268', 8);
    catwalk(l, cx, cz, 0.12, top);
    for (let i = 0; i < 5; i++)
      wround(l, cx, cz, 0.122, 0.122, top + i * 0.034, 0.034, tone('#7e868c', 0.05), 20);
    for (let i = 1; i < 5; i++)
      wround(l, cx, cz, 0.124, 0.124, top + i * 0.034, 0.003, '#4a5257', 20);
    l.shape(new THREE.ConeGeometry(0.13, 0.06, 20), '#4a5257', cx, cz, top + 0.2);
    wround(l, cx, cz, 0.003, 0.006, top + 0.23, 0.04, '#2c3134', 6);
    ladder(l, cx, cz, 0.04, top + 0.17, 0.125);
    faceBox(l, cx, cz, 0.25, 0.25, '+z', 0, 0.002, top + 0.06, 0.12, 0.04, 0.004, '#efe7d6');
    // Valve house, pipes, benches and the waterworks sign.
    brickBody(l, 0.82, 0.78, 0.14, 0.12, 0.03, 0.09, '#9a4a35');
    window4(l, 0.82, 0.78, 0.14, 0.12, '+z', 0, 0.05, 0.026, { frame: limestone });
    door(l, 0.82, 0.78, 0.14, 0.12, '-x', 0, 0.03, 0.04, 0.07, timberDark);
    shingleGable(l, 0.82, 0.78, 'x', 0.14, 0.12, 0.12, 0.05, slate, '#9a4a35');
    pipe(l, [cx, 0.05, cz], [0.82, 0.05, 0.78], 0.01, '#b8693a');
    bench(l, 0.2, 0.84, 0);
    workers(l, [
      [0.3, 0.7, '#5a6a7a', '#3a3a3c'],
      [0.64, 0.74, '#6a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.12, 0.3, 0.16);
    signboard(l, 0.46, 0.92, 0.08, 0.1, '#2f4a6a');
    for (const [x, z] of [
      [0.92, 0.1],
      [0.08, 0.92],
    ] as const)
      shrub(l, x, z, 0.04);
  },

  aqueduct_reservoir(l) {
    plaza(l, 'aqueduct_reservoir', 0.04, 0.04, 0.96, 0.96, '#cfc8b8');
    // Marble aqueduct arcade across the back carrying water to a copper pressure tower.
    for (let i = 0; i < 5; i++) {
      const x = 0.1 + i * 0.2;
      wbox(l, x, 0.14, 0.03, 0.04, 0.3, 0.06, marble);
      wbox(l, x, 0.14, 0.03, 0.05, 0.02, 0.07, limestone);
    }
    for (let i = 0; i < 4; i++) {
      const arch = new THREE.CylinderGeometry(
        0.06,
        0.06,
        0.06,
        12,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ).rotateX(Math.PI / 2);
      l.shape(arch, marble, 0.2 + i * 0.2, 0.14, 0.27);
    }
    wbox(l, 0.5, 0.14, 0.33, 0.77, 0.04, 0.07, marble);
    wbox(l, 0.5, 0.14, 0.37, 0.75, 0.004, 0.04, '#4f93b0');
    // The pressure tower: marble drum, columns, a copper dome and a brass lantern.
    const cx = 0.5;
    const cz = 0.52;
    wround(l, cx, cz, 0.12, 0.13, 0.03, 0.06, limestone, 16);
    wround(l, cx, cz, 0.095, 0.1, 0.09, 0.74, marble, 16);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wround(
        l,
        ...off(l, cx, cz, Math.cos(a) * 0.105, Math.sin(a) * 0.105),
        0.007,
        0.008,
        0.09,
        0.74,
        limestone,
        6,
      );
    }
    for (const y of [0.3, 0.56, 0.82]) wround(l, cx, cz, 0.112, 0.112, y, 0.02, limestone, 16);
    for (let k = 0; k < 3; k++)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        wbox(
          l,
          ...off(l, cx, cz, Math.cos(a) * 0.1, Math.sin(a) * 0.1),
          0.15 + k * 0.26,
          0.026,
          0.06,
          0.004,
          pane,
          -a + Math.PI / 2,
          0,
          1,
        );
      }
    const dome = new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(dome, copper, cx, cz, 0.85);
    for (let i = 0; i < 8; i++) {
      const rib = new THREE.TorusGeometry(0.101, 0.003, 4, 12, Math.PI / 2).rotateY(
        (i / 8) * Math.PI * 2,
      );
      l.shape(rib, brass, cx, cz, 0.85);
    }
    wround(l, cx, cz, 0.018, 0.024, 0.95, 0.04, brass, 10);
    l.shape(new THREE.SphereGeometry(0.014, 10, 8), '#ffd27a', cx, cz, 1.005, 1);
    pipe(l, [0.5, 0.33, 0.14], [cx, 0.6, cz], 0.012, '#b8693a');
    // Four fountains around the tower, benches, lamps and flower beds.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      fountain(l, ...off(l, cx, cz, Math.cos(a) * 0.24, Math.sin(a) * 0.22), 0.04);
    }
    for (const [x, z] of [
      [0.12, 0.62],
      [0.88, 0.62],
      [0.3, 0.92],
      [0.7, 0.92],
    ] as const)
      lanternPost(l, x, z, 0.17);
    bench(l, 0.5, 0.9, 0);
    workers(l, [
      [0.36, 0.84, '#c84a3a', '#e9e0c8'],
      [0.64, 0.82, '#3a5a7a', '#2c2c2e'],
      [0.82, 0.36, '#5a6a4a', '#8a6a3a'],
    ]);
    for (let i = 0; i < 10; i++)
      shrub(l, 0.06 + i * 0.098, 0.97, 0.016, ['#d84a6a', '#e8c84a', '#8a6ab8'][i % 3]);
  },

  // -----------------------------------------------------------------------------------------
  // Lighthouses (coastal, 1x1)
  // -----------------------------------------------------------------------------------------
  lighthouse(l) {
    shore(l, 'lighthouse');
    // Red-and-white striped tower on the crag, a keeper's cottage, a dinghy on the slip.
    const cx = 0.42;
    const cz = 0.46;
    const h = 0.8;
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t0 = i / bands;
      const t1 = (i + 1) / bands;
      l.shape(
        new THREE.CylinderGeometry(0.06 - 0.022 * t1, 0.06 - 0.022 * t0, h / bands, 16),
        i % 2 ? '#c8392c' : '#f2efe6',
        cx,
        cz,
        0.06 + (t0 + t1) * 0.5 * h,
      );
    }
    wround(l, cx, cz, 0.08, 0.085, 0.03, 0.03, '#8a8274', 16);
    for (const y of [0.25, 0.5, 0.7]) {
      const r = 0.06 - 0.022 * ((y - 0.06) / h);
      faceBox(l, cx, cz, r * 2, r * 2, '+z', 0, -0.003, y, 0.012, 0.022, 0.004, pane, 1);
    }
    door(l, cx, cz, 0.12, 0.12, '+z', 0, 0.06, 0.03, 0.06, timberDark);
    lanternRoom(l, cx, cz, 0.06 + h, 0.034, '#c8392c');
    const kx = 0.76;
    const kz = 0.7;
    stoneBody(l, kx, kz, 0.16, 0.12, 0.03, 0.09, '#e9e4d6');
    window4(l, kx, kz, 0.16, 0.12, '+z', 0, 0.05, 0.026, { shutters: '#2f4a6a' });
    door(l, kx, kz, 0.16, 0.12, '-x', 0, 0.03, 0.04, 0.07, '#2f4a6a');
    shingleGable(l, kx, kz, 'x', 0.16, 0.12, 0.12, 0.06, '#c8392c', '#e9e4d6');
    smoke(l, ...off(l, kx, kz, 0.06, 0), 0.2, 2);
    boat(l, 0.2, 0.1, 0, 0.12, '#2f4a6a', { y: 0.03 });
    for (let i = 0; i < 3; i++) barrel(l, 0.18 + i * 0.03, 0.82);
    workers(l, [[0.6, 0.62, '#2f4a6a', '#2c2c2e']]);
    lanternPost(l, 0.5, 0.86, 0.13);
    shrub(l, 0.92, 0.94, 0.03);
  },

  harbor_beacon_tower(l) {
    shore(l, 'harbor_beacon_tower');
    // Octagonal granite beacon on a brick base, a gallery, and a two-storey keeper's house.
    const cx = 0.38;
    const cz = 0.48;
    const h = 0.9;
    wround(l, cx, cz, 0.1, 0.105, 0.03, 0.1, '#a24a35', 8);
    const rings = 14;
    for (let i = 0; i < rings; i++) {
      const t0 = i / rings;
      const t1 = (i + 1) / rings;
      l.shape(
        new THREE.CylinderGeometry(0.075 - 0.025 * t1, 0.075 - 0.025 * t0, h / rings, 8),
        tone('#b0aa9c', 0.06),
        cx,
        cz,
        0.13 + (t0 + t1) * 0.5 * h,
      );
    }
    for (const y of [0.4, 0.75])
      wround(
        l,
        cx,
        cz,
        0.076 - 0.025 * ((y - 0.13) / h),
        0.076 - 0.025 * ((y - 0.13) / h),
        y,
        0.012,
        '#8a8274',
        8,
      );
    for (const y of [0.25, 0.5, 0.75, 0.95]) {
      const r = 0.075 - 0.025 * ((y - 0.13) / h);
      faceBox(l, cx, cz, r * 2, r * 2, '+z', 0, -0.004, y, 0.016, 0.03, 0.004, pane, 1);
    }
    door(l, cx, cz, 0.2, 0.2, '+z', 0, 0.03, 0.04, 0.08, timberDark);
    lanternRoom(l, cx, cz, 0.13 + h, 0.04, '#3a4a55');
    const kx = 0.76;
    const kz = 0.68;
    stoneBody(l, kx, kz, 0.18, 0.14, 0.03, 0.15, '#b0aa9c');
    window4(l, kx, kz, 0.18, 0.14, '+z', -0.04, 0.06, 0.026, { frame: '#e9e4d6' });
    window4(l, kx, kz, 0.18, 0.14, '+z', 0.04, 0.12, 0.026, { frame: '#e9e4d6' });
    door(l, kx, kz, 0.18, 0.14, '-x', 0, 0.03, 0.04, 0.08, '#2f4a6a');
    shingleGable(l, kx, kz, 'x', 0.18, 0.14, 0.18, 0.07, slate, '#b0aa9c');
    smoke(l, ...off(l, kx, kz, 0.07, 0), 0.28, 2);
    wround(l, 0.86, 0.3, 0.003, 0.005, 0.03, 0.3, '#efe7d6', 6);
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        ...off(l, 0.86, 0.3, 0.02, 0),
        0.24 + i * 0.024,
        0.03,
        0.018,
        0.003,
        ['#c8392c', '#e8c84a', '#2f4a6a'][i]!,
      );
    boat(l, 0.62, 0.1, 0.2, 0.14, '#c8392c', { sail: true, y: 0.03 });
    for (let i = 0; i < 4; i++) barrel(l, 0.12 + (i % 2) * 0.03, 0.82 + Math.floor(i / 2) * 0.03);
    workers(l, [
      [0.58, 0.6, '#2f4a6a', '#2c2c2e'],
      [0.26, 0.74, '#5a6a4a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.56, 0.88, 0.14);
    shrub(l, 0.94, 0.94, 0.03);
  },

  imperial_pharos(l) {
    shore(l, 'imperial_pharos');
    // Tiered marble pharos: square base, octagonal shaft, round lantern stage, gilded crown.
    const cx = 0.5;
    const cz = 0.52;
    stoneBody(l, cx, cz, 0.3, 0.3, 0.03, 0.18, marble);
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      for (const t of [-0.08, 0.08])
        faceBox(l, cx, cz, 0.3, 0.3, f, t, 0.003, 0.07, 0.03, 0.07, 0.004, pane, 1);
    wbox(l, cx, cz, 0.21, 0.32, 0.02, 0.32, brass);
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const) {
      l.shape(
        new THREE.ConeGeometry(0.02, 0.06, 4),
        brass,
        ...off(l, cx, cz, a * 0.14, b * 0.14),
        0.26,
      );
      wround(l, ...off(l, cx, cz, a * 0.14, b * 0.14), 0.012, 0.014, 0.21, 0.02, marble, 8);
    }
    const tiers: [number, number, number][] = [
      [0.09, 0.23, 0.42],
      [0.065, 0.65, 0.34],
    ];
    for (const [r, y, h] of tiers) {
      wround(l, cx, cz, r * 0.86, r, y, h, marble, 8);
      wround(l, cx, cz, r + 0.006, r + 0.006, y + h - 0.02, 0.02, brass, 8);
      for (let i = 0; i < 3; i++)
        faceBox(
          l,
          cx,
          cz,
          r * 2,
          r * 2,
          '+z',
          0,
          -0.006,
          y + 0.06 + i * (h / 3.2),
          0.018,
          0.04,
          0.004,
          pane,
          1,
        );
    }
    catwalk(l, cx, cz, 0.06, 0.65);
    lanternRoom(l, cx, cz, 0.99, 0.05, '#d6a83a');
    l.shape(new THREE.TorusGeometry(0.04, 0.006, 6, 12).rotateX(Math.PI / 2), brass, cx, cz, 1.13);
    wround(l, cx, cz, 0.003, 0.01, 1.12, 0.08, brass, 6);
    // Grand steps down to a quay, statues, lamps and a moored barge.
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        cx,
        cz + (0.17 + i * 0.03) / l.spanZ,
        0.03,
        0.2 - i * 0.02,
        0.03 - i * 0.008,
        0.03,
        limestone,
      );
    for (const s of [-1, 1]) {
      const [sx, sz] = off(l, cx, cz, s * 0.26, 0.2);
      wbox(l, sx, sz, 0.03, 0.04, 0.04, 0.04, limestone);
      wround(l, sx, sz, 0.008, 0.012, 0.07, 0.05, brass, 8);
      l.shape(new THREE.SphereGeometry(0.01, 8, 6), brass, sx, sz, 0.13);
    }
    for (const [x, z] of [
      [0.14, 0.86],
      [0.86, 0.86],
      [0.14, 0.42],
      [0.86, 0.42],
    ] as const)
      lanternPost(l, x, z, 0.17);
    boat(l, 0.24, 0.1, 0, 0.2, '#d6a83a', { cabin: '#e9e4d6', y: 0.03 });
    workers(l, [
      [0.36, 0.86, '#2f4a6a', '#2c2c2e'],
      [0.64, 0.88, '#6a3a3a', '#2c2c2e'],
    ]);
    for (let i = 0; i < 8; i++)
      shrub(l, 0.06 + i * 0.125, 0.97, 0.016, ['#d84a6a', '#e8c84a'][i % 2]);
  },
};
