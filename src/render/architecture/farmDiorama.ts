import * as THREE from 'three';
import {
  barrel,
  boardBody,
  cart,
  chimney,
  crate,
  door,
  halfTimber,
  hayBale,
  lanternPost,
  meadow,
  off,
  orchardTree,
  path,
  person,
  railFence,
  renderBody,
  reseed,
  roundBale,
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
  channel,
  cropBed,
  glassHouse,
  smoke,
  solarRow,
  steelSilo,
  thatchGable,
  tractor,
  truck,
  waterWheel,
  windmillSails,
} from './dioramaProps';
import { type Lot, type Recipes } from './lot';

// Group 5, chain 1 — farming and crops (2×2, seven tiers):
// wheat_farm -> irrigated_wheat -> windmill_farm_estate -> mechanized_granary_farm ->
// imperial_agricultural_estate -> agro_industrial_complex -> hydroponic_mega_farm

const grass = '#7aa64b';
const timber = '#5c3f27';
const plank = '#8a6142';
const white = '#f1ece2';
const brick = '#a5452f';
const coats = ['#2f5f86', '#8a3b2c', '#3f6b3a', '#c49a3a', '#6a4f86'] as const;

/** Stone well with a little shingle roof and bucket. */
function well(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.03, 0.032, 0.03, 0.05, '#9a958a', 12);
  wround(l, x, z, 0.024, 0.024, 0.075, 0.006, '#3f6f86', 12);
  for (const e of [-1, 1]) wbox(l, ...off(l, x, z, e * 0.028, 0), 0.08, 0.008, 0.08, 0.008, timber);
  shingleGable(l, x, z, 'x', 0.075, 0.07, 0.16, 0.035, '#6e5444', undefined, 0.01);
  wbox(l, x, z, 0.12, 0.05, 0.006, 0.006, '#4a3220');
  wround(l, ...off(l, x, z, 0.008, 0), 0.007, 0.006, 0.09, 0.012, '#7a5634', 8);
}

/** Striped market stall with produce crates. */
function stall(l: Lot, x: number, z: number): void {
  wbox(l, x, z, 0.03, 0.1, 0.04, 0.05, '#8a6342');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      wbox(l, ...off(l, x, z, sx * 0.048, sz * 0.024), 0.03, 0.005, 0.1, 0.005, timber);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BoxGeometry(0.018, 0.004, 0.07);
    g.rotateX(-0.35);
    l.shape(g, i % 2 ? '#c8392c' : white, ...off(l, x, z, -0.045 + i * 0.018, 0.004), 0.135);
  }
  crate(l, ...off(l, x, z, -0.025, 0), 0.07, '#d23b2e');
  crate(l, ...off(l, x, z, 0.015, 0), 0.07, '#e8a33a');
  crate(l, ...off(l, x, z, 0.03, 0.04), 0.03, '#6fa34a');
}

/** Sacks of grain stacked on the ground. */
function sacks(l: Lot, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const g = new THREE.CapsuleGeometry(0.011, 0.016, 3, 6);
    g.rotateZ(Math.PI / 2);
    g.rotateY(i * 0.7);
    l.shape(
      g,
      tone('#d9c8a0', 0.1),
      ...off(l, x, z, (i % 3) * 0.024 - 0.024, Math.floor(i / 3) * 0.006),
      0.042 + Math.floor(i / 3) * 0.02,
    );
  }
}

/** Lattice farm windpump with a multi-blade fan. */
function windpump(l: Lot, x: number, z: number, h: number): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    l.beam(
      [x + (a * 0.03) / l.spanX, 0.03, z + (b * 0.03) / l.spanZ],
      [x + (a * 0.006) / l.spanX, 0.03 + h, z + (b * 0.006) / l.spanZ],
      0.005,
      '#8a5a3a',
    );
  for (let k = 1; k < 6; k++) {
    const r = 0.03 - (0.024 * k) / 6;
    wbox(l, x, z, 0.03 + (k * h) / 6, r * 2, 0.003, r * 2, '#6b4a2c');
  }
  const y = 0.05 + h;
  const hub = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8);
  hub.rotateX(Math.PI / 2);
  l.shape(hub, '#3a3530', x, z, y);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const blade = new THREE.BoxGeometry(0.014, 0.05, 0.002);
    blade.translate(0, 0.034, 0);
    blade.rotateZ(a);
    blade.rotateY(0.2);
    l.shape(blade, i % 2 ? '#d9dcdc' : '#c0392b', ...off(l, x, z, 0, 0.012), y);
  }
  wbox(l, ...off(l, x, z, 0, -0.04), y - 0.008, 0.002, 0.03, 0.05, '#d9dcdc');
}

