import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BuildingDef } from '@/sim/catalog';

/**
 * Procedural low-poly models built from a building's `visual` block, until real models
 * arrive in M6. Colours are baked as vertex colours so every building shares one material.
 * Geometry origin: the footprint's min corner on the ground; +x = width, +z = depth.
 */
const cache = new Map<string, THREE.BufferGeometry>();

export function buildingGeometry(def: BuildingDef): THREE.BufferGeometry {
  let g = cache.get(def.id);
  if (!g) {
    g = makeGeometry(def);
    cache.set(def.id, g);
  }
  return g;
}

function part(
  geo: THREE.BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute('uv');
  return g;
}

/** Box resting on y=0, centred on (x, z). */
function box(
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  z: number,
  y = 0,
): THREE.BufferGeometry {
  return part(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z);
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

function makeGeometry(def: BuildingDef): THREE.BufferGeometry {
  const { w, d } = def.footprint;
  const v = def.visual;
  const h = v.height ?? 0.6;
  const color = v.color ?? '#d8d0c0';
  const roof = v.roof ?? shade(color, 0.7);
  const cx = w / 2;
  const cz = d / 2;
  const parts: THREE.BufferGeometry[] = [];
  switch (v.shape) {
    case 'road':
      parts.push(box(1, h, 1, color, cx, cz));
      break;
    case 'field': {
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
      break;
    case 'block':
      parts.push(box(0.86 * w, h * 0.75, 0.86 * d, color, cx, cz));
      parts.push(box(0.9 * w, 0.08, 0.9 * d, roof, cx, cz, h * 0.75));
      parts.push(box(0.15, h * 0.4, 0.15, shade(roof, 0.8), cx + 0.2 * w, cz - 0.2 * d, h * 0.75));
      break;
    case 'hall':
      parts.push(box(0.88 * w, h * 0.65, 0.88 * d, color, cx, cz));
      parts.push(gable(0.92 * w, h * 0.5, 0.94 * d, roof, cx, cz, h * 0.65));
      break;
    case 'house':
    default:
      parts.push(box(0.68 * w, h * 0.6, 0.68 * d, color, cx, cz));
      parts.push(pyramid(0.8 * w, h * 0.55, 0.8 * d, roof, cx, cz, h * 0.6));
      break;
  }
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error(`could not build model for ${def.id}`);
  for (const p of parts) p.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}
