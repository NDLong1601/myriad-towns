import * as THREE from 'three';
import { off, rand, shade, shingleGable, tone, wbox, wround } from './diorama';
import type { Lot } from './lot';

// Second part of the diorama kit: crops, water, machines, boats and wildlife used by the
// farm, orchard, fishery and hunting chains of Group 5. All sizes in world units.

type Axis = 'x' | 'z';

/** Straw thatch gable: a thick shingle roof in straw tones with a deep overhang. */
export function thatchGable(
  l: Lot,
  cx: number,
  cz: number,
  along: Axis,
  length: number,
  span: number,
  y: number,
  h: number,
  gableColor?: string,
): void {
  shingleGable(l, cx, cz, along, length, span, y, h, '#cfa956', gableColor, 0.045);
}

export type CropKind = 'grain' | 'greens' | 'carrot' | 'cabbage' | 'berry' | 'pumpkin';

/**
 * Tilled bed between lot fractions (x0, z0) and (x1, z1) planted in rows running along x.
 * `stage` 1..4 grows the plants from bare furrows to ripe crop.
 */
export function cropBed(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  kind: CropKind,
  stage: number,
  spacing = 0.05,
): void {
  const w = (x1 - x0) * l.spanX;
  const d = (z1 - z0) * l.spanZ;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const soil = kind === 'grain' ? '#8c6544' : '#6f4c34';
  wbox(l, cx, cz, 0.03, w, 0.008, d, soil);
  const rows = Math.max(2, Math.floor(d / spacing));
  for (let r = 0; r < rows; r++) {
    const z = z0 + ((r + 0.5) / rows) * (z1 - z0);
    wbox(l, cx, z, 0.036, w * 0.97, 0.008, spacing * 0.45, shade(soil, 1.15));
    if (stage <= 1) continue;
    if (kind === 'grain') {
      const hh = stage === 2 ? 0.025 : stage === 3 ? 0.06 : 0.08;
      const col = stage === 2 ? '#7fae4c' : stage === 3 ? '#a9b44c' : '#d9b24e';
      // Dense straw mass, then individual stalks and ears poking out of it.
      wbox(l, cx, z, 0.04, w * 0.98, hh * 0.72, spacing * 0.7, tone(col, 0.06));
      const n = Math.round(w / 0.026);
      for (let i = 0; i < n; i++) {
        const x = x0 + ((i + rand()) / n) * (x1 - x0);
        const dz = (rand() - 0.5) * spacing * 0.6;
        const top = hh * (0.85 + rand() * 0.35);
        wbox(
          l,
          ...off(l, x, z, 0, dz),
          0.04 + hh * 0.5,
          0.006,
          top - hh * 0.5,
          0.006,
          tone(col, 0.14),
          rand() * 3,
          (rand() - 0.5) * 0.4,
        );
        if (stage === 4)
          wbox(
            l,
            ...off(l, x, z, 0, dz),
            0.04 + top - 0.004,
            0.008,
            0.02,
            0.008,
            tone('#ecd27a', 0.12),
            rand() * 3,
          );
      }
      continue;
    }
    const n = Math.max(3, Math.round(w / spacing));
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i + 0.5 + (r % 2) * 0.3) / n) * (x1 - x0);
      if (x > x1 - 0.005) continue;
      const g = stage === 2 ? 0.45 : stage === 3 ? 0.75 : 1;
      if (kind === 'cabbage') {
        const ico = new THREE.IcosahedronGeometry(0.016 * g, 0);
        l.shape(ico, tone(i % 2 ? '#8dbb5a' : '#6fa34a', 0.15), x, z, 0.044 + 0.01 * g);
      } else if (kind === 'pumpkin') {
        wbox(l, x, z, 0.038, 0.03 * g, 0.006, 0.03 * g, '#4f8a3a', rand() * 3);
        if (stage === 4 && (i + r) % 2) {
          const s = new THREE.SphereGeometry(0.013, 8, 5);
          s.scale(1, 0.75, 1);
          l.shape(s, tone('#e0812e', 0.1), x, z, 0.05);
        }
      } else if (kind === 'berry') {
        const ico = new THREE.IcosahedronGeometry(0.024 * g, 0);
        l.shape(ico, tone('#3f7a3a', 0.15), x, z, 0.044 + 0.02 * g);
        if (stage === 4)
          for (let k = 0; k < 3; k++)
            wbox(
              l,
              ...off(l, x, z, (rand() - 0.5) * 0.04, (rand() - 0.5) * 0.04),
              0.05 + rand() * 0.03,
              0.007,
              0.007,
              0.007,
              k % 2 ? '#c3324f' : '#4a3a8a',
            );
      } else {
        // Leafy greens / carrot tops: small fans of leaves.
        const col = kind === 'carrot' ? '#5f9e3c' : '#79b24e';
        for (const a of [0, 1.05, 2.1])
          wbox(l, x, z, 0.04, 0.016 * g, 0.022 * g, 0.004, tone(col, 0.15), a + rand() * 0.3);
        if (kind === 'carrot' && stage === 4) wbox(l, x, z, 0.036, 0.008, 0.008, 0.008, '#e07a2e');
      }
    }
  }
}

