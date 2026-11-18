import * as THREE from 'three';
import { type Lot } from './lot';

// High-detail kit for the Group 5 diorama style: individual boards, shingles and stones,
// fully modelled animals and farm props. Dimensions are in world units unless noted;
// positions (x, z) are lot fractions like the rest of the Lot API.

export type Axis = 'x' | 'z';

let seed = 1;
/** Deterministic 0..1 noise for colour variation; reset per building with `reseed`. */
export function rand(): number {
  seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
  return (seed % 10007) / 10007;
}
export function reseed(text: string): void {
  seed = 2166136261;
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619) >>> 0;
}

export function tone(hex: string, spread = 0.12): string {
  const f = 1 + (rand() - 0.5) * spread;
  return `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;
}

export function shade(hex: string, f: number): string {
  return `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;
}

/** Adds a world-unit box at lot fraction (x, z), height y (bottom), rotated `ry` around y. */
export function wbox(
  l: Lot,
  x: number,
  z: number,
  y: number,
  w: number,
  h: number,
  d: number,
  color: string,
  ry = 0,
  rx = 0,
  glow = 0,
): void {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  l.shape(g, color, x, z, y + h / 2, glow);
}

/** Cylinder in world units (radii top/bottom), bottom at y, centred on lot fraction (x, z). */
export function wround(
  l: Lot,
  x: number,
  z: number,
  top: number,
  bottom: number,
  y: number,
  h: number,
  color: string,
  segments = 12,
): void {
  l.shape(new THREE.CylinderGeometry(top, bottom, h, segments), color, x, z, y + h / 2);
}

/** Lot fraction offset by a world-unit vector. */
export function off(l: Lot, x: number, z: number, dx: number, dz: number): [number, number] {
  return [x + dx / l.spanX, z + dz / l.spanZ];
}

// ---------------------------------------------------------------------------
// Walls
// ---------------------------------------------------------------------------

/**
 * Rectangular building body in world units centred on lot fraction (x, z), clad in
 * vertical boards (with battens) on all four faces.
 */
export function boardBody(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
): void {
  wbox(l, x, z, y, w, h, d, shade(color, 0.7));
  const board = 0.034;
  for (const [axis, len, depth] of [
    ['x', w, d],
    ['z', d, w],
  ] as const) {
    const n = Math.max(2, Math.round(len / board));
    for (let i = 0; i < n; i++) {
      const t = -len / 2 + (i + 0.5) * (len / n);
      const c = tone(color, 0.16);
      for (const s of [-1, 1]) {
        const [px, pz] =
          axis === 'x'
            ? off(l, x, z, t, s * (depth / 2 + 0.002))
            : off(l, x, z, s * (depth / 2 + 0.002), t);
        if (axis === 'x') wbox(l, px, pz, y, (len / n) * 0.9, h, 0.004, c);
        else wbox(l, px, pz, y, 0.004, h, (len / n) * 0.9, c);
      }
    }
  }
  // Sill plate and corner boards.
  wbox(l, x, z, y, w + 0.012, 0.016, d + 0.012, shade(color, 0.55));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const [px, pz] = off(l, x, z, (sx * w) / 2, (sz * d) / 2);
      wbox(l, px, pz, y, 0.014, h, 0.014, shade(color, 1.18));
    }
}

/**
 * Coursed stone body: individual stones of varied tone laid in staggered courses on all four
 * faces, with larger quoins at the corners.
 */
export function stoneBody(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
  course = 0.03,
): void {
  wbox(l, x, z, y, w - 0.004, h, d - 0.004, shade(color, 0.6));
  const rows = Math.max(2, Math.round(h / course));
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    const yy = y + r * ch;
    for (const [axis, len, depth] of [
      ['x', w, d],
      ['z', d, w],
    ] as const) {
      let t = -len / 2 + (r % 2 ? 0.02 : 0);
      while (t < len / 2 - 0.004) {
        const sw = Math.min(0.03 + rand() * 0.03, len / 2 - t);
        const c = tone(color, 0.24);
        for (const s of [-1, 1]) {
          const [px, pz] =
            axis === 'x'
              ? off(l, x, z, t + sw / 2, s * (depth / 2 + 0.001))
              : off(l, x, z, s * (depth / 2 + 0.001), t + sw / 2);
          if (axis === 'x') wbox(l, px, pz, yy + 0.002, sw - 0.004, ch - 0.004, 0.006, c);
          else wbox(l, px, pz, yy + 0.002, 0.006, ch - 0.004, sw - 0.004, c);
        }
        t += sw;
      }
    }
  }
}

/** Plastered or rendered body with a plinth and timber (or stone) corners. */
export function renderBody(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
  trimColor: string,
): void {
  wbox(l, x, z, y, w, h, d, color);
  wbox(l, x, z, y, w + 0.01, 0.03, d + 0.01, shade(trimColor, 0.8));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const [px, pz] = off(l, x, z, (sx * w) / 2, (sz * d) / 2);
      wbox(l, px, pz, y, 0.018, h, 0.018, trimColor);
    }
  wbox(l, x, z, y + h - 0.014, w + 0.014, 0.016, d + 0.014, trimColor);
}

