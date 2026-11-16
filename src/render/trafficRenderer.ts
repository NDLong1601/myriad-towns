import * as THREE from 'three';
import { type BuildingDef, isRoadDef } from '@/sim/catalog';
import type { City } from '@/sim/city';
import { angleBetween } from '@/render/flightPath';
import type { FloatingOrigin } from './floatingOrigin';
import { BRIDGE_LIFT } from './buildingModels';
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
  targetKey: string;
  /** Previous and upcoming tiles, used to join the edges at a corner. */
  px: number;
  pz: number;
  cx: number;
  cz: number;
  /** Progress along the current step, 0..1. */
  t: number;
  /** Smoothed heading (radians, 0 = +x). */
  yaw: number;
  speed: number;
  cruiseSpeed: number;
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
  private readonly busy = new Map<string, number>();
  private readonly drawCounts = new Map<AgentKind, number>();
  private readonly nextX = new Int32Array(4);
  private readonly nextZ = new Int32Array(4);
  private plan: TrafficPlan = trafficPlan(0, 0, 0);
  private spawnClock = 0;
  private dirtyColors = true;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly pos = new THREE.Vector3();
  private readonly pathPose = { x: 0, z: 0, yaw: 0 };
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
    const lift = def?.visual.shape === 'bridge' ? BRIDGE_LIFT : 0;
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
      if (far || !this.isRoad(a.ax, a.az) || !this.isRoad(a.bx, a.bz)) this.removeAgent(i);
      else if (!this.isRoad(a.cx, a.cz)) this.chooseNext(a);
    }
    this.spawn(dt, cam, reach);
    if (!paused && dt > 0) this.step(Math.min(0.25, dt));
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

  private neighbours(x: number, z: number, notX: number, notZ: number): number {
    let count = 0;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx === notX && nz === notZ) continue;
      if (this.isRoad(nx, nz)) {
        this.nextX[count] = nx;
        this.nextZ[count++] = nz;
      }
    }
    return count;
  }

  private addAgent(kind: AgentKind, x: number, z: number): boolean {
    const next = this.neighbours(x, z, Number.NaN, Number.NaN);
    if (!next) return false;
    const pick = Math.floor(this.rnd() * next);
    const bx = this.nextX[pick]!;
    const bz = this.nextZ[pick]!;
    const cap = this.meshes.get(kind)?.instanceMatrix.count ?? 0;
    if (this.agents.filter((a) => a.kind === kind).length >= cap) return false;
    const agent: Agent = {
      kind,
      ax: x,
      az: z,
      bx,
      bz,
      targetKey: keyOf(bx, bz),
      px: x,
      pz: z,
      cx: bx,
      cz: bz,
      t: 0,
      yaw: Math.atan2(bz - z, bx - x),
      speed: kind === 'pedestrian' ? SPEED.pedestrian : 0,
      cruiseSpeed: SPEED[kind] * (0.85 + this.rnd() * 0.3),
      lane: kind === 'pedestrian' ? 0.3 : 0.13,
      phase: this.rnd() * 6.28,
      tint: TINTS[Math.floor(this.rnd() * TINTS.length)] as THREE.Color,
      wait: 0,
    };
    this.chooseNext(agent);
    this.agents.push(agent);
    this.dirtyColors = true;
    return true;
  }

  private chooseNext(a: Agent): void {
    const options = this.neighbours(a.bx, a.bz, a.ax, a.az);
    if (!options) {
      a.cx = a.ax;
      a.cz = a.az;
      return;
    }
    const sx = 2 * a.bx - a.ax;
    const sz = 2 * a.bz - a.az;
    let straight = -1;
    for (let i = 0; i < options; i++)
      if (this.nextX[i] === sx && this.nextZ[i] === sz) straight = i;
    const pick = straight >= 0 && this.rnd() < 0.7 ? straight : Math.floor(this.rnd() * options);
    a.cx = this.nextX[pick]!;
    a.cz = this.nextZ[pick]!;
  }

  private step(dt: number): void {
    // Vehicles keep a tile apart: count who is where, and wait for a free tile ahead.
    const busy = this.busy;
    busy.clear();
    for (const a of this.agents)
      if (a.kind !== 'pedestrian') busy.set(a.targetKey, (busy.get(a.targetKey) ?? 0) + 1);
    for (const a of this.agents) {
      const want = this.roadPose(a).yaw;
      const turn = angleBetween(a.yaw, want);
      const driving = a.kind !== 'pedestrian';
      const congested = driving && a.t <= 0.2 && (busy.get(a.targetKey) ?? 0) > 1;
      const blocked = congested && a.wait < 2;
      a.wait = congested ? a.wait + dt : 0;
      const heading = Math.atan2(a.bz - a.az, a.bx - a.ax);
      const nextHeading = Math.atan2(a.cz - a.bz, a.cx - a.bx);
      const upcoming =
        Math.max(0, (a.t - 0.55) / 0.45) * Math.abs(angleBetween(heading, nextHeading));
      const curve = Math.max(Math.abs(turn), upcoming);
      const desired = blocked ? 0 : a.cruiseSpeed * (driving ? 1 - (0.8 * curve) / Math.PI : 1);
      const previous = a.speed;
      const rate = desired < previous ? 14 : 4;
      a.speed += (desired - previous) * (1 - Math.exp(-dt * rate));
      const travel = (a.speed + previous) * 0.5 * dt;
      a.t = blocked ? Math.min(0.2, a.t + travel) : a.t + travel;
      a.phase += a.speed * dt * 7;
      a.yaw += turn * (1 - Math.exp(-dt * (driving ? 7 : 11)));
      if (a.t >= 1) {
        a.px = a.ax;
        a.pz = a.az;
        a.ax = a.bx;
        a.az = a.bz;
        a.bx = a.cx;
        a.bz = a.cz;
        a.targetKey = keyOf(a.bx, a.bz);
        a.t -= 1;
        this.chooseNext(a);
      }
    }
  }

  private roadPose(a: Agent): typeof this.pathPose {
    const out = this.pathPose;
    const radius = 0.24;
    if (a.t < radius && (a.px !== a.ax || a.pz !== a.az) && (a.px !== a.bx || a.pz !== a.bz)) {
      this.curve(a.px, a.pz, a.ax, a.az, a.bx, a.bz, (a.t + radius) / (2 * radius), radius);
    } else if (a.t > 1 - radius && (a.cx !== a.ax || a.cz !== a.az)) {
      this.curve(a.ax, a.az, a.bx, a.bz, a.cx, a.cz, (a.t - 1 + radius) / (2 * radius), radius);
    } else {
      out.x = a.ax + (a.bx - a.ax) * a.t + 0.5;
      out.z = a.az + (a.bz - a.az) * a.t + 0.5;
      out.yaw = Math.atan2(a.bz - a.az, a.bx - a.ax);
    }
    return out;
  }

  private curve(
    px: number,
    pz: number,
    x: number,
    z: number,
    nx: number,
    nz: number,
    t: number,
    r: number,
  ): void {
    const u = 1 - t;
    const out = this.pathPose;
    out.x = x + 0.5 + r * (u * u * (px - x) + t * t * (nx - x));
    out.z = z + 0.5 + r * (u * u * (pz - z) + t * t * (nz - z));
    out.yaw = Math.atan2(u * (z - pz) + t * (nz - z), u * (x - px) + t * (nx - x));
  }

  private draw(): void {
    const counts = this.drawCounts;
    counts.clear();
    for (const a of this.agents) {
      const mesh = this.meshes.get(a.kind) as THREE.InstancedMesh;
      const i = counts.get(a.kind) ?? 0;
      counts.set(a.kind, i + 1);
      const { x, z } = this.roadPose(a);
      // Offset to the right of the heading, using the smoothed yaw so corners stay smooth.
      const rx = -Math.sin(a.yaw) * -a.lane;
      const rz = Math.cos(a.yaw) * -a.lane;
      const wx = x + rx;
      const wz = z + rz;
      const ya = this.surface(a.ax, a.az);
      const yb = this.surface(a.bx, a.bz);
      let y = ya + (yb - ya) * a.t;
      if (a.kind === 'pedestrian') y += Math.abs(Math.sin(a.phase)) * 0.025;
      this.pos.set(wx - this.origin.x, y, wz - this.origin.z);
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
