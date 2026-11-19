import * as THREE from 'three';
import {
  barrel,
  boardBody,
  chimney,
  crate,
  cypress,
  door,
  lanternPost,
  off,
  person,
  rand,
  shade,
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
  coneRoof,
  crane,
  dog,
  glassHouse,
  logBody,
  pier,
  smoke,
  truck,
  waterSheet,
} from './dioramaProps';
import { bollard, fishBox, netFrame, shore } from './coastDiorama';
import { site } from './industryDiorama';
import {
  blockStack,
  brickBody,
  conveyor,
  floodlight,
  railLine,
  rockMass,
  rubble,
  wagon,
  windows4,
  workers,
} from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 2B, drawn as dioramas on lots scaled by 2 (see `zoomed` in architectureModels.ts):
//   woodcutter    -> mechanized_lumber_camp -> forester_estate        (2x2)
//   gravel_pit    -> stonemason_yard        -> mechanical_stoneworks  (2x2)
//   rail_station (3x2) -> glass_vault_station (4x3)
//   airfield (4x4), ferry_pier (3x2), fishing_harbor (3x3), ice_fishery (2x2)

const grass = '#79a24a';
const timber = '#5c3f27';
const plank = '#8a6142';
const slate = '#4d5a66';

/** Horizontal cylinder (axis along x, then turned by ry) with its bottom-centre at height y. */
export function cyl(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  len: number,
  ry: number,
  color: string,
  seg = 10,
): void {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateZ(Math.PI / 2);
  g.rotateY(ry);
  l.shape(g, color, x, z, y + r);
}

type P3 = [number, number, number];
/** Beam point from a lot-fraction pair and a height. */
export const p3 = (a: readonly [number, number], y: number): P3 => [a[0], y, a[1]];

/** Upright disc (wheel) in the x-y plane, turned by ry, bottom at y. */
export function disc(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  t: number,
  color: string,
  ry = 0,
): void {
  const g = new THREE.CylinderGeometry(r, r, t, 12);
  g.rotateX(Math.PI / 2);
  g.rotateY(ry);
  l.shape(g, color, x, z, y + r);
}

/** Triangular stack of round logs lying along `ry`. */
export function logPile(l: Lot, x: number, z: number, ry: number, rows: number, len = 0.14): void {
  const s = Math.sin(ry);
  const c = Math.cos(ry);
  for (let r = 0; r < rows; r++) {
    const count = rows - r;
    for (let i = 0; i < count; i++) {
      const t = (i - (count - 1) / 2) * 0.03;
      cyl(
        l,
        ...off(l, x, z, t * s, t * c),
        0.03 + r * 0.026,
        0.0135,
        len,
        ry,
        tone(plank, 0.22),
        7,
      );
    }
  }
}

/** Sawn planks stacked with spacer sticks. */
function plankStack(l: Lot, x: number, z: number, layers: number, ry = 0): void {
  for (let i = 0; i < layers; i++) {
    wbox(l, x, z, 0.03 + i * 0.016, 0.15, 0.011, 0.075, tone('#c9a56c', 0.15), ry);
    for (const t of [-0.05, 0, 0.05]) {
      const [px, pz] = off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t);
      wbox(l, px, pz, 0.041 + i * 0.016, 0.012, 0.005, 0.08, '#7a5a3a', ry);
    }
  }
}

/** Chopping stump with an axe stuck in it. */
export function stump(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.03, 0.036, 0.03, 0.045, '#8a6142', 10);
  wround(l, x, z, 0.026, 0.026, 0.075, 0.003, '#d9b982', 10);
  l.beam([x, 0.1, z], [x + 0.03 / l.spanX, 0.16, z], 0.005, '#6b4a2a');
  wbox(l, ...off(l, x, z, 0.006, 0), 0.09, 0.03, 0.006, 0.026, '#9aa3a8');
}

function sawdust(l: Lot, x: number, z: number, r: number): void {
  l.shape(new THREE.ConeGeometry(r, r * 0.7, 9), '#d9bf8a', x, z, 0.03 + r * 0.35);
}

export function wheelbarrow(l: Lot, x: number, z: number, ry: number, load: string): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number, b = 0): [number, number] => off(l, x, z, c * a + s * b, -s * a + c * b);
  wbox(l, ...at(0), 0.05, 0.075, 0.016, 0.034, '#8a6142', ry);
  wbox(l, ...at(0), 0.065, 0.06, 0.012, 0.026, load, ry);
  const wheel = new THREE.TorusGeometry(0.013, 0.005, 5, 10);
  wheel.rotateY(ry + Math.PI / 2);
  l.shape(wheel, '#2c2a28', ...at(0.034), 0.043);
  for (const k of [-1, 1])
    l.beam(p3(at(-0.02, k * 0.013), 0.062), p3(at(-0.06, k * 0.013), 0.09), 0.005, '#6b4a2a');
}

/** Inclined wire-mesh sieve on A-frame legs. */
function sieve(l: Lot, x: number, z: number, ry: number): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number, b = 0): [number, number] => off(l, x, z, c * a + s * b, -s * a + c * b);
  wbox(l, ...at(0), 0.06, 0.085, 0.006, 0.07, '#5a6a5a', ry, 0.5);
  for (let i = 0; i < 6; i++)
    wbox(l, ...at(0, -0.03 + i * 0.012), 0.062, 0.088, 0.003, 0.003, '#2c2a28', ry, 0.5);
  for (const sg of [-1, 1])
    for (const e of [-1, 1])
      l.beam(p3(at(sg * 0.04, e * 0.03), 0.03), p3(at(sg * 0.04, e * 0.03), 0.095), 0.007, timber);
  l.shape(new THREE.ConeGeometry(0.035, 0.03, 8), '#b6a98c', ...at(0, 0.055), 0.045);
}

/** Wooden watchtower on four splayed legs with a cabin at the top. */
function tower(l: Lot, x: number, z: number, top: number, color = '#6b4a2a'): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const) {
    l.beam(
      [x + (a * 0.05) / l.spanX, 0.03, z + (b * 0.05) / l.spanZ],
      [x + (a * 0.028) / l.spanX, top, z + (b * 0.028) / l.spanZ],
      0.01,
      color,
    );
  }
  for (let k = 1; k < 5; k++) {
    const yy = 0.03 + (k / 5) * (top - 0.03);
    const r = 0.05 - 0.022 * (k / 5);
    wbox(l, x, z, yy, r * 2, 0.007, r * 2, shade(color, 0.85));
    l.beam(
      [x - r / l.spanX, yy, z - r / l.spanZ],
      [x + r / l.spanX, yy + 0.07, z + r / l.spanZ],
      0.004,
      shade(color, 0.8),
    );
  }
  wbox(l, x, z, top, 0.095, 0.012, 0.095, shade(color, 0.7));
  wbox(l, x, z, top + 0.012, 0.075, 0.045, 0.075, '#7a5a3a');
  for (const [dx, dz, w, d] of [
    [0, 0.038, 0.06, 0.004],
    [0, -0.038, 0.06, 0.004],
    [0.038, 0, 0.004, 0.06],
    [-0.038, 0, 0.004, 0.06],
  ] as const)
    wbox(l, ...off(l, x, z, dx, dz), top + 0.02, w, 0.03, d, '#ffd27a', 0, 0, 1);
  coneRoof(l, x, z, top + 0.057, 0.062, 0.05, '#7a3b2a');
}

