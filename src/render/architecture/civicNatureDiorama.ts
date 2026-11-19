import * as THREE from 'three';
import {
  barrel,
  boardBody,
  chimney,
  crate,
  cypress,
  door,
  horse,
  lanternPost,
  off,
  person,
  rand,
  reseed,
  sheep,
  shingleGable,
  shrub,
  stoneBody,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import { campfire, coneRoof, dog, glassHouse, logBody, smoke, waterSheet } from './dioramaProps';
import { cyl, disc, logPile, p3, stump, wheelbarrow } from './forestryTransitDiorama';
import { site } from './industryDiorama';
import { brickBody, windows4 } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2C, drawn as dioramas on lots scaled by 2 (see `zoomed` in architectureModels.ts):
//   school -> grammar_school -> academy                      (3x3)
//   flower_garden -> botanical_garden -> victorian_conservatory (3x3)
//   log_cabin, yurt, trading_post, salt_pan                  (2x2)

const timber = '#5c3f27';
const slate = '#4d5a66';
const limestone = '#dcd5c2';
const iron = '#4a5a5a';
const flowers = ['#d6455a', '#f0c24a', '#e8e4d8', '#c25aa8', '#f08a3a'] as const;

/** Round-crowned broadleaf tree. */
function oak(l: Lot, x: number, z: number, h: number): void {
  wround(l, x, z, 0.012, 0.02, 0.03, h * 0.45, '#6b4e36', 8);
  for (const [dx, dz, y, r] of [
    [0, 0, 0.5, 0.075],
    [0.03, 0.02, 0.62, 0.06],
    [-0.03, -0.02, 0.58, 0.06],
  ] as const)
    l.shape(
      new THREE.IcosahedronGeometry(r * (h / 0.3), 0),
      tone('#4f8a3a', 0.16),
      ...off(l, x, z, dx, dz),
      0.03 + h * y + 0.04,
    );
}

/** Flowering bush: a green mound dotted with blooms. */
function roseBush(l: Lot, x: number, z: number, y = 0.036, bloom?: string): void {
  l.shape(new THREE.IcosahedronGeometry(0.028, 0), tone('#3f7a3a', 0.16), x, z, y + 0.018);
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.016 + rand() * 0.012;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * r, Math.sin(a) * r),
      y + 0.026 + rand() * 0.02,
      0.01,
      0.01,
      0.01,
      bloom ?? flowers[Math.floor(rand() * flowers.length)]!,
    );
  }
}

/** Low clipped hedge run (world-unit length along x, then turned by ry). */
function hedge(
  l: Lot,
  x: number,
  z: number,
  len: number,
  ry: number,
  h = 0.07,
  y = 0.036,
  color = '#3f7a3a',
): void {
  wbox(l, x, z, y, len, h, 0.05, tone(color, 0.12), ry);
  wbox(l, x, z, y + h, len * 0.96, 0.01, 0.038, shadeUp(color), ry);
}

function shadeUp(color: string): string {
  return tone(color, 0.05);
}

/** Park bench facing +z. */
function bench(l: Lot, x: number, z: number, ry = 0, color = '#6b4a2a'): void {
  wbox(l, x, z, 0.054, 0.1, 0.008, 0.034, color, ry);
  wbox(l, ...off(l, x, z, 0, -0.016), 0.07, 0.1, 0.03, 0.006, color, ry);
  for (const t of [-0.04, 0.04])
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t),
      0.036,
      0.008,
      0.018,
      0.028,
      '#2c2a28',
      ry,
    );
}

/** Swing set: A-frame posts, a top bar and two swinging seats. */
function swings(l: Lot, x: number, z: number): void {
  for (const e of [-1, 1])
    for (const f of [-1, 1])
      l.beam(
        p3(off(l, x, z, e * 0.1, f * 0.03), 0.036),
        [x + (e * 0.09) / l.spanX, 0.15, z],
        0.007,
        timber,
      );
  wbox(l, x, z, 0.15, 0.2, 0.008, 0.008, timber);
  for (const t of [-0.04, 0.04]) {
    l.beam([x + t / l.spanX, 0.15, z], [x + t / l.spanX, 0.07, z], 0.002, '#4a4f54');
    wbox(l, ...off(l, x, z, t, 0), 0.062, 0.032, 0.008, 0.016, '#b0463a');
  }
}

/** Wooden picket fence run. */
function picket(l: Lot, x0: number, x1: number, z: number, n: number, color = '#e3dccb'): void {
  for (let i = 0; i < n; i++)
    wbox(l, x0 + ((x1 - x0) * i) / (n - 1), z, 0.036, 0.008, 0.04, 0.008, color);
  wbox(l, (x0 + x1) / 2, z, 0.056, (x1 - x0) * l.spanX, 0.006, 0.006, color);
}

/** Pale Greek column. */
function column(l: Lot, x: number, z: number, y: number, h: number, r = 0.015): void {
  wround(l, x, z, r * 1.25, r * 1.35, y, 0.012, '#c9c2ae', 12);
  wround(l, x, z, r, r * 1.1, y + 0.012, h - 0.024, '#ece7da', 12);
  wround(l, x, z, r * 1.3, r * 1.1, y + h - 0.012, 0.012, '#d9d2bf', 12);
}

