import * as THREE from 'three';
import type { Catalog } from '@/sim/catalog';
import type { PlanStore } from '@/sim/plan';
import { buildingGeometry } from './buildingModels';
import type { FloatingOrigin } from './floatingOrigin';

/** Planned buildings as translucent blue ghosts. Rebuilt on change (plans are few). */
export class PlanRenderer {
  readonly group = new THREE.Group();
  private readonly material = new THREE.MeshLambertMaterial({
    color: '#9ecbff',
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  private meshes = new Map<string, THREE.InstancedMesh>();
  private readonly m = new THREE.Matrix4();

  constructor(
    private readonly plans: PlanStore,
    private readonly catalog: Catalog,
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
  ) {
    this.group.name = 'plans';
    plans.on(() => this.rebuild());
    origin.onShift(() => this.rebuild());
  }

  private rebuild(): void {
    const byDef = new Map<string, { x: number; z: number; rot?: number }[]>();
    for (const p of this.plans.all()) {
      let list = byDef.get(p.defId);
      if (!list) byDef.set(p.defId, (list = []));
      list.push(p);
    }
    for (const [id, mesh] of this.meshes) {
      if (!byDef.has(id)) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
        mesh.dispose();
        this.meshes.delete(id);
      }
    }
    for (const [id, list] of byDef) {
      const def = this.catalog.get(id);
      let mesh = this.meshes.get(id);
      if (!mesh || mesh.instanceMatrix.count < list.length) {
        if (mesh) {
          this.group.remove(mesh);
          mesh.geometry.dispose();
          mesh.dispose();
        }
        mesh = new THREE.InstancedMesh(
          buildingGeometry(def),
          this.material,
          Math.max(16, list.length * 2),
        );
        mesh.frustumCulled = false;
        mesh.renderOrder = 3;
        this.meshes.set(id, mesh);
        this.group.add(mesh);
      }
      list.forEach((p, i) => {
        const rot = p.rot ?? 0;
        const w0 = def.footprint.w;
        const d0 = def.footprint.d;
        const ox = rot === 1 ? d0 : rot === 2 ? w0 : 0;
        const oz = rot === 2 ? d0 : rot === 3 ? w0 : 0;
        const l = this.origin.toLocal(p.x, p.z);
        this.m
          .makeRotationY((-rot * Math.PI) / 2)
          .setPosition(l.x + ox, this.heightAt(p.x, p.z) + 0.02, l.z + oz);
        mesh.setMatrixAt(i, this.m);
      });
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