/** Half-timbering on all faces of a rendered body: posts, rails and braces. */
export function halfTimber(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color: string,
): void {
  for (const [axis, len, depth] of [
    ['x', w, d],
    ['z', d, w],
  ] as const) {
    const posts = Math.max(2, Math.round(len / 0.1));
    for (const s of [-1, 1]) {
      const face = s * (depth / 2 + 0.003);
      const at = (t: number): [number, number] =>
        axis === 'x' ? off(l, x, z, t, face) : off(l, x, z, face, t);
      for (let i = 0; i <= posts; i++) {
        const [px, pz] = at(-len / 2 + (i * len) / posts);
        wbox(l, px, pz, y, 0.012, h, 0.012, color);
      }
      for (const ry of [0, h / 2, h - 0.012]) {
        const [px, pz] = at(0);
        if (axis === 'x') wbox(l, px, pz, y + ry, len, 0.012, 0.008, color);
        else wbox(l, px, pz, y + ry, 0.008, 0.012, len, color);
      }
      for (let i = 0; i < posts; i += 2) {
        const a = -len / 2 + (i * len) / posts;
        const b = -len / 2 + ((i + 1) * len) / posts;
        const [ax, az] = at(a);
        const [bx, bz] = at(b);
        l.beam([ax, y + h / 2, az], [bx, y + h - 0.01, bz], 0.009, color);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Openings
// ---------------------------------------------------------------------------

/**
 * Four-pane window with frame, sill, optional shutters and flower box, on a face of a body
 * centred at (x, z). `face`: which side ('+z', '-z', '+x', '-x'); `t`: offset along it.
 */
export function window4(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  face: '+z' | '-z' | '+x' | '-x',
  t: number,
  y: number,
  size = 0.05,
  opts: { shutters?: string; flowers?: boolean; frame?: string } = {},
): void {
  const frame = opts.frame ?? '#efe7d6';
  const axisX = face === '+z' || face === '-z';
  const s = face[0] === '+' ? 1 : -1;
  const depth = axisX ? d : w;
  const at = (along: number, out: number): [number, number] =>
    axisX
      ? off(l, x, z, t + along, s * (depth / 2 + out))
      : off(l, x, z, s * (depth / 2 + out), t + along);
  const put = (
    along: number,
    out: number,
    yy: number,
    a: number,
    h: number,
    th: number,
    c: string,
    glow = 0,
  ) => {
    const [px, pz] = at(along, out);
    if (axisX) wbox(l, px, pz, yy, a, h, th, c, 0, 0, glow);
    else wbox(l, px, pz, yy, th, h, a, c, 0, 0, glow);
  };
  const hgt = size * 1.25;
  put(0, 0.003, y - 0.006, size + 0.014, hgt + 0.012, 0.006, frame);
  put(0, 0.005, y, size, hgt, 0.004, '#f2c766', 1);
  put(0, 0.007, y, 0.004, hgt, 0.004, frame);
  put(0, 0.007, y + hgt / 2 - 0.002, size, 0.004, 0.004, frame);
  put(0, 0.008, y - 0.012, size + 0.022, 0.008, 0.014, shade(frame, 0.9));
  put(0, 0.005, y + hgt + 0.004, size + 0.02, 0.01, 0.01, shade(frame, 0.85));
  if (opts.shutters) {
    for (const k of [-1, 1]) {
      put(k * (size / 2 + 0.014), 0.005, y - 0.004, 0.022, hgt + 0.008, 0.005, opts.shutters);
      for (let i = 1; i < 4; i++)
        put(
          k * (size / 2 + 0.014),
          0.008,
          y + (hgt * i) / 4,
          0.02,
          0.003,
          0.003,
          shade(opts.shutters, 0.7),
        );
    }
  }
  if (opts.flowers) {
    put(0, 0.014, y - 0.03, size + 0.01, 0.018, 0.018, '#6b4a2c');
    for (let i = 0; i < 4; i++) {
      put(
        -size / 2 + 0.006 + i * (size / 3.2),
        0.016,
        y - 0.014,
        0.01,
        0.012,
        0.012,
        ['#e24864', '#f7d23d', '#ef8a3a', '#d8e0f0'][i % 4]!,
      );
    }
  }
}

/** Plank door with frame and a small step; `barn` makes a wide double door with X braces. */
export function door(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  face: '+z' | '-z' | '+x' | '-x',
  t: number,
  y: number,
  width: number,
  height: number,
  color: string,
  barn = false,
): void {
  const axisX = face === '+z' || face === '-z';
  const s = face[0] === '+' ? 1 : -1;
  const depth = axisX ? d : w;
  const at = (along: number, out: number): [number, number] =>
    axisX
      ? off(l, x, z, t + along, s * (depth / 2 + out))
      : off(l, x, z, s * (depth / 2 + out), t + along);
  const put = (
    along: number,
    out: number,
    yy: number,
    a: number,
    h: number,
    th: number,
    c: string,
  ) => {
    const [px, pz] = at(along, out);
    if (axisX) wbox(l, px, pz, yy, a, h, th, c);
    else wbox(l, px, pz, yy, th, h, a, c);
  };
  const trim = '#efe7d6';
  put(0, 0.003, y, width + 0.02, height + 0.012, 0.006, barn ? trim : shade(color, 0.6));
  const leaves = barn ? 2 : 1;
  for (let k = 0; k < leaves; k++) {
    const lw = width / leaves;
    const cx = -width / 2 + lw * (k + 0.5);
    const boards = Math.max(3, Math.round(lw / 0.018));
    for (let b = 0; b < boards; b++) {
      put(
        cx - lw / 2 + (b + 0.5) * (lw / boards),
        0.006,
        y,
        (lw / boards) * 0.88,
        height,
        0.005,
        tone(color, 0.12),
      );
    }
    if (barn) {
      const [ax, az] = at(cx - lw / 2 + 0.008, 0.01);
      const [bx, bz] = at(cx + lw / 2 - 0.008, 0.01);
      l.beam([ax, y + 0.008, az], [bx, y + height - 0.008, bz], 0.008, trim);
      l.beam([bx, y + 0.008, bz], [ax, y + height - 0.008, az], 0.008, trim);
      put(cx, 0.01, y + height / 2 - 0.004, lw - 0.01, 0.008, 0.004, trim);
    }
  }
  if (!barn) put(width * 0.3, 0.01, y + height * 0.45, 0.006, 0.006, 0.006, '#c9a24a');
  put(0, 0.014, y - 0.012, width + 0.03, 0.012, 0.03, '#9a9385');
}

// ---------------------------------------------------------------------------
// Roofs
// ---------------------------------------------------------------------------

/** Places geometry in a local roof frame: lx along the ridge, lz across it. */
function placeLocal(
  l: Lot,
  g: THREE.BufferGeometry,
  color: string,
  cx: number,
  cz: number,
  along: Axis,
  lx: number,
  y: number,
  lz: number,
): void {
  if (along === 'z') {
    g.rotateY(Math.PI / 2);
    const [px, pz] = off(l, cx, cz, lz, -lx);
    l.shape(g, color, px, pz, y);
  } else {
    const [px, pz] = off(l, cx, cz, lx, lz);
    l.shape(g, color, px, pz, y);
  }
}

/**
 * Gable roof of individual staggered shingles over a solid deck, with ridge cap, bargeboards
 * and gable-end infill. `length` runs along the ridge; `span` across it (world units).
 */
export function shingleGable(
  l: Lot,
  cx: number,
  cz: number,
  along: Axis,
  length: number,
  span: number,
  y: number,
  h: number,
  color: string,
  gableColor?: string,
  overhang = 0.03,
): void {
  const half = span / 2 + overhang;
  const run = half;
  const rise = h * (half / (span / 2));
  const slope = Math.hypot(run, rise);
  const a = Math.atan2(rise, run);
  const yBase = y - (rise - h);
  const L = length + overhang * 2;
  for (const s of [-1, 1]) {
    const deck = new THREE.BoxGeometry(L, 0.012, slope);
    deck.rotateX(s * a);
    placeLocal(
      l,
      deck,
      shade(color, 0.55),
      cx,
      cz,
      along,
      0,
      yBase + rise / 2 - 0.006,
      (s * run) / 2,
    );
    const rows = Math.max(3, Math.round(slope / 0.032));
    for (let r = 0; r < rows; r++) {
      const t = (r + 0.5) / rows;
      const across = s * run * (1 - t);
      const yy = yBase + rise * t;
      const tiles = Math.max(4, Math.round(L / 0.042));
      const tw = L / tiles;
      for (let k = 0; k < tiles + (r % 2); k++) {
        const lx = -L / 2 + tw * (k + (r % 2 ? 0 : 0.5));
        const w = Math.min(tw * 0.94, L / 2 - Math.abs(lx) + tw * 0.47);
        if (w <= 0.004) continue;
        const tile = new THREE.BoxGeometry(w, 0.008, (slope / rows) * 1.3);
        tile.rotateX(s * a);
        placeLocal(l, tile, tone(color, 0.22), cx, cz, along, lx, yy + 0.002, across);
      }
    }
  }
  const cap = new THREE.BoxGeometry(L + 0.01, 0.022, 0.03);
  placeLocal(l, cap, shade(color, 0.7), cx, cz, along, 0, y + h + 0.004, 0);
  // Gable-end triangles and bargeboards.
  for (const e of [-1, 1]) {
    if (gableColor) {
      const sh = new THREE.Shape();
      sh.moveTo(-span / 2, 0);
      sh.lineTo(span / 2, 0);
      sh.lineTo(0, h);
      sh.closePath();
      const g = new THREE.ShapeGeometry(sh);
      g.rotateY(e > 0 ? Math.PI / 2 : -Math.PI / 2);
      placeLocal(l, g, gableColor, cx, cz, along, e * (length / 2 + 0.001), y, 0);
    }
    for (const s of [-1, 1]) {
      const b = new THREE.BoxGeometry(0.012, 0.022, slope + 0.01);
      b.rotateX(s * a);
      placeLocal(l, b, '#efe7d6', cx, cz, along, e * (L / 2), yBase + rise / 2, (s * run) / 2);
    }
  }
}

/** Gambrel (barn) roof clad in shingles: steep lower slopes, shallow upper slopes. */
export function shingleGambrel(
  l: Lot,
  cx: number,
  cz: number,
  along: Axis,
  length: number,
  span: number,
  y: number,
  h: number,
  color: string,
  gableColor: string,
): void {
  const half = span / 2 + 0.025;
  const knee = [half * 0.62, h * 0.6] as const;
  const L = length + 0.05;
  const segments: [number, number, number, number][] = [
    [half, 0, knee[0], knee[1]],
    [knee[0], knee[1], 0, h],
  ];
  for (const s of [-1, 1]) {
    for (const [x0, y0, x1, y1] of segments) {
      const run = x0 - x1;
      const rise = y1 - y0;
      const slope = Math.hypot(run, rise);
      const a = Math.atan2(rise, run);
      const deck = new THREE.BoxGeometry(L, 0.012, slope);
      deck.rotateX(s * a);
      placeLocal(
        l,
        deck,
        shade(color, 0.55),
        cx,
        cz,
        along,
        0,
        y + (y0 + y1) / 2 - 0.006,
        (s * (x0 + x1)) / 2,
      );
      const rows = Math.max(2, Math.round(slope / 0.032));
      for (let r = 0; r < rows; r++) {
        const t = (r + 0.5) / rows;
        const across = s * (x0 - run * t);
        const yy = y + y0 + rise * t;
        const tiles = Math.max(4, Math.round(L / 0.042));
        const tw = L / tiles;
        for (let k = 0; k < tiles; k++) {
          const lx = -L / 2 + tw * (k + 0.5) + (r % 2 ? tw * 0.25 : -tw * 0.25);
          const tile = new THREE.BoxGeometry(tw * 0.92, 0.008, (slope / rows) * 1.3);
          tile.rotateX(s * a);
          placeLocal(
            l,
            tile,
            tone(color, 0.22),
            cx,
            cz,
            along,
            Math.max(-L / 2 + tw / 2, Math.min(L / 2 - tw / 2, lx)),
            yy + 0.002,
            across,
          );
        }
      }
    }
  }
  const cap = new THREE.BoxGeometry(L + 0.01, 0.022, 0.03);
  placeLocal(l, cap, shade(color, 0.7), cx, cz, along, 0, y + h, 0);
  for (const e of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(-span / 2, 0);
    sh.lineTo(span / 2, 0);
    sh.lineTo(knee[0] * (span / 2 / half), knee[1]);
    sh.lineTo(0, h);
    sh.lineTo(-knee[0] * (span / 2 / half), knee[1]);
    sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    g.rotateY(e > 0 ? Math.PI / 2 : -Math.PI / 2);
    placeLocal(l, g, gableColor, cx, cz, along, e * (length / 2 + 0.001), y, 0);
  }
}

/** Corrugated metal gable roof: alternating light/dark ribs. */
export function tinGable(
  l: Lot,
  cx: number,
  cz: number,
  along: Axis,
  length: number,
  span: number,
  y: number,
  h: number,
  color: string,
): void {
  const half = span / 2 + 0.025;
  const rise = h * (half / (span / 2));
  const slope = Math.hypot(half, rise);
  const a = Math.atan2(rise, half);
  const yBase = y - (rise - h);
  const L = length + 0.05;
  const ribs = Math.max(6, Math.round(L / 0.016));
  for (const s of [-1, 1]) {
    for (let k = 0; k < ribs; k++) {
      const rib = new THREE.BoxGeometry(L / ribs, k % 2 ? 0.01 : 0.016, slope);
      rib.rotateX(s * a);
      placeLocal(
        l,
        rib,
        k % 2 ? shade(color, 0.86) : color,
        cx,
        cz,
        along,
        -L / 2 + (k + 0.5) * (L / ribs),
        yBase + rise / 2,
        (s * half) / 2,
      );
    }
  }
  const cap = new THREE.BoxGeometry(L + 0.01, 0.018, 0.03);
  placeLocal(l, cap, shade(color, 0.75), cx, cz, along, 0, y + h + 0.004, 0);
}

/** Brick chimney with corbel and pots. */
export function chimney(
  l: Lot,
  x: number,
  z: number,
  y: number,
  h: number,
  brick = '#9c4a33',
): void {
  const rows = Math.round(h / 0.016);
  for (let r = 0; r < rows; r++)
    wbox(l, x, z, y + r * (h / rows), 0.05, h / rows - 0.002, 0.05, tone(brick, 0.18));
  wbox(l, x, z, y + h, 0.062, 0.014, 0.062, '#cfc6b4');
  for (const dx of [-0.012, 0.012]) {
    const [px, pz] = off(l, x, z, dx, 0);
    wround(l, px, pz, 0.0045, 0.0055, y + h + 0.014, 0.026, '#b35a3c');
  }
}

/** Cupola with louvres, pyramid cap and a rooster weathervane. */
export function cupola(l: Lot, x: number, z: number, y: number, size: number, roof: string): void {
  wbox(l, x, z, y, size, size * 0.9, size, '#efe7d6');
  for (let i = 0; i < 4; i++)
    wbox(
      l,
      x,
      z,
      y + size * 0.2 + i * size * 0.14,
      size + 0.004,
      size * 0.06,
      size * 0.7,
      '#8a7f70',
    );
  const cap = new THREE.ConeGeometry(size * 0.86, size * 0.7, 4);
  cap.rotateY(Math.PI / 4);
  l.shape(cap, roof, x, z, y + size * 0.9 + size * 0.35);
  wround(l, x, z, 0.002, 0.003, y + size * 1.6, size * 0.6, '#2c3134');
  wbox(l, x, z, y + size * 1.9, 0.05, 0.002, 0.002, '#2c3134');
  wbox(l, x, z, y + size * 1.9, 0.002, 0.002, 0.05, '#2c3134');
  wbox(l, x, z, y + size * 2.05, 0.03, 0.022, 0.006, '#2c3134');
  wbox(l, ...off(l, x, z, 0.014, 0), y + size * 2.1, 0.01, 0.014, 0.006, '#c8392c');
}

// ---------------------------------------------------------------------------
// Ground, fences, plants
// ---------------------------------------------------------------------------

/** Grass ground with tufts and tiny flowers scattered over it. */
export function meadow(l: Lot, color: string, tufts: number): void {
  l.base(color, 0.03);
  for (let i = 0; i < tufts; i++) {
    const x = 0.04 + rand() * 0.92;
    const z = 0.04 + rand() * 0.92;
    const flower = rand() < 0.18;
    wbox(
      l,
      x,
      z,
      0.03,
      0.012 + rand() * 0.01,
      flower ? 0.012 : 0.008 + rand() * 0.008,
      0.012,
      flower ? ['#f2e9d8', '#f2cf4a', '#d9628a', '#a77fd0'][i % 4]! : tone(shade(color, 0.85), 0.2),
      rand() * 3,
    );
  }
}

/** Dirt or gravel path between two points with pebbles at the edges. */
export function path(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  width: number,
  color = '#b9a07a',
): void {
  const dx = (x1 - x0) * l.spanX;
  const dz = (z1 - z0) * l.spanZ;
  const len = Math.hypot(dx, dz);
  const ry = Math.atan2(-dz, dx);
  wbox(l, (x0 + x1) / 2, (z0 + z1) / 2, 0.03, len, 0.004, width, color, ry);
  const n = Math.round(len / 0.05);
  for (let i = 0; i < n; i++) {
    const t = (i + rand()) / n;
    const side = i % 2 ? 1 : -1;
    const px = x0 + (x1 - x0) * t + (side * Math.sin(ry) * (width / 2) * 0.9) / l.spanX;
    const pz = z0 + (z1 - z0) * t + (side * Math.cos(ry) * (width / 2) * 0.9) / l.spanZ;
    wbox(l, px, pz, 0.03, 0.012, 0.008, 0.01, tone('#9a9385', 0.2), rand() * 3);
  }
}

/** Split-rail fence from (x0, z0) to (x1, z1) with capped posts. */
export function railFence(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  color = '#8a6342',
  rails = 2,
): void {
  const len = Math.hypot((x1 - x0) * l.spanX, (z1 - z0) * l.spanZ);
  const n = Math.max(1, Math.round(len / 0.09));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    wbox(l, px, pz, 0.03, 0.012, 0.075, 0.012, tone(shade(color, 0.8), 0.15));
    wbox(l, px, pz, 0.105, 0.016, 0.006, 0.016, shade(color, 0.7));
  }
  for (let r = 0; r < rails; r++) {
    const yy = 0.05 + r * (0.045 / Math.max(1, rails - 1));
    l.beam([x0, yy, z0], [x1, yy, z1], 0.007, tone(color, 0.15));
  }
}

/** Fruit tree with a lumpy canopy and visible fruit. */
export function orchardTree(l: Lot, x: number, z: number, h: number, fruit: string): void {
  wround(l, x, z, 0.006, 0.01, 0.03, h * 0.45, '#6b4e36');
  l.beam([x, 0.03 + h * 0.3, z], [x + 0.02, 0.03 + h * 0.5, z + 0.01], 0.006, '#6b4e36');
  for (let i = 0; i < 6; i++) {
    const r = h * (0.14 + rand() * 0.08);
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.rotateY(rand() * 3);
    const a = (i / 6) * Math.PI * 2;
    l.shape(
      g,
      tone(i % 2 ? '#4f8a3a' : '#5f9a44', 0.18),
      x + (Math.cos(a) * h * 0.12) / l.spanX,
      z + (Math.sin(a) * h * 0.12) / l.spanZ,
      0.03 + h * (0.55 + (i % 3) * 0.08),
    );
  }
  l.shape(new THREE.IcosahedronGeometry(h * 0.2, 0), '#5a9442', x, z, 0.03 + h * 0.75);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const rr = h * (0.16 + rand() * 0.08);
    l.shape(
      new THREE.SphereGeometry(0.008, 5, 4),
      fruit,
      x + (Math.cos(a) * rr) / l.spanX,
      z + (Math.sin(a) * rr) / l.spanZ,
      0.03 + h * (0.5 + rand() * 0.35),
    );
  }
}

/** Tall slim cypress / poplar. */
export function cypress(l: Lot, x: number, z: number, h: number): void {
  wround(l, x, z, 0.004, 0.006, 0.03, 0.04, '#5b4330');
  const g = new THREE.CylinderGeometry(0.004, 0.03, h, 7);
  l.shape(g, tone('#2f6b3a', 0.14), x, z, 0.06 + h / 2);
  const g2 = new THREE.SphereGeometry(0.03, 7, 5);
  g2.scale(1, 1.4, 1);
  l.shape(g2, tone('#2f6b3a', 0.14), x, z, 0.06 + h * 0.18);
}

/** Clipped round hedge or shrub. */
export function shrub(l: Lot, x: number, z: number, r: number, color = '#4f8a3a'): void {
  const g = new THREE.IcosahedronGeometry(r, 1);
  g.scale(1, 0.8, 1);
  l.shape(g, tone(color, 0.15), x, z, 0.03 + r * 0.7);
}

// ---------------------------------------------------------------------------
// Animals and people
// ---------------------------------------------------------------------------

/** Holstein (or brown) cow facing angle `ry` (0 = +x). */
export function cow(
  l: Lot,
  x: number,
  z: number,
  ry: number,
  brown = false,
  grazing = false,
): void {
  const coat = brown ? '#8a5a36' : '#f3efe6';
  const dark = '#2a2422';
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (fwd: number, side: number): [number, number] =>
    off(l, x, z, c * fwd - s * side, -(s * fwd + c * side));
  // Legs with hooves.
  for (const [f, sd] of [
    [0.022, 0.011],
    [0.022, -0.011],
    [-0.022, 0.011],
    [-0.022, -0.011],
  ] as const) {
    wbox(l, ...at(f, sd), 0.03, 0.009, 0.032, 0.009, coat, ry);
    wbox(l, ...at(f, sd), 0.03, 0.01, 0.006, 0.01, dark, ry);
  }
  wbox(l, ...at(0, 0), 0.062, 0.066, 0.034, 0.032, coat, ry);
  if (!brown) {
    wbox(l, ...at(0.006, 0.0165), 0.072, 0.024, 0.02, 0.002, dark, ry);
    wbox(l, ...at(-0.018, -0.0165), 0.066, 0.02, 0.024, 0.002, dark, ry);
    wbox(l, ...at(-0.02, 0.0165), 0.08, 0.016, 0.012, 0.002, dark, ry);
    wbox(l, ...at(0.012, 0), 0.096, 0.03, 0.002, 0.02, dark, ry);
  }
  wbox(l, ...at(-0.006, 0), 0.054, 0.016, 0.008, 0.016, '#e9a4a4', ry);
  // Neck, head, muzzle, ears and horns.
  const hy = grazing ? 0.05 : 0.084;
  wbox(l, ...at(0.038, 0), hy, 0.014, 0.02, 0.018, coat, ry);
  wbox(l, ...at(0.05, 0), hy - 0.004, 0.02, 0.022, 0.018, brown ? coat : dark, ry);
  wbox(l, ...at(0.061, 0), hy - 0.006, 0.008, 0.012, 0.016, '#e9b3a8', ry);
  for (const sd of [-0.012, 0.012]) {
    wbox(l, ...at(0.046, sd), hy + 0.012, 0.008, 0.005, 0.008, coat, ry);
    wbox(l, ...at(0.05, sd * 0.6), hy + 0.022, 0.003, 0.006, 0.003, '#efe5c8', ry);
  }
  // Tail with tuft.
  const [tx, tz] = at(-0.034, 0);
  const [ux, uz] = at(-0.037, 0.002);
  l.beam([tx, 0.094, tz], [ux, 0.05, uz], 0.003, coat);
  wbox(l, ...at(-0.037, 0.002), 0.044, 0.006, 0.01, 0.006, dark, ry);
}

/** Horse in a walking pose facing angle `ry`. */
export function horse(l: Lot, x: number, z: number, ry: number, coat = '#7a4a2a'): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (fwd: number, side: number): [number, number] =>
    off(l, x, z, c * fwd - s * side, -(s * fwd + c * side));
  const mane = '#2a1d16';
  for (const [f, sd, k] of [
    [0.024, 0.009, 0.004],
    [0.024, -0.009, -0.004],
    [-0.024, 0.009, -0.004],
    [-0.024, -0.009, 0.004],
  ] as const) {
    wbox(l, ...at(f + k, sd), 0.03, 0.008, 0.044, 0.008, coat, ry);
    wbox(l, ...at(f + k, sd), 0.03, 0.009, 0.008, 0.009, '#f0ebe0', ry);
  }
  wbox(l, ...at(0, 0), 0.072, 0.07, 0.03, 0.026, coat, ry);
  const [n0x, n0z] = at(0.03, 0);
  const [n1x, n1z] = at(0.048, 0);
  l.beam([n0x, 0.095, n0z], [n1x, 0.13, n1z], 0.018, coat);
  const [m0x, m0z] = at(0.026, 0);
  l.beam([m0x, 0.11, m0z], [n1x, 0.14, n1z], 0.008, mane);
  wbox(l, ...at(0.06, 0), 0.118, 0.03, 0.014, 0.014, coat, ry);
  wbox(l, ...at(0.072, 0), 0.116, 0.008, 0.012, 0.012, '#3a2a20', ry);
  for (const sd of [-0.005, 0.005]) wbox(l, ...at(0.05, sd), 0.138, 0.004, 0.01, 0.004, coat, ry);
  const [tx, tz] = at(-0.036, 0);
  const [ux, uz] = at(-0.046, 0);
  l.beam([tx, 0.098, tz], [ux, 0.05, uz], 0.008, mane);
}

/** Sheep: woolly body of puffs, dark face and legs. */
export function sheep(l: Lot, x: number, z: number, ry: number): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (fwd: number, side: number): [number, number] =>
    off(l, x, z, c * fwd - s * side, -(s * fwd + c * side));
  for (const [f, sd] of [
    [0.012, 0.008],
    [0.012, -0.008],
    [-0.012, 0.008],
    [-0.012, -0.008],
  ] as const) {
    wbox(l, ...at(f, sd), 0.03, 0.005, 0.022, 0.005, '#2d2826', ry);
  }
  for (const [f, sd, yy] of [
    [0, 0, 0.064],
    [0.012, 0.006, 0.062],
    [-0.012, -0.006, 0.062],
    [0.01, -0.007, 0.066],
    [-0.01, 0.007, 0.066],
  ] as const) {
    l.shape(new THREE.IcosahedronGeometry(0.014, 0), tone('#f1ece0', 0.06), ...at(f, sd), yy);
  }
  wbox(l, ...at(0.028, 0), 0.06, 0.014, 0.016, 0.012, '#2d2826', ry);
  for (const sd of [-0.008, 0.008])
    wbox(l, ...at(0.024, sd), 0.072, 0.004, 0.004, 0.008, '#2d2826', ry);
}

