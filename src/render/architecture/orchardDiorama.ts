import * as THREE from 'three';
import {
  barrel,
  barrelLying,
  boardBody,
  cart,
  chimney,
  crate,
  cypress,
  door,
  halfTimber,
  lanternPost,
  meadow,
  off,
  orchardTree,
  path,
  person,
  railFence,
  renderBody,
  reseed,
  shingleGable,
  shrub,
  stoneBody,
  tone,
  wbox,
  window4,
  wround,
} from './diorama';
import { coneRoof, cropBed, glassHouse, vineRow, waterSheet } from './dioramaProps';
import { type Lot, type Recipes } from './lot';

// Group 5, chain 2 — orchards, fruit and wine (2×2, five tiers):
// berry_field -> market_garden -> orchard_estate -> vineyard_winery -> grand_chateau_vineyard

const grass = '#7aa64b';
const timber = '#5c3f27';
const plank = '#8a6142';
const white = '#f1ece2';
const limestone = '#e3d6b8';
const coats = ['#2f5f86', '#8a3b2c', '#3f6b3a', '#c49a3a', '#6a4f86'] as const;

/** Wicker basket, optionally full of fruit. */
function basket(l: Lot, x: number, z: number, fruit?: string): void {
  wround(l, x, z, 0.014, 0.011, 0.03, 0.016, '#b08850', 10);
  wround(l, x, z, 0.0145, 0.0145, 0.044, 0.003, '#8a6a3a', 10);
  if (fruit)
    for (let i = 0; i < 4; i++)
      l.shape(
        new THREE.SphereGeometry(0.005, 5, 4),
        fruit,
        ...off(l, x, z, i % 2 ? 0.005 : -0.005, i < 2 ? 0.005 : -0.005),
        0.048,
      );
}

/** Canvas shade awning on four poles. */
function awning(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  cloth: string,
): void {
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      wbox(l, ...off(l, x, z, (sx * w) / 2, (sz * d) / 2), 0.03, 0.008, h, 0.008, timber);
  const g = new THREE.BoxGeometry(w + 0.02, 0.004, d + 0.02);
  g.rotateX(0.12);
  l.shape(g, cloth, x, z, 0.03 + h + 0.004);
  for (let i = 0; i < 6; i++)
    wbox(
      l,
      ...off(l, x, z, -w / 2 + (i + 0.5) * (w / 6), d / 2 + 0.012),
      0.03 + h - 0.016,
      w / 12,
      0.016,
      0.002,
      i % 2 ? cloth : white,
    );
}

/** Low dry-stone wall from (x0, z) to (x1, z) or along z when `alongZ`. */
function stoneWall(l: Lot, a0: number, a1: number, at: number, alongZ = false, h = 0.05): void {
  const len = Math.abs(a1 - a0) * (alongZ ? l.spanZ : l.spanX);
  const n = Math.round(len / 0.03);
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < n; i++) {
      const t = a0 + ((i + 0.5 + (c % 2) * 0.5) / n) * (a1 - a0);
      if ((a1 > a0 && t > a1) || (a1 < a0 && t < a1)) continue;
      const [x, z] = alongZ ? [at, t] : [t, at];
      wbox(
        l,
        x,
        z,
        0.03 + c * (h / 2),
        alongZ ? 0.026 : 0.028,
        h / 2 - 0.002,
        alongZ ? 0.028 : 0.026,
        tone('#a8a196', 0.22),
        (i % 3) * 0.05,
      );
    }
  if (alongZ) wbox(l, at, (a0 + a1) / 2, 0.03 + h, 0.03, 0.008, len, '#8f8a80');
  else wbox(l, (a0 + a1) / 2, at, 0.03 + h, len, 0.008, 0.03, '#8f8a80');
}

