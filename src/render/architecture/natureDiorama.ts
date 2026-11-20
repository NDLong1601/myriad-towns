import * as THREE from 'three';
import {
  boardBody,
  door,
  lanternPost,
  meadow,
  off,
  person,
  rand,
  reseed,
  shingleGable,
  shrub,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import { cropBed, dog, waterSheet } from './dioramaProps';
import { bench, flowerBed } from './civicDiorama';
import { signboard, timberDark } from './industryKit';
import { type Lot, type Recipes } from './lot';

// Nature group expansion: fifteen gardens, groves and wild places drawn at the shared civic
// tile scale (0.77 units a tile).

const grass = '#79a24a';
const water = '#4f93b0';
const stone = '#a8a296';
const coats = ['#c84a3a', '#3a5a7a', '#5a6a4a', '#8a5a3a', '#6a3a5a', '#2f6f9a', '#d8a832'];
const blooms = ['#d84a6a', '#e8c84a', '#8a6ab8', '#f2efe6', '#e8843a', '#d86ab8'];

// ---------------------------------------------------------------------------------------------
// Local kit
// ---------------------------------------------------------------------------------------------

function lawn(l: Lot, seed: string, color = grass, tufts = 30): void {
  reseed(seed);
  meadow(l, color, tufts);
}

function visitors(l: Lot, pts: readonly (readonly [number, number])[]): void {
  pts.forEach(([x, z], i) =>
    person(l, x, z, 0.036, coats[i % coats.length]!, i % 2 ? '#2c2c2e' : '#8a6a3a'),
  );
}

/** Broadleaf tree: trunk and two overlapping crowns. */
function broadleaf(l: Lot, x: number, z: number, h: number, color = '#4f8a3a'): void {
  wround(l, x, z, h * 0.04, h * 0.055, 0.03, h * 0.45, '#5b4330', 6);
  l.shape(new THREE.SphereGeometry(h * 0.3, 10, 8), tone(color, 0.1), x, z, 0.03 + h * 0.68);
  l.shape(
    new THREE.SphereGeometry(h * 0.2, 8, 6),
    tone(color, 0.12),
    ...off(l, x, z, h * 0.12, h * 0.08),
    0.03 + h * 0.85,
  );
}

/** Conifer, optionally snow-tipped. */
function conifer(l: Lot, x: number, z: number, h: number, snowy = false): void {
  wround(l, x, z, h * 0.03, h * 0.045, 0.03, h * 0.25, '#5b4330', 6);
  for (let i = 0; i < 3; i++) {
    const r = h * (0.24 - i * 0.06);
    const y = 0.03 + h * (0.2 + i * 0.22);
    l.shape(new THREE.ConeGeometry(r, h * 0.36, 8), tone('#3f6a3a', 0.08), x, z, y + h * 0.18);
    if (snowy)
      l.shape(new THREE.ConeGeometry(r * 0.55, h * 0.16, 8), '#eef3f4', x, z, y + h * 0.29);
  }
}

/** A clump of bamboo culms with leaf tufts. */
function bamboo(l: Lot, x: number, z: number, h: number, n = 7): void {
  for (let i = 0; i < n; i++) {
    const [cx, cz] = off(l, x, z, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.06);
    const hh = h * (0.7 + rand() * 0.3);
    l.beam(
      [cx, 0.03, cz],
      [cx + (rand() - 0.5) * 0.02, 0.03 + hh, cz + (rand() - 0.5) * 0.02],
      0.006,
      tone('#8ab04a', 0.08),
    );
    for (let k = 1; k < 4; k++)
      wround(l, cx, cz, 0.0045, 0.0045, 0.03 + (hh * k) / 4, 0.002, '#5a7a2a', 6);
    l.shape(
      new THREE.SphereGeometry(0.02, 6, 4).scale(1.4, 0.5, 1.4),
      tone('#5f9a3a', 0.1),
      cx,
      cz,
      0.03 + hh,
    );
  }
}

/** Pond: stone rim, water, lily pads and blossoms. */
function pond(
  l: Lot,
  x: number,
  z: number,
  rx: number,
  rz: number,
  lilies = 8,
  lotus = false,
): void {
  const rim = new THREE.CylinderGeometry(1, 1, 0.012, 24).scale(rx + 0.01, 1, rz + 0.01);
  l.shape(rim, stone, x, z, 0.034);
  const sheet = new THREE.CylinderGeometry(1, 1, 0.004, 24).scale(rx, 1, rz);
  l.shape(sheet, water, x, z, 0.04, 0.15);
  for (let i = 0; i < lilies; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.3 + rand() * 0.6;
    const [px, pz] = off(l, x, z, Math.cos(a) * rx * r, Math.sin(a) * rz * r);
    wround(l, px, pz, 0.012, 0.012, 0.042, 0.002, '#4f8a3a', 8);
    if (lotus || i % 3 === 0)
      l.shape(
        new THREE.ConeGeometry(0.008, 0.014, 6).rotateX(Math.PI),
        lotus ? '#e98caa' : '#f2efe6',
        px,
        pz,
        0.054,
      );
  }
}

/** Arched timber footbridge along x. */
function footbridge(l: Lot, x: number, z: number, len: number, color = '#b4613f'): void {
  for (let i = 0; i < 8; i++) {
    const t = i / 7 - 0.5;
    const y = 0.05 + 0.03 * (1 - 4 * t * t);
    wbox(l, ...off(l, x, z, t * len, 0), y, len / 7.5, 0.006, 0.05, '#8a6a48');
    for (const s of [-1, 1])
      wbox(l, ...off(l, x, z, t * len, s * 0.024), y, 0.004, 0.03, 0.004, color);
  }
  for (const s of [-1, 1])
    l.beam(
      [x - len / 2 / l.spanX, 0.08, z + (s * 0.024) / l.spanZ],
      [x + len / 2 / l.spanX, 0.08, z + (s * 0.024) / l.spanZ],
      0.005,
      color,
    );
}

function rocks(l: Lot, x: number, z: number, n: number, size: number, color = stone): void {
  for (let i = 0; i < n; i++) {
    const g = new THREE.DodecahedronGeometry(size * (0.6 + rand() * 0.6), 0).scale(1, 0.7, 1);
    l.shape(
      g,
      tone(color, 0.12),
      ...off(l, x, z, (rand() - 0.5) * size * 4, (rand() - 0.5) * size * 4),
      0.03 + size * 0.3,
    );
  }
}

function gravelPath(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  w = 0.05,
  color = '#c9bfa6',
): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const ry = -Math.atan2((z1 - z0) * l.spanZ, (x1 - x0) * l.spanX);
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, len, 0.006, w, color, ry);
}

