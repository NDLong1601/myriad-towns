import * as THREE from 'three';
import type { BuildingDef } from '@/sim/catalog';
import type { City, PlacedBuilding } from '@/sim/city';
import { ROAD_E, ROAD_N, ROAD_S, ROAD_W, buildingGeometry } from './buildingModels';
import type { FloatingOrigin } from './floatingOrigin';

/** Roads connect to bridges, while rail only connects to rail. */
function network(def: BuildingDef): 'road' | 'rail' | undefined {
  if (def.id === 'rail_track') return 'rail';
  if (def.visual.shape === 'road' || def.visual.shape === 'bridge') return 'road';
  return undefined;
}

const WHITE = new THREE.Color(1, 1, 1);
/** Abandoned buildings are drawn dark and desaturated. */
const ABANDONED = new THREE.Color(0.45, 0.42, 0.4);
/** Buildings with a pending decline get a warm warning tint. */
export const WARNING_TINT = new THREE.Color(1.25, 0.85, 0.55);

/** Length of the "pop" when a building is placed or upgraded, seconds. */
const POP_SECONDS = 0.35;
/** More adds than this in one frame (loading, bulk tools) skip the animation. */
const POP_MAX_PER_FRAME = 48;

/** Overshoots past 1 and settles back: the "pop" curve. */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = Math.min(1, Math.max(0, t)) - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}

interface Batch {
  mesh: THREE.InstancedMesh;
  uids: number[];
  defId: string;
  /** Road connection mask (0 for everything else). */
  variant: number;
}

/** Colour of lit windows and lamps at night. */
const LIT_COLOR = new THREE.Color(1.0, 0.55, 0.18);

/**
 * Draws all placed buildings: one InstancedMesh per building type (one draw call each),
 * grown on demand. Instance matrices are relative to the floating origin.
 */
