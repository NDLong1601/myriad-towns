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

type RoadPoint = [x: number, z: number];
const ROAD_SIDES = [ROAD_E, ROAD_S, ROAD_W, ROAD_N] as const;

/** Clockwise outline, with bevels on outside corners and fillets where two legs meet. */
function roadOutline(mask: number, half: number): RoadPoint[] {
  const outline: RoadPoint[] = [];
  const corner = 0.05;
  for (const [i, flag] of ROAD_SIDES.entries()) {
    const forward = mask & flag;
    const next = mask & (ROAD_SIDES[(i + 1) % 4] as number);
    const points: RoadPoint[] = [[forward ? 0.5 : half, 0]];
    if (forward && next) {
      points.push(
        [0.5, half],
        [half + corner, half],
        [half + corner * 0.3, half + corner * 0.3],
        [half, half + corner],
        [half, 0.5],
      );
    } else if (forward) points.push([0.5, half]);
    else if (next) points.push([half, 0.5]);
    else points.push([half, half - corner], [half - corner, half]);
    for (const [x, z] of points) {
      if (i === 0) outline.push([x, z]);
      else if (i === 1) outline.push([-z, x]);
      else if (i === 2) outline.push([-x, -z]);
      else outline.push([z, -x]);
    }
  }
  return outline;
}

function isRoadSeam(ax: number, az: number, bx: number, bz: number): boolean {
  return (Math.abs(ax) === 0.5 && ax === bx) || (Math.abs(az) === 0.5 && az === bz);
}

function roadSurface(
  outline: readonly RoadPoint[],
  top: number,
  bottom: number,
  color: string,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const [ax, az] = outline[i] as RoadPoint;
    const [bx, bz] = outline[(i + 1) % outline.length] as RoadPoint;
    positions.push(0, top, 0, bx, top, bz, ax, top, az);
    if (!isRoadSeam(ax, az, bx, bz))
      positions.push(
        ax,
        bottom,
        az,
        ax,
        top,
        az,
        bx,
        top,
        bz,
        ax,
        bottom,
        az,
        bx,
        top,
        bz,
        bx,
        bottom,
        bz,
      );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return part(geometry, color, 0.5, 0, 0.5);
}

/** A raised curb or guardrail follows the edge but leaves connections open. */
function roadEdge(
  parts: THREE.BufferGeometry[],
  outline: readonly RoadPoint[],
  width: number,
  base: number,
  height: number,
  color: string,
): void {
  for (let i = 0; i < outline.length; i++) {
    const [ax, az] = outline[i] as RoadPoint;
    const [bx, bz] = outline[(i + 1) % outline.length] as RoadPoint;
    if (isRoadSeam(ax, az, bx, bz)) continue;
    const length = Math.hypot(bx - ax, bz - az);
    const beam = new THREE.BoxGeometry(length, height, width);
    beam.rotateY(-Math.atan2(bz - az, bx - ax));
    parts.push(part(beam, color, 0.5 + (ax + bx) / 2, base + height / 2, 0.5 + (az + bz) / 2));
  }
}

function streetLamp(
  parts: THREE.BufferGeometry[],
  height: number,
  tier: 'dirt' | 'stone' | 'brick',
): void {
  const x = 0.91;
  const z = 0.91;
  parts.push(box(0.12, height, 0.12, '#8c8c81', x, z));
  if (tier === 'dirt') {
    parts.push(box(0.042, 0.31, 0.042, '#594635', x, z, height));
    parts.push(box(0.095, 0.092, 0.095, '#d59d53', x, z, height + 0.31, 1));
    parts.push(box(0.115, 0.028, 0.115, '#694934', x, z, height + 0.402));
    return;
  }
  const brick = tier === 'brick';
  const pole = brick ? '#465b60' : '#374645';
  const top = height + (brick ? 0.79 : 0.61);
  parts.push(box(0.105, 0.065, 0.105, '#8c8c81', x, z, height));
  parts.push(box(0.033, top - height, 0.033, pole, x, z, height));
  if (brick) {
    parts.push(box(0.05, 0.038, 0.26, pole, x, z - 0.11, top - 0.025));
    parts.push(box(0.112, 0.036, 0.17, '#d1d8cc', x, z - 0.25, top));
    parts.push(box(0.096, 0.023, 0.145, '#fff0bd', x, z - 0.25, top - 0.024, 1));
  } else {
    parts.push(box(0.085, 0.111, 0.085, '#e5c488', x, z, top, 1));
    parts.push(box(0.108, 0.034, 0.108, pole, x, z, top + 0.111));
  }
}