/** Still water: a recessed sheet with a lighter shimmer and dark rim. */
export function waterSheet(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y = 0.018,
  color = '#4f93b0',
): void {
  wbox(l, x, z, y - 0.01, w, 0.012, d, shade(color, 0.7));
  wbox(l, x, z, y, w, 0.004, d, color);
  for (let i = 0; i < Math.round((w * d) / 0.004); i++) {
    const px = x + ((rand() - 0.5) * w * 0.9) / l.spanX;
    const pz = z + ((rand() - 0.5) * d * 0.9) / l.spanZ;
    wbox(l, px, pz, y + 0.003, 0.02 + rand() * 0.03, 0.002, 0.004, '#a9d6e4');
  }
}

/** Stone-kerbed irrigation channel from (x0, z0) to (x1, z1) (axis aligned). */
export function channel(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  width: number,
  stone = '#9a9890',
): void {
  const alongX = Math.abs(x1 - x0) * l.spanX > Math.abs(z1 - z0) * l.spanZ;
  const len = alongX ? Math.abs(x1 - x0) * l.spanX : Math.abs(z1 - z0) * l.spanZ;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  waterSheet(l, cx, cz, alongX ? len : width, alongX ? width : len, 0.03);
  const blocks = Math.round(len / 0.04);
  for (const s of [-1, 1])
    for (let i = 0; i < blocks; i++) {
      const t = -len / 2 + (i + 0.5) * (len / blocks);
      const [px, pz] = alongX
        ? off(l, cx, cz, t, (s * (width + 0.02)) / 2)
        : off(l, cx, cz, (s * (width + 0.02)) / 2, t);
      wbox(
        l,
        px,
        pz,
        0.03,
        alongX ? (len / blocks) * 0.94 : 0.02,
        0.022,
        alongX ? 0.02 : (len / blocks) * 0.94,
        tone(stone, 0.18),
      );
    }
}

/** Undershot water wheel turning on an axle across `ry`. */
export function waterWheel(l: Lot, x: number, z: number, y: number, r: number, ry: number): void {
  for (const sd of [-0.022, 0.022]) {
    const rim = new THREE.TorusGeometry(r, 0.005, 5, 18);
    rim.rotateY(ry);
    l.shape(rim, '#5c3f27', ...off(l, x, z, Math.sin(ry) * sd, Math.cos(ry) * sd), y + r);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const paddle = new THREE.BoxGeometry(0.022, 0.004, 0.05);
    paddle.translate(0, r, 0);
    paddle.rotateZ(a);
    paddle.rotateY(ry + Math.PI / 2);
    l.shape(paddle, tone('#7a5634', 0.12), x, z, y + r);
    const spoke = new THREE.BoxGeometry(0.003, r, 0.003);
    spoke.translate(0, r / 2, 0);
    spoke.rotateZ(a);
    spoke.rotateY(ry + Math.PI / 2);
    l.shape(spoke, '#4a3220', x, z, y + r);
  }
  const axle = new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6);
  axle.rotateX(Math.PI / 2);
  axle.rotateY(ry);
  l.shape(axle, '#3a3530', x, z, y + r);
}

