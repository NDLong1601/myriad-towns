import * as THREE from 'three';
import type { TownStore } from '@/sim/towns';
import type { FloatingOrigin } from './floatingOrigin';

const SEGMENTS = 128;

/**
 * Territory borders: one line loop per town, following the ground. Rebuilt when a town is
 * founded or removed, when a border grows by a tile, or when the floating origin shifts.
 */
export class TerritoryRenderer {
  readonly group = new THREE.Group();
  private readonly mat = new THREE.LineBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  private drawnRadius = new Map<number, number>();

  constructor(
    private readonly towns: TownStore,
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
  ) {
    this.group.name = 'territories';
    towns.on(() => this.sync(false));
    origin.onShift(() => this.sync(true));
    this.sync(true);
  }

  private sync(force: boolean): void {
    const towns = this.towns.all();
    const changed =
      force ||
      towns.length !== this.drawnRadius.size ||
      towns.some(
        (t) => Math.abs((this.drawnRadius.get(t.id) ?? -99) - this.towns.radiusOf(t)) >= 1,
      );
    if (!changed) return;
    for (const c of [...this.group.children]) {
      (c as THREE.LineLoop).geometry.dispose();
      this.group.remove(c);
    }
    this.drawnRadius.clear();
    for (const t of towns) {
      const r = this.towns.radiusOf(t);
      const pos = new Float32Array(SEGMENTS * 3);
      for (let i = 0; i < SEGMENTS; i++) {
        const a = (i / SEGMENTS) * Math.PI * 2;
        const x = t.x + Math.cos(a) * r;
        const z = t.z + Math.sin(a) * r;
        const l = this.origin.toLocal(x, z);
        pos[i * 3] = l.x;
        pos[i * 3 + 1] = this.heightAt(Math.floor(x), Math.floor(z)) + 0.08;
        pos[i * 3 + 2] = l.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const line = new THREE.LineLoop(geo, this.mat);
      line.frustumCulled = false;
      this.group.add(line);
      this.drawnRadius.set(t.id, r);
    }
  }
}
