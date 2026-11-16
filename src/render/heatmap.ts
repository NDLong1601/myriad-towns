import * as THREE from 'three';
import type { City } from '@/sim/city';
import { FIELD_SCALE, fieldIndex } from '@/sim/fields';
import { Resource } from '@/world/biomes';
import type { FloatingOrigin } from './floatingOrigin';

/** Tiles drawn around the camera target in each direction. */
const RADIUS = 40;
const SIDE = RADIUS * 2 + 1;
/** Colour-blind-safe sequential ramp (viridis stops), low → high. */
const RAMP = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'].map((c) => new THREE.Color(c));

export const DEPOSIT_COLORS = {
  [Resource.Stone]: '#ebebdf',
  [Resource.Clay]: '#ffb24a',
  [Resource.Iron]: '#f27083',
  [Resource.Coal]: '#242630',
  [Resource.FertileSoil]: '#5cca61',
} satisfies Record<Exclude<Resource, typeof Resource.None>, string>;

/**
 * Heatmap of one local field (water access, pollution…) over the tiles around the camera.
 * One instanced quad per non-zero tile; rebuilt when the field may have changed or the
 * camera moved a few tiles, never every frame.
 */
export class HeatmapOverlay {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh;
  private field: string | null = null;
  private dirty = false;
  private center = { x: Number.NaN, z: Number.NaN };
  private readonly m = new THREE.Matrix4();
  private readonly c = new THREE.Color();
  /** Largest value in the last rebuild, for the legend. */
  maxValue = 0;
  private listeners: (() => void)[] = [];

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
  ) {
    this.group.name = 'heatmap';
    const tile = new THREE.PlaneGeometry(1, 1);
    tile.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    this.mesh = new THREE.InstancedMesh(tile, mat, SIDE * SIDE);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(SIDE * SIDE * 3),
      3,
    );
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.group.add(this.mesh);
    city.on((e) => {
      if (e.type === 'added' || e.type === 'removed' || e.type === 'status') this.dirty = true;
    });
    origin.onShift(() => (this.dirty = true));
  }

  get current(): string | null {
    return this.field;
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  /** Show a field, or hide the overlay with null. */
  set(field: string | null): void {
    this.field = field;
    this.mesh.visible = field !== null;
    const material = this.mesh.material as THREE.MeshBasicMaterial;
    const deposits = field === 'resources';
    material.opacity = deposits ? 0.73 : 0.55;
    material.polygonOffset = !deposits;
    this.dirty = true;
    this.center = { x: Number.NaN, z: Number.NaN };
    for (const l of this.listeners) l();
  }

  /** Call once per frame with the camera target (world tiles). Cheap unless a rebuild is due. */
  update(wx: number, wz: number): void {
    if (this.field === null) return;
    const cx = Math.round(wx);
    const cz = Math.round(wz);
    const moved = !(Math.abs(cx - this.center.x) < 6 && Math.abs(cz - this.center.z) < 6);
    if (!this.dirty && !moved) return;
    this.dirty = false;
    this.center = { x: cx, z: cz };
    this.rebuild(cx, cz);
  }

  private rebuild(cx: number, cz: number): void {
    if (this.field === 'resources') {
      let n = 0;
      for (let z = cz - RADIUS; z <= cz + RADIUS; z++) {
        for (let x = cx - RADIUS; x <= cx + RADIUS; x++) {
          const s = this.city.terrain.tile(x, z);
          if (s.resource === Resource.None) continue;
          const p = this.origin.toLocal(x + 0.5, z + 0.5);
          this.m.makeTranslation(p.x, this.heightAt(x, z) + 0.015, p.z);
          this.mesh.setMatrixAt(n, this.m);
          this.c.set(DEPOSIT_COLORS[s.resource]);
          this.mesh.setColorAt(n, this.c);
          n++;
        }
      }
      this.maxValue = 1;
      this.mesh.count = n;
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
      for (const l of this.listeners) l();
      return;
    }

    const fi = fieldIndex(this.field as string);
    const fields = this.city.fields;
    let max = 0;
    for (let z = cz - RADIUS; z <= cz + RADIUS; z++) {
      for (let x = cx - RADIUS; x <= cx + RADIUS; x++) {
        max = Math.max(max, fields.raw(x, z, fi));
      }
    }
    this.maxValue = max / FIELD_SCALE;
    let n = 0;
    if (max > 0) {
      for (let z = cz - RADIUS; z <= cz + RADIUS; z++) {
        for (let x = cx - RADIUS; x <= cx + RADIUS; x++) {
          const v = fields.raw(x, z, fi);
          if (v <= 0) continue;
          const p = this.origin.toLocal(x + 0.5, z + 0.5);
          this.m.makeTranslation(p.x, this.heightAt(x, z) + 0.04, p.z);
          this.mesh.setMatrixAt(n, this.m);
          this.mesh.setColorAt(n, ramp(v / max, this.c));
          n++;
        }
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    for (const l of this.listeners) l();
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Colour for t in [0, 1] along the ramp. */
export function ramp(t: number, out = new THREE.Color()): THREE.Color {
  const x = Math.min(1, Math.max(0, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return out.copy(RAMP[i] as THREE.Color).lerp(RAMP[i + 1] as THREE.Color, x - i);
}
