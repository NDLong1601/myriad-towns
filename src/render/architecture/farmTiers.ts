import * as THREE from 'three';
import { type Lot, type Recipes } from './lot';
import { figure, hipRoof, lamp, shadeHex, tree, windowOn } from './theatreTiers';

// Group 5 (2×2, food): agriculture, food processing, livestock and fisheries, three tiers each.
//   smallholding  -> farmstead      -> agri_estate
//   cider_press   -> brewery        -> food_cannery
//   sheep_fold    -> cattle_barn    -> dairy_cooperative
//   fish_ponds    -> fish_hatchery  -> aquaculture_center

const grass = '#7f9c53';
const grassDark = '#6c8a47';
const soil = '#7a5a3c';
const soilLight = '#93704c';
const gravel = '#aaa290';
const concrete = '#bdb8ac';
const stone = '#b9ad95';
const stoneLight = '#d3c8b0';
const plaster = '#ece2cc';
const timber = '#5c3f27';
const timberDark = '#3b2817';
const plank = '#8a6342';
const barnRed = '#9e3528';
const trim = '#efe7d6';
const thatch = '#b08d55';
const shingle = '#5b4f48';
const slate = '#4b5a67';
const tin = '#8f9a9e';
const tinDark = '#6f7a7e';
const steel = '#b8c0c2';
const brick = '#a65038';
const brickDark = '#83402d';
const copperKettle = '#c27a43';
const water = '#4a8aa3';
const waterDeep = '#3b7088';
const reed = '#6f8f45';
const hay = '#d8b862';
const glassGreen = '#bcd9cf';
const iron = '#2c3134';
const crops = ['#7da23f', '#a8b84a', '#c9a54a', '#5f8f3a'] as const;
const apples = ['#c43a2c', '#d9a23a', '#9fb33c'] as const;

const pick = <T>(list: readonly T[], i: number): T => list[i % list.length] as T;

/** Gambrel (barn) roof: a five-point profile extruded along x or z, with eave boards. */
export function gambrel(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  along: 'x' | 'z',
  color: string,
): void {
  const length = (along === 'x' ? w * l.spanX : d * l.spanZ) + 0.04;
  const half = ((along === 'x' ? d * l.spanZ : w * l.spanX) + 0.04) / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0);
  s.lineTo(half, 0);
  s.lineTo(half * 0.7, h * 0.62);
  s.lineTo(0, h);
  s.lineTo(-half * 0.7, h * 0.62);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false });
  g.translate(0, 0, -length / 2);
  if (along === 'x') g.rotateY(Math.PI / 2);
  g.computeVertexNormals();
  l.shape(g, color, x, z, y);
  // Seam lines (standing seams) across the roof.
  const seams = Math.round(length / 0.09);
  for (let i = 1; i < seams; i++) {
    const t = -length / 2 + (i * length) / seams;
    const pts: [number, number][] = [
      [-half, 0],
      [-half * 0.7, h * 0.62],
      [0, h],
      [half * 0.7, h * 0.62],
      [half, 0],
    ];
    for (let k = 0; k < pts.length - 1; k++) {
      const [a0, a1] = pts[k]!;
      const [b0, b1] = pts[k + 1]!;
      const P = (u: number, v: number): [number, number, number] =>
        along === 'x'
          ? [x + t / l.spanX, y + v + 0.004, z + u / l.spanZ]
          : [x + u / l.spanX, y + v + 0.004, z + t / l.spanZ];
      l.beam(P(a0, a1), P(b0, b1), 0.006, shadeHex(color, 0.8));
    }
  }
}

/** Shed (lean-to) roof: a single sloped slab from high edge to low edge. */
export function shedRoof(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  rise: number,
  color: string,
): void {
  const g = new THREE.BoxGeometry(w * l.spanX + 0.03, 0.014, Math.hypot(d * l.spanZ + 0.03, rise));
  g.rotateX(Math.atan2(rise, d * l.spanZ));
  l.shape(g, color, x, z, y + rise / 2);
}

/** Silo with a hooped shaft and a domed or conical cap. */
export function silo(
  l: Lot,
  x: number,
  z: number,
  r: number,
  h: number,
  color: string,
  cap: 'dome' | 'cone',
): void {
  l.round(x, z, r * 1.05, r * 1.08, 0.03, 0.03, stone);
  l.round(x, z, r, r, 0.06, h, color);
  for (let i = 1; i < 6; i++)
    l.round(x, z, r + 0.002, r + 0.002, 0.06 + (h * i) / 6, 0.006, shadeHex(color, 0.75));
  if (cap === 'dome') l.dome(x, z, r * 1.02, r * 1.02, 0.06 + h, r * 1.4, shadeHex(color, 1.05));
  else l.round(x, z, 0.004, r * 1.12, 0.06 + h, r * 1.6, shadeHex(color, 0.9));
  // Ladder.
  l.block(x + r * 0.98, z, 0.004, 0.016, 0.06, h, iron);
}

/** Post-and-rail fence along a straight run. */
export function fence(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y = 0.03,
  color = plank,
): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const n = Math.max(1, Math.round(len / 0.11));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    l.block(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.007, 0.007, y, 0.05, timberDark);
  }
  for (const ry of [0.022, 0.042]) l.beam([x0, y + ry, z0], [x1, y + ry, z1], 0.005, color);
}

/** Dry-stone wall run. */
export function stoneWall(l: Lot, x0: number, z0: number, x1: number, z1: number): void {
  l.beam([x0, 0.05, z0], [x1, 0.05, z1], 0.036, stone);
  l.beam([x0, 0.074, z0], [x1, 0.074, z1], 0.02, stoneLight);
}

/** Ploughed rows of crops inside a rectangle. */
export function cropRows(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  rows: number,
  color: string,
  along: 'x' | 'z' = 'x',
): void {
  l.block(x, z, w, d, 0.03, 0.006, soil);
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.5) / rows - 0.5;
    if (along === 'x') {
      l.block(x, z + t * d, w * 0.96, (d / rows) * 0.42, 0.036, 0.008, soilLight);
      l.block(x, z + t * d, w * 0.94, (d / rows) * 0.3, 0.044, 0.016, color);
    } else {
      l.block(x + t * w, z, (w / rows) * 0.42, d * 0.96, 0.036, 0.008, soilLight);
      l.block(x + t * w, z, (w / rows) * 0.3, d * 0.94, 0.044, 0.016, color);
    }
  }
}

/** Fruit tree: short trunk, round canopy, a few fruit. */
export function fruitTree(l: Lot, x: number, z: number, seed: number): void {
  l.round(x, z, 0.005, 0.008, 0.03, 0.07, '#6b4e36');
  const g = new THREE.IcosahedronGeometry(0.06, 1);
  g.scale(1, 0.8, 1);
  l.shape(g, seed % 2 ? '#5b8c3e' : '#4f7f3a', x, z, 0.13);
  for (let i = 0; i < 3; i++) {
    const a = seed + i * 2.1;
    l.shape(
      new THREE.SphereGeometry(0.009, 6, 4),
      pick(apples, seed),
      x + Math.sin(a) * 0.025,
      z + Math.cos(a) * 0.025,
      0.12 + (i % 2) * 0.02,
    );
  }
}