function roadModel(parts: THREE.BufferGeometry[], def: BuildingDef, mask: number, h: number): void {
  const bridge = def.visual.shape === 'bridge';
  const paved = def.tags?.includes('paved');
  const brick = def.id === 'brick_road';
  const base = bridge ? BRIDGE_LIFT : 0;
  const top = base + h;
  const shoulder = roadOutline(mask, 0.43);
  const street = roadOutline(mask, 0.34);
  parts.push(
    roadSurface(shoulder, top - 0.013, base, bridge ? '#7b7970' : paved ? '#b9b7a7' : '#897458'),
    roadSurface(
      street,
      top,
      top - 0.014,
      bridge ? (paved ? '#767d80' : '#9e8a6b') : brick ? '#755b55' : paved ? '#656e70' : '#a18b69',
    ),
  );
  if (bridge) {
    roadEdge(parts, shoulder, 0.045, top + 0.13, 0.045, '#e9e5d7');
    roadEdge(parts, shoulder, 0.024, top + 0.053, 0.028, '#b5b9af');
    for (const x of [0.08, 0.92]) {
      for (const z of [0.08, 0.92]) {
        parts.push(box(0.055, 0.19, 0.055, '#a5a49b', x, z, top));
        parts.push(box(0.105, top + 0.22, 0.105, '#767569', x, z, -0.22));
      }
    }
  } else if (paved) {
    roadEdge(parts, street, 0.024, top - 0.004, 0.025, '#ddd9cc');
  }

  const connections = arms(mask);
  for (const [i, flag] of ROAD_SIDES.entries()) {
    if (!(mask & flag)) continue;
    const axisX = i % 2 === 0;
    const sign = i < 2 ? 1 : -1;
    const straight = connections === 2 && Boolean(mask & (ROAD_SIDES[(i + 2) % 4] as number));
    if (paved && !bridge) {
      for (const offset of [-0.387, 0.387]) {
        parts.push(
          box(
            axisX ? 0.016 : 0.077,
            0.003,
            axisX ? 0.077 : 0.016,
            '#969789',
            0.5 + (axisX ? sign * 0.46 : offset),
            0.5 + (axisX ? offset : sign * 0.46),
            top - 0.012,
          ),
        );
      }
    }
    if (paved && straight && i >= 2) continue;
    // Ruts meet at the middle of straights and stop short in junctions.
    const offsets = paved ? [0] : [-0.145, 0.145];
    const length = paved ? (straight ? 0.39 : 0.15) : straight ? 0.5 : 0.32;
    const center = paved ? (straight ? 0 : 0.31) : 0.5 - length / 2;
    for (const offset of offsets) {
      parts.push(
        box(
          axisX ? length : 0.028,
          0.004,
          axisX ? 0.028 : length,
          paved ? '#e5d6ad' : '#917a5e',
          0.5 + (axisX ? sign * center : offset),
          0.5 + (axisX ? offset : sign * center),
          top,
        ),
      );
    }
  }
  const bend = connections === 2 && mask !== (ROAD_E | ROAD_W) && mask !== (ROAD_N | ROAD_S);
  if (!bridge && (connections >= 3 || connections === 1 || (paved && bend)))
    streetLamp(parts, top, brick ? 'brick' : paved ? 'stone' : 'dirt');
}

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

