import * as THREE from 'three';
import {
  boardBody,
  chimney,
  door,
  lanternPost,
  meadow,
  off,
  person,
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
  window4,
  barrel,
  crate,
  cypress,
} from './diorama';
import { smoke, steelSilo, thatchGable, truck, waterSheet } from './dioramaProps';
import { type Lot, type Recipes } from './lot';

// Mining, extraction and rail chain built as dioramas (see docs/tasks). Lots are 1 x 1:
//   quarry         -> steam_quarry     -> industrial_quarry
//   clay_pit       -> brick_works      -> industrial_brickyard
//   iron_mine      -> shaft_iron_mine  -> deep_iron_mine
//   rail_track     -> iron_rail_track
// Pits are modelled as terraced rock masses around an open floor; back walls sit at low x/z.

const grass = '#79a24a';
const timber = '#6b4a2c';
const timberDark = '#3d2a19';
const plank = '#8a6a48';
const brick = '#b5563c';
const slate = '#4d5a66';
const steel = '#7a868c';
const steelDark = '#3c4549';
const hiVis = '#e8742a';

type Face = '+z' | '-z' | '+x' | '-x';
const FACES: readonly Face[] = ['+z', '-z', '+x', '-x'];

/** Lit windows on all four faces of a body (also what the night view reads). */
function windows4(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  size: number,
  opts: { shutters?: string; frame?: string } = {},
): void {
  for (const f of FACES) {
    const len = f === '+z' || f === '-z' ? w : d;
    if (len > size * 3.4) {
      window4(l, x, z, w, d, f, -len * 0.26, y, size, opts);
      window4(l, x, z, w, d, f, len * 0.26, y, size, opts);
    } else window4(l, x, z, w, d, f, 0, y, size, opts);
  }
}

/** Ground: meadow with a worn floor patch where the work happens. */
function ground(
  l: Lot,
  seed: string,
  floor: string,
  patch: [number, number, number, number],
): void {
  reseed(seed);
  meadow(l, grass, 26);
  const [x0, z0, x1, z1] = patch;
  const w = (x1 - x0) * l.spanX;
  const d = (z1 - z0) * l.spanZ;
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, w, 0.008, d, floor);
  for (let i = 0; i < 34; i++)
    wbox(
      l,
      x0 + rand() * (x1 - x0),
      z0 + rand() * (z1 - z0),
      0.038,
      0.01 + rand() * 0.02,
      0.004,
      0.01 + rand() * 0.02,
      tone(shade(floor, 0.82), 0.25),
      rand() * 3,
    );
}

/**
 * Terrace of individually cut blocks between lot fractions (x0, z0) and (x1, z1). Each cell is
 * built from strata layers; `cap` lays a patchy turf lip on top, `rough` jitters the face.
 */
function rockMass(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  h: number,
  color: string,
  cap?: string,
  step = 0.06,
): void {
  const nx = Math.max(1, Math.round(((x1 - x0) * l.spanX) / step));
  const nz = Math.max(1, Math.round(((z1 - z0) * l.spanZ) / step));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const cx = x0 + ((i + 0.5) / nx) * (x1 - x0) + ((rand() - 0.5) * 0.006) / l.spanX;
      const cz = z0 + ((j + 0.5) / nz) * (z1 - z0) + ((rand() - 0.5) * 0.006) / l.spanZ;
      const hh = h * (0.9 + rand() * 0.14);
      const layers = Math.max(2, Math.round(hh / 0.034));
      const lh = hh / layers;
      const cw = (((x1 - x0) * l.spanX) / nx) * 0.985;
      const cd = (((z1 - z0) * l.spanZ) / nz) * 0.985;
      for (let k = 0; k < layers; k++)
        wbox(
          l,
          cx,
          cz,
          y + k * lh,
          cw,
          lh * 1.02,
          cd,
          tone(shade(color, k % 2 ? 0.9 : 1.05), 0.16),
        );
      if (cap && rand() < 0.78)
        wbox(l, cx, cz, y + hh, cw * 0.96, 0.008, cd * 0.96, tone(cap, 0.14));
    }
}

/** Loose rubble: a scatter of small rotated stones. */
function rubble(
  l: Lot,
  x: number,
  z: number,
  y: number,
  n: number,
  spread: number,
  color: string,
): void {
  for (let i = 0; i < n; i++) {
    const s = 0.012 + rand() * 0.02;
    wbox(
      l,
      x + ((rand() - 0.5) * spread) / l.spanX,
      z + ((rand() - 0.5) * spread) / l.spanZ,
      y,
      s,
      s * (0.6 + rand() * 0.6),
      s * (0.8 + rand() * 0.4),
      tone(color, 0.3),
      rand() * 3,
    );
  }
}

/** Dressed stone blocks stacked in a pile (nx by nz, `layers` high). */
function blockStack(
  l: Lot,
  x: number,
  z: number,
  y: number,
  nx: number,
  nz: number,
  layers: number,
  color: string,
  size = 0.034,
): void {
  for (let k = 0; k < layers; k++)
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++)
        wbox(
          l,
          ...off(l, x, z, (i - (nx - 1) / 2) * size * 1.04, (j - (nz - 1) / 2) * size * 1.04),
          y + k * size * 0.62,
          size,
          size * 0.6,
          size * 0.98,
          tone(color, 0.2),
        );
}

/** Narrow-gauge track (sleepers, rails, ballast) between two points on the floor. */
function railLine(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y = 0.036,
  opts: { steel?: boolean; gauge?: number; spacing?: number } = {},
): void {
  const gauge = opts.gauge ?? 0.034;
  const dx = (x1 - x0) * l.spanX;
  const dz = (z1 - z0) * l.spanZ;
  const len = Math.hypot(dx, dz);
  const ry = Math.atan2(-dz, dx);
  const px = -dz / len;
  const pz = dx / len;
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, y, len, 0.006, gauge * 2.3, '#8e8778', ry);
  const n = Math.max(2, Math.round(len / (opts.spacing ?? 0.034)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    wbox(
      l,
      x0 + (x1 - x0) * t,
      z0 + (z1 - z0) * t,
      y + 0.006,
      0.012,
      0.007,
      gauge * 2.1,
      tone(opts.steel ? '#5d4533' : '#6b4a2c', 0.2),
      ry,
    );
  }
  for (const s of [-1, 1]) {
    const ox = (px * gauge * s) / l.spanX;
    const oz = (pz * gauge * s) / l.spanZ;
    l.beam(
      [x0 + ox, y + 0.016, z0 + oz],
      [x1 + ox, y + 0.016, z1 + oz],
      0.006,
      opts.steel ? '#aab0b4' : '#5d4c3c',
    );
  }
}

/** Ore wagon on rails facing `ry`, loaded with `load` (null = empty). */
function wagon(
  l: Lot,
  x: number,
  z: number,
  ry: number,
  load: string | null,
  y = 0.042,
  body = '#6b5a4a',
): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  wbox(l, x, z, y + 0.012, 0.075, 0.034, 0.05, body, ry);
  wbox(l, x, z, y + 0.044, 0.082, 0.006, 0.058, shade(body, 0.6), ry);
  for (const t of [-0.026, 0, 0.026])
    wbox(l, ...off(l, x, z, c * t, -s * t), y + 0.012, 0.004, 0.036, 0.054, '#2c2a28', ry);
  for (const a of [-0.024, 0.024])
    for (const sd of [-0.03, 0.03]) {
      const w = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 8);
      w.rotateX(Math.PI / 2);
      w.rotateY(ry);
      l.shape(w, '#222222', ...off(l, x, z, c * a + s * sd, -s * a + c * sd), y + 0.009);
    }
  if (load) rubble(l, x, z, y + 0.042, 7, 0.05, load);
}

