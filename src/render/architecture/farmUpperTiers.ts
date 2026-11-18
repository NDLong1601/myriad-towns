import * as THREE from 'three';
import {
  bale,
  barn,
  cow,
  cropRows,
  farmhouse,
  fence,
  fruitTree,
  pond,
  shedRoof,
  silo,
  tractor,
  truck,
  yard,
} from './farmTiers';
import { type Lot, type Recipes } from './lot';
import { figure, lamp, shadeHex, tree, windowOn } from './theatreTiers';

// Extra tiers for Group 5 so each chain has five levels, unlocked as the area urbanises:
//   smallholding -> farmstead -> mixed_farm -> agri_estate -> agritech_hub
//   cider_press -> brewery -> food_cannery -> frozen_food_plant -> food_tech_campus
//   sheep_fold -> cattle_barn -> dairy_cooperative -> milking_center -> bio_dairy_complex
//   fish_ponds -> fish_hatchery -> aquaculture_center -> seafood_processing -> marine_institute

const grass = '#7f9c53';
const grassDark = '#6c8a47';
const concrete = '#bdb8ac';
const concreteDark = '#9e998e';
const panelWhite = '#e9ebe6';
const panelGrey = '#c9ccc8';
const slate = '#4b5a67';
const tin = '#8f9a9e';
const tinDark = '#6f7a7e';
const steel = '#b8c0c2';
const iron = '#2c3134';
const glassBlue = '#9cc3cf';
const glassGreen = '#bcd9cf';
const solar = '#253a5a';
const leafy = '#5f9143';
const water = '#4a8aa3';
const icy = '#cfe3ea';
const navy = '#2f5f86';
const crops = ['#7da23f', '#a8b84a', '#c9a54a', '#5f8f3a'] as const;

/** Rows of tilted solar panels on legs. */
function solarArray(l: Lot, x: number, z: number, cols: number, rows: number, y = 0.03): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x + (c - (cols - 1) / 2) * 0.075;
      const pz = z + (r - (rows - 1) / 2) * 0.07;
      l.block(px, pz, 0.006, 0.006, y, 0.03, iron);
      const g = new THREE.BoxGeometry(0.13, 0.006, 0.08);
      g.rotateX(-0.45);
      l.shape(g, solar, px, pz, y + 0.04);
    }
  }
}

/** A modern curtain-wall block with mullions and floor bands. */
function glassBlock(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  floors: number,
  pane = glassBlue,
  band = panelWhite,
): void {
  l.block(x, z, w, d, y, h, pane, 1);
  for (let i = 0; i <= floors; i++)
    l.block(x, z, w + 0.008, d + 0.008, y + (h * i) / floors - 0.006, 0.012, band);
  const mx = Math.max(2, Math.round((w * l.spanX) / 0.06));
  for (let i = 0; i <= mx; i++) {
    const px = x - w / 2 + (i * w) / mx;
    l.block(px, z + d / 2 + 0.002, 0.004, 0.006, y, h, '#5a6266');
    l.block(px, z - d / 2 - 0.002, 0.004, 0.006, y, h, '#5a6266');
  }
  const mz = Math.max(2, Math.round((d * l.spanZ) / 0.06));
  for (let i = 0; i <= mz; i++) {
    const pz = z - d / 2 + (i * d) / mz;
    l.block(x + w / 2 + 0.002, pz, 0.006, 0.004, y, h, '#5a6266');
    l.block(x - w / 2 - 0.002, pz, 0.006, 0.004, y, h, '#5a6266');
  }
}

/** Insulated panel shed: white walls with vertical panel joints. */
function panelShed(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  color = panelWhite,
): void {
  l.block(x, z, w + 0.01, d + 0.01, 0.03, 0.02, concreteDark);
  l.block(x, z, w, d, 0.05, h, color);
  const n = Math.round((w * l.spanX) / 0.05);
  for (let i = 1; i < n; i++) {
    const px = x - w / 2 + (i * w) / n;
    l.block(px, z + d / 2 + 0.002, 0.003, 0.004, 0.05, h, shadeHex(color, 0.85));
    l.block(px, z - d / 2 - 0.002, 0.003, 0.004, 0.05, h, shadeHex(color, 0.85));
  }
  l.block(x, z, w + 0.012, d + 0.012, 0.05 + h, 0.014, shadeHex(color, 0.8));
}