/** Four lattice windmill sails on a hub facing direction `ry`, hub at height y. */
export function windmillSails(
  l: Lot,
  x: number,
  z: number,
  y: number,
  len: number,
  ry: number,
): void {
  const hub = new THREE.CylinderGeometry(0.012, 0.016, 0.03, 8);
  hub.rotateX(Math.PI / 2);
  hub.rotateY(ry);
  l.shape(hub, '#3a3530', x, z, y);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.35;
    const add = (g: THREE.BufferGeometry, color: string): void => {
      g.rotateZ(a);
      g.rotateY(ry);
      l.shape(g, color, ...off(l, x, z, Math.sin(ry) * 0.016, Math.cos(ry) * 0.016), y);
    };
    const spar = new THREE.BoxGeometry(0.006, len, 0.006);
    spar.translate(0, len / 2, 0);
    add(spar, '#5c3f27');
    for (let k = 1; k <= 6; k++) {
      const bar = new THREE.BoxGeometry(0.05, 0.003, 0.003);
      bar.translate(0.022, (k / 6.6) * len, 0);
      add(bar, '#6b4a2c');
    }
    const cloth = new THREE.BoxGeometry(0.04, len * 0.78, 0.002);
    cloth.translate(0.024, len * 0.55, -0.002);
    add(cloth, '#efe7d6');
  }
}

/** Little steam / diesel tractor. */
export function tractor(l: Lot, x: number, z: number, ry: number, color = '#c0392b'): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number, b: number): [number, number] =>
    off(l, x, z, c * a + s * b, -s * a + c * b);
  wbox(l, ...at(0.012, 0), 0.05, 0.05, 0.026, 0.026, color, ry);
  wbox(l, ...at(-0.02, 0), 0.05, 0.028, 0.05, 0.036, shade(color, 0.85), ry);
  wbox(l, ...at(-0.02, 0), 0.1, 0.03, 0.004, 0.038, '#2c3134', ry);
  wbox(l, ...at(0.03, 0), 0.07, 0.004, 0.03, 0.004, '#2c3134', ry);
  for (const sd of [-0.024, 0.024]) {
    const big = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12);
    big.rotateX(Math.PI / 2);
    big.rotateY(ry);
    l.shape(big, '#2a2a2a', ...at(-0.022, sd), 0.052);
    const small = new THREE.CylinderGeometry(0.013, 0.013, 0.01, 10);
    small.rotateX(Math.PI / 2);
    small.rotateY(ry);
    l.shape(small, '#2a2a2a', ...at(0.03, sd * 0.9), 0.043);
  }
}

/** Small box truck. */
export function truck(l: Lot, x: number, z: number, ry: number, color = '#3f6b8a'): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number): [number, number] => off(l, x, z, c * a, -s * a);
  wbox(l, ...at(0.05), 0.04, 0.04, 0.05, 0.05, color, ry);
  wbox(l, ...at(0.071), 0.065, 0.002, 0.018, 0.044, '#9fc3d6', ry);
  wbox(l, ...at(-0.02), 0.04, 0.1, 0.064, 0.056, '#e8e4dc', ry);
  wbox(l, at(0)[0], at(0)[1], 0.03, 0.17, 0.012, 0.05, '#2c3134', ry);
  for (const a of [-0.05, 0.05])
    for (const sd of [-0.026, 0.026]) {
      const wheelG = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 10);
      wheelG.rotateX(Math.PI / 2);
      wheelG.rotateY(ry);
      l.shape(wheelG, '#222222', ...off(l, x, z, c * a + s * sd, -s * a + c * sd), 0.042);
    }
}

/**
 * Glass box (greenhouse / glass hall): glazed panes between slender mullions with a glazed
 * gable roof. `glow` lights the panes at night.
 */
