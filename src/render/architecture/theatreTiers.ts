import * as THREE from 'three';
import { type Lot, type Recipes } from './lot';

// Theatre chain (2×2, culture): open_air_stage -> playhouse -> opera_house.
// Built like the other tier recipes, with extra realism: recessed arched windows with
// keystones, true hipped roofs with tile courses and hip caps, column orders, dentil
// cornices, layered tree canopies, street furniture and small figures for scale.

const paving = '#bdb6a6';
const pavingLight = '#d3cdbe';
const pavingDark = '#a39c8c';
const cobble = '#958d7e';
const grass = '#7c9a52';
const earth = '#b39e7a';
const rustic = '#c4b89e';
const stone = '#d6cbb3';
const limestone = '#e6dcc7';
const marble = '#f2ede2';
const brick = '#a65038';
const brickDark = '#83402d';
const plaster = '#eadfca';
const timber = '#5c3f27';
const timberDark = '#3b2817';
const plank = '#8a6342';
const plankLight = '#a47a52';
const slate = '#4b5a67';
const copper = '#5f9b88';
const copperDark = '#457a69';
const lead = '#5d6468';
const iron = '#2c3134';
const gold = '#d7af4b';
const velvet = '#9c2330';
const velvetDark = '#731a24';
const canvas = '#ece1c6';
const glass = '#f4c35a';
const bulb = '#ffe7a3';
const leaf = ['#4f7f3a', '#5f9143', '#44723a', '#6c9a49'] as const;
const coats = [
  '#3c4f6b',
  '#7a2f2c',
  '#2f3a33',
  '#b9a37a',
  '#5b4a6e',
  '#c76c3d',
  '#e2d6c2',
] as const;
const posters = ['#c8443a', '#2f6e8c', '#e3b43c', '#6f4c8f', '#3f8a5c'] as const;

const pick = <T>(list: readonly T[], i: number): T => list[i % list.length] as T;