/** Small farmhand / visitor figure with hat. */
export function person(
  l: Lot,
  x: number,
  z: number,
  y: number,
  coat: string,
  hat = '#8a6a3a',
): void {
  for (const sd of [-0.004, 0.004])
    wbox(l, ...off(l, x, z, sd, 0), y, 0.006, 0.026, 0.007, '#3c4a5e');
  wbox(l, x, z, y + 0.026, 0.018, 0.028, 0.012, coat);
  for (const sd of [-0.012, 0.012])
    wbox(l, ...off(l, x, z, sd, 0), y + 0.032, 0.005, 0.022, 0.006, coat);
  l.shape(new THREE.SphereGeometry(0.0075, 8, 6), '#e2b896', x, z, y + 0.062);
  wround(l, x, z, 0.012, 0.012, y + 0.066, 0.002, hat);
  wround(l, x, z, 0.006, 0.007, y + 0.068, 0.008, hat);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export function barrel(l: Lot, x: number, z: number, y = 0.03, r = 0.016): void {
  const g = new THREE.CylinderGeometry(r * 0.88, r * 0.88, r * 2.8, 10);
  l.shape(g, '#7a5232', x, z, y + r * 1.4);
  wround(l, x, z, r * 0.96, r, y + r * 0.6, r * 1.6, tone('#86593a', 0.1));
  for (const t of [0.12, 0.5, 0.88])
    wround(l, x, z, r + 0.001, r + 0.001, y + r * 2.8 * t - 0.002, 0.004, '#3a3530');
}

/** Barrel lying on its side. */
export function barrelLying(l: Lot, x: number, z: number, ry: number, y = 0.03, r = 0.018): void {
  const g = new THREE.CylinderGeometry(r, r, r * 2.6, 10);
  g.rotateZ(Math.PI / 2);
  g.rotateY(ry);
  l.shape(g, tone('#86593a', 0.1), x, z, y + r);
  for (const t of [-0.4, 0, 0.4]) {
    const hoop = new THREE.CylinderGeometry(r + 0.001, r + 0.001, 0.004, 10);
    hoop.rotateZ(Math.PI / 2);
    hoop.rotateY(ry);
    l.shape(
      hoop,
      '#3a3530',
      ...off(l, x, z, Math.cos(ry) * r * 2.6 * t, -Math.sin(ry) * r * 2.6 * t),
      y + r,
    );
  }
  const cap = new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.002, 10);
  cap.rotateZ(Math.PI / 2);
  cap.rotateY(ry);
  l.shape(
    cap,
    '#c79a5e',
    ...off(l, x, z, Math.cos(ry) * r * 1.31, -Math.sin(ry) * r * 1.31),
    y + r,
  );
}

