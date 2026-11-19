import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cypress,
  door,
  horse,
  lanternPost,
  off,
  shingleGable,
  stoneBody,
  tinGable,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import {
  bench,
  birds,
  butterflies,
  cat,
  cobbles,
  cornice,
  downpipe,
  flowerRow,
  gear,
  ladder,
  pt,
  rainButt,
  steps,
} from './dioramaDetails';
import { coneRoof, dog, truck, windmillSails } from './dioramaProps';
import { disc, p3, wheelbarrow } from './forestryTransitDiorama';
import { site } from './industryDiorama';
import { stack } from './lightIndustryDiorama';
import { brickBody, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 3A (part 3), drawn as dioramas on 2x2 lots at the same x2 scale as the forestry set:
//   windmill -> smock_windmill -> stone_windmill -> multi_vane_mill -> wind_turbine_spire
//   bakery   -> market_bakery  -> guild_bakery    -> patisserie_salon -> royal_confectionery

const slate = '#4d5a66';
const timber = '#5c3f27';
const flour = '#efe7d6';

/** Sacks of flour or grain piled in a small heap. */
function sacks(l: Lot, x: number, z: number, n: number, y = 0.03): void {
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 3);
    const [px, pz] = off(l, x, z, ((i % 3) - 1 + row * 0.5) * 0.034, 0);
    l.shape(
      new THREE.SphereGeometry(0.02, 8, 6),
      tone(flour, 0.1),
      px,
      pz,
      y + 0.016 + row * 0.026,
    );
  }
}

/** Striped awning projecting over a shop front facing +z. */
function awning(
  l: Lot,
  x: number,
  z: number,
  w: number,
  y: number,
  c1: string,
  c2 = '#f1ece2',
): void {
  const n = Math.round(w / 0.03);
  for (let i = 0; i < n; i++)
    wbox(
      l,
      ...off(l, x, z, -w / 2 + (i + 0.5) * (w / n), 0.03),
      y,
      w / n,
      0.006,
      0.07,
      i % 2 ? c2 : c1,
      0,
      0.22,
    );
  for (const s of [-1, 1])
    wbox(l, ...off(l, x, z, s * (w / 2 - 0.005), 0.062), 0.03, 0.006, y - 0.03, 0.006, timber);
}

/** Wooden crate of loaves, rolls or pastries on a display table. */
function display(
  l: Lot,
  x: number,
  z: number,
  y: number,
  w: number,
  goods: readonly string[],
): void {
  wbox(l, x, z, y, w, 0.008, 0.04, '#8a6a48');
  for (const t of [-1, 1])
    wbox(l, ...off(l, x, z, t * (w / 2 - 0.006), 0), y - 0.03, 0.006, 0.03, 0.03, '#6b4a2a');
  for (let i = 0; i < Math.round(w / 0.026); i++)
    l.shape(
      new THREE.SphereGeometry(0.01, 6, 5),
      goods[i % goods.length]!,
      ...off(l, x, z, -w / 2 + 0.015 + i * 0.026, 0),
      y + 0.016,
    );
}

/** Round stone or brick bread oven with a glowing mouth. */
function oven(l: Lot, x: number, z: number, y: number, color: string): void {
  wbox(l, x, z, y, 0.1, 0.03, 0.08, '#8f8a80');
  l.dome(x, z, 0.05, 0.04, y + 0.03, 0.05, color);
  wbox(l, ...off(l, x, z, 0, 0.04), y + 0.036, 0.034, 0.024, 0.006, '#ff8a2a', 0, 0, 1);
}

/** Four-sail mill head (cap, hub, sails and a fantail) facing +z. */
function millHead(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  len: number,
  fantail = false,
): void {
  l.dome(x, z, r, r, y, r * 0.8, '#5a4a3a');
  windmillSails(l, ...off(l, x, z, 0, r + 0.02), y + r * 0.35, len, 0);
  if (fantail) {
    l.beam(
      pt(off(l, x, z, 0, -r), y + 0.02),
      pt(off(l, x, z, 0, -r - 0.1), y + 0.02),
      0.006,
      timber,
    );
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      l.beam(
        pt(off(l, x, z, 0, -r - 0.1), y + 0.02),
        pt(off(l, x, z, Math.cos(a) * 0.04, -r - 0.1), y + 0.02 + Math.sin(a) * 0.04),
        0.004,
        '#efe7d6',
      );
    }
  }
}

// ---------------------------------------------------------------------------------------------

