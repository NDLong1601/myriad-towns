import * as THREE from 'three';
import { CHUNK_SIZE, type ChunkKey, chunkKey } from '@/core/coords';
import type { ChunkData } from '@/world/chunk';
import type { MeshArrays } from '@/world/terrainMesh';
import type { FloatingOrigin } from './floatingOrigin';

/**
 * One merged mesh per chunk, all sharing a single vertex-coloured material.
 * Meshes are placed relative to the floating origin, so float32 vertex data stays small
 * no matter how far the player travels.
 */
export class TerrainRenderer {
  readonly group = new THREE.Group();
  private readonly material: THREE.MeshLambertMaterial;
  private meshes = new Map<ChunkKey, THREE.Mesh>();

  constructor(private readonly origin: FloatingOrigin) {
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.group.name = 'terrain';
    origin.onShift(() => this.reposition());
  }

  add(chunk: ChunkData, arrays: MeshArrays): void {
    const key = chunkKey(chunk.cx, chunk.cz);
    this.remove(key);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arrays.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(arrays.normals, 3, true));
    g.setAttribute('color', new THREE.BufferAttribute(arrays.colors, 3, true));
    g.setIndex(new THREE.BufferAttribute(arrays.indices, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    const mesh = new THREE.Mesh(g, this.material);
    mesh.name = `chunk ${chunk.cx},${chunk.cz}`;
    mesh.userData.cx = chunk.cx;
    mesh.userData.cz = chunk.cz;
    mesh.matrixAutoUpdate = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = false;
    this.place(mesh);
    this.meshes.set(key, mesh);
    this.group.add(mesh);
  }

  setVisible(key: ChunkKey, visible: boolean): void {
    const m = this.meshes.get(key);
    if (m) m.visible = visible;
  }

  isVisible(key: ChunkKey): boolean {
    return this.meshes.get(key)?.visible ?? false;
  }

  remove(key: ChunkKey): void {
    const m = this.meshes.get(key);
    if (!m) return;
    this.group.remove(m);
    m.geometry.dispose();
    this.meshes.delete(key);
  }

  get count(): number {
    return this.meshes.size;
  }

  private place(mesh: THREE.Mesh): void {
    const p = this.origin.toLocal(
      (mesh.userData.cx as number) * CHUNK_SIZE,
      (mesh.userData.cz as number) * CHUNK_SIZE,
    );
    mesh.position.set(p.x, 0, p.z);
    mesh.updateMatrix();
  }

  private reposition(): void {
    for (const m of this.meshes.values()) this.place(m);
  }

  dispose(): void {
    for (const key of [...this.meshes.keys()]) this.remove(key);
    this.material.dispose();
  }
}