export function milkCan(l: Lot, x: number, z: number, y = 0.03): void {
  wround(l, x, z, 0.008, 0.009, y, 0.026, '#d9dee0');
  wround(l, x, z, 0.004, 0.008, y + 0.026, 0.008, '#c8cdd0');
  wround(l, x, z, 0.0055, 0.0055, y + 0.034, 0.005, '#aab0b3');
}

export function crate(l: Lot, x: number, z: number, y: number, produce?: string, ry = 0): void {
  wbox(l, x, z, y, 0.034, 0.02, 0.024, tone('#a47a52', 0.12), ry);
  wbox(l, x, z, y + 0.006, 0.036, 0.003, 0.026, '#6b4a2c', ry);
  if (produce) {
    for (let i = 0; i < 4; i++) {
      l.shape(
        new THREE.SphereGeometry(0.006, 5, 4),
        produce,
        ...off(l, x, z, i % 2 ? 0.007 : -0.007, i < 2 ? 0.005 : -0.005),
        y + 0.022,
      );
    }
  }
}

/** Square hay bale with twine. */
export function hayBale(l: Lot, x: number, z: number, y = 0.03, ry = 0): void {
  wbox(l, x, z, y, 0.044, 0.026, 0.026, tone('#d9bb68', 0.08), ry);
  for (const t of [-0.011, 0.011]) {
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t),
      y - 0.001,
      0.003,
      0.028,
      0.028,
      '#a3843f',
      ry,
    );
  }
}