export class BuildingRenderer {
  readonly group = new THREE.Group();
  private readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly nightUniform = { value: 0 };
  private batches = new Map<string, Batch>();
  private where = new Map<number, { batch: Batch; index: number }>();
  private readonly m = new THREE.Matrix4();
  private readonly c = new THREE.Color();
  private tints = new Map<number, THREE.Color>();
  /** uid -> seconds since its pop started. */
  private pops = new Map<number, number>();
  private readonly crops = new Set<number>();
  private addsThisFrame = 0;
  /** Off for tests and screenshots (?anim=0). */
  animate = true;

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    /** Ground y at a world tile. */
    private readonly heightAt: (x: number, z: number) => number,
    private readonly cropStage?: (uid: number) => number,
  ) {
    this.group.name = 'buildings';
    this.patchMaterial();
    city.on((e) => {
      if (e.type === 'added') {
        this.add(e.building);
        this.retileAround(e.building);
      } else if (e.type === 'removed') {
        this.remove(e.building.uid);
        this.retileAround(e.building);
      } else if (e.type === 'status') this.setTint(e.building.uid, e.active ? null : ABANDONED);
    });
    for (const b of city.all()) this.add(b);
    origin.onShift(() => this.refreshAll());
  }

  /**
   * Windows and lamps are plain vertices with a `glow` attribute; by night the shader adds
   * a warm emissive term to them. Abandoned buildings (dark instance colour) stay unlit.
   */
  private patchMaterial(): void {
    const night = this.nightUniform;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uNight = night;
      shader.uniforms.uLit = { value: LIT_COLOR };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float glow;\nvarying float vGlow;',
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
#ifdef USE_INSTANCING_COLOR
  vGlow = glow * step(2.0, instanceColor.r + instanceColor.g + instanceColor.b);
#else
  vGlow = glow;
#endif`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uNight;\nuniform vec3 uLit;\nvarying float vGlow;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uLit * vGlow * uNight * 1.3;',
        );
    };
    this.material.customProgramCacheKey = () => 'buildings-night';
  }

  /** 0 by day … 1 at night: how brightly windows and lamps glow. */
  setNight(n: number): void {
    this.nightUniform.value = Math.min(1, Math.max(0, n));
  }

  /** Multiplies a building's colours (null = normal). Survives upgrades (same uid). */
  setTint(uid: number, color: THREE.ColorRepresentation | null): void {
    if (color === null) this.tints.delete(uid);
    else this.tints.set(uid, new THREE.Color(color));
    const w = this.where.get(uid);
    if (w) this.writeColor(w.batch, w.index, uid);
  }

  /** Road connection mask a building is drawn with (0 for non-roads or unknown uids). */
  variantOf(uid: number): number {
    return this.where.get(uid)?.batch.variant ?? 0;
  }

  get drawnCount(): number {
    return this.where.size;
  }

  /** Roads connect to roads on their four sides. */
  private roadMask(b: PlacedBuilding): number {
    const type = network(b.def);
    if (!type) return 0;
    const isRoad = (x: number, z: number): boolean => {
      const n = this.city.at(x, z);
      return n !== undefined && network(n.def) === type;
    };
    return (
      (isRoad(b.x + 1, b.z) ? ROAD_E : 0) |
      (isRoad(b.x - 1, b.z) ? ROAD_W : 0) |
      (isRoad(b.x, b.z + 1) ? ROAD_S : 0) |
      (isRoad(b.x, b.z - 1) ? ROAD_N : 0)
    );
  }

  /** After a road appears or disappears, its road neighbours may change shape. */
  private retileAround(b: PlacedBuilding): void {
    const type = network(b.def);
    if (!type) return;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const n = this.city.at(b.x + dx, b.z + dz);
      if (!n || network(n.def) !== type) continue;
      const w = this.where.get(n.uid);
      const mask = this.roadMask(n);
      if (!w || w.batch.variant === mask) continue;
      this.detach(n.uid);
      this.attach(n, mask, false);
    }
  }

  private batchFor(defId: string, variant: number): Batch {
    const key = `${defId}#${variant}`;
    let b = this.batches.get(key);
    if (!b) {
      b = { mesh: this.makeMesh(defId, variant, 64), uids: [], defId, variant };
      this.batches.set(key, b);
      this.group.add(b.mesh);
    }
    return b;
  }

  private makeMesh(defId: string, variant: number, capacity: number): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      buildingGeometry(this.city.catalog.get(defId), variant),
      this.material,
      capacity,
    );
    mesh.count = 0;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * 3).fill(1),
      3,
    );
    mesh.castShadow = defId !== 'road';
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // instances span the whole map; bounding volumes are not updated
    mesh.name = `buildings:${defId}:${variant}`;
    return mesh;
  }

  private add(b: PlacedBuilding): void {
    if (b.def.crop) this.crops.add(b.uid);
    this.attach(b, b.def.crop ? (this.cropStage?.(b.uid) ?? 1) : this.roadMask(b), true);
  }

  updateCrops(): void {
    for (const uid of this.crops) {
      const stage = this.cropStage?.(uid);
      if (!stage || this.variantOf(uid) === stage) continue;
      const plot = this.city.get(uid);
      if (!plot) continue;
      this.detach(uid);
      this.attach(plot, stage, false);
    }
  }

  private attach(b: PlacedBuilding, variant: number, pop: boolean): void {
    const batch = this.batchFor(b.def.id, variant);
    if (batch.uids.length >= batch.mesh.instanceMatrix.count) this.grow(batch);
    const index = batch.uids.length;
    batch.uids.push(b.uid);
    batch.mesh.count = batch.uids.length;
    this.where.set(b.uid, { batch, index });
    if (pop && this.animate && ++this.addsThisFrame <= POP_MAX_PER_FRAME) this.pops.set(b.uid, 0);
    this.writeMatrix(batch, index, b);
    this.writeColor(batch, index, b.uid);
  }

  private remove(uid: number): void {
    this.crops.delete(uid);
    // A replace (upgrade/decline) re-adds the same uid right away; keep its tint then.
    if (!this.city.get(uid)) {
      this.tints.delete(uid);
      this.pops.delete(uid);
    }
    this.detach(uid);
  }

  private detach(uid: number): void {
    const w = this.where.get(uid);
    if (!w) return;
    const { batch, index } = w;
    const last = batch.uids.length - 1;
    if (index !== last) {
      // Swap the last instance into the hole.
      const lastUid = batch.uids[last] as number;
      batch.mesh.getMatrixAt(last, this.m);
      batch.mesh.setMatrixAt(index, this.m);
      batch.mesh.getColorAt(last, this.c);
      batch.mesh.setColorAt(index, this.c);
      if (batch.mesh.instanceColor) batch.mesh.instanceColor.needsUpdate = true;
      batch.uids[index] = lastUid;
      this.where.set(lastUid, { batch, index });
    }
    batch.uids.pop();
    batch.mesh.count = batch.uids.length;
    batch.mesh.instanceMatrix.needsUpdate = true;
    this.where.delete(uid);
  }

  private grow(batch: Batch): void {
    const old = batch.mesh;
    const next = this.makeMesh(batch.defId, batch.variant, old.instanceMatrix.count * 2);
    next.instanceMatrix.array.set(old.instanceMatrix.array);
    if (old.instanceColor && next.instanceColor)
      next.instanceColor.array.set(old.instanceColor.array);
    next.count = old.count;
    this.group.remove(old);
    old.dispose();
    batch.mesh = next;
    this.group.add(next);
  }

  /** Advances the pop animations; call once per rendered frame. */
  update(dt: number): void {
    this.addsThisFrame = 0;
    if (this.pops.size === 0) return;
    for (const [uid, t] of this.pops) {
      const next = t + dt;
      if (next >= POP_SECONDS) this.pops.delete(uid);
      else this.pops.set(uid, next);
      const w = this.where.get(uid);
      const b = this.city.get(uid);
      if (w && b) this.writeMatrix(w.batch, w.index, b);
    }
  }

  /** Buildings still popping (debug/tests). */
  get popping(): number {
    return this.pops.size;
  }

  private writeMatrix(batch: Batch, index: number, b: PlacedBuilding): void {
    const p = this.origin.toLocal(b.x, b.z);
    const y = this.heightAt(b.x, b.z);
    const t = this.pops.get(b.uid);
    if (t === undefined) {
      this.m.makeTranslation(p.x, y, p.z);
    } else {
      // Scale about the footprint centre: T(p + c - s*c) * S(s).
      const s = Math.max(0.05, easeOutBack(t / POP_SECONDS));
      const cx = b.def.footprint.w / 2;
      const cz = b.def.footprint.d / 2;
      this.m.makeScale(s, s, s).setPosition(p.x + cx - s * cx, y, p.z + cz - s * cz);
    }
    batch.mesh.setMatrixAt(index, this.m);
    batch.mesh.instanceMatrix.needsUpdate = true;
  }

  private writeColor(batch: Batch, index: number, uid: number): void {
    batch.mesh.setColorAt(index, this.tints.get(uid) ?? WHITE);
    if (batch.mesh.instanceColor) batch.mesh.instanceColor.needsUpdate = true;
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