export function glassHouse(
  l: Lot,
  x: number,
  z: number,
  y: number,
  w: number,
  h: number,
  d: number,
  frame: string,
  glass = '#bfe0e6',
  glow = 0,
  roofRise = 0.05,
  opaque = true,
): void {
  if (opaque) wbox(l, x, z, y, w, h, d, glass, 0, 0, glow);
  else wbox(l, x, z, y, w, 0.006, d, '#d9d6cf');
  const n = Math.max(2, Math.round(w / 0.04));
  const m = Math.max(2, Math.round(d / 0.04));
  for (let i = 0; i <= n; i++)
    for (const s of [-1, 1])
      wbox(l, ...off(l, x, z, -w / 2 + (i * w) / n, (s * d) / 2), y, 0.004, h, 0.006, frame);
  for (let i = 0; i <= m; i++)
    for (const s of [-1, 1])
      wbox(l, ...off(l, x, z, (s * w) / 2, -d / 2 + (i * d) / m), y, 0.006, h, 0.004, frame);
  for (const yy of [y, y + h * 0.5, y + h - 0.004])
    wbox(l, x, z, yy, w + 0.006, 0.005, d + 0.006, frame);
  if (roofRise > 0) {
    const half = d / 2;
    const slope = Math.hypot(half, roofRise);
    const a = Math.atan2(roofRise, half);
    for (const s of [-1, 1]) {
      const pane = new THREE.BoxGeometry(w, 0.004, slope);
      pane.rotateX(s * a);
      l.shape(
        pane,
        shade(glass, 1.05),
        ...off(l, x, z, 0, (s * half) / 2),
        y + h + roofRise / 2,
        glow,
      );
      for (let i = 0; i <= n; i++) {
        const rib = new THREE.BoxGeometry(0.004, 0.006, slope);
        rib.rotateX(s * a);
        l.shape(
          rib,
          frame,
          ...off(l, x, z, -w / 2 + (i * w) / n, (s * half) / 2),
          y + h + roofRise / 2 + 0.003,
        );
      }
    }
    wbox(l, x, z, y + h + roofRise - 0.002, w + 0.01, 0.008, 0.01, frame);
  }
}

/** Row of solar panels on frames. */
export function solarRow(l: Lot, x: number, z: number, y: number, w: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const px = x + (-w / 2 + (i + 0.5) * (w / count)) / l.spanX;
    const g = new THREE.BoxGeometry((w / count) * 0.9, 0.004, 0.05);
    g.rotateX(-0.45);
    l.shape(g, '#2c4a6e', px, z, y + 0.02);
    wbox(l, px, z, y, 0.004, 0.02, 0.004, '#9aa0a4');
  }
}

/** Grape vines trained on wires between posts from (x0, z) to (x1, z). */
export function vineRow(l: Lot, x0: number, x1: number, z: number, stage: number): void {
  const len = (x1 - x0) * l.spanX;
  const posts = Math.max(2, Math.round(len / 0.08));
  for (let i = 0; i <= posts; i++)
    wbox(l, x0 + ((x1 - x0) * i) / posts, z, 0.03, 0.006, 0.07, 0.006, '#6b4a2c');
  for (const yy of [0.06, 0.09]) l.beam([x0, yy, z], [x1, yy, z], 0.002, '#555555');
  const n = Math.round(len / 0.03);
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5) / n) * (x1 - x0);
    const g = new THREE.IcosahedronGeometry(0.017, 0);
    g.scale(1, 0.9, 0.7);
    l.shape(g, tone(i % 2 ? '#4c8a36' : '#5e9a40', 0.18), x, z, 0.085 + rand() * 0.01);
    if (stage >= 4 && i % 2 === 0) {
      const bunch = new THREE.ConeGeometry(0.007, 0.018, 6);
      bunch.rotateX(Math.PI);
      l.shape(bunch, '#5a2a5e', ...off(l, x, z, 0, 0.012), 0.068);
    }
  }
}

/** Wooden plank pier on piles from lot fraction (x0, z0) to (x1, z1), deck at y. */
export function pier(
  l: Lot,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  width: number,
  y: number,
  color = '#8a6a48',
): void {
  const alongX = Math.abs(x1 - x0) * l.spanX > Math.abs(z1 - z0) * l.spanZ;
  const len = alongX ? Math.abs(x1 - x0) * l.spanX : Math.abs(z1 - z0) * l.spanZ;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const planks = Math.round(len / 0.022);
  for (let i = 0; i < planks; i++) {
    const t = -len / 2 + (i + 0.5) * (len / planks);
    const [px, pz] = alongX ? off(l, cx, cz, t, 0) : off(l, cx, cz, 0, t);
    wbox(
      l,
      px,
      pz,
      y,
      alongX ? (len / planks) * 0.86 : width,
      0.008,
      alongX ? width : (len / planks) * 0.86,
      tone(color, 0.18),
    );
  }
  const piles = Math.max(2, Math.round(len / 0.1));
  for (let i = 0; i <= piles; i++) {
    const t = -len / 2 + (i * len) / piles;
    for (const s of [-1, 1]) {
      const [px, pz] = alongX
        ? off(l, cx, cz, t, (s * width) / 2)
        : off(l, cx, cz, (s * width) / 2, t);
      wround(l, px, pz, 0.008, 0.009, 0, y + 0.04, '#5c4630', 8);
    }
  }
}

