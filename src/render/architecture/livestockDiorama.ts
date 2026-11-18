import * as THREE from 'three';
import {
  barrel,
  barrelLying,
  boardBody,
  cart,
  chimney,
  cow,
  cupola,
  cypress,
  door,
  hayBale,
  hayRack,
  horse,
  lanternPost,
  meadow,
  milkCan,
  off,
  orchardTree,
  path,
  person,
  railFence,
  renderBody,
  reseed,
  roundBale,
  shingleGable,
  shingleGambrel,
  shrub,
  silo,
  stoneBody,
  tinGable,
  tone,
  trough,
  wbox,
  window4,
} from './diorama';
import { type Recipes } from './lot';

// Group 5, chain 3 — livestock and dairy (2×2, five tiers):
// pasture -> dairy_farm -> cheese_manufactory_ranch -> stud_farm_estate -> imperial_livestock_domain

const grass = '#78a24a';
const barnRed = '#a8382a';
const shingleBrown = '#6e5444';
const slate = '#56606a';
const stoneWarm = '#b7aa92';
const granite = '#a7a49c';
const marble = '#ece7dc';
const timber = '#5c3f27';
const white = '#f1ece2';
const coats = ['#2f5f86', '#8a3b2c', '#3f6b3a', '#c49a3a', '#6a4f86'] as const;

