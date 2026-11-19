import * as THREE from 'three';
import {
  barrel,
  boardBody,
  crate,
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
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import { smoke, steelSilo, truck } from './dioramaProps';
import {
  blockStack,
  brickBody,
  conveyor,
  floodlight,
  portal,
  railLine,
  rockMass,
  wagon,
  windingWheel,
  windows4,
  workers,
  yard,
} from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2A: heavy industry and energy, drawn as dioramas (2x2 lots drawn in a smaller frame and
// scaled up, see `zoomed` in architectureModels.ts; the steelworks are 3x2).
//   power_plant   -> steam_powerhouse    -> turbine_power_station
//   foundry       -> heavy_foundry
//   factory (sawtooth multi-bay hall)
//   steelworks    -> bessemer_steelworks -> integrated_steel_mill
//   coal_mine     -> colliery_headframe  -> deep_shaft_colliery

const grass = '#79a24a';
const timberDark = '#3d2a19';
const plank = '#6b5a48';
const slate = '#4d5a66';
const concrete = '#b9b6ae';
const cinder = '#5d5750';
const hot = '#ff8a2a';

/** Cinder-and-grass ground with a worn floor patch. */
function site(l: Lot, seed: string, floor: string, patch: [number, number, number, number]): void {
  reseed(seed);
  meadow(l, grass, 22);
  const [x0, z0, x1, z1] = patch;
  wbox(
    l,
    (x0 + x1) / 2,
    (z0 + z1) / 2,
    0.03,
    (x1 - x0) * l.spanX,
    0.008,
    (z1 - z0) * l.spanZ,
    floor,
  );
  for (let i = 0; i < 40; i++)
    wbox(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      0.038,
      0.01 + rand() * 0.02,
      0.004,
      0.01 + rand() * 0.02,
      tone(shade(floor, 0.8), 0.3),
      rand() * 3,
    );
}

/** Brick chimney stack, tapering, with a dark cap and smoke. */
function stack(
  l: Lot,
  x: number,
  z: number,
  h: number,
  r = 0.022,
  color = '#9c5640',
  fume = 4,
): void {
  const rows = Math.round(h / 0.0125);
  for (let i = 0; i < rows; i++)
    wround(
      l,
      x,
      z,
      r * (1 - (0.28 * (i + 1)) / rows),
      r * (1 - (0.28 * i) / rows),
      0.03 + i * 0.0125,
      0.0125,
      tone(color, 0.2),
      12,
    );
  wround(l, x, z, r * 0.9, r * 0.74, 0.03 + h, 0.012, '#2c2a28', 12);
  if (fume) smoke(l, x, z, 0.04 + h, fume);
}

/** Round steel flue pipe (stovepipe) with smoke. */
function flue(l: Lot, x: number, z: number, y: number, h: number, r = 0.012, fume = 3): void {
  wround(l, x, z, r, r * 1.15, y, h, '#2c3134', 10);
  wround(l, x, z, r * 1.5, r * 1.3, y + h, 0.01, '#1c1f21', 10);
  if (fume) smoke(l, x, z, y + h + 0.01, fume);
}

/** Glowing molten metal: a short emissive cylinder. */
function melt(l: Lot, x: number, z: number, y: number, r: number): void {
  l.shape(new THREE.CylinderGeometry(r, r, 0.006, 14), '#ff9a3a', x, z, y, 1);
}

/** Spoked iron flywheel standing in the plane facing `ry`, bottom at y. */
function flywheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
  const rim = new THREE.TorusGeometry(r, 0.008, 6, 22);
  rim.rotateY(ry + Math.PI / 2);
  l.shape(rim, '#26292b', x, z, y + r);
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.BoxGeometry(0.006, r * 2, 0.006);
    sp.rotateZ((i / 6) * Math.PI);
    sp.rotateY(ry + Math.PI / 2);
    l.shape(sp, '#3a3f42', x, z, y + r);
  }
  const hub = new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10);
  hub.rotateX(Math.PI / 2);
  hub.rotateY(ry);
  l.shape(hub, '#1b1d1f', x, z, y + r);
}

/** Lattice transmission pylon with insulators, returns the cable attachment points. */
function pylon(l: Lot, x: number, z: number, h: number): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    l.beam(
      [x + (a * 0.022) / l.spanX, 0.03, z + (b * 0.022) / l.spanZ],
      [x + (a * 0.006) / l.spanX, 0.03 + h, z + (b * 0.006) / l.spanZ],
      0.004,
      '#8a9298',
    );
  for (let k = 1; k < 5; k++)
    wbox(l, x, z, 0.03 + (k * h) / 5, 0.03 - k * 0.004, 0.004, 0.03 - k * 0.004, '#6e777b');
  for (const y of [0.78, 0.9]) {
    wbox(l, x, z, 0.03 + h * y, 0.1, 0.005, 0.005, '#6e777b', Math.PI / 2);
    for (const s of [-1, 1])
      wround(
        l,
        ...off(l, x, z, 0, s * 0.045),
        0.005,
        0.005,
        0.03 + h * y - 0.022,
        0.022,
        '#cfe6ee',
        8,
      );
  }
}

/** Hyperboloid cooling tower with ribs and a plume. */
function coolingTower(l: Lot, x: number, z: number, h: number, r: number): void {
  const rings = 14;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const rad = r * (1 - 0.28 * Math.sin(t * Math.PI * 0.82) + 0.0 * t);
    const rad2 = r * (1 - 0.28 * Math.sin(Math.min(1, (i + 1) / (rings - 1)) * Math.PI * 0.82));
    wround(
      l,
      x,
      z,
      rad2,
      rad,
      0.03 + (i * h) / rings,
      h / rings + 0.002,
      tone(i % 2 ? '#c4c1b8' : '#b3b0a7', 0.06),
      28,
    );
  }
  wround(l, x, z, r * 0.78, r * 0.78, 0.03 + h, 0.008, '#8f8c84', 28);
  smoke(l, x, z, 0.04 + h, 4);
}