/** Boat hull with ribs; optional mast and sail; `ry` points the bow. */
export function boat(
  l: Lot,
  x: number,
  z: number,
  ry: number,
  len: number,
  hull: string,
  opts: { sail?: boolean; cabin?: string; y?: number } = {},
): void {
  const y = opts.y ?? 0.012;
  const shape = new THREE.Shape();
  const hw = len * 0.2;
  shape.moveTo(-len / 2, -hw * 0.8);
  shape.lineTo(len * 0.25, -hw);
  shape.quadraticCurveTo(len / 2, -hw * 0.4, len / 2 + 0.01, 0);
  shape.quadraticCurveTo(len / 2, hw * 0.4, len * 0.25, hw);
  shape.lineTo(-len / 2, hw * 0.8);
  shape.closePath();
  const depth = len * 0.16;
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.rotateY(ry);
  l.shape(g, hull, x, z, y);
  const inner = new THREE.ShapeGeometry(shape);
  inner.scale(0.86, 0.8, 1);
  inner.rotateX(-Math.PI / 2);
  inner.rotateY(ry);
  l.shape(inner, '#a8845a', x, z, y + depth * 0.7);
  const stripe = new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: false });
  stripe.scale(1.01, 1.02, 1);
  stripe.rotateX(-Math.PI / 2);
  stripe.rotateY(ry);
  l.shape(stripe, '#f1ece2', x, z, y + depth - 0.006);
  if (opts.cabin) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    wbox(
      l,
      ...off(l, x, z, -c * len * 0.12, s * len * 0.12),
      y + depth,
      len * 0.26,
      len * 0.16,
      hw * 1.2,
      opts.cabin,
      ry,
    );
    wbox(
      l,
      ...off(l, x, z, -c * len * 0.12, s * len * 0.12),
      y + depth + len * 0.16,
      len * 0.3,
      0.006,
      hw * 1.4,
      '#2c3134',
      ry,
    );
    wbox(
      l,
      ...off(l, x, z, -c * len * 0.0, s * len * 0.0),
      y + depth + len * 0.08,
      0.002,
      len * 0.04,
      hw * 1.0,
      '#9fc3d6',
      ry,
    );
    wround(
      l,
      ...off(l, x, z, -c * len * 0.2, s * len * 0.2),
      0.004,
      0.004,
      y + depth,
      len * 0.5,
      '#d9dcdc',
      6,
    );
  }
  if (opts.sail) {
    wround(l, x, z, 0.003, 0.004, y + depth * 0.7, len * 0.9, '#5c3f27', 6);
    const sail = new THREE.Shape();
    sail.moveTo(0, 0);
    sail.lineTo(-len * 0.42, 0);
    sail.lineTo(0, len * 0.78);
    sail.closePath();
    const sg = new THREE.ShapeGeometry(sail);
    sg.rotateY(ry);
    l.shape(sg, '#efe4cc', x, z, y + depth + 0.02);
  }
}

/** Drying rack: two A-frames with a pole of hanging fish (or skins when `hides`). */
export function dryingRack(l: Lot, x: number, z: number, ry: number, hides = false): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  for (const t of [-0.05, 0.05]) {
    const [px, pz] = off(l, x, z, c * t, -s * t);
    for (const e of [-1, 1])
      l.beam(
        [px + (e * s * 0.015) / l.spanX, 0.03, pz + (e * c * 0.015) / l.spanZ],
        [px, 0.12, pz],
        0.005,
        '#7a5634',
      );
  }
  const [ax, az] = off(l, x, z, -c * 0.06, s * 0.06);
  const [bx, bz] = off(l, x, z, c * 0.06, -s * 0.06);
  l.beam([ax, 0.115, az], [bx, 0.115, bz], 0.004, '#5c3f27');
  if (hides) {
    wbox(l, x, z, 0.05, 0.08, 0.06, 0.003, '#a8784a', ry);
    wbox(l, x, z, 0.06, 0.06, 0.04, 0.004, '#8a5a34', ry);
    return;
  }
  for (let i = 0; i < 6; i++) {
    const t = -0.045 + i * 0.018;
    wbox(l, ...off(l, x, z, c * t, -s * t), 0.072, 0.008, 0.036, 0.003, tone('#9aa6ad', 0.2), ry);
    wbox(l, ...off(l, x, z, c * t, -s * t), 0.066, 0.01, 0.008, 0.002, '#7d8a90', ry);
  }
}