/** Round hay bale lying on its side. */
export function roundBale(l: Lot, x: number, z: number, ry = 0): void {
  const g = new THREE.CylinderGeometry(0.026, 0.026, 0.036, 12);
  g.rotateZ(Math.PI / 2);
  g.rotateY(ry);
  l.shape(g, tone('#d8b862', 0.08), x, z, 0.056);
  const face = new THREE.CylinderGeometry(0.02, 0.02, 0.038, 12);
  face.rotateZ(Math.PI / 2);
  face.rotateY(ry);
  l.shape(face, '#c9a552', x, z, 0.056);
}

/** Wooden water/feed trough on legs. */
export function trough(l: Lot, x: number, z: number, length: number, ry = 0, water = true): void {
  for (const t of [-0.4, 0.4]) {
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * length * t, -Math.sin(ry) * length * t),
      0.03,
      0.006,
      0.02,
      0.026,
      '#5c3f27',
      ry,
    );
  }
  wbox(l, x, z, 0.046, length, 0.022, 0.03, tone('#8a6342', 0.1), ry);
  wbox(l, x, z, 0.064, length - 0.008, 0.002, 0.022, water ? '#5e9cb4' : '#d9bb68', ry);
}

/** Hay rack (feeder) with slats and hay. */
export function hayRack(l: Lot, x: number, z: number, ry = 0): void {
  wbox(l, x, z, 0.03, 0.08, 0.03, 0.04, '#6b4a2c', ry);
  wbox(l, x, z, 0.06, 0.07, 0.03, 0.034, '#e2c46e', ry);
  for (let i = 0; i < 6; i++) {
    const t = -0.035 + i * 0.014;
    for (const sd of [-0.022, 0.022]) {
      const [px, pz] = off(
        l,
        x,
        z,
        Math.cos(ry) * t - Math.sin(ry) * sd,
        -(Math.sin(ry) * t + Math.cos(ry) * sd),
      );
      l.beam([px, 0.06, pz], [px, 0.1, pz], 0.004, '#6b4a2c');
    }
  }
  wbox(l, x, z, 0.1, 0.09, 0.006, 0.05, '#5c3f27', ry);
}

