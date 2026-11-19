import * as THREE from 'three';
import {
  barrel,
  boardBody,
  crate,
  cypress,
  door,
  lanternPost,
  off,
  rand,
  shingleGable,
  stoneBody,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import {
  birds,
  butterflies,
  cat,
  cobbles,
  cornice,
  downpipe,
  flowerRow,
  gauge,
  gear,
  bench,
  ladder,
  pipe,
  pt,
  rainButt,
  steps,
  tank,
} from './dioramaDetails';
import { coneRoof, crane, smoke, truck, waterSheet } from './dioramaProps';
import { site } from './industryDiorama';
import { cyl, disc, logPile, p3, wheelbarrow } from './forestryTransitDiorama';
import { blockStack, brickBody, railLine, wagon, windows4, workers } from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 3A, light industry drawn as dioramas on 2x2 lots (see `zoomed` in architectureModels.ts):
//   smelter    -> bellows_smelter -> reverberatory_furnace -> blast_furnace -> bessemer_converter
//              -> electric_arc_smelter -> metallurgical_spire
//   workshop   -> guild_workshop -> waterwheel_workshop -> steam_manufactory -> precision_manufactory
//              -> grand_artificery

const slate = '#4d5a66';
const timber = '#5c3f27';
const plank = '#8a6142';
const hot = '#ff8a2a';
const iron = '#2c3134';
const steel = '#7a8a92';
const stone = '#8f8a80';

/** Brick chimney stack, tapering, with a dark cap and smoke. */
function stack(
  l: Lot,
  x: number,
  z: number,
  y: number,
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
      y + i * 0.0125,
      0.0125,
      tone(color, 0.2),
      12,
    );
  wround(l, x, z, r * 0.9, r * 0.74, y + h, 0.012, iron, 12);
  if (fume) smoke(l, x, z, y + h + 0.01, fume);
}

/** Glowing molten metal: a short emissive disc. */
function melt(l: Lot, x: number, z: number, y: number, r: number): void {
  l.shape(new THREE.CylinderGeometry(r, r, 0.006, 14), '#ff9a3a', x, z, y, 1);
}

/** Glowing opening (furnace mouth) on a +z wall. */
function mouth(l: Lot, x: number, z: number, y: number, w: number, h: number): void {
  wbox(l, x, z, y, w + 0.012, h + 0.008, 0.008, iron);
  wbox(l, x, z, y + 0.004, w, h, 0.012, hot, 0, 0, 1);
}

/** Iron bands round a round tower. */
function bands(l: Lot, x: number, z: number, y: number, h: number, r: number, n: number): void {
  for (let i = 0; i < n; i++)
    wround(l, x, z, r * 1.03, r * 1.03, y + (i + 0.5) * (h / n), 0.007, iron, 16);
}

/** Heap of dark charcoal or ore built from tilted blocks. */
function heap(l: Lot, x: number, z: number, r: number, color: string, h = 0.06): void {
  l.shape(new THREE.ConeGeometry(r, h, 8), tone(color, 0.15), x, z, 0.034 + h / 2);
  for (let i = 0; i < 6; i++)
    wbox(
      l,
      x + ((rand() - 0.5) * (r * 1.6)) / l.spanX,
      z + ((rand() - 0.5) * (r * 1.6)) / l.spanZ,
      0.036,
      0.016,
      0.01,
      0.014,
      tone(color, 0.3),
      rand() * 3,
    );
}

/** Hand-pumped bellows: two wedge boards with a leather fold and a nozzle towards +x. */
function bellows(l: Lot, x: number, z: number, y: number, ry = 0): void {
  wbox(l, x, z, y, 0.1, 0.008, 0.05, '#6b4a2a', ry);
  wbox(l, x, z, y + 0.026, 0.1, 0.008, 0.05, '#7a5a3a', ry, 0.18);
  wbox(l, x, z, y + 0.008, 0.09, 0.02, 0.046, '#5a3a22', ry);
  l.beam(pt(off(l, x, z, 0.05, 0), y + 0.012), pt(off(l, x, z, 0.12, 0), y + 0.02), 0.006, iron);
  l.beam(
    pt(off(l, x, z, -0.04, 0), y + 0.03),
    pt(off(l, x, z, -0.1, 0), y + 0.09),
    0.004,
    '#6b4a2a',
  );
}

/** Anvil on a stump with a glowing workpiece. */
function anvil(l: Lot, x: number, z: number, y = 0.034): void {
  wround(l, x, z, 0.02, 0.024, y, 0.04, '#7a5a3a', 8);
  wbox(l, x, z, y + 0.04, 0.05, 0.012, 0.022, '#2c3134');
  wbox(l, ...off(l, x, z, 0.03, 0), y + 0.044, 0.018, 0.008, 0.01, '#2c3134');
  wbox(l, ...off(l, x, z, -0.008, 0), y + 0.052, 0.022, 0.004, 0.008, hot, 0.3, 0, 1);
}

/** Ingot stack of pig iron bars. */
function ingots(l: Lot, x: number, z: number, y: number, n: number, ry = 0): void {
  for (let r = 0; r < n; r++)
    for (let i = 0; i < n - r; i++) {
      const t = (i - (n - r - 1) / 2) * 0.026;
      wbox(
        l,
        ...off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t),
        y + r * 0.012,
        0.024,
        0.01,
        0.014,
        tone('#6a7078', 0.15),
        ry,
      );
    }
}

/** Small lattice pylon with two cross-arms. */
function pylon(l: Lot, x: number, z: number, h: number): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    l.beam(
      [x + (a * 0.02) / l.spanX, 0.034, z + (b * 0.02) / l.spanZ],
      [x + (a * 0.005) / l.spanX, 0.034 + h, z + (b * 0.005) / l.spanZ],
      0.004,
      '#8a9298',
    );
  for (const k of [0.6, 0.85]) {
    wbox(l, x, z, 0.034 + h * k, 0.1, 0.005, 0.005, '#6e777b', Math.PI / 2);
    for (const s of [-1, 1])
      wround(
        l,
        ...off(l, x, z, 0, s * 0.045),
        0.005,
        0.005,
        0.034 + h * k - 0.022,
        0.022,
        '#cfe6ee',
        8,
      );
  }
}

/** Wooden picket / post-and-rail fence along x. */
function railing(l: Lot, x0: number, x1: number, z: number, y = 0.034, color = '#6b4a2a'): void {
  const n = Math.max(2, Math.round(((x1 - x0) * l.spanX) / 0.06));
  for (let i = 0; i <= n; i++) wbox(l, x0 + ((x1 - x0) * i) / n, z, y, 0.006, 0.04, 0.006, color);
  wbox(l, (x0 + x1) / 2, z, y + 0.03, (x1 - x0) * l.spanX, 0.005, 0.006, color);
  wbox(l, (x0 + x1) / 2, z, y + 0.016, (x1 - x0) * l.spanX, 0.005, 0.006, color);
}

/** Spoked iron flywheel standing in the plane facing +z, bottom at y. */
function flywheel(l: Lot, x: number, z: number, y: number, r: number): void {
  l.shape(new THREE.TorusGeometry(r, 0.008, 6, 22), '#26292b', x, z, y + r);
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.BoxGeometry(0.006, r * 2, 0.006);
    sp.rotateZ((i / 6) * Math.PI);
    l.shape(sp, '#3a3f42', x, z, y + r);
  }
  l.shape(
    new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10).rotateX(Math.PI / 2),
    '#1b1d1f',
    x,
    z,
    y + r,
  );
}

/** Low barrel vault: a squashed half-cylinder along x whose base sits at height y. */
function vault(
  l: Lot,
  x: number,
  z: number,
  y: number,
  len: number,
  r: number,
  h: number,
  color: string,
): void {
  const g = new THREE.CylinderGeometry(r, r, len, 18);
  g.rotateZ(Math.PI / 2);
  g.scale(1, h / r, 1);
  l.shape(g, color, x, z, y);
}

// ---------------------------------------------------------------------------------------------

