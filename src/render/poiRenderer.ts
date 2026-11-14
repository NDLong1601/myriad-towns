import * as THREE from 'three';
import { tileToChunk } from '@/core/coords';
import type { Poi, PoiStore } from '@/sim/poi';
import type { FloatingOrigin } from './floatingOrigin';

const MAX = 512;
const UNEXPLORED = new THREE.Color('#e2b33c');
const EXPLORED = new THREE.Color('#7d7a73');

/**
 * Ruins markers: a stone obelisk per POI in the chunks around the camera, gold until explored.
 * Rebuilt when the camera enters another chunk or a POI is explored.
 */
export class PoiRenderer {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh;
  private chunk = { cx: Number.NaN, cz: Number.NaN };
  private readonly m = new THREE.Matrix4();
  private shown: Poi[] = [];

  constructor(
    private readonly pois: PoiStore,
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
    private readonly radiusChunks: number,
  ) {
    this.group.name = 'pois';
    const pillar = new THREE.CylinderGeometry(0.12, 0.2, 1.1, 5);
    pillar.translate(0.5, 0.55, 0.5);
    const base = new THREE.BoxGeometry(0.7, 0.12, 0.7);
    base.translate(0.5, 0.06, 0.5);
    const geo = mergeTwo(pillar, base);
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
    pois.on(() => this.rebuild());
    origin.onShift(() => this.rebuild());
  }

  /** POI at a tile among those shown, for hover info. */
  at(x: number, z: number): Poi | undefined {
    return this.shown.find((p) => p.x === x && p.z === z);
  }

  update(wx: number, wz: number): void {
    const c = tileToChunk(Math.floor(wx), Math.floor(wz));
    if (c.cx === this.chunk.cx && c.cz === this.chunk.cz) return;
    this.chunk = c;
    this.rebuild();
  }

  private rebuild(): void {
    if (Number.isNaN(this.chunk.cx)) return;
    this.shown = this.pois.around(this.chunk.cx, this.chunk.cz, this.radiusChunks).slice(0, MAX);
    this.shown.forEach((p, i) => {
      const l = this.origin.toLocal(p.x, p.z);
      this.m.makeTranslation(l.x, this.heightAt(p.x, p.z), l.z);
      this.mesh.setMatrixAt(i, this.m);
      this.mesh.setColorAt(i, this.pois.isExplored(p.key) ? EXPLORED : UNEXPLORED);
    });
    this.mesh.count = this.shown.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

function mergeTwo(a: THREE.BufferGeometry, b: THREE.BufferGeometry): THREE.BufferGeometry {
  const ga = a.toNonIndexed();
  const gb = b.toNonIndexed();
  const pos = new Float32Array([
    ...(ga.getAttribute('position').array as Float32Array),
    ...(gb.getAttribute('position').array as Float32Array),
  ]);
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.computeVertexNormals();
  return out;
}