function miningModel(
  parts: THREE.BufferGeometry[],
  def: BuildingDef,
  h: number,
  color: string,
): void {
  switch (def.id) {
    case 'quarry': {
      parts.push(box(0.94, 0.035, 0.94, '#a8a191', 0.5, 0.5));
      // Cut faces step up away from the open work floor.
      parts.push(box(0.89, h * 0.4, 0.46, shade(color, 0.75), 0.5, 0.27, 0.035));
      parts.push(box(0.88, h * 0.34, 0.32, color, 0.5, 0.2, 0.035 + h * 0.4));
      parts.push(box(0.87, h * 0.28, 0.19, shade(color, 1.6), 0.5, 0.14, 0.035 + h * 0.74));
      parts.push(box(0.16, h * 0.4, 0.24, shade(color, 0.9), 0.86, 0.58, 0.035));
      parts.push(box(0.15, 0.07, 0.14, '#d9d2bd', 0.31, 0.67, 0.035));
      parts.push(box(0.12, 0.12, 0.12, '#b9b29f', 0.19, 0.65, 0.035));
      parts.push(box(0.13, 0.065, 0.13, '#e4d9c3', 0.19, 0.8, 0.035));
      break;
    }
    case 'clay_pit': {
      // An elliptical cut with successively lower inside terraces.
      const ledge = (profile: [number, number][], tint: string): void => {
        const g = new THREE.LatheGeometry(
          profile.map(([r, y]) => new THREE.Vector2(r, y)),
          12,
        );
        g.scale(1, 1, 0.86);
        parts.push(part(g, tint, 0.5, 0, 0.48));
      };
      ledge(
        [
          [0.48, 0.015],
          [0.435, h * 0.76],
          [0.32, h * 0.76],
        ],
        shade(color, 1.37),
      );
      ledge(
        [
          [0.32, h * 0.76],
          [0.27, h * 0.51],
          [0.21, h * 0.51],
        ],
        color,
      );
      ledge(
        [
          [0.21, h * 0.51],
          [0.165, 0.024],
          [0.001, 0.024],
        ],
        shade(color, 0.55),
      );
      parts.push(box(0.28, 0.042, 0.11, '#947254', 0.48, 0.87, 0.015));
      break;
    }
    case 'iron_mine': {
      const steel = '#535e63';
      const deck = h * 1.46;
      parts.push(box(0.93, 0.05, 0.94, '#837c74', 0.5, 0.5));
      parts.push(box(0.42, 0.13, 0.4, '#282e32', 0.48, 0.44, 0.05));
      for (const x of [-1, 1]) {
        for (const z of [-1, 1]) {
          const foot = new THREE.Vector3(0.48 + x * 0.31, 0.05, 0.44 + z * 0.3);
          const top = new THREE.Vector3(0.48 + x * 0.108, deck, 0.44 + z * 0.12);
          const direction = top.clone().sub(foot);
          const beam = new THREE.BoxGeometry(0.07, direction.length(), 0.067);
          beam.applyQuaternion(
            new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction.normalize(),
            ),
          );
          const center = foot.add(top).multiplyScalar(0.5);
          parts.push(part(beam, steel, center.x, center.y, center.z));
        }
      }
      parts.push(box(0.39, 0.07, 0.37, '#969a94', 0.48, 0.44, deck - 0.04));
      const sheave = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12);
      sheave.rotateZ(Math.PI / 2);
      parts.push(part(sheave, '#ac6747', 0.48, deck + 0.12, 0.44));
      parts.push(box(0.38, 0.065, 0.065, steel, 0.48, 0.44, deck + 0.1));
      for (const x of [0.42, 0.54]) parts.push(box(0.026, 0.028, 0.39, '#b0ae9d', x, 0.75, 0.051));
      parts.push(box(0.2, 0.1, 0.17, color, 0.48, 0.81, 0.062));
      break;
    }
    default: {
      const { w, d } = def.footprint;
      const cx = w / 2;
      const cz = d / 2;
      parts.push(box(w * 0.85, h * 0.5, d * 0.85, shade(color, 0.85), cx, cz));
      parts.push(gable(w * 0.5, h * 0.8, d * 0.5, color, cx, cz, h * 0.5));
      parts.push(box(0.25, 0.25, 0.25, '#3a3a3a', cx + 0.25, cz + 0.25, h * 0.5));
    }
  }
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
    case 'bridge':
      roadModel(parts, def, variant, h);
      break;
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
      miningModel(parts, def, h, color);
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