/** Brick body: small courses in brick red. */
function brickBody(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color = brick,
): void {
  stoneBody(l, x, z, w, d, y, h, color, 0.018);
}

export const farmDiorama: Recipes = {
  wheat_farm(l) {
    reseed('wheat_farm');
    meadow(l, grass, 90);
    path(l, 0.5, 0.98, 0.4, 0.5, 0.12);
    path(l, 0.4, 0.5, 0.28, 0.36, 0.1);
    // Golden wheat field and a vegetable patch, both rail fenced.
    cropBed(l, 0.5, 0.48, 0.95, 0.95, 'grain', l.stage);
    cropBed(l, 0.06, 0.6, 0.38, 0.92, 'greens', l.stage, 0.06);
    railFence(l, 0.47, 0.45, 0.97, 0.45);
    railFence(l, 0.97, 0.45, 0.97, 0.97);
    railFence(l, 0.97, 0.97, 0.56, 0.97);
    railFence(l, 0.04, 0.57, 0.04, 0.95);
    railFence(l, 0.04, 0.95, 0.42, 0.95);
    railFence(l, 0.04, 0.57, 0.4, 0.57);
    // Thatched plank barn with open doors and a lean-to of bales.
    const bx = 0.28;
    const bz = 0.24;
    wbox(l, bx, bz, 0.03, 0.46, 0.014, 0.34, '#a59d8c');
    boardBody(l, bx, bz, 0.42, 0.3, 0.04, 0.2, plank);
    door(l, bx, bz, 0.42, 0.3, '+z', 0, 0.04, 0.12, 0.15, timber, true);
    window4(l, bx, bz, 0.42, 0.3, '+x', 0, 0.12, 0.05, { shutters: '#6b4a2c' });
    thatchGable(l, bx, bz, 'x', 0.42, 0.3, 0.24, 0.14, plank);
    for (let i = 0; i < 3; i++) hayBale(l, ...off(l, bx, bz, -0.26, -0.08 + i * 0.05), 0.03, 1.57);
    hayBale(l, ...off(l, bx, bz, -0.26, -0.055), 0.056, 1.57);
    // Well, tree, farmers, tools.
    well(l, 0.62, 0.26);
    orchardTree(l, 0.08, 0.1, 0.38, '#d23b2e');
    orchardTree(l, 0.88, 0.16, 0.34, '#e8a33a');
    person(l, 0.7, 0.7, 0.04, coats[0]);
    person(l, 0.2, 0.75, 0.036, coats[3], '#d9c38a');
    person(l, 0.82, 0.86, 0.04, coats[1], '#d9c38a');
    roundBale(l, 0.74, 0.36);
    roundBale(l, 0.8, 0.38, 0.6);
    cart(l, 0.5, 0.36, 0.3, 'hay');
    barrel(l, 0.48, 0.18);
    crate(l, 0.52, 0.2, 0.03, '#e8a33a');
  },

  irrigated_wheat(l) {
    reseed('irrigated_wheat');
    meadow(l, grass, 50);
    // Stone-kerbed canals: one across the lot and one down the middle of the fields.
    channel(l, 0.02, 0.44, 0.98, 0.44, 0.07);
    channel(l, 0.5, 0.47, 0.5, 0.98, 0.06);
    cropBed(l, 0.06, 0.52, 0.45, 0.95, 'grain', l.stage);
    cropBed(l, 0.56, 0.52, 0.95, 0.95, 'greens', l.stage, 0.055);
    // Irrigation pipes with sprinkler heads across the green bed.
    for (const z of [0.62, 0.84]) {
      l.beam([0.56, 0.06, z], [0.95, 0.06, z], 0.004, '#4f7fa8');
      for (let i = 0; i < 5; i++) wbox(l, 0.6 + i * 0.08, z, 0.06, 0.006, 0.02, 0.006, '#4f7fa8');
    }
    // Sluice gates.
    for (const x of [0.2, 0.8]) {
      for (const e of [-1, 1])
        wbox(l, ...off(l, x, 0.44, e * 0.05, 0), 0.03, 0.014, 0.08, 0.014, '#7f7a70');
      wbox(l, x, 0.44, 0.06, 0.09, 0.03, 0.01, '#6b4a2c');
      wbox(l, x, 0.44, 0.11, 0.11, 0.01, 0.016, '#7f7a70');
    }
    // Water wheel at the canal head driving a small mill shed.
    waterWheel(l, 0.93, 0.44, 0.0, 0.07, Math.PI / 2);
    boardBody(l, 0.93, 0.3, 0.12, 0.14, 0.03, 0.12, plank);
    shingleGable(l, 0.93, 0.3, 'z', 0.14, 0.12, 0.15, 0.06, '#6e5444', plank);
    // Half-timbered stone farmhouse with a tiled roof and chimney.
    const hx = 0.4;
    const hz = 0.2;
    const hw = 0.44;
    const hd = 0.26;
    stoneBody(l, hx, hz, hw, hd, 0.03, 0.15, '#a8a196', 0.03);
    renderBody(l, hx, hz, hw, hd, 0.18, 0.15, '#efe2c4', '#e3d5b4');
    halfTimber(l, hx, hz, hw, hd, 0.18, 0.15, '#4a3220');
    for (const t of [-0.12, 0.12]) {
      window4(l, hx, hz, hw, hd, '+z', t, 0.08, 0.05, { shutters: '#3f5f4a' });
      window4(l, hx, hz, hw, hd, '+z', t, 0.22, 0.05, { flowers: true });
      window4(l, hx, hz, hw, hd, '-z', t, 0.22, 0.05);
    }
    window4(l, hx, hz, hw, hd, '+x', 0, 0.22, 0.05);
    window4(l, hx, hz, hw, hd, '-x', 0, 0.22, 0.05);
    door(l, hx, hz, hw, hd, '+z', 0, 0.03, 0.06, 0.12, '#5a3a24');
    shingleGable(l, hx, hz, 'x', hw, hd, 0.33, 0.15, '#7a5a48', '#efe2c4');
    chimney(l, ...off(l, hx, hz, 0.15, -0.04), 0.36, 0.16);
    // Market stall, barrels, sacks, a tree and workers.
    stall(l, 0.1, 0.32);
    for (let i = 0; i < 3; i++) barrel(l, 0.7 + i * 0.02, 0.2 + (i % 2) * 0.02);
    sacks(l, 0.75, 0.32, 5);
    orchardTree(l, 0.08, 0.1, 0.42, '#d23b2e');
    person(l, 0.3, 0.7, 0.04, coats[2], '#d9c38a');
    person(l, 0.76, 0.74, 0.04, coats[0]);
    person(l, 0.56, 0.34, 0.03, coats[4]);
  },

  windmill_farm_estate(l) {
    reseed('windmill_farm_estate');
    meadow(l, grass, 60);
    path(l, 0.3, 0.98, 0.3, 0.42, 0.12);
    path(l, 0.3, 0.42, 0.7, 0.42, 0.1);
    cropBed(l, 0.44, 0.52, 0.96, 0.95, 'grain', l.stage);
    cropBed(l, 0.04, 0.6, 0.22, 0.95, 'cabbage', l.stage, 0.05);
    // Tapered stone tower mill with a cap, gallery, door and lattice sails.
    const mx = 0.76;
    const mz = 0.22;
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      wround(
        l,
        mx,
        mz,
        0.12 - (t + 1 / 12) * 0.04,
        0.12 - t * 0.04,
        0.03 + i * 0.05,
        0.05,
        tone('#cfc6b4', 0.12),
        16,
      );
    }
    wround(l, mx, mz, 0.1, 0.1, 0.35, 0.008, timber, 16);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      wbox(
        l,
        ...off(l, mx, mz, Math.cos(a) * 0.1, Math.sin(a) * 0.1),
        0.358,
        0.004,
        0.03,
        0.004,
        timber,
      );
    }
    wround(l, mx, mz, 0.1, 0.1, 0.388, 0.004, timber, 16);
    door(l, mx, mz, 0.22, 0.24, '+z', 0, 0.03, 0.05, 0.1, '#5a3a24');
    for (const y of [0.18, 0.44]) window4(l, mx, mz, 0.19, 0.2, '+z', 0, y, 0.035);
    const cap = new THREE.SphereGeometry(0.09, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.scale(1, 0.9, 1.15);
    l.shape(cap, '#6e5444', mx, mz, 0.63);
    windmillSails(l, ...off(l, mx, mz, 0, 0.1), 0.66, 0.3, 0);
    // Two-bay grain barn with cart doors and sack hoist.
    const bx = 0.3;
    const bz = 0.2;
    stoneBody(l, bx, bz, 0.5, 0.28, 0.03, 0.1, '#a8a196', 0.03);
    boardBody(l, bx, bz, 0.5, 0.28, 0.13, 0.14, '#9a6a42');
    for (const t of [-0.12, 0.12])
      door(l, bx, bz, 0.5, 0.28, '+z', t, 0.03, 0.1, 0.16, timber, true);
    window4(l, bx, bz, 0.5, 0.28, '-x', 0, 0.16, 0.05);
    shingleGable(l, bx, bz, 'x', 0.5, 0.28, 0.27, 0.15, '#7a5a48', '#9a6a42');
    wbox(l, ...off(l, bx, bz, 0, 0.16), 0.36, 0.008, 0.008, 0.06, timber);
    sacks(l, ...off(l, bx, bz, -0.12, 0.2), 6);
    // Ox cart with sacks, oxen-free farmer team, hay and props.
    cart(l, 0.52, 0.42, 1.2, 'crates');
    sacks(l, 0.58, 0.32, 4);
    for (let i = 0; i < 4; i++) roundBale(l, 0.06, 0.4 + i * 0.05, 1.57);
    orchardTree(l, 0.08, 0.1, 0.4, '#d23b2e');
    person(l, 0.6, 0.38, 0.03, coats[1], '#d9c38a');
    person(l, 0.62, 0.72, 0.04, coats[0]);
    person(l, 0.82, 0.86, 0.04, coats[3], '#d9c38a');
    railFence(l, 0.42, 0.98, 0.98, 0.98);
    railFence(l, 0.98, 0.5, 0.98, 0.98);
  },

  mechanized_granary_farm(l) {
    reseed('mechanized_granary_farm');
    meadow(l, grass, 40);
    // Farm road along the front with a centre line.
    wbox(l, 0.5, 0.94, 0.03, 1.96, 0.006, 0.18, '#5f6366');
    for (let i = 0; i < 9; i++) wbox(l, 0.06 + i * 0.11, 0.94, 0.036, 0.1, 0.002, 0.008, white);
    wbox(l, 0.5, 0.89, 0.031, 1.96, 0.007, 0.012, '#d9d4c8');
    // Red brick barn, white trim, corrugated roof.
    const bx = 0.3;
    const bz = 0.22;
    const bw = 0.5;
    const bd = 0.34;
    brickBody(l, bx, bz, bw, bd, 0.03, 0.26);
    door(l, bx, bz, bw, bd, '+z', 0, 0.03, 0.16, 0.18, '#a8382a', true);
    for (const t of [-0.17, 0.17]) {
      window4(l, bx, bz, bw, bd, '+z', t, 0.12, 0.05, { frame: white });
      window4(l, bx, bz, bw, bd, '-z', t, 0.12, 0.05, { frame: white });
    }
    window4(l, bx, bz, bw, bd, '+z', 0, 0.23, 0.04, { frame: white });
    for (const t of [-0.08, 0.08])
      window4(l, bx, bz, bw, bd, '-x', t, 0.12, 0.05, { frame: white });
    tinGable(l, bx, bz, 'z', bd, bw, 0.29, 0.18, '#a9b0b4', brick);
    // Twin steel silos and an open equipment shed with a tractor.
    steelSilo(l, 0.72, 0.12, 0.07, 0.86);
    steelSilo(l, 0.89, 0.12, 0.07, 0.86);
    l.beam([0.72, 0.96, 0.12], [0.89, 0.96, 0.12], 0.006, '#8f969a');
    const sx = 0.78;
    const sz = 0.38;
    for (const [dx, dz] of [
      [-0.14, -0.1],
      [0.14, -0.1],
      [-0.14, 0.1],
      [0.14, 0.1],
    ] as const)
      wbox(l, ...off(l, sx, sz, dx, dz), 0.03, 0.014, 0.18, 0.014, '#7a5234');
    boardBody(l, ...off(l, sx, sz, 0, -0.1), 0.3, 0.02, 0.03, 0.18, '#9a3a2a');
    tinGable(l, sx, sz, 'x', 0.3, 0.22, 0.21, 0.07, '#a9b0b4');
    tractor(l, sx, sz, 0.2);
    smoke(l, ...off(l, sx, sz, 0.03, 0.02), 0.1, 2);
    // Windpump, vegetable beds with sprinklers and crates.
    windpump(l, 0.06, 0.06, 0.55);
    cropBed(l, 0.06, 0.46, 0.46, 0.82, 'cabbage', l.stage, 0.05);
    cropBed(l, 0.54, 0.54, 0.96, 0.82, 'greens', l.stage, 0.05);
    for (const [x0, x1] of [
      [0.06, 0.46],
      [0.54, 0.96],
    ] as const) {
      l.beam([x0, 0.055, 0.68], [x1, 0.055, 0.68], 0.004, '#4f7fa8');
      for (let i = 0; i < 4; i++)
        wbox(l, x0 + 0.05 + i * 0.1, 0.68, 0.055, 0.004, 0.03, 0.004, '#4f7fa8');
    }
    for (let i = 0; i < 4; i++) hayBale(l, 0.58 + i * 0.03, 0.48, 0.03);
    crate(l, 0.52, 0.44, 0.03, '#6fa34a');
    crate(l, 0.52, 0.47, 0.03, '#e07a2e');
    person(l, 0.68, 0.46, 0.03, coats[2]);
    person(l, 0.3, 0.64, 0.04, coats[0], '#d9c38a');
    railFence(l, 0.02, 0.84, 0.98, 0.84, white, 2);
  },

  imperial_agricultural_estate(l) {
    reseed('imperial_agricultural_estate');
    meadow(l, '#79a84d', 40);
    // Gravel forecourt and drive to the manor.
    wbox(l, 0.5, 0.52, 0.03, 1.2, 0.004, 0.36, '#d6cfbf');
    path(l, 0.5, 0.98, 0.5, 0.7, 0.14, '#d6cfbf');
    // Neoclassical manor: rendered walls, arcaded loggia, blue-grey roof, dormers.
    const mx = 0.5;
    const mz = 0.2;
    const mw = 0.8;
    const md = 0.3;
    stoneBody(l, mx, mz, mw + 0.02, md + 0.02, 0.03, 0.05, '#c9c2b2', 0.025);
    renderBody(l, mx, mz, mw, md, 0.08, 0.42, '#efe6d2', '#d9cfb8');
    for (const t of [-0.32, -0.2, 0.2, 0.32]) {
      window4(l, mx, mz, mw, md, '+z', t, 0.14, 0.055, { shutters: '#4f6a7a' });
      window4(l, mx, mz, mw, md, '+z', t, 0.32, 0.05, { shutters: '#4f6a7a', flowers: true });
      window4(l, mx, mz, mw, md, '-z', t, 0.24, 0.05);
    }
    for (const t of [-0.07, 0.07]) {
      window4(l, mx, mz, mw, md, '+x', t, 0.24, 0.05);
      window4(l, mx, mz, mw, md, '-x', t, 0.24, 0.05);
    }
    // Loggia: arches on columns in front of the centre bay.
    const [lx, lz] = off(l, mx, mz, 0, md / 2 + 0.05);
    wbox(l, lx, lz, 0.03, 0.3, 0.05, 0.1, '#d9d2c2');
    for (let i = 0; i < 5; i++) {
      const [cx, cz] = off(l, lx, lz, -0.12 + i * 0.06, 0.04);
      wround(l, cx, cz, 0.008, 0.009, 0.08, 0.17, white, 10);
      if (i < 4) {
        const arch = new THREE.TorusGeometry(0.026, 0.006, 4, 10, Math.PI);
        l.shape(arch, white, ...off(l, cx, cz, 0.03, 0), 0.25);
      }
    }
    wbox(l, lx, lz, 0.27, 0.3, 0.03, 0.1, '#e3dccd');
    for (let i = 0; i < 12; i++)
      wbox(l, ...off(l, lx, lz, -0.135 + i * 0.0245, 0.045), 0.3, 0.006, 0.03, 0.006, white);
    wbox(l, lx, lz, 0.33, 0.3, 0.008, 0.1, '#e3dccd');
    for (const t of [-0.08, 0, 0.08]) window4(l, mx, mz, mw, md, '+z', t, 0.32, 0.05);
    shingleGable(l, mx, mz, 'x', mw, md, 0.5, 0.18, '#5f7280', '#efe6d2');
    for (const t of [-0.22, 0, 0.22]) {
      const [dx, dz] = off(l, mx, mz, t, 0.07);
      wbox(l, dx, dz, 0.5, 0.07, 0.07, 0.06, '#efe6d2');
      shingleGable(l, dx, dz, 'z', 0.06, 0.07, 0.57, 0.04, '#5f7280', '#efe6d2', 0.01);
      window4(l, dx, dz, 0.07, 0.06, '+z', 0, 0.52, 0.035);
    }
    for (const e of [-1, 1]) chimney(l, ...off(l, mx, mz, e * 0.3, -0.04), 0.56, 0.16, '#b7aa92');
    // Fountain in the forecourt.
    wround(l, 0.5, 0.56, 0.08, 0.085, 0.03, 0.03, '#d9d2c2', 16);
    wround(l, 0.5, 0.56, 0.072, 0.072, 0.052, 0.008, '#5a9ab8', 16);
    wround(l, 0.5, 0.56, 0.012, 0.016, 0.05, 0.08, '#d9d2c2', 8);
    wround(l, 0.5, 0.56, 0.03, 0.02, 0.13, 0.012, '#d9d2c2', 12);
    wround(l, 0.5, 0.56, 0.004, 0.012, 0.142, 0.03, '#a9d6e4', 8);
    // Brick granary with a clock and a walled kitchen garden with clipped hedges.
    brickBody(l, 0.9, 0.62, 0.16, 0.22, 0.03, 0.22, '#b05a3c');
    for (const t of [-0.05, 0.05])
      window4(l, 0.9, 0.62, 0.16, 0.22, '-x', t, 0.12, 0.04, { frame: white });
    shingleGable(l, 0.9, 0.62, 'z', 0.22, 0.16, 0.25, 0.08, '#5f7280', '#b05a3c');
    cropBed(l, 0.06, 0.74, 0.4, 0.95, 'carrot', l.stage, 0.045);
    cropBed(l, 0.6, 0.76, 0.95, 0.95, 'pumpkin', l.stage, 0.06);
    for (let i = 0; i < 8; i++) {
      shrub(l, 0.06 + i * 0.044, 0.71, 0.018, '#3f7a3a');
      shrub(l, 0.6 + i * 0.044, 0.73, 0.018, '#3f7a3a');
    }
    for (const x of [0.12, 0.88]) {
      wbox(l, x, 0.42, 0.03, 0.03, 0.12, 0.03, white);
      wround(l, x, 0.42, 0.04, 0.03, 0.15, 0.02, '#4f8a3a', 8);
    }
    lanternPost(l, 0.42, 0.88);
    lanternPost(l, 0.58, 0.88);
    person(l, 0.44, 0.5, 0.034, coats[4], '#2a2a2a');
    person(l, 0.3, 0.86, 0.04, coats[2], '#d9c38a');
    person(l, 0.78, 0.86, 0.04, coats[0]);
    orchardTree(l, 0.08, 0.1, 0.4, '#d23b2e');
    // Belvedere with a clock and a gilded weathervane over the centre of the roof.
    const [bvx, bvz] = off(l, mx, mz, 0, 0);
    renderBody(l, bvx, bvz, 0.12, 0.12, 0.6, 0.2, '#efe6d2', '#d9cfb8');
    for (const f of ['+z', '-z', '+x', '-x'] as const)
      window4(l, bvx, bvz, 0.12, 0.12, f, 0, 0.66, 0.045);
    wround(l, ...off(l, bvx, bvz, 0, 0.062), 0.028, 0.028, 0.745, 0.004, white, 16);
    const bvCap = new THREE.ConeGeometry(0.1, 0.12, 4);
    bvCap.rotateY(Math.PI / 4);
    l.shape(bvCap, '#5f7280', bvx, bvz, 0.86);
    wround(l, bvx, bvz, 0.003, 0.004, 0.92, 0.1, '#d7af4b', 6);
    l.shape(new THREE.SphereGeometry(0.012, 8, 6), '#d7af4b', bvx, bvz, 1.03);
  },

  agro_industrial_complex(l) {
    reseed('agro_industrial_complex');
    meadow(l, '#7aa64b', 25);
    // Concrete yard and truck loading bay.
    wbox(l, 0.5, 0.5, 0.03, 1.9, 0.006, 0.6, '#b9b6ae');
    for (let i = 0; i < 5; i++) wbox(l, 0.5 + i * 0.09, 0.62, 0.037, 0.006, 0.002, 0.16, white);
    // Four tall steel silos on a plinth with a catwalk and an elevator head house.
    for (let i = 0; i < 4; i++) steelSilo(l, 0.1 + i * 0.12, 0.14, 0.095, 0.92);
    l.beam([0.08, 1.02, 0.14], [0.52, 1.02, 0.14], 0.02, '#8f969a');
    for (let i = 0; i < 12; i++)
      wbox(l, 0.1 + i * 0.035, 0.14, 1.03, 0.004, 0.03, 0.004, '#5a5f63');
    const hx = 0.66;
    const hz = 0.14;
    brickBody(l, hx, hz, 0.14, 0.14, 0.03, 1.08, '#c9c2b2');
    for (let k = 0; k < 7; k++) window4(l, hx, hz, 0.14, 0.14, '+z', 0, 0.12 + k * 0.14, 0.04);
    tinGable(l, hx, hz, 'x', 0.14, 0.14, 1.11, 0.07, '#7f8a8e', '#c9c2b2');
    // Overhead conveyor gallery from the head house to the silos and to the loading bay.
    l.beam([0.62, 0.92, 0.14], [0.5, 1.0, 0.14], 0.024, '#9aa0a4');
    for (const z of [0.3, 0.42]) wbox(l, 0.78, z, 0.03, 0.012, 0.42, 0.012, '#5a5f63');
    l.beam([0.7, 0.85, 0.16], [0.78, 0.46, 0.5], 0.02, '#9aa0a4');
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      wbox(l, 0.7 + 0.08 * t, 0.16 + 0.34 * t, 0.86 - 0.4 * t, 0.026, 0.006, 0.012, '#5a5f63');
    }
    wbox(l, 0.78, 0.5, 0.03, 0.08, 0.42, 0.08, '#8f969a');
    // Seed testing laboratory: glass office with lit windows.
    glassHouse(l, 0.82, 0.32, 0.03, 0.3, 0.2, 0.16, '#5a5f63', '#cfe6ee', 0.8, 0);
    wbox(l, 0.82, 0.32, 0.23, 0.32, 0.02, 0.18, '#e3e0d8');
    for (let i = 0; i < 3; i++) wbox(l, 0.75 + i * 0.07, 0.32, 0.25, 0.04, 0.03, 0.04, '#9aa0a4');
    wbox(l, 0.82, 0.4, 0.17, 0.12, 0.03, 0.004, '#2f6a3a');
    // Trucks at the bay, pallets of sacks, fields at the front.
    truck(l, 0.56, 0.56, Math.PI / 2, '#3f6b8a');
    truck(l, 0.65, 0.56, Math.PI / 2, '#a8382a');
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.3 + i * 0.06, 0.5, 0.036, 0.05, 0.008, 0.05, '#a47a52');
      sacks(l, 0.3 + i * 0.06, 0.5, 3);
    }
    cropBed(l, 0.04, 0.82, 0.96, 0.96, 'grain', l.stage);
    tractor(l, 0.2, 0.62, -0.4, '#2f7a3a');
    person(l, 0.42, 0.56, 0.036, '#e8b843', '#f1ece2');
    person(l, 0.92, 0.5, 0.036, '#e8b843', '#f1ece2');
    lanternPost(l, 0.96, 0.7, 0.3);
    lanternPost(l, 0.04, 0.7, 0.3);
  },

  hydroponic_mega_farm(l) {
    reseed('hydroponic_mega_farm');
    meadow(l, '#78a24a', 20);
    wbox(l, 0.5, 0.5, 0.03, 1.9, 0.006, 1.9, '#c9c6be');
    // Three-storey vertical farm: steel frame, glass floors with violet grow-lights.
    const tx = 0.4;
    const tz = 0.36;
    const tw = 0.62;
    const td = 0.46;
    const floorH = 0.36;
    for (let f = 0; f < 3; f++) {
      const y = 0.036 + f * floorH;
      const w = tw - f * 0.08;
      const d = td - f * 0.06;
      glassHouse(l, tx, tz, y, w, floorH - 0.03, d, '#3c4246', '#d8c6ee', 0.9, 0, false);
      // Tinted glass band at each floor's sill.
      wbox(l, tx, tz, y, w + 0.004, 0.035, d + 0.004, '#9fc3d6');
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 3; k++) {
          const ry = y + 0.04 + k * 0.1;
          const rz = -d / 2 + 0.06 + r * ((d - 0.12) / 3);
          wbox(l, ...off(l, tx, tz, 0, rz), ry, w - 0.08, 0.008, 0.03, '#9aa0a4');
          wbox(
            l,
            ...off(l, tx, tz, 0, rz),
            ry + 0.008,
            w - 0.1,
            0.022,
            0.026,
            tone('#5fb04a', 0.15),
          );
          wbox(l, ...off(l, tx, tz, 0, rz), ry + 0.06, w - 0.1, 0.004, 0.01, '#f2a6ff', 0, 0, 1);
        }
      wbox(l, tx, tz, y + floorH - 0.03, w + 0.04, 0.03, d + 0.04, '#e3e0d8');
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          wbox(l, ...off(l, tx, tz, (sx * w) / 2, (sz * d) / 2), y, 0.02, floorH, 0.02, '#3c4246');
    }
    // Roof: solar array and a rooftop garden with trees.
    const roofY = 0.036 + 3 * floorH;
    solarRow(l, tx - 0.06, tz - 0.06, roofY, 0.3, 4);
    solarRow(l, tx - 0.06, tz + 0.02, roofY, 0.3, 4);
    wbox(l, ...off(l, tx, tz, 0.15, 0), roofY, 0.12, 0.03, 0.26, '#6f4c34');
    for (let i = 0; i < 3; i++)
      shrub(l, ...off(l, tx, tz, 0.15, -0.08 + i * 0.08), 0.03, '#4f8a3a');
    l.beam([tx + 0.12, roofY, tz + 0.06], [tx + 0.12, roofY + 0.25, tz + 0.06], 0.008, '#c8cdd0');
    wbox(l, tx + 0.12, tz + 0.06, roofY + 0.25, 0.01, 0.01, 0.01, '#ff4a4a', 0, 0, 1);
    // Water recycling: round treatment tanks, pipes and a pump house.
    for (const [x, z, r] of [
      [0.84, 0.18, 0.1],
      [0.84, 0.46, 0.08],
    ] as const) {
      wround(l, x, z, r, r, 0.036, 0.14, '#d9dcdc', 20);
      wround(l, x, z, r * 0.9, r * 0.9, 0.172, 0.006, '#4f93b0', 20);
      wround(l, x, z, r + 0.004, r + 0.004, 0.17, 0.006, '#9aa0a4', 20);
    }
    l.beam([0.7, 0.12, 0.3], [0.84, 0.12, 0.18], 0.012, '#4f7fa8');
    l.beam([0.7, 0.1, 0.4], [0.84, 0.1, 0.46], 0.012, '#4f7fa8');
    // Solar carport, delivery van and a glass entrance canopy.
    for (let i = 0; i < 3; i++) {
      const x = 0.66 + i * 0.12;
      wbox(l, x, 0.74, 0.036, 0.01, 0.12, 0.01, '#9aa0a4');
      solarRow(l, x, 0.74, 0.14, 0.22, 2);
    }
    truck(l, 0.72, 0.8, 0, '#2f7a3a');
    truck(l, 0.88, 0.8, 0, '#e8e4dc');
    glassHouse(l, tx, tz + 0.18, 0.036, 0.16, 0.1, 0.06, '#3c4246', '#cfe6ee', 0.9, 0);
    // Front demonstration beds and trees.
    cropBed(l, 0.06, 0.82, 0.5, 0.96, 'greens', l.stage, 0.045);
    for (let i = 0; i < 5; i++) shrub(l, 0.08 + i * 0.1, 0.72, 0.024, '#3f7a3a');
    person(l, 0.4, 0.66, 0.036, '#f1ece2', '#2f7a3a');
    person(l, 0.6, 0.7, 0.036, '#2f5f86', '#2a2a2a');
    for (const x of [0.06, 0.94]) lanternPost(l, x, 0.6, 0.26);
    roundBale(l, 0.94, 0.94);
  },
};
