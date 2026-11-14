import type * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box } from './buildingModels';
import type { AgentKind } from './trafficPlan';

/**
 * Tiny low-poly people and vehicles. Local +x is forward, y = 0 is the ground, and the origin
 * is the middle of the footprint. Body colours are light so a per-instance tint can recolour them;
 * wheels, windows and skin stay dark or fixed.
 */
const cache = new Map<AgentKind, THREE.BufferGeometry>();

export function agentGeometry(kind: AgentKind): THREE.BufferGeometry {
  let g = cache.get(kind);
  if (!g) {
    g = build(kind);
    cache.set(kind, g);
  }
  return g;
}

function wheels(
  parts: THREE.BufferGeometry[],
  xs: number[],
  z: number,
  r: number,
  color = '#2b2b2b',
): void {
  for (const x of xs)
    for (const side of [-1, 1]) parts.push(box(r * 1.6, r * 2, 0.04, color, x, side * z));
}

function build(kind: AgentKind): THREE.BufferGeometry {
  const p: THREE.BufferGeometry[] = [];
  switch (kind) {
    case 'pedestrian':
      for (const side of [-1, 1]) p.push(box(0.05, 0.1, 0.03, '#3f3f48', 0, side * 0.025)); // legs
      p.push(box(0.07, 0.11, 0.1, '#e6e6e6', 0, 0, 0.1)); // torso (tinted)
      p.push(box(0.065, 0.065, 0.065, '#f0c8a0', 0, 0, 0.21)); // head
      break;
    case 'handcart':
      p.push(box(0.26, 0.05, 0.18, '#b08860', 0, 0, 0.07));
      p.push(box(0.26, 0.07, 0.02, '#8a6a44', 0, 0.09, 0.1));
      p.push(box(0.26, 0.07, 0.02, '#8a6a44', 0, -0.09, 0.1));
      p.push(box(0.16, 0.025, 0.025, '#6b4a2b', 0.2, 0, 0.1)); // handle
      wheels(p, [0], 0.105, 0.06, '#5a4630');
      break;
    case 'horsecart':
      p.push(box(0.3, 0.06, 0.2, '#e8d9b5', -0.14, 0, 0.09)); // cart bed (tinted)
      p.push(box(0.3, 0.08, 0.02, '#c9b78f', -0.14, 0.1, 0.12));
      p.push(box(0.3, 0.08, 0.02, '#c9b78f', -0.14, -0.1, 0.12));
      wheels(p, [-0.22, -0.06], 0.115, 0.07, '#5a4630');
      p.push(box(0.2, 0.1, 0.08, '#8a5a34', 0.2, 0, 0.1)); // horse body
      p.push(box(0.07, 0.08, 0.05, '#8a5a34', 0.32, 0, 0.17)); // head
      for (const lx of [0.13, 0.27])
        for (const s of [-1, 1]) p.push(box(0.03, 0.1, 0.03, '#5c3a1f', lx, s * 0.025));
      break;
    case 'car':
      p.push(box(0.34, 0.09, 0.17, '#f2f2f2', 0, 0, 0.05)); // body (tinted)
      p.push(box(0.17, 0.08, 0.15, '#f7f7f7', -0.02, 0, 0.14)); // cabin
      p.push(box(0.172, 0.05, 0.152, '#2c3e50', -0.02, 0, 0.155)); // windows
      wheels(p, [-0.11, 0.11], 0.09, 0.045);
      p.push(box(0.02, 0.025, 0.04, '#ffe9a8', 0.17, 0.05, 0.08)); // headlights
      p.push(box(0.02, 0.025, 0.04, '#ffe9a8', 0.17, -0.05, 0.08));
      break;
    case 'bus':
      p.push(box(0.7, 0.17, 0.2, '#f2f2f2', 0, 0, 0.05));
      p.push(box(0.702, 0.06, 0.202, '#2c3e50', 0, 0, 0.14)); // window band
      p.push(box(0.7, 0.025, 0.2, '#d9d9d9', 0, 0, 0.22)); // roof
      wheels(p, [-0.22, 0.22], 0.105, 0.05);
      break;
  }
  const merged = mergeGeometries(p, false);
  if (!merged) throw new Error(`no model for ${kind}`);
  for (const g of p) g.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}
