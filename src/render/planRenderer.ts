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
    const byDef = new Map<string, { x: number; z: number }[]>();
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
      let mesh = this.meshes.get(id);
      if (!mesh || mesh.instanceMatrix.count < list.length) {
        if (mesh) {
          this.group.remove(mesh);
          mesh.geometry.dispose();
          mesh.dispose();
        }
        mesh = new THREE.InstancedMesh(
          buildingGeometry(this.catalog.get(id)),
          this.material,
          Math.max(16, list.length * 2),
        );
        mesh.frustumCulled = false;
        mesh.renderOrder = 3;
        this.meshes.set(id, mesh);
        this.group.add(mesh);
      }
      list.forEach((p, i) => {
        const l = this.origin.toLocal(p.x, p.z);
        this.m.makeTranslation(l.x, this.heightAt(p.x, p.z) + 0.02, l.z);
        mesh.setMatrixAt(i, this.m);
      });
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