/** Wine press: a slatted tub under a screw frame. */
function winePress(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.03, 0.03, 0.03, 0.01, timber, 12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * 0.022, Math.sin(a) * 0.022),
      0.04,
      0.006,
      0.04,
      0.004,
      tone(plank, 0.15),
      -a,
    );
  }
  wround(l, x, z, 0.02, 0.02, 0.07, 0.006, '#5a2a5e', 10);
  for (const e of [-1, 1]) wbox(l, ...off(l, x, z, e * 0.03, 0), 0.03, 0.008, 0.1, 0.008, timber);
  wbox(l, x, z, 0.13, 0.07, 0.01, 0.012, timber);
  wround(l, x, z, 0.004, 0.004, 0.08, 0.06, '#3a3530', 6);
  wbox(l, x, z, 0.1, 0.06, 0.004, 0.004, '#3a3530', 0.6);
}

export const orchardDiorama: Recipes = {
  berry_field(l) {
    reseed('berry_field');
    meadow(l, grass, 120);
    path(l, 0.5, 0.98, 0.5, 0.06, 0.1);
    path(l, 0.06, 0.5, 0.94, 0.5, 0.08);
    // Four berry beds of mixed bushes.
    cropBed(l, 0.06, 0.08, 0.44, 0.44, 'berry', l.stage, 0.07);
    cropBed(l, 0.56, 0.08, 0.94, 0.44, 'berry', l.stage, 0.07);
    cropBed(l, 0.06, 0.56, 0.44, 0.92, 'berry', l.stage, 0.07);
    cropBed(l, 0.56, 0.56, 0.94, 0.72, 'berry', l.stage, 0.07);
    // Canvas picking shelter with a trestle of baskets.
    awning(l, 0.76, 0.84, 0.3, 0.18, 0.13, '#d9c9a3');
    wbox(l, 0.76, 0.84, 0.07, 0.22, 0.008, 0.06, plank);
    for (const e of [-1, 1])
      wbox(l, ...off(l, 0.76, 0.84, e * 0.09, 0), 0.03, 0.008, 0.04, 0.05, timber);
    for (let i = 0; i < 5; i++)
      basket(l, ...off(l, 0.76, 0.84, -0.08 + i * 0.04, 0), i % 2 ? '#c3324f' : '#4a3a8a');
    for (let i = 0; i < 3; i++) basket(l, ...off(l, 0.76, 0.84, -0.06 + i * 0.05, 0.08), '#c3324f');
    // Pickers among the rows.
    person(l, 0.26, 0.47, 0.03, coats[3], '#d9c38a');
    person(l, 0.7, 0.48, 0.03, coats[1], '#d9c38a');
    person(l, 0.3, 0.74, 0.04, coats[0]);
    basket(l, 0.32, 0.5, '#c3324f');
    basket(l, 0.66, 0.52, '#4a3a8a');
    wround(l, 0.5, 0.5, 0.006, 0.008, 0.03, 0.12, timber, 6);
    wbox(l, 0.5, 0.5, 0.13, 0.06, 0.02, 0.004, white);
    orchardTree(l, 0.95, 0.94, 0.3, '#c3324f');
  },

  market_garden(l) {
    reseed('market_garden');
    meadow(l, grass, 60);
    path(l, 0.5, 0.98, 0.5, 0.4, 0.1);
    // Vegetable beds with drainage ditches between them.
    cropBed(l, 0.06, 0.46, 0.44, 0.66, 'cabbage', l.stage, 0.05);
    cropBed(l, 0.06, 0.72, 0.44, 0.94, 'carrot', l.stage, 0.045);
    cropBed(l, 0.56, 0.46, 0.94, 0.66, 'greens', l.stage, 0.045);
    cropBed(l, 0.56, 0.72, 0.94, 0.94, 'pumpkin', l.stage, 0.06);
    waterSheet(l, 0.25, 0.69, 0.76, 0.02, 0.026);
    waterSheet(l, 0.75, 0.69, 0.76, 0.02, 0.026);
    // Timber-framed seedling greenhouse.
    glassHouse(l, 0.28, 0.2, 0.04, 0.46, 0.14, 0.24, '#e8e2d2', '#cfe6e6', 0.2, 0.08);
    wbox(l, 0.28, 0.2, 0.03, 0.48, 0.012, 0.26, '#a8a196');
    for (let i = 0; i < 6; i++)
      wbox(l, 0.18 + i * 0.04, 0.2, 0.05, 0.03, 0.03, 0.18, tone('#5f9a44', 0.2));
    door(l, 0.28, 0.2, 0.46, 0.24, '+z', 0, 0.04, 0.05, 0.11, '#e8e2d2');
    // Gardener's hut with a storm lantern, tools and rain barrel.
    const hx = 0.78;
    const hz = 0.2;
    boardBody(l, hx, hz, 0.22, 0.18, 0.03, 0.2, '#6f8a5a');
    door(l, hx, hz, 0.22, 0.18, '+z', -0.04, 0.03, 0.05, 0.11, timber);
    window4(l, hx, hz, 0.22, 0.18, '+z', 0.06, 0.09, 0.04, { flowers: true });
    shingleGable(l, hx, hz, 'x', 0.22, 0.18, 0.23, 0.09, '#6e5444', '#6f8a5a');
    chimney(l, ...off(l, hx, hz, 0.07, -0.03), 0.26, 0.1, '#8f8a80');
    wbox(l, ...off(l, hx, hz, 0.04, 0.095), 0.15, 0.012, 0.018, 0.012, '#ffe1a0', 0, 0, 1);
    barrel(l, ...off(l, hx, hz, 0.14, 0.06));
    for (const t of [-0.05, -0.03])
      wbox(l, ...off(l, hx, hz, -0.12, t), 0.03, 0.004, 0.11, 0.004, '#7a5634', 0, 0.15);
    // Produce crates, wheelbarrow-cart and gardeners.
    for (let i = 0; i < 4; i++)
      crate(l, 0.58 + i * 0.03, 0.4, 0.03, ['#e07a2e', '#6fa34a', '#d23b2e', '#8dbb5a'][i]);
    cart(l, 0.42, 0.4, 0.4, 'crates');
    person(l, 0.24, 0.6, 0.04, coats[2], '#d9c38a');
    person(l, 0.76, 0.8, 0.04, coats[4]);
    railFence(l, 0.02, 0.98, 0.44, 0.98, white, 2);
    railFence(l, 0.56, 0.98, 0.98, 0.98, white, 2);
    shrub(l, 0.95, 0.4, 0.03);
    shrub(l, 0.05, 0.4, 0.03);
  },

  orchard_estate(l) {
    reseed('orchard_estate');
    meadow(l, grass, 70);
    // Stone-walled orchard of apple and pear trees on two terraces.
    stoneWall(l, 0.04, 0.96, 0.42);
    stoneWall(l, 0.42, 0.96, 0.04, true);
    stoneWall(l, 0.42, 0.96, 0.96, true);
    wbox(l, 0.5, 0.7, 0.03, 1.84, 0.03, 0.5, '#6f9a42');
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) {
        const x = 0.12 + c * 0.19 + (r % 2) * 0.06;
        if (x > 0.92) continue;
        orchardTree(
          l,
          x,
          0.52 + r * 0.16,
          0.34 + ((r + c) % 3) * 0.03,
          (r + c) % 2 ? '#d23b2e' : '#d9c14a',
        );
      }
    for (let i = 0; i < 6; i++) basket(l, 0.2 + i * 0.12, 0.62 + (i % 2) * 0.16, '#d23b2e');
    // Press house: stone ground floor, half-timbered loft, jam kitchen chimney.
    const px = 0.34;
    const pz = 0.2;
    stoneBody(l, px, pz, 0.48, 0.26, 0.03, 0.2, '#b7aa92', 0.03);
    renderBody(l, px, pz, 0.48, 0.26, 0.23, 0.13, '#efe2c4', '#e3d5b4');
    halfTimber(l, px, pz, 0.48, 0.26, 0.23, 0.13, '#4a3220');
    door(l, px, pz, 0.48, 0.26, '+z', -0.1, 0.03, 0.12, 0.15, timber, true);
    for (const t of [0.06, 0.16])
      window4(l, px, pz, 0.48, 0.26, '+z', t, 0.1, 0.05, { shutters: '#8a3b2c' });
    for (const t of [-0.12, 0.12])
      window4(l, px, pz, 0.48, 0.26, '+z', t, 0.26, 0.045, { flowers: true });
    window4(l, px, pz, 0.48, 0.26, '-x', 0, 0.26, 0.045);
    shingleGable(l, px, pz, 'x', 0.48, 0.26, 0.36, 0.16, '#8a4a34', '#efe2c4');
    chimney(l, ...off(l, px, pz, 0.17, -0.05), 0.4, 0.16);
    // Back porch stacked with oak casks and a cider press.
    for (let i = 0; i < 4; i++) barrelLying(l, 0.66 + i * 0.045, 0.12, 0);
    for (let i = 0; i < 3; i++) barrelLying(l, 0.68 + i * 0.045, 0.12, 0, 0.066);
    winePress(l, 0.72, 0.28);
    for (let i = 0; i < 3; i++) crate(l, 0.84 + (i % 2) * 0.03, 0.26 + i * 0.03, 0.03, '#d23b2e');
    for (let i = 0; i < 3; i++) wbox(l, 0.62 + i * 0.03, 0.36, 0.03, 0.02, 0.03, 0.02, '#c8392c');
    cart(l, 0.9, 0.34, 1.57, 'barrels');
    person(l, 0.6, 0.3, 0.03, coats[1]);
    person(l, 0.4, 0.66, 0.06, coats[3], '#d9c38a');
    person(l, 0.7, 0.82, 0.06, coats[0]);
    lanternPost(l, 0.06, 0.36, 0.18);
  },

  vineyard_winery(l) {
    reseed('vineyard_winery');
    meadow(l, '#88a84e', 40);
    // Terraced vine rows stepping down the slope, held by stone risers.
    for (let t = 0; t < 3; t++) {
      const y0 = 0.03 + (2 - t) * 0.03;
      const z0 = 0.46 + t * 0.17;
      wbox(l, 0.36, z0 + 0.08, 0.03, 1.36, y0 - 0.03 + 0.006, 0.34, '#8c6a46');
      for (let i = 0; i < 23; i++)
        wbox(
          l,
          0.03 + i * 0.03,
          z0 + 0.165,
          0.03,
          0.056,
          y0 - 0.03 + 0.004,
          0.012,
          tone('#a8a196', 0.2),
        );
      for (let r = 0; r < 3; r++) {
        const z = z0 + 0.03 + r * 0.05;
        // Vines sit on the terrace: lift each row by the terrace height.
        wbox(l, 0.36, z, y0, 1.3, 0.004, 0.02, '#6f4c34');
        vineRowAt(l, 0.05, 0.68, z, l.stage, y0 - 0.03);
      }
    }
    // Winery: limestone crush house with arched cellar door half sunk into the hill.
    const wx = 0.4;
    const wz = 0.2;
    stoneBody(l, wx, wz, 0.6, 0.3, 0.03, 0.26, limestone, 0.03);
    for (const t of [-0.2, 0, 0.2]) {
      window4(l, wx, wz, 0.6, 0.3, '+z', t, 0.14, 0.055, { shutters: '#5a2a5e' });
      window4(l, wx, wz, 0.6, 0.3, '-z', t, 0.14, 0.055);
    }
    shingleGable(l, wx, wz, 'x', 0.6, 0.3, 0.29, 0.16, '#b0563c', limestone);
    chimney(l, ...off(l, wx, wz, -0.2, -0.04), 0.32, 0.16, '#b7aa92');
    // Bell-cote and sign.
    const [btx, btz] = off(l, wx, wz, 0.36, 0.02);
    stoneBody(l, btx, btz, 0.12, 0.12, 0.03, 0.5, limestone, 0.03);
    for (const f of ['+z', '+x'] as const)
      window4(l, btx, btz, 0.12, 0.12, f, 0, 0.4, 0.045, { shutters: '#5a2a5e' });
    const btRoof = new THREE.ConeGeometry(0.1, 0.14, 4);
    btRoof.rotateY(Math.PI / 4);
    l.shape(btRoof, '#b0563c', btx, btz, 0.6);
    wround(l, btx, btz, 0.003, 0.003, 0.67, 0.04, '#2c3134', 6);
    wbox(l, ...off(l, wx, wz, 0, 0.158), 0.22, 0.14, 0.03, 0.004, '#5a2a5e');
    // Sunken cellar: earth mound with an arched stone portal.
    const cx = 0.86;
    const cz = 0.26;
    const mound = new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    mound.scale(1, 0.55, 1.1);
    l.shape(mound, '#6f9a42', cx, cz, 0.03);
    stoneBody(l, ...off(l, cx, cz, -0.14, 0), 0.04, 0.14, 0.03, 0.12, '#b7aa92', 0.025);
    const arch = new THREE.TorusGeometry(0.045, 0.012, 5, 12, Math.PI);
    arch.rotateY(Math.PI / 2);
    l.shape(arch, '#9a9385', ...off(l, cx, cz, -0.162, 0), 0.09);
    wbox(l, ...off(l, cx, cz, -0.163, 0), 0.03, 0.004, 0.06, 0.08, '#3a2a20');
    lanternPost(l, ...off(l, cx, cz, -0.18, 0.08), 0.12);
    // Crush pad: presses, grape bins, casks and harvest crew.
    winePress(l, 0.66, 0.4);
    winePress(l, 0.74, 0.42);
    for (let i = 0; i < 4; i++) {
      wbox(
        l,
        0.84 + (i % 2) * 0.05,
        0.44 + Math.floor(i / 2) * 0.04,
        0.03,
        0.04,
        0.025,
        0.03,
        plank,
      );
      wbox(
        l,
        0.84 + (i % 2) * 0.05,
        0.44 + Math.floor(i / 2) * 0.04,
        0.055,
        0.036,
        0.006,
        0.026,
        '#4a1f4e',
      );
    }
    for (let i = 0; i < 5; i++) barrelLying(l, 0.12 + i * 0.045, 0.42, 0);
    cart(l, 0.92, 0.6, 1.57, 'barrels');
    person(l, 0.7, 0.48, 0.03, coats[4]);
    person(l, 0.3, 0.6, 0.096, coats[3], '#d9c38a');
    person(l, 0.5, 0.78, 0.066, coats[1], '#d9c38a');
    for (const z of [0.6, 0.8]) cypress(l, 0.92, z + 0.1, 0.3);
  },

  grand_chateau_vineyard(l) {
    reseed('grand_chateau_vineyard');
    meadow(l, '#88a84e', 30);
    // Vineyard parterre at the front.
    for (let r = 0; r < 5; r++) {
      const z = 0.66 + r * 0.06;
      wbox(l, 0.25, z, 0.03, 0.84, 0.004, 0.02, '#6f4c34');
      vineRow(l, 0.05, 0.44, z, l.stage);
      wbox(l, 0.76, z, 0.03, 0.8, 0.004, 0.02, '#6f4c34');
      vineRow(l, 0.58, 0.95, z, l.stage);
    }
    // Gravel cour d'honneur and drive.
    wbox(l, 0.5, 0.5, 0.03, 1.6, 0.004, 0.2, '#d6cfbf');
    path(l, 0.5, 0.98, 0.5, 0.58, 0.14, '#d6cfbf');
    // Château: limestone corps de logis, slate mansard, dormers and two round towers.
    const cx = 0.5;
    const cz = 0.22;
    const cw = 0.84;
    const cd = 0.3;
    stoneBody(l, cx, cz, cw, cd, 0.03, 0.5, limestone, 0.035);
    wbox(l, cx, cz, 0.27, cw + 0.014, 0.012, cd + 0.014, '#d9cbaa');
    for (const t of [-0.3, -0.18, -0.06, 0.06, 0.18, 0.3]) {
      window4(l, cx, cz, cw, cd, '+z', t, 0.1, 0.06, { frame: white });
      window4(l, cx, cz, cw, cd, '+z', t, 0.32, 0.06, { frame: white, flowers: Math.abs(t) > 0.1 });
      window4(l, cx, cz, cw, cd, '-z', t, 0.32, 0.06, { frame: white });
    }
    door(l, cx, cz, cw, cd, '+z', 0, 0.03, 0.08, 0.16, '#3a2a1e');
    wbox(l, ...off(l, cx, cz, 0, cd / 2 + 0.03), 0.2, 0.14, 0.008, 0.06, '#2c3134');
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        ...off(l, cx, cz, -0.06 + i * 0.017, cd / 2 + 0.058),
        0.21,
        0.003,
        0.03,
        0.003,
        '#2c3134',
      );
    shingleGable(l, cx, cz, 'x', cw, cd, 0.53, 0.24, '#3c444c', limestone, 0.02);
    for (const t of [-0.24, 0, 0.24]) {
      const [dx, dz] = off(l, cx, cz, t, 0.08);
      wbox(l, dx, dz, 0.53, 0.08, 0.09, 0.06, limestone);
      shingleGable(l, dx, dz, 'z', 0.06, 0.08, 0.62, 0.05, '#3c444c', limestone, 0.01);
      window4(l, dx, dz, 0.08, 0.06, '+z', 0, 0.55, 0.04, { frame: white });
    }
    for (const e of [-1, 1]) chimney(l, ...off(l, cx, cz, e * 0.3, -0.04), 0.62, 0.18, '#d9cbaa');
    for (const e of [-1, 1]) {
      const [tx, tz] = off(l, cx, cz, e * (cw / 2 + 0.02), 0.1);
      for (let k = 0; k < 14; k++)
        wround(l, tx, tz, 0.085, 0.085, 0.03 + k * 0.045, 0.045, tone(limestone, 0.08), 16);
      for (const y of [0.12, 0.3, 0.48])
        window4(l, tx, tz, 0.17, 0.17, '+z', 0, y, 0.045, { frame: white });
      wround(l, tx, tz, 0.095, 0.09, 0.66, 0.02, '#d9cbaa', 16);
      coneRoof(l, tx, tz, 0.68, 0.1, 0.32, '#2f363c');
    }
    // Wrought-iron gate with stone piers, tasting terrace and lanterns.
    for (const e of [-1, 1]) {
      const [gx, gz] = off(l, 0.5, 0.98, e * 0.1, -0.02);
      stoneBody(l, gx, gz, 0.04, 0.04, 0.03, 0.16, limestone, 0.03);
      l.shape(new THREE.SphereGeometry(0.018, 8, 6), '#d7af4b', gx, gz, 0.21);
    }
    for (let i = 0; i < 9; i++)
      wbox(
        l,
        ...off(l, 0.5, 0.96, -0.08 + i * 0.02, 0),
        0.03,
        0.003,
        0.12 + Math.sin((i / 8) * Math.PI) * 0.04,
        0.003,
        '#2c3134',
      );
    for (const [x, z] of [
      [0.86, 0.5],
      [0.92, 0.5],
    ] as const) {
      wround(l, x, z, 0.022, 0.022, 0.06, 0.004, white, 10);
      wround(l, x, z, 0.004, 0.006, 0.03, 0.03, '#2c3134', 6);
      wbox(l, x, z, 0.064, 0.004, 0.012, 0.004, '#7a1f3a');
    }
    awning(l, 0.89, 0.5, 0.14, 0.1, 0.12, '#7a1f3a');
    for (const x of [0.36, 0.64]) lanternPost(l, x, 0.6, 0.18);
    for (const x of [0.08, 0.92]) cypress(l, x, 0.42, 0.36);
    for (let i = 0; i < 6; i++) shrub(l, 0.14 + i * 0.05, 0.42, 0.018, '#3f7a3a');
    for (let i = 0; i < 4; i++) barrelLying(l, 0.12 + i * 0.045, 0.52, 0);
    person(l, 0.88, 0.56, 0.03, '#7a1f3a', '#2a2a2a');
    person(l, 0.48, 0.52, 0.034, coats[4], '#2a2a2a');
    person(l, 0.3, 0.8, 0.03, coats[3], '#d9c38a');
  },
};

/** Vine row raised onto a terrace step. */
function vineRowAt(l: Lot, x0: number, x1: number, z: number, stage: number, lift: number): void {
  if (lift <= 0) {
    vineRow(l, x0, x1, z, stage);
    return;
  }
  const lifted: Lot = Object.create(l) as Lot;
  const shape = l.shape.bind(l);
  const beam = l.beam.bind(l);
  lifted.shape = (g, color, x, zz, y, glow) => shape(g, color, x, zz, y + lift, glow);
  lifted.beam = (a, b, t, c) => beam([a[0], a[1] + lift, a[2]], [b[0], b[1] + lift, b[2]], t, c);
  vineRow(lifted, x0, x1, z, stage);
}