// ---------------------------------------------------------------------------------------------

export const industryDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Power
  // -----------------------------------------------------------------------------------------
  power_plant(l) {
    site(l, 'power_plant', cinder, [0.08, 0.08, 0.94, 0.94]);
    // Weathered plank engine shed with a lean-to boiler and the big flywheel outside.
    const sx = 0.38;
    const sz = 0.42;
    boardBody(l, sx, sz, 0.34, 0.26, 0.03, 0.15, plank);
    windows4(l, sx, sz, 0.34, 0.26, 0.08, 0.036, { shutters: '#3a2f28' });
    door(l, sx, sz, 0.34, 0.26, '+z', 0.07, 0.03, 0.05, 0.1, timberDark);
    tinGable(l, sx, sz, 'x', 0.34, 0.26, 0.18, 0.08, '#4a4440', plank);
    brickBody(l, ...off(l, sx, sz, 0.24, -0.02), 0.16, 0.16, 0.03, 0.12, '#8c4a38');
    wround(l, ...off(l, sx, sz, 0.24, -0.02), 0.06, 0.06, 0.15, 0.04, '#2c2a28', 12);
    flue(l, ...off(l, sx, sz, -0.06, -0.06), 0.18, 0.12, 0.013, 4);
    flywheel(l, ...off(l, sx, sz, 0.05, 0.19), 0.03, 0.085, Math.PI / 2);
    wbox(l, ...off(l, sx, sz, 0.05, 0.19), 0.03, 0.2, 0.03, 0.05, '#2f3234');
    // Coal heap, tipping cart on rails, wood stack, crew and lamps.
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.74,
        0.34,
        0.036 + i * 0.012,
        0.18 - i * 0.026,
        0.014,
        0.16 - i * 0.022,
        tone('#26282a', 0.25),
        i * 0.5,
      );
    railLine(l, 0.56, 0.7, 0.9, 0.7);
    wagon(l, 0.72, 0.7, 0, '#2a2c2e');
    wagon(l, 0.84, 0.7, 0, '#2a2c2e');
    blockStack(l, 0.2, 0.78, 0.036, 3, 2, 2, '#8a6a48');
    workers(l, [
      [0.5, 0.62, '#6a6a70', '#3a3a3c'],
      [0.62, 0.5, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.54, 0.84, 0.16);
    lanternPost(l, 0.14, 0.2, 0.16);
    yard(l, 0.1, 0.55, 0.3, 0.7, 'ore', 4);
    shrub(l, 0.92, 0.1, 0.04);
  },

  steam_powerhouse(l) {
    site(l, 'steam_powerhouse', cinder, [0.06, 0.06, 0.95, 0.95]);
    // Two-storey red-brick powerhouse with arched windows and twin stacks.
    const hx = 0.4;
    const hz = 0.44;
    brickBody(l, hx, hz, 0.46, 0.3, 0.03, 0.27, '#a24a35');
    stoneBody(l, hx, hz, 0.47, 0.31, 0.03, 0.02, '#8a8174', 0.02);
    stoneBody(l, hx, hz, 0.47, 0.31, 0.15, 0.012, '#8a8174', 0.02);
    windows4(l, hx, hz, 0.46, 0.3, 0.07, 0.05, { frame: '#e9dfc9' });
    windows4(l, hx, hz, 0.46, 0.3, 0.19, 0.05, { frame: '#e9dfc9' });
    door(l, hx, hz, 0.46, 0.3, '+z', 0, 0.03, 0.07, 0.11, timberDark);
    shingleGable(l, hx, hz, 'x', 0.46, 0.3, 0.3, 0.11, slate, '#a24a35');
    wbox(l, hx, hz, 0.4, 0.4, 0.02, 0.05, '#2c3134');
    for (const dx of [-0.12, 0.12])
      stack(l, ...off(l, hx, hz, dx, -0.26), 0.44, 0.024, '#9c5640', 4);
    // Dynamo hall annexe, coal bunker with wagon, pylons carrying cable.
    brickBody(l, 0.8, 0.28, 0.2, 0.2, 0.03, 0.14, '#8f4a38');
    windows4(l, 0.8, 0.28, 0.2, 0.2, 0.07, 0.036, { frame: '#e9dfc9' });
    tinGable(l, 0.8, 0.28, 'z', 0.2, 0.2, 0.17, 0.06, '#4f5a60', '#8f4a38');
    wbox(l, 0.78, 0.64, 0.036, 0.2, 0.08, 0.12, '#3a3836');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.78,
        0.64,
        0.116 + i * 0.008,
        0.18 - i * 0.02,
        0.012,
        0.1 - i * 0.012,
        tone('#202224', 0.25),
      );
    railLine(l, 0.5, 0.82, 0.95, 0.82, 0.036, { steel: true });
    wagon(l, 0.66, 0.82, 0, '#26282a', 0.042, '#6e6e70');
    wagon(l, 0.8, 0.82, 0, '#26282a', 0.042, '#6e6e70');
    pylon(l, 0.62, 0.16, 0.3);
    pylon(l, 0.94, 0.5, 0.3);
    l.beam(
      [0.62, 0.3 + 0.03 * 0.78 + 0.03, 0.16],
      [0.94, 0.3 + 0.03 * 0.78 + 0.03, 0.5],
      0.002,
      '#1c1f21',
    );
    workers(l, [
      [0.26, 0.74, '#6a6a70', '#3a3a3c'],
      [0.56, 0.72, '#8a4a3a', '#3a3a3c'],
      [0.68, 0.7, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.2, 0.7, 0.16);
    lanternPost(l, 0.9, 0.7, 0.16);
    yard(l, 0.06, 0.78, 0.3, 0.95, 'ore', 4);
    shrub(l, 0.92, 0.92, 0.04);
  },

  turbine_power_station(l) {
    site(l, 'turbine_power_station', '#8a8982', [0.05, 0.05, 0.95, 0.95]);
    // Concrete turbine hall with ribbed glazing, big cooling tower, steam plume.
    const hx = 0.34;
    const hz = 0.62;
    wbox(l, hx, hz, 0.03, 0.62, 0.22, 0.3, concrete);
    wbox(l, hx, hz, 0.25, 0.64, 0.02, 0.32, '#8f8c84');
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        ...off(l, hx, hz, -0.26 + i * 0.104, 0.15),
        0.1,
        0.05,
        0.1,
        0.004,
        '#cfe6f0',
        0,
        0,
        1,
      );
    windows4(l, hx, hz, 0.62, 0.3, 0.1, 0.04, { frame: '#d8dde0' });
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.26 + i * 0.104, 0), 0.16, 0.012, 0.004, 0.3, '#8f8c84');
    for (let i = 0; i < 3; i++)
      wround(l, ...off(l, hx, hz, -0.2 + i * 0.2, 0), 0.028, 0.03, 0.27, 0.05, '#a9a79f', 14);
    coolingTower(l, 0.7, 0.3, 0.55, 0.17);
    // Switchyard: transformers, insulators and lattice pylons with cable.
    for (let i = 0; i < 4; i++) {
      const x = 0.12 + i * 0.12;
      wbox(l, x, 0.2, 0.036, 0.075, 0.07, 0.06, '#7e868c');
      for (const dx of [-0.02, 0, 0.02])
        wround(l, ...off(l, x, 0.2, dx, 0), 0.006, 0.007, 0.106, 0.04, '#d8e6ea', 8);
      for (let f = 0; f < 4; f++)
        wbox(l, ...off(l, x, 0.2, -0.04 + f * 0.026, 0.034), 0.04, 0.05, 0.004, 0.012, '#5a6268');
    }
    pylon(l, 0.12, 0.08, 0.34);
    pylon(l, 0.46, 0.08, 0.34);
    l.beam(
      [0.12, 0.3 + 0.03 * 0.9 + 0.045, 0.08],
      [0.46, 0.3 + 0.03 * 0.9 + 0.045, 0.08],
      0.002,
      '#1c1f21',
    );
    for (const [x, z] of [
      [0.9, 0.62],
      [0.9, 0.8],
    ] as const)
      steelSilo(l, x, z, 0.04, 0.22);
    truck(l, 0.64, 0.9, 0, '#3f6b8a');
    workers(l, [
      [0.58, 0.46, '#e8742a', '#f2cf4a'],
      [0.24, 0.4, '#e8742a', '#f2cf4a'],
      [0.5, 0.84, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.08, 0.5, 0.3);
    floodlight(l, 0.94, 0.45, 0.3);
    floodlight(l, 0.1, 0.94, 0.26);
    shrub(l, 0.94, 0.94, 0.04);
  },

  // -----------------------------------------------------------------------------------------
  // Foundry and factory
  // -----------------------------------------------------------------------------------------
  foundry(l) {
    site(l, 'foundry', '#6a625a', [0.08, 0.08, 0.94, 0.94]);
    // Open brick shed on arches with a glowing crucible, casting moulds and an anvil.
    for (const [x, z] of [
      [0.18, 0.2],
      [0.56, 0.2],
      [0.18, 0.6],
      [0.56, 0.6],
    ] as const) {
      brickBody(l, x, z, 0.07, 0.07, 0.03, 0.2, '#9a4a35');
    }
    for (const z of [0.2, 0.6]) {
      wbox(l, 0.37, z, 0.226, 0.5, 0.034, 0.08, '#8a4a38');
      wbox(l, 0.37, z, 0.26, 0.5, 0.012, 0.09, '#2c2a28');
    }
    brickBody(l, 0.18, 0.4, 0.07, 0.4, 0.03, 0.2, '#8f4430');
    tinGable(l, 0.37, 0.4, 'x', 0.55, 0.5, 0.265, 0.07, '#4a4440');
    // Furnace and crucible.
    brickBody(l, 0.34, 0.4, 0.17, 0.17, 0.03, 0.1, '#7a3a2a');
    l.shape(new THREE.CylinderGeometry(0.06, 0.05, 0.05, 16), '#3a3836', 0.34, 0.4, 0.15);
    melt(l, 0.34, 0.4, 0.197, 0.052);
    wbox(l, 0.34, 0.4, 0.13, 0.09, 0.02, 0.01, hot, 0, 0, 1);
    // Glowing channel to moulds, casting sand beds, anvil, tools.
    wbox(l, 0.5, 0.4, 0.036, 0.2, 0.01, 0.018, hot, 0, 0, 1);
    for (let i = 0; i < 4; i++) wbox(l, 0.46 + i * 0.07, 0.5, 0.036, 0.05, 0.012, 0.05, '#4a3f36');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.46 + i * 0.07,
        0.5,
        0.048,
        0.03,
        0.004,
        0.03,
        i % 2 ? hot : '#2c2c2e',
        0,
        0,
        i % 2 ? 1 : 0,
      );
    wbox(l, 0.5, 0.3, 0.036, 0.05, 0.05, 0.03, '#2c3134');
    wbox(l, 0.5, 0.3, 0.086, 0.07, 0.014, 0.03, '#3a3f42');
    wbox(l, 0.72, 0.3, 0.036, 0.1, 0.02, 0.06, '#8a6a48');
    for (let i = 0; i < 6; i++)
      wbox(l, 0.7 + i * 0.012, 0.3, 0.056, 0.01, 0.01, 0.03, '#3a3f42', i);
    flue(l, 0.18, 0.18, 0.2, 0.18, 0.02, 4);
    // Charcoal/ore piles, barrels, crew and fire glow on the floor.
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.8,
        0.7,
        0.036 + i * 0.012,
        0.14 - i * 0.024,
        0.014,
        0.12 - i * 0.02,
        tone('#26282a', 0.25),
        i * 0.7,
      );
    barrel(l, 0.62, 0.8);
    barrel(l, 0.66, 0.84);
    workers(l, [
      [0.44, 0.7, '#8a4a3a', '#3a3a3c'],
      [0.58, 0.44, '#6a6a70', '#3a3a3c'],
      [0.3, 0.8, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.2, 0.16);
    lanternPost(l, 0.1, 0.9, 0.16);
    yard(l, 0.6, 0.55, 0.9, 0.62, 'ore', 4);
  },

  heavy_foundry(l) {
    site(l, 'heavy_foundry', '#5f5851', [0.06, 0.06, 0.95, 0.95]);
    // Gabled brick foundry with a cupola furnace, vent cap and an overhead crane hoist.
    const hx = 0.4;
    const hz = 0.44;
    brickBody(l, hx, hz, 0.5, 0.32, 0.03, 0.2, '#93432f');
    windows4(l, hx, hz, 0.5, 0.32, 0.1, 0.05, { frame: '#d9c9a8' });
    door(l, hx, hz, 0.5, 0.32, '+z', -0.1, 0.03, 0.09, 0.13, timberDark);
    wbox(l, ...off(l, hx, hz, -0.1, 0.162), 0.03, 0.09, 0.12, 0.004, hot, 0, 0, 1);
    shingleGable(l, hx, hz, 'x', 0.5, 0.32, 0.23, 0.11, slate, '#93432f');
    wbox(l, hx, hz, 0.34, 0.5, 0.02, 0.05, '#2f3234');
    // Cupola furnace: tall riveted cylinder with a spark arrester cone and a glowing tap hole.
    const [cx, cz] = off(l, hx, hz, 0.3, 0.1);
    wround(l, cx, cz, 0.05, 0.055, 0.03, 0.34, '#5a5f63', 14);
    for (let i = 1; i < 6; i++)
      wround(l, cx, cz, 0.056, 0.056, 0.03 + i * 0.056, 0.006, '#2f3436', 14);
    l.shape(new THREE.ConeGeometry(0.06, 0.07, 14), '#3a3f42', cx, cz, 0.4);
    wbox(l, ...off(l, cx, cz, 0.052, 0), 0.08, 0.02, 0.04, 0.04, hot, 0, 0, 1);
    smoke(l, cx, cz, 0.44, 4);
    // Overhead crane gantry across the yard with a chain and a ladle.
    for (const x of [0.16, 0.66]) {
      wbox(l, x, 0.8, 0.03, 0.03, 0.3, 0.03, '#d8a832');
      wbox(l, x, 0.9, 0.03, 0.03, 0.3, 0.03, '#d8a832');
    }
    wbox(l, 0.41, 0.8, 0.33, 0.58, 0.02, 0.03, '#d8a832');
    wbox(l, 0.41, 0.9, 0.33, 0.58, 0.02, 0.03, '#d8a832');
    wbox(l, 0.4, 0.85, 0.31, 0.04, 0.03, 0.18, '#3a3f42');
    l.beam([0.4, 0.31, 0.85], [0.4, 0.15, 0.85], 0.003, '#2c3134');
    wround(l, 0.4, 0.85, 0.03, 0.022, 0.12, 0.034, '#4a4440', 10);
    melt(l, 0.4, 0.85, 0.153, 0.026);
    // Cooling yard: covered shed with castings, vents, ingots, crew.
    for (const [x, z] of [
      [0.82, 0.62],
      [0.82, 0.9],
    ] as const)
      wbox(l, x, z, 0.03, 0.012, 0.14, 0.012, '#6b4a2c');
    tinGable(l, 0.82, 0.76, 'z', 0.34, 0.2, 0.17, 0.04, '#5a5f63');
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        0.82 + (i % 2 ? 0.03 : -0.03),
        0.66 + Math.floor(i / 2) * 0.07,
        0.036,
        0.05,
        0.03,
        0.03,
        tone('#4a4f54', 0.25),
      );
    stack(l, 0.1, 0.2, 0.4, 0.02, '#8f4a38', 3);
    workers(l, [
      [0.5, 0.7, '#8a4a3a', '#3a3a3c'],
      [0.3, 0.7, '#5a7a9a', '#3a3a3c'],
      [0.7, 0.54, '#e8742a', '#f2cf4a'],
    ]);
    lanternPost(l, 0.9, 0.3, 0.16);
    lanternPost(l, 0.1, 0.66, 0.16);
    yard(l, 0.8, 0.2, 0.94, 0.42, 'ore', 4);
  },

  factory(l) {
    site(l, 'factory', '#7a766d', [0.05, 0.05, 0.95, 0.95]);
    // Long multi-bay brick hall with a sawtooth roof: each bay glazed on its steep face.
    const hx = 0.46;
    const hz = 0.5;
    brickBody(l, hx, hz, 0.7, 0.5, 0.03, 0.18, '#a34e38');
    windows4(l, hx, hz, 0.7, 0.5, 0.08, 0.05, { frame: '#e0d5bb' });
    for (let i = 0; i < 4; i++) {
      const bx = hx - 0.26 + i * 0.173;
      // Sawtooth bay: sloped slate face plus a vertical glazed gable towards -x.
      const g = new THREE.BufferGeometry();
      const hw = 0.0865;
      const d = 0.52;
      const v = [
        [-hw, 0, -d / 2],
        [hw, 0, -d / 2],
        [hw, 0.1, -d / 2],
        [-hw, 0, d / 2],
        [hw, 0, d / 2],
        [hw, 0.1, d / 2],
      ];
      void v;
      void g;
      l.shape(
        new THREE.BoxGeometry(0.173, 0.012, 0.52).rotateZ(-0.55).translate(0.0, 0.05, 0),
        '#4f5a60',
        bx,
        hz,
        0.215,
      );
      wbox(l, ...off(l, bx, hz, -0.075, 0), 0.21, 0.1, 0.5, 0.012, '#4f5a60');
      wbox(l, ...off(l, bx, hz, -0.074, 0), 0.215, 0.09, 0.46, 0.006, '#cfe6f0', 0, 0, 1);
    }
    wbox(l, hx, hz, 0.19, 0.72, 0.012, 0.52, '#3a3f42');
    // Loading bays with roller doors, crates, trucks and a gantry crane yard.
    for (let i = 0; i < 3; i++)
      wbox(l, ...off(l, hx, hz, -0.2 + i * 0.2, 0.252), 0.03, 0.12, 0.1, 0.006, '#5a6268');
    truck(l, 0.4, 0.9, 0, '#c93a2a');
    truck(l, 0.72, 0.9, 0, '#3f6b8a');
    for (let i = 0; i < 6; i++)
      crate(l, 0.2 + (i % 3) * 0.05, 0.84 + Math.floor(i / 3) * 0.04, 0.036, '#8a6a48');
    for (const x of [0.12, 0.28]) stack(l, x, 0.16, 0.4 + (x > 0.2 ? 0.08 : 0), 0.02, '#8f4a38', 3);
    for (const dx of [-0.14, 0.14]) flue(l, ...off(l, hx, hz, dx, -0.1), 0.215, 0.14, 0.014, 2);
    for (const z of [0.2, 0.8]) wbox(l, 0.92, z, 0.03, 0.03, 0.26, 0.03, '#d8a832');
    wbox(l, 0.92, 0.5, 0.29, 0.03, 0.02, 0.62, '#d8a832');
    l.beam([0.92, 0.29, 0.5], [0.92, 0.12, 0.5], 0.003, '#2c3134');
    wbox(l, 0.92, 0.5, 0.06, 0.06, 0.06, 0.06, '#7a5a3a');
    workers(l, [
      [0.5, 0.82, '#5a7a9a', '#3a3a3c'],
      [0.62, 0.86, '#8a4a3a', '#3a3a3c'],
      [0.84, 0.66, '#e8742a', '#f2cf4a'],
    ]);
    lanternPost(l, 0.1, 0.9, 0.16);
    floodlight(l, 0.94, 0.9, 0.26);
  },

  // -----------------------------------------------------------------------------------------
  // Steelworks (3 x 2)
  // -----------------------------------------------------------------------------------------
  steelworks(l) {
    site(l, 'steelworks', '#5a5048', [0.05, 0.08, 0.95, 0.94]);
    // Puddling furnace: brick body, arched firing door glowing, tall stack; trip hammer by a wheel.
    brickBody(l, 0.34, 0.42, 0.26, 0.24, 0.03, 0.16, '#8c4430');
    wbox(l, ...off(l, 0.34, 0.42, 0, 0.122), 0.034, 0.08, 0.06, 0.004, hot, 0, 0, 1);
    wbox(l, ...off(l, 0.34, 0.42, 0.132, 0), 0.034, 0.08, 0.004, 0.06, hot, 0, 0, 1);
    wbox(l, 0.34, 0.42, 0.19, 0.3, 0.02, 0.28, '#2c2a28');
    stack(l, ...off(l, 0.34, 0.42, -0.08, -0.06), 0.34, 0.026, '#8f4a38', 4);
    for (const s of [-1, 1])
      wbox(l, ...off(l, 0.34, 0.42, s * 0.05, 0.14), 0.036, 0.05, 0.05, 0.04, '#3a3836');
    // Trip hammer on a timber frame driven by a water wheel.
    wbox(l, 0.66, 0.5, 0.03, 0.14, 0.02, 0.1, '#6b4a2c');
    for (const dz of [-0.05, 0.05])
      wbox(l, ...off(l, 0.66, 0.5, 0, dz), 0.03, 0.012, 0.16, 0.012, '#5a3e22');
    wbox(l, 0.66, 0.5, 0.19, 0.012, 0.012, 0.11, '#5a3e22');
    l.beam([0.62, 0.17, 0.5], [0.7, 0.2, 0.5], 0.008, '#4a3220');
    wbox(l, ...off(l, 0.66, 0.5, 0.07, 0), 0.15, 0.04, 0.03, 0.03, '#2c3134');
    wbox(l, 0.7, 0.5, 0.036, 0.06, 0.04, 0.05, '#3a3f42');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.84, 0.5, 0, Math.cos(a) * 0.08),
        0.1 + Math.sin(a) * 0.08,
        0.004,
        0.02,
        0.02,
        '#7a5634',
        a,
      );
    }
    // Glowing slag heap, ingots, coke and the iron-wheeled cart.
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.18,
        0.78,
        0.036 + i * 0.012,
        0.18 - i * 0.024,
        0.014,
        0.14 - i * 0.02,
        tone(i > 3 ? '#e06a2a' : '#26282a', 0.25),
        i * 0.7,
        0,
        i > 3 ? 1 : 0,
      );
    railLine(l, 0.4, 0.78, 0.95, 0.78, 0.036, { steel: true });
    wagon(l, 0.6, 0.78, 0, '#2a2c2e', 0.042, '#6e6e70');
    wagon(l, 0.74, 0.78, 0, '#2a2c2e', 0.042, '#6e6e70');
    blockStack(l, 0.5, 0.66, 0.036, 4, 1, 2, '#6a6f74');
    workers(l, [
      [0.5, 0.58, '#8a4a3a', '#3a3a3c'],
      [0.56, 0.34, '#6a6a70', '#3a3a3c'],
      [0.24, 0.62, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.2, 0.16);
    lanternPost(l, 0.08, 0.9, 0.16);
    yard(l, 0.06, 0.18, 0.18, 0.55, 'ore', 4);
  },

  bessemer_steelworks(l) {
    site(l, 'bessemer_steelworks', '#58504a', [0.04, 0.06, 0.96, 0.94]);
    // Steel lattice tower carrying a pear-shaped Bessemer converter in a spray of sparks.
    const tx = 0.3;
    const tz = 0.36;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [tx + (a * 0.075) / l.spanX, 0.03, tz + (b * 0.075) / l.spanZ],
        [tx + (a * 0.06) / l.spanX, 0.36, tz + (b * 0.06) / l.spanZ],
        0.007,
        '#7a4a30',
      );
    for (let k = 1; k < 7; k++) {
      const y = 0.03 + k * 0.05;
      wbox(l, tx, tz, y, 0.15 - k * 0.003, 0.005, 0.15 - k * 0.003, '#8a5a3c');
      l.beam(
        [tx - 0.07 / l.spanX, y, tz - 0.07 / l.spanZ],
        [tx + 0.07 / l.spanX, y + 0.05, tz + 0.07 / l.spanZ],
        0.003,
        '#6a4228',
      );
    }
    const conv = new THREE.SphereGeometry(0.07, 16, 12);
    conv.scale(1, 1.35, 1);
    l.shape(conv, '#7a4a30', tx, tz, 0.44);
    wround(l, tx, tz, 0.028, 0.05, 0.5, 0.07, '#7a4a30', 14);
    melt(l, tx, tz, 0.572, 0.028);
    wbox(l, tx, tz, 0.59, 0.03, 0.06, 0.03, hot, 0, 0, 1);
    for (let i = 0; i < 20; i++)
      wbox(
        l,
        tx + ((rand() - 0.5) * 0.4) / l.spanX,
        tz + ((rand() - 0.5) * 0.4) / l.spanZ,
        0.5 + rand() * 0.28,
        0.008,
        0.008,
        0.008,
        '#ffb347',
        rand() * 3,
        0,
        1,
      );
    // Ladle car on rails, ingot moulds and a pouring gantry.
    railLine(l, 0.08, 0.62, 0.95, 0.62, 0.036, { steel: true });
    wagon(l, 0.4, 0.62, 0, '#5a5f63', 0.042, '#4a4f54');
    wround(l, 0.6, 0.62, 0.04, 0.034, 0.05, 0.05, '#4a4440', 12);
    melt(l, 0.6, 0.62, 0.1, 0.036);
    for (let i = 0; i < 5; i++) wbox(l, 0.18 + i * 0.07, 0.72, 0.036, 0.05, 0.034, 0.04, '#2c2c2e');
    // Rolling-mill shed with glowing windows, converter hall, stacks and lights.
    brickBody(l, 0.72, 0.32, 0.4, 0.26, 0.03, 0.18, '#8c4430');
    windows4(l, 0.72, 0.32, 0.4, 0.26, 0.09, 0.05, { frame: '#d9c9a8' });
    tinGable(l, 0.72, 0.32, 'x', 0.4, 0.26, 0.21, 0.09, '#4a4f54', '#8c4430');
    for (const dx of [-0.12, 0.12])
      stack(l, ...off(l, 0.72, 0.32, dx, -0.1), 0.46, 0.022, '#8f4a38', 3);
    conveyor(l, [0.52, 0.036, 0.42], [0.58, 0.14, 0.34], 3);
    workers(l, [
      [0.26, 0.58, '#e8742a', '#f2cf4a'],
      [0.5, 0.7, '#6a6a70', '#3a3a3c'],
      [0.76, 0.58, '#8a4a3a', '#3a3a3c'],
    ]);
    floodlight(l, 0.06, 0.8, 0.28);
    floodlight(l, 0.94, 0.8, 0.28);
    lanternPost(l, 0.5, 0.9, 0.16);
    yard(l, 0.06, 0.84, 0.4, 0.95, 'ore', 4);
  },

  integrated_steel_mill(l) {
    site(l, 'integrated_steel_mill', '#524b46', [0.03, 0.05, 0.97, 0.95]);
    // Blast furnace stack with four Cowper stoves, big pipework and a great mill hall.
    const bx = 0.3;
    const bz = 0.32;
    wround(l, bx, bz, 0.05, 0.085, 0.03, 0.4, '#6a4a3a', 18);
    wround(l, bx, bz, 0.03, 0.05, 0.43, 0.3, '#5a3e30', 18);
    wround(l, bx, bz, 0.04, 0.03, 0.73, 0.05, '#3a2c24', 18);
    for (let i = 1; i < 6; i++)
      wround(l, bx, bz, 0.09 - i * 0.01, 0.09 - i * 0.01, 0.03 + i * 0.1, 0.006, '#2c2a28', 18);
    wbox(l, ...off(l, bx, bz, 0.085, 0.0), 0.12, 0.03, 0.04, 0.04, hot, 0, 0, 1);
    smoke(l, bx, bz, 0.8, 4);
    for (let i = 0; i < 4; i++) {
      const [sx, sz] = off(l, bx, bz, 0.17 + (i % 2) * 0.11, -0.05 + Math.floor(i / 2) * 0.12);
      wround(l, sx, sz, 0.04, 0.042, 0.03, 0.5 - i * 0.02, tone('#9a8a78', 0.1), 14);
      l.shape(
        new THREE.SphereGeometry(0.041, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        '#8a7a6a',
        sx,
        sz,
        0.53 - i * 0.02,
      );
      l.beam([sx, 0.38, sz], [bx, 0.38 + (i % 2) * 0.02, bz], 0.012, '#4a4440');
    }
    l.beam([bx, 0.8, bz], [bx + 0.2 / l.spanX, 0.5, bz + 0.1 / l.spanZ], 0.016, '#3a3f42');
    // Mill hall with arched glowing windows and a sawtooth-ish clerestory.
    brickBody(l, 0.72, 0.34, 0.5, 0.3, 0.03, 0.2, '#7e3d2c');
    windows4(l, 0.72, 0.34, 0.5, 0.3, 0.1, 0.05, { frame: '#d9c9a8' });
    tinGable(l, 0.72, 0.34, 'x', 0.5, 0.3, 0.23, 0.1, '#3f464b', '#7e3d2c');
    for (const dx of [-0.16, 0, 0.16])
      stack(l, ...off(l, 0.72, 0.34, dx, -0.12), 0.44 + dx, 0.02, '#7e3d2c', 3);
    // Torpedo cars carrying molten iron, tracks, piping and floodlights.
    railLine(l, 0.04, 0.68, 0.96, 0.68, 0.036, { steel: true });
    railLine(l, 0.04, 0.76, 0.96, 0.76, 0.036, { steel: true });
    for (let i = 0; i < 3; i++) {
      const cx = 0.28 + i * 0.22;
      wbox(l, cx, 0.68, 0.042, 0.17, 0.03, 0.05, '#2c3134');
      const tp = new THREE.CapsuleGeometry(0.036, 0.1, 6, 14);
      tp.rotateZ(Math.PI / 2);
      l.shape(tp, '#8a5a44', cx, 0.68, 0.1);
      wbox(l, cx, 0.68, 0.132, 0.03, 0.006, 0.03, hot, 0, 0, 1);
    }
    wagon(l, 0.4, 0.76, 0, '#6a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.56, 0.76, 0, null, 0.042, '#6e6e70');
    for (let i = 0; i < 5; i++)
      l.beam(
        [0.4 + i * 0.1, 0.46 - i * 0.01, 0.52],
        [0.44 + i * 0.1, 0.46 - i * 0.01, 0.52],
        0.01,
        '#4a4f54',
      );
    l.beam([0.22, 0.36, 0.2], [0.58, 0.36, 0.52], 0.01, '#4a4f54');
    workers(l, [
      [0.46, 0.84, '#e8742a', '#f2cf4a'],
      [0.2, 0.84, '#e8742a', '#f2cf4a'],
      [0.8, 0.6, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.06, 0.58, 0.32);
    floodlight(l, 0.94, 0.58, 0.32);
    floodlight(l, 0.5, 0.94, 0.28);
    yard(l, 0.06, 0.84, 0.3, 0.95, 'ore', 4);
  },

  // -----------------------------------------------------------------------------------------
  // Coal
  // -----------------------------------------------------------------------------------------
  coal_mine(l) {
    site(l, 'coal_mine', '#3f3d3b', [0.08, 0.28, 0.94, 0.94]);
    const rock = '#6a6660';
    rockMass(l, 0.05, 0.05, 0.62, 0.3, 0.036, 0.09, rock, grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.4, 0.16, 0.126, 0.06, shade(rock, 0.95), grass, 0.06);
    portal(l, 0.3, 0.3, 0.14, 0.11, 0.036, '+z', '#5c4630');
    // Coal tipple: timber trestle with a chute into a wagon, sorting screens and hand carts.
    for (const [x, z] of [
      [0.6, 0.4],
      [0.74, 0.4],
      [0.6, 0.6],
      [0.74, 0.6],
    ] as const)
      wbox(l, x, z, 0.036, 0.016, 0.22, 0.016, '#5c4630');
    wbox(l, 0.67, 0.5, 0.25, 0.2, 0.016, 0.26, '#6b5a48');
    l.beam([0.6, 0.25, 0.4], [0.66, 0.1, 0.74], 0.02, '#4a3a2a');
    l.beam([0.74, 0.25, 0.4], [0.8, 0.1, 0.74], 0.02, '#4a3a2a');
    wbox(l, 0.67, 0.5, 0.266, 0.17, 0.02, 0.22, '#1d1f21');
    railLine(l, 0.3, 0.3, 0.3, 0.96);
    railLine(l, 0.72, 0.62, 0.72, 0.96);
    wagon(l, 0.3, 0.5, Math.PI / 2, '#1d1f21');
    wagon(l, 0.3, 0.68, Math.PI / 2, '#1d1f21');
    wagon(l, 0.72, 0.84, Math.PI / 2, '#1d1f21');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.9,
        0.7,
        0.036 + i * 0.014,
        0.2 - i * 0.034,
        0.016,
        0.18 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    for (const [x, z] of [
      [0.46, 0.5],
      [0.46, 0.62],
    ] as const) {
      wbox(l, x, z, 0.036, 0.09, 0.012, 0.07, '#6b4a2c', 0.3);
      for (let i = 0; i < 5; i++)
        wbox(l, x - 0.03 + i * 0.016, z, 0.05, 0.004, 0.012, 0.07, '#8a8f94');
    }
    boardBody(l, 0.16, 0.74, 0.2, 0.16, 0.03, 0.1, '#7a6a52');
    windows4(l, 0.16, 0.74, 0.2, 0.16, 0.055, 0.032, { shutters: '#3a2f28' });
    door(l, 0.16, 0.74, 0.2, 0.16, '+x', 0, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, 0.16, 0.74, 'z', 0.16, 0.2, 0.13, 0.07, '#4a4440', '#7a6a52');
    workers(l, [
      [0.42, 0.42, '#5a5f63', '#3a3a3c'],
      [0.5, 0.82, '#6a6a70', '#3a3a3c'],
      [0.84, 0.52, '#8a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.2, 0.4, 0.14);
    lanternPost(l, 0.88, 0.9, 0.14);
    shrub(l, 0.92, 0.1, 0.04);
  },

  colliery_headframe(l) {
    site(l, 'colliery_headframe', '#3b3937', [0.06, 0.2, 0.95, 0.95]);
    // Steel lattice pithead gear with twin sheave wheels, a brick winding house and chimney.
    const hx = 0.58;
    const hz = 0.28;
    const top = 0.62;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [hx + (a * 0.1) / l.spanX, 0.036, hz + (b * 0.1) / l.spanZ],
        [hx + (a * 0.02) / l.spanX, top, hz + (b * 0.02) / l.spanZ],
        0.008,
        '#4d5559',
      );
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const;
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      const t2 = Math.min(1, t + 1 / 9);
      const r = 0.1 - 0.08 * t;
      const r2 = 0.1 - 0.08 * t2;
      const y = 0.036 + (top - 0.036) * t;
      const y2 = 0.036 + (top - 0.036) * t2;
      for (let c = 0; c < 4; c++) {
        const [a, b] = corners[c]!;
        const [a2, b2] = corners[(c + 1) % 4]!;
        l.beam(
          [hx + (a * r) / l.spanX, y, hz + (b * r) / l.spanZ],
          [hx + (a2 * r) / l.spanX, y, hz + (b2 * r) / l.spanZ],
          0.004,
          '#566066',
        );
        l.beam(
          [hx + (a * r) / l.spanX, y, hz + (b * r) / l.spanZ],
          [hx + (a2 * r2) / l.spanX, y2, hz + (b2 * r2) / l.spanZ],
          0.003,
          '#4a5257',
        );
      }
    }
    wbox(l, hx, hz, top, 0.1, 0.02, 0.1, '#d8a832');
    for (const dx of [-0.03, 0.03]) windingWheel(l, ...off(l, hx, hz, 0, dx), top + 0.05, 0.04, 0);
    l.beam([hx, top, hz], [hx, 0.06, hz], 0.002, '#1c1f21');
    brickBody(l, 0.28, 0.46, 0.3, 0.22, 0.03, 0.14, '#9a4a35');
    windows4(l, 0.28, 0.46, 0.3, 0.22, 0.08, 0.036, { frame: '#e9dfc9' });
    door(l, 0.28, 0.46, 0.3, 0.22, '+z', 0, 0.03, 0.05, 0.095, timberDark);
    shingleGable(l, 0.28, 0.46, 'x', 0.3, 0.22, 0.17, 0.09, slate, '#9a4a35');
    stack(l, ...off(l, 0.28, 0.46, -0.1, -0.06), 0.42, 0.02, '#9c5640', 4);
    l.beam(
      [hx - 0.05 / l.spanX, top + 0.02, hz + 0.03 / l.spanZ],
      [0.3, 0.17, 0.46],
      0.002,
      '#2c3134',
    );
    // Coal bunker pouring into wagons on steel rails, coal stocks and crew.
    wbox(l, 0.74, 0.62, 0.036, 0.22, 0.14, 0.14, '#4a4846');
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.74,
        0.62,
        0.176 + i * 0.01,
        0.2 - i * 0.04,
        0.01,
        0.12 - i * 0.03,
        tone('#1c1e20', 0.3),
      );
    railLine(l, 0.05, 0.84, 0.95, 0.84, 0.036, { steel: true });
    wagon(l, 0.4, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.56, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.72, 0.84, 0, '#1c1e20', 0.042, '#6e6e70');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.16,
        0.72,
        0.036 + i * 0.014,
        0.22 - i * 0.04,
        0.016,
        0.18 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    workers(l, [
      [0.46, 0.68, '#5a5f63', '#3a3a3c'],
      [0.62, 0.74, '#6a6a70', '#3a3a3c'],
      [0.36, 0.66, '#8a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.4, 0.16);
    lanternPost(l, 0.9, 0.4, 0.16);
    yard(l, 0.6, 0.4, 0.9, 0.5, 'ore', 3);
  },

  deep_shaft_colliery(l) {
    site(l, 'deep_shaft_colliery', '#363432', [0.05, 0.18, 0.96, 0.96]);
    // Enclosed headgear tower clad in dark sheet with a pyramid cap and lit slit windows.
    const hx = 0.62;
    const hz = 0.26;
    wbox(l, hx, hz, 0.03, 0.2, 0.5, 0.2, '#3a3f43');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, 0, 0.102), 0.1 + i * 0.07, 0.03, 0.04, 0.004, '#f2c766', 0, 0, 1);
    windows4(l, hx, hz, 0.2, 0.2, 0.3, 0.036, { frame: '#586067' });
    for (let i = 0; i < 12; i++)
      wbox(l, ...off(l, hx, hz, -0.095 + i * 0.0173, 0.103), 0.03, 0.002, 0.48, 0.003, '#2a2e31');
    const cap = new THREE.ConeGeometry(0.16, 0.14, 4);
    cap.rotateY(Math.PI / 4);
    l.shape(cap, '#2f3438', hx, hz, 0.6);
    wbox(l, hx, hz, 0.67, 0.012, 0.1, 0.012, '#1c1f21');
    // Washery hall, inclined conveyors and three coal silos.
    brickBody(l, 0.28, 0.5, 0.34, 0.26, 0.03, 0.18, '#7a4a38');
    windows4(l, 0.28, 0.5, 0.34, 0.26, 0.09, 0.05, { frame: '#cfc3ab' });
    tinGable(l, 0.28, 0.5, 'x', 0.34, 0.26, 0.21, 0.09, '#3f464b', '#7a4a38');
    conveyor(l, [0.55, 0.3, 0.3], [0.38, 0.22, 0.46], 3);
    conveyor(l, [0.4, 0.2, 0.62], [0.72, 0.34, 0.7], 5);
    for (const [x, z, h] of [
      [0.78, 0.5, 0.34],
      [0.86, 0.66, 0.3],
      [0.74, 0.8, 0.26],
    ] as const) {
      steelSilo(l, x, z, 0.05, h);
    }
    railLine(l, 0.05, 0.9, 0.95, 0.9, 0.036, { steel: true });
    wagon(l, 0.3, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.46, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    wagon(l, 0.62, 0.9, 0, '#1c1e20', 0.042, '#6e6e70');
    truck(l, 0.2, 0.72, 0, '#3a3f43');
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.12,
        0.38,
        0.036 + i * 0.014,
        0.2 - i * 0.04,
        0.016,
        0.16 - i * 0.03,
        tone('#1f2123', 0.3),
        i * 0.7,
      );
    stack(l, ...off(l, 0.28, 0.5, -0.12, -0.08), 0.52, 0.024, '#586067', 3);
    workers(l, [
      [0.5, 0.76, '#e8742a', '#f2cf4a'],
      [0.4, 0.8, '#e8742a', '#f2cf4a'],
      [0.56, 0.5, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.08, 0.3, 0.3);
    floodlight(l, 0.94, 0.4, 0.3);
    floodlight(l, 0.08, 0.94, 0.26);
  },
};