export const lightIndustryDiorama: Recipes = {
  // -------------------------------------------------------------------------------------------
  // Smelting: smelter -> bellows_smelter -> reverberatory_furnace -> blast_furnace
  //           -> bessemer_converter -> electric_arc_smelter -> metallurgical_spire
  // -------------------------------------------------------------------------------------------
  smelter(l) {
    site(l, 'smelter', '#6a5f52', [0.06, 0.06, 0.94, 0.94]);
    const fx = 0.4;
    const fz = 0.36;
    // Beehive bloomery of stacked stone rings with a glowing mouth and a clay chimney.
    for (let i = 0; i < 6; i++)
      wround(
        l,
        fx,
        fz,
        0.1 - i * 0.012,
        0.11 - i * 0.012,
        0.034 + i * 0.022,
        0.022,
        tone(stone, 0.2),
        14,
      );
    wround(l, fx, fz, 0.03, 0.034, 0.166, 0.03, '#7a5a48', 10);
    smoke(l, fx, fz, 0.2, 4);
    mouth(l, ...off(l, fx, fz, 0, 0.108), 0.04, 0.034, 0.05);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, fx, fz, Math.cos(a) * 0.1, Math.sin(a) * 0.1),
        0.034 + (i % 2) * 0.01,
        0.014,
        0.016,
        0.014,
        tone(stone, 0.2),
        a,
      );
    }
    // Plank windbreak wall behind the furnace with posts and a rail for hanging tools.
    for (const a of [-1, 0, 1])
      wround(l, ...off(l, fx, fz, a * 0.17, -0.15), 0.006, 0.006, 0.034, 0.17, timber, 6);
    wbox(l, ...off(l, fx, fz, 0, -0.15), 0.034, 0.36, 0.13, 0.012, plank);
    wbox(l, ...off(l, fx, fz, 0, -0.15), 0.168, 0.38, 0.008, 0.016, timber);
    bellows(l, ...off(l, fx, fz, -0.17, 0.02), 0.034);
    anvil(l, ...off(l, fx, fz, 0.17, 0.1));
    // Charcoal clamp, ore heap and slag.
    heap(l, 0.76, 0.28, 0.1, '#2a2826', 0.09);
    smoke(l, 0.76, 0.28, 0.12, 2);
    heap(l, 0.8, 0.62, 0.07, '#8a4a34', 0.06);
    heap(l, 0.18, 0.7, 0.05, '#4a4a48', 0.04);
    for (let i = 0; i < 5; i++)
      wbox(
        l,
        0.56 + i * 0.012,
        0.62 + (i % 2) * 0.01,
        0.034 + i * 0.006,
        0.05,
        0.006,
        0.03,
        tone('#5a5a5c', 0.2),
        i,
      );
    // Wood stack, water trough, sacks and tools.
    logPile(l, 0.16, 0.2, Math.PI / 2, 3, 0.12);
    wbox(l, 0.6, 0.5, 0.034, 0.1, 0.03, 0.04, '#6b4a2a');
    wbox(l, 0.6, 0.5, 0.058, 0.09, 0.004, 0.032, '#5a93ad');
    for (let i = 0; i < 3; i++)
      l.shape(
        new THREE.SphereGeometry(0.02, 7, 6),
        '#cfc3a2',
        ...off(l, 0.4, 0.66, i * 0.034, 0),
        0.05,
      );
    barrel(l, 0.34, 0.76);
    wheelbarrow(l, 0.68, 0.74, 0.5, '#2a2826');
    railing(l, 0.06, 0.94, 0.95);
    cypress(l, 0.08, 0.1, 0.24);
    cypress(l, 0.93, 0.1, 0.22);
    cat(l, 0.5, 0.58, 0.034, '#3a3a3c');
    birds(l, [
      [0.7, 0.9, 0.036],
      [0.74, 0.88, 0.036],
      [0.3, 0.95, 0.07],
    ]);
    workers(l, [
      [0.5, 0.5, '#8a4a3a', '#3a3a3c'],
      [0.3, 0.56, '#6a6a70', '#d9c38a'],
      [0.64, 0.66, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.5, 0.15);
  },

  bellows_smelter(l) {
    site(l, 'bellows_smelter', '#655a4e', [0.06, 0.06, 0.94, 0.94]);
    const fx = 0.42;
    const fz = 0.34;
    // Brick shaft furnace with a stone footing, an arched tap hole and a tall stack.
    wbox(l, fx, fz, 0.034, 0.26, 0.03, 0.22, '#8f8a80');
    brickBody(l, fx, fz, 0.2, 0.18, 0.064, 0.14, '#9a4a35');
    for (let i = 0; i < 4; i++)
      wround(
        l,
        ...off(l, fx, fz, 0.05, 0),
        0.04 - i * 0.004,
        0.05 - i * 0.004,
        0.204 + i * 0.02,
        0.02,
        '#8a4430',
        12,
      );
    mouth(l, ...off(l, fx, fz, -0.04, 0.092), 0.05, 0.05, 0.062);
    wbox(l, ...off(l, fx, fz, 0.05, 0.092), 0.07, 0.036, 0.034, 0.008, iron);
    stack(l, ...off(l, fx, fz, 0.05, -0.02), 0.28, 0.04, 0.026, '#9c5640', 5);
    for (const y of [0.1, 0.17]) wbox(l, fx, fz, y, 0.22, 0.008, 0.2, iron);
    // Shed roof over the casting floor.
    for (const [a, b] of [
      [-1, 1],
      [1, 1],
    ] as const)
      wround(l, ...off(l, fx, fz, a * 0.17, b * 0.21), 0.007, 0.007, 0.034, 0.17, timber, 6);
    wbox(l, ...off(l, fx, fz, 0, 0.2), 0.2, 0.38, 0.01, 0.1, '#59636a', 0, 0.2);
    // Great bellows worked by a waterwheel: leather bellows, cam shaft, wheel and leat.
    wbox(l, 0.14, 0.3, 0.034, 0.14, 0.03, 0.08, '#5a3a22');
    wbox(l, 0.14, 0.3, 0.064, 0.14, 0.012, 0.08, '#7a5a3a', 0, 0.16);
    for (let i = 0; i < 5; i++)
      wbox(l, 0.14, 0.3, 0.07 + i * 0.01, 0.12 - i * 0.008, 0.006, 0.07, '#8a6a48');
    l.beam([0.2, 0.08, 0.3], [0.32, 0.1, 0.34], 0.01, iron);
    wbox(l, 0.1, 0.62, 0.034, 0.16, 0.012, 0.08, '#5a93ad');
    const wheel = new THREE.TorusGeometry(0.07, 0.008, 5, 18);
    wheel.rotateY(Math.PI / 2);
    l.shape(wheel, '#6b4a2a', 0.1, 0.62, 0.104);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.1, 0.62, 0, Math.cos(a) * 0.07),
        0.104 + Math.sin(a) * 0.07,
        0.02,
        0.016,
        0.02,
        '#8a6a48',
        0,
        a,
      );
    }
    l.beam([0.1, 0.104, 0.62], [0.14, 0.09, 0.34], 0.005, '#4a3a2a');
    // Ore bins, charcoal shed, slag mound and pig-iron sows cooling in sand moulds.
    for (let i = 0; i < 3; i++) {
      wbox(l, 0.7 + i * 0.1, 0.22, 0.034, 0.08, 0.05, 0.08, '#6b4a2a');
      l.shape(
        new THREE.ConeGeometry(0.036, 0.03, 6),
        i === 1 ? '#2a2826' : '#8a4a34',
        0.7 + i * 0.1,
        0.22,
        0.09,
      );
    }
    heap(l, 0.82, 0.48, 0.08, '#4a4a48', 0.06);
    for (let i = 0; i < 4; i++)
      wbox(l, 0.4 + i * 0.07, 0.66, 0.036, 0.05, 0.01, 0.014, hot, 0, 0, i % 2 ? 1 : 0);
    wbox(l, 0.5, 0.66, 0.034, 0.3, 0.008, 0.04, '#4a3f36');
    ingots(l, 0.64, 0.82, 0.034, 3);
    wagon(l, 0.3, 0.9, 0, '#2a2826', 0.042, '#5a4a3a');
    railLine(l, 0.04, 0.9, 0.7, 0.9, 0.034, { steel: false });
    rainButt(l, 0.26, 0.14);
    barrel(l, 0.9, 0.7);
    railing(l, 0.06, 0.94, 0.97);
    cat(l, 0.2, 0.46, 0.034);
    birds(l, [
      [0.78, 0.74, 0.036],
      [0.82, 0.76, 0.036],
    ]);
    workers(l, [
      [0.44, 0.52, '#8a4a3a', '#3a3a3c'],
      [0.56, 0.74, '#6a6a70', '#3a3a3c'],
      [0.24, 0.52, '#5a7a9a', '#d9c38a'],
    ]);
    lanternPost(l, 0.9, 0.9, 0.16);
    cypress(l, 0.07, 0.88, 0.22);
  },

  reverberatory_furnace(l) {
    site(l, 'reverberatory_furnace', '#605850', [0.05, 0.06, 0.95, 0.94]);
    const fx = 0.44;
    const fz = 0.38;
    // Long brick furnace with a low vaulted crown, three firing doors and iron buckstays.
    wbox(l, fx, fz, 0.034, 0.56, 0.02, 0.28, '#8f8a80');
    brickBody(l, fx, fz, 0.52, 0.24, 0.054, 0.1, '#9a4a35');
    vault(l, fx, fz, 0.154, 0.52, 0.125, 0.06, '#8a4430');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, fx, fz, -0.22 + i * 0.088, 0), 0.054, 0.012, 0.1, 0.26, iron);
    for (const t of [-0.17, 0, 0.17]) {
      mouth(l, ...off(l, fx, fz, t, 0.124), 0.07, 0.044, 0.05);
      wbox(l, ...off(l, fx, fz, t, 0.136), 0.1, 0.07, 0.01, 0.01, iron);
      wbox(l, ...off(l, fx, fz, t, 0.16), 0.054, 0.1, 0.004, 0.004, '#6a6a70');
    }
    // Flue duct to the tall banded stack, with a damper and an iron-plate base.
    wbox(l, ...off(l, fx, fz, 0.3, -0.04), 0.07, 0.1, 0.07, 0.07, '#8a4430');
    stack(l, ...off(l, fx, fz, 0.34, -0.06), 0.1, 0.26, 0.04, '#9c5640', 5);
    for (const y of [0.16, 0.22, 0.3])
      wround(l, ...off(l, fx, fz, 0.34, -0.06), 0.037, 0.037, y, 0.008, iron, 12);
    // Plank shed over the puddlers' floor, rods and rakes leaning on a rack.
    for (const x of [-0.24, 0.0, 0.24])
      wround(l, ...off(l, fx, fz, x, 0.24), 0.006, 0.006, 0.034, 0.15, timber, 6);
    wbox(l, ...off(l, fx, fz, 0, 0.21), 0.19, 0.58, 0.01, 0.12, '#59636a', 0, 0.14);
    for (let i = 0; i < 4; i++)
      l.beam(
        p3(off(l, 0.8, 0.4, 0, i * 0.012), 0.034),
        p3(off(l, 0.8, 0.4, 0.01, i * 0.012), 0.14),
        0.004,
        '#6a6a70',
      );
    // Coal heap and a rail wagon, puddled balls, shingling hammer and pig iron.
    heap(l, 0.16, 0.76, 0.1, '#1f1f1f', 0.08);
    railLine(l, 0.04, 0.9, 0.96, 0.9, 0.034, { steel: true });
    wagon(l, 0.3, 0.9, 0, '#1f1f1f', 0.042, '#5a4a3a');
    wagon(l, 0.5, 0.9, 0, '#8a4a34', 0.042, '#5a4a3a');
    ingots(l, 0.78, 0.7, 0.034, 4);
    ingots(l, 0.86, 0.6, 0.034, 3, 0.3);
    for (let i = 0; i < 3; i++)
      l.shape(
        new THREE.SphereGeometry(0.02, 7, 6),
        '#ff8a2a',
        ...off(l, 0.64, 0.68, i * 0.04, 0),
        0.05,
        1,
      );
    wbox(l, 0.64, 0.68, 0.034, 0.16, 0.014, 0.05, '#2c3134');
    crate(l, 0.9, 0.82, 0.034, '#6b4a2a');
    barrel(l, 0.62, 0.8);
    rainButt(l, 0.12, 0.2);
    pylon(l, 0.92, 0.2, 0.3);
    birds(l, [
      [0.7, 0.9, 0.04],
      [0.74, 0.9, 0.04],
      [0.3, 0.94, 0.04],
    ]);
    cat(l, 0.3, 0.66, 0.034, '#3a3a3c');
    workers(l, [
      [0.36, 0.62, '#8a4a3a', '#3a3a3c'],
      [0.52, 0.62, '#5a7a9a', '#3a3a3c'],
      [0.7, 0.8, '#6a8a5a', '#d9c38a'],
      [0.2, 0.6, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.16);
    lanternPost(l, 0.94, 0.5, 0.16);
  },

  blast_furnace(l) {
    site(l, 'blast_furnace', '#5a544e', [0.05, 0.06, 0.95, 0.94]);
    const fx = 0.4;
    const fz = 0.34;
    // Tapering stone-and-brick stack with iron hoops, a bell hopper and a gas take-off.
    wbox(l, fx, fz, 0.034, 0.3, 0.03, 0.3, '#8f8a80');
    const rows = 16;
    for (let i = 0; i < rows; i++) {
      const t = i / rows;
      const r =
        0.075 +
        0.045 * Math.sin(Math.min(1, t * 1.3 + 0.1) * Math.PI) * (1 - t * 0.5) +
        0.02 * (1 - t);
      wround(
        l,
        fx,
        fz,
        r - 0.004,
        r,
        0.064 + i * 0.022,
        0.024,
        tone(i < 6 ? '#8a4430' : '#9a4a35', 0.15),
        18,
      );
    }
    bands(l, fx, fz, 0.064, 0.31, 0.1, 7);
    wround(l, fx, fz, 0.05, 0.07, 0.374, 0.03, iron, 14);
    l.dome(fx, fz, 0.044, 0.044, 0.404, 0.04, '#3a3f42');
    smoke(l, fx, fz, 0.45, 3);
    // Casting house at the base: open arch, glowing tap hole and runner, ladle and pig beds.
    wbox(l, ...off(l, fx, fz, 0, 0.14), 0.034, 0.34, 0.1, 0.16, '#6e6a66');
    wbox(l, ...off(l, fx, fz, 0, 0.14), 0.134, 0.36, 0.01, 0.17, '#59636a');
    wbox(l, ...off(l, fx, fz, 0, 0.1), 0.05, 0.09, 0.08, 0.01, hot, 0, 0, 1);
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        ...off(l, fx, fz, -0.12 + i * 0.048, 0.19),
        0.036,
        0.034,
        0.008,
        0.044,
        i % 2 ? hot : '#2c2c2e',
        0,
        0,
        i % 2 ? 1 : 0,
      );
    // Charging bridge: an inclined skip railway with a loaded ore car and a hoist house.
    l.beam([0.4, 0.38, 0.36], [0.82, 0.05, 0.78], 0.012, '#6a6a70');
    l.beam([0.42, 0.4, 0.36], [0.84, 0.07, 0.78], 0.012, '#6a6a70');
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      l.beam(
        [0.41 + 0.42 * t, 0.39 - 0.33 * t, 0.36 + 0.42 * t],
        [0.41 + 0.42 * t, 0.034, 0.36 + 0.42 * t],
        0.006,
        iron,
      );
    }
    wbox(l, 0.61, 0.57, 0.2, 0.06, 0.03, 0.04, '#5a4a3a', 0, 0.5);
    boardBody(l, 0.86, 0.84, 0.16, 0.12, 0.034, 0.08, '#5a4a3a');
    // Two hot-blast stoves (brick cylinders with domed tops) and the blast main.
    for (const [x, z] of [
      [0.72, 0.24],
      [0.84, 0.36],
    ] as const) {
      wround(l, x, z, 0.05, 0.05, 0.034, 0.26, '#9a4a35', 16);
      bands(l, x, z, 0.034, 0.26, 0.05, 5);
      l.dome(x, z, 0.05, 0.05, 0.294, 0.05, '#7a3a2a');
      pipe(l, pt([x, z], 0.2), pt([fx + 0.06 / l.spanX, fz], 0.2), 0.008, '#3a3f42');
    }
    stack(l, 0.78, 0.14, 0.034, 0.34, 0.03, '#9c5640', 4);
    ladder(l, 0.7, 0.3, 0.07, 0.2, '+z');
    // Slag ladle car on rails, coke heap, pylon, crew.
    railLine(l, 0.04, 0.9, 0.7, 0.9, 0.034, { steel: true });
    wagon(l, 0.3, 0.9, 0, '#8a4a34', 0.042, '#5a4a3a');
    wagon(l, 0.5, 0.9, 0, hot, 0.042, '#5a4a3a');
    heap(l, 0.14, 0.7, 0.1, '#2a2826', 0.08);
    heap(l, 0.2, 0.84, 0.06, '#8a4a34', 0.05);
    barrel(l, 0.6, 0.74);
    pylon(l, 0.94, 0.7, 0.3);
    birds(l, [
      [0.3, 0.94, 0.04],
      [0.34, 0.94, 0.04],
    ]);
    workers(l, [
      [0.4, 0.58, '#8a4a3a', '#3a3a3c'],
      [0.28, 0.6, '#6a6a70', '#3a3a3c'],
      [0.56, 0.66, '#5a7a9a', '#d9c38a'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.17);
    lanternPost(l, 0.5, 0.62, 0.17);
  },

  bessemer_converter(l) {
    site(l, 'bessemer_converter', '#57524c', [0.05, 0.06, 0.95, 0.94]);
    const hx = 0.44;
    const hz = 0.36;
    // Steel-framed converter hall: brick walls, high-bay windows and a monitor roof.
    brickBody(l, hx, hz, 0.58, 0.3, 0.034, 0.2, '#8a4a38');
    windows4(l, hx, hz, 0.58, 0.3, 0.12, 0.05, { frame: '#d8dde0' });
    tinGable(l, hx, hz, 'x', 0.58, 0.3, 0.234, 0.1, slate, '#8a4a38');
    for (let i = 0; i < 7; i++)
      wbox(l, ...off(l, hx, hz, -0.26 + i * 0.087, 0), 0.34, 0.01, 0.015, 0.3, '#3a4a52');
    wbox(l, hx, hz, 0.332, 0.5, 0.036, 0.07, '#cfe6ee', 0, 0, 0.4);
    door(l, hx, hz, 0.58, 0.3, '+z', 0.14, 0.034, 0.1, 0.13, '#2a2a2c');
    // Two pear-shaped converters on trunnion stands in front, one blowing flame, one pouring.
    for (const [i, x] of [
      [0, 0.28],
      [1, 0.5],
    ] as const) {
      const z = 0.72;
      for (const s of [-1, 1]) {
        wbox(l, ...off(l, x, z, s * 0.07, 0), 0.034, 0.02, 0.1, 0.03, '#3a4a52');
        wbox(l, ...off(l, x, z, s * 0.07, 0), 0.134, 0.03, 0.01, 0.04, '#3a4a52');
      }
      const pear = new THREE.LatheGeometry(
        [
          [0.0, 0.0],
          [0.05, 0.0],
          [0.07, 0.04],
          [0.066, 0.09],
          [0.04, 0.13],
          [0.03, 0.17],
          [0.034, 0.19],
          [0.0, 0.19],
        ].map(([rx, y]) => new THREE.Vector2(rx!, y!)),
        18,
      );
      pear.rotateZ(i === 0 ? 0 : 0.9);
      l.shape(pear, '#6a6a70', x, z, 0.1);
      cyl(l, x, z, 0.16, 0.01, 0.18, 0, '#3a3f42', 8);
      if (i === 0) {
        l.shape(new THREE.ConeGeometry(0.03, 0.1, 6), '#ffb24a', x, z, 0.32, 1);
        l.shape(new THREE.ConeGeometry(0.018, 0.12, 6), '#fff0b0', x, z, 0.34, 1);
      } else {
        l.beam(
          [x + 0.04 / l.spanX, 0.22, z],
          [x + 0.1 / l.spanX, 0.11, z + 0.02 / l.spanZ],
          0.012,
          hot,
        );
        wround(l, ...off(l, x, z, 0.12, 0.02), 0.026, 0.02, 0.034, 0.05, '#4a4f54', 10);
        melt(l, ...off(l, x, z, 0.12, 0.02), 0.075, 0.022);
      }
    }
    // Overhead gantry crane and the blower-engine house with its brick stack.
    for (const x of [0.12, 0.7]) l.beam([x, 0.034, 0.56], [x, 0.3, 0.56], 0.008, '#7a8a92');
    wbox(l, 0.41, 0.56, 0.3, 0.6, 0.014, 0.02, '#b64c39');
    wbox(l, 0.5, 0.56, 0.28, 0.06, 0.03, 0.04, '#6a2a22');
    boardBody(l, 0.84, 0.3, 0.16, 0.16, 0.034, 0.12, '#7a5a3a');
    stack(l, 0.86, 0.18, 0.034, 0.56, 0.03, '#9c5640', 4);
    // Ingot moulds on a bogie, flux heap, scrap and tool crates, rail and pylon.
    for (let i = 0; i < 6; i++) wbox(l, 0.14 + i * 0.05, 0.9, 0.04, 0.034, 0.05, 0.034, '#2c2c2e');
    railLine(l, 0.04, 0.9, 0.96, 0.9, 0.034, { steel: true });
    heap(l, 0.9, 0.7, 0.08, '#cfc9b9', 0.05);
    heap(l, 0.12, 0.7, 0.06, '#6a5a52', 0.05);
    crate(l, 0.62, 0.84, 0.034, '#6b4a2a');
    pylon(l, 0.94, 0.5, 0.3);
    birds(l, [
      [0.64, 0.9, 0.04],
      [0.68, 0.9, 0.04],
      [0.5, 0.2, 0.236],
    ]);
    workers(l, [
      [0.38, 0.8, '#8a4a3a', '#3a3a3c'],
      [0.6, 0.66, '#6a6a70', '#3a3a3c'],
      [0.18, 0.78, '#5a7a9a', '#d9c38a'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.17);
    lanternPost(l, 0.74, 0.78, 0.17);
  },

  electric_arc_smelter(l) {
    site(l, 'electric_arc_smelter', '#6a6e70', [0.05, 0.06, 0.95, 0.94]);
    const fx = 0.4;
    const fz = 0.36;
    // Steel-clad furnace hall with the roof opened up around the shell.
    boardBody(l, fx, fz, 0.5, 0.32, 0.034, 0.18, '#9aa4a8');
    windows4(l, fx, fz, 0.5, 0.32, 0.12, 0.044, { frame: '#d8dde0' });
    for (let i = 0; i < 9; i++)
      wbox(l, ...off(l, fx, fz, -0.22 + i * 0.055, 0.162), 0.034, 0.006, 0.18, 0.004, '#7a8a92');
    tinGable(l, fx, fz, 'x', 0.5, 0.32, 0.214, 0.08, '#7a8a92', '#9aa4a8');
    // Furnace shell, domed roof ring and three graphite electrodes on a gantry.
    wround(l, fx, fz, 0.1, 0.1, 0.1, 0.14, '#4a4f54', 18);
    wround(l, fx, fz, 0.106, 0.106, 0.2, 0.01, '#6a6a70', 18);
    melt(l, fx, fz, 0.236, 0.08);
    for (const t of [-1, 0, 1]) {
      const [ex, ez] = off(l, fx, fz, t * 0.05, 0);
      wround(l, ex, ez, 0.01, 0.01, 0.12, 0.5, '#2c2a28', 8);
      wround(l, ex, ez, 0.013, 0.013, 0.5, 0.01, '#b0463a', 8);
    }
    wbox(l, fx, fz, 0.64, 0.2, 0.014, 0.05, '#b64c39');
    smoke(l, fx, fz, 0.7, 4);
    for (const s of [-1, 1])
      l.beam(
        [fx + (s * 0.1) / l.spanX, 0.3, fz],
        [fx + (s * 0.1) / l.spanX, 0.64, fz],
        0.008,
        steel,
      );
    // Transformer yard: finned tank, bushings and cable run to a pylon.
    wbox(l, 0.82, 0.3, 0.034, 0.12, 0.1, 0.09, '#6a7a84');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, 0.82, 0.3, 0.07, -0.032 + i * 0.016), 0.04, 0.012, 0.07, 0.004, '#4a5a64');
    for (const t of [-0.03, 0, 0.03])
      wround(l, ...off(l, 0.82, 0.3, t, 0), 0.006, 0.008, 0.134, 0.05, '#cfe6ee', 8);
    pylon(l, 0.92, 0.5, 0.34);
    l.beam([0.82, 0.19, 0.3], [0.92, 0.34, 0.5], 0.002, '#1c1c1c');
    // Fume extraction: big duct to a baghouse of filter cells and a short stack.
    pipe(l, pt([fx, fz], 0.34), pt([0.7, 0.14], 0.34), 0.016, '#9aa4a8');
    for (let i = 0; i < 4; i++) wbox(l, 0.62 + i * 0.07, 0.14, 0.034, 0.06, 0.26, 0.1, '#b9b6ae');
    wround(l, 0.9, 0.14, 0.02, 0.026, 0.034, 0.3, '#9aa4a8', 12);
    smoke(l, 0.9, 0.14, 0.34, 3);
    // Scrap yard with a magnet crane, scrap bales, trucks and a control cabin.
    crane(l, 0.22, 0.74, 0.3, 0);
    for (let i = 0; i < 6; i++)
      wbox(
        l,
        0.1 + (i % 3) * 0.05,
        0.84 + Math.floor(i / 3) * 0.04,
        0.034,
        0.04,
        0.03,
        0.03,
        tone('#6a5a52', 0.3),
        i,
      );
    blockStack(l, 0.7, 0.78, 0.034, 3, 1, 2, '#9a8a7a', 0.036);
    truck(l, 0.5, 0.84, 0, '#3f6b8a');
    boardBody(l, 0.8, 0.7, 0.14, 0.1, 0.034, 0.08, '#e8e4d8');
    wbox(l, ...off(l, 0.8, 0.7, 0, 0.052), 0.07, 0.07, 0.03, 0.004, '#bfe0e6', 0, 0, 0.6);
    birds(l, [
      [0.5, 0.2, 0.216],
      [0.72, 0.9, 0.036],
    ]);
    workers(l, [
      [0.56, 0.62, '#e8742a', '#f2cf4a'],
      [0.3, 0.62, '#e8742a', '#f2cf4a'],
      [0.64, 0.7, '#5a7a9a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.17);
    lanternPost(l, 0.94, 0.9, 0.17);
    cypress(l, 0.07, 0.9, 0.22);
  },

  metallurgical_spire(l) {
    site(l, 'metallurgical_spire', '#5e6366', [0.04, 0.05, 0.96, 0.95]);
    const cx = 0.5;
    const cz = 0.4;
    // Stepped spire: stacked reactor shells with glowing seams, rising to a beacon.
    const shells: [number, number, string][] = [
      [0.15, 0.13, '#6a6a70'],
      [0.12, 0.13, '#7a8a92'],
      [0.095, 0.13, '#6a6a70'],
      [0.07, 0.13, '#8a9aa2'],
      [0.05, 0.13, '#6a6a70'],
      [0.034, 0.13, '#9aa4a8'],
    ];
    let y = 0.034;
    for (const [r, h, c] of shells) {
      wround(l, cx, cz, r, r * 1.04, y, h, c, 20);
      wround(l, cx, cz, r * 1.03, r * 1.03, y + h - 0.01, 0.012, hot, 20);
      l.shape(
        new THREE.TorusGeometry(r * 1.04, 0.004, 4, 24).rotateX(Math.PI / 2),
        '#2c3134',
        cx,
        cz,
        y + 0.02,
      );
      y += h;
    }
    wround(l, cx, cz, 0.006, 0.016, y, 0.07, '#cfd6d9', 8);
    l.shape(new THREE.SphereGeometry(0.014, 8, 6), '#ffd27a', cx, cz, y + 0.08, 1);
    smoke(l, cx, cz, y + 0.09, 3);
    // Four satellite converters joined to the spire by pipe bridges.
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const [x, z] = off(l, cx, cz, a * 0.28, b * 0.2);
      wround(l, x, z, 0.05, 0.054, 0.034, 0.26, '#7a8a92', 16);
      bands(l, x, z, 0.034, 0.26, 0.054, 4);
      l.dome(x, z, 0.054, 0.054, 0.294, 0.06, '#5a6a72');
      pipe(l, pt([x, z], 0.22), pt([cx, cz], 0.22), 0.008, '#b0b8bc');
      pipe(l, pt([x, z], 0.14), pt([cx, cz], 0.14), 0.006, '#b64c39');
    }
    ladder(l, cx, cz + 0.16 / l.spanZ, 0.04, 0.3, '+z');
    // Control hall, cooling tank, tank farm, rail, trucks and pylons.
    brickBody(l, 0.5, 0.82, 0.5, 0.16, 0.034, 0.1, '#8a4a38');
    windows4(l, 0.5, 0.82, 0.5, 0.16, 0.08, 0.04, { frame: '#d8dde0' });
    tinGable(l, 0.5, 0.82, 'x', 0.5, 0.16, 0.134, 0.05, slate, '#8a4a38');
    for (const [x, z] of [
      [0.1, 0.78],
      [0.9, 0.78],
    ] as const)
      tank(l, x, z, 0.034, 0.05, 0.1, '#b9b6ae');
    railLine(l, 0.04, 0.96, 0.96, 0.96, 0.034, { steel: true });
    wagon(l, 0.3, 0.96, 0, '#6a6a70', 0.042, '#5a4a3a');
    wagon(l, 0.7, 0.96, 0, hot, 0.042, '#5a4a3a');
    truck(l, 0.2, 0.62, 0, '#3f6b8a');
    pylon(l, 0.06, 0.4, 0.34);
    pylon(l, 0.94, 0.4, 0.34);
    l.beam([0.06, 0.3, 0.4], [0.94, 0.3, 0.4], 0.002, '#1c1c1c');
    birds(l, [
      [0.3, 0.7, 0.036],
      [0.34, 0.7, 0.036],
      [0.5, 0.74, 0.14],
    ]);
    workers(l, [
      [0.4, 0.68, '#e8742a', '#f2cf4a'],
      [0.6, 0.68, '#e8742a', '#f2cf4a'],
      [0.76, 0.66, '#5a7a9a', '#3a3a3c'],
      [0.28, 0.9, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.34, 0.72, 0.17);
    lanternPost(l, 0.66, 0.72, 0.17);
  },

  // -------------------------------------------------------------------------------------------
  // Workshops: workshop -> guild_workshop -> waterwheel_workshop -> steam_manufactory
  //            -> precision_manufactory -> grand_artificery
  // -------------------------------------------------------------------------------------------
  workshop(l) {
    site(l, 'workshop', '#8a7a62', [0.06, 0.06, 0.94, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Plank smithy-and-joinery with a stone forge chimney and an open front bay.
    boardBody(l, hx, hz, 0.36, 0.26, 0.034, 0.13, '#8a6a48');
    windows4(l, hx, hz, 0.36, 0.26, 0.09, 0.04, { shutters: '#3f5a3a' });
    door(l, hx, hz, 0.36, 0.26, '+z', -0.08, 0.034, 0.05, 0.09, timber);
    shingleGable(l, hx, hz, 'x', 0.36, 0.26, 0.164, 0.085, '#6a4f38', '#8a6a48');
    stack(l, ...off(l, hx, hz, 0.12, -0.06), 0.034, 0.2, 0.022, '#8f8a80', 3);
    wbox(l, ...off(l, hx, hz, 0.05, 0.135), 0.034, 0.12, 0.004, 0.004, '#3f2a18');
    steps(l, ...off(l, hx, hz, -0.08, 0.14), 0.07, 2);
    downpipe(l, ...off(l, hx, hz, 0.18, 0.13), 0.034, 0.12);
    // Hanging sign, flower box and a lamp over the door.
    wbox(l, ...off(l, hx, hz, 0.1, 0.15), 0.1, 0.05, 0.04, 0.004, '#c9a83a');
    l.beam(
      pt(off(l, hx, hz, 0.06, 0.15), 0.158),
      pt(off(l, hx, hz, 0.12, 0.15), 0.158),
      0.004,
      timber,
    );
    flowerRow(l, ...off(l, hx, hz, 0.1, 0.14), 0.12, '#d6455a', 6, 0.062);
    // Outside forge, anvil, grindstone, quench trough and a long workbench with a vice.
    anvil(l, 0.72, 0.38);
    wbox(l, 0.62, 0.42, 0.034, 0.08, 0.04, 0.05, '#7a746a');
    wbox(l, 0.62, 0.42, 0.074, 0.06, 0.012, 0.04, hot, 0, 0, 1);
    wbox(l, 0.8, 0.48, 0.034, 0.1, 0.03, 0.04, '#6b4a2a');
    wbox(l, 0.8, 0.48, 0.056, 0.09, 0.004, 0.032, '#5a93ad');
    const gx = 0.82;
    const gz = 0.66;
    for (const s of [-1, 1])
      l.beam(
        [gx + (s * 0.03) / l.spanX, 0.034, gz],
        [gx + (s * 0.03) / l.spanX, 0.09, gz],
        0.006,
        timber,
      );
    disc(l, gx, gz, 0.07, 0.026, 0.01, '#9a9a9a', 0);
    wbox(l, 0.3, 0.68, 0.07, 0.2, 0.012, 0.06, '#8a6a48');
    for (const t of [-0.08, 0.08])
      wbox(l, ...off(l, 0.3, 0.68, t, 0), 0.034, 0.012, 0.036, 0.05, timber);
    wbox(l, ...off(l, 0.3, 0.68, -0.06, 0), 0.082, 0.026, 0.026, 0.02, iron);
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        ...off(l, 0.3, 0.68, 0.0 + i * 0.022, 0.012),
        0.082,
        0.008,
        0.002 + i * 0.002,
        0.014,
        '#9aa3a8',
        i * 0.4,
      );
    // Planks, logs, a cart wheel being fitted, barrels and a handcart.
    logPile(l, 0.16, 0.22, Math.PI / 2, 3, 0.12);
    for (let i = 0; i < 4; i++)
      wbox(l, 0.16, 0.56, 0.036 + i * 0.012, 0.16, 0.01, 0.07, tone('#c9a56c', 0.15), 0.1 * i);
    disc(l, 0.56, 0.78, 0.036, 0.034, 0.008, '#6b4a2a', 0.5);
    wheelbarrow(l, 0.7, 0.8, 0.6, '#9a9a9a');
    barrel(l, 0.46, 0.7);
    barrel(l, 0.5, 0.74);
    crate(l, 0.88, 0.84, 0.034, '#8a6a48');
    railing(l, 0.06, 0.94, 0.95);
    cypress(l, 0.08, 0.1, 0.24);
    cypress(l, 0.93, 0.14, 0.2);
    cat(l, ...off(l, hx, hz, -0.14, 0.14), 0.05, '#c27a3a');
    birds(l, [
      [0.6, 0.92, 0.07],
      [0.7, 0.92, 0.07],
      [0.4, 0.2, 0.17],
    ]);
    butterflies(l, [[0.2, 0.8, 0.1]]);
    workers(l, [
      [0.7, 0.46, '#8a4a3a', '#3a3a3c'],
      [0.36, 0.6, '#5a7a9a', '#d9c38a'],
      [0.58, 0.62, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.56, 0.14);
  },

  guild_workshop(l) {
    site(l, 'guild_workshop', '#8d8168', [0.05, 0.06, 0.95, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Two-storey guildhall: stone ground floor, jettied timber-frame upper floor and a hoist.
    stoneBody(l, hx, hz, 0.4, 0.28, 0.034, 0.1, '#a8a294');
    boardBody(l, hx, hz, 0.44, 0.3, 0.134, 0.1, '#a58a62');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.2 + i * 0.08, 0.152), 0.134, 0.008, 0.1, 0.006, '#4a3322');
    wbox(l, ...off(l, hx, hz, 0, 0.152), 0.176, 0.44, 0.008, 0.006, '#4a3322');
    windows4(l, hx, hz, 0.4, 0.28, 0.07, 0.04, { shutters: '#2f5a3a' });
    windows4(l, hx, hz, 0.44, 0.3, 0.17, 0.04, { shutters: '#2f5a3a' });
    door(l, hx, hz, 0.4, 0.28, '+z', 0, 0.034, 0.06, 0.1, '#4a3322');
    shingleGable(l, hx, hz, 'x', 0.44, 0.3, 0.234, 0.1, '#6b5238', '#a58a62');
    steps(l, ...off(l, hx, hz, 0, 0.15), 0.1, 3);
    for (const sx of [-1, 1])
      stack(l, ...off(l, hx, hz, sx * 0.14, -0.06), 0.234, 0.1, 0.02, '#9a948a', sx > 0 ? 3 : 0);
    // Hoist beam over the loft door with a hanging crate, guild banner and carved sign.
    wbox(l, ...off(l, hx, hz, 0.15, 0.165), 0.17, 0.05, 0.06, 0.012, '#2c1a10');
    l.beam(
      pt(off(l, hx, hz, 0.15, 0.17), 0.27),
      pt(off(l, hx, hz, 0.15, 0.25), 0.27),
      0.008,
      timber,
    );
    l.beam(pt(off(l, hx, hz, 0.15, 0.25), 0.27), pt(off(l, hx, hz, 0.15, 0.25), 0.2), 0.002, iron);
    crate(l, ...off(l, hx, hz, 0.15, 0.25), 0.17, '#8a6a48');
    wbox(l, ...off(l, hx, hz, -0.12, 0.175), 0.2, 0.04, 0.06, 0.004, '#b0463a');
    wbox(l, ...off(l, hx, hz, -0.12, 0.178), 0.215, 0.022, 0.022, 0.004, '#f1ece2');
    flowerRow(l, ...off(l, hx, hz, -0.12, 0.155), 0.14, '#f0c24a', 6, 0.062);
    downpipe(l, ...off(l, hx, hz, 0.21, 0.14), 0.034, 0.2);
    // Yard: two benches with apprentices, wood-turning lathe, anvil, cask and goods stacks.
    for (const [x, z] of [
      [0.2, 0.7],
      [0.5, 0.74],
    ] as const) {
      wbox(l, x, z, 0.07, 0.16, 0.012, 0.06, '#8a6a48');
      for (const t of [-0.065, 0.065])
        wbox(l, ...off(l, x, z, t, 0), 0.034, 0.012, 0.036, 0.05, timber);
    }
    wbox(l, 0.2, 0.7, 0.082, 0.04, 0.02, 0.03, iron);
    cyl(l, 0.5, 0.74, 0.086, 0.01, 0.12, 0, '#9a6f46', 8);
    anvil(l, 0.76, 0.46);
    for (let i = 0; i < 3; i++) barrel(l, 0.78 + i * 0.045, 0.72);
    blockStack(l, 0.86, 0.5, 0.034, 2, 1, 2, '#8a6a48', 0.04);
    for (let i = 0; i < 5; i++)
      wbox(l, 0.14, 0.46 + i * 0.002, 0.036 + i * 0.012, 0.15, 0.01, 0.07, tone('#c9a56c', 0.15));
    wheelbarrow(l, 0.66, 0.84, 0.3, '#c9a56c');
    cobbles(l, 0.3, 0.52, 0.6, 0.64, 22);
    railing(l, 0.06, 0.94, 0.96);
    cypress(l, 0.08, 0.1, 0.28);
    cypress(l, 0.93, 0.14, 0.24);
    cat(l, ...off(l, hx, hz, -0.1, 0.158), 0.056, '#3a3a3c');
    birds(l, [
      [0.7, 0.95, 0.07],
      [0.76, 0.95, 0.07],
      [0.3, 0.2, 0.236],
    ]);
    butterflies(l, [[0.9, 0.7, 0.1]]);
    workers(l, [
      [0.2, 0.62, '#8a4a3a', '#3a3a3c'],
      [0.52, 0.66, '#5a7a9a', '#d9c38a'],
      [0.74, 0.56, '#6a8a5a', '#3a3a3c'],
      [0.4, 0.58, '#b0463a', '#d9c38a'],
    ]);
    lanternPost(l, 0.1, 0.56, 0.16);
    lanternPost(l, 0.9, 0.62, 0.16);
  },

  waterwheel_workshop(l) {
    site(l, 'waterwheel_workshop', '#85796a', [0.05, 0.06, 0.95, 0.94]);
    const hx = 0.44;
    const hz = 0.3;
    // Long stone mill-house with a plank loft, shuttered windows and a gabled hoist door.
    stoneBody(l, hx, hz, 0.5, 0.26, 0.034, 0.1, '#a8a294');
    boardBody(l, hx, hz, 0.5, 0.26, 0.134, 0.08, '#8a6a48');
    windows4(l, hx, hz, 0.5, 0.26, 0.08, 0.04, { shutters: '#2f5f6a' });
    windows4(l, hx, hz, 0.5, 0.26, 0.16, 0.036, { shutters: '#2f5f6a' });
    door(l, hx, hz, 0.5, 0.26, '+z', -0.12, 0.034, 0.06, 0.1, '#4a3322');
    shingleGable(l, hx, hz, 'x', 0.5, 0.26, 0.214, 0.09, '#6b5238', '#8a6a48');
    stack(l, ...off(l, hx, hz, 0.18, -0.05), 0.214, 0.2, 0.02, '#9a948a', 3);
    cornice(l, hx, hz, 0.5, 0.26, 0.132, '#d9d2bf');
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.25, 0.135), 0.034, 0.18);
    // Undershot waterwheel on the end wall, fed by a timber flume from a leat and mill pond.
    wbox(l, 0.84, 0.3, 0.034, 0.1, 0.012, 0.5, '#5a93ad');
    const wheelSize = 0.09;
    const wheel = new THREE.TorusGeometry(wheelSize, 0.01, 5, 20);
    wheel.rotateY(Math.PI / 2);
    l.shape(wheel, '#6b4a2a', 0.76, 0.3, 0.034 + wheelSize);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.76, 0.3, 0, Math.cos(a) * wheelSize),
        0.034 + wheelSize + Math.sin(a) * wheelSize,
        0.03,
        0.018,
        0.016,
        '#8a6a48',
        0,
        a,
      );
      const sp = new THREE.BoxGeometry(0.006, wheelSize * 2, 0.006);
      sp.rotateX(a);
      l.shape(sp, '#6b4a2a', 0.76, 0.3, 0.034 + wheelSize);
    }
    l.beam([0.76, 0.124, 0.3], [0.69, 0.124, 0.3], 0.008, iron);
    wbox(l, 0.86, 0.12, 0.1, 0.12, 0.012, 0.06, '#7a5a3a');
    for (const s of [-1, 1])
      wbox(l, 0.86, 0.12 + (s * 0.025) / l.spanZ, 0.082, 0.12, 0.034, 0.006, '#7a5a3a');
    wbox(l, 0.78, 0.2, 0.074, 0.016, 0.03, 0.016, timber);
    // Mill pond, sluice gate, footbridge and reeds on the near side.
    waterSheet(l, 0.2, 0.8, 0.3, 0.26, 0.036, '#4f93b0');
    wbox(l, 0.5, 0.86, 0.04, 0.5, 0.01, 0.1, '#5a93ad');
    for (let i = 0; i < 6; i++) wbox(l, 0.4 + i * 0.04, 0.86, 0.056, 0.03, 0.006, 0.12, '#8a6a48');
    for (const x of [0.4, 0.6]) wbox(l, x, 0.82, 0.056, 0.006, 0.03, 0.006, timber);
    for (let i = 0; i < 6; i++)
      wround(l, 0.06 + i * 0.05, 0.94, 0.003, 0.003, 0.036, 0.05 + (i % 3) * 0.012, '#4f7a3a', 4);
    // Line shaft with belts and a lathe seen through the open bay, grindstone and goods.
    wbox(l, ...off(l, hx, hz, -0.12, 0.12), 0.1, 0.12, 0.006, 0.006, iron);
    gear(l, ...off(l, hx, hz, 0.12, 0.135), 0.03, 0.04, '#8a8a90');
    wbox(l, 0.2, 0.62, 0.07, 0.16, 0.012, 0.06, '#8a6a48');
    wbox(l, 0.18, 0.62, 0.082, 0.05, 0.02, 0.03, iron);
    for (let i = 0; i < 4; i++)
      wbox(
        l,
        0.12,
        0.52 + i * 0.002,
        0.036 + i * 0.012,
        0.15,
        0.01,
        0.07,
        tone('#c9a56c', 0.15),
        0.1 * i,
      );
    for (let i = 0; i < 3; i++)
      l.shape(
        new THREE.SphereGeometry(0.02, 7, 6),
        '#cfc3a2',
        ...off(l, 0.7, 0.54, i * 0.034, 0),
        0.05,
      );
    barrel(l, 0.34, 0.66);
    wheelbarrow(l, 0.58, 0.64, 0.3, '#cfc3a2');
    cat(l, ...off(l, hx, hz, 0.14, 0.14), 0.036, '#c27a3a');
    birds(l, [
      [0.7, 0.92, 0.04],
      [0.76, 0.9, 0.04],
      [0.5, 0.2, 0.214],
    ]);
    cypress(l, 0.08, 0.1, 0.28);
    cypress(l, 0.94, 0.9, 0.22);
    workers(l, [
      [0.52, 0.58, '#5a7a9a', '#3a3a3c'],
      [0.74, 0.5, '#8a4a3a', '#d9c38a'],
      [0.3, 0.6, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.16);
  },

  steam_manufactory(l) {
    site(l, 'steam_manufactory', '#706a62', [0.04, 0.06, 0.96, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Three-storey brick works with tall arched windows, stone string courses and a slate roof.
    brickBody(l, hx, hz, 0.56, 0.3, 0.034, 0.26, '#9a4a35');
    for (const y of [0.1, 0.18]) windows4(l, hx, hz, 0.56, 0.3, y, 0.05, { frame: '#e3d9bf' });
    windows4(l, hx, hz, 0.56, 0.3, 0.26, 0.04, { frame: '#e3d9bf' });
    for (const y of [0.15, 0.23]) wbox(l, hx, hz, y, 0.58, 0.008, 0.32, '#cfc9b9');
    cornice(l, hx, hz, 0.56, 0.3, 0.292, '#cfc9b9');
    door(l, hx, hz, 0.56, 0.3, '+z', 0.0, 0.034, 0.1, 0.12, '#2a2a2c', true);
    tinGable(l, hx, hz, 'x', 0.56, 0.3, 0.304, 0.1, slate, '#9a4a35');
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.28, 0.155), 0.034, 0.26);
    ladder(l, ...off(l, hx, hz, 0.2, 0.152), 0.04, 0.26);
    wbox(l, ...off(l, hx, hz, -0.2, 0.158), 0.2, 0.1, 0.05, 0.004, '#f1ece2');
    wbox(l, ...off(l, hx, hz, -0.2, 0.16), 0.218, 0.07, 0.022, 0.004, '#2a2a2c');
    // Engine house with a flywheel, steam boiler and a tall banded chimney.
    brickBody(l, 0.82, 0.3, 0.16, 0.22, 0.034, 0.14, '#8a4430');
    tinGable(l, 0.82, 0.3, 'z', 0.22, 0.16, 0.174, 0.05, slate, '#8a4430');
    flywheel(l, 0.82, 0.42, 0.04, 0.07);
    cyl(l, 0.84, 0.64, 0.04, 0.045, 0.2, Math.PI / 2, '#3a3f42', 12);
    wbox(l, 0.84, 0.64, 0.034, 0.22, 0.012, 0.1, iron);
    gauge(l, 0.76, 0.66, 0.08);
    stack(l, 0.7, 0.16, 0.034, 0.46, 0.03, '#9c5640', 5);
    for (const y of [0.14, 0.26, 0.38]) wround(l, 0.7, 0.16, 0.026, 0.026, y, 0.008, iron, 12);
    // Coal bunker, goods yard with a wagon on the siding, crates and a loading crane.
    wbox(l, 0.9, 0.18, 0.034, 0.1, 0.07, 0.12, '#5a4a3a');
    heap(l, 0.9, 0.18, 0.05, '#1f1f1f', 0.06);
    railLine(l, 0.04, 0.9, 0.96, 0.9, 0.034, { steel: true });
    wagon(l, 0.3, 0.9, 0, '#8a6a48', 0.042, '#5a4a3a');
    wagon(l, 0.5, 0.9, 0, '#5a7a9a', 0.042, '#5a4a3a');
    crane(l, 0.7, 0.78, 0.2, 0);
    for (let i = 0; i < 3; i++)
      crate(l, 0.14 + (i % 2) * 0.05, 0.72 + Math.floor(i / 2) * 0.04, 0.034, '#8a6a48');
    barrel(l, 0.6, 0.66);
    blockStack(l, 0.84, 0.78, 0.034, 2, 1, 2, '#8a6a48', 0.04);
    cobbles(l, 0.2, 0.56, 0.56, 0.66, 20);
    truck(l, 0.28, 0.78, 0, '#3f5a3a');
    pylon(l, 0.94, 0.5, 0.3);
    birds(l, [
      [0.6, 0.9, 0.04],
      [0.66, 0.9, 0.04],
      [0.4, 0.2, 0.306],
    ]);
    cat(l, ...off(l, hx, hz, 0.1, 0.16), 0.034, '#3a3a3c');
    workers(l, [
      [0.42, 0.6, '#8a4a3a', '#3a3a3c'],
      [0.56, 0.7, '#5a7a9a', '#3a3a3c'],
      [0.2, 0.62, '#c9a83a', '#d9c38a'],
      [0.74, 0.58, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.56, 0.17);
    lanternPost(l, 0.52, 0.6, 0.17);
  },

  precision_manufactory(l) {
    site(l, 'precision_manufactory', '#767a7c', [0.04, 0.06, 0.96, 0.94]);
    const hx = 0.4;
    const hz = 0.34;
    // Long red-brick laboratory hall with big iron-framed windows and a glass lantern roof.
    brickBody(l, hx, hz, 0.62, 0.3, 0.034, 0.2, '#8a4a3a');
    windows4(l, hx, hz, 0.62, 0.3, 0.1, 0.06, { frame: '#d8dde0' });
    windows4(l, hx, hz, 0.62, 0.3, 0.17, 0.04, { frame: '#d8dde0' });
    cornice(l, hx, hz, 0.62, 0.3, 0.232, '#cfc9b9');
    tinGable(l, hx, hz, 'x', 0.62, 0.3, 0.244, 0.08, '#6e7b82', '#8a4a3a');
    for (let i = 0; i < 8; i++)
      wbox(l, ...off(l, hx, hz, -0.27 + i * 0.077, 0), 0.31, 0.012, 0.07, 0.1, '#3a4a52');
    wbox(l, hx, hz, 0.32, 0.56, 0.06, 0.07, '#cfe6ee', 0, 0, 0.5);
    wbox(l, hx, hz, 0.38, 0.58, 0.01, 0.09, '#5a6a72');
    door(l, hx, hz, 0.62, 0.3, '+z', 0.0, 0.034, 0.08, 0.12, '#2a2a2c', true);
    steps(l, ...off(l, hx, hz, 0, 0.155), 0.1, 3);
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.31, 0.155), 0.034, 0.2);
    // Clock tower with a glowing face on four sides and a slim copper spire.
    const tx = 0.82;
    const tz = 0.3;
    brickBody(l, tx, tz, 0.14, 0.14, 0.034, 0.46, '#7a3a2a');
    for (const [dx, dz, w, d] of [
      [0, 0.074, 0.08, 0.006],
      [0, -0.074, 0.08, 0.006],
      [0.074, 0, 0.006, 0.08],
      [-0.074, 0, 0.006, 0.08],
    ] as const)
      wbox(l, ...off(l, tx, tz, dx, dz), 0.42, w, 0.08, d, '#fff2c4', 0, 0, 1);
    cornice(l, tx, tz, 0.14, 0.14, 0.494, '#cfc9b9');
    coneRoof(l, tx, tz, 0.506, 0.1, 0.26, '#5a9a8a');
    // Gauge-and-gear emblem over the door, flagpole, delivery van, instrument crates.
    gear(l, ...off(l, hx, hz, 0, 0.162), 0.17, 0.03, '#c9a83a');
    wround(l, 0.14, 0.62, 0.004, 0.006, 0.034, 0.3, '#e8e4d8', 6);
    wbox(l, ...off(l, 0.14, 0.62, 0.03, 0), 0.31, 0.05, 0.003, 0.034, '#2f5f86');
    truck(l, 0.56, 0.78, 0, '#e8e4d8');
    for (let i = 0; i < 4; i++)
      crate(l, 0.2 + (i % 2) * 0.05, 0.78 + Math.floor(i / 2) * 0.04, 0.034, '#6b4a2a');
    // Garden court: clipped hedges, benches and a small fountain.
    wround(l, 0.34, 0.62, 0.05, 0.054, 0.034, 0.02, '#bfb8a8', 14);
    wround(l, 0.34, 0.62, 0.044, 0.044, 0.05, 0.004, '#6fb3c8', 14);
    wround(l, 0.34, 0.62, 0.008, 0.01, 0.05, 0.05, '#cfc8b6', 8);
    for (const x of [0.2, 0.48]) wbox(l, x, 0.66, 0.034, 0.14, 0.04, 0.03, '#3f7a3a');
    bench(l, 0.5, 0.58);
    flowerRow(l, 0.82, 0.58, 0.2, '#d6455a', 8);
    flowerRow(l, 0.82, 0.62, 0.2, '#f0c24a', 8);
    pylon(l, 0.94, 0.8, 0.3);
    birds(l, [
      [0.4, 0.58, 0.036],
      [0.44, 0.6, 0.036],
      [0.4, 0.2, 0.246],
    ]);
    cat(l, ...off(l, hx, hz, 0.14, 0.17), 0.04, '#9a9a9a');
    cypress(l, 0.06, 0.9, 0.24);
    cypress(l, 0.94, 0.12, 0.26);
    workers(l, [
      [0.24, 0.66, '#e8e4d8', '#3a3a3c'],
      [0.46, 0.7, '#e8e4d8', '#d9c38a'],
      [0.64, 0.64, '#5a7a9a', '#3a3a3c'],
      [0.7, 0.9, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.56, 0.17);
    lanternPost(l, 0.66, 0.58, 0.17);
  },

  grand_artificery(l) {
    site(l, 'grand_artificery', '#8a8478', [0.04, 0.05, 0.96, 0.95]);
    const hx = 0.5;
    const hz = 0.34;
    // Palatial hall: stone body with giant arched windows, balustraded roofline and portico.
    stoneBody(l, hx, hz, 0.42, 0.32, 0.034, 0.24, '#d9d2bf', 0.028);
    windows4(l, hx, hz, 0.42, 0.32, 0.12, 0.06, { frame: '#f1ece2' });
    cornice(l, hx, hz, 0.42, 0.32, 0.272, '#c9c2ae');
    for (let i = 0; i < 12; i++)
      wbox(l, ...off(l, hx, hz, -0.2 + i * 0.036, 0.15), 0.296, 0.008, 0.026, 0.008, '#e8e4d8');
    wbox(l, ...off(l, hx, hz, 0, 0.15), 0.322, 0.42, 0.006, 0.006, '#e8e4d8');
    for (let i = 0; i < 4; i++) {
      const [px, pz] = off(l, hx, hz, -0.09 + i * 0.06, 0.2);
      wround(l, px, pz, 0.016, 0.018, 0.034, 0.012, '#c9c2ae', 12);
      wround(l, px, pz, 0.014, 0.016, 0.046, 0.21, '#ece7da', 12);
      wround(l, px, pz, 0.019, 0.015, 0.256, 0.012, '#d9d2bf', 12);
    }
    wbox(l, ...off(l, hx, hz, 0, 0.2), 0.268, 0.26, 0.02, 0.1, '#d9d2bf');
    tinGable(l, ...off(l, hx, hz, 0, 0.2), 'x', 0.26, 0.1, 0.288, 0.06, '#cfc8b6', '#d9d2bf');
    door(l, hx, hz, 0.42, 0.32, '+z', 0, 0.034, 0.08, 0.14, '#3a2a1c', true);
    steps(l, ...off(l, hx, hz, 0, 0.255), 0.26, 4);
    // Central drum and copper dome with a golden gear finial and a ring of lit oculi.
    wround(l, hx, hz, 0.13, 0.14, 0.292, 0.2, '#d4cdb9', 24);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wbox(
        l,
        ...off(l, hx, hz, Math.cos(a) * 0.138, Math.sin(a) * 0.138),
        0.4,
        0.03,
        0.04,
        0.004,
        '#ffd27a',
        -a,
        0,
        1,
      );
    }
    l.dome(hx, hz, 0.135, 0.135, 0.492, 0.2, '#5aa08a');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      l.beam(
        pt(off(l, hx, hz, Math.cos(a) * 0.13, Math.sin(a) * 0.13), 0.495),
        pt(off(l, hx, hz, Math.cos(a) * 0.03, Math.sin(a) * 0.03), 0.69),
        0.004,
        '#e8dfc7',
      );
    }
    wround(l, hx, hz, 0.034, 0.034, 0.692, 0.07, '#e8dfc7', 12);
    wbox(l, hx, hz, 0.71, 0.06, 0.03, 0.004, '#ffd27a', 0, 0, 1);
    l.dome(hx, hz, 0.036, 0.036, 0.762, 0.07, '#5aa08a');
    wround(l, hx, hz, 0.005, 0.01, 0.832, 0.05, '#e8dfc7', 8);
    gear(l, hx, hz, 0.88, 0.026, '#d7af4b');
    // Flanking wings with their own gabled roofs and tall windows.
    for (const sx of [-1, 1]) {
      const [wx, wz] = off(l, hx, hz, sx * 0.29, 0.02);
      stoneBody(l, wx, wz, 0.17, 0.26, 0.034, 0.18, '#d4cdbd', 0.026);
      windows4(l, wx, wz, 0.17, 0.26, 0.09, 0.05, { frame: '#f1ece2' });
      tinGable(l, wx, wz, 'z', 0.26, 0.17, 0.214, 0.06, '#7a8a8a', '#d4cdbd');
      stack(l, ...off(l, wx, wz, 0, -0.06), 0.214, 0.12, 0.016, '#9a948a', sx > 0 ? 3 : 0);
      downpipe(l, ...off(l, wx, wz, sx * 0.085, 0.13), 0.034, 0.14);
    }
    // Forecourt: reflecting pool with a fountain, statue of the inventor, urns and flower beds.
    wbox(l, 0.5, 0.74, 0.034, 0.3, 0.02, 0.16, '#bfb8a8');
    wbox(l, 0.5, 0.74, 0.05, 0.27, 0.004, 0.13, '#6fb3c8');
    wround(l, 0.5, 0.74, 0.008, 0.012, 0.05, 0.06, '#cfc8b6', 8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      wbox(
        l,
        ...off(l, 0.5, 0.74, Math.cos(a) * 0.03, Math.sin(a) * 0.03),
        0.1,
        0.004,
        0.02,
        0.004,
        '#bfe6f0',
        a,
      );
    }
    for (const sx of [-1, 1]) {
      wbox(l, ...off(l, 0.5, 0.74, sx * 0.26, 0), 0.034, 0.04, 0.04, 0.04, '#cfc9b9');
      wround(l, ...off(l, 0.5, 0.74, sx * 0.26, 0), 0.012, 0.016, 0.074, 0.08, '#e8e4d8', 8);
      l.shape(
        new THREE.SphereGeometry(0.014, 7, 6),
        '#e8e4d8',
        ...off(l, 0.5, 0.74, sx * 0.26, 0),
        0.17,
      );
      flowerRow(l, ...off(l, 0.5, 0.74, sx * 0.3, 0.1), 0.14, sx > 0 ? '#d6455a' : '#f0c24a', 8);
    }
    cobbles(l, 0.3, 0.5, 0.7, 0.6, 28, 0.036, '#c9c2ae');
    for (const x of [0.3, 0.7]) lanternPost(l, x, 0.58, 0.18);
    cypress(l, 0.07, 0.8, 0.26);
    cypress(l, 0.93, 0.8, 0.26);
    birds(l, [
      [0.4, 0.88, 0.036],
      [0.46, 0.9, 0.036],
      [0.62, 0.62, 0.036],
    ]);
    butterflies(l, [
      [0.2, 0.7, 0.12],
      [0.8, 0.7, 0.14],
    ]);
    cat(l, ...off(l, hx, hz, 0.2, 0.275), 0.036, '#3a3a3c');
    workers(l, [
      [0.34, 0.62, '#2f3f5a', '#3a3a3c'],
      [0.62, 0.66, '#6a2f3a', '#d9c38a'],
      [0.44, 0.88, '#c9a83a', '#3a3a3c'],
      [0.72, 0.86, '#5a7a9a', '#d9c38a'],
    ]);
  },
};