/** Palm tree with a leaning trunk and fan of fronds. */
function palm(l: Lot, x: number, z: number, h: number): void {
  const tip: [number, number, number] = [x + 0.012 / l.spanX, 0.03 + h, z + 0.008 / l.spanZ];
  l.beam([x, 0.03, z], tip, 0.014, '#8a6a46');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    l.beam(
      tip,
      [
        tip[0] + (Math.cos(a) * 0.075) / l.spanX,
        tip[1] - 0.035,
        tip[2] + (Math.sin(a) * 0.075) / l.spanZ,
      ],
      0.008,
      tone('#2f7a3a', 0.2),
    );
    l.shape(
      new THREE.IcosahedronGeometry(0.014, 0),
      tone('#2f7a3a', 0.2),
      tip[0] + (Math.cos(a) * 0.07) / l.spanX,
      tip[2] + (Math.sin(a) * 0.07) / l.spanZ,
      tip[1] - 0.04,
    );
  }
}

/** Statue on a stone plinth. */
function statue(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.036, 0.04, 0.03, 0.04, '#cfc8b6');
  wbox(l, x, z, 0.066, 0.016, 0.044, 0.012, '#f1ece2');
  l.shape(new THREE.SphereGeometry(0.009, 8, 6), '#f1ece2', x, z, 0.116);
}

/** Barrel-vaulted brick or iron-framed glazed roof, simplified to ridge bars and glass. */
function glassDome(l: Lot, x: number, z: number, rx: number, y: number, h: number): void {
  l.dome(x, z, rx, rx * (l.spanX / l.spanZ), y, h, '#bfe0e6');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    for (const sgn of [1, -1]) {
      const px = Math.cos(a) * rx * sgn;
      const pz = Math.sin(a) * rx * (l.spanX / l.spanZ) * sgn;
      l.beam([x + px, y, z + pz], [x, y + h, z], 0.007, '#f1ece2');
    }
  }
  for (let k = 1; k < 4; k++) {
    const t = k / 4;
    const r = Math.sqrt(1 - t * t);
    wround(l, x, z, rx * l.spanX * r, rx * l.spanX * r, y + h * t, 0.005, '#f1ece2', 18);
  }
  l.shape(new THREE.SphereGeometry(0.012, 8, 6), '#d7af4b', x, z, y + h + 0.01);
}

// ---------------------------------------------------------------------------------------------