function flowers(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  n: number,
  palette = blooms,
): void {
  for (let i = 0; i < n; i++)
    shrub(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      0.008 + rand() * 0.006,
      palette[i % palette.length],
    );
}

function butterfly(l: Lot, x: number, z: number, y: number, color: string): void {
  for (const s of [-1, 1]) {
    const w = new THREE.CircleGeometry(0.008, 6).rotateX(-Math.PI / 2 + s * 0.6);
    l.shape(w, color, ...off(l, x, z, s * 0.006, 0), y, 0.3);
  }
}

function bird(l: Lot, x: number, z: number, y: number, color = '#3a3a3c'): void {
  wbox(l, x, z, y, 0.012, 0.007, 0.007, color);
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, 0, s * 0.008), y + 0.004, 0.008, 0.002, 0.012, color, 0, s * 0.4);
}

function picnicBlanket(l: Lot, x: number, z: number, color: string, ry = 0): void {
  wbox(l, x, z, 0.03, 0.06, 0.003, 0.05, color, ry);
  for (let i = 0; i < 3; i++)
    wbox(l, ...off(l, x, z, -0.02 + i * 0.02, 0), 0.0335, 0.004, 0.001, 0.05, '#f2efe6', ry);
  wbox(l, ...off(l, x, z, 0.012, 0.01), 0.033, 0.02, 0.014, 0.014, '#a07a4a', ry);
}

/** Wooden boardwalk along x with railings. */
function boardwalk(l: Lot, x0: number, x1: number, z: number, y = 0.05): void {
  const len = (x1 - x0) * l.spanX;
  const n = Math.max(4, Math.round(len / 0.03));
  for (let i = 0; i < n; i++)
    wbox(
      l,
      x0 + ((i + 0.5) / n) * (x1 - x0),
      z,
      y,
      len / n - 0.003,
      0.006,
      0.07,
      tone('#9a7a52', 0.08),
    );
  for (let i = 0; i <= Math.round(len / 0.1); i++) {
    const px = x0 + (i / Math.round(len / 0.1)) * (x1 - x0);
    for (const s of [-1, 1])
      wbox(l, ...off(l, px, z, 0, s * 0.036), 0.02, 0.006, y + 0.03, 0.006, '#6b4a2c');
  }
  for (const s of [-1, 1])
    l.beam(
      [x0, y + 0.03, z + (s * 0.036) / l.spanZ],
      [x1, y + 0.03, z + (s * 0.036) / l.spanZ],
      0.004,
      '#6b4a2c',
    );
}