/** Rooftop refrigeration / HVAC units with fans. */
function roofUnits(l: Lot, x: number, z: number, y: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const px = x + (i - (n - 1) / 2) * 0.07;
    l.block(px, z, 0.05, 0.05, y, 0.035, panelGrey);
    l.round(px, z, 0.018, 0.018, y + 0.035, 0.004, '#3a3f42');
  }
}

/** Steel lattice windpump with a multi-blade wheel and tail vane. */
function windpump(l: Lot, x: number, z: number, h: number): void {
  const b = 0.035;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    l.beam([x + sx * b, 0.03, z + sz * b], [x + sx * 0.006, h, z + sz * 0.006], 0.006, iron);
  }
  for (const t of [0.3, 0.6]) {
    const r = b * (1 - t) + 0.006 * t;
    const yy = 0.03 + (h - 0.03) * t;
    l.block(x, z + r, r * 2, 0.004, yy, 0.004, iron);
    l.block(x, z - r, r * 2, 0.004, yy, 0.004, iron);
    l.block(x + r, z, 0.004, r * 2, yy, 0.004, iron);
    l.block(x - r, z, 0.004, r * 2, yy, 0.004, iron);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    l.beam(
      [x, h + 0.01, z + 0.012],
      [x + Math.cos(a) * 0.045, h + 0.01 + Math.sin(a) * 0.09, z + 0.012],
      0.01,
      '#d8d5cc',
    );
  }
  l.beam([x, h + 0.01, z], [x, h + 0.01, z - 0.08], 0.006, iron);
  l.block(x, z - 0.08, 0.004, 0.04, h - 0.01, 0.05, '#c8443a');
}

/** Wind turbine: tapered tower, nacelle and three blades. */
function turbine(l: Lot, x: number, z: number, h: number): void {
  l.round(x, z, 0.008, 0.014, 0.03, h, '#eceeea');
  l.block(x, z, 0.02, 0.05, h + 0.02, 0.024, '#eceeea');
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    l.beam(
      [x, h + 0.032, z + 0.028],
      [x + Math.cos(a) * 0.07, h + 0.032 + Math.sin(a) * 0.14, z + 0.028],
      0.008,
      '#f4f5f2',
    );
  }
}

/** Biogas digester: concrete tank with a green membrane dome. */
function digester(l: Lot, x: number, z: number, r: number): void {
  l.round(x, z, r, r * 1.03, 0.03, 0.08, concrete);
  l.round(x, z, r * 1.01, r * 1.01, 0.1, 0.008, concreteDark);
  l.dome(x, z, r * 0.98, r * 0.98, 0.11, r * 1.2, '#4f7d4a');
}

/** Small drone on a pad. */
function drone(l: Lot, x: number, z: number, y: number): void {
  l.round(x, z, 0.03, 0.03, y, 0.004, '#e3b43c');
  l.block(x, z, 0.02, 0.02, y + 0.004, 0.008, '#e8e8e4');
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    l.round(x + dx * 0.016, z + dz * 0.016, 0.009, 0.009, y + 0.012, 0.002, '#333333');
  }
}