/** Lattice-boom dockside crane with a hanging cargo net. */
export function crane(
  l: Lot,
  x: number,
  z: number,
  h: number,
  ry: number,
  color = '#5a5f63',
): void {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const)
    l.beam(
      [x + (a * 0.025) / l.spanX, 0.03, z + (b * 0.025) / l.spanZ],
      [x + (a * 0.012) / l.spanX, 0.03 + h, z + (b * 0.012) / l.spanZ],
      0.006,
      color,
    );
  for (let k = 1; k < 5; k++) {
    const yy = 0.03 + (k / 5) * h;
    const r = 0.025 - (0.013 * k) / 5;
    wbox(l, x, z, yy, r * 2, 0.004, r * 2, shade(color, 0.85));
  }
  wbox(l, x, z, 0.03 + h, 0.04, 0.03, 0.04, '#7a6a54');
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const tip = off(l, x, z, c * h * 0.8, -s * h * 0.8);
  l.beam([x, 0.04 + h, z], [tip[0], 0.03 + h * 1.2, tip[1]], 0.007, color);
  l.beam([x, 0.03 + h * 1.25, z], [tip[0], 0.03 + h * 1.2, tip[1]], 0.002, '#2c3134');
  l.beam([tip[0], 0.03 + h * 1.2, tip[1]], [tip[0], 0.03 + h * 0.55, tip[1]], 0.002, '#2c3134');
  const net = new THREE.IcosahedronGeometry(0.022, 0);
  l.shape(net, '#5f8a7a', tip[0], tip[1], 0.03 + h * 0.5);
}

/** Deer (stag with antlers when `stag`). */
export function deer(l: Lot, x: number, z: number, ry: number, stag = false): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number, b = 0): [number, number] => off(l, x, z, c * a + s * b, -s * a + c * b);
  const coat = '#a8723f';
  wbox(l, x, z, 0.062, 0.05, 0.022, 0.02, coat, ry);
  for (const a of [-0.018, 0.018])
    for (const b of [-0.006, 0.006]) wbox(l, ...at(a, b), 0.03, 0.005, 0.034, 0.005, '#7a5232', ry);
  wbox(l, ...at(0.026), 0.078, 0.008, 0.026, 0.01, coat, ry, 0, 0);
  wbox(l, ...at(0.034), 0.098, 0.018, 0.01, 0.01, coat, ry);
  wbox(l, ...at(-0.026), 0.075, 0.006, 0.008, 0.008, '#f1ece2', ry);
  if (stag)
    for (const b of [-0.006, 0.006]) {
      wbox(l, ...at(0.03, b), 0.108, 0.003, 0.026, 0.003, '#d9c9a3', ry);
      wbox(l, ...at(0.034, b * 1.6), 0.122, 0.012, 0.003, 0.003, '#d9c9a3', ry);
    }
}

/** Hound. */
export function dog(l: Lot, x: number, z: number, ry: number, coat = '#8a6a48'): void {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (a: number, b = 0): [number, number] => off(l, x, z, c * a + s * b, -s * a + c * b);
  wbox(l, x, z, 0.044, 0.032, 0.013, 0.012, coat, ry);
  for (const a of [-0.012, 0.012])
    for (const b of [-0.004, 0.004])
      wbox(l, ...at(a, b), 0.03, 0.004, 0.016, 0.004, shade(coat, 0.8), ry);
  wbox(l, ...at(0.02), 0.054, 0.014, 0.01, 0.01, coat, ry);
  wbox(l, ...at(0.028), 0.054, 0.008, 0.006, 0.007, shade(coat, 0.7), ry);
  wbox(l, ...at(-0.02), 0.052, 0.012, 0.003, 0.003, coat, ry);
}

/** Bird of prey perched on a post, or in flight when `flying`. */
export function falcon(l: Lot, x: number, z: number, y: number, flying = false): void {
  if (flying) {
    wbox(l, x, z, y, 0.014, 0.006, 0.006, '#6b4a2c');
    wbox(l, x, z, y + 0.003, 0.006, 0.002, 0.05, '#7a5634', 0.3);
    return;
  }
  wround(l, x, z, 0.003, 0.004, 0.03, y - 0.03, '#5c3f27', 6);
  wbox(l, x, z, y, 0.01, 0.016, 0.009, '#7a5634');
  wbox(l, x, z, y + 0.016, 0.007, 0.007, 0.007, '#d9c9a3');
}

