import * as THREE from 'three';
import { type BuildingDef, isRoadDef } from '@/sim/catalog';
import type { City } from '@/sim/city';
import type { FloatingOrigin } from './floatingOrigin';
import { agentGeometry } from './vehicleModels';
import {
  type AgentKind,
  SPEED,
  type TrafficPlan,
  VEHICLE_KINDS,
  pickVehicle,
  trafficPlan,
} from './trafficPlan';

interface Agent {
  kind: AgentKind;
  /** Tile being left and tile being entered. */
  ax: number;
  az: number;
  bx: number;
  bz: number;
  /** Progress along the current step, 0..1. */
  t: number;
  /** Smoothed heading (radians, 0 = +x). */
  yaw: number;
  speed: number;
  /** Sideways offset from the tile centre (right-hand traffic; people keep to the verge). */
  lane: number;
  phase: number;
  tint: THREE.Color;
  /** Seconds spent waiting behind another vehicle. */
  wait: number;
}

const TINTS = ['#ffffff', '#f4d6d6', '#d6e4f4', '#e0f0d4', '#f4ecc8', '#e4d4f0', '#f0d8c0'].map(
  (c) => new THREE.Color(c),
);
const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const keyOf = (x: number, z: number): string => `${x},${z}`;

/**
 * People on the pavement and vehicles on the road, drawn as instanced meshes (one draw call per
 * kind). Purely visual: they follow road tiles, never touch the simulation, and only exist near
 * the camera, so the cost does not grow with the size of the map.
 */