export const livestockDiorama: Recipes = {
  pasture(l) {
    reseed('pasture');
    meadow(l, grass, 160);
    path(l, 0.5, 0.98, 0.5, 0.62, 0.12);
    // Split-rail paddock with a gate gap at the front.
    railFence(l, 0.04, 0.04, 0.96, 0.04);
    railFence(l, 0.96, 0.04, 0.96, 0.96);
    railFence(l, 0.96, 0.96, 0.58, 0.96);
    railFence(l, 0.42, 0.96, 0.04, 0.96);
    railFence(l, 0.04, 0.96, 0.04, 0.04);
    wbox(l, 0.62, 0.92, 0.03, 0.012, 0.11, 0.012, timber);
    l.beam([0.58, 0.05, 0.96], [0.66, 0.06, 0.9], 0.007, '#8a6342');
    l.beam([0.58, 0.09, 0.96], [0.66, 0.1, 0.9], 0.007, '#8a6342');
    // Open-fronted plank shelter with a shingle roof.
    const sx = 0.72;
    const sz = 0.22;
    boardBody(l, sx, sz - 0.09, 0.42, 0.03, 0.03, 0.2, '#7b5a3c');
    for (const e of [-1, 1])
      boardBody(l, sx + (e * 0.2) / l.spanX, sz, 0.03, 0.2, 0.03, 0.2, '#7b5a3c');
    for (const e of [-1, 1])
      wbox(l, ...off(l, sx, sz, e * 0.2, 0.1), 0.03, 0.016, 0.2, 0.016, timber);
    shingleGable(l, sx, sz, 'x', 0.42, 0.24, 0.23, 0.08, shingleBrown, '#7b5a3c');
    hayRack(l, sx, sz + 0.02, 0);
    for (let i = 0; i < 3; i++) hayBale(l, ...off(l, sx, sz, -0.14 + i * 0.05, -0.04), 0.03, 0);
    hayBale(l, ...off(l, sx, sz, -0.115, -0.04), 0.056, 0);
    // Big apple tree, water trough, salt lick and the herd.
    orchardTree(l, 0.2, 0.22, 0.42, '#d23b2e');
    trough(l, 0.36, 0.48, 0.14, 0.3);
    wbox(l, 0.84, 0.6, 0.03, 0.02, 0.016, 0.02, '#e9e1d8');
    cow(l, 0.3, 0.62, 0.4);
    cow(l, 0.44, 0.38, -1.2, false, true);
    cow(l, 0.66, 0.56, 2.6, true, true);
    cow(l, 0.78, 0.74, 3.6);
    cow(l, 0.22, 0.8, 1.2, false, true);
    roundBale(l, 0.86, 0.86, 0.6);
    person(l, 0.5, 0.78, 0.03, coats[0]);
    for (let i = 0; i < 6; i++) shrub(l, 0.08 + i * 0.03, 0.06 + (i % 2) * 0.02, 0.02);
  },

  dairy_farm(l) {
    reseed('dairy_farm');
    meadow(l, grass, 90);
    wbox(l, 0.42, 0.44, 0.03, 1.28, 0.004, 0.88, '#b49b74');
    path(l, 0.42, 0.98, 0.42, 0.64, 0.14, '#a9906b');
    // Red barn: plank walls, shingled gambrel roof with the gable to the yard.
    const bx = 0.27;
    const bz = 0.3;
    const bw = 0.46;
    const bd = 0.56;
    wbox(l, bx, bz, 0.03, bw + 0.02, 0.03, bd + 0.02, '#a59d8c');
    boardBody(l, bx, bz, bw, bd, 0.06, 0.3, barnRed);
    door(l, bx, bz, bw, bd, '+z', 0, 0.06, 0.2, 0.2, barnRed, true);
    door(l, bx, bz, bw, bd, '-z', 0, 0.06, 0.16, 0.18, barnRed, true);
    window4(l, bx, bz, bw, bd, '+z', 0, 0.3, 0.07, { frame: white });
    for (const t of [-0.16, 0, 0.16]) {
      window4(l, bx, bz, bw, bd, '+x', t, 0.17, 0.05, { frame: white });
      window4(l, bx, bz, bw, bd, '-x', t, 0.17, 0.05, { frame: white });
    }
    shingleGambrel(l, bx, bz, 'z', bd, bw, 0.36, 0.26, shingleBrown, barnRed);
    cupola(l, bx, bz, 0.6, 0.07, shingleBrown);
    // Stave silo.
    silo(l, 0.56, 0.12, 0.075, 0.62, '#c9cdd0');
    // Stone milk house with a bench of churns.
    const mx = 0.76;
    const mz = 0.42;
    stoneBody(l, mx, mz, 0.34, 0.26, 0.03, 0.2, stoneWarm);
    shingleGable(l, mx, mz, 'x', 0.34, 0.26, 0.23, 0.1, shingleBrown, stoneWarm);
    chimney(l, ...off(l, mx, mz, 0.12, -0.04), 0.26, 0.14);
    door(l, mx, mz, 0.34, 0.26, '+z', -0.06, 0.03, 0.06, 0.12, timber);
    window4(l, mx, mz, 0.34, 0.26, '+z', 0.08, 0.1, 0.05, { shutters: '#2f5f6a' });
    window4(l, mx, mz, 0.34, 0.26, '+x', 0, 0.1, 0.05, { shutters: '#2f5f6a' });
    wbox(l, ...off(l, mx, mz, 0.06, 0.18), 0.03, 0.12, 0.004, 0.03, timber);
    wbox(l, ...off(l, mx, mz, 0.06, 0.18), 0.05, 0.12, 0.008, 0.034, '#8a6342');
    for (let i = 0; i < 4; i++) milkCan(l, ...off(l, mx, mz, 0.015 + i * 0.03, 0.18), 0.058);
    for (let i = 0; i < 3; i++) milkCan(l, ...off(l, mx, mz, -0.16 + i * 0.022, 0.16));
    // Fenced cow yard with a muddy floor.
    wbox(l, 0.27, 0.74, 0.03, 0.5, 0.004, 0.24, '#8c7354');
    railFence(l, 0.05, 0.62, 0.05, 0.86);
    railFence(l, 0.05, 0.86, 0.36, 0.86);
    railFence(l, 0.5, 0.62, 0.5, 0.86);
    cow(l, 0.14, 0.72, 0.2);
    cow(l, 0.3, 0.78, 2.8, false, true);
    cow(l, 0.42, 0.7, 4.2, true);
    trough(l, 0.12, 0.82, 0.1, 0);
    // Orchard and the cart.
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++)
        orchardTree(l, 0.64 + c * 0.12, 0.72 + r * 0.14, 0.24, c === 1 ? '#e2b13a' : '#d23b2e');
    cart(l, 0.6, 0.6, 0.3, 'cans');
    person(l, 0.48, 0.56, 0.03, coats[1]);
    person(l, 0.7, 0.62, 0.03, coats[3], '#d9c58a');
    for (let i = 0; i < 3; i++) hayBale(l, 0.08, 0.1 + i * 0.05, 0.03, Math.PI / 2);
  },

  cheese_manufactory_ranch(l) {
    reseed('cheese_manufactory_ranch');
    meadow(l, grass, 80);
    wbox(l, 0.46, 0.4, 0.03, 1.36, 0.004, 0.72, '#b8ad98');
    for (let i = 0; i < 60; i++)
      wbox(
        l,
        0.1 + ((i * 37) % 80) / 100,
        0.1 + ((i * 53) % 58) / 100,
        0.031,
        0.02,
        0.004,
        0.014,
        tone('#a99e88', 0.2),
        (i % 3) * 0.5,
      );
    // Two-storey granite cheese house with dormers and twin chimneys.
    const hx = 0.36;
    const hz = 0.26;
    const hw = 0.6;
    const hd = 0.36;
    stoneBody(l, hx, hz, hw, hd, 0.03, 0.46, granite, 0.034);
    wbox(l, hx, hz, 0.25, hw + 0.016, 0.014, hd + 0.016, '#d9d2c2');
    for (const t of [-0.2, -0.07, 0.07, 0.2]) {
      window4(l, hx, hz, hw, hd, '+z', t, 0.3, 0.05, { shutters: '#3f5f4a', flowers: true });
      window4(l, hx, hz, hw, hd, '-z', t, 0.3, 0.05, { shutters: '#3f5f4a' });
    }
    for (const t of [-0.2, 0.2])
      window4(l, hx, hz, hw, hd, '+z', t, 0.1, 0.06, { shutters: '#3f5f4a' });
    for (const t of [-0.08, 0.08]) {
      window4(l, hx, hz, hw, hd, '+x', t, 0.3, 0.05, { shutters: '#3f5f4a' });
      window4(l, hx, hz, hw, hd, '-x', t, 0.3, 0.05, { shutters: '#3f5f4a' });
    }
    door(l, hx, hz, hw, hd, '+z', 0, 0.03, 0.16, 0.16, '#5a3a24', true);
    wbox(l, ...off(l, hx, hz, 0, hd / 2 + 0.006), 0.2, 0.12, 0.03, 0.006, '#d9d2c2');
    wbox(l, ...off(l, hx, hz, 0, hd / 2 + 0.01), 0.205, 0.1, 0.018, 0.004, '#e2b13a');
    shingleGable(l, hx, hz, 'x', hw, hd, 0.49, 0.24, slate, granite);
    for (const t of [-0.14, 0.14]) {
      const [dx, dz] = off(l, hx, hz, t, 0.1);
      stoneBody(l, dx, dz, 0.08, 0.08, 0.53, 0.09, granite, 0.03);
      shingleGable(l, dx, dz, 'z', 0.08, 0.08, 0.62, 0.05, slate, granite);
      window4(l, dx, dz, 0.08, 0.08, '+z', 0, 0.55, 0.04);
    }
    for (const e of [-1, 1])
      chimney(l, ...off(l, hx, hz, e * (hw / 2 - 0.04), -0.06), 0.62, 0.22, '#8a7f72');
    // Cheese drying rack: open shelving with golden wheels under a lean-to.
    const rx = 0.84;
    const rz = 0.3;
    for (const e of [-1, 1])
      for (const f of [-1, 1])
        wbox(l, ...off(l, rx, rz, e * 0.1, f * 0.12), 0.03, 0.014, 0.22, 0.014, timber);
    for (let s = 0; s < 4; s++) {
      wbox(l, rx, rz, 0.06 + s * 0.05, 0.2, 0.006, 0.24, '#8a6342');
      for (let k = 0; k < 5; k++) {
        for (const f of [-0.06, 0.06]) {
          const g = new THREE.CylinderGeometry(0.018, 0.018, 0.016, 12);
          l.shape(
            g,
            tone('#e8b843', 0.12),
            ...off(l, rx, rz, -0.08 + k * 0.04, f),
            0.074 + s * 0.05,
          );
        }
      }
    }
    tinGable(l, rx, rz, 'z', 0.28, 0.24, 0.25, 0.06, '#8f9a9e');
    // Stave silo and a smaller stock barn.
    silo(l, 0.86, 0.66, 0.07, 0.72, '#bfb8a6');
    boardBody(l, 0.64, 0.66, 0.26, 0.22, 0.03, 0.18, '#7b5a3c');
    shingleGable(l, 0.64, 0.66, 'x', 0.26, 0.22, 0.21, 0.08, shingleBrown, '#7b5a3c');
    door(l, 0.64, 0.66, 0.26, 0.22, '+z', 0, 0.03, 0.12, 0.13, '#7b5a3c', true);
    // Paddock with cows, cart of cheeses, barrels and staff.
    railFence(l, 0.04, 0.62, 0.48, 0.62);
    railFence(l, 0.04, 0.96, 0.48, 0.96);
    railFence(l, 0.04, 0.62, 0.04, 0.96);
    railFence(l, 0.48, 0.62, 0.48, 0.96);
    cow(l, 0.14, 0.76, 0.3);
    cow(l, 0.32, 0.84, 2.6, true, true);
    cow(l, 0.36, 0.7, 4, false, true);
    trough(l, 0.2, 0.9, 0.12, 0);
    cart(l, 0.62, 0.9, 0.2, 'crates');
    for (let i = 0; i < 3; i++) barrelLying(l, ...off(l, 0.78, 0.9, i * 0.04 - 0.04, 0), 0, 0.03);
    barrel(l, 0.92, 0.9);
    person(l, 0.56, 0.5, 0.03, coats[2]);
    person(l, 0.72, 0.48, 0.03, white, '#d9c58a');
    lanternPost(l, 0.58, 0.32, 0.18);
  },

  stud_farm_estate(l) {
    reseed('stud_farm_estate');
    meadow(l, '#7aa94e', 70);
    // Long varnished stable block with Dutch doors, horses looking out, clock cupola.
    const sx = 0.5;
    const sz = 0.14;
    wbox(l, sx, sz, 0.03, 1.66, 0.02, 0.36, '#a59d8c');
    boardBody(l, sx, sz, 1.6, 0.3, 0.05, 0.24, '#7a4a2a');
    for (let i = 0; i < 8; i++) {
      const t = -0.7 + i * 0.2;
      door(l, sx, sz, 1.6, 0.3, '+z', t, 0.05, 0.07, 0.15, '#3f5f4a');
      wbox(l, ...off(l, sx, sz, t, 0.158), 0.13, 0.07, 0.002, 0.004, '#efe7d6');
      if (i % 2 === 0) {
        const [hx, hz] = off(l, sx, sz, t, 0.16);
        wbox(l, hx, hz, 0.15, 0.022, 0.03, 0.03, i % 4 ? '#3a2a20' : '#9a6a3a');
        wbox(l, hx, hz + 0.01 / l.spanZ, 0.15, 0.016, 0.014, 0.02, '#2a1d16');
      }
      window4(l, sx, sz, 1.6, 0.3, '-z', t, 0.17, 0.04, { frame: white });
    }
    shingleGable(l, sx, sz, 'x', 1.6, 0.3, 0.29, 0.12, slate, '#7a4a2a');
    // Clock tower over the arch.
    wbox(l, sx, sz, 0.38, 0.12, 0.2, 0.12, white);
    for (const [dx, dz] of [
      [0, 0.061],
      [0, -0.061],
    ] as const) {
      wbox(l, ...off(l, sx, sz, dx, dz), 0.47, 0.05, 0.05, 0.004, '#f6f0dc');
      wbox(
        l,
        ...off(l, sx, sz, dx, dz + Math.sign(dz) * 0.004),
        0.5 + 0.015,
        0.003,
        0.018,
        0.002,
        '#222222',
      );
    }
    cupola(l, sx, sz, 0.58, 0.09, slate);
    // Manor house: rendered walls, slate hipped-gable roof, shuttered windows, porch.
    const mx = 0.8;
    const mz = 0.46;
    renderBody(l, mx, mz, 0.36, 0.28, 0.03, 0.48, '#efe2c4', '#bfb19a');
    for (const yy of [0.1, 0.32]) {
      for (const t of [-0.11, 0.11])
        window4(l, mx, mz, 0.36, 0.28, '+z', t, yy, 0.05, {
          shutters: '#2f4f6a',
          flowers: yy > 0.2,
        });
      for (const t of [-0.07, 0.07])
        window4(l, mx, mz, 0.36, 0.28, '-x', t, yy, 0.05, { shutters: '#2f4f6a' });
    }
    door(l, mx, mz, 0.36, 0.28, '+z', 0, 0.03, 0.06, 0.13, '#3a2a1e');
    for (const e of [-1, 1])
      wbox(l, ...off(l, mx, mz, e * 0.05, 0.19), 0.03, 0.012, 0.14, 0.012, white);
    shingleGable(l, ...off(l, mx, mz, 0, 0.17), 'z', 0.1, 0.14, 0.17, 0.05, slate, white);
    shingleGable(l, mx, mz, 'x', 0.36, 0.28, 0.51, 0.18, slate, '#efe2c4');
    chimney(l, ...off(l, mx, mz, 0.12, 0), 0.58, 0.18);
    chimney(l, ...off(l, mx, mz, -0.12, 0), 0.58, 0.18);
    // Sand riding arena with white rails, jumps and horses.
    wbox(l, 0.32, 0.66, 0.03, 0.96, 0.006, 0.52, '#d9c49a');
    railFence(l, 0.06, 0.42, 0.58, 0.42, white, 3);
    railFence(l, 0.06, 0.92, 0.58, 0.92, white, 3);
    railFence(l, 0.06, 0.42, 0.06, 0.92, white, 3);
    railFence(l, 0.58, 0.42, 0.58, 0.6, white, 3);
    railFence(l, 0.58, 0.74, 0.58, 0.92, white, 3);
    for (const [jx, jz] of [
      [0.2, 0.56],
      [0.42, 0.78],
    ] as const) {
      for (const e of [-1, 1])
        wbox(l, ...off(l, jx, jz, e * 0.06, 0), 0.03, 0.01, 0.08, 0.01, white);
      for (const yy of [0.06, 0.09])
        wbox(l, jx, jz, yy, 0.12, 0.006, 0.006, yy > 0.07 ? '#c8392c' : white);
    }
    horse(l, 0.3, 0.6, 0.5);
    horse(l, 0.46, 0.66, 2.6, '#3a2a20');
    horse(l, 0.18, 0.8, -0.4, '#c9a06a');
    person(l, 0.34, 0.74, 0.036, coats[4], '#2a2a2a');
    // Grounds: gravel drive, clipped hedges, cypresses, lanterns.
    path(l, 0.8, 0.98, 0.8, 0.62, 0.14, '#cfc6b4');
    for (let i = 0; i < 5; i++) shrub(l, 0.68, 0.66 + i * 0.07, 0.022, '#3f7a3a');
    for (let i = 0; i < 5; i++) shrub(l, 0.92, 0.66 + i * 0.07, 0.022, '#3f7a3a');
    cypress(l, 0.64, 0.36, 0.32);
    cypress(l, 0.96, 0.32, 0.3);
    lanternPost(l, 0.72, 0.92);
    lanternPost(l, 0.88, 0.92);
    for (let i = 0; i < 4; i++) roundBale(l, 0.08 + i * 0.06, 0.34, 0);
  },

  imperial_livestock_domain(l) {
    reseed('imperial_livestock_domain');
    meadow(l, '#79a84d', 50);
    wbox(l, 0.5, 0.56, 0.03, 1.84, 0.004, 0.4, '#d6cfbf');
    // Marble genetics institute with a portico, pediment and copper dome.
    const ix = 0.34;
    const iz = 0.22;
    const iw = 0.62;
    const id = 0.34;
    stoneBody(l, ix, iz, iw + 0.03, id + 0.03, 0.03, 0.06, '#c9c2b2', 0.03);
    stoneBody(l, ix, iz, iw, id, 0.09, 0.42, marble, 0.042);
    for (const t of [-0.24, -0.12, 0.12, 0.24]) {
      window4(l, ix, iz, iw, id, '+z', t, 0.16, 0.05, { frame: '#d9d2c2' });
      window4(l, ix, iz, iw, id, '+z', t, 0.34, 0.05, { frame: '#d9d2c2' });
      window4(l, ix, iz, iw, id, '-z', t, 0.26, 0.05, { frame: '#d9d2c2' });
    }
    for (const t of [-0.08, 0.08]) {
      window4(l, ix, iz, iw, id, '+x', t, 0.26, 0.05, { frame: '#d9d2c2' });
      window4(l, ix, iz, iw, id, '-x', t, 0.26, 0.05, { frame: '#d9d2c2' });
    }
    wbox(l, ix, iz, 0.51, iw + 0.03, 0.024, id + 0.03, '#d9d2c2');
    for (let i = 0; i < 22; i++)
      wbox(
        l,
        ...off(l, ix, iz, -iw / 2 + 0.014 + i * (iw / 22), id / 2 + 0.014),
        0.5,
        0.008,
        0.008,
        0.008,
        marble,
      );
    // Portico.
    const [px, pz] = off(l, ix, iz, 0, id / 2 + 0.08);
    wbox(l, px, pz, 0.03, 0.26, 0.06, 0.16, '#d9d2c2');
    for (let s = 0; s < 3; s++)
      wbox(l, ...off(l, px, pz, 0, 0.09 + s * 0.02), 0.03, 0.24, 0.06 - s * 0.02, 0.02, '#e3ddd0');
    for (let i = 0; i < 4; i++) {
      const [cx, cz] = off(l, px, pz, -0.09 + i * 0.06, 0.05);
      l.round(cx, cz, 0.011, 0.013, 0.09, 0.36, marble);
      wbox(l, cx, cz, 0.09, 0.03, 0.012, 0.03, '#d9d2c2');
      wbox(l, cx, cz, 0.44, 0.032, 0.012, 0.032, '#d9d2c2');
    }
    wbox(l, px, pz, 0.45, 0.28, 0.04, 0.16, marble);
    shingleGable(l, px, pz, 'z', 0.16, 0.28, 0.49, 0.09, '#9aa3a0', marble);
    wbox(l, ...off(l, px, pz, 0, 0.081), 0.5, 0.05, 0.03, 0.002, '#d7af4b');
    // Copper dome on a drum.
    l.round(ix, iz, 0.09, 0.09, 0.53, 0.12, marble);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, ix, iz, Math.cos(a) * 0.182, Math.sin(a) * 0.182),
        0.56,
        0.016,
        0.06,
        0.016,
        '#f2c766',
        -a,
        0,
        1,
      );
    }
    l.dome(ix, iz, 0.095, 0.095, 0.65, 0.22, '#5f9b88');
    l.round(ix, iz, 0.012, 0.018, 0.86, 0.06, '#5f9b88');
    l.shape(new THREE.SphereGeometry(0.014, 8, 6), '#d7af4b', ix, iz, 0.94);
    // Ventilated modern dairy barn with curtain sides and ridge vents.
    const bx = 0.82;
    const bz = 0.24;
    wbox(l, bx, bz, 0.03, 0.34, 0.02, 0.44, '#a59d8c');
    for (let i = 0; i <= 5; i++)
      for (const e of [-1, 1])
        wbox(
          l,
          ...off(l, bx, bz, e * 0.16, -0.21 + i * 0.084),
          0.05,
          0.012,
          0.22,
          0.012,
          '#d9dcdc',
        );
    for (const e of [-1, 1]) {
      wbox(l, ...off(l, bx, bz, e * 0.162, 0), 0.05, 0.004, 0.06, 0.42, '#e8eaea');
      wbox(l, ...off(l, bx, bz, e * 0.162, 0), 0.18, 0.003, 0.08, 0.42, '#c9d3d6');
    }
    for (let i = 0; i < 4; i++)
      cow(
        l,
        ...off(l, bx, bz, -0.06 + (i % 2) * 0.12, -0.15 + i * 0.1),
        Math.PI / 2 + (i % 2 ? Math.PI : 0),
      );
    tinGable(l, bx, bz, 'z', 0.44, 0.34, 0.27, 0.1, '#7f8a8e');
    for (let i = 0; i < 4; i++)
      l.round(...off(l, bx, bz, 0, -0.15 + i * 0.1), 0.012, 0.016, 0.36, 0.03, '#c9cdd0');
    silo(l, 0.95, 0.07, 0.045, 0.62, '#3c5f86', false);
    // Ornate gate arch with garlands, bronze bull, fountain and formal gardens.
    const gx = 0.5;
    const gz = 0.96;
    for (const e of [-1, 1]) {
      stoneBody(l, ...off(l, gx, gz, e * 0.14, 0), 0.06, 0.06, 0.03, 0.26, marble, 0.03);
      l.shape(
        new THREE.SphereGeometry(0.022, 10, 8),
        '#d7af4b',
        ...off(l, gx, gz, e * 0.14, 0),
        0.31,
      );
      for (let i = 0; i < 6; i++)
        l.shape(
          new THREE.SphereGeometry(0.008, 6, 4),
          ['#e24864', '#f7d23d', '#f2f0ea'][i % 3]!,
          ...off(l, gx, gz, e * 0.14 - e * 0.036, -0.02 + i * 0.008),
          0.08 + i * 0.03,
        );
    }
    l.beam([gx - 0.07, 0.27, gz], [gx, 0.32, gz], 0.012, '#2c3134');
    l.beam([gx, 0.32, gz], [gx + 0.07, 0.27, gz], 0.012, '#2c3134');
    for (let i = 0; i < 8; i++)
      wbox(l, ...off(l, gx, gz, -0.1 + i * 0.028, 0), 0.03, 0.004, 0.2, 0.004, '#2c3134');
    // Bull statue.
    const [ux, uz] = [0.5, 0.56];
    l.round(ux, uz, 0.07, 0.075, 0.03, 0.04, '#cfc8b8');
    l.round(ux, uz, 0.06, 0.06, 0.07, 0.006, '#5e9cb4');
    wbox(l, ux, uz, 0.076, 0.05, 0.06, 0.05, '#cfc8b8');
    wbox(l, ux, uz, 0.166, 0.08, 0.04, 0.034, '#7a5a3a');
    for (const [f, sd] of [
      [0.026, 0.012],
      [0.026, -0.012],
      [-0.026, 0.012],
      [-0.026, -0.012],
    ] as const) {
      wbox(l, ...off(l, ux, uz, f, sd), 0.136, 0.01, 0.03, 0.01, '#7a5a3a');
    }
    wbox(l, ...off(l, ux, uz, 0.05, 0), 0.19, 0.026, 0.03, 0.026, '#7a5a3a');
    wbox(l, ...off(l, ux, uz, 0.05, 0), 0.222, 0.006, 0.006, 0.05, '#e9dfc4');
    for (let i = 0; i < 6; i++) cypress(l, 0.06 + i * 0.064, 0.48, 0.24);
    for (let i = 0; i < 6; i++) cypress(l, 0.62 + i * 0.064, 0.48, 0.24);
    for (let i = 0; i < 10; i++)
      shrub(l, 0.08 + i * 0.09, 0.66, 0.02, i % 2 ? '#3f7a3a' : '#4f8a3a');
    // Show paddock with prize cattle and horses.
    railFence(l, 0.04, 0.72, 0.36, 0.72, white, 3);
    railFence(l, 0.64, 0.72, 0.96, 0.72, white, 3);
    cow(l, 0.14, 0.84, 0.3);
    cow(l, 0.28, 0.86, 2.9, true);
    horse(l, 0.74, 0.84, 0.4);
    horse(l, 0.88, 0.86, 3.4, '#3a2a20');
    for (const lx of [0.38, 0.62]) lanternPost(l, lx, 0.9, 0.22);
    person(l, 0.44, 0.7, 0.034, coats[0], '#2a2a2a');
    person(l, 0.56, 0.74, 0.034, white, '#d9c58a');
  },
};