export function sheep(l: Lot, x: number, z: number, seed: number): void {
  const body = new THREE.SphereGeometry(0.02, 8, 6);
  body.scale(1.3, 0.85, 0.9);
  const turn = seed * 1.3;
  body.rotateY(turn);
  l.shape(body, '#efeadf', x, z, 0.055);
  l.shape(
    new THREE.SphereGeometry(0.009, 6, 5),
    '#3a3330',
    x + Math.cos(turn) * 0.016,
    z - Math.sin(turn) * 0.016,
    0.06,
  );
  for (const [dx, dz] of [
    [-0.008, -0.006],
    [0.008, 0.006],
  ] as const) {
    l.block(x + dx, z + dz, 0.004, 0.004, 0.03, 0.016, '#3a3330');
  }
}

export function cow(l: Lot, x: number, z: number, seed: number, along: 'x' | 'z' = 'x'): void {
  const [w, d] = along === 'x' ? [0.05, 0.022] : [0.022, 0.05];
  const coat = seed % 3 === 0 ? '#7b4b2e' : '#f1ece2';
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    l.block(x + dx * w * 0.32, z + dz * d * 0.3, 0.006, 0.006, 0.03, 0.03, '#2d2623');
  }
  l.block(x, z, w, d, 0.06, 0.03, coat);
  if (coat !== '#7b4b2e') l.block(x - w * 0.12, z, w * 0.34, d * 1.04, 0.07, 0.016, '#2d2623');
  const hx = along === 'x' ? x + w * 0.58 : x;
  const hz = along === 'x' ? z : z + d * 0.58;
  l.block(hx, hz, 0.018, 0.016, 0.07, 0.02, coat);
  l.block(hx, hz, 0.02, 0.006, 0.09, 0.004, '#e8dcc0');
}

export function chicken(l: Lot, x: number, z: number, seed: number): void {
  l.shape(new THREE.SphereGeometry(0.008, 6, 4), seed % 2 ? '#f2eee4' : '#a8673a', x, z, 0.042);
  l.block(x + 0.006, z, 0.004, 0.004, 0.048, 0.006, '#c8392c');
}

/** Round hay bale lying on its side. */
export function bale(l: Lot, x: number, z: number, along: 'x' | 'z' = 'x'): void {
  const g = new THREE.CylinderGeometry(0.026, 0.026, 0.04, 10);
  g.rotateZ(Math.PI / 2);
  if (along === 'z') g.rotateY(Math.PI / 2);
  l.shape(g, hay, x, z, 0.056);
}

/** Small tractor with big rear wheels. */
export function tractor(l: Lot, x: number, z: number, color = '#3d7a3f'): void {
  l.block(x, z, 0.06, 0.03, 0.05, 0.03, color);
  l.block(x - 0.012, z, 0.024, 0.026, 0.08, 0.03, color);
  l.block(x - 0.012, z, 0.028, 0.03, 0.11, 0.004, iron);
  l.block(x + 0.028, z, 0.004, 0.004, 0.08, 0.025, iron);
  for (const [dx, r] of [
    [-0.018, 0.022],
    [0.022, 0.013],
  ] as const) {
    for (const dz of [-0.022, 0.022]) {
      const g = new THREE.CylinderGeometry(r, r, 0.012, 10);
      g.rotateX(Math.PI / 2);
      l.shape(g, '#222222', x + dx, z + dz, 0.03 + r);
    }
  }
}

/** Box truck. */
export function truck(l: Lot, x: number, z: number, along: 'x' | 'z', color = '#d4cfc3'): void {
  const box = (dx: number, w: number, h: number, y: number, c: string, glow = 0): void => {
    if (along === 'x') l.block(x + dx, z, w, 0.05, y, h, c, glow);
    else l.block(x, z + dx, 0.05, w, y, h, c, glow);
  };
  box(-0.02, 0.1, 0.07, 0.045, color);
  box(0.06, 0.05, 0.05, 0.045, '#2f5f86');
  box(0.084, 0.006, 0.02, 0.07, '#a9c6d2');
  for (const dx of [-0.05, 0.06]) {
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8);
      g.rotateX(Math.PI / 2);
      if (along === 'z') g.rotateY(Math.PI / 2);
      if (along === 'x') l.shape(g, '#222222', x + dx, z + s * 0.026, 0.042);
      else l.shape(g, '#222222', x + s * 0.026, z + dx, 0.042);
    }
  }
}

export function barrel(l: Lot, x: number, z: number, y = 0.03): void {
  l.round(x, z, 0.014, 0.015, y, 0.04, '#7a5232');
  l.round(x, z, 0.0155, 0.0155, y + 0.008, 0.004, iron);
  l.round(x, z, 0.0155, 0.0155, y + 0.028, 0.004, iron);
}

export function crate(l: Lot, x: number, z: number, y: number, fruit?: string): void {
  l.block(x, z, 0.03, 0.022, y, 0.018, plank);
  if (fruit) l.block(x, z, 0.026, 0.018, y + 0.018, 0.004, fruit);
}

/** Pond: stone or earth rim, water at a slightly lower level, optional reeds. */
export function pond(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  rim = stone,
  reeds = true,
): void {
  l.block(x, z, w, d, 0.03, 0.01, waterDeep);
  l.block(x, z, w * 0.94, d * 0.9, 0.04, 0.004, water);
  for (const s of [-1, 1]) {
    l.block(x, z + (s * (d + 0.015)) / 2, w + 0.03, 0.015, 0.03, 0.02, rim);
    l.block(x + (s * (w + 0.015)) / 2, z, 0.015, d + 0.03, 0.03, 0.02, rim);
  }
  if (reeds) {
    for (let i = 0; i < 5; i++) {
      l.block(
        x - w / 2 + 0.012 + i * 0.008,
        z + d / 2 - 0.012,
        0.003,
        0.003,
        0.044,
        0.03 + (i % 2) * 0.01,
        reed,
      );
    }
  }
}

/** Gravel or dirt yard. */
export function yard(l: Lot, x: number, z: number, w: number, d: number, color = gravel): void {
  l.block(x, z, w, d, 0.03, 0.004, color);
}