// ---------------------------------------------------------------------------------------------

export const forestryTransitDiorama: Recipes = {
  // -------------------------------------------------------------------------------------------
  // Forestry: woodcutter -> mechanized_lumber_camp -> forester_estate
  // -------------------------------------------------------------------------------------------
  woodcutter(l) {
    site(l, 'woodcutter', '#7a6446', [0.08, 0.1, 0.94, 0.92]);
    const hx = 0.4;
    const hz = 0.33;
    logBody(l, hx, hz, 0.3, 0.22, 0.036, 0.115, '#8a6142');
    door(l, hx, hz, 0.3, 0.22, '+z', -0.07, 0.036, 0.045, 0.078, timber);
    window4(l, hx, hz, 0.3, 0.22, '+z', 0.07, 0.085, 0.04, { shutters: '#4a6a3a' });
    window4(l, hx, hz, 0.3, 0.22, '-z', 0, 0.085, 0.04);
    window4(l, hx, hz, 0.3, 0.22, '+x', 0, 0.085, 0.04);
    window4(l, hx, hz, 0.3, 0.22, '-x', 0, 0.085, 0.04);
    shingleGable(l, hx, hz, 'x', 0.3, 0.22, 0.151, 0.075, '#6a4f38', '#8a6142');
    chimney(l, ...off(l, hx, hz, 0.1, -0.05), 0.16, 0.1, '#8f8a80');
    smoke(l, ...off(l, hx, hz, 0.1, -0.05), 0.27, 3);
    logPile(l, 0.8, 0.28, 0, 3);
    logPile(l, 0.78, 0.4, 0.2, 4);
    logPile(l, 0.18, 0.2, Math.PI / 2, 3, 0.12);
    // Split firewood against the cabin wall.
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 6; j++)
        wbox(
          l,
          ...off(l, hx, hz, -0.21 + (j % 2) * 0.012, 0.0 + i * 0.012 - 0.04),
          0.036 + j * 0.011,
          0.01,
          0.01,
          0.01,
          tone('#a8794a', 0.25),
        );
    stump(l, 0.2, 0.62);
    // X-shaped sawbuck holding a log, with a bow saw leaning on it.
    for (const t of [-1, 1]) {
      l.beam([0.58 + t * 0.012, 0.036, 0.62], [0.58 - t * 0.012, 0.11, 0.66], 0.007, timber);
      l.beam([0.58 + t * 0.012, 0.036, 0.7], [0.58 - t * 0.012, 0.11, 0.66], 0.007, timber);
    }
    cyl(l, 0.58, 0.66, 0.108, 0.013, 0.16, Math.PI / 2, '#9a6f46', 8);
    // Sled for hauling logs.
    for (const t of [-0.02, 0.02])
      wbox(l, ...off(l, 0.3, 0.82, 0, t), 0.036, 0.22, 0.008, 0.008, '#4a3a2a');
    for (let i = 0; i < 3; i++)
      cyl(
        l,
        ...off(l, 0.3, 0.82, 0, -0.016 + i * 0.016),
        i === 1 ? 0.06 : 0.044,
        0.014,
        0.2,
        0,
        tone(plank, 0.2),
        7,
      );
    person(l, 0.47, 0.6, 0.036, '#b0463a', '#3a5a3a');
    person(l, 0.72, 0.58, 0.036, '#4a6a8a');
    dog(l, 0.4, 0.72, 0.6);
    cypress(l, 0.09, 0.14, 0.3);
    cypress(l, 0.92, 0.12, 0.28);
    cypress(l, 0.06, 0.52, 0.24);
    cypress(l, 0.95, 0.52, 0.22);
    shrub(l, 0.62, 0.9, 0.04);
    lanternPost(l, 0.6, 0.46, 0.14);
    for (let i = 0; i < 10; i++)
      wbox(
        l,
        0.1 + rand() * 0.8,
        0.45 + rand() * 0.45,
        0.037,
        0.02 + rand() * 0.02,
        0.005,
        0.01,
        '#c9a56c',
        rand() * 3,
      );
  },

  mechanized_lumber_camp(l) {
    site(l, 'lumber_camp', '#8a7556', [0.06, 0.08, 0.95, 0.94]);
    // Open sawmill shed on posts, with a circular saw bench and a log on the carriage.
    const sx = 0.42;
    const sz = 0.32;
    wbox(l, sx, sz, 0.03, 0.42, 0.012, 0.26, '#a68a60');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, sx, sz, a * 0.2, b * 0.12), 0.042, 0.02, 0.138, 0.02, timber);
    tinGable(l, sx, sz, 'x', 0.42, 0.26, 0.18, 0.075, '#59636a', '#7a6a50');
    wbox(l, sx, sz, 0.042, 0.3, 0.04, 0.05, '#6b4a2a');
    cyl(l, sx, sz, 0.1, 0.012, 0.28, 0, tone('#9a6f46', 0.1), 8);
    wround(l, ...off(l, sx, sz, 0, 0.032), 0.04, 0.04, 0.05, 0.005, '#aeb7bb', 20);
    wbox(l, sx, sz, 0.036, 0.4, 0.004, 0.004, '#4a4f54');
    // Steam boiler with a stack, feeding the saw via a belt.
    const bx = 0.8;
    const bz = 0.22;
    cyl(l, bx, bz, 0.04, 0.045, 0.16, 0, '#3a3f42', 12);
    wbox(l, bx, bz, 0.03, 0.18, 0.012, 0.09, '#2c2a28');
    wround(l, ...off(l, bx, bz, 0.06, 0), 0.014, 0.016, 0.1, 0.14, '#2c2a28', 10);
    smoke(l, ...off(l, bx, bz, 0.06, 0), 0.25, 4);
    l.beam([0.69, 0.09, 0.24], [0.6, 0.12, 0.3], 0.004, '#1c1c1c');
    // Steam donkey winch with drum and cable to a skidded log.
    wbox(l, 0.78, 0.56, 0.03, 0.12, 0.03, 0.08, '#6b4a2a');
    cyl(l, 0.78, 0.56, 0.06, 0.026, 0.07, Math.PI / 2, '#5a4a3a', 10);
    wbox(l, 0.74, 0.56, 0.06, 0.04, 0.05, 0.05, '#7a2c22');
    l.beam([0.78, 0.09, 0.56], [0.5, 0.05, 0.78], 0.003, '#2c2a28');
    // Timber derrick lifting a log onto the sorting slide.
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [0.16 + (a * 0.03) / l.spanX, 0.036, 0.44 + (b * 0.03) / l.spanZ],
        [0.16, 0.52, 0.44],
        0.012,
        timber,
      );
    l.beam([0.16, 0.52, 0.44], [0.34, 0.4, 0.58], 0.012, '#6b4a2a');
    l.beam([0.16, 0.54, 0.44], [0.34, 0.4, 0.58], 0.004, '#2c3134');
    l.beam([0.34, 0.4, 0.58], [0.34, 0.25, 0.58], 0.003, '#2c3134');
    cyl(l, 0.34, 0.58, 0.2, 0.022, 0.2, 0.3, tone(plank, 0.2), 8);
    // Sorting slide, debarking rack and stacked logs and planks.
    l.beam([0.08, 0.15, 0.8], [0.42, 0.045, 0.8], 0.04, '#7a5a3a');
    logPile(l, 0.2, 0.9, 0, 4, 0.16);
    logPile(l, 0.62, 0.88, 0.1, 3);
    plankStack(l, 0.6, 0.5, 6, 0.1);
    plankStack(l, 0.9, 0.42, 4, Math.PI / 2);
    sawdust(l, 0.58, 0.18, 0.07);
    sawdust(l, 0.68, 0.7, 0.05);
    // Narrow-gauge line with a log wagon.
    railLine(l, 0.04, 0.94, 0.96, 0.94, 0.036, { steel: false });
    wagon(l, 0.5, 0.94, 0, '#8a6142', 0.042, '#5a4a3a');
    wagon(l, 0.7, 0.94, 0, '#8a6142', 0.042, '#5a4a3a');
    // Foreman's lodge with lit windows.
    const hx = 0.84;
    const hz = 0.76;
    boardBody(l, hx, hz, 0.2, 0.16, 0.036, 0.1, '#7a5a3a');
    windows4(l, hx, hz, 0.2, 0.16, 0.08, 0.035);
    door(l, hx, hz, 0.2, 0.16, '+z', 0, 0.036, 0.04, 0.07, timber);
    shingleGable(l, hx, hz, 'x', 0.2, 0.16, 0.136, 0.06, '#59636a', '#7a5a3a');
    workers(l, [
      [0.32, 0.46, '#b0463a', '#d9c38a'],
      [0.5, 0.6, '#4a6a8a', '#3a3a3c'],
      [0.72, 0.64, '#5a7a4a'],
    ]);
    cypress(l, 0.07, 0.1, 0.26);
    cypress(l, 0.94, 0.08, 0.24);
    lanternPost(l, 0.5, 0.74, 0.14);
    barrel(l, 0.7, 0.34);
  },

  forester_estate(l) {
    site(l, 'forester_estate', '#8d8566', [0.1, 0.1, 0.92, 0.92]);
    // Two-storey stone and cedar manor.
    const hx = 0.36;
    const hz = 0.3;
    stoneBody(l, hx, hz, 0.38, 0.24, 0.036, 0.12, '#a8a294');
    boardBody(l, hx, hz, 0.38, 0.24, 0.156, 0.1, '#8a6a46');
    door(l, hx, hz, 0.38, 0.24, '+z', -0.08, 0.036, 0.05, 0.088, '#4a3322');
    windows4(l, hx, hz, 0.38, 0.24, 0.07, 0.04, { shutters: '#2f5a3a' });
    windows4(l, hx, hz, 0.38, 0.24, 0.185, 0.04, { shutters: '#2f5a3a' });
    shingleGable(l, hx, hz, 'x', 0.38, 0.24, 0.256, 0.11, '#6b5238', '#8a6a46');
    for (const dx of [-0.12, 0.13]) chimney(l, ...off(l, hx, hz, dx, -0.05), 0.27, 0.1, '#9a948a');
    smoke(l, ...off(l, hx, hz, 0.13, -0.05), 0.4, 3);
    // Fire-watch tower.
    tower(l, 0.84, 0.2, 0.62);
    // Greenhouse nursery and seedbeds.
    glassHouse(l, 0.68, 0.72, 0.036, 0.26, 0.08, 0.17, '#e8e4d8', '#bfe0e6', 0.6, 0.05, true);
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 6; i++) {
        const [px, pz] = off(l, 0.24, 0.64 + r * 0.075, -0.06 + i * 0.024, 0);
        if (i === 0) wbox(l, 0.24, 0.64 + r * 0.075, 0.036, 0.16, 0.014, 0.04, '#5a3e2a');
        l.shape(new THREE.ConeGeometry(0.01, 0.03, 5), '#3f7a3a', px, pz, 0.065);
      }
    // Picket fence along the front and a stone path to the door.
    for (let i = 0; i < 12; i++)
      wbox(l, 0.1 + i * 0.075, 0.95, 0.036, 0.008, 0.04, 0.008, '#e3dccb');
    wbox(l, 0.5, 0.95, 0.056, 0.9, 0.006, 0.006, '#e3dccb');
    for (let i = 0; i < 5; i++)
      wbox(l, 0.31 + i * 0.002, 0.5 + i * 0.06, 0.036, 0.04, 0.005, 0.03, '#b9b4a6', rand() * 0.4);
    cypress(l, 0.07, 0.1, 0.34);
    cypress(l, 0.94, 0.5, 0.3);
    cypress(l, 0.07, 0.46, 0.28);
    shrub(l, 0.56, 0.52, 0.04, '#3f7a3a');
    lanternPost(l, 0.5, 0.56, 0.15);
    person(l, 0.44, 0.58, 0.036, '#2f5a3a', '#3a3a3c');
    person(l, 0.2, 0.84, 0.036, '#b0463a');
    dog(l, 0.5, 0.64, 0.4);
    barrel(l, 0.6, 0.5);
    logPile(l, 0.86, 0.46, Math.PI / 2, 3, 0.1);
  },

  // -------------------------------------------------------------------------------------------
  // Masonry: gravel_pit -> stonemason_yard -> mechanical_stoneworks
  // -------------------------------------------------------------------------------------------
  gravel_pit(l) {
    site(l, 'gravel_pit', '#cdbf9c', [0.06, 0.08, 0.95, 0.94]);
    rockMass(l, 0.1, 0.08, 0.5, 0.3, 0.036, 0.05, '#bdb3a0', grass, 0.08);
    for (let i = 0; i < 3; i++) sieve(l, 0.22 + i * 0.22, 0.5, 0.2 * (i - 1));
    l.shape(new THREE.ConeGeometry(0.09, 0.07, 9), '#b6a98c', 0.78, 0.26, 0.07);
    l.shape(new THREE.ConeGeometry(0.06, 0.05, 9), '#9a9484', 0.88, 0.4, 0.062);
    rubble(l, 0.62, 0.22, 0.036, 8, 0.12, '#a8a396');
    // Stone-dressing bench with a rough granite block, hammer and chisel.
    wbox(l, 0.3, 0.78, 0.07, 0.16, 0.012, 0.08, '#8a6142');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, 0.3, 0.78, a * 0.07, b * 0.032), 0.036, 0.012, 0.034, 0.012, timber);
    wbox(l, 0.29, 0.78, 0.082, 0.07, 0.05, 0.05, '#a8a396', 0.3);
    wbox(l, 0.34, 0.8, 0.082, 0.03, 0.006, 0.008, '#4a4f54', 0.5);
    wbox(l, 0.57, 0.78, 0.036, 0.08, 0.06, 0.06, '#bfb8a8', 0.2);
    wbox(l, 0.62, 0.84, 0.036, 0.06, 0.04, 0.05, '#a39c8c', -0.3);
    wheelbarrow(l, 0.5, 0.66, 0.5, '#b6a98c');
    wheelbarrow(l, 0.84, 0.62, -0.6, '#9a9484');
    for (const [x, z] of [
      [0.7, 0.4],
      [0.18, 0.34],
    ] as const) {
      l.beam([x, 0.04, z], [x + 0.02, 0.17, z - 0.01], 0.006, '#6b4a2a');
      wbox(l, ...off(l, x, z, 0.02, -0.01), 0.17, 0.03, 0.002, 0.026, '#9aa3a8');
    }
    person(l, 0.4, 0.7, 0.036, '#8a5a3a', '#d9c38a');
    person(l, 0.74, 0.52, 0.036, '#5a7a9a', '#3a3a3c');
    plankStack(l, 0.88, 0.84, 3, 0.4);
    lanternPost(l, 0.1, 0.62, 0.13);
  },

  stonemason_yard(l) {
    site(l, 'stonemason_yard', '#b3a98f', [0.06, 0.08, 0.95, 0.94]);
    const sx = 0.38;
    const sz = 0.34;
    wbox(l, sx, sz, 0.03, 0.46, 0.012, 0.28, '#9a9484');
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, sx, sz, a * 0.215, b * 0.125), 0.042, 0.022, 0.15, 0.022, timber);
    tinGable(l, sx, sz, 'x', 0.46, 0.28, 0.192, 0.085, '#4d5a66', '#7a6a50');
    // Gang saw frame cutting a block, ashlar stack and a half-carved column.
    wbox(l, 0.34, 0.34, 0.042, 0.12, 0.07, 0.08, '#cfc9b9');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, 0.34, 0.34, -0.05 + i * 0.025, 0), 0.05, 0.0025, 0.1, 0.07, '#9aa3a8');
    wbox(l, 0.34, 0.34, 0.15, 0.14, 0.012, 0.012, '#6b4a2a');
    cyl(l, 0.5, 0.4, 0.042, 0.022, 0.12, 0.2, '#d9d4c6', 12);
    blockStack(l, 0.52, 0.28, 0.042, 3, 2, 2, '#cfc9b9', 0.034);
    // Wooden derrick turning a block, braziers for the cold mornings.
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [0.78 + (a * 0.035) / l.spanX, 0.036, 0.3 + (b * 0.035) / l.spanZ],
        [0.78, 0.44, 0.3],
        0.01,
        timber,
      );
    l.beam([0.78, 0.46, 0.3], [0.9, 0.3, 0.46], 0.012, '#6b4a2a');
    l.beam([0.9, 0.3, 0.46], [0.9, 0.2, 0.46], 0.003, '#2c3134');
    wbox(l, 0.9, 0.46, 0.14, 0.06, 0.05, 0.05, '#cfc9b9');
    blockStack(l, 0.18, 0.74, 0.036, 3, 2, 3, '#d4cdbd', 0.036);
    blockStack(l, 0.5, 0.78, 0.036, 2, 2, 2, '#c4bdae', 0.036);
    blockStack(l, 0.82, 0.78, 0.036, 3, 1, 2, '#e1dccf', 0.036);
    // Slabs on timber rollers.
    for (let i = 0; i < 4; i++)
      cyl(l, 0.66, 0.6 + i * 0.03, 0.036, 0.01, 0.12, Math.PI / 2, '#6b4a2a', 7);
    wbox(l, 0.66, 0.64, 0.056, 0.16, 0.02, 0.1, '#bfb8a8');
    for (const [x, z] of [
      [0.16, 0.5],
      [0.94, 0.62],
    ] as const) {
      wround(l, x, z, 0.014, 0.016, 0.036, 0.04, '#3a3530', 8);
      wbox(l, x, z, 0.076, 0.016, 0.012, 0.016, '#ff9a3a', 0, 0, 1);
    }
    workers(l, [
      [0.42, 0.52, '#8a5a3a', '#d9c38a'],
      [0.72, 0.46, '#5a7a9a', '#3a3a3c'],
      [0.3, 0.58, '#b0463a'],
    ]);
    lanternPost(l, 0.58, 0.58, 0.14);
    rubble(l, 0.1, 0.2, 0.036, 8, 0.1, '#bfb8a8');
    shrub(l, 0.94, 0.9, 0.04);
  },

  mechanical_stoneworks(l) {
    site(l, 'stoneworks', '#9a958a', [0.05, 0.08, 0.96, 0.94]);
    // Dressing hall with a smoking flue, sawtooth-style tin roof.
    const hx = 0.34;
    const hz = 0.3;
    brickBody(l, hx, hz, 0.4, 0.26, 0.036, 0.16, '#6e6a66');
    windows4(l, hx, hz, 0.4, 0.26, 0.1, 0.045, { frame: '#d8dde0' });
    door(l, hx, hz, 0.4, 0.26, '+z', 0.09, 0.036, 0.06, 0.1, '#3a2f26', true);
    tinGable(l, hx, hz, 'x', 0.4, 0.26, 0.196, 0.08, '#4d5a66', '#6e6a66');
    chimney(l, ...off(l, hx, hz, -0.14, -0.06), 0.2, 0.2, '#7a5a4a');
    smoke(l, ...off(l, hx, hz, -0.14, -0.06), 0.42, 4);
    // Jaw crusher with hopper, vibrating screen and conveyor to graded gravel piles.
    const cx = 0.74;
    const cz = 0.34;
    wbox(l, cx, cz, 0.036, 0.14, 0.09, 0.1, '#5a6a72');
    wbox(l, cx, cz, 0.126, 0.18, 0.03, 0.14, '#6e7b82');
    wbox(l, cx, cz, 0.156, 0.1, 0.03, 0.08, '#7a8a92');
    wbox(l, ...off(l, cx, cz, -0.08, 0), 0.04, 0.05, 0.05, 0.04, '#b64c39');
    wbox(l, ...off(l, cx, cz, 0.04, 0.09), 0.06, 0.1, 0.04, 0.05, '#5a6a5a', 0, 0.25);
    conveyor(l, [0.74, 0.1, 0.46], [0.86, 0.22, 0.66], 2);
    l.shape(new THREE.ConeGeometry(0.08, 0.09, 10), '#b6a98c', 0.86, 0.72, 0.082);
    l.shape(new THREE.ConeGeometry(0.06, 0.07, 10), '#8a8478', 0.7, 0.8, 0.07);
    l.shape(new THREE.ConeGeometry(0.05, 0.06, 10), '#d4cdbd', 0.58, 0.84, 0.066);
    // Gantry crane lifting a carved marble column.
    for (const x of [0.12, 0.5])
      for (const z of [0.58, 0.76]) l.beam([x, 0.036, z], [x, 0.4, z], 0.012, '#7a8a92');
    wbox(l, 0.31, 0.58, 0.4, 0.4, 0.02, 0.03, '#b64c39');
    wbox(l, 0.31, 0.76, 0.4, 0.4, 0.02, 0.03, '#b64c39');
    wbox(l, 0.31, 0.67, 0.4, 0.03, 0.02, 0.2, '#6a2a22');
    l.beam([0.31, 0.4, 0.67], [0.31, 0.3, 0.67], 0.003, '#2c3134');
    cyl(l, 0.31, 0.67, 0.17, 0.026, 0.14, 0.2, '#ece7da', 14);
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        ...off(l, 0.31, 0.67, -0.052 + i * 0.026, 0),
        0.19,
        0.003,
        0.05,
        0.003,
        '#bfb8a8',
        0.2,
      );
    blockStack(l, 0.84, 0.54, 0.036, 2, 2, 2, '#e1dccf', 0.04);
    truck(l, 0.16, 0.9, 0, '#8a5a3a');
    floodlight(l, 0.06, 0.5, 0.28);
    floodlight(l, 0.95, 0.5, 0.28);
    workers(l, [
      [0.62, 0.52, '#e8742a', '#f2cf4a'],
      [0.22, 0.52, '#e8742a', '#f2cf4a'],
    ]);
    rubble(l, 0.9, 0.9, 0.036, 8, 0.1, '#a39c8c');
  },

  // -------------------------------------------------------------------------------------------
  // Rail: rail_station -> glass_vault_station (the airfield stands on its own)
  // -------------------------------------------------------------------------------------------
  rail_station(l) {
    site(l, 'rail_halt', '#8a8068', [0.04, 0.08, 0.96, 0.94]);
    // Timber platform with a plank face, white edge line and gravel ballast bed.
    wbox(l, 0.5, 0.46, 0.03, 1.8, 0.06, 0.17, '#8a6142');
    for (let i = 0; i < 56; i++)
      wbox(l, 0.05 + i * 0.0164, 0.46, 0.092, 0.03, 0.004, 0.17, tone('#a8794a', 0.2));
    wbox(l, 0.5, 0.545, 0.094, 1.8, 0.004, 0.012, '#f1ece2');
    // Waiting shelter with a stovepipe, bench and noticeboard.
    const hx = 0.3;
    const hz = 0.36;
    boardBody(l, hx, hz, 0.36, 0.16, 0.094, 0.11, '#8a6a48');
    door(l, hx, hz, 0.36, 0.16, '+z', 0.07, 0.094, 0.045, 0.08, timber);
    windows4(l, hx, hz, 0.36, 0.16, 0.13, 0.04, { shutters: '#2f5a3a' });
    shingleGable(l, hx, hz, 'x', 0.36, 0.16, 0.204, 0.065, '#5a4a3a', '#8a6a48');
    wround(l, ...off(l, hx, hz, -0.1, -0.03), 0.01, 0.011, 0.21, 0.09, '#2c2a28', 8);
    smoke(l, ...off(l, hx, hz, -0.1, -0.03), 0.3, 3);
    wbox(l, 0.5, 0.48, 0.12, 0.16, 0.012, 0.04, '#6b4a2a');
    wbox(l, 0.5, 0.47, 0.13, 0.16, 0.04, 0.006, '#6b4a2a');
    // Rails on sleepers, with a hand-pushed baggage cart and a semaphore signal.
    railLine(l, 0.02, 0.74, 0.98, 0.74, 0.036, { steel: false });
    railLine(l, 0.02, 0.88, 0.98, 0.88, 0.036, { steel: false });
    wbox(l, 0.72, 0.46, 0.094, 0.09, 0.025, 0.06, '#6b4a2a');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.72, 0.46, t * 0.035, 0.034), 0.094, 0.012, 0.004, '#2c2a28');
    crate(l, 0.72, 0.46, 0.119, '#8a6a48');
    wround(l, 0.92, 0.6, 0.006, 0.008, 0.094, 0.3, '#3a3a3c', 6);
    wbox(l, 0.92, 0.6, 0.38, 0.075, 0.012, 0.008, '#c43c2c');
    wbox(l, ...off(l, 0.92, 0.6, 0.032, 0), 0.38, 0.012, 0.012, 0.012, '#ffd27a', 0, 0, 1);
    lanternPost(l, 0.08, 0.48, 0.17);
    lanternPost(l, 0.52, 0.58, 0.15);
    person(l, 0.44, 0.52, 0.094, '#5a7a9a', '#3a3a3c');
    person(l, 0.58, 0.5, 0.094, '#b0463a');
    person(l, 0.82, 0.52, 0.094, '#6a8a5a', '#d9c38a');
    crate(l, 0.64, 0.5, 0.094, '#8a6a48');
    shrub(l, 0.06, 0.22, 0.04);
  },

  glass_vault_station(l) {
    site(l, 'glass_vault', '#9a9486', [0.03, 0.06, 0.97, 0.96]);
    // Red-brick concourse along the back, with a slate roof and arched, glowing windows.
    const hx = 0.5;
    const hz = 0.82;
    brickBody(l, hx, hz, 1.4, 0.22, 0.036, 0.19, '#9c4a3a');
    windows4(l, hx, hz, 1.4, 0.22, 0.1, 0.05, { frame: '#e3d9bf' });
    for (let i = 0; i < 5; i++)
      door(l, hx, hz, 1.4, 0.22, '+z', -0.5 + i * 0.25, 0.036, 0.06, 0.1, '#3a2f26', true);
    shingleGable(l, hx, hz, 'x', 1.4, 0.22, 0.226, 0.075, slate, '#9c4a3a');
    // Clock tower with a pyramid roof and a glowing clock face on all four sides.
    const tx = 0.5;
    const tz = 0.82;
    brickBody(l, tx, tz, 0.17, 0.17, 0.226, 0.2, '#8a3f30');
    for (const [dx, dz, w, d] of [
      [0, 0.088, 0.09, 0.006],
      [0, -0.088, 0.09, 0.006],
      [0.088, 0, 0.006, 0.09],
      [-0.088, 0, 0.006, 0.09],
    ] as const)
      wbox(l, ...off(l, tx, tz, dx, dz), 0.3, w, 0.09, d, '#fff2c4', 0, 0, 1);
    brickBody(l, tx, tz, 0.15, 0.15, 0.426, 0.06, '#8a3f30');
    coneRoof(l, tx, tz, 0.486, 0.12, 0.14, slate);
    // Platform, two tracks and the glass-and-iron train shed.
    wbox(l, 0.5, 0.62, 0.03, 1.8, 0.075, 0.2, '#b6ad98');
    railLine(l, 0.02, 0.46, 0.98, 0.46, 0.036, { steel: true });
    railLine(l, 0.02, 0.34, 0.98, 0.34, 0.036, { steel: true });
    l.vaultedCanopy(0.5, 0.4, 0.9, 0.4, 0.11, 0.27);
    for (let i = 0; i <= 6; i++)
      for (const z of [0.2, 0.6])
        wbox(l, 0.05 + i * (0.9 / 6), z, 0.036, 0.03, 0.08 + 0.2, 0.03, '#435556');
    // Steam locomotive and tender on the near track, with a plume.
    const lx = 0.4;
    const lz = 0.34;
    cyl(l, lx, lz, 0.08, 0.05, 0.28, 0, '#1f2528', 14);
    wbox(l, lx, lz, 0.04, 0.34, 0.04, 0.09, '#2c3134');
    wbox(l, ...off(l, lx, lz, -0.16, 0), 0.04, 0.1, 0.09, 0.11, '#1f2528');
    wbox(l, ...off(l, lx, lz, -0.16, 0), 0.14, 0.014, 0.1, 0.12, '#b64c39');
    wround(l, ...off(l, lx, lz, 0.1, 0), 0.016, 0.022, 0.16, 0.07, '#111314', 10);
    smoke(l, ...off(l, lx, lz, 0.1, 0), 0.24, 4);
    wbox(l, ...off(l, lx, lz, 0.18, 0), 0.11, 0.01, 0.01, 0.01, '#ffd27a', 0, 0, 1);
    for (const t of [-0.1, 0, 0.1])
      for (const s of [-1, 1])
        disc(l, ...off(l, lx, lz, t, s * 0.049), 0.036, 0.024, 0.008, '#b64c39');
    wbox(l, ...off(l, lx, lz, -0.33, 0), 0.05, 0.12, 0.11, 0.1, '#1f2528');
    wbox(l, ...off(l, lx, lz, -0.33, 0), 0.17, 0.01, 0.1, 0.09, '#2a2a2c');
    // Passengers, luggage and lamp standards on the platform.
    for (const [x, c] of [
      [0.2, '#5a7a9a'],
      [0.3, '#b0463a'],
      [0.6, '#6a8a5a'],
      [0.7, '#8a5a8a'],
      [0.82, '#c9a83a'],
    ] as const)
      person(l, x, 0.62, 0.105, c, x > 0.5 ? '#3a3a3c' : '#d9c38a');
    for (const x of [0.25, 0.65]) crate(l, x, 0.64, 0.105, '#8a6a48');
    for (const x of [0.12, 0.38, 0.62, 0.88]) lanternPost(l, x, 0.58, 0.15);
    shrub(l, 0.05, 0.93, 0.04);
    shrub(l, 0.95, 0.93, 0.04);
    cypress(l, 0.06, 0.12, 0.3);
    cypress(l, 0.95, 0.12, 0.3);
  },

  // -------------------------------------------------------------------------------------------
  // Airfield
  // -------------------------------------------------------------------------------------------
  airfield(l) {
    site(l, 'airfield', '#7e9a5c', [0.02, 0.02, 0.98, 0.98]);
    l.base('#8aa664', 0.032);
    // Grass runway along x; its centre line sits at z = 0.53 (the flight paths match it).
    wbox(l, 0.5, 0.53, 0.034, 1.78, 0.008, 0.26, '#6f7773');
    for (let i = 0; i < 8; i++)
      wbox(l, 0.12 + i * 0.108, 0.53, 0.042, 0.1, 0.004, 0.012, '#ded8ba');
    for (const x of [0.08, 0.92])
      for (let i = 0; i < 5; i++) wbox(l, x, 0.45 + i * 0.04, 0.042, 0.05, 0.004, 0.014, '#ded8ba');
    // Corrugated half-barrel hangar with open doors.
    const r = 0.17;
    const hx = 0.28;
    const hz = 0.17;
    const arch = new THREE.Shape();
    arch.moveTo(-r, 0);
    arch.absarc(0, 0, r, Math.PI, 0, true);
    arch.lineTo(-r, 0);
    const hull = new THREE.ExtrudeGeometry(arch, { depth: 0.44, bevelEnabled: false });
    hull.translate(0, 0, -0.22);
    hull.rotateY(Math.PI / 2);
    l.shape(hull, '#8b9d94', hx, hz, 0.034);
    for (let i = 0; i < 9; i++) {
      const rib = new THREE.TorusGeometry(r * 1.01, 0.004, 4, 20, Math.PI);
      rib.rotateY(Math.PI / 2);
      l.shape(rib, '#6c7a74', ...off(l, hx, hz, -0.2 + i * 0.05, 0), 0.034);
    }
    wbox(l, ...off(l, hx, hz, 0.222, 0), 0.034, 0.004, 0.13, 0.24, '#1c1e20');
    wbox(l, ...off(l, hx, hz, 0.226, 0), 0.17, 0.004, 0.012, 0.1, '#ffd27a', 0, 0, 1);
    // Control tower on timber legs, with a windsock mast beside the runway.
    tower(l, 0.78, 0.2, 0.46, '#7a5a3a');
    wround(l, 0.08, 0.34, 0.004, 0.006, 0.034, 0.3, '#e8e4d8', 6);
    const sock = new THREE.ConeGeometry(0.026, 0.12, 8, 1, true);
    sock.rotateZ(-Math.PI / 2);
    l.shape(sock, '#e8742a', ...off(l, 0.08, 0.34, 0.05, 0), 0.32);
    // Green biplane parked on the apron.
    const px = 0.62;
    const pz = 0.8;
    const fuse = new THREE.CapsuleGeometry(0.022, 0.12, 4, 10);
    fuse.rotateZ(Math.PI / 2);
    l.shape(fuse, '#3f7a4a', px, pz, 0.09);
    wbox(l, px, pz, 0.12, 0.07, 0.004, 0.26, '#d9d4a8');
    wbox(l, px, pz, 0.068, 0.07, 0.004, 0.26, '#d9d4a8');
    for (const s of [-1, 1]) {
      l.beam(
        p3(off(l, px, pz, 0.02, s * 0.09), 0.07),
        p3(off(l, px, pz, 0.02, s * 0.09), 0.12),
        0.004,
        '#4a3a2a',
      );
      disc(l, ...off(l, px, pz, 0.03, s * 0.03), 0.03, 0.014, 0.004, '#2c2a28');
    }
    wbox(l, ...off(l, px, pz, -0.085, 0), 0.09, 0.05, 0.004, 0.04, '#3f7a4a');
    wbox(l, ...off(l, px, pz, 0.082, 0), 0.07, 0.008, 0.09, 0.012, '#6b4a2a');
    // Fuel drums, tools, crew and a fence along the apron.
    for (let i = 0; i < 4; i++) barrel(l, 0.46 + i * 0.03, 0.9);
    wbox(l, 0.9, 0.78, 0.036, 0.1, 0.04, 0.07, '#8a6a48');
    person(l, 0.55, 0.74, 0.036, '#6a4f36', '#3a2f26');
    person(l, 0.7, 0.9, 0.036, '#4a6a8a');
    person(l, 0.2, 0.66, 0.036, '#b0463a', '#3a3a3c');
    for (let i = 0; i < 14; i++)
      wbox(l, 0.04 + i * 0.068, 0.96, 0.034, 0.008, 0.04, 0.008, '#e3dccb');
    lanternPost(l, 0.46, 0.7, 0.13);
    lanternPost(l, 0.92, 0.68, 0.13);
    cypress(l, 0.94, 0.12, 0.28);
    cypress(l, 0.05, 0.9, 0.26);
  },

  // -------------------------------------------------------------------------------------------
  // Maritime: ferry_pier, fishing_harbor, ice_fishery
  // -------------------------------------------------------------------------------------------
  ferry_pier(l) {
    shore(l, 0.5, 'ferry_pier');
    // Ticket booth with a lit window and a shingle roof, plus waiting benches.
    const hx = 0.28;
    const hz = 0.24;
    boardBody(l, hx, hz, 0.3, 0.22, 0.034, 0.13, '#8a6a48');
    door(l, hx, hz, 0.3, 0.22, '+z', -0.06, 0.034, 0.045, 0.09, timber);
    windows4(l, hx, hz, 0.3, 0.22, 0.09, 0.04, { shutters: '#2f5f6a' });
    shingleGable(l, hx, hz, 'x', 0.3, 0.22, 0.164, 0.075, '#6e5444', '#8a6a48');
    chimney(l, ...off(l, hx, hz, 0.08, -0.05), 0.18, 0.08, '#8f8a80');
    wbox(l, 0.5, 0.2, 0.14, 0.12, 0.05, 0.004, '#f1ece2', 0, 0, 0.6);
    for (const x of [0.68, 0.84]) {
      wbox(l, x, 0.34, 0.07, 0.1, 0.01, 0.034, '#6b4a2a');
      wbox(l, x, 0.325, 0.08, 0.1, 0.034, 0.006, '#6b4a2a');
    }
    // Long jetty running out over the water, with a passenger ferry alongside.
    pier(l, 0.1, 0.72, 0.9, 0.72, 0.1, 0.06, '#9a8867');
    for (const [x, z] of [
      [0.14, 0.64],
      [0.4, 0.64],
      [0.66, 0.64],
      [0.9, 0.64],
    ] as const)
      bollard(l, x, z, 0.068);
    boat(l, 0.52, 0.88, 0, 0.5, '#2f3f5a', { cabin: '#f1ece2', y: 0.026 });
    wbox(l, 0.52, 0.88, 0.17, 0.1, 0.07, 0.07, '#f1ece2');
    wround(l, ...off(l, 0.52, 0.88, 0.02, 0), 0.016, 0.02, 0.24, 0.09, '#b64c39', 10);
    smoke(l, ...off(l, 0.52, 0.88, 0.02, 0), 0.34, 3);
    l.beam([0.4, 0.07, 0.72], [0.4, 0.07, 0.86], 0.003, '#c9b48a');
    l.beam([0.62, 0.07, 0.72], [0.62, 0.07, 0.86], 0.003, '#c9b48a');
    boat(l, 0.12, 0.88, 0.3, 0.16, '#7a5634', { y: 0.026 });
    for (const x of [0.3, 0.56, 0.84]) lanternPost(l, x, 0.7, 0.16);
    person(l, 0.44, 0.7, 0.066, '#5a7a9a', '#3a3a3c');
    person(l, 0.58, 0.72, 0.066, '#b0463a');
    person(l, 0.72, 0.7, 0.066, '#6a8a5a', '#d9c38a');
    crate(l, 0.8, 0.74, 0.066, '#8a6a48');
    crate(l, 0.84, 0.7, 0.066, '#6b4a2a');
    barrel(l, 0.2, 0.7, 0.066);
    cypress(l, 0.92, 0.12, 0.3);
    cypress(l, 0.06, 0.1, 0.26);
    shrub(l, 0.1, 0.44, 0.04);
  },

  fishing_harbor(l) {
    shore(l, 0.46, 'fishing_harbor');
    // Granite quay along the water's edge.
    stoneBody(l, 0.5, 0.47, 1.4, 0.07, 0.034, 0.05, '#9a9484');
    // Net loft and a smoke-house with a chimney.
    const hx = 0.28;
    const hz = 0.2;
    boardBody(l, hx, hz, 0.34, 0.22, 0.034, 0.13, '#7a8a8a');
    door(l, hx, hz, 0.34, 0.22, '+z', -0.07, 0.034, 0.05, 0.09, timber);
    windows4(l, hx, hz, 0.34, 0.22, 0.09, 0.04, { shutters: '#2f5f6a' });
    tinGable(l, hx, hz, 'x', 0.34, 0.22, 0.164, 0.075, '#59636a', '#7a8a8a');
    const sx = 0.74;
    const sz = 0.22;
    stoneBody(l, sx, sz, 0.26, 0.2, 0.034, 0.14, '#8a7a68');
    windows4(l, sx, sz, 0.26, 0.2, 0.09, 0.036);
    shingleGable(l, sx, sz, 'x', 0.26, 0.2, 0.174, 0.07, '#6e5444', '#8a7a68');
    chimney(l, ...off(l, sx, sz, 0.05, -0.04), 0.2, 0.12, '#8f8a80');
    smoke(l, ...off(l, sx, sz, 0.05, -0.04), 0.34, 4);
    // Net drying frames, lobster pots, barrels and fish boxes on the quay.
    netFrame(l, 0.52, 0.36);
    netFrame(l, 0.9, 0.38);
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.06 + (i % 3) * 0.045,
        0.38 + Math.floor(i / 3) * 0.05,
        0.034 + (i > 2 ? 0.035 : 0),
        0.04,
        0.034,
        0.03,
        '#8a6a48',
      );
    for (const [x, z] of [
      [0.62, 0.4],
      [0.7, 0.42],
    ] as const)
      barrel(l, x, z);
    fishBox(l, 0.4, 0.4, 0.034);
    fishBox(l, 0.34, 0.42, 0.034);
    crane(l, 0.24, 0.45, 0.3, 0);
    // Two jetties running out with moored fishing boats.
    pier(l, 0.3, 0.52, 0.3, 0.94, 0.07, 0.06);
    pier(l, 0.76, 0.52, 0.76, 0.94, 0.07, 0.06);
    boat(l, 0.5, 0.76, Math.PI / 2, 0.36, '#2f5f86', { sail: true, cabin: '#f1ece2', y: 0.026 });
    boat(l, 0.14, 0.74, Math.PI / 2, 0.3, '#8a3b2c', { cabin: '#e1d6b8', y: 0.026 });
    boat(l, 0.92, 0.8, -Math.PI / 2, 0.28, '#3f6b3a', { y: 0.026 });
    for (const [x, z] of [
      [0.3, 0.94],
      [0.76, 0.94],
      [0.3, 0.6],
      [0.76, 0.6],
    ] as const)
      bollard(l, x, z, 0.068);
    for (const x of [0.2, 0.52, 0.88]) lanternPost(l, x, 0.54, 0.16);
    person(l, 0.46, 0.44, 0.034, '#2f5f86', '#d9c38a');
    person(l, 0.6, 0.55, 0.066, '#b0463a');
    person(l, 0.36, 0.7, 0.066, '#c9a83a');
    person(l, 0.84, 0.62, 0.066, '#6a8a5a', '#3a3a3c');
    shrub(l, 0.06, 0.1, 0.04);
    cypress(l, 0.94, 0.08, 0.26);
  },

  ice_fishery(l) {
    // Pale ice shelf with a dark rim of open water and snow drifts.
    waterSheet(l, 0.5, 0.5, 0.98, 0.98, 0.022, '#3d6f86');
    wbox(l, 0.5, 0.5, 0.026, 0.9, 0.04, 0.9, '#dbe9ee');
    wbox(l, 0.5, 0.5, 0.066, 0.84, 0.006, 0.84, '#eef5f8');
    for (let i = 0; i < 14; i++)
      wbox(
        l,
        0.1 + rand() * 0.8,
        0.1 + rand() * 0.8,
        0.07,
        0.05 + rand() * 0.07,
        0.01 + rand() * 0.012,
        0.04 + rand() * 0.05,
        '#ffffff',
        rand() * 3,
      );
    // Round fishing hole with an ice-block rim, a rod and a line.
    const hx = 0.62;
    const hz = 0.62;
    wround(l, hx, hz, 0.066, 0.066, 0.068, 0.005, '#1f4a5e', 18);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      wbox(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.07, Math.sin(a) * 0.07),
        0.07,
        0.02,
        0.02,
        0.02,
        '#cfe3ea',
        a,
      );
    }
    l.beam([0.78, 0.07, 0.78], [0.66, 0.16, 0.7], 0.003, '#6b4a2a');
    l.beam([0.66, 0.16, 0.7], [0.63, 0.07, 0.63], 0.0015, '#e8f4f6');
    // Canvas wedge tent with a stovepipe and a glowing doorway.
    const tx = 0.3;
    const tz = 0.34;
    l.shape(new THREE.ConeGeometry(0.2, 0.2, 4), '#b8a77a', tx, tz, 0.17);
    wbox(l, ...off(l, tx, tz, 0, 0.1), 0.07, 0.07, 0.09, 0.004, '#3a2f26');
    wbox(l, ...off(l, tx, tz, 0, 0.1), 0.082, 0.02, 0.004, 0.004, '#ffd27a', 0, 0, 1);
    wround(l, ...off(l, tx, tz, 0.06, -0.04), 0.008, 0.009, 0.2, 0.1, '#2c2a28', 8);
    smoke(l, ...off(l, tx, tz, 0.06, -0.04), 0.31, 3);
    // Plank ice shanty, folding chair, sled and fish laid out on the ice.
    const sx = 0.78;
    const sz = 0.24;
    boardBody(l, sx, sz, 0.2, 0.16, 0.07, 0.1, '#5a6a74');
    door(l, sx, sz, 0.2, 0.16, '+z', 0, 0.07, 0.04, 0.07, '#2c3236');
    windows4(l, sx, sz, 0.2, 0.16, 0.12, 0.032);
    tinGable(l, sx, sz, 'x', 0.2, 0.16, 0.17, 0.05, '#8a5a3a', '#5a6a74');
    wbox(l, 0.5, 0.66, 0.07, 0.05, 0.02, 0.05, '#6a8a5a');
    wbox(l, 0.5, 0.645, 0.09, 0.05, 0.04, 0.006, '#6a8a5a');
    for (const t of [-0.02, 0.02])
      wbox(l, ...off(l, 0.2, 0.74, 0, t), 0.07, 0.14, 0.006, 0.006, '#4a3a2a');
    crate(l, 0.2, 0.74, 0.076, '#8a6a48');
    fishBox(l, 0.4, 0.78, 0.07);
    fishBox(l, 0.46, 0.82, 0.07);
    for (let i = 0; i < 3; i++)
      wbox(
        l,
        0.54 + i * 0.03,
        0.8 + (i % 2) * 0.02,
        0.072,
        0.034,
        0.006,
        0.012,
        '#9ab4c0',
        i * 0.7,
      );
    barrel(l, 0.88, 0.5, 0.07);
    person(l, 0.58, 0.72, 0.07, '#b0463a', '#3a3a3c');
    person(l, 0.42, 0.52, 0.07, '#2f5f86', '#d9c38a');
    lanternPost(l, 0.14, 0.5, 0.16);
    cypress(l, 0.08, 0.12, 0.24);
    cypress(l, 0.92, 0.9, 0.22);
  },
};