/** Timber mine portal: posts, lintel, cap beam and a dark opening with a lantern. */
function portal(
  l: Lot,
  x: number,
  z: number,
  width: number,
  height: number,
  y: number,
  face: '+z' | '+x',
  color: string,
): void {
  const alongZ = face === '+x';
  const put = (a: number, yy: number, w: number, h: number, d: number, c: string, glow = 0) => {
    const [px, pz] = alongZ ? off(l, x, z, 0, a) : off(l, x, z, a, 0);
    if (alongZ) wbox(l, px, pz, yy, d, h, w, c, 0, 0, glow);
    else wbox(l, px, pz, yy, w, h, d, c, 0, 0, glow);
  };
  put(0, y, width - 0.02, height - 0.012, 0.012, '#14100c');
  for (const s of [-1, 1]) put((s * width) / 2, y, 0.016, height, 0.024, color);
  put(0, y + height - 0.014, width + 0.034, 0.02, 0.03, shade(color, 0.85));
  put(0, y + height + 0.006, width + 0.05, 0.012, 0.034, shade(color, 0.7));
  put(0, y + height * 0.6, width - 0.02, 0.01, 0.014, shade(color, 0.9));
  put(width * 0.2, y + height * 0.5, 0.008, 0.012, 0.01, '#ffc85a', 1);
}

/** Brick course body helper. */
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
  stoneBody(l, x, z, w, d, y, h, color, 0.017);
}

/** Floodlight mast with a lamp bar. */
function floodlight(l: Lot, x: number, z: number, h = 0.28): void {
  wround(l, x, z, 0.004, 0.006, 0.03, h, steelDark, 6);
  wbox(l, x, z, 0.03 + h, 0.05, 0.012, 0.016, steelDark);
  for (const t of [-0.016, 0, 0.016])
    wbox(l, ...off(l, x, z, t, 0.009), 0.03 + h - 0.002, 0.011, 0.012, 0.006, '#fff2c4', 0, 0, 1);
}

/** Belt conveyor between two world points ([x, y, z] with x/z as lot fractions). */
function conveyor(
  l: Lot,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  supports = 4,
): void {
  l.beam([from[0], from[1], from[2]], [to[0], to[1], to[2]], 0.026, '#2b2f31');
  for (const s of [-1, 1]) {
    const ox = (s * 0.016) / l.spanX;
    l.beam(
      [from[0] + ox, from[1] + 0.012, from[2] - ox],
      [to[0] + ox, to[1] + 0.012, to[2] - ox],
      0.004,
      '#c9a43a',
    );
  }
  for (let i = 0; i <= supports; i++) {
    const t = i / supports;
    const px = from[0] + (to[0] - from[0]) * t;
    const pz = from[2] + (to[2] - from[2]) * t;
    const py = from[1] + (to[1] - from[1]) * t;
    wbox(l, px, pz, 0.03, 0.01, py - 0.03, 0.01, '#6e777b');
    if (i % 2) wbox(l, px, pz, py - 0.012, 0.04, 0.005, 0.01, '#6e777b', Math.PI / 4);
  }
}

/** Spoked winding wheel (vertical, facing `ry`) on a short axle. */
function windingWheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
  for (const sd of [-0.012, 0.012]) {
    const rim = new THREE.TorusGeometry(r, 0.005, 5, 20);
    rim.rotateY(ry + Math.PI / 2);
    l.shape(
      rim,
      '#2c3134',
      ...off(l, x, z, Math.cos(ry) * sd * 0 + Math.sin(ry) * sd, Math.cos(ry) * sd),
      y,
    );
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    const sp = new THREE.BoxGeometry(0.004, r * 2, 0.004);
    sp.rotateZ(a);
    sp.rotateY(ry + Math.PI / 2);
    l.shape(sp, '#3a4044', x, z, y);
  }
  const hub = new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8);
  hub.rotateX(Math.PI / 2);
  hub.rotateY(ry);
  l.shape(hub, '#1f2326', x, z, y);
}

/** Work yard filler for the larger 2x2 lots: crates, barrels, stacks and loose material. */
function yard(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  kind: 'stone' | 'brick' | 'ore',
  n: number,
): void {
  const mat = { stone: '#cfc9b9', brick: '#bd6a45', ore: '#7a4a3a' }[kind];
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    const r = rand();
    if (r < 0.34) blockStack(l, x, z, 0.036, 2, 2, 1 + Math.floor(rand() * 3), mat);
    else if (r < 0.52) crate(l, x, z, 0.036, kind === 'ore' ? '#7a4a3a' : '#8a6a48', rand() * 3);
    else if (r < 0.66) barrel(l, x, z);
    else if (r < 0.88) rubble(l, x, z, 0.036, 6, 0.08, mat);
    else person(l, x, z, 0.036, ['#8a4a3a', '#5a7a9a', '#6a8a5a'][i % 3]!, '#3a3a3c');
  }
}

/** Workers (hi-vis or period coats). */
function workers(
  l: Lot,
  list: readonly (readonly [number, number, string, string?])[],
  y = 0.036,
): void {
  for (const [x, z, coat, hat] of list) person(l, x, z, y, coat, hat);
}