/** Farmhouse: stone ground floor, timber upper storey, hipped roof, chimney. */
export function farmhouse(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  roof: string,
): void {
  l.block(x, z, w + 0.01, d + 0.01, 0.03, 0.02, stone);
  l.block(x, z, w, d, 0.05, h * 0.5, stoneLight);
  l.block(x, z, w + 0.006, d + 0.006, 0.05 + h * 0.5, h * 0.5, plaster);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1])
      l.block(x + sx * w * 0.5, z + sz * d * 0.5, 0.012, 0.012, 0.05 + h * 0.5, h * 0.5, timber);
  }
  hipRoof(l, x, z, w + 0.05, d + 0.05, 0.05 + h, h * 0.55, roof, 4);
  l.block(x + w * 0.3, z - d * 0.2, 0.036, 0.036, 0.05 + h * 0.6, h * 0.75, brickDark);
  windowOn(l, 'z', x - w * 0.25, z + d / 2, 1, 0.04, 0.05 + h * 0.62, h * 0.24, {
    frame: timberDark,
  });
  windowOn(l, 'z', x + w * 0.25, z + d / 2, 1, 0.04, 0.05 + h * 0.62, h * 0.24, {
    frame: timberDark,
  });
  windowOn(l, 'z', x + w * 0.25, z + d / 2, 1, 0.04, 0.05 + h * 0.13, h * 0.24, {
    frame: timberDark,
  });
  windowOn(l, 'x', z, x + w / 2, 1, 0.04, 0.05 + h * 0.62, h * 0.24, { frame: timberDark });
  windowOn(l, 'x', z, x - w / 2, -1, 0.04, 0.05 + h * 0.62, h * 0.24, { frame: timberDark });
  // Door with a little porch roof.
  l.block(x - w * 0.22, z + d / 2 + 0.004, 0.04, 0.008, 0.05, h * 0.36, timberDark);
  shedRoof(l, x - w * 0.22, z + d / 2 + 0.025, 0.07, 0.05, 0.05 + h * 0.4, -0.02, roof);
}

/** Barn: board-and-batten walls, big doors, gambrel roof, hay loft door. */
export function barn(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  roof: string,
  wall = barnRed,
): void {
  l.block(x, z, w + 0.01, d + 0.01, 0.03, 0.025, stone);
  l.block(x, z, w, d, 0.055, h, wall);
  const boards = Math.round((w * l.spanX) / 0.035);
  for (let i = 0; i < boards; i++) {
    const bx = x - w / 2 + ((i + 0.5) * w) / boards;
    l.block(bx, z + d / 2 + 0.002, 0.004, 0.004, 0.055, h, shadeHex(wall, 0.8));
    l.block(bx, z - d / 2 - 0.002, 0.004, 0.004, 0.055, h, shadeHex(wall, 0.8));
  }
  // Gable-end doors with white X bracing on the +z face.
  const dw = w * 0.42;
  l.block(x, z + d / 2 + 0.005, dw + 0.016, 0.008, 0.055, h * 0.62 + 0.012, trim);
  for (const s of [-1, 1]) {
    const cx = x + (s * dw) / 4;
    l.block(cx, z + d / 2 + 0.008, dw / 2 - 0.006, 0.006, 0.055, h * 0.62, shadeHex(wall, 0.92));
    l.beam(
      [cx - dw / 4 + 0.006, 0.06, z + d / 2 + 0.012],
      [cx + dw / 4 - 0.006, 0.055 + h * 0.6, z + d / 2 + 0.012],
      0.006,
      trim,
    );
    l.beam(
      [cx + dw / 4 - 0.006, 0.06, z + d / 2 + 0.012],
      [cx - dw / 4 + 0.006, 0.055 + h * 0.6, z + d / 2 + 0.012],
      0.006,
      trim,
    );
  }
  l.block(x, z + d / 2 + 0.006, 0.07, 0.008, 0.055 + h * 0.75, h * 0.2, trim);
  l.block(x, z + d / 2 + 0.01, 0.054, 0.006, 0.06 + h * 0.75, h * 0.17, '#3a2a1e');
  // Gable triangle (gambrel profile) on both ends.
  const half = (w * l.spanX) / 2;
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(-half, 0);
    sh.lineTo(half, 0);
    sh.lineTo(half * 0.7, h * 0.36);
    sh.lineTo(0, h * 0.58);
    sh.lineTo(-half * 0.7, h * 0.36);
    sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    if (s < 0) g.rotateY(Math.PI);
    l.shape(g, wall, x, z + s * (d / 2 + 0.001), 0.055 + h);
  }
  gambrel(l, x, z, w, d, 0.055 + h, h * 0.6, 'z', roof);
  // Cupola vent on the ridge.
  l.block(x, z, 0.04, 0.04, 0.055 + h * 1.55, 0.04, trim);
  hipRoof(l, x, z, 0.05, 0.05, 0.055 + h * 1.55 + 0.04, 0.03, roof, 2);
  l.round(x, z, 0.002, 0.003, 0.055 + h * 1.55 + 0.07, 0.04, iron);
}

