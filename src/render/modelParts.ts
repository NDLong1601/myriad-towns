import * as THREE from 'three';

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

/** Four-sided pyramid roof sitting on top of a w×d box. */
export function pyramid(
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
export function gable(
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
  g.rotateX(-Math.PI / 2); // ridge up
  // A unit triangle (radius 1) spans 1.5 tall, √3 wide; scale it to the roof.
  g.scale(1, h / 1.5, d / Math.sqrt(3));
  return part(g, color, x, y + h / 3, z);
}

export function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}