/** Spoked wagon wheel standing in plane facing `ry`. */
export function wheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
  const rim = new THREE.TorusGeometry(r, 0.003, 4, 14);
  rim.rotateY(ry + Math.PI / 2);
  l.shape(rim, '#3a2a1e', x, z, y + r);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.BoxGeometry(0.002, r * 2, 0.002);
    sp.rotateZ(a);
    sp.rotateY(ry + Math.PI / 2);
    l.shape(sp, '#6b4a2c', x, z, y + r);
  }
}

/** Farm cart loaded with goods. */
export function cart(
  l: Lot,
  x: number,
  z: number,
  ry: number,
  load: 'hay' | 'barrels' | 'cans' | 'crates',
): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  wbox(l, x, z, 0.06, 0.09, 0.008, 0.05, '#8a6342', ry);
  for (const sd of [-0.026, 0.026])
    wbox(l, ...off(l, x, z, s * sd, c * sd), 0.068, 0.09, 0.016, 0.003, '#6b4a2c', ry);
  for (const sd of [-0.03, 0.03]) wheel(l, ...off(l, x, z, s * sd, c * sd), 0.03, 0.026, ry);
  const [hx, hz] = off(l, x, z, c * 0.045, -s * 0.045);
  const [tx, tz] = off(l, x, z, c * 0.1, -s * 0.1);
  l.beam([hx, 0.064, hz], [tx, 0.05, tz], 0.005, '#6b4a2c');
  if (load === 'hay') wbox(l, x, z, 0.068, 0.084, 0.03, 0.046, '#ddc06d', ry);
  if (load === 'barrels')
    for (const t of [-0.024, 0, 0.024]) barrel(l, ...off(l, x, z, c * t, -s * t), 0.068, 0.011);
  if (load === 'cans')
    for (const t of [-0.026, 0, 0.026]) milkCan(l, ...off(l, x, z, c * t, -s * t), 0.068);
  if (load === 'crates')
    for (const t of [-0.022, 0.022]) crate(l, ...off(l, x, z, c * t, -s * t), 0.068, '#c8392c', ry);
}

