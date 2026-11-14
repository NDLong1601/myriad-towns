import * as THREE from 'three';
import type { City, PlacedBuilding } from '@/sim/city';
import { buildingGeometry } from './buildingModels';
import type { FloatingOrigin } from './floatingOrigin';

interface Batch {
  mesh: THREE.InstancedMesh;
  uids: number[];
}

/**
 * Draws all placed buildings: one InstancedMesh per building type (one draw call each),
 * grown on demand. Instance matrices are relative to the floating origin.
 */
export class BuildingRenderer {
  readonly group = new THREE.Group();
  private readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private batches = new Map<string, Batch>();
  private where = new Map<number, { batch: Batch; index: number }>();
  private readonly m = new THREE.Matrix4();

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    /** Ground y at a world tile. */
    private readonly heightAt: (x: number, z: number) => number,
  ) {
    this.group.name = 'buildings';
    city.on((e) => {
      if (e.type === 'added') this.add(e.building);
      else if (e.type === 'removed') this.remove(e.building.uid);
    });
    for (const b of city.all()) this.add(b);
    origin.onShift(() => this.refreshAll());
  }

  get drawnCount(): number {
    return this.where.size;
  }

  private batchFor(defId: string): Batch {
    let b = this.batches.get(defId);
    if (!b) {
      b = { mesh: this.makeMesh(defId, 64), uids: [] };
      this.batches.set(defId, b);
      this.group.add(b.mesh);
    }
    return b;
  }

  private makeMesh(defId: string, capacity: number): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      buildingGeometry(this.city.catalog.get(defId)),
      this.material,
      capacity,
    );
    mesh.count = 0;
    mesh.castShadow = defId !== 'road';
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // instances span the whole map; bounding volumes are not updated
    mesh.name = `buildings:${defId}`;
    return mesh;
  }

  private add(b: PlacedBuilding): void {
    const batch = this.batchFor(b.def.id);
    if (batch.uids.length >= batch.mesh.instanceMatrix.count) this.grow(b.def.id, batch);
    const index = batch.uids.length;
    batch.uids.push(b.uid);
    batch.mesh.count = batch.uids.length;
    this.where.set(b.uid, { batch, index });
    this.writeMatrix(batch, index, b);
  }

  private remove(uid: number): void {
    const w = this.where.get(uid);
    if (!w) return;
    const { batch, index } = w;
    const last = batch.uids.length - 1;
    if (index !== last) {
      // Swap the last instance into the hole.
      const lastUid = batch.uids[last] as number;
      batch.mesh.getMatrixAt(last, this.m);
      batch.mesh.setMatrixAt(index, this.m);
      batch.uids[index] = lastUid;
      this.where.set(lastUid, { batch, index });
    }
    batch.uids.pop();
    batch.mesh.count = batch.uids.length;
    batch.mesh.instanceMatrix.needsUpdate = true;
    this.where.delete(uid);
  }

  private grow(defId: string, batch: Batch): void {
    const old = batch.mesh;
    const next = this.makeMesh(defId, old.instanceMatrix.count * 2);
    next.instanceMatrix.array.set(old.instanceMatrix.array);
    next.count = old.count;
    this.group.remove(old);
    old.dispose();
    batch.mesh = next;
    this.group.add(next);
  }

  private writeMatrix(batch: Batch, index: number, b: PlacedBuilding): void {
    const p = this.origin.toLocal(b.x, b.z);
    this.m.makeTranslation(p.x, this.heightAt(b.x, b.z), p.z);
    batch.mesh.setMatrixAt(index, this.m);
    batch.mesh.instanceMatrix.needsUpdate = true;
  }

  private refreshAll(): void {
    for (const batch of this.batches.values()) {
      batch.uids.forEach((uid, i) => {
        const b = this.city.get(uid);
        if (b) this.writeMatrix(batch, i, b);
      });
    }
  }

  dispose(): void {
    for (const b of this.batches.values()) b.mesh.dispose();
    this.material.dispose();
  }
}
