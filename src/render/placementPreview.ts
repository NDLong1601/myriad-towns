import * as THREE from 'three';
import { previewColors } from '@/ui/palette';
import type { BuildingDef } from '@/sim/catalog';
import { buildingGeometry } from './buildingModels';
import { lotFinish } from '@/render/visualPalette';
import type { FloatingOrigin } from './floatingOrigin';

const MAX_TILES = 4096;
const MAX_MARKERS = 256;

export interface PreviewTiles {
  /** Tiles covered by the ghost(s): green when valid, red when not. */
  footprint: { x: number; z: number; ok: boolean }[];
  /** Tiles the building would affect (its emits). */
  affects: { x: number; z: number }[];
  /** Tiles its requirements look at. */
  checks: { x: number; z: number }[];
  /** Buildings counted by requirements: good (helps) or bad (blocks). */
  markers: { x: number; z: number; good: boolean }[];
}

/** Ghost building, radius overlays and markers for placement and inspection. */
export class PlacementPreview {
  readonly group = new THREE.Group();
  private ghost: THREE.Mesh;
  private ghostMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
  });
  private footprint: THREE.InstancedMesh;
  private affects: THREE.InstancedMesh;
  private checks: THREE.InstancedMesh;
  private markers: THREE.InstancedMesh;
  private readonly m = new THREE.Matrix4();
  private readonly c = new THREE.Color();
  private ghostDef: BuildingDef | null = null;
  private ghostAt = { x: 0, z: 0 };

  constructor(
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
  ) {
    this.group.name = 'preview';
    const tile = new THREE.PlaneGeometry(0.94, 0.94);
    tile.rotateX(-Math.PI / 2);
    const overlay = (color: string, opacity: number, n: number): THREE.InstancedMesh => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -2;
      const mesh = new THREE.InstancedMesh(tile, mat, n);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      return mesh;
    };
    this.checks = overlay('#f2c94c', 0.22, MAX_TILES);
    this.affects = overlay('#4aa3df', 0.32, MAX_TILES);
    this.footprint = overlay('#ffffff', 0.55, 512);
    this.footprint.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(512 * 3), 3);
    const marker = new THREE.OctahedronGeometry(0.22);
    this.markers = new THREE.InstancedMesh(
      marker,
      new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      MAX_MARKERS,
    );
    this.markers.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_MARKERS * 3),
      3,
    );
    this.markers.count = 0;
    this.markers.frustumCulled = false;
    this.ghost = new THREE.Mesh(new THREE.BufferGeometry(), this.ghostMat);
    this.ghost.visible = false;
    this.ghost.renderOrder = 3;
    this.group.add(this.checks, this.affects, this.footprint, this.markers, this.ghost);
    origin.onShift(() => this.placeGhost());
  }

  /** Show a ghost of `def` with its corner at (x, z), tinted by validity. */
  setGhost(def: BuildingDef | null, x = 0, z = 0, ok = true): void {
    this.ghostDef = def;
    this.ghostAt = { x, z };
    this.ghost.visible = def !== null;
    if (!def) return;
    this.ghost.geometry = buildingGeometry(def);
    this.ghostMat.color.copy(lotFinish(def.id, x, z));
    if (!ok) this.ghostMat.color.multiply(this.c.set(previewColors().ghostBad));
    this.placeGhost();
  }

  private placeGhost(): void {
    if (!this.ghostDef) return;
    const { x, z } = this.ghostAt;
    const p = this.origin.toLocal(x, z);
    this.ghost.position.set(p.x, this.heightAt(x, z) + 0.02, p.z);
  }

  setTiles(t: PreviewTiles): void {
    this.fill(this.checks, t.checks, 0.03);
    this.fill(this.affects, t.affects, 0.04);
    this.fill(this.footprint, t.footprint, 0.05, (i) =>
      this.footprint.setColorAt(
        i,
        this.c.set(t.footprint[i]?.ok ? previewColors().ok : previewColors().bad),
      ),
    );
    const n = Math.min(t.markers.length, MAX_MARKERS);
    for (let i = 0; i < n; i++) {
      const mk = t.markers[i] as { x: number; z: number; good: boolean };
      const p = this.origin.toLocal(mk.x + 0.5, mk.z + 0.5);
      this.m.makeTranslation(p.x, this.heightAt(mk.x, mk.z) + 1.9, p.z);
      this.markers.setMatrixAt(i, this.m);
      this.markers.setColorAt(i, this.c.set(mk.good ? '#3ddc84' : '#ff5252'));
    }
    this.markers.count = n;
    this.markers.instanceMatrix.needsUpdate = true;
    if (this.markers.instanceColor) this.markers.instanceColor.needsUpdate = true;
  }

  clear(): void {
    this.setGhost(null);
    this.setTiles({ footprint: [], affects: [], checks: [], markers: [] });
  }

  private fill(
    mesh: THREE.InstancedMesh,
    tiles: readonly { x: number; z: number }[],
    lift: number,
    each?: (i: number) => void,
  ): void {
    const n = Math.min(tiles.length, mesh.instanceMatrix.count);
    for (let i = 0; i < n; i++) {
      const t = tiles[i] as { x: number; z: number };
      const p = this.origin.toLocal(t.x + 0.5, t.z + 0.5);
      this.m.makeTranslation(p.x, this.heightAt(t.x, t.z) + lift, p.z);
      mesh.setMatrixAt(i, this.m);
      each?.(i);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}