export const miningDiorama: Recipes = {
  // -----------------------------------------------------------------------------------------
  // Quarry chain
  // -----------------------------------------------------------------------------------------
  quarry(l) {
    ground(l, 'quarry', '#a39c8c', [0.1, 0.1, 0.92, 0.92]);
    yard(l, 0.1, 0.5, 0.38, 0.95, 'stone', 9);
    yard(l, 0.54, 0.5, 0.7, 0.7, 'stone', 5);
    const rock = '#bdb6a6';
    // Two benches cut into the back and left of the lot.
    rockMass(l, 0.06, 0.06, 0.94, 0.26, 0.036, 0.075, rock, grass);
    rockMass(l, 0.06, 0.06, 0.94, 0.15, 0.111, 0.07, shade(rock, 0.95), grass);
    rockMass(l, 0.06, 0.26, 0.24, 0.66, 0.036, 0.075, rock, grass);
    rockMass(l, 0.06, 0.15, 0.14, 0.56, 0.111, 0.07, shade(rock, 0.95), grass);
    rubble(l, 0.34, 0.3, 0.036, 14, 0.2, '#a8a396');
    // Hand-cranked wooden derrick over the cut, with a block on the hook.
    const dx = 0.62;
    const dz = 0.42;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      l.beam(
        [dx + (a * 0.035) / l.spanX, 0.036, dz + (b * 0.035) / l.spanZ],
        [dx, 0.3, dz],
        0.008,
        timber,
      );
    wbox(l, dx, dz, 0.036, 0.09, 0.012, 0.09, timberDark);
    wbox(l, dx, dz, 0.3, 0.02, 0.02, 0.02, shade(timber, 0.7));
    l.beam([dx, 0.29, dz], [dx - 0.12 / l.spanX, 0.205, dz - 0.07 / l.spanZ], 0.009, '#7a5836');
    l.beam(
      [dx - 0.12 / l.spanX, 0.205, dz - 0.07 / l.spanZ],
      [dx - 0.12 / l.spanX, 0.1, dz - 0.07 / l.spanZ],
      0.002,
      '#cdbf9a',
    );
    wbox(l, dx - 0.12 / l.spanX, dz - 0.07 / l.spanZ, 0.066, 0.04, 0.034, 0.034, '#cfc8b8');
    l.beam([dx, 0.2, dz], [dx + 0.1 / l.spanX, 0.036, dz + 0.1 / l.spanZ], 0.003, '#a08a5a');
    wround(l, dx + 0.04 / l.spanX, dz + 0.02 / l.spanZ, 0.01, 0.01, 0.05, 0.03, '#7a5836', 8);
    // Rails out of the pit with loaded hand carts.
    railLine(l, 0.46, 0.3, 0.46, 0.96);
    wagon(l, 0.46, 0.46, Math.PI / 2, '#b8b2a2');
    wagon(l, 0.46, 0.62, Math.PI / 2, '#aaa496');
    wagon(l, 0.46, 0.8, Math.PI / 2, null);
    // Plank tool shed with shingle roof, stone stacks and the crew.
    const sx = 0.78;
    const sz = 0.76;
    boardBody(l, sx, sz, 0.22, 0.17, 0.03, 0.12, plank);
    door(l, sx, sz, 0.22, 0.17, '-x', 0, 0.03, 0.05, 0.095, timberDark);
    windows4(l, sx, sz, 0.22, 0.17, 0.07, 0.036, { shutters: '#4a6a3a' });
    shingleGable(l, sx, sz, 'z', 0.17, 0.22, 0.15, 0.09, '#6e5444', plank);
    chimney(l, ...off(l, sx, sz, 0.06, -0.03), 0.17, 0.07, '#8f8a80');
    blockStack(l, 0.7, 0.54, 0.036, 3, 2, 3, '#d3cdbd');
    blockStack(l, 0.3, 0.8, 0.036, 2, 2, 2, '#c8c2b2');
    barrel(l, 0.62, 0.86);
    crate(l, 0.58, 0.9, 0.036, '#8a6a48');
    workers(l, [
      [0.36, 0.44, '#a14a3a'],
      [0.54, 0.38, '#5a7a9a'],
      [0.5, 0.66, '#7a6a3a'],
      [0.66, 0.84, '#6a8a5a'],
    ]);
    lanternPost(l, 0.34, 0.66, 0.15);
    shrub(l, 0.9, 0.9, 0.035);
    cypress(l, 0.92, 0.12, 0.17);
    shrub(l, 0.08, 0.9, 0.04);
  },

  steam_quarry(l) {
    ground(l, 'steam_quarry', '#a39d8e', [0.1, 0.1, 0.94, 0.94]);
    yard(l, 0.56, 0.54, 0.68, 0.72, 'stone', 5);
    yard(l, 0.36, 0.4, 0.44, 0.95, 'stone', 6);
    const rock = '#c4beae';
    rockMass(l, 0.05, 0.05, 0.95, 0.24, 0.036, 0.07, rock, grass);
    rockMass(l, 0.05, 0.05, 0.95, 0.15, 0.106, 0.06, shade(rock, 0.95), grass);
    rockMass(l, 0.05, 0.24, 0.2, 0.7, 0.036, 0.07, rock, grass);
    rockMass(l, 0.05, 0.15, 0.12, 0.6, 0.106, 0.06, shade(rock, 0.95), grass);
    rockMass(l, 0.2, 0.24, 0.3, 0.38, 0.036, 0.03, shade(rock, 0.9));
    rubble(l, 0.4, 0.3, 0.036, 16, 0.24, '#a8a396');
    // Red-brick engine house with slate roof, tall brick chimney and steam.
    const ex = 0.2;
    const ez = 0.8;
    brickBody(l, ex, ez, 0.3, 0.22, 0.03, 0.16);
    stoneBody(l, ex, ez, 0.31, 0.23, 0.03, 0.02, '#8f867a', 0.02);
    door(l, ex, ez, 0.3, 0.22, '+x', 0, 0.03, 0.06, 0.1, timberDark);
    windows4(l, ex, ez, 0.3, 0.22, 0.09, 0.04, { frame: '#e9dfc9' });
    shingleGable(l, ex, ez, 'x', 0.3, 0.22, 0.19, 0.1, slate, brick);
    chimney(l, ...off(l, ex, ez, 0.09, 0.07), 0.2, 0.13, '#8f4a35');
    smoke(l, ...off(l, ex, ez, 0.09, 0.07), 0.35, 3);
    const [tx, tz] = off(l, ex, ez, -0.16, -0.1);
    for (let r = 0; r < 38; r++) {
      const rr = 0.026 - r * 0.00018;
      wround(l, tx, tz, rr - 0.0015, rr, 0.03 + r * 0.0112, 0.0112, tone('#9c5640', 0.2), 10);
    }
    wround(l, tx, tz, 0.03, 0.021, 0.03 + 38 * 0.0112, 0.012, '#6a3c2c', 10);
    smoke(l, tx, tz, 0.03 + 38 * 0.0112 + 0.008, 4);
    // Steam crane on a boiler cart, boom swinging a stone block.
    const cx = 0.64;
    const cz = 0.42;
    wbox(l, cx, cz, 0.036, 0.1, 0.03, 0.07, '#3f3f42');
    wbox(l, cx, cz, 0.066, 0.085, 0.045, 0.06, '#7a4a30');
    wround(l, ...off(l, cx, cz, -0.02, 0), 0.014, 0.016, 0.11, 0.06, '#2f3134', 8);
    smoke(l, ...off(l, cx, cz, -0.02, 0), 0.17, 3);
    wround(l, ...off(l, cx, cz, 0.02, 0.004), 0.018, 0.018, 0.066, 0.05, '#6a5a4a', 10);
    l.beam([cx, 0.1, cz], [cx - 0.15 / l.spanX, 0.27, cz - 0.1 / l.spanZ], 0.01, steel);
    l.beam(
      [cx - 0.15 / l.spanX, 0.27, cz - 0.1 / l.spanZ],
      [cx - 0.15 / l.spanX, 0.12, cz - 0.1 / l.spanZ],
      0.002,
      '#2c3134',
    );
    wbox(l, cx - 0.15 / l.spanX, cz - 0.1 / l.spanZ, 0.09, 0.05, 0.036, 0.04, '#d3cdbd');
    // Rails climbing out with wagons; dressed stone yard and the crew.
    railLine(l, 0.5, 0.26, 0.5, 0.96, 0.036, { steel: true });
    wagon(l, 0.5, 0.5, Math.PI / 2, '#c0baaa', 0.042, '#6e6e70');
    wagon(l, 0.5, 0.66, Math.PI / 2, '#b0aa9c', 0.042, '#6e6e70');
    wagon(l, 0.5, 0.86, Math.PI / 2, null, 0.042, '#6e6e70');
    blockStack(l, 0.78, 0.56, 0.036, 4, 2, 4, '#d6d0c0');
    blockStack(l, 0.78, 0.86, 0.036, 3, 2, 3, '#cbc5b5');
    wbox(l, 0.66, 0.78, 0.036, 0.07, 0.04, 0.05, '#8a8478');
    workers(l, [
      [0.4, 0.46, '#8a4a3a', '#3a3a3c'],
      [0.58, 0.34, '#566f8c', '#3a3a3c'],
      [0.7, 0.7, '#6a8a5a', '#3a3a3c'],
      [0.36, 0.68, '#7a6a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.4, 0.88, 0.18);
    lanternPost(l, 0.9, 0.42, 0.18);
    shrub(l, 0.92, 0.92, 0.04);
  },

  industrial_quarry(l) {
    ground(l, 'industrial_quarry', '#9c978a', [0.08, 0.08, 0.95, 0.95]);
    yard(l, 0.1, 0.4, 0.2, 0.62, 'stone', 4);
    yard(l, 0.5, 0.78, 0.62, 0.95, 'stone', 4);
    const rock = '#c9c3b4';
    rockMass(l, 0.05, 0.05, 0.95, 0.22, 0.036, 0.06, rock, grass);
    rockMass(l, 0.05, 0.05, 0.95, 0.15, 0.096, 0.055, shade(rock, 0.95), grass);
    rockMass(l, 0.05, 0.05, 0.95, 0.09, 0.151, 0.05, shade(rock, 0.9), grass);
    rockMass(l, 0.05, 0.22, 0.17, 0.6, 0.036, 0.06, rock, grass);
    rockMass(l, 0.05, 0.15, 0.11, 0.5, 0.096, 0.055, shade(rock, 0.95), grass);
    rubble(l, 0.38, 0.3, 0.036, 22, 0.28, '#aaa598');
    // Crushing plant: steel-clad hall, hopper, vents and glowing windows.
    const px = 0.28;
    const pz = 0.72;
    boardBody(l, px, pz, 0.3, 0.24, 0.03, 0.2, '#8a959b');
    stoneBody(l, px, pz, 0.31, 0.25, 0.03, 0.03, '#b8b4a8', 0.03);
    windows4(l, px, pz, 0.3, 0.24, 0.12, 0.04, { frame: '#d8dde0' });
    door(l, px, pz, 0.3, 0.24, '+x', 0.04, 0.03, 0.06, 0.1, steelDark);
    tinGable(l, px, pz, 'x', 0.3, 0.24, 0.23, 0.08, '#4f5a60', '#8a959b');
    wbox(l, px, pz, 0.31, 0.12, 0.03, 0.1, '#5e6a70');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, px, pz, -0.06 + i * 0.03, 0), 0.34, 0.012, 0.012, 0.01, '#2c3134');
    for (const k of [0, 1]) {
      const [cx, cz] = off(l, px, pz, -0.06 + k * 0.12, 0.14);
      wround(l, cx, cz, 0.014, 0.017, 0.03, 0.34 + k * 0.1, steel, 10);
      wround(l, cx, cz, 0.018, 0.018, 0.03 + 0.34 + k * 0.1, 0.012, steelDark, 10);
    }
    smoke(l, ...off(l, px, pz, 0.06, 0.14), 0.52, 3);
    // Conveyors: pit -> crusher -> silos.
    conveyor(l, [0.34, 0.075, 0.36], [0.28, 0.34, 0.6], 5);
    conveyor(l, [0.4, 0.3, 0.72], [0.66, 0.31, 0.6], 4);
    steelSilo(l, 0.7, 0.54, 0.05, 0.28);
    steelSilo(l, 0.84, 0.72, 0.045, 0.22);
    // Haul trucks, gravel piles, floodlights and hi-vis crew.
    truck(l, 0.55, 0.3, 0, '#e0a82e');
    truck(l, 0.7, 0.86, Math.PI, '#e0a82e');
    for (const [x, z, s] of [
      [0.86, 0.4, 1],
      [0.9, 0.5, 0.7],
      [0.5, 0.92, 0.8],
    ] as const) {
      for (let i = 0; i < 4; i++) {
        const w = 0.09 * s * (1 - i * 0.2);
        wbox(l, x, z, 0.036 + i * 0.013, w, 0.014, w, tone('#b3ada0', 0.15), i * 0.4);
      }
    }
    workers(l, [
      [0.5, 0.48, hiVis, '#f2cf4a'],
      [0.62, 0.7, hiVis, '#f2cf4a'],
      [0.4, 0.88, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.12, 0.7, 0.3);
    floodlight(l, 0.92, 0.28, 0.32);
    floodlight(l, 0.94, 0.92, 0.28);
    shrub(l, 0.08, 0.92, 0.04);
  },

  // -----------------------------------------------------------------------------------------
  // Clay pit chain
  // -----------------------------------------------------------------------------------------
  clay_pit(l) {
    ground(l, 'clay_pit', '#b98a62', [0.1, 0.1, 0.92, 0.92]);
    yard(l, 0.6, 0.5, 0.72, 0.95, 'brick', 6);
    const clay = '#c4724a';
    rockMass(l, 0.06, 0.06, 0.94, 0.24, 0.036, 0.06, clay, grass, 0.055);
    rockMass(l, 0.06, 0.24, 0.2, 0.62, 0.036, 0.06, clay, grass, 0.055);
    rockMass(l, 0.06, 0.06, 0.6, 0.13, 0.096, 0.045, shade(clay, 0.92), grass, 0.055);
    waterSheet(l, 0.46, 0.4, 0.3, 0.2, 0.04, '#6f93a6');
    rubble(l, 0.7, 0.36, 0.036, 10, 0.2, '#b5653f');
    // Diggers, wheelbarrow and a hand cart on rails.
    workers(l, [
      [0.58, 0.46, '#7a5a3a', '#8a6a3a'],
      [0.34, 0.38, '#5a7a9a', '#8a6a3a'],
      [0.8, 0.66, '#8a4a3a', '#8a6a3a'],
    ]);
    railLine(l, 0.74, 0.28, 0.74, 0.96);
    wagon(l, 0.74, 0.5, Math.PI / 2, '#c26e44');
    wagon(l, 0.74, 0.72, Math.PI / 2, null);
    // Raw bricks drying in rows on the floor.
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 8; i++)
        wbox(l, 0.16 + i * 0.045, 0.62 + r * 0.05, 0.036, 0.034, 0.014, 0.02, tone('#b9693f', 0.2));
    // Thatched shelter on posts with stacked bricks beneath.
    for (const [x, z] of [
      [0.12, 0.74],
      [0.44, 0.74],
      [0.12, 0.94],
      [0.44, 0.94],
    ] as const)
      wbox(l, x, z, 0.036, 0.012, 0.16, 0.012, timber);
    thatchGable(l, 0.28, 0.8, 'x', 0.38, 0.26, 0.2, 0.09, '#cfa956');
    for (let k = 0; k < 4; k++)
      for (let i = 0; i < 5; i++)
        wbox(
          l,
          0.18 + i * 0.045,
          0.86,
          0.036 + k * 0.016,
          0.04,
          0.014,
          0.022,
          tone('#bd6a45', 0.2),
        );
    // Clamp kiln: a mound of stacked bricks, glowing at the fire holes.
    for (let k = 0; k < 6; k++) {
      const s = 0.15 - k * 0.02;
      for (let i = 0; i < 4; i++)
        wbox(
          l,
          0.82,
          0.86,
          0.036 + k * 0.02,
          s * (i % 2 ? 1 : 0.9),
          0.019,
          s * (i % 2 ? 0.9 : 1),
          tone('#a94f33', 0.2),
          i * 0.3,
        );
    }
    for (const dx of [-0.05, 0.05])
      wbox(l, ...off(l, 0.82, 0.86, dx, 0.08), 0.045, 0.014, 0.01, 0.01, '#ff9a3a', 0, 0, 1);
    smoke(l, 0.82, 0.86, 0.17, 3);
    wbox(l, 0.5, 0.5, 0.036, 0.07, 0.012, 0.05, '#8a7a5a');
    window4(l, 0.28, 0.8, 0.38, 0.26, '-x', 0, 0.07, 0.035);
    window4(l, 0.28, 0.8, 0.38, 0.26, '+x', 0, 0.07, 0.035);
    window4(l, 0.28, 0.8, 0.38, 0.26, '-z', 0, 0.07, 0.035);
    window4(l, 0.28, 0.8, 0.38, 0.26, '+z', 0, 0.07, 0.035);
    barrel(l, 0.52, 0.66);
    lanternPost(l, 0.56, 0.9, 0.14);
    shrub(l, 0.92, 0.12, 0.04);
  },

  brick_works(l) {
    ground(l, 'brick_works', '#b58a62', [0.08, 0.08, 0.94, 0.94]);
    yard(l, 0.34, 0.4, 0.4, 0.95, 'brick', 5);
    yard(l, 0.56, 0.7, 0.72, 0.95, 'brick', 5);
    const clay = '#c4724a';
    rockMass(l, 0.05, 0.05, 0.95, 0.22, 0.036, 0.055, clay, grass, 0.055);
    rockMass(l, 0.05, 0.22, 0.17, 0.5, 0.036, 0.055, clay, grass, 0.055);
    rockMass(l, 0.05, 0.05, 0.7, 0.12, 0.091, 0.045, shade(clay, 0.92), grass, 0.055);
    waterSheet(l, 0.44, 0.34, 0.26, 0.16, 0.04, '#6f93a6');
    // Steam excavator in the cut: boiler, cab, jib and bucket.
    const ex = 0.6;
    const ez = 0.36;
    wbox(l, ex, ez, 0.036, 0.11, 0.025, 0.075, '#3c3c3f');
    wbox(l, ex, ez, 0.061, 0.09, 0.05, 0.07, '#b8863a');
    wround(l, ...off(l, ex, ez, -0.02, 0), 0.014, 0.016, 0.111, 0.07, '#2c2c2f', 8);
    smoke(l, ...off(l, ex, ez, -0.02, 0), 0.19, 3);
    l.beam([ex, 0.1, ez], [ex - 0.13 / l.spanX, 0.15, ez - 0.1 / l.spanZ], 0.01, timber);
    l.beam(
      [ex - 0.13 / l.spanX, 0.15, ez - 0.1 / l.spanZ],
      [ex - 0.17 / l.spanX, 0.05, ez - 0.14 / l.spanZ],
      0.007,
      '#4a4a4c',
    );
    wbox(l, ex - 0.17 / l.spanX, ez - 0.14 / l.spanZ, 0.036, 0.035, 0.026, 0.03, '#3e3e40');
    // Beehive kiln with glowing fire mouths, plus tall brick chimney.
    const kx = 0.78;
    const kz = 0.72;
    brickBody(l, kx, kz, 0.2, 0.2, 0.03, 0.07);
    const dome = new THREE.SphereGeometry(0.095, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.85, 1);
    l.shape(dome, tone('#a8553a', 0.1), kx, kz, 0.1);
    for (let i = 0; i < 4; i++)
      wround(
        l,
        kx,
        kz,
        0.096 - i * 0.012,
        0.099 - i * 0.012,
        0.1 + i * 0.018,
        0.005,
        '#5c3a2c',
        20,
      );
    for (const f of FACES) {
      const a = f === '+z' ? [0, 0.1] : f === '-z' ? [0, -0.1] : f === '+x' ? [0.1, 0] : [-0.1, 0];
      wbox(
        l,
        ...off(l, kx, kz, a[0]!, a[1]!),
        0.036,
        f[1] === 'z' ? 0.04 : 0.008,
        0.04,
        f[1] === 'z' ? 0.008 : 0.04,
        '#ff8c2a',
        0,
        0,
        1,
      );
    }
    wround(l, kx, kz, 0.012, 0.016, 0.19, 0.03, '#3a2a22', 10);
    smoke(l, kx, kz, 0.22, 4);
    const [cx, cz] = off(l, kx, kz, 0.1, -0.19);
    for (let r = 0; r < 40; r++)
      wround(
        l,
        cx,
        cz,
        0.022 - r * 0.0001,
        0.025 - r * 0.00015,
        0.03 + r * 0.0125,
        0.0125,
        tone('#9c5640', 0.2),
        10,
      );
    wround(l, cx, cz, 0.029, 0.02, 0.53, 0.012, '#6a3c2c', 10);
    smoke(l, cx, cz, 0.55, 4);
    // Manager's office: render, red tiles, four lit windows.
    const ox = 0.18;
    const oz = 0.8;
    brickBody(l, ox, oz, 0.22, 0.18, 0.03, 0.12, '#c4663f');
    windows4(l, ox, oz, 0.22, 0.18, 0.07, 0.036, { shutters: '#2f5f6a' });
    door(l, ox, oz, 0.22, 0.18, '+x', 0, 0.03, 0.045, 0.09, timberDark);
    shingleGable(l, ox, oz, 'x', 0.22, 0.18, 0.15, 0.08, '#a8402c', '#c4663f');
    // Roofed drying racks with brick stacks, fired brick pile and rails.
    for (let k = 0; k < 2; k++) {
      const rz = 0.54 + k * 0.1;
      for (const x of [0.42, 0.66]) wbox(l, x, rz, 0.036, 0.01, 0.14, 0.01, timber);
      for (let lv = 0; lv < 3; lv++)
        for (let i = 0; i < 6; i++)
          wbox(
            l,
            0.44 + i * 0.038,
            rz,
            0.05 + lv * 0.034,
            0.034,
            0.014,
            0.04,
            tone('#bd6a45', 0.2),
          );
      tinGable(l, 0.54, rz, 'x', 0.28, 0.08, 0.176, 0.025, '#8c6a3a');
    }
    railLine(l, 0.3, 0.3, 0.3, 0.7, 0.036, { steel: true });
    wagon(l, 0.3, 0.5, Math.PI / 2, '#c26e44', 0.042, '#6e6e70');
    blockStack(l, 0.52, 0.9, 0.036, 5, 2, 4, '#b9603a', 0.036);
    workers(l, [
      [0.34, 0.4, '#8a4a3a', '#8a6a3a'],
      [0.5, 0.74, '#5a7a9a', '#3a3a3c'],
      [0.66, 0.9, '#6a8a5a', '#8a6a3a'],
    ]);
    lanternPost(l, 0.4, 0.66, 0.16);
    shrub(l, 0.92, 0.12, 0.04);
  },

  industrial_brickyard(l) {
    ground(l, 'industrial_brickyard', '#aa8a68', [0.06, 0.06, 0.95, 0.95]);
    yard(l, 0.4, 0.5, 0.7, 0.58, 'brick', 5);
    const clay = '#c4724a';
    rockMass(l, 0.05, 0.05, 0.95, 0.2, 0.036, 0.05, clay, grass, 0.055);
    rockMass(l, 0.05, 0.2, 0.15, 0.42, 0.036, 0.05, clay, grass, 0.055);
    waterSheet(l, 0.5, 0.3, 0.26, 0.12, 0.04, '#5f8aa2');
    // Bucket excavator feeding a belt.
    wbox(l, 0.4, 0.3, 0.036, 0.13, 0.03, 0.09, '#2f3234');
    wbox(l, 0.4, 0.3, 0.066, 0.1, 0.06, 0.08, '#e0a82e');
    window4(l, 0.4, 0.3, 0.1, 0.08, '+z', 0, 0.08, 0.03);
    l.beam([0.38, 0.12, 0.28], [0.3, 0.17, 0.2], 0.012, '#e0a82e');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        0.3 + (Math.cos(a) * 0.025) / l.spanX,
        0.2,
        0.12 + Math.sin(a) * 0.025,
        0.012,
        0.012,
        0.03,
        '#cfcfcf',
      );
    }
    conveyor(l, [0.46, 0.066, 0.34], [0.7, 0.2, 0.52], 4);
    // Tunnel kiln hall: long red-brick vault with a glowing portal, steel roof, stacks.
    const hx = 0.5;
    const hz = 0.74;
    brickBody(l, hx, hz, 0.7, 0.28, 0.03, 0.15);
    windows4(l, hx, hz, 0.7, 0.28, 0.09, 0.04, { frame: '#e9dfc9' });
    tinGable(l, hx, hz, 'x', 0.7, 0.28, 0.18, 0.1, '#55575b', brick);
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.27 + i * 0.1, 0), 0.28, 0.03, 0.028, 0.04, '#3a3a3c');
    wbox(l, ...off(l, hx, hz, -0.35, 0), 0.03, 0.004, 0.1, 0.11, '#ff8c2a', 0, 0, 1);
    wbox(l, ...off(l, hx, hz, 0.35, 0), 0.03, 0.004, 0.1, 0.11, '#ff8c2a', 0, 0, 1);
    for (const [dx, h] of [
      [-0.24, 0.5],
      [0.2, 0.62],
    ] as const) {
      const [cx, cz] = off(l, hx, hz, dx, -0.08);
      for (let r = 0; r < Math.round(h / 0.0125); r++)
        wround(l, cx, cz, 0.022, 0.026, 0.03 + r * 0.0125, 0.0125, tone('#9c5640', 0.2), 10);
      wround(l, cx, cz, 0.03, 0.022, 0.03 + h, 0.012, '#6a3c2c', 10);
      smoke(l, cx, cz, 0.04 + h, 4);
    }
    wbox(l, ...off(l, hx, hz, 0.2, 0.17), 0.03, 0.25, 0.1, 0.06, '#9aa0a4');
    // Pallets of shrink-wrapped bricks, forklift, delivery truck and crew.
    for (let i = 0; i < 4; i++) {
      const px = 0.14 + (i % 2) * 0.1;
      const pz = 0.4 + Math.floor(i / 2) * 0.1;
      wbox(l, px, pz, 0.036, 0.08, 0.012, 0.08, plank);
      blockStack(l, px, pz, 0.048, 2, 2, 3, '#c4673f', 0.036);
    }
    wbox(l, 0.3, 0.5, 0.04, 0.05, 0.03, 0.04, '#e0a82e');
    wbox(l, 0.3, 0.5, 0.07, 0.04, 0.02, 0.04, '#2c3134');
    l.beam([0.285, 0.04, 0.5], [0.285, 0.1, 0.5], 0.003, '#2c3134');
    truck(l, 0.76, 0.46, Math.PI, '#c93a2a');
    workers(l, [
      [0.5, 0.52, hiVis, '#f2cf4a'],
      [0.6, 0.58, hiVis, '#f2cf4a'],
      [0.22, 0.56, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.08, 0.5, 0.26);
    floodlight(l, 0.92, 0.6, 0.3);
    shrub(l, 0.93, 0.28, 0.04);
  },

  // -----------------------------------------------------------------------------------------
  // Iron mine chain
  // -----------------------------------------------------------------------------------------
  iron_mine(l) {
    ground(l, 'iron_mine', '#988a6e', [0.1, 0.3, 0.94, 0.94]);
    yard(l, 0.4, 0.4, 0.6, 0.55, 'ore', 6);
    yard(l, 0.08, 0.7, 0.24, 0.95, 'ore', 5);
    const rock = '#8d887c';
    // Rocky hillside with the timber-framed adit cut into its face.
    rockMass(l, 0.05, 0.05, 0.62, 0.3, 0.036, 0.1, rock, grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.5, 0.2, 0.136, 0.08, shade(rock, 0.95), grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.36, 0.13, 0.216, 0.05, shade(rock, 0.9), grass, 0.06);
    portal(l, 0.3, 0.3, 0.14, 0.11, 0.036, '+z', timber);
    // Rails out of the adit, ore carts and miners with lamps.
    railLine(l, 0.3, 0.3, 0.3, 0.96);
    wagon(l, 0.3, 0.5, Math.PI / 2, '#7a4a3a');
    wagon(l, 0.3, 0.68, Math.PI / 2, '#6a3e30');
    wagon(l, 0.3, 0.84, Math.PI / 2, null);
    workers(l, [
      [0.4, 0.42, '#8a6a3a', '#5a4a2a'],
      [0.2, 0.6, '#5a7a9a', '#5a4a2a'],
      [0.42, 0.78, '#7a4a3a', '#5a4a2a'],
    ]);
    // Wooden headframe with pulley wheel and a hoist hut.
    const hx = 0.74;
    const hz = 0.3;
    for (const s of [-1, 1]) {
      l.beam(
        [hx - 0.07 / l.spanX, 0.036, hz + (s * 0.05) / l.spanZ],
        [hx, 0.36, hz + (s * 0.01) / l.spanZ],
        0.009,
        timber,
      );
      l.beam(
        [hx + 0.07 / l.spanX, 0.036, hz + (s * 0.05) / l.spanZ],
        [hx, 0.36, hz + (s * 0.01) / l.spanZ],
        0.009,
        timber,
      );
    }
    for (const t of [0.14, 0.24])
      wbox(l, hx, hz, t, 0.12 - t * 0.2, 0.008, 0.1 - t * 0.2, shade(timber, 0.85));
    windingWheel(l, hx, hz, 0.36, 0.034, 0);
    l.beam([hx, 0.36, hz], [hx, 0.06, hz], 0.002, '#2c3134');
    wbox(l, hx, hz, 0.036, 0.05, 0.02, 0.04, '#3a3a3c');
    const ux = 0.7;
    const uz = 0.58;
    boardBody(l, ux, uz, 0.2, 0.16, 0.03, 0.1, plank);
    windows4(l, ux, uz, 0.2, 0.16, 0.055, 0.032, { shutters: '#4a3a2a' });
    door(l, ux, uz, 0.2, 0.16, '-x', 0, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, ux, uz, 'z', 0.16, 0.2, 0.13, 0.08, '#5c4636', plank);
    // Ore sorting bench, stockpile and lanterns.
    wbox(l, 0.74, 0.82, 0.036, 0.22, 0.03, 0.07, plank);
    wbox(l, 0.74, 0.82, 0.066, 0.24, 0.008, 0.09, shade(plank, 0.8));
    for (let i = 0; i < 7; i++)
      wbox(l, 0.65 + i * 0.027, 0.82, 0.074, 0.02, 0.014, 0.024, tone('#7a4a3a', 0.25), i);
    rubble(l, 0.9, 0.56, 0.036, 12, 0.1, '#7a4a3a');
    rubble(l, 0.55, 0.9, 0.036, 8, 0.12, '#8d887c');
    lanternPost(l, 0.18, 0.4, 0.14);
    lanternPost(l, 0.88, 0.7, 0.14);
    shrub(l, 0.9, 0.12, 0.04);
    cypress(l, 0.92, 0.9, 0.18);
  },

  shaft_iron_mine(l) {
    ground(l, 'shaft_iron_mine', '#8f8670', [0.08, 0.28, 0.95, 0.95]);
    yard(l, 0.4, 0.4, 0.58, 0.55, 'ore', 6);
    yard(l, 0.08, 0.6, 0.2, 0.95, 'ore', 4);
    const rock = '#8d887c';
    rockMass(l, 0.05, 0.05, 0.5, 0.28, 0.036, 0.09, rock, grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.36, 0.17, 0.126, 0.07, shade(rock, 0.95), grass, 0.06);
    portal(l, 0.26, 0.28, 0.13, 0.1, 0.036, '+z', '#cfc6b4');
    // Brick headframe tower with a winding wheel and a hipped slate cap.
    const hx = 0.7;
    const hz = 0.26;
    brickBody(l, hx, hz, 0.16, 0.16, 0.03, 0.3);
    windows4(l, hx, hz, 0.16, 0.16, 0.12, 0.034, { frame: '#e9dfc9' });
    windows4(l, hx, hz, 0.16, 0.16, 0.22, 0.034, { frame: '#e9dfc9' });
    stoneBody(l, hx, hz, 0.18, 0.18, 0.33, 0.02, '#8f867a', 0.02);
    const cap = new THREE.ConeGeometry(0.13, 0.1, 4);
    cap.rotateY(Math.PI / 4);
    l.shape(cap, slate, hx, hz, 0.4);
    windingWheel(l, hx, hz + 0.1 / l.spanZ, 0.46, 0.05, 0);
    for (const s of [-1, 1])
      wbox(l, hx + (s * 0.07) / l.spanX, hz + 0.1 / l.spanZ, 0.33, 0.008, 0.13, 0.012, timber);
    l.beam([hx, 0.46, hz + 0.1 / l.spanZ], [hx, 0.06, hz + 0.1 / l.spanZ], 0.002, '#2c3134');
    l.beam(
      [hx - 0.05 / l.spanX, 0.44, hz + 0.1 / l.spanZ],
      [hx - 0.24 / l.spanX, 0.05, hz + 0.28 / l.spanZ],
      0.004,
      '#4a4a4c',
    );
    // Engine house with chimney, steam and glowing windows.
    const ex = 0.66;
    const ez = 0.64;
    brickBody(l, ex, ez, 0.3, 0.2, 0.03, 0.14);
    windows4(l, ex, ez, 0.3, 0.2, 0.08, 0.036, { frame: '#e9dfc9' });
    door(l, ex, ez, 0.3, 0.2, '-x', 0, 0.03, 0.05, 0.095, timberDark);
    shingleGable(l, ex, ez, 'x', 0.3, 0.2, 0.17, 0.09, slate, brick);
    const [cx, cz] = off(l, ex, ez, 0.2, -0.04);
    for (let r = 0; r < 42; r++)
      wround(
        l,
        cx,
        cz,
        0.02 - r * 0.0001,
        0.024 - r * 0.00015,
        0.03 + r * 0.0125,
        0.0125,
        tone('#9c5640', 0.2),
        10,
      );
    wround(l, cx, cz, 0.028, 0.019, 0.03 + 42 * 0.0125, 0.012, '#6a3c2c', 10);
    smoke(l, cx, cz, 0.58, 4);
    // Ore wagons on steel rails, piles of red ore and gas lamps.
    railLine(l, 0.26, 0.28, 0.26, 0.96, 0.036, { steel: true });
    railLine(l, 0.26, 0.84, 0.9, 0.84, 0.036, { steel: true });
    wagon(l, 0.26, 0.5, Math.PI / 2, '#7a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.26, 0.68, Math.PI / 2, '#6a3e30', 0.042, '#6e6e70');
    wagon(l, 0.5, 0.84, 0, null, 0.042, '#6e6e70');
    rubble(l, 0.9, 0.5, 0.036, 16, 0.14, '#7a4a3a');
    rubble(l, 0.4, 0.5, 0.036, 8, 0.1, '#8d887c');
    workers(l, [
      [0.36, 0.44, '#8a6a3a', '#3a3a3c'],
      [0.4, 0.74, '#5a7a9a', '#3a3a3c'],
      [0.82, 0.74, '#7a4a3a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.16, 0.5, 0.16);
    lanternPost(l, 0.9, 0.66, 0.16);
    shrub(l, 0.92, 0.1, 0.04);
  },

  deep_iron_mine(l) {
    ground(l, 'deep_iron_mine', '#857c6a', [0.06, 0.26, 0.95, 0.95]);
    yard(l, 0.06, 0.3, 0.16, 0.6, 'ore', 4);
    yard(l, 0.8, 0.3, 0.94, 0.55, 'ore', 4);
    const rock = '#8a867c';
    rockMass(l, 0.05, 0.05, 0.46, 0.26, 0.036, 0.08, rock, grass, 0.06);
    rockMass(l, 0.05, 0.05, 0.3, 0.16, 0.116, 0.06, shade(rock, 0.95), grass, 0.06);
    portal(l, 0.22, 0.26, 0.15, 0.1, 0.036, '+z', '#a8aeb2');
    // Steel lattice headframe over the shaft with sheave wheels and winding cables.
    const hx = 0.66;
    const hz = 0.2;
    const top = 0.8;
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const) {
      l.beam(
        [hx + (a * 0.1) / l.spanX, 0.036, hz + (b * 0.1) / l.spanZ],
        [hx + (a * 0.02) / l.spanX, top, hz + (b * 0.02) / l.spanZ],
        0.008,
        '#7e868b',
      );
    }
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const;
    for (let k = 1; k < 8; k++) {
      const t = k / 8;
      const r = 0.1 - 0.08 * t;
      const yy = 0.036 + (top - 0.036) * t;
      const t2 = Math.min(1, t + 1 / 8);
      const r2 = 0.1 - 0.08 * t2;
      const y2 = 0.036 + (top - 0.036) * t2;
      for (let c = 0; c < 4; c++) {
        const [a, b] = corners[c]!;
        const [a2, b2] = corners[(c + 1) % 4]!;
        l.beam(
          [hx + (a * r) / l.spanX, yy, hz + (b * r) / l.spanZ],
          [hx + (a2 * r) / l.spanX, yy, hz + (b2 * r) / l.spanZ],
          0.004,
          '#6a7277',
        );
        l.beam(
          [hx + (a * r) / l.spanX, yy, hz + (b * r) / l.spanZ],
          [hx + (a2 * r2) / l.spanX, y2, hz + (b2 * r2) / l.spanZ],
          0.003,
          '#5d666b',
        );
      }
    }
    wbox(l, hx, hz, top, 0.09, 0.02, 0.09, '#d8a832');
    windingWheel(l, hx, hz, top + 0.04, 0.036, 0);
    l.beam([hx, top, hz], [hx, 0.06, hz], 0.002, '#2c3134');
    // Winding house and ore breaker plant with conveyors into silos.
    const wx = 0.36;
    const wz = 0.52;
    boardBody(l, wx, wz, 0.26, 0.2, 0.03, 0.14, '#8d959a');
    windows4(l, wx, wz, 0.26, 0.2, 0.08, 0.036, { frame: '#d8dde0' });
    door(l, wx, wz, 0.26, 0.2, '+x', 0, 0.03, 0.05, 0.095, steelDark);
    tinGable(l, wx, wz, 'x', 0.26, 0.2, 0.17, 0.08, '#4f5a60', '#8d959a');
    const bx = 0.7;
    const bz = 0.6;
    boardBody(l, bx, bz, 0.26, 0.22, 0.03, 0.2, '#7f8a90');
    windows4(l, bx, bz, 0.26, 0.22, 0.12, 0.034, { frame: '#d8dde0' });
    tinGable(l, bx, bz, 'z', 0.22, 0.26, 0.23, 0.07, '#4f5a60', '#7f8a90');
    wbox(l, bx, bz, 0.3, 0.1, 0.04, 0.1, '#5e6a70');
    conveyor(l, [0.3, 0.04, 0.4], [0.62, 0.3, 0.52], 5);
    conveyor(l, [0.82, 0.3, 0.58], [0.84, 0.33, 0.84], 3);
    steelSilo(l, 0.84, 0.86, 0.05, 0.3);
    steelSilo(l, 0.7, 0.9, 0.04, 0.24);
    for (const dx of [0.0, 0.08]) {
      const [cx, cz] = off(l, bx, bz, -0.12 + dx, 0.06);
      wround(l, cx, cz, 0.012, 0.015, 0.03, 0.46 + dx * 2, steel, 10);
      smoke(l, cx, cz, 0.5 + dx * 2, 3);
    }
    // Ore loadout: rails with loaded wagons, a dump truck, floodlights and crew.
    railLine(l, 0.06, 0.78, 0.6, 0.78, 0.036, { steel: true });
    railLine(l, 0.06, 0.86, 0.6, 0.86, 0.036, { steel: true });
    wagon(l, 0.2, 0.78, 0, '#7a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.34, 0.78, 0, '#7a4a3a', 0.042, '#6e6e70');
    wagon(l, 0.48, 0.78, 0, '#6a3e30', 0.042, '#6e6e70');
    truck(l, 0.4, 0.9, Math.PI, '#e0a82e');
    workers(l, [
      [0.5, 0.42, hiVis, '#f2cf4a'],
      [0.22, 0.7, hiVis, '#f2cf4a'],
      [0.56, 0.7, '#f2cf4a', '#f2cf4a'],
    ]);
    floodlight(l, 0.1, 0.42, 0.3);
    floodlight(l, 0.92, 0.4, 0.3);
    shrub(l, 0.94, 0.08, 0.04);
  },

  // -----------------------------------------------------------------------------------------
  // Rail track chain
  // -----------------------------------------------------------------------------------------
  rail_track(l) {
    reseed('rail_track');
    meadow(l, grass, 30);
    // Gravel ballast bed with rough timber sleepers and iron-clad wooden rails.
    wbox(l, 0.5, 0.5, 0.03, 0.96, 0.012, 0.3, '#9a9488');
    for (let i = 0; i < 60; i++)
      wbox(
        l,
        0.03 + rand() * 0.94,
        0.37 + rand() * 0.26,
        0.042,
        0.012 + rand() * 0.012,
        0.006,
        0.01 + rand() * 0.012,
        tone('#a8a296', 0.25),
        rand() * 3,
      );
    for (let i = 0; i < 24; i++)
      wbox(l, 0.05 + i * 0.039, 0.5, 0.042, 0.016, 0.012, 0.22, tone('#6b4a2c', 0.22));
    for (const dz of [-0.07, 0.07]) {
      wbox(l, 0.5, 0.5 + dz, 0.054, 0.96, 0.012, 0.014, '#7a5836');
      wbox(l, 0.5, 0.5 + dz, 0.066, 0.96, 0.004, 0.008, '#4d4f52');
      for (let i = 0; i < 12; i++)
        wbox(l, 0.08 + i * 0.075, 0.5 + dz, 0.054, 0.006, 0.016, 0.018, '#3a3a3c');
    }
    // Switch lever, buffer stop and a handcart.
    wbox(l, 0.36, 0.7, 0.03, 0.03, 0.03, 0.03, '#8a8478');
    l.beam([0.36, 0.06, 0.7], [0.4, 0.15, 0.68], 0.006, '#3a3a3c');
    wbox(l, 0.4, 0.68, 0.15, 0.016, 0.012, 0.016, '#c93a2a');
    wagon(l, 0.7, 0.5, 0, '#b8b2a2', 0.05, '#6b5a4a');
    // Timber signal box with a lantern and four lit windows, plus a signal arm.
    const hx = 0.22;
    const hz = 0.2;
    boardBody(l, hx, hz, 0.2, 0.16, 0.03, 0.1, '#8a6a48');
    windows4(l, hx, hz, 0.2, 0.16, 0.055, 0.034, { shutters: '#4a3a2a' });
    door(l, hx, hz, 0.2, 0.16, '+z', 0.04, 0.03, 0.045, 0.08, timberDark);
    shingleGable(l, hx, hz, 'x', 0.2, 0.16, 0.13, 0.07, '#5c4636', '#8a6a48');
    chimney(l, ...off(l, hx, hz, 0.05, -0.02), 0.15, 0.06, '#8f8a80');
    lanternPost(l, 0.5, 0.26, 0.14);
    wbox(l, 0.84, 0.28, 0.03, 0.012, 0.16, 0.012, '#4a3a2a');
    wbox(l, 0.84, 0.28, 0.17, 0.05, 0.012, 0.008, '#c93a2a');
    for (const [x, z] of [
      [0.62, 0.82],
      [0.86, 0.78],
    ] as const)
      shrub(l, x, z, 0.04);
    person(l, 0.58, 0.64, 0.03, '#5a7a9a', '#3a3a3c');
    shrub(l, 0.08, 0.86, 0.045);
  },

  iron_rail_track(l) {
    reseed('iron_rail_track');
    meadow(l, grass, 26);
    wbox(l, 0.5, 0.5, 0.03, 0.96, 0.014, 0.34, '#8f8a80');
    for (let i = 0; i < 80; i++)
      wbox(
        l,
        0.03 + rand() * 0.94,
        0.34 + rand() * 0.32,
        0.044,
        0.012 + rand() * 0.012,
        0.006,
        0.01 + rand() * 0.012,
        tone('#a09a8e', 0.25),
        rand() * 3,
      );
    for (let i = 0; i < 36; i++)
      wbox(l, 0.04 + i * 0.0265, 0.5, 0.044, 0.014, 0.014, 0.24, tone('#5a4636', 0.18));
    for (const dz of [-0.075, 0.075]) {
      wbox(l, 0.5, 0.5 + dz, 0.058, 0.96, 0.006, 0.02, '#4d4f52');
      wbox(l, 0.5, 0.5 + dz, 0.064, 0.96, 0.016, 0.008, '#c0c6ca');
      wbox(l, 0.5, 0.5 + dz, 0.08, 0.96, 0.006, 0.016, '#d8dde0');
      for (let i = 0; i < 12; i++)
        wbox(l, 0.08 + i * 0.075, 0.5 + dz, 0.06, 0.02, 0.02, 0.026, '#3a3a3c');
    }
    // Brick signal cabin with slate roof and four lit windows.
    const hx = 0.24;
    const hz = 0.2;
    brickBody(l, hx, hz, 0.22, 0.17, 0.03, 0.14);
    windows4(l, hx, hz, 0.22, 0.17, 0.085, 0.036, { frame: '#e9dfc9', shutters: '#2f5f6a' });
    door(l, hx, hz, 0.22, 0.17, '+z', -0.05, 0.03, 0.045, 0.09, timberDark);
    shingleGable(l, hx, hz, 'x', 0.22, 0.17, 0.17, 0.09, slate, brick);
    chimney(l, ...off(l, hx, hz, -0.07, -0.02), 0.19, 0.07, '#8f4a35');
    smoke(l, ...off(l, hx, hz, -0.07, -0.02), 0.28, 2);
    // Semaphore signal mast, points lever frame, lamp posts and a platelayer.
    wbox(l, 0.74, 0.26, 0.03, 0.012, 0.26, 0.012, '#d8dde0');
    wbox(l, 0.74, 0.26, 0.26, 0.07, 0.014, 0.008, '#c93a2a');
    wbox(l, 0.74, 0.26, 0.275, 0.018, 0.018, 0.018, '#ffd27a', 0, 0, 1);
    for (let i = 0; i < 4; i++) {
      const x = 0.44 + i * 0.035;
      wbox(l, x, 0.7, 0.03, 0.01, 0.07, 0.01, '#3a3a3c');
      l.beam(
        [x, 0.08, 0.7],
        [x + 0.01, 0.16, 0.68],
        0.005,
        ['#c93a2a', '#2f5f86', '#c93a2a', '#e0a82e'][i]!,
      );
    }
    wbox(l, 0.5, 0.7, 0.03, 0.18, 0.012, 0.03, '#8a8478');
    lanternPost(l, 0.58, 0.24, 0.16);
    lanternPost(l, 0.88, 0.76, 0.16);
    person(l, 0.64, 0.68, 0.03, '#d65a3a', '#3a3a3c');
    wagon(l, 0.76, 0.5, 0, '#a8a296', 0.058, '#5a5f63');
    shrub(l, 0.1, 0.84, 0.045);
    shrub(l, 0.92, 0.9, 0.04);
  },
};
