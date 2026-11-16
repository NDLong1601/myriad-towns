import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BuildingDef } from '@/sim/catalog';

/**
 * Procedural low-poly models built from a building's `visual` block, until real models
 * arrive in M6. Colours are baked as vertex colours so every building shares one material.
 * Geometry origin: the footprint's min corner on the ground; +x = width, +z = depth.
 */
const cache = new Map<string, THREE.BufferGeometry>();

/** Road connections: which of the four neighbours are roads. */
export const ROAD_E = 1; // +x
export const ROAD_W = 2; // -x
export const ROAD_S = 4; // +z
export const ROAD_N = 8; // -z

/** Colour of a lit window or lamp; the shader scales it by the night factor. */
const LIT = '#ffcf70';

/**
 * Geometry for a building. `variant` only matters for roads: the mask of connected
 * neighbours, so roads auto-tile into straights, corners, junctions and dead ends.
 */
export function buildingGeometry(def: BuildingDef, variant = 0): THREE.BufferGeometry {
  const key = `${def.id}#${variant}`;
  let g = cache.get(key);
  if (!g) {
    g = makeGeometry(def, variant);
    cache.set(key, g);
  }
  return g;
}

/** Number of set bits in a road mask. */
function arms(mask: number): number {
  return (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1) + ((mask >> 3) & 1);
}

/** A bridge deck rides this far above the water surface, level with the shore roads at each end. */
export const BRIDGE_LIFT = 0.2;

export function part(
  geo: THREE.BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
  glow = 0,
): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(n).fill(glow), 1));
  g.deleteAttribute('uv');
  return g;
}

/** Box resting on y=0, centred on (x, z). */
export function box(
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  z: number,
  y = 0,
  glow = 0,
): THREE.BufferGeometry {
  return part(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, glow);
}

/**
 * Small lit windows on the four walls of a w×d box standing on y0 with wall height h.
 * They look dark by day and glow at night (see the shader patch in buildingRenderer).
 */
function windows(
  w: number,
  d: number,
  cx: number,
  cz: number,
  y0: number,
  h: number,
  out: THREE.BufferGeometry[],
): void {
  const y = y0 + h * 0.5;
  const size = Math.min(0.16, h * 0.28);
  const nx = Math.max(1, Math.round(w / 0.55));
  const nz = Math.max(1, Math.round(d / 0.55));
  for (let i = 0; i < nx; i++) {
    const x = cx - w / 2 + ((i + 0.5) / nx) * w;
    for (const side of [-1, 1])
      out.push(box(size, size, 0.03, '#6c7a8c', x, cz + (side * d) / 2, y - size / 2, 1));
  }
  for (let i = 0; i < nz; i++) {
    const z = cz - d / 2 + ((i + 0.5) / nz) * d;
    for (const side of [-1, 1])
      out.push(box(0.03, size, size, '#6c7a8c', cx + (side * w) / 2, z, y - size / 2, 1));
  }
}

/** Four-sided pyramid roof sitting on top of a w×d box. */
function pyramid(
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  z: number,
  y: number,
): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(Math.SQRT1_2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(w, 1, d);
  return part(g, color, x, y + h / 2, z);
}

/** Gable roof (triangular prism) running along x. */
function gable(
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  z: number,
  y: number,
): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(1, 1, w, 3, 1);
  g.rotateZ(Math.PI / 2);
  g.rotateX(Math.PI); // ridge up
  // A unit triangle (radius 1) spans 1.5 tall, √3 wide; scale it to the roof.
  g.scale(1, h / 1.5, d / Math.sqrt(3));
  return part(g, color, x, y + h / 3, z);
}

