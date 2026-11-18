import * as THREE from 'three';
import {
  barrel,
  barrelLying,
  boardBody,
  chimney,
  crate,
  cypress,
  door,
  lanternPost,
  meadow,
  off,
  orchardTree,
  path,
  person,
  railFence,
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
import {
  boat,
  campfire,
  coneRoof,
  crane,
  deer,
  dog,
  dryingRack,
  falcon,
  glassHouse,
  logBody,
  pier,
  smoke,
  waterSheet,
} from './dioramaProps';
import { type Lot, type Recipes } from './lot';

// Group 5, chains 4 and 5 (1×1 lots):
// fishing_dock -> smokery_fishery -> trawler_wharf -> seafood_exchange -> cannery_harbor_complex
// hunting_lodge -> gamekeeper_lodge -> falconry_manor -> royal_hunting_palace

const grass = '#7aa64b';
const timber = '#5c3f27';
const plank = '#8a6142';
const white = '#f1ece2';
const brick = '#a5452f';
const sea = '#3f8fae';
const coats = ['#2f5f86', '#8a3b2c', '#3f6b3a', '#c49a3a', '#6a4f86'] as const;

/** Shore: grass at the back, a sand strip, then sea over the front of the lot from `edge`. */
function shore(l: Lot, edge: number, seed: string, sand = true): void {
  reseed(seed);
  meadow(l, grass, 30);
  if (sand) wbox(l, 0.5, edge - 0.05, 0.03, 0.96, 0.004, 0.1, '#e3d2a2');
  const depth = (0.98 - edge) * l.spanZ;
  waterSheet(l, 0.5, (edge + 0.98) / 2, 0.96, depth, 0.034, sea);
  for (let i = 0; i < 6; i++)
    wbox(l, 0.1 + i * 0.16, edge + 0.01, 0.036, 0.08, 0.003, 0.008, '#e8f4f6');
}

/** Hanging fishing net on a pole frame. */
function netFrame(l: Lot, x: number, z: number): void {
  for (const e of [-1, 1])
    wbox(l, ...off(l, x, z, e * 0.05, 0), 0.03, 0.006, 0.12, 0.006, '#a08a5a');
  wbox(l, x, z, 0.145, 0.11, 0.005, 0.005, '#a08a5a');
  for (let i = 0; i < 7; i++)
    wbox(l, ...off(l, x, z, -0.042 + i * 0.014, 0), 0.06, 0.002, 0.085, 0.002, '#5f6f62');
  for (let k = 0; k < 5; k++) wbox(l, x, z, 0.07 + k * 0.016, 0.09, 0.002, 0.002, '#5f6f62');
}

/** Bollard with a coil of rope. */
function bollard(l: Lot, x: number, z: number, y: number): void {
  wround(l, x, z, 0.007, 0.009, y, 0.02, '#3a3530', 8);
  const coil = new THREE.TorusGeometry(0.012, 0.003, 4, 10);
  coil.rotateX(Math.PI / 2);
  l.shape(coil, '#c9b48a', ...off(l, x, z, 0.02, 0), y + 0.004);
}

/** Basket of fish. */
function fishBox(l: Lot, x: number, z: number, y: number): void {
  wbox(l, x, z, y, 0.03, 0.014, 0.022, '#7a8a90');
  for (let i = 0; i < 3; i++)
    wbox(
      l,
      ...off(l, x, z, -0.008 + i * 0.008, 0),
      y + 0.014,
      0.006,
      0.004,
      0.018,
      '#b8c4c9',
      i * 0.4,
    );
}

export const coastDiorama: Recipes = {
  fishing_dock(l) {
    shore(l, 0.52, 'fishing_dock');
    // Rough plank jetty and landing stage running out to sea.
    pier(l, 0.32, 0.4, 0.32, 0.96, 0.1, 0.06);
    pier(l, 0.32, 0.86, 0.62, 0.86, 0.08, 0.06);
    for (const [x, z] of [
      [0.26, 0.96],
      [0.38, 0.96],
      [0.62, 0.9],
    ] as const)
      bollard(l, x, z, 0.068);
    // Rowing boat tied up beside the jetty.
    boat(l, 0.56, 0.7, Math.PI / 2, 0.16, '#7a5634', { y: 0.026 });
    l.beam([0.56, 0.05, 0.62], [0.36, 0.07, 0.62], 0.002, '#c9b48a');
    // Plank fisher's shed with shingle roof.
    const hx = 0.66;
    const hz = 0.24;
    boardBody(l, hx, hz, 0.24, 0.2, 0.03, 0.16, '#8a6a48');
    door(l, hx, hz, 0.24, 0.2, '+z', -0.05, 0.03, 0.05, 0.11, timber);
    window4(l, hx, hz, 0.24, 0.2, '+z', 0.06, 0.09, 0.04, { shutters: '#2f5f6a' });
    window4(l, hx, hz, 0.24, 0.2, '-x', 0, 0.09, 0.04);
    shingleGable(l, hx, hz, 'z', 0.2, 0.24, 0.19, 0.1, '#6e5444', '#8a6a48');
    chimney(l, ...off(l, hx, hz, 0.07, -0.05), 0.22, 0.08, '#8f8a80');
    // Bamboo drying rack, net frame, buckets and the fisherman.
    dryingRack(l, 0.82, 0.44, 0);
    netFrame(l, 0.14, 0.3);
    barrel(l, 0.48, 0.34);
    fishBox(l, 0.36, 0.5, 0.068);
    fishBox(l, 0.3, 0.6, 0.068);
    person(l, 0.34, 0.7, 0.068, coats[0], '#d9c38a');
    person(l, 0.52, 0.42, 0.03, coats[3]);
    orchardTree(l, 0.1, 0.1, 0.3, '#d23b2e');
    orchardTree(l, 0.22, 0.08, 0.26, '#d9c14a');
  },

  smokery_fishery(l) {
    shore(l, 0.56, 'smokery_fishery');
    // Cobbled quay with a stone edge.
    wbox(l, 0.5, 0.48, 0.03, 0.96, 0.02, 0.18, '#a8a196');
    for (let i = 0; i < 24; i++)
      wbox(l, 0.03 + i * 0.04, 0.56, 0.03, 0.038, 0.03, 0.02, tone('#8f8a80', 0.2));
    pier(l, 0.24, 0.56, 0.24, 0.94, 0.08, 0.05);
    boat(l, 0.5, 0.78, Math.PI / 2, 0.24, '#7a5634', { sail: true, y: 0.026 });
    // Oak smokehouse: plank walls, brick smoke chimney with drifting smoke.
    const sx = 0.32;
    const sz = 0.2;
    boardBody(l, sx, sz, 0.3, 0.22, 0.03, 0.2, '#6b4a2c');
    door(l, sx, sz, 0.3, 0.22, '+z', 0, 0.03, 0.06, 0.13, timber, true);
    for (let i = 0; i < 4; i++)
      wbox(l, ...off(l, sx, sz, -0.15, -0.06 + i * 0.04), 0.1, 0.004, 0.04, 0.02, '#3a2a20');
    shingleGable(l, sx, sz, 'x', 0.3, 0.22, 0.23, 0.11, '#5a4434', '#6b4a2c');
    chimney(l, ...off(l, sx, sz, 0.1, -0.04), 0.28, 0.14, '#9a5a40');
    smoke(l, ...off(l, sx, sz, 0.1, -0.04), 0.44, 3);
    // Salting shed (lean-to) with brine barrels.
    const tx = 0.74;
    const tz = 0.22;
    for (const [dx, dz] of [
      [-0.1, 0.08],
      [0.1, 0.08],
    ] as const)
      wbox(l, ...off(l, tx, tz, dx, dz), 0.03, 0.012, 0.15, 0.012, timber);
    boardBody(l, ...off(l, tx, tz, 0, -0.08), 0.22, 0.02, 0.03, 0.2, plank);
    tinGable(l, tx, tz, 'x', 0.22, 0.18, 0.18, 0.05, '#7f6a54');
    for (let i = 0; i < 4; i++) barrel(l, ...off(l, tx, tz, -0.07 + i * 0.045, -0.02), 0.03, 0.018);
    for (let i = 0; i < 3; i++) barrelLying(l, ...off(l, tx, tz, -0.05 + i * 0.045, 0.05), 0);
    // Drying racks at the corners, crates and fishermen.
    dryingRack(l, 0.1, 0.42, 0);
    dryingRack(l, 0.9, 0.42, 0);
    for (let i = 0; i < 3; i++) crate(l, 0.5 + i * 0.04, 0.44, 0.05);
    fishBox(l, 0.62, 0.46, 0.05);
    person(l, 0.56, 0.5, 0.05, coats[1], '#d9c38a');
    person(l, 0.24, 0.66, 0.058, coats[0]);
    orchardTree(l, 0.12, 0.12, 0.26, '#d9c14a');
  },

  trawler_wharf(l) {
    shore(l, 0.58, 'trawler_wharf', false);
    // Stone wharf on piles with an iron edge.
    stoneBody(l, 0.5, 0.36, 0.96, 0.6, 0.03, 0.06, '#9a958a', 0.03);
    wbox(l, 0.5, 0.36, 0.09, 0.96, 0.004, 0.6, '#b3ada0');
    for (let i = 0; i < 16; i++)
      wbox(l, 0.03 + i * 0.062, 0.36, 0.094, 0.06, 0.002, 0.58, tone('#a8a196', 0.1));
    wbox(l, 0.5, 0.66, 0.09, 0.96, 0.01, 0.012, '#5a5f63');
    for (const x of [0.12, 0.42, 0.72]) bollard(l, x, 0.64, 0.094);
    // Ocean-going trawler moored alongside, with wheelhouse and gantry.
    boat(l, 0.5, 0.82, 0, 0.62, '#2f6a4a', { cabin: white, y: 0.02 });
    l.beam([0.26, 0.12, 0.82], [0.32, 0.26, 0.82], 0.006, '#c8392c');
    l.beam([0.32, 0.26, 0.82], [0.2, 0.18, 0.82], 0.003, '#2c3134');
    for (let i = 0; i < 3; i++) wbox(l, 0.68 + i * 0.04, 0.82, 0.1, 0.03, 0.02, 0.03, '#d9eef2');
    // Hand-cranked dock crane lifting a net of fish.
    crane(l, 0.84, 0.52, 0.3, Math.PI / 2 + 0.6, '#4a4f53');
    // Ice house: brick with a painted sign and roller door.
    const ix = 0.3;
    const iz = 0.18;
    stoneBody(l, ix, iz, 0.44, 0.24, 0.09, 0.26, brick, 0.02);
    door(l, ix, iz, 0.44, 0.24, '+z', -0.08, 0.09, 0.1, 0.15, '#c8cdd0');
    for (let k = 0; k < 6; k++)
      wbox(l, ...off(l, ix, iz, -0.08, 0.123), 0.1 + k * 0.025, 0.1, 0.002, 0.004, '#9aa0a4');
    window4(l, ix, iz, 0.44, 0.24, '+z', 0.12, 0.2, 0.05, { frame: white });
    wbox(l, ...off(l, ix, iz, 0, 0.123), 0.3, 0.24, 0.04, 0.004, '#2f5f86');
    wbox(l, ...off(l, ix, iz, 0, 0.126), 0.315, 0.2, 0.01, 0.002, white);
    shingleGable(l, ix, iz, 'x', 0.44, 0.24, 0.35, 0.12, slateish(), brick);
    chimney(l, ...off(l, ix, iz, 0.14, -0.05), 0.4, 0.12);
    // Ice blocks, crates of catch, barrels and dockers.
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.6 + (i % 2) * 0.035,
        0.24 + Math.floor(i / 2) * 0.035,
        0.094,
        0.03,
        0.03,
        0.03,
        '#d9eef2',
      );
    for (let i = 0; i < 5; i++)
      crate(l, 0.62 + (i % 3) * 0.04, 0.38 + Math.floor(i / 3) * 0.04, 0.094, '#b8c4c9');
    for (let i = 0; i < 3; i++) barrel(l, 0.9, 0.2 + i * 0.04, 0.094);
    person(l, 0.72, 0.5, 0.094, '#e8b843');
    person(l, 0.5, 0.44, 0.094, coats[0]);
    lanternPost(l, 0.06, 0.6, 0.2);
  },

  seafood_exchange(l) {
    shore(l, 0.66, 'seafood_exchange', false);
    stoneBody(l, 0.5, 0.36, 0.96, 0.6, 0.03, 0.05, '#9a958a', 0.03);
    wbox(l, 0.5, 0.36, 0.08, 0.96, 0.004, 0.6, '#c9c2b2');
    pier(l, 0.8, 0.66, 0.8, 0.96, 0.1, 0.07);
    boat(l, 0.5, 0.84, 0, 0.42, '#3f5f86', { cabin: white, y: 0.02 });
    // Art-nouveau market hall: cast-iron frame, glazed walls and a copper vault.
    const hx = 0.44;
    const hz = 0.3;
    const hw = 0.66;
    const hd = 0.38;
    glassHouse(l, hx, hz, 0.084, hw, 0.3, hd, '#2f4a3f', '#c9e2e2', 0.6, 0);
    stoneBody(l, hx, hz, hw, hd, 0.084, 0.05, '#c9c2b2', 0.025);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        wbox(
          l,
          ...off(l, hx, hz, (sx * hw) / 2, (sz * hd) / 2),
          0.084,
          0.03,
          0.36,
          0.03,
          '#2f4a3f',
        );
    const vault = new THREE.CylinderGeometry(
      hd / 2 + 0.01,
      hd / 2 + 0.01,
      hw + 0.02,
      18,
      1,
      false,
      0,
      Math.PI,
    );
    vault.rotateZ(Math.PI / 2);
    vault.rotateX(-Math.PI / 2);
    vault.scale(1, 0.75, 1);
    l.shape(vault, '#5f9b88', hx, hz, 0.384);
    for (let i = 0; i < 8; i++) {
      const rib = new THREE.TorusGeometry(hd / 2 + 0.012, 0.005, 4, 14, Math.PI);
      rib.rotateY(Math.PI / 2);
      rib.scale(1, 0.75, 1);
      l.shape(rib, '#2f4a3f', ...off(l, hx, hz, -hw / 2 + 0.02 + (i * (hw - 0.04)) / 7, 0), 0.384);
    }
    // Lantern on the ridge and the clock pediment over the entrance.
    glassHouse(l, hx, hz, 0.52, 0.16, 0.06, 0.08, '#2f4a3f', '#ffe1a0', 1, 0.03);
    wround(l, hx, hz, 0.003, 0.004, 0.61, 0.08, '#2f4a3f', 6);
    wbox(l, ...off(l, hx, hz, 0.02, 0), 0.66, 0.04, 0.024, 0.002, '#c8392c');
    wbox(l, ...off(l, hx, hz, 0, hd / 2 + 0.01), 0.38, 0.2, 0.1, 0.02, '#c9c2b2');
    wround(l, ...off(l, hx, hz, 0, hd / 2 + 0.022), 0.03, 0.03, 0.42, 0.004, white, 16);
    door(l, hx, hz, hw, hd, '+z', 0, 0.084, 0.1, 0.14, '#2f4a3f');
    // Live tanks with lit, bubbling water under the canopy at the side.
    for (let i = 0; i < 3; i++) {
      const [tx, tz] = [0.86, 0.14 + i * 0.12];
      wbox(l, tx, tz, 0.084, 0.16, 0.06, 0.09, '#d9dcdc');
      wbox(l, tx, tz, 0.144, 0.15, 0.003, 0.08, '#7fd0e0', 0, 0, 0.8);
      for (let k = 0; k < 3; k++)
        wbox(l, ...off(l, tx, tz, -0.04 + k * 0.04, 0), 0.148, 0.012, 0.004, 0.006, '#e07a5e');
    }
    wbox(l, 0.86, 0.26, 0.2, 0.2, 0.006, 0.4, '#5f9b88');
    for (const z of [0.06, 0.46]) wbox(l, 0.95, z, 0.084, 0.008, 0.12, 0.008, '#2f4a3f');
    // Fishmongers' stalls on the quay and shoppers.
    for (let i = 0; i < 3; i++) {
      const x = 0.16 + i * 0.16;
      wbox(l, x, 0.58, 0.084, 0.1, 0.04, 0.05, white);
      for (let k = 0; k < 4; k++) fishBox(l, ...off(l, x, 0.58, -0.03 + k * 0.02, 0), 0.124);
      wbox(l, x, 0.58, 0.2, 0.12, 0.004, 0.07, i % 2 ? '#2f5f86' : white);
      for (const e of [-1, 1])
        wbox(l, ...off(l, x, 0.58, e * 0.05, -0.03), 0.084, 0.004, 0.12, 0.004, timber);
    }
    person(l, 0.24, 0.64, 0.084, coats[4], '#2a2a2a');
    person(l, 0.4, 0.64, 0.084, coats[1]);
    person(l, 0.7, 0.56, 0.084, white, '#2a2a2a');
    for (const x of [0.06, 0.62]) lanternPost(l, x, 0.6, 0.22);
  },

  cannery_harbor_complex(l) {
    shore(l, 0.68, 'cannery_harbor_complex', false);
    stoneBody(l, 0.5, 0.36, 0.96, 0.64, 0.03, 0.05, '#9a958a', 0.03);
    wbox(l, 0.5, 0.36, 0.08, 0.96, 0.004, 0.64, '#b3ada0');
    // Two-storey red-brick cannery with sawtooth north lights and twin chimneys.
    const cx = 0.38;
    const cz = 0.26;
    const cw = 0.68;
    const cd = 0.34;
    stoneBody(l, cx, cz, cw, cd, 0.084, 0.36, brick, 0.018);
    wbox(l, cx, cz, 0.26, cw + 0.012, 0.012, cd + 0.012, '#c9c2b2');
    for (const t of [-0.26, -0.13, 0, 0.13, 0.26]) {
      window4(l, cx, cz, cw, cd, '+z', t, 0.14, 0.055, { frame: white });
      window4(l, cx, cz, cw, cd, '+z', t, 0.3, 0.055, { frame: white });
      window4(l, cx, cz, cw, cd, '-z', t, 0.3, 0.055, { frame: white });
    }
    for (let i = 0; i < 4; i++) {
      const [sx, sz] = off(l, cx, cz, -cw / 2 + 0.085 + i * 0.17, 0);
      tinGable(l, sx, sz, 'z', cd, 0.17, 0.444, 0.08, '#7f8a8e', brick);
      wbox(l, ...off(l, sx, sz, 0, 0.0), 0.47, 0.14, 0.03, 0.004, '#cfe6ee');
    }
    wbox(l, ...off(l, cx, cz, 0, cd / 2 + 0.004), 0.36, 0.3, 0.05, 0.004, '#efe7d6');
    wbox(l, ...off(l, cx, cz, 0, cd / 2 + 0.007), 0.375, 0.26, 0.02, 0.002, '#8a3b2c');
    for (const e of [-1, 1]) {
      const [kx, kz] = off(l, cx, cz, e * 0.12, -cd / 2 - 0.025);
      for (let k = 0; k < 10; k++)
        wround(
          l,
          kx,
          kz,
          0.03 - k * 0.0012,
          0.031 - k * 0.0012,
          0.084 + k * 0.07,
          0.07,
          tone(brick, 0.1),
          10,
        );
      wround(l, kx, kz, 0.024, 0.02, 0.784, 0.02, '#3a3530', 10);
      smoke(l, kx, kz, 0.8, 3);
    }
    // Fish-oil refinery tanks with stairs, and pipes into the works.
    for (const [tx, tz] of [
      [0.86, 0.12],
      [0.86, 0.3],
    ] as const) {
      wround(l, tx, tz, 0.07, 0.07, 0.084, 0.22, '#d9cba8', 18);
      wround(l, tx, tz, 0.075, 0.075, 0.3, 0.008, '#8f969a', 18);
      const lid = new THREE.SphereGeometry(0.07, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      lid.scale(1, 0.4, 1);
      l.shape(lid, '#c9bb98', tx, tz, 0.304);
    }
    l.beam([0.72, 0.24, 0.12], [0.8, 0.24, 0.12], 0.01, '#5a5f63');
    l.beam([0.72, 0.2, 0.3], [0.8, 0.2, 0.3], 0.01, '#5a5f63');
    // Can conveyor on trestles to the loading berth, crane and freighter.
    l.beam([0.62, 0.16, 0.42], [0.62, 0.12, 0.62], 0.02, '#9aa0a4');
    for (let i = 0; i < 8; i++)
      wround(l, 0.62, 0.42 + i * 0.026, 0.006, 0.006, 0.16 - i * 0.005, 0.012, '#d9dcdc', 8);
    for (const z of [0.46, 0.56]) wbox(l, 0.62, z, 0.084, 0.008, 0.06, 0.008, '#5a5f63');
    crane(l, 0.84, 0.56, 0.34, Math.PI / 2 + 0.8, '#c8392c');
    boat(l, 0.48, 0.84, 0, 0.7, '#2f3f5a', { cabin: white, y: 0.02 });
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.38 + i * 0.04,
        0.84,
        0.1,
        0.034,
        0.03,
        0.06,
        ['#c8392c', '#2f5f86', '#e8b843', '#3f6b3a'][i]!,
      );
    // Pallets of tins, barrels of oil and the crew.
    for (let i = 0; i < 6; i++) {
      const x = 0.12 + (i % 3) * 0.06;
      const z = 0.5 + Math.floor(i / 3) * 0.06;
      wbox(l, x, z, 0.084, 0.05, 0.006, 0.05, '#a47a52');
      for (let k = 0; k < 4; k++)
        wround(
          l,
          ...off(l, x, z, k % 2 ? 0.01 : -0.01, k < 2 ? 0.01 : -0.01),
          0.008,
          0.008,
          0.09,
          0.014,
          '#c8cdd0',
          8,
        );
    }
    for (let i = 0; i < 4; i++) barrel(l, 0.36 + i * 0.04, 0.5, 0.084);
    person(l, 0.5, 0.56, 0.084, '#e8b843');
    person(l, 0.7, 0.5, 0.084, coats[0]);
    lanternPost(l, 0.94, 0.62, 0.22);
  },

  hunting_lodge(l) {
    reseed('hunting_lodge');
    meadow(l, '#6f9a42', 60);
    for (const [x, z, h] of [
      [0.1, 0.1, 0.32],
      [0.9, 0.12, 0.28],
      [0.08, 0.86, 0.3],
      [0.92, 0.9, 0.3],
    ] as const)
      cypress(l, x, z, h);
    // Round-log cabin with a plank roof and stone chimney.
    const cx = 0.42;
    const cz = 0.3;
    logBody(l, cx, cz, 0.36, 0.26, 0.03, 0.17);
    door(l, cx, cz, 0.36, 0.26, '+z', -0.06, 0.03, 0.055, 0.12, timber);
    window4(l, cx, cz, 0.36, 0.26, '+z', 0.08, 0.08, 0.045, { shutters: '#5a3a24' });
    window4(l, cx, cz, 0.36, 0.26, '-x', 0, 0.08, 0.045);
    shingleGable(l, cx, cz, 'x', 0.36, 0.26, 0.2, 0.12, '#5a4434', '#8a6142', 0.04);
    stoneBody(l, ...off(l, cx, cz, 0.2, 0), 0.06, 0.08, 0.03, 0.34, '#8f8a80', 0.03);
    // Antlers over the door and a porch with a bench.
    for (const e of [-1, 1])
      wbox(
        l,
        ...off(l, cx, cz, -0.06 + e * 0.012, 0.135),
        0.17,
        0.003,
        0.03,
        0.003,
        '#d9c9a3',
        e * 0.4,
      );
    wbox(l, ...off(l, cx, cz, 0, 0.18), 0.03, 0.34, 0.006, 0.1, plank);
    // Hide stretching frames, campfire and woodpile.
    dryingRack(l, 0.78, 0.44, 0.4, true);
    dryingRack(l, 0.2, 0.7, -0.3, true);
    campfire(l, 0.56, 0.68);
    for (let i = 0; i < 3; i++)
      wbox(l, 0.62 + i * 0.03, 0.62, 0.03, 0.05, 0.012, 0.012, '#7a5634', 0.4);
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 4 - r; i++) {
        const log = new THREE.CylinderGeometry(0.009, 0.009, 0.1, 7);
        log.rotateX(Math.PI / 2);
        l.shape(
          log,
          tone('#8a6142', 0.15),
          ...off(l, 0.14, 0.3, -0.027 + i * 0.019 + r * 0.009, 0),
          0.04 + r * 0.016,
        );
      }
    person(l, 0.5, 0.74, 0.03, coats[2], '#5a4434');
    dog(l, 0.62, 0.76, 2.4);
    deer(l, 0.84, 0.76, 2.2, true);
    path(l, 0.42, 0.98, 0.42, 0.48, 0.08);
  },

  gamekeeper_lodge(l) {
    reseed('gamekeeper_lodge');
    meadow(l, '#6f9a42', 50);
    for (const [x, z, h] of [
      [0.06, 0.06, 0.34],
      [0.94, 0.08, 0.3],
    ] as const)
      cypress(l, x, z, h);
    // Rubble-stone keeper's house with a shingle roof.
    const hx = 0.32;
    const hz = 0.24;
    stoneBody(l, hx, hz, 0.36, 0.26, 0.03, 0.2, '#9a958a', 0.035);
    door(l, hx, hz, 0.36, 0.26, '+z', -0.07, 0.03, 0.055, 0.12, '#3f5f4a');
    for (const t of [0.04, 0.12])
      window4(l, hx, hz, 0.36, 0.26, '+z', t, 0.09, 0.045, { shutters: '#3f5f4a' });
    window4(l, hx, hz, 0.36, 0.26, '+x', 0, 0.09, 0.045, { shutters: '#3f5f4a' });
    shingleGable(l, hx, hz, 'x', 0.36, 0.26, 0.23, 0.13, '#8a6a4a', '#9a958a');
    chimney(l, ...off(l, hx, hz, -0.12, -0.04), 0.3, 0.12, '#8f8a80');
    // Tall timber fire-watch tower with a cabin and ladder.
    const tx = 0.8;
    const tz = 0.3;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [tx + (a * 0.06) / l.spanX, 0.03, tz + (b * 0.06) / l.spanZ],
        [tx + (a * 0.04) / l.spanX, 0.46, tz + (b * 0.04) / l.spanZ],
        0.01,
        '#6b4a2c',
      );
    for (let k = 1; k < 5; k++) {
      const r = 0.06 - 0.02 * (k / 5);
      wbox(l, tx, tz, 0.03 + k * 0.085, r * 2, 0.006, r * 2, '#7a5634');
    }
    boardBody(l, tx, tz, 0.1, 0.1, 0.46, 0.08, '#8a6142');
    for (const f of ['+z', '-x'] as const) window4(l, tx, tz, 0.1, 0.1, f, 0, 0.48, 0.05);
    const roof = new THREE.ConeGeometry(0.09, 0.06, 4);
    roof.rotateY(Math.PI / 4);
    l.shape(roof, '#5a4434', tx, tz, 0.57);
    l.beam([tx, 0.03, tz + 0.08], [tx, 0.46, tz + 0.05], 0.008, '#a08a5a');
    // Deer paddock with feeder and the herd.
    railFence(l, 0.06, 0.52, 0.94, 0.52, '#8a6342', 3);
    railFence(l, 0.94, 0.52, 0.94, 0.96, '#8a6342', 3);
    railFence(l, 0.94, 0.96, 0.06, 0.96, '#8a6342', 3);
    railFence(l, 0.06, 0.96, 0.06, 0.52, '#8a6342', 3);
    wbox(l, 0.5, 0.62, 0.03, 0.1, 0.05, 0.05, '#6b4a2c');
    wbox(l, 0.5, 0.62, 0.08, 0.1, 0.02, 0.05, '#e2c46e');
    deer(l, 0.3, 0.7, 0.4, true);
    deer(l, 0.4, 0.84, 2.0);
    deer(l, 0.68, 0.78, 3.0);
    deer(l, 0.78, 0.66, 1.0);
    orchardTree(l, 0.2, 0.86, 0.26, '#d23b2e');
    person(l, 0.56, 0.44, 0.03, coats[2], '#5a4434');
    dog(l, 0.62, 0.44, 0);
    path(l, 0.3, 0.5, 0.3, 0.38, 0.08);
  },

  falconry_manor(l) {
    reseed('falconry_manor');
    meadow(l, '#729e45', 40);
    wbox(l, 0.5, 0.56, 0.03, 0.9, 0.004, 0.16, '#d6cfbf');
    // Noble manor of dressed stone with a slate roof, dormer and turret.
    const mx = 0.36;
    const mz = 0.22;
    stoneBody(l, mx, mz, 0.5, 0.28, 0.03, 0.32, '#c9c2b2', 0.03);
    for (const t of [-0.15, 0, 0.15]) {
      window4(l, mx, mz, 0.5, 0.28, '+z', t, 0.08, 0.05, { frame: white });
      window4(l, mx, mz, 0.5, 0.28, '+z', t, 0.22, 0.05, { frame: white, flowers: t !== 0 });
    }
    door(l, mx, mz, 0.5, 0.28, '+z', 0, 0.03, 0.06, 0.1, '#3a2a1e');
    shingleGable(l, mx, mz, 'x', 0.5, 0.28, 0.35, 0.14, '#4a535c', '#c9c2b2');
    chimney(l, ...off(l, mx, mz, 0.17, -0.04), 0.4, 0.14, '#b7aa92');
    const [rx, rz] = off(l, mx, mz, -0.26, 0.12);
    for (let k = 0; k < 9; k++)
      wround(l, rx, rz, 0.055, 0.055, 0.03 + k * 0.045, 0.045, tone('#c9c2b2', 0.08), 14);
    window4(l, rx, rz, 0.11, 0.11, '+z', 0, 0.28, 0.035, { frame: white });
    coneRoof(l, rx, rz, 0.435, 0.065, 0.22, '#3c444c');
    // Gilded spherical mews cages and perches on the lawn.
    for (const [x, z] of [
      [0.74, 0.22],
      [0.9, 0.36],
    ] as const) {
      wround(l, x, z, 0.04, 0.045, 0.03, 0.03, '#c9c2b2', 12);
      for (let i = 0; i < 8; i++) {
        const ring = new THREE.TorusGeometry(0.05, 0.0025, 4, 18);
        ring.rotateY((i / 8) * Math.PI);
        l.shape(ring, '#c9a24a', x, z, 0.11);
      }
      const eq = new THREE.TorusGeometry(0.05, 0.003, 4, 18);
      eq.rotateX(Math.PI / 2);
      l.shape(eq, '#c9a24a', x, z, 0.11);
      falcon(l, x, z, 0.1);
      l.shape(new THREE.SphereGeometry(0.008, 6, 5), '#d7af4b', x, z, 0.166);
    }
    for (const x of [0.62, 0.7, 0.78]) falcon(l, x, 0.46, 0.09);
    falcon(l, 0.66, 0.2, 0.62, true);
    // Granite hound kennels with a run.
    const kx = 0.22;
    const kz = 0.76;
    stoneBody(l, kx, kz, 0.3, 0.14, 0.03, 0.1, '#a7a49c', 0.025);
    for (const t of [-0.09, 0, 0.09])
      door(l, kx, kz, 0.3, 0.14, '+z', t, 0.03, 0.04, 0.06, '#3a2a20');
    shingleGable(l, kx, kz, 'x', 0.3, 0.14, 0.13, 0.06, '#4a535c', '#a7a49c');
    railFence(l, 0.06, 0.88, 0.4, 0.88, '#5a5f63', 3);
    dog(l, 0.16, 0.86, 0.3);
    dog(l, 0.28, 0.85, 2.8, '#c9a06a');
    dog(l, 0.34, 0.86, 1.4, '#3a2a20');
    // Falconer, topiary and lanterns.
    person(l, 0.6, 0.56, 0.034, coats[2], '#2a2a2a');
    falcon(l, ...off(l, 0.6, 0.56, 0.014, 0), 0.1);
    for (let i = 0; i < 4; i++) shrub(l, 0.56 + i * 0.1, 0.7, 0.026, '#3f7a3a');
    for (const x of [0.5, 0.94]) lanternPost(l, x, 0.86, 0.18);
    cypress(l, 0.94, 0.06, 0.32);
  },

  royal_hunting_palace(l) {
    reseed('royal_hunting_palace');
    meadow(l, '#729e45', 30);
    wbox(l, 0.5, 0.6, 0.03, 0.96, 0.004, 0.36, '#d6cfbf');
    // White-marble palace with a navy slate roof, pavilions and a lantern cupola.
    const px = 0.5;
    const pz = 0.22;
    const pw = 0.7;
    const pd = 0.3;
    stoneBody(l, px, pz, pw + 0.02, pd + 0.02, 0.03, 0.05, '#c9c2b2', 0.025);
    stoneBody(l, px, pz, pw, pd, 0.08, 0.36, '#f0ece2', 0.04);
    wbox(l, px, pz, 0.44, pw + 0.02, 0.02, pd + 0.02, '#d9d2c2');
    for (const t of [-0.27, -0.16, 0.16, 0.27]) {
      window4(l, px, pz, pw, pd, '+z', t, 0.13, 0.055, { frame: '#d9d2c2' });
      window4(l, px, pz, pw, pd, '+z', t, 0.3, 0.05, { frame: '#d9d2c2' });
      window4(l, px, pz, pw, pd, '-z', t, 0.24, 0.05, { frame: '#d9d2c2' });
    }
    // Centre pavilion with columns and pediment.
    const [cx, cz] = off(l, px, pz, 0, pd / 2 + 0.04);
    wbox(l, cx, cz, 0.03, 0.22, 0.05, 0.1, '#d9d2c2');
    for (let i = 0; i < 4; i++)
      wround(l, ...off(l, cx, cz, -0.075 + i * 0.05, 0.03), 0.01, 0.011, 0.08, 0.3, '#f0ece2', 10);
    wbox(l, cx, cz, 0.38, 0.24, 0.04, 0.1, '#f0ece2');
    shingleGable(l, cx, cz, 'z', 0.1, 0.24, 0.42, 0.08, '#2c3a5a', '#f0ece2');
    shingleGable(l, px, pz, 'x', pw, pd, 0.46, 0.16, '#2c3a5a', '#f0ece2');
    glassHouse(l, px, pz, 0.6, 0.08, 0.08, 0.08, '#d7af4b', '#ffe1a0', 1, 0);
    const dome = new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    l.shape(dome, '#2c3a5a', px, pz, 0.68);
    l.shape(new THREE.SphereGeometry(0.01, 6, 5), '#d7af4b', px, pz, 0.74);
    for (const e of [-1, 1]) chimney(l, ...off(l, px, pz, e * 0.26, -0.05), 0.52, 0.14, '#d9d2c2');
    // Chandeliers lit in the windows at night (glowing drops).
    for (const t of [-0.27, 0.27])
      wbox(l, ...off(l, px, pz, t, pd / 2 + 0.006), 0.35, 0.02, 0.012, 0.004, '#ffe7a8', 0, 0, 1);
    // Bronze stag on a plinth amid the forecourt fountain.
    wround(l, 0.5, 0.62, 0.09, 0.095, 0.03, 0.03, '#d9d2c2', 18);
    wround(l, 0.5, 0.62, 0.082, 0.082, 0.054, 0.006, '#4f93b0', 18);
    stoneBody(l, 0.5, 0.62, 0.05, 0.05, 0.03, 0.08, '#d9d2c2', 0.025);
    const stag = (): void => {
      const s = 1.8;
      const at = (dx: number, dy: number, dz: number, w: number, h: number, d: number): void =>
        wbox(
          l,
          ...off(l, 0.5, 0.62, dx * s, dz * s),
          0.11 + dy * s,
          w * s,
          h * s,
          d * s,
          '#8a6a3a',
        );
      at(0, 0.03, 0, 0.05, 0.022, 0.02);
      for (const a of [-0.018, 0.018])
        for (const b of [-0.006, 0.006]) at(a, 0, b, 0.005, 0.032, 0.005);
      at(0.026, 0.045, 0, 0.01, 0.024, 0.01);
      at(0.034, 0.066, 0, 0.018, 0.01, 0.01);
      for (const b of [-0.006, 0.006]) at(0.03, 0.076, b, 0.003, 0.026, 0.003);
      for (const b of [-0.01, 0.01]) at(0.034, 0.095, b, 0.014, 0.003, 0.003);
    };
    stag();
    // Lanterns on all four sides, parterre hedges, riders and hounds.
    for (const [x, z] of [
      [0.06, 0.44],
      [0.94, 0.44],
      [0.06, 0.92],
      [0.94, 0.92],
    ] as const)
      lanternPost(l, x, z, 0.24);
    for (let i = 0; i < 5; i++) {
      shrub(l, 0.12 + i * 0.05, 0.86, 0.02, '#3f7a3a');
      shrub(l, 0.68 + i * 0.05, 0.86, 0.02, '#3f7a3a');
    }
    for (const x of [0.04, 0.96]) cypress(l, x, 0.2, 0.4);
    person(l, 0.36, 0.66, 0.034, '#2c3a5a', '#2a2a2a');
    person(l, 0.64, 0.7, 0.034, '#8a3b2c', '#2a2a2a');
    dog(l, 0.4, 0.72, 0.6);
    dog(l, 0.58, 0.76, 2.6, '#c9a06a');
    deer(l, 0.88, 0.7, 2.6, true);
  },
};

function slateish(): string {
  return '#56606a';
}
