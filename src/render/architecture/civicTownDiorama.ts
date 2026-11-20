import * as THREE from 'three';
import {
  barrel,
  boardBody,
  chimney,
  crate,
  cypress,
  door,
  halfTimber,
  horse,
  lanternPost,
  off,
  orchardTree,
  renderBody,
  shingleGable,
  shrub,
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
  ivy,
  planter,
  pt,
  rainButt,
  steps,
} from './dioramaDetails';
import { dog } from './dioramaProps';
import { site } from './industryDiorama';
import { workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 3C (part 1), drawn as dioramas on 2x2 lots (see `zoomed` in architectureModels.ts):
//   market -> covered_market -> grand_bazaar
//   tavern -> guild_tavern    -> grand_inn
//   chapel -> parish_church   -> sanctuary_chapel
//   clinic -> infirmary       -> medical_hall

const timber = '#5c3f27';
const stone = '#cfc6b2';
const copper = '#5a9c8a';

/** Square or octagonal spire on top of a tower. */
function spire(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  h: number,
  color: string,
  sides = 4,
): void {
  const cone = new THREE.ConeGeometry(r, h, sides);
  if (sides === 4) cone.rotateY(Math.PI / 4);
  l.shape(cone, color, x, z, y + h / 2);
}

/** Open market stall: four posts, a counter with produce and a striped awning facing +z. */
function stall(
  l: Lot,
  x: number,
  z: number,
  w: number,
  c1: string,
  goods: readonly string[],
  y = 0.03,
): void {
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      wbox(l, ...off(l, x, z, sx * (w / 2 - 0.004), sz * 0.03), y, 0.006, 0.1, 0.006, timber);
  wbox(l, x, z, y + 0.03, w, 0.012, 0.045, '#8a6a48');
  const n = Math.max(3, Math.round(w / 0.03));
  for (let i = 0; i < n; i++)
    wbox(
      l,
      ...off(l, x, z, -w / 2 + (i + 0.5) * (w / n), 0),
      y + 0.1,
      w / n,
      0.006,
      0.08,
      i % 2 ? '#f1ece2' : c1,
      0,
      0.18,
    );
  for (let i = 0; i < Math.round(w / 0.024); i++)
    l.shape(
      new THREE.SphereGeometry(0.0095, 6, 5),
      goods[i % goods.length]!,
      ...off(l, x, z, -w / 2 + 0.014 + i * 0.024, 0),
      y + 0.048,
    );
}

/** Row of round-arched openings along a wall facing +z (columns and dark arches). */
function arcade(l: Lot, x: number, z: number, w: number, y: number, h: number, n: number): void {
  for (let i = 0; i <= n; i++)
    wbox(l, ...off(l, x, z, -w / 2 + (i * w) / n, 0), y, 0.012, h, 0.014, tone(stone, 0.05));
  for (let i = 0; i < n; i++) {
    const px = -w / 2 + ((i + 0.5) * w) / n;
    wbox(l, ...off(l, x, z, px, -0.003), y, w / n - 0.014, h * 0.78, 0.004, '#3a3530');
    wround(
      l,
      ...off(l, x, z, px, 0),
      (w / n - 0.014) / 2,
      (w / n - 0.014) / 2,
      y + h * 0.78,
      0.006,
      '#3a3530',
      8,
    );
  }
  wbox(l, x, z, y + h, w + 0.016, 0.012, 0.022, tone(stone, 0.04));
}

/** Gravestones and a few mounds, laid out in rows inside a rectangle. */
function graves(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  cols: number,
  rows: number,
): void {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const px = x0 + ((c + 0.5) * (x1 - x0)) / cols;
      const pz = z0 + ((r + 0.5) * (z1 - z0)) / rows;
      wbox(l, px, pz, 0.03, 0.01, 0.026 + ((c + r) % 3) * 0.006, 0.004, '#9a958a');
      wbox(l, ...off(l, px, pz, 0, -0.016), 0.03, 0.01, 0.006, 0.026, '#6e8c4e');
    }
}

/** Glowing red-cross sign mounted on a wall facing +z. */
function redCross(l: Lot, x: number, z: number, y: number, s = 0.04): void {
  wbox(l, x, z, y, s, s, 0.006, '#f4f1ea');
  wbox(l, ...off(l, x, z, 0, 0.004), y + s * 0.18, s * 0.64, s * 0.2, 0.004, '#c23b3b');
  wbox(l, ...off(l, x, z, 0, 0.004), y + s * 0.18, s * 0.2, s * 0.64, 0.004, '#c23b3b');
}

/** Hanging inn sign on an iron bracket facing +z. */
function innSign(l: Lot, x: number, z: number, y: number, color: string): void {
  l.beam(pt([x, z], y + 0.03), pt(off(l, x, z, 0.05, 0), y + 0.03), 0.004, '#2c3134');
  wbox(l, ...off(l, x, z, 0.04, 0), y - 0.005, 0.03, 0.034, 0.006, color);
  wbox(l, ...off(l, x, z, 0.04, 0.004), y + 0.006, 0.016, 0.012, 0.004, '#f0c24a');
}

/** Stained-glass rose window on a wall facing +z. */
function roseWindow(l: Lot, x: number, z: number, y: number, r: number): void {
  wround(l, ...off(l, x, z, 0, 0.002), r, r, y, 0.006, '#e8e0cc', 12);
  wround(l, ...off(l, x, z, 0, 0.005), r * 0.75, r * 0.75, y, 0.006, '#3f6fa8', 12);
  wbox(l, ...off(l, x, z, 0, 0.007), y + r * 0.75, 0.004, r * 0.1, r * 1.5, '#e8e0cc');
  wbox(l, ...off(l, x, z, 0, 0.007), y + r * 0.75, r * 1.5, r * 0.1, 0.004, '#e8e0cc');
}

/** Lancet windows in a row on one wall. */
function lancets(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  face: '+z' | '+x',
  n: number,
  y: number,
): void {
  for (let i = 0; i < n; i++) {
    const t = -0.5 + (i + 0.5) / n;
    const along = face === '+z' ? w : d;
    window4(l, x, z, w, d, face, t * along * 0.85, y, 0.034, { frame: '#e8e0cc' });
  }
}