export const civicNatureDiorama: Recipes = {
  // -------------------------------------------------------------------------------------------
  // Education: school -> grammar_school -> academy
  // -------------------------------------------------------------------------------------------
  school(l) {
    site(l, 'school', '#b59d74', [0.18, 0.5, 0.82, 0.95]);
    const bx = 0.42;
    const bz = 0.32;
    boardBody(l, bx, bz, 0.5, 0.34, 0.036, 0.16, '#9a8a6a');
    door(l, bx, bz, 0.5, 0.34, '+z', 0, 0.036, 0.055, 0.09, timber);
    windows4(l, bx, bz, 0.5, 0.34, 0.1, 0.05);
    shingleGable(l, bx, bz, 'x', 0.5, 0.34, 0.196, 0.1, slate, '#9a8a6a');
    // Belfry with a bell, on the ridge.
    wbox(l, bx, bz, 0.28, 0.09, 0.012, 0.09, '#7a6a4a');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, bx, bz, a * 0.036, b * 0.036), 0.292, 0.01, 0.06, 0.01, '#7a6a4a');
    wround(l, bx, bz, 0.012, 0.018, 0.3, 0.024, '#d7af4b', 10);
    coneRoof(l, bx, bz, 0.352, 0.06, 0.05, slate);
    chimney(l, ...off(l, bx, bz, 0.18, -0.08), 0.22, 0.1, '#8f8a80');
    smoke(l, ...off(l, bx, bz, 0.18, -0.08), 0.33, 3);
    // Woodpile for the winter stove, swings, a picnic table and the schoolchildren.
    logPile(l, 0.86, 0.3, Math.PI / 2, 3, 0.12);
    swings(l, 0.78, 0.68);
    wbox(l, 0.3, 0.74, 0.07, 0.14, 0.008, 0.05, '#8a6a48');
    for (const z of [-0.04, 0.04])
      wbox(l, ...off(l, 0.3, 0.74, 0, z), 0.054, 0.14, 0.006, 0.018, '#8a6a48');
    person(l, 0.48, 0.62, 0.036, '#b0463a', '#d9c38a');
    person(l, 0.54, 0.66, 0.036, '#5a7a9a', '#8a5a3a');
    person(l, 0.68, 0.78, 0.036, '#c9a83a', '#3a3a3c');
    person(l, 0.2, 0.82, 0.036, '#6a8a5a', '#d9c38a');
    // Flagpole, oak, fence and lantern.
    wround(l, 0.12, 0.55, 0.004, 0.006, 0.036, 0.3, '#e8e4d8', 6);
    wbox(l, ...off(l, 0.12, 0.55, 0.03, 0), 0.31, 0.05, 0.003, 0.034, '#b0463a');
    oak(l, 0.09, 0.15, 0.3);
    picket(l, 0.05, 0.95, 0.95, 18);
    lanternPost(l, 0.6, 0.55, 0.14);
    shrub(l, 0.2, 0.52, 0.04, '#3f7a3a');
    shrub(l, 0.66, 0.52, 0.04, '#3f7a3a');
  },

  grammar_school(l) {
    site(l, 'grammar_school', '#a9a496', [0.05, 0.05, 0.95, 0.95]);
    const bx = 0.5;
    const bz = 0.3;
    brickBody(l, bx, bz, 0.9, 0.3, 0.036, 0.3, '#9c4a3a');
    windows4(l, bx, bz, 0.9, 0.3, 0.09, 0.05, { frame: '#e3d9bf' });
    windows4(l, bx, bz, 0.9, 0.3, 0.2, 0.05, { frame: '#e3d9bf' });
    for (let i = -1; i <= 1; i += 2)
      door(l, bx, bz, 0.9, 0.3, '+z', i * 0.1, 0.036, 0.06, 0.1, '#3a2f26', true);
    wbox(l, bx, bz, 0.332, 0.94, 0.012, 0.32, '#d9cfb4');
    shingleGable(l, bx, bz, 'x', 0.9, 0.3, 0.344, 0.1, slate, '#9c4a3a');
    // Clock tower with glowing faces and a slate spire.
    brickBody(l, bx, bz, 0.17, 0.17, 0.4, 0.14, '#8a3f30');
    for (const [dx, dz, w, d] of [
      [0, 0.088, 0.09, 0.006],
      [0, -0.088, 0.09, 0.006],
      [0.088, 0, 0.006, 0.09],
      [-0.088, 0, 0.006, 0.09],
    ] as const)
      wbox(l, ...off(l, bx, bz, dx, dz), 0.45, w, 0.07, d, '#fff2c4', 0, 0, 1);
    coneRoof(l, bx, bz, 0.54, 0.12, 0.13, slate);
    // Annex with its own roof.
    brickBody(l, 0.14, 0.32, 0.22, 0.2, 0.036, 0.13, '#8a4a3a');
    windows4(l, 0.14, 0.32, 0.22, 0.2, 0.09, 0.04);
    shingleGable(l, 0.14, 0.32, 'z', 0.2, 0.22, 0.166, 0.07, slate, '#8a4a3a');
    // Asphalt playground with a chalk hopscotch grid, see-saw and children.
    wbox(l, 0.62, 0.74, 0.034, 0.9, 0.006, 0.5, '#4d4f52');
    for (let i = 0; i < 6; i++) wbox(l, 0.4, 0.62 + i * 0.05, 0.04, 0.05, 0.003, 0.046, '#f1ece2');
    for (let i = 0; i < 6; i++) wbox(l, 0.4, 0.62 + i * 0.05, 0.043, 0.04, 0.003, 0.036, '#4d4f52');
    wbox(l, 0.74, 0.76, 0.05, 0.2, 0.008, 0.026, '#b0463a', 0.3);
    wbox(l, 0.74, 0.76, 0.036, 0.016, 0.02, 0.016, '#2c2a28');
    swings(l, 0.9, 0.56);
    for (const [x, z, c] of [
      [0.5, 0.7, '#5a7a9a'],
      [0.56, 0.78, '#b0463a'],
      [0.68, 0.7, '#c9a83a'],
      [0.8, 0.82, '#6a8a5a'],
      [0.3, 0.62, '#8a5a8a'],
    ] as const)
      person(l, x, z, 0.04, c, '#3a3a3c');
    oak(l, 0.07, 0.62, 0.32);
    oak(l, 0.94, 0.12, 0.3);
    picket(l, 0.05, 0.95, 0.97, 22, '#2c3236');
    for (const x of [0.28, 0.72]) lanternPost(l, x, 0.54, 0.16);
    shrub(l, 0.34, 0.5, 0.04);
    shrub(l, 0.66, 0.5, 0.04);
  },

  academy(l) {
    site(l, 'academy', '#bdb8aa', [0.05, 0.05, 0.95, 0.95]);
    const bx = 0.5;
    const bz = 0.3;
    stoneBody(l, bx, bz, 0.92, 0.34, 0.036, 0.3, limestone, 0.028);
    windows4(l, bx, bz, 0.92, 0.34, 0.12, 0.05, { frame: '#f1ece2' });
    wbox(l, bx, bz, 0.336, 0.96, 0.012, 0.36, '#c9c2ae');
    // Pillared portico with a pediment and steps.
    for (let i = 0; i < 6; i++)
      column(l, ...off(l, bx, bz, -0.26 + i * 0.104, 0.215), 0.036, 0.3, 0.016);
    wbox(l, ...off(l, bx, bz, 0, 0.215), 0.336, 0.62, 0.02, 0.1, '#d9d2bf');
    tinGable(l, ...off(l, bx, bz, 0, 0.215), 'x', 0.62, 0.1, 0.356, 0.06, '#cfc8b6', limestone);
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        ...off(l, bx, bz, 0, 0.29 + i * 0.016),
        0.036 + i * 0.01,
        0.62 - i * 0.04,
        0.01,
        0.02,
        '#e3dcc9',
      );
    door(l, bx, bz, 0.92, 0.34, '+z', 0, 0.036, 0.07, 0.12, '#4a3322');
    // Copper dome on a drum, with a lantern.
    wround(l, bx, bz, 0.13, 0.14, 0.348, 0.16, '#d4cdb9', 24);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, bx, bz, Math.cos(a) * 0.136, Math.sin(a) * 0.136),
        0.37,
        0.016,
        0.1,
        0.016,
        '#f1ece2',
        -a,
      );
    }
    l.dome(bx, bz, 0.1, 0.1, 0.508, 0.2, '#b8734a');
    wround(l, bx, bz, 0.012, 0.02, 0.7, 0.05, '#e8dfc7', 10);
    l.shape(new THREE.SphereGeometry(0.014, 8, 6), '#d7af4b', bx, bz, 0.77);
    // Observatory dome with a big telescope, library wing and glass greenhouse wing.
    wround(l, 0.14, 0.3, 0.07, 0.075, 0.336, 0.08, '#d4cdb9', 16);
    l.dome(0.14, 0.3, 0.05, 0.05, 0.416, 0.08, '#9a6a4a');
    l.beam([0.12, 0.45, 0.3], [0.22, 0.6, 0.3], 0.022, '#6a4f36');
    glassHouse(l, 0.84, 0.64, 0.036, 0.3, 0.1, 0.2, '#f1ece2', '#bfe0e6', 0.6, 0.06, true);
    stoneBody(l, 0.18, 0.68, 0.26, 0.2, 0.036, 0.14, '#cfc8b6', 0.026);
    windows4(l, 0.18, 0.68, 0.26, 0.2, 0.1, 0.04);
    tinGable(l, 0.18, 0.68, 'x', 0.26, 0.2, 0.176, 0.06, '#7a8a8a', '#cfc8b6');
    // Students, cypress rows and lanterns.
    for (const [x, z, c] of [
      [0.4, 0.62, '#2f3f5a'],
      [0.52, 0.7, '#6a2f3a'],
      [0.62, 0.62, '#2f3f5a'],
      [0.46, 0.8, '#c9a83a'],
    ] as const)
      person(l, x, z, 0.036, c, '#3a3a3c');
    for (const x of [0.08, 0.28, 0.72, 0.94]) cypress(l, x, 0.92, 0.2);
    for (const x of [0.34, 0.66]) lanternPost(l, x, 0.58, 0.17);
    bench(l, 0.5, 0.88);
  },

  // -------------------------------------------------------------------------------------------
  // Gardens: flower_garden -> botanical_garden -> victorian_conservatory
  // -------------------------------------------------------------------------------------------
  flower_garden(l) {
    reseed('flower_garden');
    l.base('#8ab35a', 0.034);
    // Gravel cross paths and four rose beds.
    wbox(l, 0.5, 0.5, 0.036, 1.3, 0.004, 0.2, '#d9cfb4');
    wbox(l, 0.5, 0.5, 0.036, 0.2, 0.004, 1.3, '#d9cfb4');
    for (const [cx, cz] of [
      [0.26, 0.26],
      [0.74, 0.26],
      [0.26, 0.74],
      [0.74, 0.74],
    ] as const) {
      wbox(l, cx, cz, 0.036, 0.4, 0.014, 0.4, '#6b4a30');
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 6; j++)
          roseBush(l, ...off(l, cx, cz, -0.15 + i * 0.06, -0.15 + j * 0.06), 0.05);
    }
    // Three-tier stone fountain.
    wround(l, 0.5, 0.5, 0.11, 0.115, 0.036, 0.034, '#bfb8a8', 20);
    wround(l, 0.5, 0.5, 0.098, 0.098, 0.066, 0.006, '#6fb3c8', 20);
    wround(l, 0.5, 0.5, 0.02, 0.026, 0.07, 0.07, '#cfc8b6', 10);
    wround(l, 0.5, 0.5, 0.06, 0.04, 0.136, 0.016, '#bfb8a8', 16);
    wround(l, 0.5, 0.5, 0.052, 0.052, 0.15, 0.004, '#6fb3c8', 16);
    wround(l, 0.5, 0.5, 0.01, 0.014, 0.15, 0.05, '#cfc8b6', 8);
    wround(l, 0.5, 0.5, 0.03, 0.02, 0.196, 0.01, '#bfb8a8', 12);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.5, 0.5, Math.cos(a) * 0.04, Math.sin(a) * 0.04),
        0.17,
        0.004,
        0.02,
        0.004,
        '#bfe6f0',
        a,
      );
    }
    // Rose arbors over the paths, benches and lanterns.
    for (const [x, z, ry] of [
      [0.5, 0.1, 0],
      [0.1, 0.5, Math.PI / 2],
    ] as const) {
      for (const s of [-1, 1]) {
        const [px, pz] = off(l, x, z, Math.cos(ry) * s * 0.08, -Math.sin(ry) * s * 0.08);
        wbox(l, px, pz, 0.036, 0.012, 0.2, 0.012, '#f1ece2');
        for (let k = 0; k < 4; k++) roseBush(l, px, pz, 0.08 + k * 0.045, '#d6455a');
      }
      wbox(l, x, z, 0.236, 0.17, 0.012, 0.012, '#f1ece2', ry);
      for (let k = 0; k < 7; k++)
        wbox(
          l,
          ...off(l, x, z, Math.cos(ry) * (-0.07 + k * 0.023), -Math.sin(ry) * (-0.07 + k * 0.023)),
          0.222,
          0.016,
          0.016,
          0.016,
          flowers[k % 5]!,
        );
    }
    bench(l, 0.5, 0.2, 0);
    bench(l, 0.5, 0.82, Math.PI);
    bench(l, 0.2, 0.5, -Math.PI / 2);
    bench(l, 0.8, 0.5, Math.PI / 2);
    for (const [x, z] of [
      [0.38, 0.38],
      [0.62, 0.38],
      [0.38, 0.62],
      [0.62, 0.62],
    ] as const)
      lanternPost(l, x, z, 0.15);
    hedge(l, 0.5, 0.97, 1.4, 0, 0.06);
    hedge(l, 0.5, 0.03, 1.4, 0, 0.06);
    hedge(l, 0.03, 0.5, 1.4, Math.PI / 2, 0.06);
    hedge(l, 0.97, 0.5, 1.4, Math.PI / 2, 0.06);
    person(l, 0.64, 0.54, 0.04, '#b0463a', '#d9c38a');
    person(l, 0.34, 0.46, 0.04, '#5a7a9a', '#3a3a3c');
  },

  botanical_garden(l) {
    reseed('botanical_garden');
    l.base('#8ab35a', 0.034);
    wbox(l, 0.5, 0.5, 0.036, 1.4, 0.004, 1.4, '#d9cfb4');
    // Hedge maze: '#' cells are clipped hedge walls, the centre stays open for the gazebo.
    const maze = [
      '###########',
      '#.....#...#',
      '#.###.#.#.#',
      '#.#.......#',
      '#.#.#...#.#',
      '#...#...#.#',
      '###.#...#.#',
      '#...#.###.#',
      '#.###.....#',
      '#.........#',
      '#####.#####',
    ];
    const cell = 0.105;
    for (let r = 0; r < maze.length; r++)
      for (let c = 0; c < maze[r]!.length; c++) {
        if (maze[r]![c] !== '#') continue;
        const x = 0.5 + ((c - 5) * cell) / l.spanX;
        const z = 0.5 + ((r - 5) * cell) / l.spanZ;
        wbox(l, x, z, 0.036, cell * 0.98, 0.07 + rand() * 0.01, cell * 0.98, tone('#3f7a3a', 0.13));
        wbox(l, x, z, 0.108, cell * 0.9, 0.008, cell * 0.9, tone('#4f8a3a', 0.1));
      }
    // Wrought-iron gazebo in the middle of the maze.
    const gx = 0.5;
    const gz = 0.5;
    wround(l, gx, gz, 0.1, 0.1, 0.036, 0.012, '#d9d2bf', 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wround(
        l,
        ...off(l, gx, gz, Math.cos(a) * 0.085, Math.sin(a) * 0.085),
        0.004,
        0.005,
        0.048,
        0.19,
        iron,
        6,
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = ((i + 1) / 8) * Math.PI * 2;
      l.beam(
        p3(off(l, gx, gz, Math.cos(a) * 0.085, Math.sin(a) * 0.085), 0.2),
        p3(off(l, gx, gz, Math.cos(b) * 0.085, Math.sin(b) * 0.085), 0.2),
        0.004,
        iron,
      );
    }
    l.dome(gx, gz, 0.075, 0.075, 0.238, 0.1, iron);
    wround(l, gx, gz, 0.003, 0.01, 0.336, 0.04, iron, 6);
    l.shape(new THREE.SphereGeometry(0.01, 8, 6), '#d7af4b', gx, gz, 0.38);
    bench(l, gx, gz + 0.02);
    // Topiary cones and balls at the four corners, flower borders and bonsai pots.
    for (const [x, z] of [
      [0.07, 0.07],
      [0.93, 0.07],
      [0.07, 0.93],
      [0.93, 0.93],
    ] as const) {
      wbox(l, x, z, 0.036, 0.07, 0.03, 0.07, '#b9b4a6');
      for (let k = 0; k < 3; k++)
        l.shape(
          new THREE.ConeGeometry(0.05 - k * 0.014, 0.07, 8),
          tone('#2f6b3a', 0.12),
          x,
          z,
          0.1 + k * 0.05,
        );
    }
    for (let i = 0; i < 6; i++) {
      const x = 0.22 + i * 0.112;
      for (const z of [0.05, 0.95]) {
        wbox(l, x, z, 0.036, 0.1, 0.02, 0.05, '#6b4a30');
        roseBush(l, x, z, 0.05);
      }
    }
    for (const [x, z] of [
      [0.22, 0.88],
      [0.78, 0.88],
    ] as const) {
      wbox(l, x, z, 0.036, 0.05, 0.05, 0.05, '#cfc8b6');
      wbox(l, x, z, 0.086, 0.036, 0.02, 0.036, '#8a5a3a');
      l.shape(new THREE.IcosahedronGeometry(0.022, 0), '#3f7a3a', x, z, 0.12);
    }
    person(l, 0.2, 0.2, 0.04, '#b0463a', '#d9c38a');
    person(l, 0.82, 0.78, 0.04, '#5a7a9a', '#3a3a3c');
    lanternPost(l, 0.14, 0.5, 0.15);
    lanternPost(l, 0.86, 0.5, 0.15);
  },

  victorian_conservatory(l) {
    reseed('victorian_conservatory');
    l.base('#8ab35a', 0.034);
    wbox(l, 0.5, 0.5, 0.036, 1.4, 0.004, 1.4, '#d9cfb4');
    // Central palm house: glass hall, ribbed glass dome and two domed wings.
    const cx = 0.5;
    const cz = 0.34;
    wbox(l, cx, cz, 0.036, 0.56, 0.02, 0.34, '#d9d2bf');
    glassHouse(l, cx, cz, 0.056, 0.52, 0.18, 0.3, '#f1ece2', '#bfe0e6', 0.7, 0.06, true);
    glassDome(l, cx, cz, 0.12, 0.236, 0.26);
    for (const sx of [-1, 1]) {
      const wx = cx + (sx * 0.4) / l.spanX;
      wbox(l, wx, cz, 0.036, 0.26, 0.02, 0.26, '#d9d2bf');
      glassHouse(l, wx, cz, 0.056, 0.22, 0.12, 0.22, '#f1ece2', '#bfe0e6', 0.7, 0.06, true);
      glassDome(l, wx, cz, 0.06, 0.176, 0.12);
    }
    for (let i = 0; i < 7; i++)
      wbox(l, ...off(l, cx, cz, -0.22 + i * 0.073, 0.152), 0.056, 0.012, 0.18, 0.012, '#f1ece2');
    // Palms leaning against the glass, a lily pond and white statues.
    for (const [x, z, h] of [
      [0.4, 0.3, 0.46],
      [0.5, 0.36, 0.52],
      [0.6, 0.32, 0.44],
      [0.12, 0.34, 0.3],
      [0.88, 0.34, 0.3],
    ] as const)
      palm(l, x, z, h);
    waterSheet(l, 0.5, 0.74, 0.7, 0.3, 0.048, '#4f93b0');
    for (let i = 0; i < 8; i++)
      wround(l, 0.25 + rand() * 0.5, 0.64 + rand() * 0.2, 0.014, 0.014, 0.052, 0.003, '#3f8a4a', 8);
    for (let i = 0; i < 5; i++)
      wbox(l, 0.3 + i * 0.1, 0.7 + (i % 2) * 0.08, 0.054, 0.01, 0.008, 0.01, '#f4c2d2');
    for (const x of [0.14, 0.86]) statue(l, x, 0.74);
    bench(l, 0.2, 0.9);
    bench(l, 0.8, 0.9);
    for (const [x, z] of [
      [0.22, 0.6],
      [0.78, 0.6],
      [0.5, 0.58],
    ] as const)
      lanternPost(l, x, z, 0.16);
    for (const [x, z, c] of [
      [0.34, 0.58, '#b0463a'],
      [0.62, 0.58, '#5a7a9a'],
      [0.5, 0.9, '#6a8a5a'],
    ] as const)
      person(l, x, z, 0.04, c, '#d9c38a');
    for (const x of [0.1, 0.3, 0.7, 0.9]) {
      wbox(l, x, 0.96, 0.036, 0.1, 0.02, 0.05, '#6b4a30');
      roseBush(l, x, 0.96, 0.05);
    }
    cypress(l, 0.06, 0.08, 0.26);
    cypress(l, 0.94, 0.08, 0.26);
  },

  // -------------------------------------------------------------------------------------------
  // Rustic living and trade (2x2 lots)
  // -------------------------------------------------------------------------------------------
  log_cabin(l) {
    site(l, 'log_cabin', '#8a7556', [0.1, 0.45, 0.9, 0.95]);
    const hx = 0.4;
    const hz = 0.32;
    logBody(l, hx, hz, 0.36, 0.26, 0.036, 0.13, '#8a6142');
    door(l, hx, hz, 0.36, 0.26, '+z', -0.08, 0.036, 0.05, 0.085, timber);
    windows4(l, hx, hz, 0.36, 0.26, 0.09, 0.045, { shutters: '#2f5a3a' });
    shingleGable(l, hx, hz, 'x', 0.36, 0.26, 0.166, 0.085, '#6a4f38', '#8a6142');
    // River-stone chimney with a plume.
    for (let r = 0; r < 9; r++)
      wbox(
        l,
        ...off(l, hx, hz, 0.19, -0.04),
        0.036 + r * 0.019,
        0.05 - r * 0.001,
        0.02,
        0.05,
        tone('#8f8a80', 0.22),
      );
    wbox(l, ...off(l, hx, hz, 0.19, -0.04), 0.207, 0.058, 0.01, 0.058, '#6a645c');
    smoke(l, ...off(l, hx, hz, 0.19, -0.04), 0.22, 4);
    // Porch, woodpile, stump with axe, campfire with log seats, fence and trees.
    wbox(l, ...off(l, hx, hz, -0.08, 0.17), 0.036, 0.16, 0.01, 0.08, '#7a5a3a');
    for (const s of [-1, 1])
      wround(l, ...off(l, hx, hz, -0.08 + s * 0.07, 0.205), 0.007, 0.007, 0.036, 0.1, '#6b4a2a', 6);
    logPile(l, 0.82, 0.3, Math.PI / 2, 3, 0.12);
    stump(l, 0.14, 0.72);
    campfire(l, 0.66, 0.68);
    for (const [x, z, ry] of [
      [0.58, 0.72, 0.3],
      [0.74, 0.66, -0.4],
    ] as const)
      cyl(l, x, z, 0.036, 0.014, 0.1, ry, '#8a6142', 7);
    person(l, 0.5, 0.66, 0.036, '#b0463a', '#3a5a3a');
    dog(l, 0.4, 0.78, 0.5);
    for (let i = 0; i < 9; i++)
      cyl(l, 0.08 + i * 0.1, 0.96, 0.036, 0.008, 0.1, 0, tone('#8a6142', 0.2), 6);
    cypress(l, 0.07, 0.1, 0.3);
    cypress(l, 0.93, 0.1, 0.28);
    cypress(l, 0.92, 0.55, 0.22);
    lanternPost(l, 0.3, 0.62, 0.13);
  },

  yurt(l) {
    site(l, 'yurt', '#9a9a5a', [0.1, 0.1, 0.92, 0.92]);
    const yx = 0.46;
    const yz = 0.4;
    // Felt wall drum with embroidered bands, a conical roof with ribs and a crown ring.
    wround(l, yx, yz, 0.17, 0.17, 0.036, 0.1, '#eee6d0', 24);
    for (const y of [0.056, 0.1]) wround(l, yx, yz, 0.172, 0.172, y, 0.012, '#b0463a', 24);
    wround(l, yx, yz, 0.173, 0.173, 0.078, 0.008, '#2f5f86', 24);
    l.shape(new THREE.ConeGeometry(0.2, 0.09, 24), '#e8e0c8', yx, yz, 0.181);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      l.beam(
        [yx + (Math.cos(a) * 0.19) / l.spanX, 0.138, yz + (Math.sin(a) * 0.19) / l.spanZ],
        [yx + (Math.cos(a) * 0.04) / l.spanX, 0.222, yz + (Math.sin(a) * 0.04) / l.spanZ],
        0.003,
        '#b9ad8c',
      );
    }
    wround(l, yx, yz, 0.045, 0.048, 0.216, 0.012, '#6b4a2a', 14);
    smoke(l, yx, yz, 0.232, 3);
    // Carved red door with a dark opening.
    const [dx, dz] = off(l, yx, yz, 0, 0.172);
    wbox(l, dx, dz, 0.036, 0.074, 0.09, 0.008, '#b0463a');
    wbox(l, dx, dz, 0.04, 0.05, 0.08, 0.01, '#2c1a10');
    wbox(l, dx, dz, 0.04, 0.052, 0.006, 0.012, '#ffd27a', 0, 0, 1);
    // Clothesline, cart, barrels, grazing horse and sheep, people.
    for (const x of [0.12, 0.34]) wround(l, x, 0.74, 0.005, 0.006, 0.036, 0.16, '#6b4a2a', 6);
    l.beam([0.12, 0.19, 0.74], [0.34, 0.19, 0.74], 0.002, '#e8e4d8');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.15 + i * 0.045,
        0.74,
        0.12,
        0.034,
        0.06,
        0.004,
        ['#b0463a', '#2f5f86', '#e8e4d8', '#c9a83a'][i]!,
      );
    wbox(l, 0.74, 0.34, 0.06, 0.12, 0.03, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.74, 0.34, 0, t * 0.04), 0.036, 0.024, 0.006, '#2c2a28');
    barrel(l, 0.7, 0.5);
    barrel(l, 0.78, 0.5);
    horse(l, 0.78, 0.72, 0.6, '#8a5a3a');
    sheep(l, 0.62, 0.84, 0.3);
    sheep(l, 0.52, 0.8, -0.4);
    person(l, 0.34, 0.62, 0.036, '#b0463a', '#3a3a3c');
    cypress(l, 0.08, 0.12, 0.2);
    cypress(l, 0.94, 0.1, 0.22);
  },

  trading_post(l) {
    site(l, 'trading_post', '#a98a62', [0.06, 0.1, 0.94, 0.94]);
    const hx = 0.4;
    const hz = 0.28;
    boardBody(l, hx, hz, 0.5, 0.28, 0.036, 0.15, '#9a7a52');
    windows4(l, hx, hz, 0.5, 0.28, 0.1, 0.045, { shutters: '#3f5a3a' });
    door(l, hx, hz, 0.5, 0.28, '+z', 0, 0.036, 0.06, 0.1, timber);
    tinGable(l, hx, hz, 'x', 0.5, 0.28, 0.186, 0.075, '#6e5444', '#9a7a52');
    wbox(l, ...off(l, hx, hz, 0, 0.12), 0.186, 0.56, 0.1, 0.012, '#8a6a46');
    wbox(l, ...off(l, hx, hz, 0, 0.126), 0.22, 0.3, 0.04, 0.006, '#f1ece2');
    // Veranda deck and posts, hanging sign and scales.
    wbox(l, ...off(l, hx, hz, 0, 0.19), 0.036, 0.56, 0.012, 0.12, '#7a5a3a');
    for (const t of [-0.26, -0.09, 0.09, 0.26])
      wround(l, ...off(l, hx, hz, t, 0.23), 0.007, 0.007, 0.048, 0.12, '#6b4a2a', 6);
    wbox(l, ...off(l, hx, hz, 0, 0.23), 0.17, 0.58, 0.01, 0.1, '#6e5444');
    wround(l, 0.86, 0.4, 0.005, 0.006, 0.036, 0.2, '#6b4a2a', 6);
    wbox(l, 0.86, 0.4, 0.23, 0.001, 0.003, 0.003, '#6b4a2a');
    l.beam([0.86, 0.232, 0.4], [0.76, 0.232, 0.4], 0.006, '#6b4a2a');
    wbox(l, 0.76, 0.4, 0.17, 0.06, 0.05, 0.004, '#c9a83a');
    wround(l, 0.5, 0.62, 0.003, 0.005, 0.036, 0.1, '#4a4f54', 6);
    wbox(l, 0.5, 0.62, 0.136, 0.12, 0.004, 0.004, '#4a4f54');
    for (const s of [-1, 1])
      wround(l, ...off(l, 0.5, 0.62, s * 0.055, 0), 0.022, 0.022, 0.1, 0.003, '#c9a83a', 10);
    // Crates, sacks and barrels stacked on the deck and yard.
    for (const [x, z, y] of [
      [0.14, 0.5, 0.048],
      [0.14, 0.5, 0.082],
      [0.2, 0.56, 0.048],
      [0.66, 0.5, 0.048],
    ] as const)
      crate(l, x, z, y, '#8a6a48');
    for (const [x, z] of [
      [0.24, 0.74],
      [0.3, 0.8],
      [0.8, 0.7],
    ] as const)
      barrel(l, x, z);
    for (let i = 0; i < 4; i++)
      l.shape(
        new THREE.SphereGeometry(0.022, 8, 6),
        '#d9cfb4',
        ...off(l, 0.62, 0.74, i * 0.036, 0),
        0.058,
      );
    // Pack horse at the hitching rail with a cart, merchants and a dog.
    for (const x of [0.4, 0.6]) wround(l, x, 0.86, 0.006, 0.006, 0.036, 0.07, '#6b4a2a', 6);
    wbox(l, 0.5, 0.86, 0.088, 0.26, 0.008, 0.008, '#6b4a2a');
    horse(l, 0.5, 0.78, Math.PI / 2, '#7a4a2a');
    wbox(l, 0.78, 0.84, 0.06, 0.12, 0.03, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.78, 0.84, 0, t * 0.04), 0.036, 0.024, 0.006, '#2c2a28');
    person(l, 0.36, 0.64, 0.036, '#5a7a9a', '#d9c38a');
    person(l, 0.62, 0.58, 0.036, '#b0463a', '#3a3a3c');
    dog(l, 0.28, 0.9, 0.6);
    lanternPost(l, 0.12, 0.7, 0.14);
    lanternPost(l, 0.92, 0.62, 0.14);
    cypress(l, 0.07, 0.1, 0.24);
  },

  salt_pan(l) {
    site(l, 'salt_pan', '#d9cfae', [0.04, 0.04, 0.96, 0.96]);
    // Evaporation ponds, from fresh seawater to crusted white, divided by timber sills.
    const pan = ['#4f93b0', '#7cc3cf', '#a9dbe0', '#d4eef0', '#f4f8f6', '#ffffff'];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const x = 0.2 + c * 0.3;
        const z = 0.52 + r * 0.22;
        waterSheet(l, x, z, 0.26, 0.19, 0.04, pan[(c + r * 3) % 6]);
      }
    for (const z of [0.41, 0.63, 0.85]) wbox(l, 0.5, z, 0.038, 0.9, 0.018, 0.016, '#7a5a3a');
    for (const x of [0.05, 0.35, 0.65, 0.95])
      wbox(l, x, 0.63, 0.038, 0.016, 0.018, 0.46, '#7a5a3a');
    // Sea inlet at the back with a wooden sluice and channel.
    waterSheet(l, 0.5, 0.1, 0.92, 0.14, 0.036, '#3f8fae');
    wbox(l, 0.5, 0.22, 0.04, 0.9, 0.012, 0.03, '#6b4a2a');
    for (const x of [0.2, 0.5, 0.8]) wbox(l, x, 0.3, 0.04, 0.05, 0.02, 0.1, '#7a5a3a');
    // Salt pyramids, rake, barrow and a salt shed.
    for (const [x, z, s] of [
      [0.82, 0.3, 1],
      [0.7, 0.9, 0.8],
      [0.34, 0.92, 0.7],
      [0.92, 0.9, 0.7],
    ] as const)
      l.shape(new THREE.ConeGeometry(0.09 * s, 0.12 * s, 5), '#fdfdfb', x, z, 0.036 + 0.06 * s);
    wheelbarrow(l, 0.5, 0.94, 0.3, '#ffffff');
    const sx = 0.14;
    const sz = 0.3;
    boardBody(l, sx, sz, 0.24, 0.2, 0.036, 0.11, '#9a8a6a');
    tinGable(l, sx, sz, 'x', 0.24, 0.2, 0.146, 0.06, '#7a8a8a', '#9a8a6a');
    door(l, sx, sz, 0.24, 0.2, '+z', 0, 0.036, 0.045, 0.075, timber);
    wbox(l, 0.62, 0.52, 0.04, 0.003, 0.003, 0.16, '#6b4a2a', 0.4);
    wbox(l, 0.62, 0.52, 0.04, 0.08, 0.004, 0.004, '#6b4a2a', 0.4);
    person(l, 0.58, 0.5, 0.04, '#b0463a', '#d9c38a');
    person(l, 0.28, 0.74, 0.04, '#5a7a9a', '#d9c38a');
    person(l, 0.86, 0.6, 0.04, '#c9a83a', '#d9c38a');
    lanternPost(l, 0.08, 0.5, 0.14);
    lanternPost(l, 0.94, 0.48, 0.14);
  },
};