/** True hipped roof (two trapezoids + two triangles) with tile courses, ridge and hip caps. */
function hipRoof(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
  courses = 6,
): void {
  const W = (w * l.spanX) / 2;
  const D = (d * l.spanZ) / 2;
  const alongX = W >= D;
  const r = Math.abs(W - D);
  const a: [number, number] = alongX ? [r, 0] : [0, r];
  const v: number[] = [];
  const tri = (p: number[], q: number[], s: number[]): void => {
    v.push(...p, ...q, ...s);
  };
  const ridgeA = [a[0], h, a[1]];
  const ridgeB = [-a[0], h, -a[1]];
  const c = { ne: [W, 0, -D], se: [W, 0, D], sw: [-W, 0, D], nw: [-W, 0, -D] };
  if (alongX) {
    tri(c.sw, c.se, ridgeA);
    tri(c.sw, ridgeA, ridgeB);
    tri(c.ne, c.nw, ridgeB);
    tri(c.ne, ridgeB, ridgeA);
    tri(c.se, c.ne, ridgeA);
    tri(c.nw, c.sw, ridgeB);
  } else {
    tri(c.se, c.ne, ridgeB);
    tri(c.se, ridgeB, ridgeA);
    tri(c.nw, c.sw, ridgeA);
    tri(c.nw, ridgeA, ridgeB);
    tri(c.sw, c.se, ridgeA);
    tri(c.ne, c.nw, ridgeB);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  l.shape(g, color, x, z, y);
  // Tile courses: rectangles shrinking towards the ridge, just proud of the roof planes.
  const fx = (wx: number): number => x + wx / l.spanX;
  const fz = (wz: number): number => z + wz / l.spanZ;
  for (let i = 1; i < courses; i++) {
    const t = i / courses;
    const cw = W - (W - (alongX ? r : 0)) * t + 0.004;
    const cd = D - (D - (alongX ? 0 : r)) * t + 0.004;
    const cy = y + h * t + 0.004;
    const col = shadeHex(color, i % 2 ? 0.82 : 1.12);
    l.beam([fx(-cw), cy, fz(cd)], [fx(cw), cy, fz(cd)], 0.008, col);
    l.beam([fx(-cw), cy, fz(-cd)], [fx(cw), cy, fz(-cd)], 0.008, col);
    l.beam([fx(cw), cy, fz(-cd)], [fx(cw), cy, fz(cd)], 0.008, col);
    l.beam([fx(-cw), cy, fz(-cd)], [fx(-cw), cy, fz(cd)], 0.008, col);
  }
  const cap = shadeHex(color, 0.72);
  l.beam(
    [fx(ridgeA[0]!), y + h + 0.006, fz(ridgeA[2]!)],
    [fx(ridgeB[0]!), y + h + 0.006, fz(ridgeB[2]!)],
    0.022,
    cap,
  );
  for (const [cx, cz] of [
    [W, D],
    [W, -D],
    [-W, D],
    [-W, -D],
  ] as const) {
    const end = (alongX ? Math.sign(cx) : Math.sign(cz)) > 0 ? ridgeA : ridgeB;
    l.beam([fx(cx), y + 0.006, fz(cz)], [fx(end[0]!), y + h + 0.006, fz(end[2]!)], 0.018, cap);
  }
  // Gutter and eave board.
  l.block(x, z, w + 0.012, d + 0.012, y - 0.016, 0.018, shadeHex(color, 0.6));
}

function shadeHex(hex: string, f: number): string {
  return `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;
}

/** A recessed window on a wall facing ±z (axis 'z') or ±x (axis 'x'), optionally round-headed. */
function windowOn(
  l: Lot,
  axis: 'z' | 'x',
  along: number,
  wall: number,
  dir: 1 | -1,
  w: number,
  y: number,
  h: number,
  opts: { arched?: boolean; frame?: string; sill?: string; keystone?: string; pane?: string } = {},
): void {
  const frame = opts.frame ?? stone;
  const sill = opts.sill ?? stone;
  const pane = opts.pane ?? glass;
  const at = (o: number): [number, number] =>
    axis === 'z' ? [along, wall + dir * o] : [wall + dir * o, along];
  const blk = (
    o: number,
    span: number,
    thick: number,
    by: number,
    bh: number,
    col: string,
    glow = 0,
  ): void => {
    const [bx, bz] = at(o);
    if (axis === 'z') l.block(bx, bz, span, thick, by, bh, col, glow);
    else l.block(bx, bz, thick, span, by, bh, col, glow);
  };
  // Architrave surround, dark reveal, glazing, glazing bars, sill and lintel.
  blk(0.004, w + 0.022, 0.01, y - 0.01, h + 0.012, frame);
  blk(0.006, w + 0.004, 0.008, y - 0.002, h + 0.002, '#2a2622');
  blk(0.008, w, 0.006, y, h, pane, 1);
  blk(0.011, 0.007, 0.005, y, h, '#e9e2d2');
  for (const t of [0.36, 0.7]) blk(0.011, w, 0.005, y + h * t, 0.006, '#e9e2d2');
  blk(0.011, w + 0.03, 0.022, y - 0.022, 0.014, sill);
  const span = axis === 'z' ? l.spanX : l.spanZ;
  if (opts.arched) {
    const r = (w * span) / 2;
    const disc = (radius: number, o: number, col: string, glow = 0): void => {
      const g = new THREE.CylinderGeometry(
        radius,
        radius,
        0.008,
        12,
        1,
        false,
        Math.PI / 2,
        Math.PI,
      );
      g.rotateX(Math.PI / 2);
      if (axis === 'x') g.rotateY(Math.PI / 2);
      const [bx, bz] = at(o);
      l.shape(g, col, bx, bz, y + h, glow);
    };
    disc(r + 0.011, 0.004, frame);
    disc(r + 0.002, 0.006, '#2a2622');
    disc(r, 0.008, pane, 1);
    blk(0.012, 0.016, 0.014, y + h + r - 0.004, 0.028, opts.keystone ?? marble);
  } else {
    blk(0.009, w + 0.034, 0.02, y + h + 0.006, 0.022, opts.keystone ?? frame);
  }
}

/** Column with plinth, shaft, necking and capital. */
function column(
  l: Lot,
  x: number,
  z: number,
  y: number,
  h: number,
  r: number,
  color = marble,
): void {
  l.block(x, z, r * 2.6, r * 2.6, y, 0.022, stone);
  l.round(x, z, r * 1.15, r * 1.25, y + 0.022, 0.014, color);
  l.round(x, z, r * 0.88, r, y + 0.036, h - 0.072, color);
  l.round(x, z, r * 1.2, r * 0.92, y + h - 0.036, 0.016, color);
  l.block(x, z, r * 2.7, r * 2.7, y + h - 0.02, 0.02, color);
}

/** Lamp post: base, fluted iron shaft, lantern that glows at night. */
function lamp(l: Lot, x: number, z: number, y: number, h = 0.26, double = false): void {
  l.round(x, z, 0.012, 0.016, y, 0.03, iron);
  l.round(x, z, 0.005, 0.007, y + 0.03, h - 0.03, iron);
  const heads: [number, number][] = double
    ? [
        [-0.022, 0],
        [0.022, 0],
      ]
    : [[0, 0]];
  if (double) l.block(x, z, 0.054, 0.006, y + h - 0.01, 0.006, iron);
  for (const [dx, dz] of heads) {
    l.block(x + dx, z + dz, 0.014, 0.014, y + h - 0.004, 0.026, bulb, 1);
    l.block(x + dx, z + dz, 0.019, 0.019, y + h + 0.022, 0.006, iron);
    l.round(x + dx, z + dz, 0.002, 0.008, y + h + 0.028, 0.012, iron);
  }
}

/** Tree with a trunk, a few branches and a lumpy layered canopy. */
function tree(l: Lot, x: number, z: number, h: number, seed: number): void {
  l.round(x, z, 0.008, 0.013, 0.03, h * 0.5, '#6b4e36');
  const blobs = [
    [0, 0.62, 0, 0.22],
    [0.05, 0.54, 0.03, 0.16],
    [-0.045, 0.56, -0.02, 0.17],
    [0.01, 0.78, -0.03, 0.15],
    [-0.02, 0.7, 0.045, 0.14],
  ] as const;
  blobs.forEach(([dx, dy, dz, r], i) => {
    const g = new THREE.IcosahedronGeometry(r * h * 0.55, 1);
    g.scale(1, 0.85, 1);
    l.shape(g, pick(leaf, seed + i), x + dx / 2, z + dz / 2, dy * h);
  });
}

/** A standing person roughly 0.07 tall. */
function figure(l: Lot, x: number, z: number, y: number, seed: number, seated = false): void {
  const coat = pick(coats, seed);
  const legs = seated ? 0 : 0.026;
  if (!seated) l.block(x, z, 0.012, 0.008, y, legs, '#2b2a2c');
  l.round(x, z, 0.007, 0.009, y + legs, 0.03, coat);
  const head = new THREE.SphereGeometry(0.0075, 8, 6);
  l.shape(head, '#e0b593', x, z, y + legs + 0.038);
  if (seed % 3 === 0) l.round(x, z, 0.004, 0.009, y + legs + 0.044, 0.006, '#2d2a28');
}

/** Advertising column with a domed cap and bands of posters. */
function posterColumn(l: Lot, x: number, z: number, y: number, seed: number): void {
  l.round(x, z, 0.022, 0.024, y, 0.02, '#3f5a49');
  l.round(x, z, 0.019, 0.019, y + 0.02, 0.15, '#e9e0cc');
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + seed;
    const panel = new THREE.BoxGeometry(0.02, 0.05 + (i % 2) * 0.02, 0.004);
    panel.rotateY(a);
    const r = 0.039;
    l.shape(
      panel,
      pick(posters, seed + i),
      x + (Math.sin(a) * r) / l.spanX,
      z + (Math.cos(a) * r) / l.spanZ,
      y + 0.06,
    );
  }
  l.round(x, z, 0.025, 0.021, y + 0.17, 0.014, '#3f5a49');
  l.dome(x, z, 0.013, 0.013, y + 0.184, 0.03, '#3f5a49');
}

function bench(l: Lot, x: number, z: number, y: number, along: 'x' | 'z'): void {
  const [w, d] = along === 'x' ? [0.08, 0.022] : [0.022, 0.08];
  l.block(x, z, w, d, y + 0.022, 0.008, plank);
  for (const s of [-1, 1]) {
    if (along === 'x') l.block(x + s * 0.032, z, 0.006, 0.02, y, 0.022, iron);
    else l.block(x, z + s * 0.032, 0.02, 0.006, y, 0.022, iron);
  }
}

/** Points along a sagging cable, used for festoon lights and bunting. */
function festoon(
  l: Lot,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  sag: number,
  count: number,
  lights = true,
): void {
  let prev: [number, number, number] = [a[0], a[1], a[2]];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const p: [number, number, number] = [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t),
      a[2] + (b[2] - a[2]) * t,
    ];
    l.beam(prev, p, 0.003, '#2a2624');
    if (i < count) {
      if (lights) l.block(p[0], p[2], 0.006, 0.006, p[1] - 0.01, 0.009, bulb, 1);
      else l.block(p[0], p[2], 0.009, 0.004, p[1] - 0.018, 0.016, pick(posters, i));
    }
    prev = p;
  }
}

/** Horizontal rustication grooves round a block. */
function rustication(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  step = 0.04,
): void {
  for (let gy = y + step; gy < y + h - 0.01; gy += step) {
    l.block(x, z, w + 0.006, d + 0.006, gy, 0.007, shadeHex(rustic, 0.78));
  }
}

/** Projecting cornice with a dentil course under it, on all four sides. */
function cornice(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  color = limestone,
): void {
  l.block(x, z, w + 0.012, d + 0.012, y, 0.03, shadeHex(color, 0.95));
  const n = Math.round(w / 0.03);
  for (let i = 0; i < n; i++) {
    const dx = x - w / 2 + (i + 0.5) * (w / n);
    l.block(dx, z + d / 2 + 0.008, 0.012, 0.012, y - 0.012, 0.012, color);
    l.block(dx, z - d / 2 - 0.008, 0.012, 0.012, y - 0.012, 0.012, color);
  }
  const m = Math.round(d / 0.03);
  for (let i = 0; i < m; i++) {
    const dz = z - d / 2 + (i + 0.5) * (d / m);
    l.block(x + w / 2 + 0.008, dz, 0.012, 0.012, y - 0.012, 0.012, color);
    l.block(x - w / 2 - 0.008, dz, 0.012, 0.012, y - 0.012, 0.012, color);
  }
  l.block(x, z, w + 0.04, d + 0.04, y + 0.03, 0.016, color);
}

/** Balustrade (posts and top rail) along the front or round a roof edge. */
function balustrade(
  l: Lot,
  x0: number,
  x1: number,
  z: number,
  y: number,
  along: 'x' | 'z' = 'x',
): void {
  const len = Math.abs(x1 - x0);
  const n = Math.max(2, Math.round(len / 0.018));
  for (let i = 0; i <= n; i++) {
    const p = x0 + ((x1 - x0) * i) / n;
    if (along === 'x') l.round(p, z, 0.004, 0.005, y, 0.035, marble);
    else l.round(z, p, 0.004, 0.005, y, 0.035, marble);
  }
  const mid = (x0 + x1) / 2;
  if (along === 'x') l.block(mid, z, len + 0.01, 0.016, y + 0.035, 0.01, marble);
  else l.block(z, mid, 0.016, len + 0.01, y + 0.035, 0.01, marble);
}

function statue(l: Lot, x: number, z: number, y: number, color = '#c9c4b5'): void {
  l.block(x, z, 0.028, 0.028, y, 0.03, stone);
  l.round(x, z, 0.008, 0.012, y + 0.03, 0.045, color);
  l.shape(new THREE.SphereGeometry(0.009, 8, 6), color, x, z, y + 0.085);
  l.beam([x, y + 0.07, z], [x + 0.014, y + 0.1, z + 0.006], 0.006, color);
}

export const theatreTiers: Recipes = {
  // ===========================================================================
  // Tier 1: open-air stage on a village green
  // ===========================================================================
  open_air_stage(l) {
    l.base(grass, 0.03);
    // Trampled earth floor in front of the stage.
    for (const [cx, cz, cw, cd] of [
      [0.5, 0.62, 0.84, 0.5],
      [0.5, 0.9, 0.5, 0.1],
    ] as const) {
      l.block(cx, cz, cw, cd, 0.03, 0.004, earth);
    }
    // Stage deck on trestles, with plank seams and front steps.
    const sx = 0.5;
    const sz = 0.27;
    l.block(sx, sz, 0.62, 0.28, 0.03, 0.1, timberDark);
    l.block(sx, sz, 0.64, 0.3, 0.13, 0.014, plankLight);
    for (let i = 0; i < 9; i++) {
      l.block(sx, sz - 0.14 + (i + 0.5) * (0.3 / 9), 0.64, 0.003, 0.144, 0.002, plank);
    }
    for (let i = 0; i < 6; i++)
      l.block(0.21 + i * 0.116, sz + 0.142, 0.012, 0.006, 0.03, 0.1, timber);
    for (const [i, h] of [0.075, 0.05, 0.025].entries())
      l.block(sx, 0.44 + i * 0.026, 0.16, 0.028, 0.03, h, plank);

    // Back scaffold with a painted backdrop (sky, hills, sun).
    l.block(sx, 0.125, 0.62, 0.02, 0.144, 0.36, timber);
    l.block(sx, 0.137, 0.58, 0.006, 0.16, 0.32, '#8fb4cc');
    l.block(sx, 0.141, 0.58, 0.004, 0.16, 0.1, '#6f9c58');
    l.block(sx - 0.12, 0.142, 0.22, 0.004, 0.2, 0.07, '#5a8a49');
    l.round(sx + 0.16, 0.142, 0.03, 0.03, 0.39, 0.004, '#f2cf62');
    for (const px of [0.19, 0.81]) {
      l.block(px, 0.13, 0.026, 0.026, 0.03, 0.56, timber);
      // Gathered curtains on the proscenium posts.
      l.round(px + (px < 0.5 ? 0.03 : -0.03), sz + 0.1, 0.018, 0.026, 0.144, 0.3, velvet);
      l.block(px, sz + 0.12, 0.026, 0.026, 0.03, 0.44, timber);
    }
    l.block(sx, sz + 0.12, 0.66, 0.026, 0.45, 0.06, velvetDark);
    for (let i = 0; i < 11; i++) {
      l.block(0.2 + i * 0.06, sz + 0.135, 0.03, 0.006, 0.43, 0.03, i % 2 ? gold : velvet);
    }
    // Striped canvas awning over the deck.
    for (let i = 0; i < 6; i++) {
      l.ridge(
        0.21 + (i + 0.5) * (0.58 / 6),
        sz,
        0.58 / 6 + 0.002,
        0.36,
        0.5,
        0.12,
        'x',
        i % 2 ? canvas : '#c8473b',
      );
    }
    // A few props on stage: a chair, a trunk and a painted tree flat.
    l.block(0.38, 0.3, 0.04, 0.04, 0.144, 0.04, plank);
    l.block(0.38, 0.285, 0.04, 0.008, 0.184, 0.05, plank);
    l.block(0.62, 0.24, 0.07, 0.045, 0.144, 0.045, '#6d4a2c');
    l.block(0.62, 0.24, 0.074, 0.049, 0.184, 0.008, gold);

    // Curved rows of benches facing the stage, with an audience.
    const cx = 0.5;
    const cz = 0.38;
    let seed = 0;
    for (const [row, radius] of [0.2, 0.28, 0.36, 0.44].entries()) {
      const arcs = 7;
      for (let k = 0; k < arcs; k++) {
        const a0 = Math.PI * (0.18 + (0.64 * k) / arcs) + 0.012;
        const a1 = Math.PI * (0.18 + (0.64 * (k + 1)) / arcs) - 0.012;
        if (k === 3) continue; // centre aisle
        const p = (a: number): [number, number] => [
          cx + Math.cos(a) * radius,
          cz + Math.sin(a) * radius,
        ];
        const [x0, z0] = p(a0);
        const [x1, z1] = p(a1);
        l.beam([x0, 0.058, z0], [x1, 0.058, z1], 0.022, plank);
        for (const [lx, lz] of [p(a0 + 0.02), p(a1 - 0.02)])
          l.block(lx, lz, 0.008, 0.008, 0.03, 0.024, timberDark);
        if ((k + row) % 2 === 0) {
          const [fx, fz] = p((a0 + a1) / 2);
          figure(l, fx, fz, 0.068, seed++, true);
        }
      }
    }

    // Ticket booth with a striped roof.
    l.block(0.86, 0.84, 0.13, 0.1, 0.03, 0.17, plaster);
    l.block(0.86, 0.892, 0.08, 0.006, 0.09, 0.06, glass, 1);
    l.block(0.86, 0.9, 0.1, 0.02, 0.085, 0.008, plank);
    for (let i = 0; i < 4; i++)
      l.ridge(
        0.8 + (i + 0.5) * 0.04,
        0.84,
        0.042,
        0.14,
        0.2,
        0.06,
        'x',
        i % 2 ? canvas : '#c8473b',
      );
    figure(l, 0.86, 0.95, 0.03, 4);
    figure(l, 0.8, 0.96, 0.03, 5);

    // Festoon poles with lights strung to the stage.
    const poles: [number, number][] = [
      [0.08, 0.6],
      [0.92, 0.6],
      [0.08, 0.92],
      [0.7, 0.94],
    ];
    for (const [px, pz] of poles) {
      l.block(px, pz, 0.016, 0.016, 0.03, 0.42, timber);
      l.block(px, pz, 0.022, 0.022, 0.45, 0.01, timberDark);
    }
    festoon(l, [0.08, 0.44, 0.6], [0.19, 0.5, 0.39], 0.03, 6);
    festoon(l, [0.92, 0.44, 0.6], [0.81, 0.5, 0.39], 0.03, 6);
    festoon(l, [0.08, 0.44, 0.6], [0.92, 0.44, 0.6], 0.07, 16, false);
    festoon(l, [0.08, 0.44, 0.92], [0.08, 0.44, 0.6], 0.04, 8);

    tree(l, 0.1, 0.18, 0.62, 0);
    tree(l, 0.9, 0.16, 0.7, 2);
    tree(l, 0.06, 0.8, 0.5, 1);
    l.round(0.94, 0.42, 0.022, 0.02, 0.03, 0.05, timber);
    l.round(0.94, 0.47, 0.022, 0.02, 0.03, 0.05, timber);
    lamp(l, 0.3, 0.92, 0.03, 0.22);
  },

  // ===========================================================================
  // Tier 2: brick playhouse with a lit marquee and a fly loft
  // ===========================================================================
  playhouse(l) {
    l.base(cobble, 0.03);
    // Pavement along the street front with kerb and setts.
    l.block(0.5, 0.9, 0.96, 0.14, 0.03, 0.012, pavingLight);
    l.block(0.5, 0.968, 0.96, 0.014, 0.03, 0.016, pavingDark);
    for (let i = 0; i < 12; i++)
      l.block(0.06 + i * 0.08, 0.9, 0.003, 0.14, 0.042, 0.001, pavingDark);

    // Fly loft behind the auditorium: tall brick block with a hipped slate roof.
    l.block(0.46, 0.2, 0.52, 0.24, 0.03, 0.78, brickDark);
    for (const t of [0.3, 0.55]) l.block(0.46, 0.2, 0.53, 0.25, 0.03 + 0.78 * t, 0.012, stone);
    for (const wz of [0.14, 0.26]) {
      windowOn(l, 'x', wz, 0.2, -1, 0.04, 0.6, 0.1);
      windowOn(l, 'x', wz, 0.72, 1, 0.04, 0.6, 0.1);
    }
    for (const wx of [0.32, 0.46, 0.6]) windowOn(l, 'z', wx, 0.08, -1, 0.05, 0.58, 0.12);
    hipRoof(l, 0.46, 0.2, 0.56, 0.28, 0.81, 0.13, slate, 5);
    // Loading door and hoist beam on the back wall.
    l.block(0.6, 0.08, 0.1, 0.014, 0.03, 0.2, timberDark);
    l.block(0.6, 0.06, 0.012, 0.05, 0.62, 0.012, iron);

    // Auditorium: brick walls, stone dressings, front gable to the street.
    const hx = 0.46;
    const hz = 0.53;
    const hw = 0.66;
    const hd = 0.4;
    l.block(hx, hz, hw + 0.012, hd + 0.012, 0.03, 0.06, stone);
    l.block(hx, hz, hw, hd, 0.09, 0.46, brick);
    l.block(hx, hz, hw + 0.01, hd + 0.01, 0.27, 0.014, stone);
    l.block(hx, hz, hw + 0.016, hd + 0.016, 0.53, 0.024, stone);
    // Quoins.
    for (let i = 0; i < 8; i++) {
      const qy = 0.09 + i * 0.055;
      const big = i % 2 === 0;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          l.block(
            hx + sx * (hw / 2 - (big ? 0.012 : 0.008)),
            hz + sz * (hd / 2 - 0.008),
            big ? 0.03 : 0.018,
            0.02,
            qy,
            0.042,
            stone,
          );
        }
      }
    }
    // Gable roof running back from the street, with stone copings and an oculus.
    l.ridge(hx, hz, hw + 0.04, hd + 0.03, 0.554, 0.3, 'z', slate);
    const front = hz + hd / 2;
    l.beam([hx - hw / 2 - 0.02, 0.56, front + 0.022], [hx, 0.87, front + 0.022], 0.03, stone);
    l.beam([hx + hw / 2 + 0.02, 0.56, front + 0.022], [hx, 0.87, front + 0.022], 0.03, stone);
    {
      const tri = new THREE.BufferGeometry();
      const W = (hw / 2) * l.spanX;
      tri.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([-W, 0, 0, W, 0, 0, 0, 0.3, 0], 3),
      );
      tri.computeVertexNormals();
      l.shape(tri, brick, hx, front + 0.017, 0.554);
      const ring = new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16);
      ring.rotateX(Math.PI / 2);
      l.shape(ring, stone, hx, front + 0.021, 0.66);
      const pane = new THREE.CylinderGeometry(0.038, 0.038, 0.01, 16);
      pane.rotateX(Math.PI / 2);
      l.shape(pane, glass, hx, front + 0.025, 0.66, 1);
      l.block(hx, front + 0.029, 0.004, 0.004, 0.622, 0.076, stone);
      l.block(hx, front + 0.029, 0.076, 0.004, 0.658, 0.004, stone);
    }
    l.round(hx, front - 0.01, 0.006, 0.014, 0.86, 0.06, stone);
    // Tall round-headed windows on the upper floor; sash windows on the sides.
    for (const wx of [hx - 0.2, hx, hx + 0.2])
      windowOn(l, 'z', wx, front, 1, 0.07, 0.31, 0.15, { arched: true });
    for (const wz of [hz - 0.12, hz, hz + 0.12]) {
      windowOn(l, 'x', wz, hx - hw / 2, -1, 0.05, 0.31, 0.14, { arched: true });
      windowOn(l, 'x', wz, hx + hw / 2, 1, 0.05, 0.31, 0.14, { arched: true });
      windowOn(l, 'x', wz, hx + hw / 2, 1, 0.045, 0.13, 0.09);
    }
    // Entrance: three glazed doors, transoms and framed playbills between them.
    for (const dx of [-0.13, 0, 0.13]) {
      l.block(hx + dx, front + 0.004, 0.08, 0.012, 0.09, 0.16, stone);
      l.block(hx + dx, front + 0.008, 0.064, 0.01, 0.09, 0.13, timberDark);
      l.block(hx + dx, front + 0.012, 0.024, 0.006, 0.12, 0.08, glass, 1);
      l.block(hx + dx, front + 0.012, 0.056, 0.006, 0.225, 0.02, glass, 1);
    }
    for (const [i, dx] of [-0.26, -0.065, 0.065, 0.26].entries()) {
      l.block(hx + dx, front + 0.006, 0.05, 0.008, 0.11, 0.1, gold);
      l.block(hx + dx, front + 0.01, 0.04, 0.006, 0.116, 0.088, pick(posters, i));
    }
    for (const [i, h] of [0.03, 0.02, 0.01].entries())
      l.block(hx, front + 0.02 + i * 0.022, 0.44, 0.024, 0.042, h + 0.018, stone);
    // Marquee canopy with a row of bulbs and a name board above.
    l.block(hx, front + 0.07, 0.5, 0.13, 0.25, 0.026, iron);
    l.block(hx, front + 0.135, 0.5, 0.006, 0.236, 0.05, '#20252a');
    for (let i = 0; i < 16; i++)
      l.block(hx - 0.235 + i * 0.0313, front + 0.14, 0.008, 0.006, 0.252, 0.01, bulb, 1);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++)
        l.block(hx + sx * 0.252, front + 0.02 + i * 0.03, 0.006, 0.008, 0.252, 0.01, bulb, 1);
      l.beam(
        [hx + sx * 0.22, 0.4, front + 0.004],
        [hx + sx * 0.22, 0.276, front + 0.13],
        0.006,
        iron,
      );
    }
    l.block(hx, front + 0.1, 0.3, 0.012, 0.276, 0.07, '#7a1d26');
    l.block(hx, front + 0.108, 0.27, 0.006, 0.286, 0.05, '#f6e3a8', 1);
    for (let i = 0; i < 7; i++)
      l.block(hx - 0.1 + i * 0.033, front + 0.112, 0.016, 0.004, 0.294, 0.034, '#5b1219');

    // Side foyer wing (box office) in plaster with a terracotta roof.
    l.block(0.88, 0.58, 0.18, 0.4, 0.03, 0.3, plaster);
    l.block(0.88, 0.58, 0.19, 0.41, 0.03, 0.04, stone);
    l.ridge(0.88, 0.58, 0.22, 0.44, 0.33, 0.12, 'z', '#b45a37');
    windowOn(l, 'z', 0.88, 0.78, 1, 0.08, 0.1, 0.12, { frame: timberDark, sill: stone });
    windowOn(l, 'x', 0.5, 0.97, 1, 0.06, 0.12, 0.1, { frame: timberDark });
    windowOn(l, 'x', 0.66, 0.97, 1, 0.06, 0.12, 0.1, { frame: timberDark });
    l.block(0.88, 0.795, 0.12, 0.016, 0.24, 0.035, '#2e4b3c');

    // Iron fire escape on the west wall.
    const fxw = hx - hw / 2 - 0.04;
    for (const [i, ly] of [0.27, 0.45].entries()) {
      l.block(fxw, hz + 0.04, 0.06, 0.16, ly, 0.008, iron);
      for (const pz of [hz - 0.04, hz + 0.12])
        l.block(fxw - 0.03, pz, 0.004, 0.004, ly, 0.06, iron);
      l.block(fxw - 0.03, hz + 0.04, 0.004, 0.16, ly + 0.056, 0.004, iron);
      const from = i === 0 ? 0.03 : 0.27;
      l.beam([fxw, from, hz + 0.14 - i * 0.18], [fxw, ly, hz - 0.03 + i * 0.12], 0.012, iron);
    }
    l.block(hx - hw / 2 - 0.004, hz + 0.04, 0.008, 0.05, 0.276, 0.14, timberDark);

    // Chimney stacks with pots.
    for (const [cx, cz] of [
      [0.24, 0.42],
      [0.68, 0.36],
    ] as const) {
      l.block(cx, cz, 0.05, 0.05, 0.5, 0.38, brickDark);
      l.block(cx, cz, 0.06, 0.06, 0.86, 0.016, stone);
      l.round(cx - 0.01, cz, 0.007, 0.009, 0.876, 0.03, '#a8563c');
      l.round(cx + 0.012, cz, 0.007, 0.009, 0.876, 0.026, '#a8563c');
    }

    // Stage door yard: crates, barrels, a lamp.
    for (const [bx, bz] of [
      [0.12, 0.08],
      [0.16, 0.12],
    ] as const) {
      l.block(bx, bz, 0.04, 0.04, 0.03, 0.04, plank);
    }
    l.round(0.85, 0.12, 0.018, 0.016, 0.03, 0.05, timber);
    l.round(0.89, 0.15, 0.018, 0.016, 0.03, 0.05, timber);
    lamp(l, 0.78, 0.08, 0.03, 0.2);

    // Street: lamps, an advertising column, a bench, a tree and a queue.
    lamp(l, 0.08, 0.92, 0.042, 0.28);
    lamp(l, 0.8, 0.92, 0.042, 0.28, true);
    posterColumn(l, 0.92, 0.9, 0.042, 1);
    tree(l, 0.05, 0.6, 0.55, 3);
    bench(l, 0.08, 0.74, 0.03, 'z');
    for (const [i, [px, pz]] of (
      [
        [0.3, 0.87],
        [0.35, 0.9],
        [0.41, 0.88],
        [0.56, 0.86],
        [0.6, 0.9],
        [0.68, 0.93],
      ] as const
    ).entries()) {
      figure(l, px, pz, 0.042, i + 2);
    }
  },

  // ===========================================================================
  // Tier 3: grand opera house with portico, dome and fly tower
  // ===========================================================================
  opera_house(l) {
    l.base(paving, 0.03);
    // Chequered forecourt.
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2)
          l.block(0.04 + (i + 0.5) * 0.077, 0.86 + j * 0.04, 0.077, 0.04, 0.03, 0.003, pavingLight);
      }
    }

    // Fly tower (rear) with copper hipped roof.
    l.block(0.5, 0.17, 0.44, 0.2, 0.03, 0.9, stone);
    rustication(l, 0.5, 0.17, 0.44, 0.2, 0.03, 0.2);
    for (const t of [0.42, 0.64]) l.block(0.5, 0.17, 0.45, 0.21, t, 0.014, limestone);
    for (const wx of [0.38, 0.5, 0.62])
      windowOn(l, 'z', wx, 0.07, -1, 0.05, 0.68, 0.12, { arched: true });
    cornice(l, 0.5, 0.17, 0.44, 0.2, 0.93);
    hipRoof(l, 0.5, 0.17, 0.48, 0.24, 0.98, 0.16, copper, 6);

    // Main block: rusticated ground floor, piano nobile, entablature, balustrade.
    const hx = 0.5;
    const hz = 0.43;
    const hw = 0.74;
    const hd = 0.46;
    l.block(hx, hz, hw + 0.016, hd + 0.016, 0.03, 0.025, '#9f9786');
    l.block(hx, hz, hw, hd, 0.055, 0.2, rustic);
    rustication(l, hx, hz, hw, hd, 0.055, 0.2, 0.034);
    l.block(hx, hz, hw + 0.016, hd + 0.016, 0.255, 0.018, limestone);
    l.block(hx, hz, hw, hd, 0.273, 0.32, limestone);
    cornice(l, hx, hz, hw, hd, 0.6);
    for (const [x0, x1] of [
      [0.14, 0.28],
      [0.72, 0.86],
    ] as const) {
      balustrade(l, x0, x1, hz + hd / 2 + 0.01, 0.646);
    }
    balustrade(l, hz - hd / 2 + 0.03, hz + hd / 2 - 0.03, hx - hw / 2 + 0.012, 0.646, 'z');
    balustrade(l, hz - hd / 2 + 0.03, hz + hd / 2 - 0.03, hx + hw / 2 - 0.012, 0.646, 'z');
    l.block(hx, hz, hw - 0.02, hd - 0.02, 0.646, 0.03, lead);

    // Pilasters and tall arched windows on every face.
    const front = hz + hd / 2;
    const back = hz - hd / 2;
    for (let i = 0; i <= 6; i++) {
      const px = hx - hw / 2 + 0.02 + (i * (hw - 0.04)) / 6;
      for (const [zw, dir] of [
        [front, 1],
        [back, -1],
      ] as const) {
        l.block(px, zw + dir * 0.008, 0.026, 0.016, 0.273, 0.3, marble);
        l.block(px, zw + dir * 0.01, 0.034, 0.02, 0.56, 0.02, marble);
      }
    }
    for (let i = 0; i < 6; i++) {
      const wx = hx - hw / 2 + 0.02 + ((i + 0.5) * (hw - 0.04)) / 6;
      windowOn(l, 'z', wx, back, -1, 0.05, 0.33, 0.15, { arched: true });
      if (i === 0 || i === 5) {
        windowOn(l, 'z', wx, front, 1, 0.05, 0.33, 0.15, { arched: true });
        windowOn(l, 'z', wx, front, 1, 0.05, 0.1, 0.1);
      }
    }

    // Corner pavilions with mansard roofs and oeil-de-boeuf dormers.
    for (const px of [0.11, 0.89]) {
      l.block(px, hz + 0.02, 0.17, 0.5, 0.03, 0.025, '#9f9786');
      l.block(px, hz + 0.02, 0.16, 0.48, 0.055, 0.2, rustic);
      rustication(l, px, hz + 0.02, 0.16, 0.48, 0.055, 0.2, 0.034);
      l.block(px, hz + 0.02, 0.17, 0.49, 0.255, 0.018, limestone);
      l.block(px, hz + 0.02, 0.16, 0.48, 0.273, 0.34, limestone);
      cornice(l, px, hz + 0.02, 0.16, 0.48, 0.613);
      l.mansard(px, hz + 0.02, 0.17, 0.49, 0.66, 0.16);
      l.block(px, hz + 0.02, 0.06, 0.3, 0.82, 0.012, lead);
      windowOn(l, 'z', px, hz + 0.27, 1, 0.06, 0.33, 0.17, { arched: true });
      windowOn(l, 'z', px, hz - 0.22, -1, 0.06, 0.33, 0.17, { arched: true });
      windowOn(l, 'z', px, hz - 0.22, -1, 0.06, 0.1, 0.11);
      const outer = px < 0.5 ? px - 0.08 : px + 0.08;
      const side = px < 0.5 ? -1 : 1;
      for (const wz of [hz - 0.13, hz + 0.02, hz + 0.17]) {
        windowOn(l, 'x', wz, outer, side, 0.05, 0.33, 0.16, { arched: true });
        windowOn(l, 'x', wz, outer, side, 0.05, 0.1, 0.1);
      }
      windowOn(l, 'z', px, hz + 0.27, 1, 0.06, 0.1, 0.11);
      const dormer = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14);
      dormer.rotateX(Math.PI / 2);
      l.shape(dormer, marble, px, hz + 0.245, 0.74);
      const eye = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 14);
      eye.rotateX(Math.PI / 2);
      l.shape(eye, glass, px, hz + 0.25, 0.74, 1);
      statue(l, px, hz + 0.02, 0.832, gold);
    }

    // Portico: podium, grand stair, six columns, entablature and pediment.
    const pz = front + 0.07;
    l.block(hx, pz, 0.46, 0.14, 0.03, 0.225, rustic);
    rustication(l, hx, pz, 0.46, 0.14, 0.03, 0.225, 0.034);
    for (let i = 0; i < 5; i++) {
      const sh = 0.2 - i * 0.04;
      l.block(
        hx,
        pz + 0.085 + i * 0.024,
        0.4 + i * 0.02,
        0.026,
        0.03,
        sh + 0.025,
        i % 2 ? marble : '#e7e1d4',
      );
    }
    for (const sx of [-1, 1]) {
      l.block(hx + sx * 0.24, pz + 0.12, 0.04, 0.12, 0.03, 0.14, rustic);
      lamp(l, hx + sx * 0.24, pz + 0.16, 0.17, 0.2, true);
    }
    l.block(hx, pz, 0.46, 0.14, 0.255, 0.018, marble);
    for (let i = 0; i < 6; i++) column(l, hx - 0.2 + i * 0.08, pz + 0.04, 0.273, 0.3, 0.017);
    for (const cx of [hx - 0.2, hx + 0.2]) column(l, cx, pz - 0.04, 0.273, 0.3, 0.017);
    // Doors and banners behind the colonnade.
    for (const dx of [-0.12, 0, 0.12])
      windowOn(l, 'z', hx + dx, front, 1, 0.06, 0.29, 0.17, {
        arched: true,
        frame: marble,
        pane: '#f7d27a',
      });
    for (const dx of [-0.16, 0.16, -0.04, 0.04]) {
      l.block(hx + dx, front + 0.014, 0.026, 0.006, 0.36, 0.16, velvet);
      l.block(hx + dx, front + 0.017, 0.016, 0.004, 0.44, 0.04, gold);
    }
    l.block(hx, pz, 0.46, 0.15, 0.573, 0.045, limestone);
    l.block(hx, pz + 0.076, 0.44, 0.006, 0.585, 0.018, '#c8bfaa');
    for (let i = 0; i < 18; i++)
      l.block(hx - 0.21 + i * 0.0247, pz + 0.08, 0.01, 0.01, 0.606, 0.01, marble);
    l.block(hx, pz, 0.5, 0.17, 0.618, 0.02, marble);
    l.ridge(hx, pz - 0.01, 0.5, 0.19, 0.638, 0.14, 'z', marble);
    {
      const tri = new THREE.BufferGeometry();
      const W = 0.22 * l.spanX;
      tri.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([-W, 0, 0, W, 0, 0, 0, 0.12, 0], 3),
      );
      tri.computeVertexNormals();
      l.shape(tri, '#d8cfbb', hx, pz + 0.082, 0.645);
      // Gilded relief: a lyre flanked by laurels.
      l.block(hx, pz + 0.086, 0.04, 0.006, 0.66, 0.06, gold);
      l.block(hx, pz + 0.086, 0.024, 0.006, 0.674, 0.034, '#d8cfbb');
      l.beam([hx - 0.03, 0.665, pz + 0.087], [hx - 0.12, 0.655, pz + 0.087], 0.008, gold);
      l.beam([hx + 0.03, 0.665, pz + 0.087], [hx + 0.12, 0.655, pz + 0.087], 0.008, gold);
    }
    statue(l, hx, pz + 0.07, 0.775, gold);
    statue(l, hx - 0.235, pz + 0.07, 0.64);
    statue(l, hx + 0.235, pz + 0.07, 0.64);
    // Name frieze above the entablature.
    l.block(hx, front + 0.004, 0.3, 0.008, 0.62, 0.025, '#d0c6af');

    // Auditorium drum and ribbed copper dome with lantern.
    const dz = 0.4;
    l.round(hx, dz, 0.17, 0.17, 0.676, 0.05, limestone);
    l.round(hx, dz, 0.155, 0.155, 0.726, 0.1, limestone);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 0.155 * l.spanX + 0.006;
      const win = new THREE.BoxGeometry(0.03, 0.06, 0.006);
      win.rotateY(a);
      const ox = (Math.sin(a) * r) / l.spanX;
      const oz = (Math.cos(a) * r) / l.spanZ;
      l.shape(win, glass, hx + ox, dz + oz, 0.746, 1);
      const pil = new THREE.BoxGeometry(0.014, 0.1, 0.012);
      const b = a + Math.PI / 12;
      pil.rotateY(b);
      l.shape(
        pil,
        marble,
        hx + (Math.sin(b) * r) / l.spanX,
        dz + (Math.cos(b) * r) / l.spanZ,
        0.776,
      );
    }
    l.round(hx, dz, 0.165, 0.165, 0.826, 0.018, marble);
    l.dome(hx, dz, 0.15, 0.15, 0.844, 0.24, copper);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      let prev: [number, number, number] | null = null;
      for (let k = 0; k <= 5; k++) {
        const phi = (k / 5) * (Math.PI / 2) * 0.92;
        const rr = 0.15 * Math.cos(phi) + 0.003;
        const p: [number, number, number] = [
          hx + Math.sin(a) * rr,
          0.844 + 0.24 * Math.sin(phi) + 0.004,
          dz + Math.cos(a) * rr,
        ];
        if (prev) l.beam(prev, p, 0.014, copperDark);
        prev = p;
      }
    }
    l.round(hx, dz, 0.035, 0.035, 1.07, 0.07, marble);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const win = new THREE.BoxGeometry(0.02, 0.04, 0.004);
      win.rotateY(a);
      l.shape(win, glass, hx + Math.sin(a) * 0.036, dz + Math.cos(a) * 0.036, 1.085, 1);
    }
    l.dome(hx, dz, 0.042, 0.042, 1.14, 0.05, copper);
    l.round(hx, dz, 0.004, 0.01, 1.19, 0.05, gold);
    l.shape(new THREE.SphereGeometry(0.012, 10, 8), gold, hx, dz, 1.25);

    // Forecourt life: lamps, advertising columns, clipped trees in planters, people.
    for (const [x, z] of [
      [0.06, 0.86],
      [0.94, 0.86],
    ] as const) {
      lamp(l, x, z, 0.033, 0.3, true);
    }
    posterColumn(l, 0.08, 0.95, 0.033, 0);
    posterColumn(l, 0.92, 0.95, 0.033, 2);
    for (const [i, x] of [0.2, 0.8].entries()) {
      l.block(x, 0.93, 0.07, 0.07, 0.033, 0.04, stone);
      l.block(x, 0.93, 0.06, 0.06, 0.073, 0.004, '#4b3a2a');
      tree(l, x, 0.93, 0.36, i * 2);
    }
    for (const [i, [fx, fz]] of (
      [
        [0.3, 0.9],
        [0.34, 0.95],
        [0.43, 0.96],
        [0.58, 0.95],
        [0.63, 0.91],
        [0.7, 0.96],
        [0.38, 0.86],
        [0.52, 0.97],
      ] as const
    ).entries()) {
      figure(l, fx, fz, 0.033, i);
    }
    bench(l, 0.04, 0.68, 0.03, 'z');
    bench(l, 0.96, 0.68, 0.03, 'z');
  },
};