/** Campfire ringed with stones, with a lit glow. */
export function campfire(l: Lot, x: number, z: number): void {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, Math.cos(a) * 0.026, Math.sin(a) * 0.026),
      0.03,
      0.012,
      0.01,
      0.012,
      tone('#8f8a80', 0.2),
      a,
    );
  }
  for (const a of [0, 1, 2]) wbox(l, x, z, 0.032, 0.04, 0.006, 0.006, '#5c3f27', a);
  const flame = new THREE.ConeGeometry(0.012, 0.03, 6);
  l.shape(flame, '#ffb347', x, z, 0.05, 1);
}

/** Log-cabin body: horizontal round logs with crossed corners. */
export function logBody(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  color = '#8a6142',
): void {
  wbox(l, x, z, y, w - 0.01, h, d - 0.01, shade(color, 0.6));
  const r = 0.009;
  const courses = Math.round(h / (r * 2));
  for (let i = 0; i < courses; i++) {
    const yy = y + r + i * 2 * r;
    for (const [along, len, depth] of [
      ['x', w + 0.03, d],
      ['z', d + 0.03, w],
    ] as const) {
      for (const s of [-1, 1]) {
        const log = new THREE.CylinderGeometry(r, r, len, 7);
        if (along === 'x') log.rotateZ(Math.PI / 2);
        else log.rotateX(Math.PI / 2);
        const [px, pz] =
          along === 'x' ? off(l, x, z, 0, (s * depth) / 2) : off(l, x, z, (s * depth) / 2, 0);
        l.shape(log, tone(color, 0.16), px, pz, yy + (along === 'z' ? r : 0));
      }
    }
  }
}

/** Conical tower roof (round turret). */
export function coneRoof(
  l: Lot,
  x: number,
  z: number,
  y: number,
  r: number,
  h: number,
  color: string,
): void {
  const g = new THREE.ConeGeometry(r, h, 16);
  l.shape(g, color, x, z, y + h / 2);
  wround(l, x, z, 0.002, 0.003, y + h, 0.05, '#d7af4b', 6);
  l.shape(new THREE.SphereGeometry(0.008, 8, 6), '#d7af4b', x, z, y + h + 0.05);
}

/** Smoke puffs drifting from a stack top. */
export function smoke(l: Lot, x: number, z: number, y: number, n = 3): void {
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(0.018 + i * 0.008, 0);
    l.shape(
      g,
      shade('#d9d6cf', 1 - i * 0.05),
      ...off(l, x, z, i * 0.014, -i * 0.01),
      y + 0.02 + i * 0.03,
    );
  }
}

/** Corrugated steel grain silo with a conical cap, catwalk ring and ladder. */
export function steelSilo(l: Lot, x: number, z: number, r: number, h: number): void {
  wround(l, x, z, r * 1.1, r * 1.15, 0.03, 0.02, '#a59d8c', 20);
  const ribs = 6;
  for (let i = 0; i < ribs; i++)
    wround(
      l,
      x,
      z,
      r,
      r,
      0.05 + (i * h) / ribs,
      h / ribs - 0.004,
      i % 2 ? '#c8cdd0' : '#b9bfc3',
      20,
    );
  for (let i = 1; i < ribs; i++)
    wround(l, x, z, r + 0.003, r + 0.003, 0.05 + (i * h) / ribs - 0.003, 0.004, '#8f969a', 20);
  const cap = new THREE.ConeGeometry(r * 1.06, r * 0.7, 20);
  l.shape(cap, '#c8cdd0', x, z, 0.05 + h + r * 0.35);
  wround(l, x, z, r * 0.2, r * 0.25, 0.05 + h + r * 0.6, 0.02, '#8f969a', 8);
  wround(l, x, z, r + 0.012, r + 0.012, 0.05 + h - 0.004, 0.004, '#5a5f63', 20);
  const [lx, lz] = off(l, x, z, r + 0.006, 0);
  wbox(l, lx, lz, 0.05, 0.004, h, 0.018, '#5a5f63');
}