/** Old-fashioned lantern post. */
export function lanternPost(l: Lot, x: number, z: number, h = 0.2): void {
  wround(l, x, z, 0.008, 0.01, 0.03, 0.02, '#2c3134');
  wround(l, x, z, 0.003, 0.004, 0.05, h - 0.02, '#2c3134');
  wbox(l, x, z, 0.03 + h, 0.016, 0.022, 0.016, '#ffe1a0', 0, 0, 1);
  const cap = new THREE.ConeGeometry(0.014, 0.014, 4);
  cap.rotateY(Math.PI / 4);
  l.shape(cap, '#2c3134', x, z, 0.03 + h + 0.03);
}

/** Steel or stave silo with hoops, ladder and domed cap. */
export function silo(
  l: Lot,
  x: number,
  z: number,
  r: number,
  h: number,
  color: string,
  ribbed = true,
): void {
  wround(l, x, z, r * 1.08, r * 1.12, 0.03, 0.03, '#a59d8c');
  const g = new THREE.CylinderGeometry(r, r, h, 20);
  l.shape(g, color, x, z, 0.06 + h / 2);
  if (ribbed) {
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      wbox(
        l,
        ...off(l, x, z, Math.cos(a) * r, Math.sin(a) * r),
        0.06,
        0.004,
        h,
        0.004,
        shade(color, 0.82),
        -a,
      );
    }
  }
  for (let i = 1; i < 8; i++)
    wround(l, x, z, r + 0.002, r + 0.002, 0.06 + (h * i) / 8, 0.004, shade(color, 0.7));
  const dome = new THREE.SphereGeometry(r * 1.02, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.75, 1);
  l.shape(dome, shade(color, 1.08), x, z, 0.06 + h);
  wround(l, x, z, 0.006, 0.01, 0.06 + h + r * 0.74, 0.02, shade(color, 0.8));
  // Ladder with cage.
  const [lx, lz] = off(l, x, z, r + 0.008, 0);
  for (const sd of [-0.008, 0.008])
    wbox(l, ...off(l, lx, lz, 0, sd), 0.06, 0.003, h, 0.003, '#2c3134');
  for (let i = 0; i < Math.round(h / 0.03); i++)
    wbox(l, lx, lz, 0.07 + i * 0.03, 0.003, 0.002, 0.016, '#2c3134');
}