export const civicTownDiorama: Recipes = {
  // =========================================================================================
  // Market chain
  // =========================================================================================

  market(l) {
    site(l, 'market', '#b7a47e', [0.06, 0.06, 0.94, 0.94]);
    cobbles(l, 0.1, 0.1, 0.9, 0.9, 60, 0.03, '#a89a7c');
    // A square of open-air stalls around a pump, each with its own awning colour and goods.
    stall(l, 0.26, 0.24, 0.2, '#b0463a', ['#d6455a', '#e8d65a', '#6fa84a']);
    stall(l, 0.56, 0.24, 0.2, '#3f6b8a', ['#e8a23a', '#c9783a', '#e8d65a']);
    stall(l, 0.82, 0.3, 0.16, '#4f8a4a', ['#6fa84a', '#8cc04a', '#d6455a']);
    stall(l, 0.2, 0.7, 0.2, '#c9a23a', ['#e8e4d8', '#c98a4a', '#e0a860']);
    stall(l, 0.8, 0.74, 0.2, '#8a4a8a', ['#d9628a', '#a77fd0', '#e8e4d8']);
    // Stone pump with a trough in the middle of the square.
    wround(l, 0.5, 0.52, 0.03, 0.034, 0.03, 0.036, '#9a958a', 10);
    wbox(l, 0.5, 0.52, 0.066, 0.012, 0.06, 0.012, '#4a4f54');
    wbox(l, 0.54, 0.54, 0.03, 0.1, 0.022, 0.034, '#7a5a3a');
    wbox(l, 0.54, 0.54, 0.047, 0.09, 0.004, 0.026, '#4d8da6');
    // Hay cart, crates, barrels, a notice board and the market crier's bench.
    wbox(l, 0.42, 0.84, 0.07, 0.14, 0.012, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      wround(l, ...off(l, 0.42, 0.84, 0, t * 0.04), 0.026, 0.026, 0.044, 0.006, '#2c2a28', 8);
    for (let i = 0; i < 4; i++)
      wbox(l, 0.38 + i * 0.026, 0.84, 0.082, 0.02, 0.016, 0.026, '#d6a84a');
    horse(l, 0.58, 0.86, 0.2, '#8a5a3a');
    for (let i = 0; i < 4; i++)
      crate(
        l,
        0.1 + (i % 2) * 0.04,
        0.46 + Math.floor(i / 2) * 0.04,
        0.03,
        i % 2 ? '#d6455a' : '#6fa84a',
      );
    barrel(l, 0.92, 0.5);
    barrel(l, 0.89, 0.54);
    wbox(l, 0.1, 0.9, 0.03, 0.02, 0.1, 0.006, '#5c3f27');
    wbox(l, 0.1, 0.9, 0.1, 0.06, 0.04, 0.008, '#e8e0cc');
    bench(l, 0.7, 0.54, 0.03, 0);
    lanternPost(l, 0.38, 0.4, 0.14);
    lanternPost(l, 0.68, 0.64, 0.14);
    cypress(l, 0.05, 0.08, 0.22);
    orchardTree(l, 0.93, 0.1, 0.2, '#d6455a');
    workers(l, [
      [0.4, 0.4, '#b0463a', '#d9c38a'],
      [0.6, 0.4, '#5a7a9a', '#3a3a3c'],
      [0.34, 0.58, '#7a9a5a', '#d9c38a'],
      [0.66, 0.5, '#9a5a7a', '#3a3a3c'],
      [0.46, 0.7, '#e8e4d8', '#8a6a3a'],
    ]);
    birds(l, [
      [0.5, 0.64, 0.03],
      [0.54, 0.66, 0.03],
      [0.3, 0.34, 0.03],
    ]);
    dog(l, 0.74, 0.64, 0.6);
    cat(l, 0.14, 0.58, 0.03);
  },

  covered_market(l) {
    site(l, 'covered_market', '#b0a284', [0.06, 0.06, 0.94, 0.94]);
    cobbles(l, 0.1, 0.5, 0.9, 0.92, 40, 0.03, '#a89a7c');
    const hx = 0.46;
    const hz = 0.32;
    // Open timber market hall: raised floor, two rows of posts, tiled hall roof with a clerestory
    // lantern and a bell, with trading tables between the posts.
    wbox(l, hx, hz, 0.03, 0.66, 0.02, 0.34, '#8a7a62');
    for (const sx of [-0.28, -0.14, 0, 0.14, 0.28])
      for (const sz of [-0.13, 0.13]) {
        wbox(l, ...off(l, hx, hz, sx, sz), 0.05, 0.012, 0.15, 0.012, timber);
        wbox(l, ...off(l, hx, hz, sx, sz), 0.05, 0.024, 0.014, 0.024, '#7a7468');
      }
    for (const sz of [-0.13, 0.13])
      wbox(l, ...off(l, hx, hz, 0, sz), 0.195, 0.66, 0.016, 0.02, timber);
    tinGable(l, hx, hz, 'x', 0.72, 0.42, 0.21, 0.13, '#b84e35', '#e8d6b0');
    wbox(l, hx, hz, 0.3, 0.3, 0.05, 0.08, '#d9ccb0');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        ...off(l, hx, hz, -0.12 + i * 0.08, 0.042),
        0.31,
        0.036,
        0.03,
        0.004,
        '#f5be42',
        0,
        0,
        0.5,
      );
    tinGable(l, hx, hz, 'x', 0.34, 0.12, 0.35, 0.05, '#9a3e2a');
    wround(l, hx, hz, 0.012, 0.016, 0.4, 0.02, '#c9a23a', 8);
    // Trading tables inside the hall with cloth, produce, scales and keepers.
    for (const [tx, goods] of [
      [-0.2, ['#e8e4d8', '#c98a4a']],
      [0, ['#d6455a', '#e8d65a']],
      [0.2, ['#6fa84a', '#8cc04a']],
    ] as const) {
      wbox(l, ...off(l, hx, hz, tx, 0), 0.05, 0.12, 0.012, 0.05, '#8a6a48');
      wbox(l, ...off(l, hx, hz, tx, 0), 0.062, 0.12, 0.004, 0.054, goods[0]);
      for (let i = 0; i < 4; i++)
        l.shape(
          new THREE.SphereGeometry(0.01, 6, 5),
          goods[i % 2]!,
          ...off(l, hx, hz, tx - 0.04 + i * 0.026, 0),
          0.075,
        );
    }
    workers(l, [
      [0.36, 0.38, '#b0463a', '#d9c38a'],
      [0.52, 0.28, '#5a7a9a', '#3a3a3c'],
      [0.66, 0.4, '#7a9a5a', '#d9c38a'],
      [0.28, 0.56, '#e8e4d8', '#8a6a3a'],
    ]);
    // Brick toll office, outdoor stalls under awnings, a fountain, carts and lanterns.
    renderBody(l, 0.86, 0.2, 0.18, 0.2, 0.03, 0.16, '#d9c8a0', '#8a6a48');
    window4(l, 0.86, 0.2, 0.18, 0.2, '+z', 0.03, 0.09, 0.034, { shutters: '#3f6b8a' });
    door(l, 0.86, 0.2, 0.18, 0.2, '+z', -0.04, 0.03, 0.04, 0.08, '#5a3a22');
    shingleGable(l, 0.86, 0.2, 'x', 0.18, 0.2, 0.19, 0.07, '#8a4a38', '#d9c8a0');
    chimney(l, 0.9, 0.16, 0.2, 0.1);
    stall(l, 0.2, 0.68, 0.2, '#b0463a', ['#d6455a', '#e8d65a', '#6fa84a']);
    stall(l, 0.5, 0.74, 0.2, '#3f6b8a', ['#e8a23a', '#c9783a']);
    stall(l, 0.8, 0.7, 0.18, '#4f8a4a', ['#6fa84a', '#8cc04a']);
    wround(l, 0.5, 0.56, 0.044, 0.05, 0.03, 0.03, '#9a958a', 12);
    wround(l, 0.5, 0.56, 0.02, 0.026, 0.06, 0.03, '#b0aca0', 10);
    wround(l, 0.5, 0.56, 0.04, 0.04, 0.056, 0.004, '#4d8da6', 12);
    wbox(l, 0.1, 0.9, 0.07, 0.14, 0.012, 0.07, '#8a6a48');
    for (const t of [-1, 1])
      wround(l, ...off(l, 0.1, 0.9, 0, t * 0.04), 0.026, 0.026, 0.044, 0.006, '#2c2a28', 8);
    horse(l, 0.26, 0.9, 0.2, '#6a4a2a');
    barrel(l, 0.9, 0.9);
    crate(l, 0.82, 0.9, 0.03, '#d6455a');
    lanternPost(l, 0.3, 0.52, 0.14);
    lanternPost(l, 0.7, 0.52, 0.14);
    flowerRow(l, 0.62, 0.9, 0.2, '#e24864', 6, 0.03);
    cypress(l, 0.06, 0.1, 0.22);
    birds(l, [
      [0.54, 0.6, 0.03],
      [0.4, 0.64, 0.03],
      [0.3, 0.1, 0.21],
    ]);
    dog(l, 0.64, 0.6, 0.5);
  },

  grand_bazaar(l) {
    site(l, 'grand_bazaar', '#c4b8a0', [0.04, 0.04, 0.96, 0.96]);
    cobbles(l, 0.08, 0.6, 0.92, 0.94, 50, 0.03, '#b0a890');
    const hx = 0.5;
    const hz = 0.3;
    // Stone-and-iron bazaar: a long two-storey arcaded range, a glass-vaulted central hall with
    // copper ribs, a clock tower over the entrance and a plaza with fountain and stalls.
    stoneBody(l, hx, hz, 0.82, 0.3, 0.03, 0.2, '#dfd4be', 0.04);
    cornice(l, hx, hz, 0.82, 0.3, 0.23, '#cfc6b2');
    arcade(l, hx, hz + 0.15, 0.78, 0.03, 0.1, 9);
    for (let i = 0; i < 8; i++)
      window4(l, hx, hz, 0.82, 0.3, '+z', -0.34 + i * 0.097, 0.16, 0.03, { shutters: '#3f6e72' });
    tinGable(l, hx - 0.28, hz, 'x', 0.22, 0.3, 0.245, 0.06, '#3f6e72', '#dfd4be');
    tinGable(l, hx + 0.28, hz, 'x', 0.22, 0.3, 0.245, 0.06, '#3f6e72', '#dfd4be');
    // Central glass hall.
    wbox(l, hx, hz, 0.24, 0.3, 0.1, 0.26, '#d9ccb0');
    l.dome(hx, hz, 0.15, 0.13, 0.34, 0.12, '#7fb5b8');
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * Math.PI;
      l.beam(
        pt(off(l, hx, hz, -Math.cos(a) * 0.15, 0), 0.34 + Math.sin(a) * 0.01),
        pt(off(l, hx, hz, 0, 0), 0.46),
        0.004,
        copper,
      );
    }
    wround(l, hx, hz, 0.012, 0.018, 0.46, 0.03, copper, 8);
    // Clock tower over the entrance.
    renderBody(l, hx, hz + 0.1, 0.1, 0.08, 0.2, 0.2, '#e8dec8', '#cfc6b2');
    wround(l, ...off(l, hx, hz + 0.1, 0, 0.042), 0.026, 0.026, 0.34, 0.006, '#f4f0e6', 12);
    wbox(l, ...off(l, hx, hz + 0.1, 0, 0.046), 0.358, 0.004, 0.02, 0.004, '#2c3134');
    wbox(l, ...off(l, hx, hz + 0.1, 0, 0.046), 0.358, 0.014, 0.004, 0.004, '#2c3134');
    spire(l, hx, hz + 0.1, 0.4, 0.07, 0.12, copper);
    // Plaza: fountain, stalls, carriage, shoppers and lanterns.
    wround(l, 0.5, 0.68, 0.07, 0.075, 0.03, 0.03, '#b0aca0', 14);
    wround(l, 0.5, 0.68, 0.06, 0.06, 0.05, 0.006, '#4d8da6', 14);
    wround(l, 0.5, 0.68, 0.012, 0.016, 0.05, 0.05, '#c9c4b6', 8);
    wround(l, 0.5, 0.68, 0.03, 0.01, 0.1, 0.012, '#c9c4b6', 10);
    stall(l, 0.2, 0.74, 0.2, '#b0463a', ['#d6455a', '#e8d65a', '#6fa84a']);
    stall(l, 0.8, 0.74, 0.2, '#3f6b8a', ['#e8a23a', '#c9783a']);
    stall(l, 0.16, 0.9, 0.16, '#c9a23a', ['#e8e4d8', '#c98a4a']);
    stall(l, 0.86, 0.9, 0.16, '#8a4a8a', ['#d9628a', '#a77fd0']);
    wbox(l, 0.5, 0.9, 0.08, 0.2, 0.05, 0.1, '#3a4a6a');
    wbox(l, 0.5, 0.9, 0.13, 0.22, 0.012, 0.12, '#2c3a5a');
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        wround(l, ...off(l, 0.5, 0.9, sx * 0.08, sz * 0.06), 0.02, 0.02, 0.04, 0.006, '#2c2a28', 8);
    horse(l, 0.36, 0.9, 0.2, '#f0eadb');
    horse(l, 0.64, 0.92, 0.2, '#f0eadb');
    for (const lx of [0.3, 0.7]) lanternPost(l, lx, 0.58, 0.16);
    planter(l, 0.08, 0.58, 0.14);
    planter(l, 0.92, 0.58, 0.14);
    flowerRow(l, 0.5, 0.52, 0.5, '#e24864', 10, 0.03);
    orchardTree(l, 0.06, 0.1, 0.2, '#f0a23a');
    orchardTree(l, 0.94, 0.1, 0.2, '#f0a23a');
    workers(l, [
      [0.38, 0.62, '#b0463a', '#d9c38a'],
      [0.62, 0.64, '#5a7a9a', '#3a3a3c'],
      [0.3, 0.8, '#7a9a5a', '#d9c38a'],
      [0.7, 0.82, '#9a5a7a', '#3a3a3c'],
      [0.44, 0.76, '#e8e4d8', '#8a6a3a'],
      [0.56, 0.5, '#d9b14a', '#3a3a3c'],
    ]);
    birds(l, [
      [0.44, 0.72, 0.03],
      [0.58, 0.74, 0.03],
      [0.5, 0.48, 0.03],
    ]);
    dog(l, 0.72, 0.66, 0.4);
    butterflies(l, [[0.3, 0.55, 0.1]]);
  },

  // =========================================================================================
  // Tavern chain
  // =========================================================================================

  tavern(l) {
    site(l, 'tavern', '#a89270', [0.08, 0.1, 0.92, 0.92]);
    const hx = 0.42;
    const hz = 0.36;
    // Roadside alehouse: low timber-framed house with a shingle roof, a hanging sign, a yard of
    // benches and barrels, a hitching rail and a stable lean-to.
    halfTimber(l, hx, hz, 0.4, 0.28, 0.03, 0.13, '#e3d9bf');
    window4(l, hx, hz, 0.4, 0.28, '+z', 0.12, 0.08, 0.036, { shutters: '#3f6b8a' });
    window4(l, hx, hz, 0.4, 0.28, '+z', -0.12, 0.08, 0.036, { shutters: '#3f6b8a' });
    door(l, hx, hz, 0.4, 0.28, '+z', 0, 0.03, 0.05, 0.09, '#5a3a22');
    steps(l, ...off(l, hx, hz, 0, 0.15), 0.06, 2, 0.03);
    shingleGable(l, hx, hz, 'x', 0.4, 0.28, 0.16, 0.1, '#7a4a34', '#e3d9bf');
    chimney(l, ...off(l, hx, hz, 0.14, -0.04), 0.22, 0.1);
    innSign(l, ...off(l, hx, hz, 0.2, 0.15), 0.13, '#6e2f22');
    // Stable lean-to and hitching rail with a horse.
    wbox(l, 0.84, 0.38, 0.03, 0.18, 0.1, 0.26, '#7a5a3a');
    tinGable(l, 0.84, 0.38, 'z', 0.26, 0.2, 0.13, 0.05, '#6a4a34');
    horse(l, 0.7, 0.62, 1.2, '#7a4a2a');
    wbox(l, 0.76, 0.66, 0.05, 0.2, 0.008, 0.008, '#5c3f27');
    for (const sx of [-1, 1]) wbox(l, 0.76 + sx * 0.09, 0.66, 0.03, 0.008, 0.04, 0.008, '#5c3f27');
    // Yard tables, mugs, barrels and a woodpile.
    for (const [tx, tz] of [
      [0.2, 0.66],
      [0.42, 0.74],
    ] as const) {
      wbox(l, tx, tz, 0.06, 0.1, 0.008, 0.06, '#8a6a48');
      for (const s of [-1, 1]) wbox(l, tx + s * 0.04, tz, 0.03, 0.008, 0.03, 0.05, '#6b4a2a');
      bench(l, tx, tz + 0.06, 0.03, 0);
      for (const s of [-1, 1])
        wround(l, tx + s * 0.02, tz, 0.005, 0.005, 0.068, 0.01, '#d9c38a', 6);
    }
    barrel(l, 0.12, 0.34);
    barrel(l, 0.12, 0.42);
    barrel(l, 0.2, 0.52);
    rainButt(l, ...off(l, hx, hz, -0.21, 0.04));
    for (let i = 0; i < 4; i++)
      wbox(l, 0.9, 0.7 + i * 0.012, 0.034 + i * 0.012, 0.1, 0.01, 0.036, '#a8794a');
    cobbles(l, 0.3, 0.54, 0.6, 0.84, 22);
    lanternPost(l, 0.62, 0.52, 0.14);
    cypress(l, 0.07, 0.1, 0.22);
    flowerRow(l, ...off(l, hx, hz, -0.14, 0.17), 0.1, '#f0c24a', 5, 0.03);
    cat(l, ...off(l, hx, hz, 0.12, 0.16), 0.034, '#c27a3a');
    dog(l, 0.32, 0.84, 0.3);
    workers(l, [
      [0.3, 0.62, '#b0463a', '#d9c38a'],
      [0.5, 0.68, '#5a7a9a', '#3a3a3c'],
      [0.54, 0.84, '#7a9a5a', '#8a6a3a'],
    ]);
    birds(l, [
      [0.7, 0.74, 0.03],
      [0.6, 0.78, 0.03],
    ]);
  },

  guild_tavern(l) {
    site(l, 'guild_tavern', '#a89a7c', [0.06, 0.08, 0.94, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Two-storey half-timbered guild house: jettied upper floor, dormers, a carved sign, a cobbled
    // courtyard with long tables and a brewer's dray loaded with casks.
    renderBody(l, hx, hz, 0.46, 0.3, 0.03, 0.14, '#e8dcc0', '#5c3f27');
    halfTimber(l, hx, hz, 0.5, 0.32, 0.17, 0.14, '#e3d6b8');
    cornice(l, hx, hz, 0.46, 0.3, 0.17, '#5c3f27');
    for (const t of [-0.15, 0, 0.15]) {
      window4(l, hx, hz, 0.46, 0.3, '+z', t, 0.09, 0.036, { shutters: '#2f5a3a', flowers: true });
      window4(l, hx, hz, 0.5, 0.32, '+z', t, 0.23, 0.036, { shutters: '#2f5a3a' });
    }
    door(l, hx, hz, 0.46, 0.3, '+z', -0.02, 0.03, 0.05, 0.1, '#4a2f1c');
    steps(l, ...off(l, hx, hz, -0.02, 0.16), 0.07, 3, 0.03);
    shingleGable(l, hx, hz, 'x', 0.52, 0.34, 0.31, 0.13, '#782b29', '#e3d6b8');
    for (const t of [-0.14, 0.14]) {
      wbox(l, ...off(l, hx, hz, t, 0.1), 0.36, 0.06, 0.07, 0.06, '#e3d6b8');
      tinGable(l, ...off(l, hx, hz, t, 0.1), 'z', 0.06, 0.07, 0.43, 0.04, '#782b29');
      wbox(l, ...off(l, hx, hz, t, 0.135), 0.38, 0.03, 0.03, 0.004, '#f5be42', 0, 0, 0.6);
    }
    chimney(l, ...off(l, hx, hz, 0.2, -0.05), 0.4, 0.1);
    chimney(l, ...off(l, hx, hz, -0.2, -0.05), 0.4, 0.1);
    innSign(l, ...off(l, hx, hz, 0.22, 0.17), 0.17, '#2f5a3a');
    // Brewhouse wing with a louvred roof vent.
    boardBody(l, 0.82, 0.3, 0.2, 0.26, 0.03, 0.12, '#8a6342');
    shingleGable(l, 0.82, 0.3, 'z', 0.26, 0.2, 0.15, 0.07, '#5a3a2a', '#8a6342');
    wbox(l, 0.82, 0.3, 0.22, 0.04, 0.05, 0.05, '#5c3f27');
    // Courtyard: long tables with benches, dray with casks, horses, trees and lanterns.
    for (const tz of [0.64, 0.8]) {
      wbox(l, 0.3, tz, 0.065, 0.3, 0.008, 0.05, '#8a6a48');
      for (const s of [-1, 1]) wbox(l, 0.3 + s * 0.13, tz, 0.03, 0.008, 0.035, 0.04, '#6b4a2a');
      bench(l, 0.3, tz - 0.05, 0.03, 0);
      bench(l, 0.3, tz + 0.05, 0.03, 0);
      for (let i = 0; i < 5; i++)
        wround(l, 0.2 + i * 0.05, tz, 0.005, 0.005, 0.073, 0.01, '#d9c38a', 6);
    }
    wbox(l, 0.74, 0.74, 0.07, 0.22, 0.012, 0.1, '#6b4a2a');
    for (const sx of [-1, 1])
      wround(l, ...off(l, 0.74, 0.74, sx * 0.07, 0.056), 0.026, 0.026, 0.044, 0.006, '#2c2a28', 8);
    for (let i = 0; i < 3; i++)
      wround(l, 0.68 + i * 0.06, 0.74, 0.022, 0.022, 0.082, 0.04, '#a8794a', 8);
    horse(l, 0.58, 0.8, 0.1, '#6a4a2a');
    horse(l, 0.58, 0.88, 0.1, '#3a2a1a');
    barrel(l, 0.92, 0.6);
    barrel(l, 0.92, 0.66);
    barrel(l, 0.86, 0.62);
    rainButt(l, ...off(l, hx, hz, -0.25, 0.04));
    orchardTree(l, 0.08, 0.14, 0.24, '#f0a23a');
    cypress(l, 0.94, 0.9, 0.22);
    lanternPost(l, 0.14, 0.58, 0.16);
    lanternPost(l, 0.52, 0.58, 0.16);
    ivy(l, hx, hz, 0.46, 0.3, '+x', 0.0, 0.14);
    cobbles(l, 0.1, 0.56, 0.9, 0.94, 40);
    cat(l, 0.22, 0.54, 0.034, '#bdb6a6');
    dog(l, 0.5, 0.7, 0.2);
    workers(l, [
      [0.24, 0.58, '#b0463a', '#d9c38a'],
      [0.38, 0.72, '#5a7a9a', '#3a3a3c'],
      [0.34, 0.9, '#7a9a5a', '#8a6a3a'],
      [0.7, 0.62, '#9a5a7a', '#3a3a3c'],
    ]);
    birds(l, [
      [0.5, 0.6, 0.03],
      [0.44, 0.9, 0.03],
      [0.3, 0.14, 0.31],
    ]);
  },

  grand_inn(l) {
    site(l, 'grand_inn', '#b8ad94', [0.04, 0.06, 0.96, 0.94]);
    const hx = 0.5;
    const hz = 0.3;
    // Three-storey stone coaching inn: mansard roof with dormers, a central coach arch, a
    // balcony over the door, a courtyard with a carriage and a stable block.
    stoneBody(l, hx, hz, 0.62, 0.32, 0.03, 0.3, '#efe5d1', 0.05);
    cornice(l, hx, hz, 0.62, 0.32, 0.33, '#cfc6b2');
    wbox(l, hx, hz + 0.16, 0.03, 0.12, 0.14, 0.006, '#2c2a28');
    wround(l, ...off(l, hx, hz, 0, 0.162), 0.06, 0.06, 0.17, 0.006, '#2c2a28', 12);
    for (const t of [-0.24, -0.12, 0.12, 0.24])
      for (const y of [0.07, 0.17, 0.27])
        window4(l, hx, hz, 0.62, 0.32, '+z', t, y, 0.032, { shutters: '#3c505e' });
    for (const y of [0.2, 0.28])
      window4(l, hx, hz, 0.62, 0.32, '+z', 0.0, y, 0.032, { frame: '#cfc6b2' });
    wbox(l, ...off(l, hx, hz, 0, 0.19), 0.18, 0.16, 0.01, 0.05, '#3c505e');
    for (const s of [-1, 1])
      wbox(l, ...off(l, hx, hz, s * 0.07, 0.22), 0.1, 0.006, 0.08, 0.006, '#2c3134');
    tinGable(l, hx, hz, 'x', 0.66, 0.36, 0.34, 0.14, '#3c505e', '#efe5d1');
    for (const t of [-0.22, -0.08, 0.08, 0.22]) {
      wbox(l, ...off(l, hx, hz, t, 0.1), 0.38, 0.05, 0.06, 0.05, '#cfc6b2');
      tinGable(l, ...off(l, hx, hz, t, 0.1), 'z', 0.05, 0.06, 0.43, 0.035, '#3c505e');
      wbox(l, ...off(l, hx, hz, t, 0.132), 0.395, 0.026, 0.026, 0.004, '#f5be42', 0, 0, 0.6);
    }
    for (const t of [-0.24, 0.24]) chimney(l, ...off(l, hx, hz, t, -0.08), 0.46, 0.12);
    innSign(l, ...off(l, hx, hz, 0.28, 0.17), 0.22, '#3c505e');
    // Stable block wings around the courtyard.
    for (const sx of [-1, 1]) {
      stoneBody(l, 0.5 + sx * 0.4, 0.52, 0.16, 0.34, 0.03, 0.14, '#e3d9bf', 0.05);
      tinGable(l, 0.5 + sx * 0.4, 0.52, 'z', 0.36, 0.18, 0.17, 0.07, '#3c505e', '#e3d9bf');
      for (const t of [0.4, 0.52, 0.64])
        door(
          l,
          0.5 + sx * 0.4,
          0.52,
          0.16,
          0.34,
          sx > 0 ? '+x' : '-x',
          t - 0.52,
          0.03,
          0.05,
          0.09,
          '#5a3a22',
        );
    }
    // Carriage, horses, mounting block, lamps, fountain and guests.
    wbox(l, 0.5, 0.74, 0.07, 0.2, 0.06, 0.1, '#2c3a5a');
    wbox(l, 0.5, 0.74, 0.13, 0.22, 0.012, 0.12, '#1c2a4a');
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        wround(
          l,
          ...off(l, 0.5, 0.74, sx * 0.08, sz * 0.06),
          0.022,
          0.022,
          0.044,
          0.006,
          '#2c2a28',
          8,
        );
    horse(l, 0.34, 0.74, 1.57, '#7a4a2a');
    horse(l, 0.3, 0.78, 1.57, '#3a2a1a');
    wround(l, 0.5, 0.9, 0.04, 0.044, 0.03, 0.026, '#b0aca0', 12);
    wround(l, 0.5, 0.9, 0.034, 0.034, 0.05, 0.004, '#4d8da6', 12);
    for (const lx of [0.22, 0.78]) lanternPost(l, lx, 0.66, 0.18);
    flowerRow(l, hx, hz + 0.18, 0.5, '#e24864', 8, 0.03);
    cobbles(l, 0.2, 0.6, 0.8, 0.96, 50);
    orchardTree(l, 0.07, 0.8, 0.22, '#e8a0b0');
    orchardTree(l, 0.93, 0.8, 0.22, '#e8a0b0');
    cypress(l, 0.05, 0.08, 0.24);
    workers(l, [
      [0.62, 0.64, '#b0463a', '#d9c38a'],
      [0.4, 0.62, '#5a7a9a', '#3a3a3c'],
      [0.66, 0.84, '#7a9a5a', '#8a6a3a'],
      [0.36, 0.86, '#9a5a7a', '#3a3a3c'],
      [0.5, 0.5, '#d9b14a', '#3a3a3c'],
    ]);
    dog(l, 0.58, 0.58, 0.6);
    cat(l, 0.26, 0.56, 0.034, '#c27a3a');
    birds(l, [
      [0.5, 0.6, 0.03],
      [0.42, 0.56, 0.03],
      [0.3, 0.1, 0.46],
    ]);
  },

  // =========================================================================================
  // Chapel chain
  // =========================================================================================

  chapel(l) {
    site(l, 'chapel', '#8fa070', [0.2, 0.3, 0.8, 0.9]);
    const hx = 0.5;
    const hz = 0.34;
    // Village chapel: whitewashed stone nave with a bellcote on the gable, a small porch, a
    // churchyard with graves, a lychgate, a low wall and a yew tree.
    stoneBody(l, hx, hz, 0.28, 0.4, 0.03, 0.14, '#ece6d8', 0.04);
    lancets(l, hx, hz, 0.28, 0.4, '+x', 3, 0.1);
    lancets(l, hx, hz, 0.28, 0.4, '+z', 1, 0.1);
    renderBody(l, hx, hz + 0.22, 0.1, 0.08, 0.03, 0.09, '#e3dccb', '#9a958a');
    door(l, hx, hz + 0.22, 0.1, 0.08, '+z', 0, 0.03, 0.044, 0.07, '#5a3a22');
    tinGable(l, hx, hz + 0.22, 'z', 0.1, 0.1, 0.12, 0.04, '#4a4a5a');
    tinGable(l, hx, hz, 'z', 0.42, 0.32, 0.17, 0.1, '#4a4a5a', '#ece6d8');
    // Bellcote
    wbox(l, hx, hz - 0.18, 0.27, 0.06, 0.06, 0.03, '#ece6d8');
    wbox(l, hx, hz - 0.18, 0.285, 0.026, 0.028, 0.036, '#2c3134');
    spire(l, hx, hz - 0.18, 0.33, 0.04, 0.06, '#4a4a5a');
    wbox(l, hx, hz - 0.18, 0.39, 0.004, 0.02, 0.004, '#d9b14a');
    wbox(l, hx, hz - 0.18, 0.4, 0.014, 0.004, 0.004, '#d9b14a');
    steps(l, ...off(l, hx, hz + 0.22, 0, 0.06), 0.07, 2, 0.03);
    downpipe(l, ...off(l, hx, hz, 0.14, 0.2), 0.03, 0.12);
    // Churchyard
    graves(l, 0.1, 0.5, 0.42, 0.86, 3, 3);
    graves(l, 0.6, 0.62, 0.9, 0.9, 3, 2);
    for (const [x0, z0, x1, z1] of [
      [0.06, 0.46, 0.94, 0.46],
      [0.06, 0.46, 0.06, 0.94],
      [0.94, 0.46, 0.94, 0.94],
    ] as const)
      wbox(
        l,
        (x0 + x1) / 2,
        (z0 + z1) / 2,
        0.03,
        Math.max(0.012, Math.abs(x1 - x0)),
        0.03,
        Math.max(0.012, Math.abs(z1 - z0)),
        '#8a8378',
      );
    for (const sx of [-1, 1]) wbox(l, 0.5 + sx * 0.05, 0.94, 0.03, 0.012, 0.08, 0.012, '#5c3f27');
    wbox(l, 0.5, 0.94, 0.11, 0.12, 0.006, 0.02, '#5c3f27');
    tinGable(l, 0.5, 0.94, 'x', 0.14, 0.05, 0.116, 0.03, '#7a5a3a');
    cypress(l, 0.1, 0.14, 0.28);
    cypress(l, 0.9, 0.12, 0.26);
    shrub(l, 0.14, 0.4, 0.034);
    flowerRow(l, 0.5, 0.64, 0.14, '#e8e4d8', 5, 0.03);
    bench(l, 0.66, 0.52, 0.03, 0);
    lanternPost(l, 0.4, 0.62, 0.12);
    workers(l, [
      [0.52, 0.7, '#3a3a3c', '#2c2a28'],
      [0.46, 0.76, '#e8e4d8', '#8a6a3a'],
    ]);
    birds(l, [
      [0.3, 0.7, 0.03],
      [0.7, 0.8, 0.03],
      [0.5, 0.15, 0.27],
    ]);
    cat(l, 0.72, 0.6, 0.034, '#4a4a4a');
  },

  parish_church(l) {
    site(l, 'parish_church', '#8fa070', [0.06, 0.1, 0.94, 0.94]);
    const hx = 0.46;
    const hz = 0.36;
    // Parish church: stone nave with buttresses and a slate roof, a west tower with a spire and
    // belfry louvres, a south porch with a rose window, and a walled graveyard with a lychgate.
    stoneBody(l, hx, hz, 0.34, 0.48, 0.03, 0.2, '#e3d2b0', 0.045);
    for (let i = 0; i < 4; i++) {
      const t = -0.18 + i * 0.12;
      wbox(l, ...off(l, hx, hz, 0.18, t), 0.03, 0.04, 0.03, 0.14, '#d3c19c');
      wbox(l, ...off(l, hx, hz, -0.18, t), 0.03, 0.04, 0.03, 0.14, '#d3c19c');
    }
    lancets(l, hx, hz, 0.34, 0.48, '+x', 4, 0.13);
    tinGable(l, hx, hz, 'z', 0.5, 0.4, 0.23, 0.13, '#3a4552', '#e3d2b0');
    wbox(l, hx, hz, 0.35, 0.012, 0.016, 0.48, '#2c3134');
    // Chancel
    stoneBody(l, hx, hz - 0.3, 0.22, 0.14, 0.03, 0.16, '#e0cfae', 0.045);
    tinGable(l, hx, hz - 0.3, 'z', 0.16, 0.26, 0.19, 0.08, '#3a4552', '#e0cfae');
    // West tower
    const tx = hx;
    const tz = hz + 0.33;
    stoneBody(l, tx, tz, 0.16, 0.16, 0.03, 0.42, '#dccaa4', 0.045);
    cornice(l, tx, tz, 0.16, 0.16, 0.3, '#cdbb96');
    for (let s = 0; s < 4; s++) {
      const a = (s * Math.PI) / 2;
      wbox(
        l,
        ...off(l, tx, tz, Math.round(Math.cos(a)) * 0.088, Math.round(Math.sin(a)) * 0.088),
        0.03,
        0.024,
        0.42,
        0.024,
        '#cdbb96',
      );
    }
    door(l, tx, tz, 0.16, 0.16, '+z', 0, 0.03, 0.06, 0.1, '#5a3a22');
    roseWindow(l, tx, tz + 0.082, 0.2, 0.026);
    for (const y of [0.37]) {
      window4(l, tx, tz, 0.16, 0.16, '+z', 0, y, 0.04, { frame: '#2c3134' });
      window4(l, tx, tz, 0.16, 0.16, '+x', 0, y, 0.04, { frame: '#2c3134' });
    }
    wbox(l, tx, tz, 0.45, 0.176, 0.014, 0.176, '#cdbb96');
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        wbox(l, ...off(l, tx, tz, sx * 0.075, sz * 0.075), 0.464, 0.014, 0.03, 0.014, '#cdbb96');
    spire(l, tx, tz, 0.46, 0.1, 0.34, '#3a4552');
    wbox(l, tx, tz, 0.8, 0.004, 0.04, 0.004, '#d9b14a');
    wbox(l, tx, tz, 0.82, 0.02, 0.004, 0.004, '#d9b14a');
    // South porch
    renderBody(l, ...off(l, hx, hz, 0.22, 0.05), 0.1, 0.1, 0.03, 0.1, '#e3d2b0', '#9a958a');
    door(l, ...off(l, hx, hz, 0.22, 0.05), 0.1, 0.1, '+x', 0, 0.03, 0.05, 0.08, '#5a3a22');
    tinGable(l, ...off(l, hx, hz, 0.22, 0.05), 'x', 0.1, 0.12, 0.13, 0.04, '#3a4552');
    // Graveyard
    graves(l, 0.08, 0.64, 0.4, 0.92, 5, 3);
    graves(l, 0.62, 0.7, 0.92, 0.92, 4, 2);
    for (const [x0, z0, x1, z1] of [
      [0.04, 0.58, 0.96, 0.58],
      [0.04, 0.58, 0.04, 0.96],
      [0.96, 0.58, 0.96, 0.96],
      [0.04, 0.96, 0.96, 0.96],
    ] as const)
      wbox(
        l,
        (x0 + x1) / 2,
        (z0 + z1) / 2,
        0.03,
        Math.max(0.014, Math.abs(x1 - x0)),
        0.034,
        Math.max(0.014, Math.abs(z1 - z0)),
        '#8a8378',
      );
    wbox(l, 0.5, 0.96, 0.03, 0.12, 0.034, 0.016, '#6e8c4e');
    cypress(l, 0.08, 0.12, 0.3);
    cypress(l, 0.92, 0.14, 0.3);
    orchardTree(l, 0.9, 0.5, 0.22, '#e8a0b0');
    flowerRow(l, 0.6, 0.56, 0.2, '#e8e4d8', 6, 0.03);
    bench(l, 0.8, 0.56, 0.03, 0);
    lanternPost(l, 0.7, 0.6, 0.14);
    workers(l, [
      [0.56, 0.62, '#3a3a3c', '#2c2a28'],
      [0.62, 0.66, '#b0463a', '#d9c38a'],
      [0.5, 0.7, '#5a7a9a', '#3a3a3c'],
      [0.4, 0.58, '#e8e4d8', '#8a6a3a'],
    ]);
    birds(l, [
      [0.7, 0.8, 0.03],
      [0.3, 0.6, 0.03],
      [0.46, 0.36, 0.36],
    ]);
    cat(l, 0.2, 0.6, 0.034, '#4a4a4a');
  },

  sanctuary_chapel(l) {
    site(l, 'sanctuary_chapel', '#7f9a68', [0.04, 0.06, 0.96, 0.96]);
    const hx = 0.5;
    const hz = 0.34;
    // Sanctuary: cruciform stone church with a copper-roofed crossing dome, twin west towers with
    // spires, a rose window, a cloister garden and a gatehouse.
    stoneBody(l, hx, hz, 0.28, 0.6, 0.03, 0.26, '#f0ece1', 0.05);
    stoneBody(l, hx, hz - 0.04, 0.66, 0.2, 0.03, 0.22, '#eee9dc', 0.05);
    for (let i = 0; i < 5; i++) {
      const t = -0.24 + i * 0.12;
      wbox(l, ...off(l, hx, hz, 0.15, t), 0.03, 0.04, 0.03, 0.18, '#d8d2c0');
      wbox(l, ...off(l, hx, hz, -0.15, t), 0.03, 0.04, 0.03, 0.18, '#d8d2c0');
    }
    tinGable(l, hx, hz, 'z', 0.62, 0.32, 0.29, 0.14, copper, '#f0ece1');
    tinGable(l, hx, hz - 0.04, 'x', 0.7, 0.24, 0.25, 0.1, copper, '#eee9dc');
    lancets(l, hx, hz, 0.28, 0.6, '+x', 5, 0.18);
    lancets(l, hx, hz - 0.04, 0.66, 0.2, '+z', 4, 0.15);
    // Crossing dome with a lantern.
    wround(l, hx, hz - 0.04, 0.1, 0.1, 0.43, 0.05, '#f0ece1', 14);
    l.dome(hx, hz - 0.04, 0.1, 0.1, 0.48, 0.1, copper);
    wround(l, hx, hz - 0.04, 0.02, 0.026, 0.58, 0.04, '#f0ece1', 8);
    spire(l, hx, hz - 0.04, 0.62, 0.026, 0.06, copper, 8);
    wbox(l, hx, hz - 0.04, 0.68, 0.004, 0.04, 0.004, '#d9b14a');
    wbox(l, hx, hz - 0.04, 0.7, 0.02, 0.004, 0.004, '#d9b14a');
    // Twin west towers.
    for (const sx of [-1, 1]) {
      const tx = hx + sx * 0.12;
      const tz = hz + 0.31;
      stoneBody(l, tx, tz, 0.1, 0.1, 0.03, 0.54, '#ebe5d5', 0.05);
      window4(l, tx, tz, 0.1, 0.1, '+z', 0, 0.32, 0.034, { frame: '#2c3134' });
      window4(l, tx, tz, 0.1, 0.1, '+z', 0, 0.2, 0.026, { frame: '#d8d2c0' });
      wbox(l, tx, tz, 0.57, 0.114, 0.012, 0.114, '#d8d2c0');
      spire(l, tx, tz, 0.58, 0.06, 0.36, copper, 8);
      wbox(l, tx, tz, 0.94, 0.004, 0.03, 0.004, '#d9b14a');
    }
    renderBody(l, hx, hz + 0.31, 0.16, 0.08, 0.03, 0.2, '#ece6d8', '#d8d2c0');
    wround(l, ...off(l, hx, hz + 0.31, 0, 0.042), 0.066, 0.066, 0.18, 0.006, '#d8d2c0', 8);
    door(l, hx, hz + 0.31, 0.16, 0.08, '+z', 0, 0.03, 0.07, 0.12, '#5a3a22');
    roseWindow(l, hx, hz + 0.352, 0.22, 0.036);
    steps(l, ...off(l, hx, hz + 0.31, 0, 0.06), 0.14, 3, 0.03);
    // Cloister garden on the side and a gatehouse with a lychgate.
    for (const sz of [0.12, 0.34, 0.56]) wbox(l, 0.84, sz, 0.03, 0.16, 0.05, 0.012, '#d8d2c0');
    wbox(l, 0.9, 0.34, 0.03, 0.012, 0.05, 0.46, '#d8d2c0');
    wround(l, 0.8, 0.34, 0.03, 0.034, 0.03, 0.03, '#b0aca0', 10);
    wround(l, 0.8, 0.34, 0.025, 0.025, 0.05, 0.004, '#4d8da6', 10);
    shrub(l, 0.78, 0.2, 0.03, '#6fa84a');
    shrub(l, 0.78, 0.48, 0.03, '#6fa84a');
    flowerRow(l, 0.84, 0.46, 0.14, '#e24864', 5, 0.03);
    renderBody(l, 0.5, 0.94, 0.3, 0.07, 0.03, 0.12, '#ece6d8', '#d8d2c0');
    wbox(l, 0.5, 0.94, 0.03, 0.1, 0.09, 0.075, '#2c2a28');
    tinGable(l, 0.5, 0.94, 'x', 0.32, 0.1, 0.15, 0.05, copper);
    for (const [x0, x1] of [
      [0.06, 0.34],
      [0.66, 0.94],
    ] as const)
      wbox(l, (x0 + x1) / 2, 0.86, 0.03, x1 - x0, 0.03, 0.012, '#8a8378');
    graves(l, 0.08, 0.5, 0.22, 0.82, 2, 3);
    cypress(l, 0.08, 0.12, 0.32);
    cypress(l, 0.2, 0.08, 0.28);
    cypress(l, 0.94, 0.8, 0.3);
    orchardTree(l, 0.1, 0.9, 0.22, '#e8a0b0');
    lanternPost(l, 0.4, 0.72, 0.16);
    lanternPost(l, 0.6, 0.72, 0.16);
    bench(l, 0.3, 0.76, 0.03, 0);
    workers(l, [
      [0.46, 0.76, '#3a3a3c', '#2c2a28'],
      [0.54, 0.8, '#e8e4d8', '#8a6a3a'],
      [0.62, 0.76, '#b0463a', '#d9c38a'],
      [0.7, 0.4, '#5a7a9a', '#3a3a3c'],
    ]);
    birds(l, [
      [0.5, 0.82, 0.03],
      [0.4, 0.8, 0.03],
      [0.5, 0.2, 0.43],
    ]);
    butterflies(l, [[0.8, 0.3, 0.1]]);
  },

  // =========================================================================================
  // Clinic chain
  // =========================================================================================

  clinic(l) {
    site(l, 'clinic', '#a3b484', [0.08, 0.1, 0.92, 0.92]);
    const hx = 0.42;
    const hz = 0.34;
    // Village healer's clinic: whitewashed cottage with a red-cross plaque, herb beds, a waiting
    // bench, a well and a patient being seen to by a nurse.
    renderBody(l, hx, hz, 0.4, 0.26, 0.03, 0.13, '#f4f4f0', '#d9d3c2');
    window4(l, hx, hz, 0.4, 0.26, '+z', 0.12, 0.08, 0.036, { shutters: '#c23b3b' });
    window4(l, hx, hz, 0.4, 0.26, '+z', -0.12, 0.08, 0.036, { shutters: '#c23b3b' });
    window4(l, hx, hz, 0.4, 0.26, '+x', 0.0, 0.08, 0.036, { shutters: '#c23b3b' });
    door(l, hx, hz, 0.4, 0.26, '+z', 0, 0.03, 0.05, 0.09, '#5a3a22');
    steps(l, ...off(l, hx, hz, 0, 0.14), 0.06, 2, 0.03);
    shingleGable(l, hx, hz, 'x', 0.4, 0.26, 0.16, 0.09, '#c23b3b', '#f4f4f0');
    chimney(l, ...off(l, hx, hz, 0.14, -0.04), 0.2, 0.09);
    redCross(l, ...off(l, hx, hz, 0, 0.13), 0.12, 0.04);
    downpipe(l, ...off(l, hx, hz, -0.21, 0.12), 0.03, 0.12);
    // Herb beds, a well, a bench and a cot under an awning.
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.2 + i * 0.12, 0.72, 0.03, 0.09, 0.016, 0.1, '#543b25');
      for (let k = 0; k < 4; k++)
        l.shape(
          new THREE.SphereGeometry(0.012, 6, 5),
          ['#6fa84a', '#8cc04a', '#9a7ab0', '#e8e4d8'][(i + k) % 4]!,
          0.17 + i * 0.12 + (k % 2) * 0.04,
          0.69 + Math.floor(k / 2) * 0.05,
          0.05,
        );
    }
    wround(l, 0.8, 0.62, 0.03, 0.034, 0.03, 0.04, '#9a958a', 10);
    wbox(l, 0.8, 0.62, 0.07, 0.012, 0.03, 0.012, '#5c3f27');
    tinGable(l, 0.8, 0.62, 'x', 0.1, 0.06, 0.1, 0.03, '#c23b3b');
    bench(l, 0.62, 0.56, 0.03, 0);
    wbox(l, 0.84, 0.3, 0.03, 0.14, 0.06, 0.1, '#e8e4d8');
    tinGable(l, 0.84, 0.3, 'x', 0.16, 0.12, 0.09, 0.04, '#c23b3b');
    wbox(l, 0.84, 0.3, 0.06, 0.1, 0.012, 0.05, '#c9d8e8');
    cobbles(l, 0.3, 0.52, 0.6, 0.6, 12);
    flowerRow(l, ...off(l, hx, hz, 0.14, 0.15), 0.1, '#e8e4d8', 5, 0.03);
    cypress(l, 0.07, 0.12, 0.22);
    orchardTree(l, 0.92, 0.84, 0.2, '#e8a0b0');
    rainButt(l, ...off(l, hx, hz, 0.22, 0.0));
    lanternPost(l, 0.56, 0.5, 0.12);
    workers(l, [
      [0.56, 0.62, '#f4f4f0', '#f4f4f0'],
      [0.62, 0.62, '#8a6a48', '#d9c38a'],
      [0.36, 0.56, '#5a7a9a', '#3a3a3c'],
    ]);
    cat(l, ...off(l, hx, hz, -0.14, 0.14), 0.034, '#bdb6a6');
    birds(l, [
      [0.5, 0.82, 0.03],
      [0.56, 0.84, 0.03],
    ]);
    butterflies(l, [[0.3, 0.64, 0.1]]);
  },

  infirmary(l) {
    site(l, 'infirmary', '#a3b484', [0.06, 0.08, 0.94, 0.94]);
    const hx = 0.46;
    const hz = 0.32;
    // Brick infirmary: two-storey ward block with a green slate roof, a pillared entrance with a
    // red-cross sign, a back-yard laundry, an ambulance wagon and a physic garden.
    stoneBody(l, hx, hz, 0.6, 0.3, 0.03, 0.26, '#f2ede0', 0.05);
    cornice(l, hx, hz, 0.6, 0.3, 0.29, '#d9d3c2');
    for (const t of [-0.24, -0.12, 0.12, 0.24])
      for (const y of [0.08, 0.2])
        window4(l, hx, hz, 0.6, 0.3, '+z', t, y, 0.034, { shutters: '#688c6c' });
    for (const y of [0.2]) window4(l, hx, hz, 0.6, 0.3, '+z', 0, y, 0.034, { frame: '#d9d3c2' });
    door(l, hx, hz, 0.6, 0.3, '+z', 0, 0.03, 0.06, 0.1, '#5a3a22');
    for (const s of [-1, 1])
      wbox(l, ...off(l, hx, hz, s * 0.05, 0.17), 0.03, 0.014, 0.16, 0.014, '#e8e4d8');
    wbox(l, ...off(l, hx, hz, 0, 0.17), 0.19, 0.14, 0.012, 0.03, '#e8e4d8');
    steps(l, ...off(l, hx, hz, 0, 0.19), 0.1, 3, 0.03);
    redCross(l, ...off(l, hx, hz, 0, 0.152), 0.215, 0.05);
    tinGable(l, hx, hz, 'x', 0.64, 0.34, 0.31, 0.12, '#688c6c', '#f2ede0');
    for (const t of [-0.18, 0.18]) {
      wbox(l, ...off(l, hx, hz, t, 0.08), 0.35, 0.05, 0.06, 0.05, '#e8e4d8');
      tinGable(l, ...off(l, hx, hz, t, 0.08), 'z', 0.05, 0.06, 0.4, 0.035, '#688c6c');
    }
    chimney(l, ...off(l, hx, hz, 0.24, -0.06), 0.42, 0.1);
    chimney(l, ...off(l, hx, hz, -0.24, -0.06), 0.42, 0.1);
    // Isolation annex.
    stoneBody(l, 0.86, 0.34, 0.16, 0.22, 0.03, 0.14, '#e8e0cc', 0.05);
    tinGable(l, 0.86, 0.34, 'z', 0.24, 0.18, 0.17, 0.06, '#688c6c', '#e8e0cc');
    window4(l, 0.86, 0.34, 0.16, 0.22, '+z', 0, 0.09, 0.034, { shutters: '#688c6c' });
    // Laundry line, ambulance wagon with a canvas cover and physic garden beds.
    for (const s of [-1, 1]) wbox(l, 0.12 + s * 0.1, 0.62, 0.03, 0.008, 0.1, 0.008, '#5c3f27');
    l.beam(pt([0.02, 0.62], 0.12), pt([0.22, 0.62], 0.12), 0.003, '#8a8378');
    for (let i = 0; i < 4; i++)
      wbox(l, 0.05 + i * 0.045, 0.62, 0.08, 0.028, 0.04, 0.004, i % 2 ? '#f4f1ea' : '#c9d8e8');
    wbox(l, 0.5, 0.7, 0.07, 0.2, 0.012, 0.1, '#e8e4d8');
    tinGable(l, 0.5, 0.7, 'x', 0.2, 0.1, 0.09, 0.05, '#f4f1ea', '#f4f1ea');
    redCross(l, 0.5, 0.755, 0.1, 0.034);
    for (const sx of [-1, 1])
      wround(l, ...off(l, 0.5, 0.7, sx * 0.07, 0.056), 0.026, 0.026, 0.044, 0.006, '#2c2a28', 8);
    horse(l, 0.7, 0.72, 1.57, '#f0eadb');
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.2 + i * 0.12, 0.84, 0.03, 0.09, 0.016, 0.08, '#543b25');
      for (let k = 0; k < 4; k++)
        l.shape(
          new THREE.SphereGeometry(0.012, 6, 5),
          ['#6fa84a', '#8cc04a', '#9a7ab0', '#e8e4d8'][(i + k) % 4]!,
          0.17 + i * 0.12 + (k % 2) * 0.04,
          0.82 + Math.floor(k / 2) * 0.04,
          0.05,
        );
    }
    bench(l, 0.84, 0.62, 0.03, 0);
    bench(l, 0.84, 0.78, 0.03, 0);
    rainButt(l, ...off(l, hx, hz, 0.31, 0.12));
    lanternPost(l, 0.34, 0.56, 0.14);
    lanternPost(l, 0.62, 0.56, 0.14);
    cypress(l, 0.06, 0.1, 0.26);
    orchardTree(l, 0.94, 0.88, 0.22, '#e8a0b0');
    flowerRow(l, hx, hz + 0.2, 0.4, '#e8e4d8', 8, 0.03);
    workers(l, [
      [0.4, 0.62, '#f4f4f0', '#f4f4f0'],
      [0.46, 0.62, '#8a6a48', '#d9c38a'],
      [0.74, 0.62, '#f4f4f0', '#f4f4f0'],
      [0.3, 0.74, '#5a7a9a', '#3a3a3c'],
    ]);
    cat(l, 0.9, 0.7, 0.034, '#bdb6a6');
    birds(l, [
      [0.56, 0.86, 0.03],
      [0.62, 0.88, 0.03],
      [0.46, 0.32, 0.4],
    ]);
  },

  medical_hall(l) {
    site(l, 'medical_hall', '#a8b88c', [0.04, 0.06, 0.96, 0.94]);
    const hx = 0.5;
    const hz = 0.3;
    // Medical hall: a grand hospital with a central pavilion under a copper dome and clock, two
    // long wards with glazed sun-rooms, a courtyard fountain and a motor ambulance bay.
    stoneBody(l, hx, hz, 0.28, 0.26, 0.03, 0.34, '#f6f5ef', 0.05);
    cornice(l, hx, hz, 0.28, 0.26, 0.37, '#e0ddd0');
    for (const y of [0.1, 0.22, 0.32]) {
      window4(l, hx, hz, 0.28, 0.26, '+z', -0.08, y, 0.032, { shutters: '#4f857b' });
      window4(l, hx, hz, 0.28, 0.26, '+z', 0.08, y, 0.032, { shutters: '#4f857b' });
    }
    door(l, hx, hz, 0.28, 0.26, '+z', 0, 0.03, 0.06, 0.1, '#5a3a22');
    for (const s of [-1, 1])
      wbox(l, ...off(l, hx, hz, s * 0.05, 0.15), 0.03, 0.014, 0.16, 0.014, '#e8e4d8');
    wbox(l, ...off(l, hx, hz, 0, 0.15), 0.19, 0.12, 0.012, 0.03, '#e8e4d8');
    steps(l, ...off(l, hx, hz, 0, 0.17), 0.1, 3, 0.03);
    redCross(l, ...off(l, hx, hz, 0, 0.138), 0.3, 0.05);
    wround(l, hx, hz, 0.12, 0.12, 0.4, 0.04, '#f6f5ef', 14);
    l.dome(hx, hz, 0.12, 0.12, 0.44, 0.12, '#4f857b');
    wround(l, ...off(l, hx, hz, 0, 0.122), 0.022, 0.022, 0.4, 0.006, '#f4f0e6', 12);
    wbox(l, ...off(l, hx, hz, 0, 0.126), 0.41, 0.004, 0.016, 0.004, '#2c3134');
    wround(l, hx, hz, 0.012, 0.018, 0.56, 0.03, '#4f857b', 8);
    wbox(l, hx, hz, 0.59, 0.004, 0.04, 0.004, '#d9b14a');
    // Ward wings with sun-rooms.
    for (const sx of [-1, 1]) {
      const wx = hx + sx * 0.32;
      stoneBody(l, wx, hz, 0.36, 0.22, 0.03, 0.24, '#f2f0e6', 0.05);
      for (const t of [-0.12, 0, 0.12])
        for (const y of [0.08, 0.2])
          window4(l, wx, hz, 0.36, 0.22, '+z', t, y, 0.032, { shutters: '#4f857b' });
      tinGable(l, wx, hz, 'x', 0.38, 0.26, 0.27, 0.09, '#4f857b', '#f2f0e6');
      wbox(l, wx, hz + 0.14, 0.03, 0.3, 0.1, 0.06, '#9fc8c8');
      for (let i = 0; i < 6; i++)
        wbox(l, ...off(l, wx, hz, -0.14 + i * 0.056, 0.17), 0.03, 0.006, 0.1, 0.006, '#e8e4d8');
      wbox(l, wx, hz + 0.14, 0.13, 0.32, 0.008, 0.07, '#e8e4d8');
      chimney(l, ...off(l, wx, hz, sx * 0.1, -0.06), 0.3, 0.1);
    }
    // Courtyard: fountain, hedges, benches, motor ambulance bay and convalescents.
    wround(l, 0.5, 0.66, 0.06, 0.066, 0.03, 0.03, '#b0aca0', 14);
    wround(l, 0.5, 0.66, 0.05, 0.05, 0.05, 0.006, '#4d8da6', 14);
    wround(l, 0.5, 0.66, 0.012, 0.016, 0.05, 0.05, '#c9c4b6', 8);
    for (const s of [-1, 1]) {
      wbox(l, 0.5 + s * 0.22, 0.66, 0.03, 0.14, 0.03, 0.04, '#4f8a3a');
      bench(l, 0.5 + s * 0.22, 0.74, 0.03, 0);
    }
    wbox(l, 0.84, 0.74, 0.04, 0.2, 0.08, 0.1, '#f4f4f0');
    wbox(l, 0.84, 0.74, 0.12, 0.2, 0.01, 0.1, '#c23b3b');
    for (const sx of [-1, 1])
      wround(l, ...off(l, 0.84, 0.74, sx * 0.07, 0.056), 0.02, 0.02, 0.034, 0.006, '#2c2a28', 8);
    redCross(l, 0.84, 0.795, 0.06, 0.034);
    wbox(l, 0.84, 0.74, 0.13, 0.03, 0.01, 0.014, '#e24864', 0, 0, 1);
    wbox(l, 0.16, 0.74, 0.03, 0.2, 0.012, 0.1, '#c9c4b6');
    cobbles(l, 0.1, 0.56, 0.9, 0.94, 40, 0.03, '#b0a890');
    flowerRow(l, 0.5, 0.52, 0.5, '#e8e4d8', 10, 0.03);
    for (const lx of [0.3, 0.7]) lanternPost(l, lx, 0.58, 0.16);
    orchardTree(l, 0.06, 0.1, 0.24, '#e8a0b0');
    orchardTree(l, 0.94, 0.1, 0.24, '#e8a0b0');
    cypress(l, 0.08, 0.9, 0.24);
    workers(l, [
      [0.4, 0.62, '#f4f4f0', '#f4f4f0'],
      [0.46, 0.62, '#8a6a48', '#d9c38a'],
      [0.62, 0.62, '#f4f4f0', '#f4f4f0'],
      [0.68, 0.66, '#5a7a9a', '#3a3a3c'],
      [0.36, 0.78, '#e8e4d8', '#8a6a3a'],
      [0.56, 0.82, '#9a5a7a', '#3a3a3c'],
    ]);
    cat(l, 0.3, 0.7, 0.034, '#bdb6a6');
    birds(l, [
      [0.5, 0.74, 0.03],
      [0.42, 0.76, 0.03],
      [0.5, 0.3, 0.6],
    ]);
    butterflies(l, [[0.7, 0.55, 0.1]]);
  },
};