export const farmTiers: Recipes = {
  // ===========================================================================
  // AGRICULTURE: smallholding -> farmstead -> agri_estate
  // ===========================================================================
  smallholding(l) {
    l.base(grass, 0.03);
    yard(l, 0.3, 0.3, 0.46, 0.44, '#a99673');
    // Thatched cottage with whitewashed walls.
    l.block(0.3, 0.26, 0.34, 0.2, 0.03, 0.02, stone);
    l.block(0.3, 0.26, 0.32, 0.18, 0.05, 0.16, plaster);
    for (const sx of [-1, 1]) l.block(0.3 + sx * 0.16, 0.26, 0.014, 0.19, 0.05, 0.16, timber);
    l.block(0.3, 0.26 + 0.09, 0.33, 0.012, 0.13, 0.012, timber);
    hipRoof(l, 0.3, 0.26, 0.38, 0.26, 0.21, 0.17, thatch, 5);
    l.block(0.4, 0.22, 0.03, 0.03, 0.2, 0.18, stone);
    windowOn(l, 'z', 0.22, 0.35, 1, 0.04, 0.09, 0.06, { frame: timberDark });
    windowOn(l, 'z', 0.38, 0.35, 1, 0.04, 0.09, 0.06, { frame: timberDark });
    l.block(0.3, 0.354, 0.04, 0.008, 0.05, 0.1, timberDark);
    // Lean-to tool shed.
    l.block(0.08, 0.26, 0.08, 0.14, 0.03, 0.1, plank);
    shedRoof(l, 0.08, 0.26, 0.09, 0.16, 0.13, -0.03, shingle);
    // Kitchen garden: rows of vegetables, scarecrow, well.
    cropRows(l, 0.72, 0.28, 0.4, 0.36, 7, crops[0]);
    l.block(0.72, 0.28, 0.008, 0.008, 0.03, 0.14, timber);
    l.block(0.72, 0.28, 0.06, 0.006, 0.13, 0.006, timber);
    l.round(0.72, 0.28, 0.012, 0.016, 0.1, 0.04, '#9d5a3a');
    l.shape(new THREE.SphereGeometry(0.01, 6, 4), hay, 0.72, 0.28, 0.15);
    l.round(0.72, 0.28, 0.003, 0.02, 0.158, 0.012, '#6b4e36');
    cropRows(l, 0.72, 0.72, 0.4, 0.4, 6, crops[3], 'z');
    // Well with a little roof and bucket.
    l.round(0.34, 0.6, 0.04, 0.042, 0.03, 0.05, stone);
    l.round(0.34, 0.6, 0.03, 0.03, 0.08, 0.002, water);
    for (const sx of [-1, 1]) l.block(0.34 + sx * 0.035, 0.6, 0.008, 0.008, 0.08, 0.09, timber);
    hipRoof(l, 0.34, 0.6, 0.1, 0.07, 0.17, 0.04, shingle, 2);
    l.round(0.36, 0.6, 0.008, 0.007, 0.09, 0.014, plank);
    // Orchard and hens.
    fruitTree(l, 0.12, 0.62, 0);
    fruitTree(l, 0.14, 0.84, 1);
    fruitTree(l, 0.34, 0.86, 2);
    for (let i = 0; i < 5; i++) chicken(l, 0.18 + i * 0.03, 0.46 + (i % 2) * 0.02, i);
    fence(l, 0.04, 0.96, 0.96, 0.96);
    fence(l, 0.52, 0.06, 0.52, 0.5);
    figure(l, 0.6, 0.5, 0.03, 3);
    bale(l, 0.48, 0.6);
  },

  farmstead(l) {
    l.base(grass, 0.03);
    yard(l, 0.36, 0.42, 0.66, 0.36);
    barn(l, 0.24, 0.32, 0.36, 0.42, 0.28, slate);
    farmhouse(l, 0.68, 0.24, 0.3, 0.22, 0.26, '#7e3b2e');
    // Stave silo with a domed cap beside the barn.
    silo(l, 0.5, 0.14, 0.06, 0.5, '#c9c1b0', 'dome');
    // Open hay shed.
    for (const [px, pz] of [
      [0.56, 0.48],
      [0.84, 0.48],
      [0.56, 0.62],
      [0.84, 0.62],
    ] as const) {
      l.block(px, pz, 0.012, 0.012, 0.03, 0.16, timber);
    }
    shedRoof(l, 0.7, 0.55, 0.32, 0.18, 0.19, -0.03, tin);
    for (let i = 0; i < 4; i++) bale(l, 0.6 + i * 0.07, 0.52, 'z');
    for (let i = 0; i < 3; i++) bale(l, 0.63 + i * 0.07, 0.6, 'z');
    // Fields: wheat and cabbages in long strips.
    cropRows(l, 0.25, 0.8, 0.44, 0.28, 8, crops[2]);
    cropRows(l, 0.74, 0.82, 0.42, 0.24, 6, crops[1], 'z');
    tractor(l, 0.48, 0.62);
    fence(l, 0.04, 0.64, 0.96, 0.64);
    fence(l, 0.5, 0.66, 0.5, 0.96);
    for (let i = 0; i < 4; i++) chicken(l, 0.42 + i * 0.03, 0.44, i);
    figure(l, 0.36, 0.56, 0.03, 1);
    figure(l, 0.6, 0.38, 0.03, 4);
    tree(l, 0.94, 0.08, 0.5, 2);
    l.round(0.88, 0.38, 0.03, 0.034, 0.03, 0.04, stone);
  },

  agri_estate(l) {
    l.base(grassDark, 0.03);
    yard(l, 0.4, 0.4, 0.76, 0.42, concrete);
    barn(l, 0.22, 0.3, 0.38, 0.46, 0.36, slate);
    // Twin steel grain bins with conical caps and a grain leg (elevator tower).
    silo(l, 0.52, 0.14, 0.07, 0.56, steel, 'cone');
    silo(l, 0.7, 0.14, 0.07, 0.56, steel, 'cone');
    l.block(0.61, 0.24, 0.04, 0.04, 0.03, 0.92, tinDark);
    l.block(0.61, 0.24, 0.06, 0.06, 0.95, 0.05, tin);
    l.beam([0.61, 0.92, 0.24], [0.52, 0.72, 0.14], 0.012, tinDark);
    l.beam([0.61, 0.92, 0.24], [0.7, 0.72, 0.14], 0.012, tinDark);
    l.beam([0.61, 0.5, 0.24], [0.8, 0.12, 0.32], 0.012, tinDark);
    // Grain dryer and machine shed with a corrugated roof.
    l.block(0.86, 0.3, 0.14, 0.12, 0.03, 0.22, '#c8c9c2');
    for (let i = 0; i < 5; i++) l.block(0.86, 0.364, 0.12, 0.004, 0.06 + i * 0.035, 0.008, tinDark);
    l.block(0.6, 0.48, 0.36, 0.16, 0.03, 0.2, '#b9bdb6');
    for (let i = 0; i < 4; i++) {
      l.block(0.46 + i * 0.09, 0.562, 0.07, 0.006, 0.03, 0.15, '#4d5458');
    }
    gambrel(l, 0.6, 0.48, 0.36, 0.16, 0.23, 0.07, 'x', tin);
    // Glasshouses with framed panes.
    for (const gx of [0.2, 0.42]) {
      l.block(gx, 0.74, 0.18, 0.26, 0.03, 0.12, glassGreen);
      for (let i = 0; i <= 6; i++)
        l.block(gx, 0.61 + i * 0.043, 0.182, 0.006, 0.03, 0.12, '#e8eee9');
      for (const s of [-1, 1]) l.block(gx + s * 0.09, 0.74, 0.006, 0.262, 0.03, 0.12, '#e8eee9');
      l.ridge(gx, 0.74, 0.19, 0.27, 0.15, 0.07, 'z', '#cfe4dc');
      l.block(gx, 0.74, 0.008, 0.27, 0.215, 0.008, '#e8eee9');
      for (let i = 0; i < 4; i++)
        l.block(gx - 0.05 + (i % 2) * 0.1, 0.66 + i * 0.05, 0.05, 0.03, 0.03, 0.03, crops[i % 4]);
    }
    // Big field with combine harvester.
    cropRows(l, 0.78, 0.78, 0.38, 0.36, 9, crops[2], 'z');
    l.block(0.76, 0.66, 0.08, 0.05, 0.05, 0.06, '#c43a2c');
    l.block(0.76, 0.64, 0.12, 0.02, 0.04, 0.02, '#8e2a20');
    l.block(0.78, 0.68, 0.03, 0.03, 0.11, 0.03, '#a9c6d2');
    truck(l, 0.4, 0.56, 'x', '#d8b13e');
    tractor(l, 0.84, 0.52, '#c43a2c');
    lamp(l, 0.06, 0.56, 0.03, 0.24);
    figure(l, 0.5, 0.36, 0.03, 2);
    figure(l, 0.32, 0.56, 0.03, 5);
    fence(l, 0.04, 0.96, 0.58, 0.96);
  },

  // ===========================================================================
  // FOOD: cider_press -> brewery -> food_cannery
  // ===========================================================================
  cider_press(l) {
    l.base(grass, 0.03);
    yard(l, 0.42, 0.42, 0.6, 0.5, '#a99673');
    // Timber-framed press house with a big screw press under an open bay.
    l.block(0.36, 0.3, 0.44, 0.26, 0.03, 0.02, stone);
    l.block(0.28, 0.3, 0.28, 0.24, 0.05, 0.2, plaster);
    for (let i = 0; i <= 4; i++)
      l.block(0.14 + i * 0.07, 0.3 + 0.122, 0.012, 0.006, 0.05, 0.2, timber);
    l.block(0.28, 0.424, 0.29, 0.006, 0.15, 0.012, timber);
    l.beam([0.14, 0.05, 0.424], [0.21, 0.15, 0.424], 0.008, timber);
    l.beam([0.42, 0.05, 0.424], [0.35, 0.15, 0.424], 0.008, timber);
    windowOn(l, 'z', 0.21, 0.42, 1, 0.04, 0.17, 0.05, { frame: timberDark });
    windowOn(l, 'z', 0.35, 0.42, 1, 0.04, 0.17, 0.05, { frame: timberDark });
    l.block(0.28, 0.43, 0.05, 0.008, 0.05, 0.1, timberDark);
    l.ridge(0.36, 0.3, 0.5, 0.32, 0.25, 0.16, 'x', shingle);
    for (const px of [0.48, 0.56]) {
      for (const pz of [0.2, 0.4]) l.block(px, pz, 0.014, 0.014, 0.05, 0.2, timber);
    }
    l.block(0.52, 0.3, 0.1, 0.1, 0.05, 0.03, plank);
    l.round(0.52, 0.3, 0.035, 0.035, 0.08, 0.04, '#7a5232');
    l.round(0.52, 0.3, 0.006, 0.006, 0.12, 0.08, iron);
    l.block(0.52, 0.3, 0.1, 0.012, 0.18, 0.012, timberDark);
    // Barrels, apple crates and a cart.
    for (let i = 0; i < 5; i++) barrel(l, 0.18 + i * 0.04, 0.5);
    for (let i = 0; i < 3; i++) barrel(l, 0.2 + i * 0.04, 0.5, 0.07);
    for (let i = 0; i < 6; i++)
      crate(l, 0.5 + (i % 3) * 0.035, 0.48 + Math.floor(i / 3) * 0.03, 0.03, pick(apples, i));
    crate(l, 0.535, 0.495, 0.052, apples[0]);
    l.block(0.72, 0.5, 0.1, 0.06, 0.06, 0.03, plank);
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.028, 0.028, 0.008, 10);
      g.rotateX(Math.PI / 2);
      l.shape(g, timberDark, 0.72, 0.5 + s * 0.034, 0.058);
    }
    l.beam([0.77, 0.07, 0.5], [0.86, 0.04, 0.5], 0.006, timber);
    // Orchard rows.
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) fruitTree(l, 0.12 + c * 0.19, 0.68 + r * 0.12, r + c);
    for (let i = 0; i < 4; i++) l.block(0.2 + i * 0.15, 0.74, 0.024, 0.018, 0.03, 0.016, plank);
    figure(l, 0.62, 0.42, 0.03, 0);
    figure(l, 0.4, 0.8, 0.03, 3);
    fence(l, 0.04, 0.6, 0.96, 0.6);
    tree(l, 0.88, 0.16, 0.5, 1);
  },

  brewery(l) {
    l.base('#9a9284', 0.03);
    yard(l, 0.5, 0.86, 0.92, 0.18, '#b3ab9b');
    // Brick brewhouse with arched windows.
    l.block(0.36, 0.38, 0.5, 0.42, 0.03, 0.025, stone);
    l.block(0.36, 0.38, 0.48, 0.4, 0.055, 0.34, brick);
    l.block(0.36, 0.38, 0.49, 0.41, 0.2, 0.012, stoneLight);
    for (const wx of [0.2, 0.3, 0.42, 0.52])
      windowOn(l, 'z', wx, 0.58, 1, 0.045, 0.24, 0.1, { arched: true, frame: stoneLight });
    for (const wx of [0.2, 0.52])
      windowOn(l, 'z', wx, 0.58, 1, 0.045, 0.08, 0.08, { frame: stoneLight });
    for (const wz of [0.26, 0.38, 0.5])
      windowOn(l, 'x', wz, 0.12, -1, 0.045, 0.24, 0.1, { arched: true, frame: stoneLight });
    l.block(0.36, 0.585, 0.1, 0.01, 0.055, 0.13, timberDark);
    l.block(0.36, 0.59, 0.14, 0.008, 0.19, 0.03, '#2f4a3a');
    l.block(0.36, 0.594, 0.1, 0.004, 0.196, 0.018, '#e7cf88');
    hipRoof(l, 0.36, 0.38, 0.54, 0.46, 0.395, 0.2, slate, 5);
    // Malt kiln with a pyramid roof and a cowl vent.
    l.block(0.72, 0.26, 0.2, 0.2, 0.03, 0.46, brickDark);
    windowOn(l, 'z', 0.72, 0.36, 1, 0.05, 0.3, 0.08, { frame: stoneLight });
    l.block(0.72, 0.26, 0.21, 0.21, 0.49, 0.014, stoneLight);
    hipRoof(l, 0.72, 0.26, 0.24, 0.24, 0.504, 0.22, slate, 4);
    l.round(0.72, 0.26, 0.02, 0.03, 0.72, 0.06, '#e8e2d6');
    l.block(0.72, 0.28, 0.035, 0.02, 0.76, 0.03, '#e8e2d6');
    // Tall chimney stack.
    l.round(0.1, 0.12, 0.022, 0.03, 0.03, 0.82, brickDark);
    l.round(0.1, 0.12, 0.03, 0.03, 0.8, 0.03, stoneLight);
    // Copper brew kettles visible in a glazed annex.
    l.block(0.74, 0.58, 0.24, 0.2, 0.03, 0.2, glassGreen);
    for (let i = 0; i <= 4; i++) l.block(0.62 + i * 0.06, 0.68, 0.006, 0.006, 0.03, 0.2, iron);
    l.block(0.74, 0.58, 0.25, 0.21, 0.23, 0.012, iron);
    for (const kx of [0.68, 0.8]) {
      l.round(kx, 0.58, 0.05, 0.045, 0.03, 0.12, copperKettle);
      l.dome(kx, 0.58, 0.05, 0.05, 0.15, 0.05, copperKettle);
      l.round(kx, 0.58, 0.006, 0.006, 0.2, 0.1, copperKettle);
    }
    // Dray yard: barrels, cart and a lamp.
    for (let i = 0; i < 8; i++) barrel(l, 0.1 + i * 0.04, 0.8);
    for (let i = 0; i < 4; i++) barrel(l, 0.12 + i * 0.04, 0.8, 0.07);
    truck(l, 0.64, 0.86, 'x', '#2f5a3e');
    lamp(l, 0.92, 0.72, 0.03, 0.22);
    figure(l, 0.46, 0.8, 0.03, 4);
    figure(l, 0.5, 0.84, 0.03, 6);
  },

  food_cannery(l) {
    l.base(concrete, 0.03);
    // Long factory hall with a north-light sawtooth roof.
    const hx = 0.4;
    const hz = 0.4;
    const hw = 0.7;
    const hd = 0.5;
    l.block(hx, hz, hw + 0.01, hd + 0.01, 0.03, 0.025, '#8f8a80');
    l.block(hx, hz, hw, hd, 0.055, 0.32, brick);
    for (const t of [0.15, 0.33])
      l.block(hx, hz, hw + 0.006, hd + 0.006, 0.055 + t, 0.01, stoneLight);
    for (let i = 0; i < 7; i++) {
      const wx = hx - hw / 2 + 0.05 + i * ((hw - 0.1) / 6);
      windowOn(l, 'z', wx, hz + hd / 2, 1, 0.05, 0.2, 0.12, { frame: stoneLight, pane: '#e9d58f' });
      windowOn(l, 'z', wx, hz - hd / 2, -1, 0.05, 0.2, 0.12, {
        frame: stoneLight,
        pane: '#e9d58f',
      });
    }
    for (let i = 0; i < 5; i++) {
      const tz = hz - hd / 2 + 0.05 + i * ((hd - 0.1) / 4);
      windowOn(l, 'x', tz, hx - hw / 2, -1, 0.05, 0.2, 0.12, {
        frame: stoneLight,
        pane: '#e9d58f',
      });
    }
    const teeth = 5;
    for (let i = 0; i < teeth; i++) {
      const tz = hz - hd / 2 + ((i + 0.5) * hd) / teeth;
      const depth = hd / teeth;
      shedRoof(l, hx, tz, hw, depth, 0.375, -0.1, '#6d6f6c');
      l.block(hx, tz - depth / 2 + 0.006, hw, 0.008, 0.375, 0.1, glassGreen, 1);
    }
    // Water tower on a steel frame.
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      l.block(0.86 + sx * 0.04, 0.16 + sz * 0.04, 0.01, 0.01, 0.03, 0.56, iron);
    }
    l.beam([0.82, 0.1, 0.12], [0.9, 0.4, 0.2], 0.006, iron);
    l.beam([0.9, 0.1, 0.12], [0.82, 0.4, 0.2], 0.006, iron);
    l.round(0.86, 0.16, 0.07, 0.07, 0.59, 0.16, '#8c5a3c');
    for (let i = 1; i < 4; i++) l.round(0.86, 0.16, 0.072, 0.072, 0.59 + i * 0.04, 0.006, iron);
    l.round(0.86, 0.16, 0.004, 0.075, 0.75, 0.08, '#6b4632');
    // Chimney and boiler house.
    l.block(0.84, 0.52, 0.16, 0.2, 0.03, 0.24, brickDark);
    hipRoof(l, 0.84, 0.52, 0.18, 0.22, 0.27, 0.06, slate, 2);
    l.round(0.88, 0.48, 0.024, 0.032, 0.03, 0.95, brickDark);
    for (const yy of [0.5, 0.92]) l.round(0.88, 0.48, 0.034, 0.034, yy, 0.02, stoneLight);
    // Loading dock with canopy, pallets of tins and trucks.
    l.block(0.4, 0.69, 0.5, 0.08, 0.03, 0.06, '#9e998e');
    l.block(0.4, 0.72, 0.52, 0.12, 0.2, 0.012, tinDark);
    for (const px of [0.18, 0.4, 0.62]) l.block(px, 0.77, 0.006, 0.006, 0.09, 0.11, iron);
    for (let i = 0; i < 3; i++)
      l.block(0.26 + i * 0.14, 0.652, 0.08, 0.006, 0.055, 0.12, '#59605f');
    for (let i = 0; i < 6; i++) {
      const px = 0.2 + i * 0.07;
      l.block(px, 0.69, 0.04, 0.04, 0.09, 0.006, plank);
      l.block(px, 0.69, 0.036, 0.036, 0.096, 0.03, i % 2 ? '#c8443a' : '#e3b43c');
    }
    truck(l, 0.3, 0.86, 'x', '#e8e3d6');
    truck(l, 0.62, 0.86, 'x', '#c8443a');
    lamp(l, 0.06, 0.86, 0.03, 0.26);
    lamp(l, 0.94, 0.86, 0.03, 0.26);
    l.block(0.4, 0.66, 0.24, 0.006, 0.31, 0.05, '#2f5f86');
    l.block(0.4, 0.662, 0.2, 0.004, 0.32, 0.03, '#f4efe2', 1);
    figure(l, 0.48, 0.74, 0.09, 2);
    figure(l, 0.52, 0.76, 0.09, 5);
  },

  // ===========================================================================
  // LIVESTOCK: sheep_fold -> cattle_barn -> dairy_cooperative
  // ===========================================================================
  sheep_fold(l) {
    l.base(grass, 0.03);
    // Dry-stone walled pasture with a shepherd's stone bothy.
    stoneWall(l, 0.06, 0.06, 0.94, 0.06);
    stoneWall(l, 0.94, 0.06, 0.94, 0.94);
    stoneWall(l, 0.94, 0.94, 0.58, 0.94);
    stoneWall(l, 0.42, 0.94, 0.06, 0.94);
    stoneWall(l, 0.06, 0.94, 0.06, 0.06);
    stoneWall(l, 0.06, 0.42, 0.5, 0.42);
    l.block(0.5, 0.95, 0.16, 0.012, 0.04, 0.04, plank);
    l.block(0.24, 0.22, 0.26, 0.18, 0.03, 0.15, stone);
    for (let i = 0; i < 4; i++)
      l.block(0.24, 0.22, 0.264, 0.184, 0.06 + i * 0.03, 0.006, shadeHex(stone, 0.8));
    l.ridge(0.24, 0.22, 0.3, 0.22, 0.18, 0.12, 'x', slate);
    l.block(0.32, 0.22, 0.03, 0.03, 0.18, 0.14, stone);
    l.block(0.2, 0.312, 0.04, 0.008, 0.03, 0.09, timberDark);
    windowOn(l, 'z', 0.3, 0.31, 1, 0.03, 0.08, 0.04, { frame: timberDark });
    // Open-fronted lambing shed.
    l.block(0.7, 0.18, 0.36, 0.06, 0.03, 0.14, plank);
    for (const sx of [0.52, 0.7, 0.88]) l.block(sx, 0.3, 0.012, 0.012, 0.03, 0.12, timber);
    shedRoof(l, 0.7, 0.24, 0.38, 0.16, 0.12, -0.04, tin);
    for (let i = 0; i < 3; i++) bale(l, 0.6 + i * 0.08, 0.2);
    // Flock and a water trough.
    let seed = 0;
    for (const [sx, sz] of [
      [0.2, 0.56],
      [0.3, 0.62],
      [0.42, 0.55],
      [0.56, 0.68],
      [0.68, 0.58],
      [0.78, 0.7],
      [0.24, 0.78],
      [0.38, 0.84],
      [0.62, 0.84],
      [0.82, 0.84],
      [0.72, 0.42],
      [0.84, 0.48],
    ] as const) {
      sheep(l, sx, sz, seed++);
    }
    l.block(0.5, 0.48, 0.14, 0.04, 0.03, 0.03, '#7b6a58');
    l.block(0.5, 0.48, 0.12, 0.028, 0.06, 0.002, water);
    figure(l, 0.46, 0.68, 0.03, 3);
    l.beam([0.47, 0.03, 0.69], [0.49, 0.11, 0.69], 0.004, '#6b4e36');
    tree(l, 0.12, 0.12, 0.45, 2);
  },

  cattle_barn(l) {
    l.base(grass, 0.03);
    yard(l, 0.32, 0.36, 0.56, 0.6, '#9a8566');
    // Long cow barn with a gambrel roof and ridge vents.
    barn(l, 0.3, 0.32, 0.4, 0.52, 0.3, '#5a6266', '#e6dfd0');
    // Concrete stave silo.
    silo(l, 0.62, 0.12, 0.065, 0.62, '#c9c1b0', 'dome');
    // Feed bunk under a lean-to.
    l.block(0.6, 0.42, 0.06, 0.32, 0.03, 0.05, '#8a8478');
    for (const pz of [0.28, 0.42, 0.56]) l.block(0.66, pz, 0.01, 0.01, 0.03, 0.16, timber);
    shedRoof(l, 0.6, 0.42, 0.14, 0.32, 0.19, -0.03, tin);
    // Paddock with cattle.
    fence(l, 0.68, 0.24, 0.96, 0.24);
    fence(l, 0.96, 0.24, 0.96, 0.96);
    fence(l, 0.96, 0.96, 0.08, 0.96);
    fence(l, 0.08, 0.96, 0.08, 0.7);
    fence(l, 0.08, 0.7, 0.68, 0.7);
    fence(l, 0.68, 0.7, 0.68, 0.24);
    let seed = 0;
    for (const [cx, cz, a] of [
      [0.78, 0.34, 'x'],
      [0.86, 0.48, 'z'],
      [0.76, 0.6, 'x'],
      [0.24, 0.8, 'x'],
      [0.4, 0.86, 'x'],
      [0.56, 0.8, 'z'],
      [0.72, 0.86, 'x'],
      [0.86, 0.8, 'z'],
    ] as const) {
      cow(l, cx, cz, seed++, a);
    }
    for (let i = 0; i < 4; i++) bale(l, 0.12 + i * 0.07, 0.62);
    l.block(0.88, 0.66, 0.12, 0.04, 0.03, 0.03, '#7b6a58');
    l.block(0.88, 0.66, 0.1, 0.03, 0.06, 0.002, water);
    tractor(l, 0.52, 0.62);
    figure(l, 0.48, 0.5, 0.03, 0);
    tree(l, 0.92, 0.1, 0.55, 1);
  },

  dairy_cooperative(l) {
    l.base(grassDark, 0.03);
    yard(l, 0.4, 0.34, 0.76, 0.56, concrete);
    barn(l, 0.22, 0.3, 0.36, 0.5, 0.34, '#5a6266', '#e6dfd0');
    // Twin silos.
    silo(l, 0.46, 0.1, 0.06, 0.74, '#cfc7b6', 'dome');
    silo(l, 0.58, 0.1, 0.06, 0.82, '#cfc7b6', 'dome');
    // Creamery: rendered building with a clerestory and a cooperative sign.
    l.block(0.74, 0.3, 0.36, 0.26, 0.03, 0.025, '#8f8a80');
    l.block(0.74, 0.3, 0.34, 0.24, 0.055, 0.26, '#e9e4d8');
    for (const wx of [0.62, 0.7, 0.78, 0.86]) {
      windowOn(l, 'z', wx, 0.42, 1, 0.04, 0.12, 0.1, { frame: '#5a6266', pane: '#dfe9e4' });
    }
    for (const wz of [0.22, 0.34])
      windowOn(l, 'x', wz, 0.91, 1, 0.04, 0.12, 0.1, { frame: '#5a6266', pane: '#dfe9e4' });
    l.ridge(0.74, 0.3, 0.38, 0.28, 0.315, 0.12, 'x', '#7d3a2e');
    l.block(0.74, 0.3, 0.16, 0.1, 0.36, 0.05, '#e9e4d8');
    l.block(0.74, 0.351, 0.14, 0.006, 0.37, 0.03, glassGreen, 1);
    l.ridge(0.74, 0.3, 0.18, 0.12, 0.41, 0.05, 'x', '#7d3a2e');
    l.block(0.74, 0.426, 0.2, 0.008, 0.22, 0.04, '#2f5f86');
    l.block(0.74, 0.43, 0.17, 0.004, 0.228, 0.024, '#f4efe2', 1);
    // Stainless milk tanks and a tanker truck at the dock.
    for (const tz of [0.5, 0.58]) {
      const g = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 14);
      g.rotateZ(Math.PI / 2);
      l.shape(g, steel, 0.74, tz, 0.11);
      for (const s of [-1, 1]) l.block(0.74 + s * 0.08, tz, 0.012, 0.05, 0.03, 0.04, iron);
    }
    l.block(0.6, 0.66, 0.16, 0.06, 0.06, 0.05, '#2f5f86');
    const tank = new THREE.CylinderGeometry(0.03, 0.03, 0.17, 14);
    tank.rotateZ(Math.PI / 2);
    l.shape(tank, steel, 0.52, 0.66, 0.075);
    l.block(0.42, 0.66, 0.04, 0.05, 0.045, 0.05, '#2f5f86');
    for (const dx of [-0.08, 0.06, 0.13]) {
      for (const s of [-1, 1]) {
        const g = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8);
        g.rotateX(Math.PI / 2);
        l.shape(g, '#222222', 0.52 + dx / 2, 0.66 + s * 0.028, 0.042);
      }
    }
    // Pasture with a herd.
    fence(l, 0.04, 0.74, 0.96, 0.74);
    let seed = 0;
    for (const [cx, cz, a] of [
      [0.12, 0.82, 'x'],
      [0.26, 0.88, 'z'],
      [0.38, 0.82, 'x'],
      [0.52, 0.9, 'x'],
      [0.66, 0.84, 'z'],
      [0.8, 0.88, 'x'],
      [0.9, 0.8, 'z'],
    ] as const) {
      cow(l, cx, cz, seed++, a);
    }
    lamp(l, 0.94, 0.6, 0.03, 0.24);
    figure(l, 0.48, 0.42, 0.03, 1);
    figure(l, 0.86, 0.5, 0.03, 3);
    tree(l, 0.94, 0.08, 0.55, 0);
  },

  // ===========================================================================
  // FISHERIES: fish_ponds -> fish_hatchery -> aquaculture_center
  // ===========================================================================
  fish_ponds(l) {
    l.base(grass, 0.03);
    // Four earthen ponds separated by dykes, a sluice and a keeper's hut.
    let i = 0;
    for (const [px, pz] of [
      [0.28, 0.3],
      [0.7, 0.3],
      [0.28, 0.72],
      [0.7, 0.72],
    ] as const) {
      pond(l, px, pz, 0.32, 0.3, '#8e7a5a', i++ % 2 === 0);
    }
    l.block(0.49, 0.51, 0.06, 0.06, 0.03, 0.05, stone);
    l.block(0.49, 0.51, 0.04, 0.012, 0.08, 0.03, timberDark);
    l.block(0.88, 0.06, 0.16, 0.1, 0.03, 0.12, plank);
    l.ridge(0.88, 0.06, 0.18, 0.12, 0.15, 0.07, 'x', thatch);
    l.block(0.88, 0.112, 0.03, 0.006, 0.03, 0.07, timberDark);
    // Jetty, punt and nets on poles.
    l.block(0.28, 0.5, 0.06, 0.14, 0.04, 0.012, plank);
    const punt = new THREE.BoxGeometry(0.1, 0.02, 0.04);
    l.shape(punt, '#6b4e36', 0.72, 0.68, 0.044);
    for (let k = 0; k < 4; k++) l.block(0.08 + k * 0.03, 0.5, 0.004, 0.004, 0.03, 0.09, timber);
    l.beam([0.08, 0.11, 0.5], [0.17, 0.11, 0.5], 0.004, timber);
    l.block(0.125, 0.5, 0.08, 0.002, 0.06, 0.05, '#c9c2a8');
    figure(l, 0.3, 0.52, 0.052, 2);
    figure(l, 0.88, 0.16, 0.03, 4);
    tree(l, 0.06, 0.06, 0.36, 0);
    tree(l, 0.94, 0.94, 0.4, 3);
  },

  fish_hatchery(l) {
    l.base(grass, 0.03);
    yard(l, 0.3, 0.26, 0.5, 0.4);
    // Hatchery shed: timber cladding, long roof with a vent lantern.
    l.block(0.3, 0.24, 0.46, 0.3, 0.03, 0.02, stone);
    l.block(0.3, 0.24, 0.44, 0.28, 0.05, 0.22, '#7c8a7e');
    const boards = 14;
    for (let i = 0; i < boards; i++) {
      l.block(0.08 + ((i + 0.5) * 0.44) / boards, 0.382, 0.004, 0.004, 0.05, 0.22, '#5d695f');
    }
    for (const wx of [0.16, 0.3, 0.44])
      windowOn(l, 'z', wx, 0.38, 1, 0.05, 0.13, 0.07, { frame: trim, pane: '#dfe9e4' });
    l.block(0.3, 0.386, 0.06, 0.008, 0.05, 0.12, timberDark);
    l.ridge(0.3, 0.24, 0.5, 0.34, 0.27, 0.16, 'x', slate);
    l.block(0.3, 0.24, 0.2, 0.06, 0.38, 0.05, '#7c8a7e');
    l.ridge(0.3, 0.24, 0.22, 0.08, 0.43, 0.04, 'x', slate);
    // Round rearing tanks.
    for (let k = 0; k < 6; k++) {
      const tx = 0.66 + (k % 3) * 0.12;
      const tz = 0.14 + Math.floor(k / 3) * 0.14;
      l.round(tx, tz, 0.05, 0.05, 0.03, 0.05, '#cfd4d0');
      l.round(tx, tz, 0.044, 0.044, 0.078, 0.004, water);
    }
    l.beam([0.62, 0.11, 0.21], [0.94, 0.11, 0.21], 0.008, '#3c6f9a');
    // Long raceways down the lot.
    for (let k = 0; k < 4; k++) {
      const rx = 0.2 + k * 0.2;
      l.block(rx, 0.7, 0.13, 0.4, 0.03, 0.035, concrete);
      l.block(rx, 0.7, 0.1, 0.38, 0.04, 0.026, water);
      l.block(rx, 0.89, 0.13, 0.02, 0.065, 0.012, timberDark);
    }
    l.block(0.5, 0.48, 0.84, 0.03, 0.03, 0.03, concrete);
    l.block(0.5, 0.48, 0.8, 0.018, 0.058, 0.002, water);
    figure(l, 0.66, 0.4, 0.03, 1);
    figure(l, 0.3, 0.5, 0.06, 4);
    truck(l, 0.12, 0.08, 'x', '#e8e3d6');
    lamp(l, 0.56, 0.42, 0.03, 0.22);
  },

  aquaculture_center(l) {
    l.base(concrete, 0.03);
    // Research and processing building with a flat roof and roof plant.
    l.block(0.3, 0.26, 0.5, 0.36, 0.03, 0.025, '#8f8a80');
    l.block(0.3, 0.26, 0.48, 0.34, 0.055, 0.42, '#e7e3d9');
    for (const t of [0.19, 0.39]) l.block(0.3, 0.26, 0.485, 0.345, 0.055 + t, 0.012, '#9aa3a6');
    for (const yy of [0.09, 0.27]) {
      l.block(0.3, 0.432, 0.42, 0.008, yy, 0.12, '#9cc3cf', 1);
      for (let i = 0; i <= 8; i++)
        l.block(0.09 + i * 0.0525, 0.436, 0.004, 0.006, yy, 0.12, '#5a6266');
      l.block(0.056, 0.26, 0.008, 0.28, yy, 0.12, '#9cc3cf', 1);
    }
    l.block(0.3, 0.26, 0.5, 0.36, 0.475, 0.02, '#6d7275');
    l.block(0.2, 0.22, 0.12, 0.1, 0.495, 0.06, steel);
    for (let i = 0; i < 4; i++) l.block(0.2, 0.272, 0.1, 0.004, 0.505 + i * 0.012, 0.006, tinDark);
    l.round(0.4, 0.2, 0.03, 0.03, 0.495, 0.08, '#cfd4d0');
    // Solar panels on part of the roof.
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BoxGeometry(0.12, 0.008, 0.06);
      g.rotateX(-0.4);
      l.shape(g, '#253a5a', 0.38, 0.3 + i * 0.04, 0.52);
    }
    // Recirculating tank hall: arched polytunnels.
    for (const tx of [0.72, 0.88]) {
      l.vaultedCanopy(tx, 0.3, 0.14, 0.44, 0.03, 0.18);
      l.block(tx, 0.3, 0.13, 0.43, 0.03, 0.01, '#bfc5c2');
    }
    // Floating net pens in a large basin with a walkway.
    pond(l, 0.5, 0.74, 0.86, 0.36, concrete, false);
    for (let k = 0; k < 4; k++) {
      const px = 0.17 + k * 0.22;
      l.round(px, 0.74, 0.07, 0.07, 0.042, 0.012, '#d9d3c4');
      l.round(px, 0.74, 0.062, 0.062, 0.05, 0.002, '#2f6577');
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        l.block(
          px + Math.sin(a) * 0.033,
          0.74 + Math.cos(a) * 0.033,
          0.004,
          0.004,
          0.05,
          0.03,
          '#d9d3c4',
        );
      }
    }
    l.block(0.5, 0.74, 0.86, 0.03, 0.044, 0.01, plank);
    for (let k = 0; k < 9; k++)
      l.block(0.08 + k * 0.105, 0.74, 0.006, 0.032, 0.03, 0.014, timberDark);
    // Feed silo, workboat, vans and people.
    silo(l, 0.62, 0.1, 0.05, 0.5, steel, 'cone');
    const hull = new THREE.BoxGeometry(0.14, 0.03, 0.05);
    l.shape(hull, '#e8e3d6', 0.82, 0.62, 0.04);
    l.block(0.8, 0.62, 0.04, 0.03, 0.07, 0.04, '#2f5f86');
    truck(l, 0.2, 0.52, 'x', '#2f5f86');
    lamp(l, 0.06, 0.52, 0.03, 0.26);
    lamp(l, 0.58, 0.52, 0.03, 0.26);
    figure(l, 0.4, 0.74, 0.054, 0);
    figure(l, 0.64, 0.74, 0.054, 3);
    figure(l, 0.42, 0.5, 0.03, 5);
  },
};