export class TrafficRenderer {
  readonly group = new THREE.Group();
  /** Off for ?traffic=0 and the settings toggle. */
  enabled = true;
  private readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly meshes = new Map<AgentKind, THREE.InstancedMesh>();
  private readonly agents: Agent[] = [];
  private readonly roads: { x: number; z: number }[] = [];
  private readonly roadIndex = new Map<string, number>();
  private plan: TrafficPlan = trafficPlan(0, 0, 0);
  private spawnClock = 0;
  private dirtyColors = true;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly pos = new THREE.Vector3();
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly up = new THREE.Vector3(0, 1, 0);
  private rnd: () => number;

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    private readonly heightAt: (x: number, z: number) => number,
    /** Most agents drawn at once (lower on small devices). */
    private readonly max: number,
    rnd: () => number = Math.random,
  ) {
    this.rnd = rnd;
    this.group.name = 'traffic';
    for (const kind of ['pedestrian', ...VEHICLE_KINDS] as AgentKind[]) {
      const mesh = new THREE.InstancedMesh(agentGeometry(kind), this.material, Math.max(8, max));
      mesh.count = 0;
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(Math.max(8, max) * 3).fill(1),
        3,
      );
      mesh.frustumCulled = false;
      mesh.castShadow = kind !== 'pedestrian';
      mesh.name = `traffic:${kind}`;
      this.meshes.set(kind, mesh);
      this.group.add(mesh);
    }
    city.on((e) => {
      if (e.type === 'added' && isRoadDef(e.building.def)) this.addRoad(e.building.x, e.building.z);
      else if (e.type === 'removed' && isRoadDef(e.building.def))
        this.removeRoad(e.building.x, e.building.z);
    });
    for (const b of city.all()) if (isRoadDef(b.def)) this.addRoad(b.x, b.z);
  }

  private addRoad(x: number, z: number): void {
    const k = keyOf(x, z);
    if (this.roadIndex.has(k)) return;
    this.roadIndex.set(k, this.roads.length);
    this.roads.push({ x, z });
  }

  private removeRoad(x: number, z: number): void {
    const k = keyOf(x, z);
    const i = this.roadIndex.get(k);
    // A replace (paving) removes and re-adds the same tile; only forget it if no road remains.
    if (i === undefined || this.isRoad(x, z)) return;
    const last = this.roads.pop() as { x: number; z: number };
    if (i < this.roads.length) {
      this.roads[i] = last;
      this.roadIndex.set(keyOf(last.x, last.z), i);
    }
    this.roadIndex.delete(k);
  }

  private isRoad(x: number, z: number): boolean {
    const b = this.city.at(x, z);
    return b !== undefined && isRoadDef(b.def);
  }

  /** Counts for tests and the HUD. */
  get counts(): { pedestrians: number; vehicles: number } {
    let pedestrians = 0;
    for (const a of this.agents) if (a.kind === 'pedestrian') pedestrians++;
    return { pedestrians, vehicles: this.agents.length - pedestrians };
  }

  /** What the town currently asks for (for tests and the HUD). */
  get planned(): TrafficPlan {
    return this.plan;
  }

  /** Tiles agents are on (for tests). */
  tiles(): { kind: AgentKind; x: number; z: number }[] {
    return this.agents.map((a) => ({ kind: a.kind, x: a.ax, z: a.az }));
  }

  setPlan(plan: TrafficPlan): void {
    this.plan = plan;
  }

  /** Ground height of the road surface at a tile (bridges ride above the water). */
  private surface(x: number, z: number): number {
    const b = this.city.at(x, z);
    const def: BuildingDef | undefined = b?.def;
    const lift = def?.visual.shape === 'bridge' ? 0.14 : 0;
    return this.heightAt(x, z) + lift + (def?.visual.height ?? 0.07);
  }

  /**
   * Advances everyone by `dt` seconds (frozen in place while the game is `paused`, but still
   * populating the streets) and redraws.
   * `cam` is the camera target in tiles; `reach` how far from it agents are kept.
   */
  update(dt: number, cam: { x: number; z: number }, reach: number, paused = false): void {
    if (!this.enabled) {
      this.clear();
      return;
    }
    const maxD = reach + 12;
    // Remove agents that left the area or whose road was demolished.
    for (let i = this.agents.length - 1; i >= 0; i--) {
      const a = this.agents[i] as Agent;
      const far = Math.hypot(a.ax - cam.x, a.az - cam.z) > maxD;
      if (far || !this.isRoad(a.ax, a.az)) this.removeAgent(i);
    }
    this.spawn(dt, cam, reach);
    if (!paused && dt > 0) this.step(dt);
    this.draw();
  }

  private clear(): void {
    if (this.agents.length === 0) return;
    this.agents.length = 0;
    this.draw();
  }

  private removeAgent(i: number): void {
    const last = this.agents.pop() as Agent;
    if (i < this.agents.length) this.agents[i] = last;
    this.dirtyColors = true;
  }

  private spawn(dt: number, cam: { x: number; z: number }, reach: number): void {
    this.spawnClock += dt;
    // Spawn about a dozen per second so the street fills in instead of popping in all at once;
    // a slow frame catches up with a few at a time.
    if (this.spawnClock < 0.08 && this.agents.length > 0) return;
    const n = Math.min(6, Math.max(1, Math.floor(this.spawnClock / 0.08)));
    this.spawnClock = 0;
    for (let i = 0; i < n; i++) if (!this.spawnOne(cam, reach)) return;
  }

  /** Adds one agent if the plan wants more; false when nothing more is wanted or possible. */
  private spawnOne(cam: { x: number; z: number }, reach: number): boolean {
    let people = 0;
    for (const a of this.agents) if (a.kind === 'pedestrian') people++;
    const vehicles = this.agents.length - people;
    const wantPed = people < this.plan.pedestrians;
    const wantVeh = vehicles < this.plan.vehicles;
    if ((!wantPed && !wantVeh) || this.roads.length === 0) return false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const r = this.roads[Math.floor(this.rnd() * this.roads.length)] as { x: number; z: number };
      if (Math.hypot(r.x - cam.x, r.z - cam.z) > reach) continue;
      const kind: AgentKind | null =
        wantVeh && (!wantPed || this.rnd() < 0.4)
          ? pickVehicle(this.plan.weights, this.rnd())
          : wantPed
            ? 'pedestrian'
            : null;
      if (!kind) return false;
      if (this.addAgent(kind, r.x, r.z)) return true;
    }
    return false;
  }

  private neighbours(x: number, z: number, notX: number, notZ: number): [number, number][] {
    const out: [number, number][] = [];
    for (const [dx, dz] of DIRS) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx === notX && nz === notZ) continue;
      if (this.isRoad(nx, nz)) out.push([nx, nz]);
    }
    return out;
  }

  private addAgent(kind: AgentKind, x: number, z: number): boolean {
    const next = this.neighbours(x, z, Number.NaN, Number.NaN);
    if (next.length === 0) return false;
    const [bx, bz] = next[Math.floor(this.rnd() * next.length)] as [number, number];
    const cap = this.meshes.get(kind)?.instanceMatrix.count ?? 0;
    if (this.agents.filter((a) => a.kind === kind).length >= cap) return false;
    this.agents.push({
      kind,
      ax: x,
      az: z,
      bx,
      bz,
      t: 0,
      yaw: Math.atan2(bz - z, bx - x),
      speed: SPEED[kind] * (0.85 + this.rnd() * 0.3),
      lane: kind === 'pedestrian' ? 0.3 : 0.13,
      phase: this.rnd() * 6.28,
      tint: TINTS[Math.floor(this.rnd() * TINTS.length)] as THREE.Color,
      wait: 0,
    });
    this.dirtyColors = true;
    return true;
  }

  private step(dt: number): void {
    // Vehicles keep a tile apart: count who is where, and wait for a free tile ahead.
    const busy = new Map<string, number>();
    for (const a of this.agents)
      if (a.kind !== 'pedestrian')
        busy.set(keyOf(a.bx, a.bz), (busy.get(keyOf(a.bx, a.bz)) ?? 0) + 1);
    for (const a of this.agents) {
      a.phase += dt * a.speed * 7;
      if (a.kind !== 'pedestrian' && a.t < 0.15) {
        const ahead = busy.get(keyOf(a.bx, a.bz)) ?? 0;
        // Someone else is already entering that tile: wait a moment (at most 2 s).
        if (ahead > 1 && a.wait < 2) {
          a.wait += dt;
          continue;
        }
      }
      a.wait = 0;
      a.t += (a.speed * dt) / 1;
      if (a.t >= 1) {
        const px = a.ax;
        const pz = a.az;
        a.ax = a.bx;
        a.az = a.bz;
        a.t -= 1;
        const options = this.neighbours(a.ax, a.az, px, pz);
        if (options.length === 0) {
          // Dead end: turn around.
          a.bx = px;
          a.bz = pz;
        } else {
          // Prefer going straight on, otherwise any way out.
          const sx = a.ax + (a.ax - px);
          const sz = a.az + (a.az - pz);
          const straight = options.find(([x, z]) => x === sx && z === sz);
          const pick =
            straight && this.rnd() < 0.7
              ? straight
              : (options[Math.floor(this.rnd() * options.length)] as [number, number]);
          a.bx = pick[0];
          a.bz = pick[1];
        }
        if (!this.isRoad(a.bx, a.bz)) {
          a.bx = px;
          a.bz = pz;
        }
      }
      // Turn smoothly towards the direction of travel.
      const want = Math.atan2(a.bz - a.az, a.bx - a.ax);
      let d = want - a.yaw;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      a.yaw += d * Math.min(1, dt * 9);
    }
  }

  private draw(): void {
    const counts = new Map<AgentKind, number>();
    for (const a of this.agents) {
      const mesh = this.meshes.get(a.kind) as THREE.InstancedMesh;
      const i = counts.get(a.kind) ?? 0;
      counts.set(a.kind, i + 1);
      const x = a.ax + (a.bx - a.ax) * a.t + 0.5;
      const z = a.az + (a.bz - a.az) * a.t + 0.5;
      // Offset to the right of the heading, using the smoothed yaw so corners stay smooth.
      const rx = -Math.sin(a.yaw) * -a.lane;
      const rz = Math.cos(a.yaw) * -a.lane;
      const wx = x + rx;
      const wz = z + rz;
      const ya = this.surface(a.ax, a.az);
      const yb = this.surface(a.bx, a.bz);
      let y = ya + (yb - ya) * a.t;
      if (a.kind === 'pedestrian') y += Math.abs(Math.sin(a.phase)) * 0.025;
      const p = this.origin.toLocal(wx, wz);
      this.pos.set(p.x, y, p.z);
      this.q.setFromAxisAngle(this.up, -a.yaw);
      this.m.compose(this.pos, this.q, this.one);
      mesh.setMatrixAt(i, this.m);
      if (this.dirtyColors) mesh.setColorAt(i, a.tint);
    }
    for (const [kind, mesh] of this.meshes) {
      const n = counts.get(kind) ?? 0;
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (this.dirtyColors && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.dirtyColors = false;
  }

  dispose(): void {
    for (const m of this.meshes.values()) m.dispose();
    this.material.dispose();
  }
}