export const millBakeryDiorama: Recipes = {
  // -------------------------------------------------------------------------------------------
  // Windmills
  // -------------------------------------------------------------------------------------------
  windmill(l) {
    site(l, 'windmill', '#9a8a62', [0.1, 0.1, 0.92, 0.92]);
    const mx = 0.46;
    const mz = 0.42;
    // Post mill: a boxy timber body that turns on a central post braced by trestle legs.
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [mx + (a * 0.12) / l.spanX, 0.03, mz + (b * 0.12) / l.spanZ],
        [mx + (a * 0.01) / l.spanX, 0.14, mz + (b * 0.01) / l.spanZ],
        0.014,
        timber,
      );
    wbox(l, mx, mz, 0.03, 0.34, 0.01, 0.01, timber);
    wround(l, mx, mz, 0.02, 0.026, 0.03, 0.12, '#6b4a2a', 8);
    wbox(l, mx, mz, 0.14, 0.2, 0.2, 0.17, '#a68a62');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, mx, mz, -0.09 + i * 0.036, 0.086), 0.14, 0.012, 0.2, 0.004, '#4a3322');
    l.shape(new THREE.ConeGeometry(0.14, 0.1, 4), '#6a4f38', mx, mz, 0.39);
    wbox(l, mx, mz, 0.4, 0.22, 0.01, 0.19, '#5a4a3a');
    windmillSails(l, ...off(l, mx, mz, 0, 0.1), 0.26, 0.3, 0);
    // Steps and a tail pole to turn the mill into the wind.
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        ...off(l, mx, mz, 0.06, -0.12 - i * 0.034),
        0.046 + i * 0.01,
        0.07,
        0.006,
        0.02,
        '#6b4a2a',
      );
    l.beam(
      pt(off(l, mx, mz, 0.1, -0.1), 0.12),
      pt(off(l, mx, mz, 0.3, -0.12), 0.04),
      0.008,
      timber,
    );
    // Cart with sacks, a miller and a donkey, flour sacks and a grindstone on display.
    wbox(l, 0.2, 0.78, 0.07, 0.16, 0.012, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.2, 0.78, 0, t * 0.04), 0.036, 0.026, 0.006, '#2c2a28');
    sacks(l, 0.2, 0.78, 5, 0.08);
    horse(l, 0.34, 0.8, 0.3, '#8a6a4a');
    sacks(l, 0.74, 0.68, 6);
    wround(l, 0.78, 0.5, 0.04, 0.04, 0.034, 0.012, '#9a9a9a', 14);
    wround(l, 0.78, 0.5, 0.034, 0.034, 0.046, 0.01, '#8a8a90', 14);
    barrel(l, 0.6, 0.8);
    wheelbarrow(l, 0.56, 0.7, 0.3, flour);
    // Wheat field edge, hay and a few wild flowers.
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 12; i++)
        wbox(
          l,
          0.1 + i * 0.03,
          0.14 + r * 0.04,
          0.034,
          0.004,
          0.05 + (i % 3) * 0.008,
          0.004,
          '#d9b84a',
        );
    flowerRow(l, 0.8, 0.84, 0.2, '#d6455a', 8);
    cypress(l, 0.07, 0.9, 0.24);
    cypress(l, 0.93, 0.12, 0.22);
    cat(l, 0.5, 0.62, 0.034, '#c27a3a');
    dog(l, 0.4, 0.66, 0.5);
    birds(l, [
      [0.7, 0.6, 0.034],
      [0.76, 0.62, 0.034],
      [0.5, 0.52, 0.4],
    ]);
    butterflies(l, [
      [0.2, 0.2, 0.1],
      [0.4, 0.24, 0.12],
    ]);
    workers(l, [
      [0.3, 0.7, '#8a4a3a', '#d9c38a'],
      [0.64, 0.74, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.88, 0.6, 0.15);
  },

  smock_windmill(l) {
    site(l, 'smock_windmill', '#9a8a62', [0.08, 0.08, 0.94, 0.94]);
    const mx = 0.44;
    const mz = 0.4;
    // Smock mill: an octagonal tapering timber tower on a brick base, with a boat-shaped cap.
    brickBody(l, mx, mz, 0.26, 0.26, 0.03, 0.08, '#8a4a38');
    for (let i = 0; i < 6; i++) {
      const w = 0.24 - i * 0.02;
      const g = new THREE.CylinderGeometry(w * 0.5, (w + 0.02) * 0.5, 0.07, 8);
      g.rotateY(Math.PI / 8);
      l.shape(g, tone('#d9d2bf', 0.06), mx, mz, 0.11 + i * 0.07);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      l.beam(
        pt(off(l, mx, mz, Math.cos(a) * 0.125, Math.sin(a) * 0.125), 0.11),
        pt(off(l, mx, mz, Math.cos(a) * 0.06, Math.sin(a) * 0.06), 0.53),
        0.005,
        '#4a3322',
      );
    }
    door(l, mx, mz, 0.24, 0.24, '+z', 0, 0.03, 0.06, 0.1, '#2a1c12');
    for (const y of [0.2, 0.32, 0.44])
      window4(l, mx, mz, 0.2 - (y - 0.2) * 0.3, 0.2, '+z', 0, y, 0.034, { shutters: '#2f5a3a' });
    wround(l, mx, mz, 0.07, 0.08, 0.5, 0.02, '#4a3322', 8);
    millHead(l, mx, mz, 0.52, 0.075, 0.36, true);
    // Miller's cottage with a thatched roof, a stone wall and a kitchen garden.
    boardBody(l, 0.8, 0.66, 0.22, 0.18, 0.03, 0.09, '#a58a62');
    window4(l, 0.8, 0.66, 0.22, 0.18, '+z', 0.05, 0.07, 0.03, { shutters: '#3f5a3a' });
    door(l, 0.8, 0.66, 0.22, 0.18, '+z', -0.05, 0.03, 0.04, 0.07, timber);
    shingleGable(l, 0.8, 0.66, 'x', 0.22, 0.18, 0.12, 0.07, '#b9a064', '#a58a62');
    stack(l, ...off(l, 0.8, 0.66, 0.08, -0.04), 0.12, 0.1, 0.014, '#8f8a80', 2);
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 6; i++)
        l.shape(
          new THREE.ConeGeometry(0.01, 0.03, 5),
          '#4f9a3a',
          0.58 + i * 0.03,
          0.86 + r * 0.03,
          0.05,
        );
    wbox(l, 0.66, 0.88, 0.034, 0.2, 0.012, 0.1, '#5a3e2a');
    // Cart of sacks, miller, a hoist beam on the gallery, hens and a dog.
    sacks(l, 0.2, 0.78, 5);
    wbox(l, 0.16, 0.66, 0.07, 0.15, 0.012, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.16, 0.66, 0, t * 0.04), 0.036, 0.026, 0.006, '#2c2a28');
    sacks(l, 0.16, 0.66, 4, 0.08);
    horse(l, 0.28, 0.7, 0.3, '#7a4a2a');
    ladder(l, mx, mz, 0.034, 0.1, '+z', '#6b4a2a');
    barrel(l, 0.64, 0.5);
    barrel(l, 0.68, 0.54);
    flowerRow(l, ...off(l, 0.8, 0.66, 0, 0.12), 0.2, '#f0c24a', 7);
    rainButt(l, ...off(l, 0.8, 0.66, 0.13, 0.06));
    cypress(l, 0.07, 0.12, 0.26);
    cypress(l, 0.94, 0.2, 0.22);
    cat(l, ...off(l, 0.8, 0.66, 0.0, 0.1), 0.034, '#3a3a3c');
    dog(l, 0.4, 0.74, 0.4);
    birds(l, [
      [0.54, 0.6, 0.034],
      [0.6, 0.62, 0.034],
      [0.44, 0.4, 0.62],
    ]);
    butterflies(l, [[0.24, 0.22, 0.1]]);
    workers(l, [
      [0.36, 0.6, '#8a4a3a', '#d9c38a'],
      [0.52, 0.74, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.5, 0.15);
  },

  stone_windmill(l) {
    site(l, 'stone_windmill', '#948c72', [0.06, 0.08, 0.96, 0.94]);
    const mx = 0.42;
    const mz = 0.4;
    // Round stone tower mill, whitewashed, tapering, with tall arched openings and a gallery.
    for (let i = 0; i < 9; i++) {
      const r = 0.16 - i * 0.011;
      wround(
        l,
        mx,
        mz,
        r - 0.01,
        r,
        0.03 + i * 0.062,
        0.062,
        tone(i % 2 ? '#e8e0cc' : '#dcd4be', 0.05),
        20,
      );
    }
    for (const y of [0.16, 0.34])
      wround(l, mx, mz, 0.15 - y * 0.2, 0.15 - y * 0.2, y + 0.034, 0.012, '#c9c2ae', 20);
    door(l, mx, mz, 0.28, 0.28, '+z', 0, 0.03, 0.07, 0.12, '#2a1c12', true);
    for (const y of [0.22, 0.36, 0.48])
      wbox(l, ...off(l, mx, mz, 0, 0.12 - (y - 0.22) * 0.1), y, 0.036, 0.06, 0.008, '#4a3322');
    wround(l, mx, mz, 0.17, 0.17, 0.5, 0.012, '#6b4a2a', 20);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      wbox(
        l,
        ...off(l, mx, mz, Math.cos(a) * 0.166, Math.sin(a) * 0.166),
        0.512,
        0.006,
        0.03,
        0.006,
        '#4a3322',
      );
    }
    wround(l, mx, mz, 0.09, 0.1, 0.5, 0.06, '#e8e0cc', 20);
    millHead(l, mx, mz, 0.56, 0.1, 0.42, true);
    // Granary store, a horse-drawn wagon of grain, flour stacked in the yard and a well.
    stoneBody(l, 0.8, 0.62, 0.26, 0.2, 0.03, 0.1, '#a8a294', 0.03);
    shingleGable(l, 0.8, 0.62, 'x', 0.26, 0.2, 0.13, 0.07, '#6b5238', '#a8a294');
    door(l, 0.8, 0.62, 0.26, 0.2, '+z', 0, 0.03, 0.06, 0.08, timber);
    steps(l, ...off(l, 0.8, 0.62, 0, 0.11), 0.07, 2, 0.03);
    wbox(l, 0.2, 0.74, 0.07, 0.18, 0.012, 0.08, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.2, 0.74, 0, t * 0.045), 0.036, 0.028, 0.006, '#2c2a28');
    sacks(l, 0.2, 0.74, 6, 0.08);
    horse(l, 0.36, 0.76, 0.3, '#7a4a2a');
    sacks(l, 0.6, 0.8, 8);
    wround(l, 0.64, 0.5, 0.034, 0.038, 0.03, 0.04, '#9a948a', 10);
    wbox(l, 0.64, 0.5, 0.074, 0.1, 0.008, 0.01, timber);
    for (const t of [-1, 1])
      wbox(l, ...off(l, 0.64, 0.5, t * 0.05, 0), 0.07, 0.006, 0.05, 0.006, timber);
    cobbles(l, 0.3, 0.56, 0.5, 0.64, 18);
    flowerRow(l, ...off(l, 0.8, 0.62, 0, 0.15), 0.2, '#d6455a', 7);
    downpipe(l, ...off(l, 0.8, 0.62, 0.13, 0.1), 0.03, 0.1);
    cypress(l, 0.06, 0.1, 0.26);
    cypress(l, 0.94, 0.9, 0.22);
    cat(l, ...off(l, 0.8, 0.62, 0.08, 0.14), 0.034, '#c27a3a');
    birds(l, [
      [0.54, 0.7, 0.034],
      [0.6, 0.72, 0.034],
      [0.42, 0.4, 0.68],
    ]);
    butterflies(l, [
      [0.2, 0.2, 0.1],
      [0.3, 0.3, 0.12],
    ]);
    workers(l, [
      [0.5, 0.58, '#8a4a3a', '#d9c38a'],
      [0.14, 0.82, '#5a7a9a', '#3a3a3c'],
      [0.7, 0.8, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.9, 0.5, 0.15);
  },

  multi_vane_mill(l) {
    site(l, 'multi_vane_mill', '#8f8a76', [0.04, 0.06, 0.96, 0.94]);
    const mx = 0.4;
    const mz = 0.38;
    // Tall brick tower mill with a stage gallery, a gilded fantail and eight patent sails.
    for (let i = 0; i < 11; i++) {
      const r = 0.15 - i * 0.008;
      wround(l, mx, mz, r - 0.008, r, 0.03 + i * 0.062, 0.062, tone('#9a4a35', 0.14), 20);
    }
    for (const y of [0.2, 0.46])
      wround(l, mx, mz, 0.15 - y * 0.12, 0.15 - y * 0.12, y, 0.014, '#cfc9b9', 20);
    wround(l, mx, mz, 0.2, 0.2, 0.46, 0.012, '#6b4a2a', 24);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      wbox(
        l,
        ...off(l, mx, mz, Math.cos(a) * 0.196, Math.sin(a) * 0.196),
        0.472,
        0.006,
        0.03,
        0.006,
        '#4a3322',
      );
    }
    door(l, mx, mz, 0.26, 0.26, '+z', 0, 0.03, 0.07, 0.12, '#2a1c12', true);
    for (const y of [0.24, 0.34, 0.54])
      wbox(l, ...off(l, mx, mz, 0, 0.12), y, 0.034, 0.06, 0.008, '#ffd27a', 0, 0, 1);
    l.shape(new THREE.CylinderGeometry(0.112, 0.124, 0.04, 20), '#2c2a28', mx, mz, 0.68);
    millHead(l, mx, mz, 0.72, 0.104, 0.5, true);
    // Corn exchange granary with a loading hoist, a brick boiler stack and silos.
    brickBody(l, 0.8, 0.6, 0.26, 0.24, 0.03, 0.14, '#8a4a38');
    windows4(l, 0.8, 0.6, 0.26, 0.24, 0.09, 0.04, { frame: '#d8dde0' });
    cornice(l, 0.8, 0.6, 0.26, 0.24, 0.17, '#cfc9b9');
    tinGable(l, 0.8, 0.6, 'x', 0.26, 0.24, 0.18, 0.08, slate, '#8a4a38');
    door(l, 0.8, 0.6, 0.26, 0.24, '+z', 0, 0.03, 0.08, 0.1, '#2a2a2c');
    wbox(l, ...off(l, 0.8, 0.6, 0.0, 0.14), 0.19, 0.04, 0.04, 0.012, '#2c1a10');
    l.beam(
      pt(off(l, 0.8, 0.6, 0.0, 0.15), 0.23),
      pt(off(l, 0.8, 0.6, 0.0, 0.25), 0.23),
      0.006,
      timber,
    );
    sacks(l, ...off(l, 0.8, 0.6, 0.0, 0.25), 3);
    stack(l, 0.9, 0.46, 0.03, 0.4, 0.024, '#9c5640', 3);
    for (const x of [0.2, 0.3]) {
      wround(l, x, 0.7, 0.04, 0.04, 0.03, 0.2, '#b9b6ae', 14);
      l.dome(x, 0.7, 0.04, 0.04, 0.23, 0.04, '#9a9a9a');
    }
    ladder(l, 0.25, 0.7 + 0.04 / l.spanZ, 0.03, 0.2, '+z');
    // Railway wagon, delivery truck, sacks, workers and a flower border.
    truck(l, 0.56, 0.84, 0, '#e8e4d8');
    sacks(l, 0.64, 0.7, 6);
    sacks(l, 0.1, 0.5, 4);
    cobbles(l, 0.4, 0.58, 0.7, 0.8, 22);
    flowerRow(l, 0.2, 0.9, 0.3, '#f0c24a', 10);
    flowerRow(l, 0.8, 0.9, 0.3, '#d6455a', 10);
    cypress(l, 0.06, 0.12, 0.26);
    cypress(l, 0.94, 0.14, 0.24);
    cat(l, 0.7, 0.72, 0.034, '#3a3a3c');
    birds(l, [
      [0.5, 0.64, 0.034],
      [0.56, 0.66, 0.034],
      [0.4, 0.38, 0.82],
    ]);
    workers(l, [
      [0.5, 0.56, '#8a4a3a', '#d9c38a'],
      [0.36, 0.7, '#5a7a9a', '#3a3a3c'],
      [0.72, 0.68, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.08, 0.56, 0.16);
    lanternPost(l, 0.7, 0.54, 0.16);
  },

  wind_turbine_spire(l) {
    site(l, 'wind_turbine_spire', '#8a8d8a', [0.04, 0.06, 0.96, 0.94]);
    const tx = 0.42;
    const tz = 0.36;
    // Tapered white steel tube tower with a three-blade rotor, nacelle and lit aviation beacon.
    for (let i = 0; i < 12; i++) {
      const r = 0.06 - i * 0.003;
      wround(
        l,
        tx,
        tz,
        r - 0.003,
        r,
        0.03 + i * 0.09,
        0.09,
        i % 6 === 5 ? '#c43c2c' : '#f1f4f2',
        16,
      );
    }
    wround(l, tx, tz, 0.09, 0.1, 0.03, 0.02, '#8a9298', 16);
    door(l, tx, tz, 0.12, 0.12, '+z', 0, 0.03, 0.04, 0.07, '#4a5a64');
    wbox(l, tx, tz, 1.08, 0.07, 0.06, 0.16, '#e8ecea');
    wbox(l, ...off(l, tx, tz, 0, 0.09), 1.1, 0.05, 0.04, 0.03, '#cfd6d9');
    wround(l, ...off(l, tx, tz, 0, 0.12), 0.02, 0.028, 1.09, 0.03, '#cfd6d9', 10);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      const blade = new THREE.BoxGeometry(0.02, 0.36, 0.004);
      blade.translate(0, 0.19, 0);
      blade.rotateZ(a);
      l.shape(blade, '#f4f6f5', ...off(l, tx, tz, 0, 0.13), 1.12);
    }
    l.shape(new THREE.SphereGeometry(0.01, 6, 5), '#ff3a2a', tx, tz, 1.16, 1);
    // Substation: transformer, switchgear cabinet, a lattice pylon, cables and a control hut.
    wbox(l, 0.78, 0.6, 0.03, 0.14, 0.1, 0.1, '#6a7a84');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, 0.78, 0.6, 0.08, -0.04 + i * 0.02), 0.04, 0.012, 0.08, 0.004, '#4a5a64');
    for (const t of [-0.04, 0, 0.04])
      wround(l, ...off(l, 0.78, 0.6, t, 0), 0.006, 0.008, 0.13, 0.06, '#cfe6ee', 8);
    boardBody(l, 0.3, 0.7, 0.16, 0.12, 0.03, 0.08, '#e8e4d8');
    wbox(l, ...off(l, 0.3, 0.7, 0, 0.062), 0.05, 0.05, 0.03, 0.004, '#bfe0e6', 0, 0, 0.6);
    wbox(l, 0.3, 0.7, 0.11, 0.18, 0.008, 0.14, '#9aa4a8');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [0.9 + (a * 0.02) / l.spanX, 0.03, 0.3 + (b * 0.02) / l.spanZ],
        [0.9 + (a * 0.005) / l.spanX, 0.44, 0.3 + (b * 0.005) / l.spanZ],
        0.004,
        '#8a9298',
      );
    l.beam([0.9, 0.4, 0.3], p3([0.78, 0.6], 0.14), 0.002, '#1c1c1c');
    l.beam([0.9, 0.4, 0.3], p3([tx, tz], 0.04), 0.002, '#1c1c1c');
    // Smaller turbines in the background, solar panels and an info board with a bench.
    for (const [x, z, h] of [
      [0.16, 0.14, 0.5],
      [0.9, 0.8, 0.46],
    ] as const) {
      wround(l, x, z, 0.012, 0.018, 0.03, h, '#f1f4f2', 8);
      wbox(l, x, z, 0.03 + h, 0.034, 0.03, 0.06, '#e8ecea');
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.8;
        const blade = new THREE.BoxGeometry(0.01, 0.16, 0.003);
        blade.translate(0, 0.085, 0);
        blade.rotateZ(a);
        l.shape(blade, '#f4f6f5', ...off(l, x, z, 0, 0.034), 0.03 + h + 0.014);
      }
    }
    for (let i = 0; i < 4; i++) {
      wbox(l, 0.14 + i * 0.1, 0.84, 0.05, 0.08, 0.004, 0.06, '#2f4a7a', 0, 0.5);
      wbox(l, 0.14 + i * 0.1, 0.84, 0.034, 0.006, 0.02, 0.006, '#4a4f54');
    }
    bench(l, 0.6, 0.78);
    wbox(l, 0.5, 0.66, 0.034, 0.004, 0.06, 0.004, '#4a4f54');
    wbox(l, 0.5, 0.66, 0.09, 0.07, 0.04, 0.004, '#2f5f86');
    flowerRow(l, 0.5, 0.9, 0.3, '#f0c24a', 10);
    cypress(l, 0.06, 0.4, 0.24);
    birds(
      l,
      [
        [0.56, 0.58, 0.034],
        [0.6, 0.6, 0.034],
        [0.42, 0.34, 1.0],
      ],
      '#f1ece2',
    );
    butterflies(l, [
      [0.3, 0.5, 0.1],
      [0.7, 0.4, 0.12],
    ]);
    workers(l, [
      [0.52, 0.52, '#e8742a', '#f2cf4a'],
      [0.64, 0.66, '#2f5f86', '#3a3a3c'],
      [0.2, 0.62, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.7, 0.8, 0.16);
  },

  // -------------------------------------------------------------------------------------------
  // Bakeries
  // -------------------------------------------------------------------------------------------
  bakery(l) {
    site(l, 'bakery', '#a89270', [0.1, 0.1, 0.92, 0.92]);
    const hx = 0.42;
    const hz = 0.36;
    // Village bakehouse: whitewashed cottage with a thatch-like shingle roof, a big brick oven
    // chimney and a counter hatch under a small awning.
    boardBody(l, hx, hz, 0.34, 0.26, 0.03, 0.12, '#e3d9bf');
    window4(l, hx, hz, 0.34, 0.26, '+z', 0.09, 0.08, 0.036, { shutters: '#b0463a' });
    door(l, hx, hz, 0.34, 0.26, '+z', -0.08, 0.03, 0.05, 0.09, '#5a3a22');
    shingleGable(l, hx, hz, 'x', 0.34, 0.26, 0.15, 0.09, '#b9a064', '#e3d9bf');
    stack(l, ...off(l, hx, hz, 0.12, -0.06), 0.15, 0.14, 0.022, '#9c5640', 1);
    awning(l, ...off(l, hx, hz, 0.09, 0.13), 0.14, 0.1, '#b0463a');
    steps(l, ...off(l, hx, hz, -0.08, 0.14), 0.06, 2, 0.03);
    flowerRow(l, ...off(l, hx, hz, -0.08, 0.2), 0.1, '#f0c24a', 5, 0.03);
    // Outdoor clay oven, bread peel, table of loaves, flour sacks, firewood and a baker's cart.
    oven(l, 0.76, 0.44, 0.03, '#a8503a');
    l.beam(pt([0.74, 0.5], 0.05), pt([0.68, 0.56], 0.045), 0.005, '#8a6a48');
    display(l, 0.7, 0.66, 0.08, 0.16, ['#c98a4a', '#e0a860', '#b87838']);
    sacks(l, 0.18, 0.64, 5);
    for (let i = 0; i < 5; i++)
      wbox(l, 0.9, 0.3 + i * 0.012, 0.034 + i * 0.012, 0.1, 0.01, 0.036, '#a8794a');
    wbox(l, 0.34, 0.78, 0.07, 0.14, 0.012, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.34, 0.78, 0, t * 0.04), 0.036, 0.026, 0.006, '#2c2a28');
    for (let i = 0; i < 4; i++) wbox(l, 0.3 + i * 0.03, 0.78, 0.082, 0.026, 0.016, 0.03, '#c98a4a');
    horse(l, 0.5, 0.8, 0.3, '#8a5a3a');
    barrel(l, 0.14, 0.8);
    rainButt(l, ...off(l, hx, hz, 0.19, 0.0));
    cobbles(l, 0.3, 0.56, 0.62, 0.66, 18);
    cypress(l, 0.07, 0.12, 0.24);
    cypress(l, 0.93, 0.9, 0.2);
    cat(l, ...off(l, hx, hz, 0.0, 0.14), 0.034, '#c27a3a');
    dog(l, 0.6, 0.74, 0.4);
    birds(l, [
      [0.5, 0.6, 0.034],
      [0.56, 0.62, 0.034],
      [0.42, 0.2, 0.15],
    ]);
    butterflies(l, [[0.2, 0.5, 0.1]]);
    workers(l, [
      [0.5, 0.56, '#e8e4d8', '#3a3a3c'],
      [0.64, 0.7, '#5a7a9a', '#d9c38a'],
    ]);
    lanternPost(l, 0.88, 0.6, 0.14);
  },

  market_bakery(l) {
    site(l, 'market_bakery', '#a8946e', [0.08, 0.08, 0.94, 0.94]);
    const hx = 0.42;
    const hz = 0.34;
    // Shopfront bakery: two storeys of cream stucco, a big display window, striped awning,
    // a baker's sign and a brick oven chimney.
    boardBody(l, hx, hz, 0.4, 0.28, 0.03, 0.2, '#efe3c4');
    window4(l, hx, hz, 0.4, 0.28, '+z', 0.12, 0.18, 0.04, { shutters: '#2f5f86' });
    wbox(l, ...off(l, hx, hz, 0.06, 0.142), 0.06, 0.14, 0.07, 0.004, '#bfe0e6', 0, 0, 0.5);
    door(l, hx, hz, 0.4, 0.28, '+z', -0.1, 0.03, 0.05, 0.1, '#2f5f86');
    cornice(l, hx, hz, 0.4, 0.28, 0.226, '#cfc9b9');
    tinGable(l, hx, hz, 'x', 0.4, 0.28, 0.238, 0.08, '#b0463a', '#efe3c4');
    stack(l, ...off(l, hx, hz, 0.14, -0.06), 0.238, 0.14, 0.022, '#9c5640', 1);
    awning(l, ...off(l, hx, hz, 0.06, 0.14), 0.2, 0.1, '#2f5f86');
    wbox(l, ...off(l, hx, hz, -0.14, 0.146), 0.17, 0.12, 0.05, 0.006, '#c9a83a');
    wbox(l, ...off(l, hx, hz, -0.14, 0.15), 0.19, 0.08, 0.034, 0.006, '#e8e4d8');
    steps(l, ...off(l, hx, hz, -0.1, 0.15), 0.07, 2, 0.03);
    // Street display: tables of bread, a chalk board, sack barrels, baskets and bicycles.
    display(l, 0.24, 0.66, 0.08, 0.2, ['#c98a4a', '#e0a860', '#b87838']);
    display(l, 0.56, 0.7, 0.08, 0.2, ['#e8a0a0', '#f0d080', '#c98a4a']);
    wbox(l, 0.4, 0.6, 0.034, 0.006, 0.06, 0.006, '#4a4f54');
    wbox(l, 0.4, 0.6, 0.09, 0.06, 0.05, 0.004, '#2c3134');
    for (let i = 0; i < 3; i++)
      wround(
        l,
        0.8 + (i % 2) * 0.04,
        0.6 + Math.floor(i / 2) * 0.05,
        0.016,
        0.014,
        0.03,
        0.03,
        '#8a6a48',
        8,
      );
    sacks(l, 0.82, 0.8, 5);
    wbox(l, 0.14, 0.8, 0.034, 0.06, 0.06, 0.04, '#8a6a48');
    flowerRow(l, ...off(l, hx, hz, 0.06, 0.2), 0.16, '#f0c24a', 6, 0.03);
    downpipe(l, ...off(l, hx, hz, 0.21, 0.145), 0.03, 0.2);
    cobbles(l, 0.2, 0.5, 0.7, 0.8, 30);
    cypress(l, 0.07, 0.12, 0.26);
    cypress(l, 0.94, 0.12, 0.22);
    cat(l, ...off(l, hx, hz, -0.14, 0.18), 0.03, '#c27a3a');
    birds(l, [
      [0.7, 0.66, 0.034],
      [0.74, 0.68, 0.034],
      [0.42, 0.2, 0.24],
    ]);
    butterflies(l, [[0.3, 0.52, 0.12]]);
    workers(l, [
      [0.34, 0.6, '#e8e4d8', '#3a3a3c'],
      [0.5, 0.62, '#b0463a', '#d9c38a'],
      [0.68, 0.64, '#5a7a9a', '#3a3a3c'],
      [0.18, 0.74, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.1, 0.6, 0.15);
    lanternPost(l, 0.9, 0.6, 0.15);
  },

  guild_bakery(l) {
    site(l, 'guild_bakery', '#a08c6c', [0.06, 0.08, 0.96, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Guildhall bakery: red brick below, half-timbered above, a mansard roof, a big oven
    // chimney and a gilded pretzel sign over the door.
    brickBody(l, hx, hz, 0.5, 0.3, 0.03, 0.12, '#9a4a35');
    boardBody(l, hx, hz, 0.52, 0.32, 0.15, 0.1, '#efe3c4');
    for (let i = 0; i < 7; i++)
      wbox(l, ...off(l, hx, hz, -0.24 + i * 0.08, 0.162), 0.15, 0.008, 0.1, 0.006, '#4a3322');
    windows4(l, hx, hz, 0.5, 0.3, 0.07, 0.04, { frame: '#e3d9bf' });
    windows4(l, hx, hz, 0.52, 0.32, 0.19, 0.04, { shutters: '#2f5a3a' });
    door(l, hx, hz, 0.5, 0.3, '+z', 0, 0.03, 0.06, 0.1, '#4a3322');
    shingleGable(l, hx, hz, 'x', 0.52, 0.32, 0.25, 0.1, '#6a4a38', '#efe3c4');
    for (const sx of [-1, 1])
      stack(l, ...off(l, hx, hz, sx * 0.18, -0.08), 0.25, 0.14, 0.02, '#9c5640', sx > 0 ? 3 : 2);
    wbox(l, ...off(l, hx, hz, 0.0, 0.18), 0.2, 0.06, 0.05, 0.006, '#c9a83a');
    l.shape(
      new THREE.TorusGeometry(0.014, 0.004, 4, 10),
      '#d7af4b',
      ...off(l, hx, hz, 0.0, 0.19),
      0.23,
    );
    steps(l, ...off(l, hx, hz, 0, 0.155), 0.1, 3, 0.03);
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.26, 0.16), 0.03, 0.22);
    flowerRow(l, ...off(l, hx, hz, -0.15, 0.2), 0.14, '#d6455a', 6, 0.03);
    flowerRow(l, ...off(l, hx, hz, 0.15, 0.2), 0.14, '#f0c24a', 6, 0.03);
    // Loading dock with a delivery wagon and horses, flour hoist, bread racks and queue.
    wbox(l, 0.84, 0.46, 0.03, 0.18, 0.04, 0.2, '#8a8a90');
    wbox(l, 0.84, 0.46, 0.07, 0.2, 0.01, 0.22, '#6a6a70');
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.8 + (i % 3) * 0.035,
        0.44 + Math.floor(i / 3) * 0.06,
        0.08,
        0.026,
        0.02,
        0.03,
        '#c98a4a',
      );
    wbox(l, 0.5, 0.84, 0.08, 0.22, 0.016, 0.1, '#8a6a48');
    wbox(l, 0.5, 0.84, 0.096, 0.2, 0.05, 0.09, '#e3d9bf');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.5, 0.84, t * 0.06, 0.056), 0.034, 0.03, 0.008, '#2c2a28');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.5, 0.84, t * 0.06, -0.056), 0.034, 0.03, 0.008, '#2c2a28');
    horse(l, 0.68, 0.84, 0.3, '#7a4a2a');
    horse(l, 0.76, 0.86, 0.3, '#8a5a3a');
    sacks(l, 0.16, 0.7, 6);
    display(l, 0.2, 0.84, 0.08, 0.2, ['#c98a4a', '#e0a860', '#b87838']);
    barrel(l, 0.1, 0.56);
    cobbles(l, 0.2, 0.5, 0.7, 0.72, 34);
    cypress(l, 0.06, 0.12, 0.28);
    cypress(l, 0.94, 0.14, 0.24);
    cat(l, ...off(l, hx, hz, -0.12, 0.17), 0.034, '#3a3a3c');
    dog(l, 0.4, 0.64, 0.4);
    birds(l, [
      [0.62, 0.62, 0.034],
      [0.68, 0.64, 0.034],
      [0.4, 0.2, 0.25],
    ]);
    workers(l, [
      [0.32, 0.6, '#e8e4d8', '#3a3a3c'],
      [0.46, 0.62, '#b0463a', '#d9c38a'],
      [0.58, 0.66, '#5a7a9a', '#3a3a3c'],
      [0.84, 0.6, '#e8e4d8', '#d9c38a'],
    ]);
    lanternPost(l, 0.1, 0.62, 0.16);
    lanternPost(l, 0.62, 0.58, 0.16);
  },

  patisserie_salon(l) {
    site(l, 'patisserie_salon', '#a89678', [0.06, 0.08, 0.96, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Elegant stone patisserie: mansard roof with dormers, a glass conservatory dining room,
    // a striped awning and a pastel frieze.
    stoneBody(l, hx, hz, 0.5, 0.3, 0.03, 0.2, '#efe3d4', 0.03);
    windows4(l, hx, hz, 0.5, 0.3, 0.11, 0.05, { frame: '#f6f0e6' });
    cornice(l, hx, hz, 0.5, 0.3, 0.226, '#d9c2a8');
    for (let i = 0; i < 10; i++)
      wbox(
        l,
        ...off(l, hx, hz, -0.225 + i * 0.05, 0.158),
        0.196,
        0.026,
        0.026,
        0.004,
        ['#f4b8c8', '#bfe0d0', '#f4e08a'][i % 3]!,
      );
    tinGable(l, hx, hz, 'x', 0.5, 0.3, 0.238, 0.1, '#7a8a9a', '#efe3d4');
    for (const t of [-0.15, 0.15]) {
      wbox(l, ...off(l, hx, hz, t, 0.04), 0.3, 0.06, 0.07, 0.07, '#efe3d4');
      wbox(l, ...off(l, hx, hz, t, 0.077), 0.31, 0.034, 0.04, 0.004, '#ffd27a', 0, 0, 1);
      coneRoof(l, ...off(l, hx, hz, t, 0.04), 0.37, 0.05, 0.05, '#7a8a9a');
    }
    door(l, hx, hz, 0.5, 0.3, '+z', 0, 0.03, 0.06, 0.11, '#f4b8c8', true);
    awning(l, ...off(l, hx, hz, 0.0, 0.14), 0.3, 0.12, '#e8a0b0');
    steps(l, ...off(l, hx, hz, 0, 0.18), 0.1, 2, 0.03);
    stack(l, ...off(l, hx, hz, 0.2, -0.08), 0.238, 0.12, 0.02, '#c9a890', 4);
    // Pavement café: round tables with parasols, chairs, flower urns, a cake stand and diners.
    for (const [x, z, c] of [
      [0.24, 0.66, '#e8a0b0'],
      [0.46, 0.7, '#bfe0d0'],
      [0.68, 0.66, '#f4e08a'],
    ] as const) {
      wround(l, x, z, 0.003, 0.003, 0.03, 0.09, '#6a6a70', 6);
      wround(l, x, z, 0.034, 0.034, 0.07, 0.008, '#f1ece2', 12);
      l.shape(new THREE.ConeGeometry(0.06, 0.03, 10), c, x, z, 0.14);
      wround(l, x, z, 0.002, 0.002, 0.06, 0.08, '#6a6a70', 5);
      for (const t of [-1, 1])
        wbox(l, ...off(l, x, z, t * 0.05, 0), 0.03, 0.03, 0.03, 0.03, '#4a4f54');
    }
    for (const x of [0.1, 0.9]) {
      wround(l, x, 0.6, 0.016, 0.012, 0.03, 0.03, '#cfc8b6', 10);
      for (let i = 0; i < 5; i++)
        l.shape(
          new THREE.SphereGeometry(0.01, 6, 5),
          ['#d6455a', '#f4b8c8', '#f0c24a'][i % 3]!,
          x + (i - 2) * 0.01,
          0.6,
          0.076,
        );
    }
    wbox(l, 0.84, 0.8, 0.034, 0.12, 0.05, 0.05, '#8a6a48');
    for (let i = 0; i < 5; i++)
      l.shape(
        new THREE.CylinderGeometry(0.014, 0.014, 0.014, 8),
        ['#f4b8c8', '#bfe0d0', '#f4e08a'][i % 3]!,
        0.8 + i * 0.02,
        0.8,
        0.098,
      );
    flowerRow(l, ...off(l, hx, hz, 0.0, 0.2), 0.34, '#f4b8c8', 10, 0.03);
    cobbles(l, 0.12, 0.54, 0.88, 0.82, 40);
    cypress(l, 0.06, 0.12, 0.28);
    cypress(l, 0.94, 0.14, 0.26);
    cat(l, ...off(l, hx, hz, 0.14, 0.2), 0.034, '#f1ece2');
    dog(l, 0.3, 0.86, 0.4);
    birds(
      l,
      [
        [0.6, 0.6, 0.034],
        [0.64, 0.62, 0.034],
        [0.4, 0.2, 0.25],
      ],
      '#9a9a9a',
    );
    butterflies(l, [
      [0.3, 0.58, 0.12],
      [0.7, 0.6, 0.12],
    ]);
    workers(l, [
      [0.28, 0.62, '#e8a0b0', '#d9c38a'],
      [0.5, 0.66, '#5a7a9a', '#3a3a3c'],
      [0.64, 0.7, '#8a5a8a', '#d9c38a'],
      [0.46, 0.84, '#e8e4d8', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.7, 0.17);
    lanternPost(l, 0.92, 0.7, 0.17);
  },

  royal_confectionery(l) {
    site(l, 'royal_confectionery', '#aa9a80', [0.04, 0.06, 0.96, 0.95]);
    const hx = 0.5;
    const hz = 0.34;
    // Palace of sweets: pale pink stone, white pilasters, a candy-striped dome and clock
    // tower, gilded balustrades and spiralling candy-cane columns at the entrance.
    stoneBody(l, hx, hz, 0.56, 0.3, 0.03, 0.24, '#f4d9d6', 0.03);
    windows4(l, hx, hz, 0.56, 0.3, 0.12, 0.054, { frame: '#fff6f0' });
    cornice(l, hx, hz, 0.56, 0.3, 0.27, '#fff6f0');
    for (let i = 0; i < 12; i++)
      wbox(l, ...off(l, hx, hz, -0.26 + i * 0.047, 0.15), 0.29, 0.008, 0.028, 0.008, '#d7af4b');
    wbox(l, ...off(l, hx, hz, 0, 0.15), 0.32, 0.56, 0.006, 0.006, '#d7af4b');
    for (let i = 0; i < 4; i++) {
      const [px, pz] = off(l, hx, hz, -0.12 + i * 0.08, 0.19);
      wround(l, px, pz, 0.014, 0.016, 0.03, 0.2, i % 2 ? '#fff6f0' : '#e8607a', 10);
      for (let k = 0; k < 5; k++)
        wround(l, px, pz, 0.016, 0.016, 0.05 + k * 0.04, 0.008, '#fff6f0', 10);
    }
    wbox(l, ...off(l, hx, hz, 0, 0.19), 0.24, 0.3, 0.016, 0.08, '#fff6f0');
    tinGable(l, ...off(l, hx, hz, 0, 0.19), 'x', 0.3, 0.08, 0.256, 0.06, '#e8607a', '#f4d9d6');
    door(l, hx, hz, 0.56, 0.3, '+z', 0, 0.03, 0.08, 0.14, '#7a3a4a', true);
    steps(l, ...off(l, hx, hz, 0, 0.24), 0.3, 4, 0.03);
    // Dome with candy stripes and a gold swirl finial; clock tower beside it.
    wround(l, hx, hz, 0.12, 0.13, 0.27, 0.12, '#fff6f0', 24);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.128, Math.sin(a) * 0.128),
        0.31,
        0.03,
        0.05,
        0.004,
        '#ffd27a',
        -a,
        0,
        1,
      );
    }
    l.dome(hx, hz, 0.12, 0.12, 0.39, 0.2, '#e8607a');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      l.beam(
        pt(off(l, hx, hz, Math.cos(a) * 0.118, Math.sin(a) * 0.118), 0.395),
        pt(off(l, hx, hz, Math.cos(a) * 0.02, Math.sin(a) * 0.02), 0.58),
        0.005,
        '#fff6f0',
      );
    }
    wround(l, hx, hz, 0.008, 0.014, 0.58, 0.07, '#d7af4b', 8);
    gear(l, hx, hz, 0.66, 0.022, '#d7af4b');
    brickBody(l, 0.84, 0.3, 0.14, 0.14, 0.03, 0.4, '#f4d9d6');
    for (const [dx, dz, w, d] of [
      [0, 0.074, 0.08, 0.006],
      [0, -0.074, 0.08, 0.006],
      [0.074, 0, 0.006, 0.08],
      [-0.074, 0, 0.006, 0.08],
    ] as const)
      wbox(l, ...off(l, 0.84, 0.3, dx, dz), 0.34, w, 0.08, d, '#fff2c4', 0, 0, 1);
    coneRoof(l, 0.84, 0.3, 0.43, 0.1, 0.22, '#e8607a');
    // Forecourt: three-tier sugar fountain, gilded carriage with white horses, topiary
    // lollipops, flower beds, strolling children and a cake-trolley vendor.
    wround(l, 0.5, 0.72, 0.1, 0.11, 0.03, 0.03, '#fff6f0', 20);
    wround(l, 0.5, 0.72, 0.088, 0.088, 0.058, 0.004, '#f4b8c8', 20);
    wround(l, 0.5, 0.72, 0.014, 0.018, 0.058, 0.08, '#fff6f0', 8);
    wround(l, 0.5, 0.72, 0.05, 0.036, 0.136, 0.012, '#fff6f0', 14);
    wround(l, 0.5, 0.72, 0.01, 0.014, 0.148, 0.04, '#fff6f0', 8);
    l.shape(new THREE.SphereGeometry(0.022, 8, 6), '#e8607a', 0.5, 0.72, 0.2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.5, 0.72, Math.cos(a) * 0.04, Math.sin(a) * 0.04),
        0.15,
        0.004,
        0.02,
        0.004,
        '#f4b8c8',
        a,
      );
    }
    wbox(l, 0.18, 0.8, 0.07, 0.14, 0.03, 0.08, '#d7af4b');
    wbox(l, 0.18, 0.8, 0.1, 0.1, 0.05, 0.07, '#e8607a');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.18, 0.8, t * 0.04, 0.05), 0.034, 0.03, 0.006, '#d7af4b');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.18, 0.8, t * 0.04, -0.05), 0.034, 0.03, 0.006, '#d7af4b');
    horse(l, 0.3, 0.8, 0.3, '#f1ece2');
    horse(l, 0.36, 0.84, 0.3, '#f1ece2');
    for (const [x, z] of [
      [0.1, 0.58],
      [0.9, 0.58],
      [0.1, 0.9],
      [0.9, 0.9],
    ] as const) {
      wround(l, x, z, 0.003, 0.003, 0.03, 0.08, '#6b4a2a', 5);
      l.shape(new THREE.SphereGeometry(0.03, 8, 6), '#e8607a', x, z, 0.14);
    }
    flowerRow(l, 0.26, 0.58, 0.2, '#f4b8c8', 8);
    flowerRow(l, 0.74, 0.58, 0.2, '#f4e08a', 8);
    wbox(l, 0.8, 0.8, 0.034, 0.1, 0.04, 0.04, '#8a6a48');
    wbox(l, 0.8, 0.8, 0.074, 0.12, 0.008, 0.05, '#fff6f0');
    for (let i = 0; i < 4; i++)
      l.shape(
        new THREE.SphereGeometry(0.014, 7, 6),
        ['#f4b8c8', '#bfe0d0', '#f4e08a', '#e8607a'][i]!,
        0.77 + i * 0.02,
        0.8,
        0.096,
      );
    cobbles(l, 0.2, 0.56, 0.8, 0.9, 42, 0.034, '#e8d6d0');
    cypress(l, 0.06, 0.12, 0.28);
    cat(l, ...off(l, hx, hz, 0.22, 0.24), 0.034, '#f1ece2');
    birds(
      l,
      [
        [0.6, 0.6, 0.034],
        [0.64, 0.62, 0.034],
        [0.5, 0.18, 0.28],
      ],
      '#f1ece2',
    );
    butterflies(l, [
      [0.3, 0.66, 0.14],
      [0.7, 0.66, 0.14],
      [0.5, 0.58, 0.16],
    ]);
    workers(l, [
      [0.62, 0.64, '#e8607a', '#d9c38a'],
      [0.4, 0.62, '#2f5f86', '#3a3a3c'],
      [0.74, 0.86, '#e8e4d8', '#3a3a3c'],
      [0.24, 0.66, '#8a5a8a', '#d9c38a'],
    ]);
    lanternPost(l, 0.3, 0.6, 0.18);
    lanternPost(l, 0.7, 0.6, 0.18);
  },
};