export const natureDiorama: Recipes = {
  lotus_pond(l) {
    lawn(l, 'lotus_pond');
    pond(l, 0.5, 0.46, 0.5, 0.42, 22, true);
    footbridge(l, 0.5, 0.46, 0.5);
    // A small pavilion on the bank, willows, benches and visitors.
    const px = 0.86;
    const pz = 0.16;
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      wround(l, ...off(l, px, pz, a * 0.05, b * 0.05), 0.006, 0.006, 0.03, 0.11, '#b4613f', 6);
    l.shape(new THREE.ConeGeometry(0.1, 0.06, 4).rotateY(Math.PI / 4), '#4d5a66', px, pz, 0.17);
    for (const [x, z] of [
      [0.1, 0.12],
      [0.1, 0.86],
      [0.9, 0.86],
    ] as const) {
      // Weeping willow: a rounded crown with curtains of hanging fronds round its rim.
      wround(l, x, z, 0.012, 0.016, 0.03, 0.18, '#5b4330', 6);
      l.shape(new THREE.SphereGeometry(0.08, 10, 8).scale(1, 0.7, 1), '#7aa85a', x, z, 0.22);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        wbox(
          l,
          ...off(l, x, z, Math.cos(a) * 0.07, Math.sin(a) * 0.07),
          0.09,
          0.012,
          0.12,
          0.012,
          tone('#8ab85a', 0.08),
          a,
        );
      }
    }
    bench(l, 0.3, 0.94, 0);
    bench(l, 0.7, 0.94, 0);
    visitors(l, [
      [0.44, 0.46],
      [0.84, 0.24],
      [0.3, 0.88],
    ]);
    lanternPost(l, 0.5, 0.94, 0.12);
  },

  zen_rock_garden(l) {
    lawn(l, 'zen_rock_garden', '#6f9a4a', 8);
    wbox(l, 0.5, 0.5, 0.03, 0.7, 0.01, 0.7, '#e9e4d6');
    for (let i = 0; i < 14; i++)
      wbox(l, 0.5, 0.08 + i * 0.06, 0.0405, 0.68, 0.002, 0.004, '#cfc8b4');
    for (const [x, z, s] of [
      [0.32, 0.36, 0.05],
      [0.62, 0.62, 0.04],
      [0.7, 0.28, 0.03],
    ] as const) {
      for (let r = 0; r < 4; r++) {
        const ring = new THREE.TorusGeometry(s + 0.02 + r * 0.016, 0.0015, 4, 20).rotateX(
          Math.PI / 2,
        );
        l.shape(ring, '#cfc8b4', x, z, 0.041);
      }
      rocks(l, x, z, 2, s * 0.8, '#6e6a62');
    }
    wbox(l, 0.5, 0.06, 0.03, 0.74, 0.03, 0.03, '#5c4630');
    for (let i = 0; i < 6; i++)
      wround(l, 0.12 + i * 0.15, 0.94, 0.012, 0.014, 0.03, 0.01, stone, 8);
    l.shape(new THREE.SphereGeometry(0.06, 8, 6).scale(1, 0.8, 1), '#3f6a3a', 0.12, 0.12, 0.08);
    l.shape(new THREE.SphereGeometry(0.03, 8, 6), '#c84a6a', 0.88, 0.88, 0.09);
    wround(l, 0.88, 0.88, 0.006, 0.008, 0.03, 0.05, '#5b4330', 6);
    wbox(l, 0.86, 0.12, 0.03, 0.04, 0.04, 0.04, stone);
    wbox(l, 0.86, 0.12, 0.07, 0.06, 0.012, 0.06, '#6e6a62');
    wbox(l, 0.86, 0.12, 0.05, 0.02, 0.015, 0.02, '#ffd27a', 0, 0, 1);
    visitors(l, [[0.5, 0.9]]);
  },

  bamboo_grove(l) {
    lawn(l, 'bamboo_grove', '#6f9a4a', 20);
    for (const [x, z] of [
      [0.2, 0.2],
      [0.5, 0.18],
      [0.8, 0.24],
      [0.18, 0.52],
      [0.82, 0.56],
      [0.26, 0.82],
      [0.62, 0.84],
    ] as const)
      bamboo(l, x, z, 0.36, 6);
    gravelPath(l, 0.5, 0.96, 0.5, 0.4, 0.05, '#c9bfa6');
    wbox(l, 0.5, 0.42, 0.03, 0.08, 0.02, 0.04, stone);
    visitors(l, [[0.5, 0.6]]);
  },

  wildflower_meadow(l) {
    lawn(l, 'wildflower_meadow', '#7fae5a', 60);
    flowers(l, 0.05, 0.05, 0.95, 0.95, 160);
    for (let i = 0; i < 6; i++)
      butterfly(l, 0.15 + rand() * 0.7, 0.15 + rand() * 0.7, 0.08 + rand() * 0.06, blooms[i]!);
    broadleaf(l, 0.82, 0.2, 0.34, '#5f9a3a');
    gravelPath(l, 0.1, 0.9, 0.7, 0.5, 0.03, '#a8946a');
    for (let i = 0; i < 4; i++) {
      const [hx, hz] = off(l, 0.24, 0.24, (i % 2) * 0.03, Math.floor(i / 2) * 0.03);
      wbox(l, hx, hz, 0.03, 0.024, 0.022, 0.024, '#d8b860');
    }
    visitors(l, [
      [0.4, 0.62],
      [0.62, 0.42],
    ]);
    dog(l, 0.5, 0.56, 0.6);
  },

  hedge_maze(l) {
    lawn(l, 'hedge_maze', '#6f9a4a', 10);
    wbox(l, 0.5, 0.5, 0.03, 2.2, 0.006, 2.2, '#c9bfa6');
    // Concentric square hedges with gaps, a fountain at the heart.
    const hedge = (x0: number, z0: number, x1: number, z1: number): void => {
      const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
      const ry = -Math.atan2((z1 - z0) * l.spanZ, (x1 - x0) * l.spanX);
      wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, len, 0.07, 0.05, tone('#3f6a3a', 0.06), ry);
    };
    for (const [r, gap] of [
      [0.44, 0],
      [0.32, 1],
      [0.2, 2],
    ] as const) {
      const a = 0.5 - r;
      const b = 0.5 + r;
      const g = 0.06;
      hedge(a, a, b, a);
      hedge(a, b, gap === 1 ? 0.5 - g : b, b);
      if (gap === 1) hedge(0.5 + g, b, b, b);
      hedge(a, a, a, gap === 2 ? 0.5 - g : b);
      if (gap === 2) hedge(a, 0.5 + g, a, b);
      hedge(b, a, b, gap === 0 ? 0.5 - g : b);
      if (gap === 0) hedge(b, 0.5 + g, b, b);
    }
    hedge(0.5, 0.06, 0.5, 0.18);
    hedge(0.18, 0.5, 0.06, 0.5);
    wround(l, 0.5, 0.5, 0.08, 0.085, 0.03, 0.03, stone, 16);
    wround(l, 0.5, 0.5, 0.072, 0.072, 0.06, 0.002, water, 16);
    wround(l, 0.5, 0.5, 0.01, 0.014, 0.06, 0.08, '#e9e4d6', 8);
    for (const [x, z] of [
      [0.04, 0.04],
      [0.96, 0.04],
      [0.04, 0.96],
      [0.96, 0.96],
    ] as const)
      lanternPost(l, x, z, 0.15);
    visitors(l, [
      [0.5, 0.88],
      [0.3, 0.5],
      [0.62, 0.32],
      [0.5, 0.6],
    ]);
    signboard(l, 0.5, 0.97, 0.08, 0.14, '#3f6a3a');
  },

  waterfall_garden(l) {
    lawn(l, 'waterfall_garden', grass, 20);
    // Rock cliff at the back with a waterfall into a pool and a stream running forward.
    for (let i = 0; i < 6; i++) {
      const g = new THREE.DodecahedronGeometry(0.14 + rand() * 0.08, 0).scale(1, 1.3, 0.8);
      l.shape(g, tone('#8a8478', 0.1), 0.12 + i * 0.15, 0.12, 0.12 + rand() * 0.08);
    }
    wbox(l, 0.5, 0.2, 0.06, 0.1, 0.3, 0.012, '#bfe0e6', 0, 0, 0.4);
    pond(l, 0.5, 0.36, 0.3, 0.16, 6);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.SphereGeometry(0.02, 6, 4);
      l.shape(
        g,
        '#f2efe6',
        ...off(l, 0.5, 0.3, (rand() - 0.5) * 0.12, (rand() - 0.5) * 0.04),
        0.05,
        0.3,
      );
    }
    wbox(l, 0.5, 0.7, 0.031, 0.08, 0.006, 0.46, '#4f93b0', 0, 0, 0.15);
    footbridge(l, 0.5, 0.7, 0.18, '#6b4a2c');
    for (const [x, z] of [
      [0.14, 0.6],
      [0.86, 0.6],
    ] as const)
      broadleaf(l, x, z, 0.4);
    flowers(l, 0.06, 0.8, 0.94, 0.96, 40);
    bench(l, 0.24, 0.42, Math.PI / 2);
    visitors(l, [
      [0.36, 0.74],
      [0.66, 0.5],
    ]);
    lanternPost(l, 0.74, 0.86, 0.13);
  },

  butterfly_garden(l) {
    lawn(l, 'butterfly_garden', '#76a456', 20);
    for (let i = 0; i < 3; i++) flowerBed(l, 0.5, 0.2 + i * 0.28, 0.6, 0.12);
    flowers(l, 0.08, 0.08, 0.92, 0.92, 50);
    for (let i = 0; i < 10; i++)
      butterfly(
        l,
        0.15 + rand() * 0.7,
        0.15 + rand() * 0.7,
        0.08 + rand() * 0.08,
        blooms[i % blooms.length]!,
      );
    // A little glass butterfly house.
    wbox(l, 0.84, 0.86, 0.03, 0.12, 0.08, 0.1, '#bfe0e6', 0, 0, 0.3);
    shingleGable(l, 0.84, 0.86, 'x', 0.12, 0.1, 0.11, 0.04, '#e9e4d6');
    visitors(l, [
      [0.3, 0.5],
      [0.62, 0.66],
    ]);
    lanternPost(l, 0.14, 0.9, 0.12);
  },

  bird_sanctuary(l) {
    lawn(l, 'bird_sanctuary', '#5f8a42', 30);
    for (const [x, z, h] of [
      [0.12, 0.12, 0.5],
      [0.34, 0.08, 0.42],
      [0.88, 0.14, 0.46],
      [0.1, 0.5, 0.44],
      [0.9, 0.56, 0.5],
      [0.2, 0.9, 0.4],
    ] as const)
      broadleaf(l, x, z, h, '#3f7a3a');
    for (const [x, z] of [
      [0.56, 0.1],
      [0.74, 0.88],
    ] as const)
      conifer(l, x, z, 0.5);
    pond(l, 0.5, 0.5, 0.22, 0.16, 6);
    // Bird hide on stilts, nest boxes on poles, birds in flight and wading.
    const hx = 0.66;
    const hz = 0.74;
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, hx, hz, a * 0.06, b * 0.04), 0.03, 0.008, 0.08, 0.008, '#5c4630');
    boardBody(l, hx, hz, 0.14, 0.1, 0.11, 0.07, '#7a6a52');
    faceBox2(l, hx, hz);
    shingleGable(l, hx, hz, 'x', 0.14, 0.1, 0.18, 0.04, '#4a4440');
    l.beam(
      [hx - 0.07 / l.spanX, 0.11, hz + 0.05 / l.spanZ],
      [hx - 0.14 / l.spanX, 0.03, hz + 0.05 / l.spanZ],
      0.03,
      '#6b4a2c',
    );
    for (const [x, z] of [
      [0.3, 0.3],
      [0.7, 0.32],
      [0.36, 0.72],
    ] as const) {
      wround(l, x, z, 0.004, 0.005, 0.03, 0.16, '#5c4630', 6);
      wbox(l, x, z, 0.19, 0.026, 0.03, 0.026, '#8a6a48');
      l.shape(new THREE.ConeGeometry(0.024, 0.016, 4).rotateY(Math.PI / 4), '#4a4440', x, z, 0.228);
    }
    for (let i = 0; i < 8; i++)
      bird(l, 0.2 + rand() * 0.6, 0.2 + rand() * 0.6, 0.2 + rand() * 0.25);
    for (let i = 0; i < 3; i++) {
      const [wx, wz] = off(l, 0.5, 0.5, -0.1 + i * 0.1, 0.05);
      wbox(l, wx, wz, 0.042, 0.016, 0.012, 0.008, '#f2efe6');
      wbox(l, wx, wz, 0.042, 0.002, 0.03, 0.002, '#e8843a');
    }
    visitors(l, [[0.56, 0.84]]);
    signboard(l, 0.5, 0.96, 0.08, 0.1, '#3f6a3a');
  },

  picnic_meadow(l) {
    lawn(l, 'picnic_meadow', '#7aaa5a', 50);
    for (const [x, z] of [
      [0.14, 0.14],
      [0.86, 0.18],
      [0.1, 0.84],
    ] as const)
      broadleaf(l, x, z, 0.44);
    const colors = ['#c8392c', '#2f6f9a', '#d8a832', '#3f8a6a'];
    for (const [i, [x, z]] of (
      [
        [0.36, 0.3],
        [0.62, 0.36],
        [0.4, 0.6],
        [0.7, 0.66],
      ] as const
    ).entries()) {
      picnicBlanket(l, x, z, colors[i]!, rand());
      visitors(l, [[x + 0.04, z + 0.02]]);
    }
    for (const [x, z] of [
      [0.84, 0.86],
      [0.6, 0.88],
    ] as const) {
      wbox(l, x, z, 0.05, 0.1, 0.008, 0.05, '#7a5634');
      for (const s of [-1, 1])
        wbox(l, ...off(l, x, z, 0, s * 0.04), 0.04, 0.1, 0.006, 0.014, '#7a5634');
    }
    l.shape(new THREE.SphereGeometry(0.012, 8, 6), '#e8c84a', 0.52, 0.48, 0.05);
    dog(l, 0.5, 0.46, 1);
    for (let i = 0; i < 3; i++) {
      const kx = 0.24 + i * 0.02;
      l.beam([kx, 0.03, 0.46], [kx + 0.06 / l.spanX, 0.28, 0.42], 0.001, '#e9e4d6');
    }
    wbox(l, 0.32, 0.42, 0.28, 0.04, 0.04, 0.003, '#c8392c', 0.6);
    lanternPost(l, 0.94, 0.5, 0.13);
  },

  forest_trail(l) {
    lawn(l, 'forest_trail', '#5f8a42', 30);
    gravelPath(l, 0.02, 0.6, 0.98, 0.4, 0.06, '#a8946a');
    for (const [x, z, h] of [
      [0.08, 0.16, 0.5],
      [0.3, 0.14, 0.44],
      [0.62, 0.12, 0.52],
      [0.9, 0.2, 0.46],
      [0.14, 0.86, 0.44],
      [0.46, 0.88, 0.5],
      [0.78, 0.86, 0.48],
    ] as const) {
      if ((x * 10) % 2 > 1) conifer(l, x, z, h);
      else broadleaf(l, x, z, h, '#3f7a3a');
    }
    wbox(l, 0.5, 0.5, 0.03, 0.1, 0.02, 0.024, '#7a5634');
    const log = new THREE.CylinderGeometry(0.014, 0.016, 0.14, 8).rotateZ(Math.PI / 2);
    l.shape(log, '#7a5634', 0.7, 0.66, 0.044);
    wround(l, 0.86, 0.5, 0.004, 0.005, 0.03, 0.12, '#5c4630', 6);
    wbox(l, 0.86, 0.5, 0.13, 0.06, 0.02, 0.004, '#8a6a48', 0.3);
    flowers(l, 0.05, 0.3, 0.95, 0.7, 20, ['#e8c84a', '#f2efe6', '#8a6ab8']);
    visitors(l, [
      [0.36, 0.54],
      [0.6, 0.46],
    ]);
    dog(l, 0.42, 0.52, 0.3);
    lanternPost(l, 0.04, 0.6, 0.12);
  },

  lakeside_boardwalk(l) {
    lawn(l, 'lakeside_boardwalk', grass, 10);
    waterSheet(l, 0.5, 0.25, l.spanX, 0.5 * l.spanZ, 0.042, water);
    for (let i = 0; i < 10; i++) {
      const [rx, rz] = [0.05 + i * 0.1, 0.5 + (rand() - 0.5) * 0.05];
      l.beam(
        [rx, 0.03, rz],
        [rx + (rand() - 0.5) * 0.01, 0.1 + rand() * 0.04, rz],
        0.004,
        '#8a9a4a',
      );
    }
    boardwalk(l, 0.02, 0.98, 0.42);
    wbox(l, 0.86, 0.26, 0.04, 0.1, 0.006, 0.12, '#9a7a52');
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.86, 0.26, s * 0.05, 0), 0.02, 0.006, 0.06, 0.006, '#6b4a2c');
    const boatHull = new THREE.SphereGeometry(0.03, 8, 6).scale(2.4, 0.5, 1);
    l.shape(boatHull, '#c84a3a', 0.62, 0.16, 0.046);
    for (let i = 0; i < 2; i++) bench(l, 0.24 + i * 0.36, 0.7, 0);
    for (const [x, z] of [
      [0.08, 0.84],
      [0.92, 0.84],
    ] as const)
      broadleaf(l, x, z, 0.36);
    for (let i = 0; i < 4; i++) bird(l, 0.2 + i * 0.18, 0.16, 0.046, '#f2efe6');
    visitors(l, [
      [0.3, 0.42],
      [0.66, 0.42],
      [0.5, 0.78],
    ]);
    lanternPost(l, 0.06, 0.6, 0.12);
    lanternPost(l, 0.94, 0.6, 0.12);
  },

  alpine_meadow(l) {
    lawn(l, 'alpine_meadow', '#8aae6a', 40);
    // Snow-capped boulders, edelweiss and gentians, a stone hut, a cairn and grazing goats.
    for (const [x, z, s] of [
      [0.14, 0.14, 0.12],
      [0.4, 0.08, 0.1],
      [0.86, 0.12, 0.14],
    ] as const) {
      const g = new THREE.DodecahedronGeometry(s, 0).scale(1, 1.2, 0.9);
      l.shape(g, '#8a8478', x, z, 0.03 + s * 0.7);
      l.shape(
        new THREE.DodecahedronGeometry(s * 0.6, 0).scale(1, 0.5, 0.9),
        '#eef3f4',
        x,
        z,
        0.03 + s * 1.3,
      );
    }
    flowers(l, 0.05, 0.3, 0.95, 0.95, 70, ['#f2efe6', '#3a5ab8', '#e8c84a', '#d86ab8']);
    const hx = 0.24;
    const hz = 0.66;
    wbox(l, hx, hz, 0.03, 0.16, 0.09, 0.12, '#9a9282');
    window4(l, hx, hz, 0.16, 0.12, '+z', 0.03, 0.05, 0.024, { shutters: '#c84a3a' });
    door(l, hx, hz, 0.16, 0.12, '+z', -0.04, 0.03, 0.03, 0.06, timberDark);
    shingleGable(l, hx, hz, 'x', 0.16, 0.12, 0.12, 0.06, '#5e4a38', '#9a9282');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.7,
        0.4,
        0.03 + i * 0.018,
        0.05 - i * 0.008,
        0.018,
        0.05 - i * 0.008,
        tone(stone, 0.1),
        i,
      );
    for (const [x, z] of [
      [0.56, 0.7],
      [0.66, 0.78],
      [0.8, 0.64],
    ] as const) {
      wbox(l, x, z, 0.046, 0.03, 0.016, 0.014, '#e9e4d6');
      wbox(l, ...off(l, x, z, 0.018, 0), 0.056, 0.01, 0.012, 0.01, '#e9e4d6');
      for (const s of [-1, 1])
        for (const t of [-1, 1])
          wbox(l, ...off(l, x, z, t * 0.01, s * 0.005), 0.03, 0.004, 0.016, 0.004, '#5a5048');
    }
    visitors(l, [[0.44, 0.5]]);
    lanternPost(l, 0.1, 0.9, 0.12);
    signboard(l, 0.9, 0.92, 0.07, 0.1, '#5c4630');
  },

  cactus_garden(l) {
    lawn(l, 'cactus_garden', '#c9b07a', 6);
    wbox(l, 0.5, 0.5, 0.03, 0.72, 0.008, 0.72, '#d8c08a');
    // Saguaros, barrel cacti and agaves among sandstone, a shade ramada.
    const saguaro = (x: number, z: number, h: number): void => {
      wround(l, x, z, 0.014, 0.016, 0.03, h, '#4f8a3a', 8);
      for (const s of [-1, 1]) {
        l.beam(
          [x, 0.03 + h * 0.45, z],
          [x + (s * 0.03) / l.spanX, 0.03 + h * 0.5, z],
          0.018,
          '#4f8a3a',
        );
        l.beam(
          [x + (s * 0.03) / l.spanX, 0.03 + h * 0.5, z],
          [x + (s * 0.03) / l.spanX, 0.03 + h * 0.75, z],
          0.018,
          '#4f8a3a',
        );
      }
      l.shape(new THREE.SphereGeometry(0.008, 6, 4), '#e8843a', x, z, 0.03 + h + 0.004);
    };
    saguaro(0.24, 0.26, 0.2);
    saguaro(0.7, 0.5, 0.16);
    for (const [x, z] of [
      [0.5, 0.24],
      [0.3, 0.6],
      [0.76, 0.24],
      [0.58, 0.76],
    ] as const) {
      l.shape(new THREE.SphereGeometry(0.024, 8, 6).scale(1, 0.9, 1), '#5f9a4a', x, z, 0.054);
      l.shape(new THREE.SphereGeometry(0.006, 6, 4), '#d84a6a', x, z, 0.078);
    }
    for (let i = 0; i < 2; i++) {
      const [ax, az] = [0.18 + i * 0.6, 0.84];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        l.beam(
          [ax, 0.03, az],
          [ax + (Math.cos(a) * 0.04) / l.spanX, 0.07, az + (Math.sin(a) * 0.04) / l.spanZ],
          0.008,
          '#7aa08a',
        );
      }
    }
    rocks(l, 0.46, 0.46, 4, 0.03, '#c08a5a');
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.86, 0.6, a * 0.04, b * 0.03), 0.03, 0.006, 0.1, 0.006, '#7a5634');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, 0.86, 0.6, -0.04 + i * 0.016, 0), 0.13, 0.006, 0.006, 0.07, '#9a7a52');
    visitors(l, [[0.46, 0.9]]);
    lanternPost(l, 0.1, 0.1, 0.12);
  },

  snow_pine_park(l) {
    lawn(l, 'snow_pine_park', '#eef3f4', 6);
    // Snowy pines round a frozen pond with skaters, a snowman and a warming hut.
    for (const [x, z, h] of [
      [0.1, 0.1, 0.5],
      [0.3, 0.06, 0.44],
      [0.9, 0.1, 0.52],
      [0.08, 0.56, 0.46],
      [0.92, 0.5, 0.44],
      [0.14, 0.92, 0.42],
    ] as const)
      conifer(l, x, z, h, true);
    const ice = new THREE.CylinderGeometry(1, 1, 0.004, 24).scale(0.28, 1, 0.2);
    l.shape(ice, '#cfe6f0', 0.5, 0.42, 0.034, 0.1);
    visitors(l, [
      [0.44, 0.4],
      [0.56, 0.46],
      [0.5, 0.34],
    ]);
    for (const [y, r] of [
      [0.03, 0.022],
      [0.064, 0.016],
      [0.09, 0.011],
    ] as const)
      l.shape(new THREE.SphereGeometry(r, 8, 6), '#f8fbfc', 0.78, 0.72, y + r);
    wbox(l, 0.78, 0.72 + 0.012 / l.spanZ, 0.1, 0.004, 0.004, 0.012, '#e8843a');
    const hx = 0.28;
    const hz = 0.76;
    boardBody(l, hx, hz, 0.16, 0.12, 0.03, 0.09, '#7a5434');
    window4(l, hx, hz, 0.16, 0.12, '+z', 0.04, 0.05, 0.024, { shutters: '#c84a3a' });
    door(l, hx, hz, 0.16, 0.12, '+z', -0.04, 0.03, 0.03, 0.06, timberDark);
    shingleGable(l, hx, hz, 'x', 0.16, 0.12, 0.12, 0.06, '#eef3f4', '#7a5434');
    wround(l, ...off(l, hx, hz, 0.06, -0.03), 0.01, 0.012, 0.12, 0.08, '#8a8274', 8);
    for (let i = 0; i < 2; i++) bench(l, 0.5 + i * 0.16, 0.9, 0);
    for (const [x, z] of [
      [0.66, 0.24],
      [0.36, 0.24],
    ] as const)
      lanternPost(l, x, z, 0.14);
    const sled = new THREE.BoxGeometry(0.04, 0.008, 0.02);
    l.shape(sled, '#c84a3a', 0.62, 0.62, 0.036);
  },

  community_allotment(l) {
    lawn(l, 'community_allotment', '#6f8a4a', 10);
    // Raised plots with different crops, a tool shed, water butts, a compost bay, gardeners.
    const kinds = ['cabbage', 'carrot', 'greens', 'pumpkin', 'berry', 'grain'] as const;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 2; c++) {
        const x0 = 0.06 + c * 0.46;
        const z0 = 0.06 + r * 0.24;
        wbox(l, x0 + 0.2, z0 + 0.1, 0.03, 0.42 * 1.54, 0.02, 0.2 * 1.54, '#7a5634');
        cropBed(l, x0 + 0.01, z0 + 0.01, x0 + 0.39, z0 + 0.19, kinds[r * 2 + c]!, 4, 0.05);
      }
    const sx = 0.84;
    const sz = 0.86;
    boardBody(l, sx, sz, 0.14, 0.1, 0.03, 0.08, '#5a7a5a');
    door(l, sx, sz, 0.14, 0.1, '-x', 0, 0.03, 0.03, 0.06, timberDark);
    shingleGable(l, sx, sz, 'x', 0.14, 0.1, 0.11, 0.04, '#4a4440', '#5a7a5a');
    for (let i = 0; i < 2; i++)
      wround(l, 0.66 + i * 0.04, 0.88, 0.014, 0.014, 0.03, 0.04, '#3a5a3a', 10);
    wbox(l, 0.14, 0.88, 0.03, 0.1, 0.04, 0.08, '#6b4a2c');
    wbox(l, 0.14, 0.88, 0.07, 0.09, 0.004, 0.07, '#4a3a2a');
    visitors(l, [
      [0.3, 0.28],
      [0.7, 0.52],
      [0.4, 0.76],
    ]);
    lanternPost(l, 0.5, 0.94, 0.12);
  },
};

/** Viewing slot in the bird hide. */
function faceBox2(l: Lot, x: number, z: number): void {
  wbox(l, ...off(l, x, z, 0, 0.052), 0.15, 0.1, 0.012, 0.004, '#1c1f21');
}