function makeGeometry(def: BuildingDef, variant: number): THREE.BufferGeometry {
  const { w, d } = def.footprint;
  const v = def.visual;
  const h = v.height ?? 0.6;
  const color = v.color ?? '#d8d0c0';
  const roof = v.roof ?? shade(color, 0.7);
  const cx = w / 2;
  const cz = d / 2;
  const parts: THREE.BufferGeometry[] = [];
  switch (
    def.id === 'airfield' ||
    def.id === 'rail_track' ||
    def.id === 'flower_garden' ||
    def.id === 'bus_stop' ||
    def.id === 'metro_station' ||
    def.id === 'skyscraper'
      ? def.id
      : v.shape
  ) {
    case 'bus_stop': {
      parts.push(box(w * 0.85, 0.04, d * 0.85, '#7f8c8d', cx, cz));
      parts.push(box(w * 0.7, 0.45, 0.04, '#34495e', cx, cz - 0.28, 0.04));
      parts.push(box(w * 0.75, 0.04, 0.5, '#2980b9', cx, cz, 0.49));
      parts.push(box(0.4, 0.12, 0.15, '#d35400', cx, cz - 0.1, 0.04));
      parts.push(box(0.04, 0.6, 0.04, '#f1c40f', cx + 0.3, cz + 0.25, 0.04));
      parts.push(box(0.12, 0.12, 0.02, '#e74c3c', cx + 0.3, cz + 0.25, 0.54));
      break;
    }
    case 'metro_station': {
      parts.push(box(w * 0.95, 0.06, d * 0.95, '#5d6d7e', cx, cz));
      parts.push(box(1.0, 0.08, 1.2, '#1b2631', cx, cz, 0.06));
      parts.push(box(1.1, 0.45, 1.3, '#2471a3', cx, cz, 0.1));
      parts.push(box(0.08, 1.0, 0.08, '#2c3e50', cx + 0.65, cz + 0.65, 0.06));
      parts.push(box(0.2, 0.2, 0.05, '#e74c3c', cx + 0.65, cz + 0.65, 0.9));
      break;
    }
    case 'skyscraper': {
      parts.push(box(w * 0.88, h * 0.45, d * 0.88, color, cx, cz));
      windows(w * 0.88, d * 0.88, cx, cz, 0, h * 0.45, parts);
      parts.push(box(w * 0.72, h * 0.35, d * 0.72, shade(color, 0.95), cx, cz, h * 0.45));
      windows(w * 0.72, d * 0.72, cx, cz, h * 0.45, h * 0.35, parts);
      parts.push(box(w * 0.52, h * 0.2, d * 0.52, roof, cx, cz, h * 0.8));
      parts.push(box(0.08, 0.8, 0.08, '#f1c40f', cx, cz, h));
      break;
    }
    case 'airfield': {
      parts.push(box(w * 0.96, 0.06, d * 0.96, '#688257', cx, cz));
      parts.push(box(w, 0.1, 1.15, color, cx, cz));
      for (let i = 0; i < 4; i++) parts.push(box(0.45, 0.012, 0.04, '#ede5cd', i + 0.5, cz, 0.1));
      parts.push(box(1.5, h * 0.65, 0.9, '#dcd1b9', cx, cz - 1.25));
      parts.push(gable(1.6, 0.27, 1, roof, cx, cz - 1.25, h * 0.65));
      parts.push(box(0.55, h, 0.6, '#d8d4c7', cx + 1.2, cz + 1.1));
      parts.push(box(0.65, 0.22, 0.7, '#526676', cx + 1.2, cz + 1.1, h));
      break;
    }
    case 'rail_track': {
      parts.push(box(0.9, 0.04, 0.9, color, cx, cz));
      const straight = variant || ROAD_E | ROAD_W;
      for (const [mask, x, z] of [
        [ROAD_E, 1, 0],
        [ROAD_W, -1, 0],
        [ROAD_S, 0, 1],
        [ROAD_N, 0, -1],
      ] as const) {
        if (!(straight & mask)) continue;
        for (const side of [-1, 1]) {
          parts.push(
            box(
              x ? 0.64 : 0.045,
              0.045,
              z ? 0.64 : 0.045,
              roof,
              cx + x * 0.18 + z * side * 0.13,
              cz + z * 0.18 + x * side * 0.13,
              0.055,
            ),
          );
        }
        parts.push(
          box(
            x ? 0.09 : 0.41,
            0.035,
            z ? 0.09 : 0.41,
            '#60452f',
            cx + x * 0.31,
            cz + z * 0.31,
            0.025,
          ),
        );
      }
      break;
    }
    case 'flower_garden': {
      parts.push(box(w * 0.97, h, d * 0.97, color, cx, cz));
      parts.push(box(0.35, 0.03, d, '#d5b98a', cx, cz, h));
      const blossoms = [roof, '#f1c149', '#e9e0ed'];
      for (let row = 0; row < 5; row++) {
        for (const x of [0.34, 0.65, 1.35, 1.65]) {
          const z = 0.34 + row * 0.56;
          parts.push(box(0.07, 0.15, 0.07, '#458551', x, z, h));
          parts.push(
            pyramid(
              0.2,
              0.08,
              0.2,
              blossoms[(row + Math.round(x * 3)) % blossoms.length]!,
              x,
              z,
              h + 0.13,
            ),
          );
        }
      }
      break;
    }
    case 'road':
    case 'bridge': {
      const bridge = v.shape === 'bridge';
      // Bridges ride a little above the water on piles, with rails on the open sides.
      const lift = bridge ? BRIDGE_LIFT : 0;
      const half = bridge ? 0.4 : 0.36; // the carriageway; roads leave a verge on each side
      const reach = 0.5 - half;
      const l = (0.5 + half) / 2; // arm centre offset: from the centre block to the tile edge
      parts.push(box(half * 2, h, half * 2, color, cx, cz, lift));
      const arm = (ax: number, az: number, w2: number, d2: number): void => {
        parts.push(box(w2, h, d2, color, cx + ax * l, cz + az * l, lift));
      };
      if (variant & ROAD_E) arm(1, 0, reach, half * 2);
      if (variant & ROAD_W) arm(-1, 0, reach, half * 2);
      if (variant & ROAD_S) arm(0, 1, half * 2, reach);
      if (variant & ROAD_N) arm(0, -1, half * 2, reach);
      const lane = shade(color, 1.25);
      const eastWest = (variant & (ROAD_E | ROAD_W)) === (ROAD_E | ROAD_W) && arms(variant) === 2;
      const northSouth = (variant & (ROAD_S | ROAD_N)) === (ROAD_S | ROAD_N) && arms(variant) === 2;
      if (!bridge && eastWest) parts.push(box(0.32, 0.01, 0.06, lane, cx, cz, h));
      if (!bridge && northSouth) parts.push(box(0.06, 0.01, 0.32, lane, cx, cz, h));
      if (bridge) {
        const rail = shade(color, 0.6);
        const top = lift + h;
        for (const p of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const) {
          parts.push(box(0.08, top + 0.3, 0.08, rail, cx + p[0] * half, cz + p[1] * half, -0.3));
          parts.push(box(0.1, 0.18, 0.1, rail, cx + p[0] * half, cz + p[1] * half, top));
        }
        // Rails along the edges that do not continue as a deck.
        const bar = (x: number, z: number, w2: number, d2: number): void => {
          parts.push(box(w2, 0.05, d2, rail, x, z, top + 0.12));
        };
        if (!(variant & ROAD_N)) bar(cx, cz - half, half * 2, 0.05);
        if (!(variant & ROAD_S)) bar(cx, cz + half, half * 2, 0.05);
        if (!(variant & ROAD_W)) bar(cx - half, cz, 0.05, half * 2);
        if (!(variant & ROAD_E)) bar(cx + half, cz, 0.05, half * 2);
        for (const [flag, ax, az] of [
          [ROAD_E, 1, 0],
          [ROAD_W, -1, 0],
          [ROAD_S, 0, 1],
          [ROAD_N, 0, -1],
        ] as const) {
          if (!(variant & flag)) continue;
          const along = ax !== 0;
          for (const side of [-1, 1]) {
            const x = cx + ax * l + (along ? 0 : side * half);
            const z = cz + az * l + (along ? side * half : 0);
            bar(x, z, along ? reach : 0.05, along ? 0.05 : reach);
          }
        }
      }
      // A street lamp at junctions and dead ends (not on bridges).
      if (!bridge && (arms(variant) >= 3 || arms(variant) === 1)) {
        parts.push(box(0.05, 0.5, 0.05, '#4a4a4a', cx + 0.3, cz + 0.3, h));
        parts.push(box(0.12, 0.1, 0.12, LIT, cx + 0.3, cz + 0.3, h + 0.5, 1));
      }
      break;
    }
    case 'field': {
      if (def.crop) {
        cropField(parts, def, variant || 4);
        break;
      }
      if (def.id === 'stockpile') {
        parts.push(box(w * 0.94, 0.06, d * 0.94, '#84745c', cx, cz));
        for (let i = 0; i < 5; i++) {
          const x = 0.3 + (i % 3) * 0.56;
          const z = 0.43 + Math.floor(i / 3) * 0.76;
          parts.push(box(0.45, 0.14, 0.48, '#625749', x, z, 0.06));
          parts.push(
            box(
              0.37,
              0.18 + (i % 2) * 0.12,
              0.34,
              i % 2 ? '#a8a59a' : '#7d8a8b',
              x + 0.08,
              z,
              0.18,
            ),
          );
        }
        break;
      }
      parts.push(box(w * 0.94, 0.06, d * 0.94, shade(color, 0.6), cx, cz));
      const rows = Math.max(3, d * 3);
      for (let i = 0; i < rows; i++) {
        parts.push(
          box(w * 0.86, h, 0.14, color, cx, ((i + 0.5) / rows) * d * 0.9 + d * 0.05, 0.04),
        );
      }
      break;
    }
    case 'park':
      parts.push(box(w * 0.96, h, d * 0.96, color, cx, cz));
      for (const [tx, tz] of [
        [0.3, 0.3],
        [0.7, 0.6],
        [0.4, 0.75],
      ] as const) {
        parts.push(box(0.08, 0.25, 0.08, '#6e5034', w * tx, d * tz, h));
        parts.push(pyramid(0.45, 0.7, 0.45, '#3f7d46', w * tx, d * tz, h + 0.2));
      }
      break;
    case 'dock':
      parts.push(box(0.9 * w, 0.12, 0.9 * d, color, cx, cz, h));
      for (const [px, pz] of [
        [0.15, 0.15],
        [0.85, 0.15],
        [0.15, 0.85],
        [0.85, 0.85],
      ] as const) {
        parts.push(box(0.08, h, 0.08, shade(color, 0.7), w * px, d * pz));
      }
      parts.push(box(0.3, 0.3, 0.3, '#c9a46a', cx - 0.15, cz, h + 0.12));
      break;
    case 'well':
      parts.push(box(0.5, h, 0.5, color, cx, cz));
      parts.push(box(0.06, 0.4, 0.06, roof, cx - 0.22, cz, h));
      parts.push(box(0.06, 0.4, 0.06, roof, cx + 0.22, cz, h));
      parts.push(pyramid(0.65, 0.25, 0.65, roof, cx, cz, h + 0.4));
      break;
    case 'mine':
      parts.push(box(w * 0.85, h * 0.5, d * 0.85, shade(color, 0.85), cx, cz));
      parts.push(gable(w * 0.5, h * 0.8, d * 0.5, color, cx, cz, h * 0.5));
      parts.push(box(0.25, 0.25, 0.25, '#3a3a3a', cx + 0.25, cz + 0.25, h * 0.5));
      break;
    case 'tower':
      parts.push(box(0.5 * w, h, 0.5 * d, color, cx, cz));
      parts.push(pyramid(0.6 * w, h * 0.35, 0.6 * d, roof, cx, cz, h));
      break;
    case 'tall':
      parts.push(box(0.78 * w, h, 0.78 * d, color, cx, cz));
      parts.push(gable(0.8 * w, 0.35, 0.82 * d, roof, cx, cz, h));
      windows(0.78 * w, 0.78 * d, cx, cz, 0, h, parts);
      break;
    case 'block':
      parts.push(box(0.86 * w, h * 0.75, 0.86 * d, color, cx, cz));
      windows(0.86 * w, 0.86 * d, cx, cz, 0, h * 0.75, parts);
      parts.push(box(0.9 * w, 0.08, 0.9 * d, roof, cx, cz, h * 0.75));
      parts.push(box(0.15, h * 0.4, 0.15, shade(roof, 0.8), cx + 0.2 * w, cz - 0.2 * d, h * 0.75));
      break;
    case 'hall':
      parts.push(box(0.88 * w, h * 0.65, 0.88 * d, color, cx, cz));
      parts.push(gable(0.92 * w, h * 0.5, 0.94 * d, roof, cx, cz, h * 0.65));
      windows(0.88 * w, 0.88 * d, cx, cz, 0, h * 0.65, parts);
      break;
    case 'house':
    default:
      parts.push(box(0.68 * w, h * 0.6, 0.68 * d, color, cx, cz));
      parts.push(pyramid(0.8 * w, h * 0.55, 0.8 * d, roof, cx, cz, h * 0.6));
      windows(0.68 * w, 0.68 * d, cx, cz, 0, h * 0.6, parts);
      // A little garden: hedge along one side, a flower patch at the corner.
      parts.push(box(0.5 * w, 0.12, 0.08, '#4f8a4a', cx, cz + 0.42 * d));
      parts.push(box(0.1, 0.06, 0.1, '#e8a0b8', cx + 0.34 * w, cz - 0.4 * d));
      break;
  }
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error(`could not build model for ${def.id}`);
  for (const p of parts) p.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

function cropField(parts: THREE.BufferGeometry[], def: BuildingDef, stage: number): void {
  const { w, d } = def.footprint;
  const kind = def.crop?.kind;
  const soil = kind === 'berries' ? '#694530' : kind === 'grain' ? '#906044' : '#765341';
  parts.push(box(w * 0.97, 0.045, d * 0.97, soil, w / 2, d / 2));
  const rows = d * (kind === 'berries' ? 2 : 3);
  for (let i = 0; i < rows; i++) {
    const z = ((i + 0.5) * d) / rows;
    parts.push(box(w * 0.89, 0.026, 0.12, shade(soil, 1.2), w / 2, z, 0.045));
    if (stage === 1) continue;
    if (kind === 'grain') {
      const h = stage === 2 ? 0.07 : stage === 3 ? 0.17 : 0.26;
      const color = stage === 2 ? '#82ab51' : stage === 3 ? '#adba50' : '#edc958';
      parts.push(box(w * 0.9, h, stage === 4 ? 0.16 : 0.085, color, w / 2, z, 0.07));
      if (stage === 4) parts.push(box(w * 0.88, 0.04, 0.13, '#f5df83', w / 2, z, 0.29));
      continue;
    }
    const columns = w * (kind === 'berries' ? 2 : 3);
    for (let j = 0; j < columns; j++) {
      const x = ((j + 0.5) * w) / columns;
      const size = stage === 2 ? 0.08 : stage === 3 ? 0.19 : kind === 'berries' ? 0.32 : 0.25;
      const height = size * (kind === 'berries' ? 0.85 : 0.48);
      const color = kind === 'berries' ? '#42743c' : (j + i) % 2 ? '#78ac46' : '#4d923d';
      parts.push(box(size, height, size * 0.85, color, x, z, 0.072));
      if (stage === 4) {
        const fruit = kind === 'berries' ? '#c84467' : '#d99048';
        parts.push(box(0.071, 0.042, 0.064, fruit, x + 0.065, z - 0.042, height + 0.057));
      }
    }
  }
}

export function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}