export const farmUpperTiers: Recipes = {
  // ---------------------------------------------------------------------------
  // Agriculture tier 3: mixed farm (barn, silos, orchard, windpump)
  // ---------------------------------------------------------------------------
  mixed_farm(l) {
    l.base(grass, 0.03);
    yard(l, 0.36, 0.38, 0.66, 0.4);
    barn(l, 0.22, 0.3, 0.34, 0.42, 0.3, slate);
    farmhouse(l, 0.7, 0.2, 0.28, 0.2, 0.26, '#7e3b2e');
    silo(l, 0.47, 0.12, 0.055, 0.56, '#c9c1b0', 'dome');
    silo(l, 0.58, 0.12, 0.055, 0.62, '#c9c1b0', 'dome');
    windpump(l, 0.9, 0.44, 0.74);
    l.round(0.9, 0.56, 0.05, 0.05, 0.03, 0.05, tinDark);
    l.round(0.9, 0.56, 0.045, 0.045, 0.08, 0.002, water);
    // Equipment shed and a muck spreader.
    l.block(0.62, 0.48, 0.24, 0.12, 0.03, 0.14, tin);
    for (let i = 0; i < 3; i++) l.block(0.54 + i * 0.08, 0.542, 0.06, 0.004, 0.03, 0.11, '#4d5458');
    shedRoof(l, 0.62, 0.48, 0.26, 0.14, 0.17, -0.03, tinDark);
    tractor(l, 0.4, 0.6, '#3d7a3f');
    l.block(0.47, 0.6, 0.06, 0.04, 0.045, 0.03, '#a33a2c');
    // Fields, orchard and a hay meadow.
    cropRows(l, 0.22, 0.82, 0.38, 0.26, 7, crops[2]);
    cropRows(l, 0.56, 0.82, 0.24, 0.26, 5, crops[0], 'z');
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) fruitTree(l, 0.78 + c * 0.1, 0.76 + r * 0.12, r + c);
    for (let i = 0; i < 4; i++) bale(l, 0.08 + i * 0.07, 0.62);
    fence(l, 0.04, 0.68, 0.96, 0.68);
    figure(l, 0.36, 0.52, 0.03, 2);
    figure(l, 0.74, 0.36, 0.03, 0);
  },

  // ---------------------------------------------------------------------------
  // Agriculture tier 5: agritech hub (vertical farm, solar, drones)
  // ---------------------------------------------------------------------------
  agritech_hub(l) {
    l.base(grassDark, 0.03);
    yard(l, 0.34, 0.34, 0.6, 0.6, concrete);
    // Vertical farm tower with planted floors.
    const tx = 0.28;
    const tz = 0.28;
    l.block(tx, tz, 0.3, 0.3, 0.03, 0.04, concreteDark);
    glassBlock(l, tx, tz, 0.28, 0.28, 0.07, 1.16, 12, glassGreen);
    for (let i = 0; i < 12; i++) {
      l.block(tx, tz + 0.142, 0.26, 0.004, 0.08 + i * 0.0967, 0.02, i % 2 ? leafy : '#7da23f');
      l.block(tx + 0.142, tz, 0.004, 0.26, 0.08 + i * 0.0967, 0.02, i % 2 ? '#7da23f' : leafy);
    }
    l.block(tx, tz, 0.3, 0.3, 1.23, 0.02, panelWhite);
    solarArray(l, tx, tz, 3, 3, 1.25);
    l.round(tx + 0.1, tz - 0.1, 0.004, 0.004, 1.25, 0.12, iron);
    // Modern barn with a solar roof and automated greenhouses.
    l.block(0.72, 0.24, 0.4, 0.3, 0.03, 0.22, panelGrey);
    for (let i = 0; i < 5; i++)
      l.block(0.56 + i * 0.08, 0.392, 0.05, 0.004, 0.06, 0.12, glassBlue, 1);
    l.ridge(0.72, 0.24, 0.42, 0.32, 0.25, 0.12, 'x', tinDark);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.BoxGeometry(0.15, 0.006, 0.09);
      g.rotateX(-0.6);
      l.shape(g, solar, 0.56 + i * 0.08, 0.32, 0.31);
    }
    for (const gx of [0.62, 0.84]) {
      l.vaultedCanopy(gx, 0.62, 0.18, 0.2, 0.03, 0.12);
    }
    // Precision fields with an autonomous tractor and drone pads.
    cropRows(l, 0.22, 0.8, 0.36, 0.3, 9, crops[0], 'z');
    cropRows(l, 0.6, 0.86, 0.36, 0.18, 6, crops[2]);
    drone(l, 0.52, 0.56, 0.034);
    drone(l, 0.52, 0.66, 0.034);
    drone(l, 0.3, 0.7, 0.16);
    tractor(l, 0.82, 0.78, '#3c6f9a');
    turbine(l, 0.88, 0.1, 0.8);
    truck(l, 0.5, 0.46, 'x', '#3c6f9a');
    lamp(l, 0.06, 0.6, 0.03, 0.24);
    figure(l, 0.46, 0.36, 0.03, 1);
    figure(l, 0.5, 0.3, 0.03, 4);
  },

  // ---------------------------------------------------------------------------
  // Food tier 4: frozen food plant (cold store, reefer docks, ammonia tanks)
  // ---------------------------------------------------------------------------
  frozen_food_plant(l) {
    l.base(concrete, 0.03);
    // Tall automated cold store.
    panelShed(l, 0.24, 0.26, 0.36, 0.4, 1.02, icy);
    for (let i = 1; i < 5; i++) l.block(0.24, 0.26, 0.364, 0.404, 0.05 + i * 0.2, 0.006, '#9fbcc6');
    roofUnits(l, 0.24, 0.2, 1.084, 4);
    roofUnits(l, 0.24, 0.34, 1.084, 4);
    l.block(0.24, 0.462, 0.22, 0.008, 0.82, 0.08, navy);
    l.block(0.24, 0.466, 0.18, 0.004, 0.836, 0.05, '#f4efe2', 1);
    // Processing hall with a monitor roof.
    panelShed(l, 0.68, 0.34, 0.5, 0.36, 0.3);
    for (let i = 0; i < 6; i++) {
      windowOn(l, 'z', 0.48 + i * 0.08, 0.52, 1, 0.045, 0.16, 0.08, {
        frame: '#5a6266',
        pane: glassBlue,
      });
    }
    l.ridge(0.68, 0.34, 0.52, 0.38, 0.364, 0.08, 'x', tinDark);
    l.block(0.68, 0.34, 0.3, 0.1, 0.42, 0.06, panelWhite);
    l.block(0.68, 0.391, 0.28, 0.006, 0.43, 0.04, glassBlue, 1);
    l.ridge(0.68, 0.34, 0.32, 0.12, 0.48, 0.04, 'x', tinDark);
    // Ammonia tanks and a spiral freezer drum.
    for (const tz of [0.08, 0.15]) {
      const g = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 12);
      g.rotateZ(Math.PI / 2);
      l.shape(g, steel, 0.68, tz, 0.08);
      for (const sx of [-1, 1]) l.block(0.68 + sx * 0.07, tz, 0.012, 0.04, 0.03, 0.03, iron);
    }
    l.round(0.92, 0.1, 0.05, 0.05, 0.03, 0.34, panelWhite);
    for (let i = 1; i < 4; i++)
      l.round(0.92, 0.1, 0.052, 0.052, 0.03 + i * 0.085, 0.006, '#9fbcc6');
    // Reefer docks with trucks.
    l.block(0.5, 0.6, 0.84, 0.06, 0.03, 0.06, concreteDark);
    l.block(0.5, 0.63, 0.86, 0.1, 0.2, 0.012, tinDark);
    for (let i = 0; i < 5; i++) l.block(0.18 + i * 0.16, 0.572, 0.1, 0.006, 0.05, 0.12, '#59605f');
    for (const [i, tx] of [0.18, 0.5, 0.82].entries()) {
      truck(l, tx, 0.78, 'z', i === 1 ? '#c8443a' : panelWhite);
    }
    lamp(l, 0.06, 0.92, 0.03, 0.26);
    lamp(l, 0.94, 0.92, 0.03, 0.26);
    figure(l, 0.34, 0.66, 0.09, 1);
    figure(l, 0.66, 0.66, 0.09, 3);
  },

  // ---------------------------------------------------------------------------
  // Food tier 5: food tech campus (glass HQ, test kitchen, rooftop garden)
  // ---------------------------------------------------------------------------
  food_tech_campus(l) {
    l.base('#c7c2b6', 0.03);
    // Landscaped plaza.
    l.block(0.5, 0.82, 0.9, 0.3, 0.03, 0.004, '#d6d0c2');
    for (let i = 0; i < 3; i++) {
      l.block(0.2 + i * 0.3, 0.84, 0.16, 0.1, 0.034, 0.016, '#7d7a70');
      l.block(0.2 + i * 0.3, 0.84, 0.14, 0.08, 0.05, 0.004, grass);
      tree(l, 0.2 + i * 0.3, 0.84, 0.36, i);
    }
    // Stepped glass headquarters tower with green terraces.
    glassBlock(l, 0.3, 0.32, 0.4, 0.4, 0.03, 0.5, 5);
    l.block(0.3, 0.32, 0.42, 0.42, 0.53, 0.016, panelWhite);
    for (let i = 0; i < 6; i++) l.block(0.12 + i * 0.07, 0.53, 0.05, 0.03, 0.546, 0.03, leafy);
    glassBlock(l, 0.26, 0.26, 0.28, 0.28, 0.546, 0.5, 5);
    l.block(0.26, 0.26, 0.3, 0.3, 1.046, 0.016, panelWhite);
    glassBlock(l, 0.24, 0.24, 0.16, 0.16, 1.062, 0.28, 3);
    l.block(0.24, 0.24, 0.18, 0.18, 1.342, 0.02, panelWhite);
    l.round(0.24, 0.24, 0.004, 0.004, 1.362, 0.08, iron);
    // Rooftop greenhouse on the low wing.
    for (let i = 0; i < 4; i++)
      fruitTree(l, 0.42 + (i % 2) * 0.06, 0.4 + Math.floor(i / 2) * 0.08, i);
    // Production hall with solar roof.
    panelShed(l, 0.76, 0.3, 0.36, 0.44, 0.28, panelGrey);
    for (let r = 0; r < 4; r++) {
      const g = new THREE.BoxGeometry(0.3, 0.006, 0.08);
      g.rotateX(-0.4);
      l.shape(g, solar, 0.76, 0.16 + r * 0.1, 0.36);
    }
    for (let i = 0; i < 4; i++) {
      windowOn(l, 'z', 0.64 + i * 0.08, 0.52, 1, 0.05, 0.14, 0.1, {
        frame: '#5a6266',
        pane: glassBlue,
      });
    }
    l.block(0.76, 0.524, 0.22, 0.008, 0.06, 0.06, '#59605f');
    // Entrance canopy, sign, bikes, lamps, people.
    l.block(0.3, 0.56, 0.2, 0.08, 0.2, 0.012, panelWhite);
    for (const px of [0.22, 0.38]) l.block(px, 0.59, 0.008, 0.008, 0.03, 0.17, iron);
    l.block(0.3, 0.524, 0.16, 0.006, 0.12, 0.05, '#3f8a5c');
    l.block(0.3, 0.528, 0.12, 0.004, 0.13, 0.03, '#f4efe2', 1);
    truck(l, 0.86, 0.64, 'x', panelWhite);
    for (const px of [0.06, 0.62]) lamp(l, px, 0.66, 0.03, 0.26);
    for (const [i, [fx, fz]] of (
      [
        [0.26, 0.66],
        [0.32, 0.7],
        [0.46, 0.68],
        [0.52, 0.74],
        [0.7, 0.72],
      ] as const
    ).entries()) {
      figure(l, fx, fz, 0.034, i);
    }
  },

  // ---------------------------------------------------------------------------
  // Livestock tier 4: milking center (rotary parlour, freestall barn)
  // ---------------------------------------------------------------------------
  milking_center(l) {
    l.base(grassDark, 0.03);
    yard(l, 0.42, 0.36, 0.8, 0.6, concrete);
    // Long freestall barn with open curtain sides and a ridge vent.
    l.block(0.3, 0.3, 0.5, 0.36, 0.03, 0.02, concreteDark);
    for (let i = 0; i <= 6; i++) {
      for (const s of [-1, 1])
        l.block(0.06 + i * 0.08, 0.3 + s * 0.17, 0.01, 0.01, 0.05, 0.22, panelGrey);
    }
    for (const s of [-1, 1]) {
      l.block(0.3, 0.3 + s * 0.172, 0.5, 0.006, 0.05, 0.06, panelWhite);
      l.block(0.3, 0.3 + s * 0.172, 0.5, 0.004, 0.18, 0.08, '#e8eaea');
    }
    for (let i = 0; i < 6; i++) cow(l, 0.1 + i * 0.08, 0.26 + (i % 2) * 0.08, i, 'z');
    l.ridge(0.3, 0.3, 0.54, 0.4, 0.27, 0.16, 'x', tinDark);
    l.block(0.3, 0.3, 0.5, 0.06, 0.43, 0.02, panelWhite);
    l.ridge(0.3, 0.3, 0.52, 0.08, 0.45, 0.04, 'x', tin);
    // Rotary parlour: round hall with a conical roof and a lantern.
    l.round(0.76, 0.28, 0.13, 0.13, 0.03, 0.22, panelWhite);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const win = new THREE.BoxGeometry(0.05, 0.06, 0.006);
      win.rotateY(a);
      l.shape(win, glassBlue, 0.76 + Math.sin(a) * 0.132, 0.28 + Math.cos(a) * 0.132, 0.12, 1);
    }
    l.round(0.76, 0.28, 0.02, 0.15, 0.25, 0.16, slate);
    l.round(0.76, 0.28, 0.025, 0.025, 0.41, 0.05, panelWhite);
    l.round(0.76, 0.28, 0.002, 0.03, 0.46, 0.04, slate);
    // Feed tower silos (blue glass-lined).
    silo(l, 0.62, 0.62, 0.06, 0.92, '#3c5f86', 'dome');
    silo(l, 0.76, 0.62, 0.06, 0.82, '#3c5f86', 'dome');
    // Slurry store and milk tanker.
    l.round(0.9, 0.86, 0.07, 0.07, 0.03, 0.1, concreteDark);
    l.round(0.9, 0.86, 0.064, 0.064, 0.126, 0.004, '#5a4a32');
    const tank = new THREE.CylinderGeometry(0.03, 0.03, 0.17, 14);
    tank.rotateZ(Math.PI / 2);
    l.shape(tank, steel, 0.36, 0.6, 0.075);
    l.block(0.47, 0.6, 0.05, 0.05, 0.045, 0.05, navy);
    // Pasture.
    fence(l, 0.04, 0.72, 0.5, 0.72);
    for (let i = 0; i < 5; i++) cow(l, 0.1 + i * 0.08, 0.84 + (i % 2) * 0.05, i + 2, 'x');
    for (let i = 0; i < 3; i++) bale(l, 0.58 + i * 0.07, 0.86);
    lamp(l, 0.94, 0.5, 0.03, 0.26);
    figure(l, 0.56, 0.4, 0.03, 1);
    figure(l, 0.6, 0.46, 0.03, 5);
  },

  // ---------------------------------------------------------------------------
  // Livestock tier 5: bio-dairy complex (digesters, solar barns, tower silo)
  // ---------------------------------------------------------------------------
  bio_dairy_complex(l) {
    l.base(grassDark, 0.03);
    yard(l, 0.46, 0.4, 0.88, 0.7, concrete);
    // Two freestall barns with solar roofs.
    for (const bz of [0.16, 0.42]) {
      l.block(0.32, bz, 0.56, 0.2, 0.03, 0.02, concreteDark);
      for (let i = 0; i <= 7; i++) {
        for (const s of [-1, 1])
          l.block(0.06 + i * 0.074, bz + s * 0.095, 0.01, 0.01, 0.05, 0.2, panelGrey);
      }
      for (const s of [-1, 1]) l.block(0.32, bz + s * 0.097, 0.56, 0.004, 0.05, 0.06, panelWhite);
      l.ridge(0.32, bz, 0.6, 0.24, 0.25, 0.12, 'x', tinDark);
      for (let i = 0; i < 6; i++) {
        const g = new THREE.BoxGeometry(0.16, 0.006, 0.11);
        g.rotateX(-0.48);
        l.shape(g, solar, 0.1 + i * 0.09, bz + 0.055, 0.31);
      }
      for (let i = 0; i < 5; i++) cow(l, 0.1 + i * 0.1, bz, i + Math.round(bz * 10), 'z');
    }
    // Biogas digesters and a gas flare.
    digester(l, 0.78, 0.16, 0.1);
    digester(l, 0.78, 0.42, 0.08);
    l.round(0.94, 0.3, 0.008, 0.01, 0.03, 0.3, steel);
    l.round(0.94, 0.3, 0.012, 0.012, 0.33, 0.02, '#f2a33a', 1);
    // Very tall glass-lined tower silo and robot feed kitchen.
    silo(l, 0.62, 0.66, 0.065, 1.12, '#3c5f86', 'dome');
    panelShed(l, 0.82, 0.66, 0.22, 0.16, 0.18);
    windowOn(l, 'z', 0.82, 0.74, 1, 0.06, 0.1, 0.08, { frame: '#5a6266', pane: glassBlue });
    l.block(0.82, 0.66, 0.24, 0.18, 0.244, 0.014, tinDark);
    // Office with a green roof.
    glassBlock(l, 0.24, 0.68, 0.3, 0.14, 0.03, 0.24, 2);
    l.block(0.24, 0.68, 0.32, 0.16, 0.27, 0.02, panelWhite);
    l.block(0.24, 0.68, 0.28, 0.12, 0.29, 0.01, leafy);
    // Pasture strip with grazing herd.
    fence(l, 0.04, 0.8, 0.96, 0.8);
    for (let i = 0; i < 6; i++) cow(l, 0.1 + i * 0.15, 0.89 + (i % 2) * 0.03, i + 1, 'x');
    turbine(l, 0.1, 0.9, 0.7);
    lamp(l, 0.46, 0.58, 0.03, 0.26);
    figure(l, 0.5, 0.6, 0.03, 2);
    figure(l, 0.42, 0.62, 0.03, 4);
  },

  // ---------------------------------------------------------------------------
  // Fisheries tier 4: seafood processing (ice tower, plant, cold trucks)
  // ---------------------------------------------------------------------------
  seafood_processing(l) {
    l.base(concrete, 0.03);
    panelShed(l, 0.34, 0.3, 0.56, 0.36, 0.34, '#dce9ee');
    for (let i = 0; i < 6; i++) {
      windowOn(l, 'z', 0.12 + i * 0.088, 0.48, 1, 0.045, 0.2, 0.09, {
        frame: '#5a6266',
        pane: glassBlue,
      });
    }
    l.ridge(0.34, 0.3, 0.58, 0.38, 0.404, 0.12, 'x', navy);
    l.block(0.34, 0.488, 0.26, 0.008, 0.3, 0.06, navy);
    l.block(0.34, 0.492, 0.22, 0.004, 0.312, 0.036, '#f4efe2', 1);
    // Flake-ice tower with a hopper.
    l.block(0.78, 0.2, 0.16, 0.16, 0.03, 0.72, '#e7eef0');
    for (let i = 1; i < 6; i++) l.block(0.78, 0.2, 0.164, 0.164, 0.03 + i * 0.12, 0.008, '#a9c4ce');
    l.block(0.78, 0.2, 0.18, 0.18, 0.75, 0.02, navy);
    roofUnits(l, 0.78, 0.2, 0.77, 2);
    l.beam([0.78, 0.5, 0.28], [0.6, 0.3, 0.42], 0.016, steel);
    // Holding tanks and a pair of cold trucks.
    for (let i = 0; i < 4; i++) {
      const tx = 0.12 + i * 0.12;
      l.round(tx, 0.66, 0.045, 0.045, 0.03, 0.06, '#cfd4d0');
      l.round(tx, 0.66, 0.04, 0.04, 0.088, 0.003, water);
    }
    pond(l, 0.74, 0.62, 0.3, 0.2, concrete, false);
    truck(l, 0.3, 0.86, 'x', panelWhite);
    truck(l, 0.66, 0.86, 'x', '#dce9ee');
    // Stacked fish crates.
    for (let i = 0; i < 6; i++) {
      l.block(
        0.6 + (i % 3) * 0.04,
        0.48 + Math.floor(i / 3) * 0.03,
        0.035,
        0.025,
        0.03,
        0.02,
        '#3c6f9a',
      );
    }
    lamp(l, 0.06, 0.8, 0.03, 0.26);
    lamp(l, 0.94, 0.8, 0.03, 0.26);
    figure(l, 0.5, 0.56, 0.03, 3);
    figure(l, 0.56, 0.6, 0.03, 0);
  },

  // ---------------------------------------------------------------------------
  // Fisheries tier 5: marine institute (aquarium dome, lab tower, wind)
  // ---------------------------------------------------------------------------
  marine_institute(l) {
    l.base('#c7c2b6', 0.03);
    // Lab tower with sun fins.
    glassBlock(l, 0.24, 0.26, 0.28, 0.32, 0.03, 0.96, 8);
    for (let i = 0; i < 7; i++)
      l.block(0.11 + i * 0.044, 0.425, 0.006, 0.016, 0.06, 0.92, panelWhite);
    l.block(0.24, 0.26, 0.3, 0.34, 0.99, 0.02, panelWhite);
    roofUnits(l, 0.24, 0.2, 1.01, 3);
    l.round(0.32, 0.36, 0.004, 0.004, 1.01, 0.1, iron);
    l.dome(0.32, 0.36, 0.02, 0.02, 1.11, 0.02, panelWhite);
    // Aquarium dome with ribbed glazing.
    l.round(0.72, 0.3, 0.2, 0.2, 0.03, 0.08, panelWhite);
    l.dome(0.72, 0.3, 0.19, 0.19, 0.11, 0.3, glassBlue);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      let prev: [number, number, number] | null = null;
      for (let k = 0; k <= 4; k++) {
        const phi = (k / 4) * (Math.PI / 2) * 0.95;
        const rr = 0.19 * Math.cos(phi) + 0.003;
        const p: [number, number, number] = [
          0.72 + Math.sin(a) * rr,
          0.11 + 0.3 * Math.sin(phi) + 0.004,
          0.3 + Math.cos(a) * rr,
        ];
        if (prev) l.beam(prev, p, 0.008, panelWhite);
        prev = p;
      }
    }
    l.round(0.72, 0.3, 0.03, 0.03, 0.41, 0.03, panelWhite);
    // Link bridge between tower and dome.
    glassBlock(l, 0.47, 0.3, 0.12, 0.08, 0.2, 0.08, 1);
    // Outdoor research tanks and a lagoon with a jetty.
    for (let i = 0; i < 3; i++) {
      l.round(0.1 + i * 0.12, 0.6, 0.05, 0.05, 0.03, 0.07, '#cfd4d0');
      l.round(0.1 + i * 0.12, 0.6, 0.044, 0.044, 0.098, 0.003, water);
    }
    pond(l, 0.62, 0.78, 0.6, 0.3, '#d9d3c4', false);
    l.block(0.5, 0.72, 0.04, 0.2, 0.044, 0.01, '#8a6342');
    const hull = new THREE.BoxGeometry(0.12, 0.03, 0.045);
    l.shape(hull, panelWhite, 0.7, 0.78, 0.04);
    l.block(0.68, 0.78, 0.04, 0.03, 0.07, 0.03, navy);
    turbine(l, 0.9, 0.1, 0.72);
    for (const px of [0.06, 0.4]) lamp(l, px, 0.86, 0.03, 0.26);
    for (const [i, [fx, fz]] of (
      [
        [0.3, 0.5],
        [0.36, 0.52],
        [0.46, 0.46],
        [0.18, 0.8],
      ] as const
    ).entries()) {
      figure(l, fx, fz, 0.03, i);
    }
    tree(l, 0.16, 0.9, 0.36, 2);
  },
};
