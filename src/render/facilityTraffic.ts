import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AirTraffic } from '@/render/airTraffic';
import { angleBetween } from '@/render/flightPath';
import type { City, PlacedBuilding } from '@/sim/city';
import type { Simulation } from '@/sim/simulation';
import { waterRoute } from '@/sim/waterRoutes';
import { TileFlag } from '@/world/biomes';
import { box } from './buildingModels';
import type { FloatingOrigin } from './floatingOrigin';

type Kind = 'train' | 'boat' | 'plane' | 'ship' | 'ferry';
type SurfaceKind = Exclude<Kind, 'plane'>;
interface Point {
  x: number;
  y: number;
  z: number;
}
interface Service {
  building: PlacedBuilding;
  kind: SurfaceKind;
  route?: Point[];
  phase: number;
  synced?: boolean;
}

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const FACILITIES = new Map<string, SurfaceKind>([
  ['rail_station', 'train'],
  ['fishing_harbor', 'boat'],
  ['fishing_dock', 'boat'],
  ['cargo_port', 'ship'],
  ['ferry_pier', 'ferry'],
]);
const SPEED: Record<SurfaceKind, number> = { train: 3.2, boat: 1, ship: 1.4, ferry: 1.8 };

function vehicle(kind: Kind): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  switch (kind) {
    case 'train':
      parts.push(box(0.72, 0.12, 0.42, '#29383e', 0, 0, 0.035));
      parts.push(box(0.68, 0.26, 0.38, '#b64c39', 0, 0, 0.14));
      parts.push(box(0.32, 0.17, 0.41, '#3a5965', -0.08, 0, 0.39));
      parts.push(box(0.47, 0.32, 0.38, '#d2b66f', -0.63, 0, 0.06));
      break;
    case 'boat':
      parts.push(box(0.73, 0.15, 0.43, '#895847', -0.05, 0, -0.03));
      parts.push(box(0.28, 0.21, 0.32, '#e1d6b8', -0.12, 0, 0.12));
      parts.push(box(0.03, 0.31, 0.03, '#65564c', 0.04, 0, 0.15));
      break;
    case 'ship':
      parts.push(box(1.2, 0.22, 0.52, '#2b383f', -0.05, 0, 0));
      parts.push(box(0.28, 0.28, 0.42, '#eceff1', -0.42, 0, 0.2));
      parts.push(box(0.06, 0.16, 0.06, '#b71c1c', -0.48, 0, 0.38));
      parts.push(box(0.32, 0.2, 0.36, '#1565c0', 0.12, 0, 0.16));
      parts.push(box(0.28, 0.2, 0.34, '#c62828', -0.08, 0, 0.16));
      break;
    case 'ferry':
      parts.push(box(0.95, 0.18, 0.48, '#37474f', 0, 0, 0));
      parts.push(box(0.65, 0.18, 0.38, '#eceff1', 0, 0, 0.14));
      parts.push(box(0.24, 0.16, 0.28, '#263238', 0.15, 0, 0.26));
      break;
    case 'plane':
      parts.push(box(0.9, 0.15, 0.17, '#eae4d6', 0, 0, 0.04));
      parts.push(box(0.23, 0.055, 1.15, '#d49a46', -0.03, 0, 0.07));
      parts.push(box(0.23, 0.09, 0.16, '#587586', 0.21, 0, 0.17));
      parts.push(box(0.14, 0.18, 0.06, '#d49a46', -0.38, 0, 0.14));
      break;
  }
  const geometry = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  if (!geometry) throw new Error(`could not build ${kind}`);
  return geometry;
}

/** Surface routes stay near their facilities. Route geometry is refreshed after construction. */
export class FacilityTraffic {
  readonly group = new THREE.Group();
  private readonly services = new Map<number, Service>();
  private readonly meshes: Record<Kind, THREE.InstancedMesh>;
  private readonly matrix = new THREE.Matrix4();
  private readonly airTraffic: AirTraffic;
  private refreshIn = 0;
  private readonly nearby: Service[] = [];

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    private readonly groundY: (x: number, z: number) => number,
    private readonly capacity: number,
    private readonly navigation?: Pick<Simulation, 'voyageRouteOf' | 'voyagePhaseOf'>,
  ) {
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    const make = (kind: Kind): THREE.InstancedMesh => {
      const mesh = new THREE.InstancedMesh(vehicle(kind), material, capacity);
      mesh.name = kind;
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(mesh);
      return mesh;
    };
    this.meshes = {
      train: make('train'),
      boat: make('boat'),
      plane: make('plane'),
      ship: make('ship'),
      ferry: make('ferry'),
    };
    this.airTraffic = new AirTraffic(city, origin, groundY, this.meshes.plane);
    for (const b of city.all()) this.add(b);
    city.on((e) => {
      if (e.type === 'added' || e.type === 'removed') {
        if (e.type === 'added') this.add(e.building);
        else this.services.delete(e.building.uid);
        this.refreshIn = 0;
        const changed = e.building;
        if (changed.def.id === 'rail_track' || changed.def.visual.shape === 'bridge') {
          for (const service of this.services.values()) {
            const { building, kind } = service;
            if (
              (changed.def.id === 'rail_track' ? kind === 'train' : kind !== 'train') &&
              Math.abs(changed.x - building.x) <= 32 &&
              Math.abs(changed.z - building.z) <= 32
            ) {
              delete service.route;
              service.phase = 0;
              service.synced = false;
            }
          }
        }
      }
      if (e.type === 'status') this.refreshIn = 0;
    });
  }

  private add(building: PlacedBuilding): void {
    const voyage = building.def.voyage;
    const kind = voyage
      ? voyage.kind === 'cargo'
        ? 'ship'
        : 'boat'
      : FACILITIES.get(building.def.id);
    if (kind) this.services.set(building.uid, { building, kind, phase: 0 });
  }

  private route(service: Service): Point[] {
    const { building: b, kind } = service;
    const { w, d } = b.def.footprint;
    if (b.def.voyage) {
      const route =
        this.navigation?.voyageRouteOf(b.uid) ??
        waterRoute(this.city.terrain, b, b.def.voyage.range);
      return route.map(({ x, z }) => ({ x: x + 0.5, z: z + 0.5, y: this.groundY(x, z) + 0.1 }));
    }
    const isWater = kind === 'boat' || kind === 'ship' || kind === 'ferry';
    const suitable = (x: number, z: number): boolean => {
      const tile = this.city.at(x, z);
      if (kind === 'train') return tile?.def.id === 'rail_track';
      if (isWater) {
        return (
          (!tile || tile.def.visual.shape === 'bridge') &&
          Boolean(this.city.terrain.tile(x, z).flags & TileFlag.Water)
        );
      }
      return false;
    };
    const points: Point[] = [];
    const limit = kind === 'train' ? 25 : kind === 'ship' ? 40 : kind === 'ferry' ? 30 : 13;
    for (let z = b.z - 1; z < b.z + d + 1; z++) {
      for (let x = b.x - 1; x < b.x + w + 1; x++) {
        const outsideX = x < b.x || x >= b.x + w;
        const outsideZ = z < b.z || z >= b.z + d;
        if (outsideX === outsideZ || !suitable(x, z)) continue;
        const path = this.follow(x, z, limit, suitable);
        if (path.length > points.length) {
          points.length = 0;
          points.push(...path);
        }
      }
    }
    return points.length >= (kind === 'train' ? 3 : 2) ? points : [];
  }

  private follow(
    x: number,
    z: number,
    limit: number,
    suitable: (x: number, z: number) => boolean,
  ): Point[] {
    const points: Point[] = [];
    const seen = new Set<string>();
    const y = this.groundY(x, z);
    while (points.length < limit) {
      points.push({ x: x + 0.5, y: y + 0.1, z: z + 0.5 });
      seen.add(`${x},${z}`);
      const next = DIRECTIONS.find(([dx, dz]) => {
        const nx = x + dx;
        const nz = z + dz;
        return !seen.has(`${nx},${nz}`) && suitable(nx, nz) && this.groundY(nx, nz) === y;
      });
      if (!next) break;
      x += next[0];
      z += next[1];
    }
    return points;
  }

  update(dt: number, cam: { x: number; z: number }, enabled: boolean, paused: boolean): void {
    const { train, boat, plane, ship, ferry } = this.meshes;
    train.count = boat.count = plane.count = ship.count = ferry.count = 0;
    if (!enabled) {
      this.refreshIn = 0;
      return;
    }
    this.refreshIn -= dt;
    if (this.refreshIn <= 0) {
      this.refreshIn = 0.4;
      this.nearby.length = 0;
      for (const service of this.services.values()) {
        const b = service.building;
        if (Math.abs(b.x - cam.x) < 52 && Math.abs(b.z - cam.z) < 52 && this.city.isActive(b.uid))
          this.nearby.push(service);
      }
    }
    for (const service of this.nearby) {
      const mesh = this.meshes[service.kind];
      if (mesh.count >= this.capacity) continue;
      const route = (service.route ??= this.route(service));
      if (route.length < 2) continue;
      const end = route.length - 1;
      const period = end * 2;
      if (service.building.def.voyage && this.navigation) {
        const target = this.navigation.voyagePhaseOf(service.building.uid) * period;
        if (!service.synced) {
          service.phase = target;
          service.synced = true;
        } else if (!paused) {
          const delta = ((target - service.phase + 1.5 * period) % period) - period / 2;
          service.phase = (service.phase + delta * (1 - Math.exp(-dt * 7)) + period) % period;
        }
      } else if (!paused) service.phase = (service.phase + dt * SPEED[service.kind]) % period;
      this.pose(route, service.phase, service.kind === 'train');
      mesh.setMatrixAt(mesh.count++, this.matrix);
    }
    this.airTraffic.update(dt, cam, paused);
    if (train.count) train.instanceMatrix.needsUpdate = true;
    if (boat.count) boat.instanceMatrix.needsUpdate = true;
    if (plane.count) plane.instanceMatrix.needsUpdate = true;
    if (ship.count) ship.instanceMatrix.needsUpdate = true;
    if (ferry.count) ferry.instanceMatrix.needsUpdate = true;
  }

  private pose(route: readonly Point[], phase: number, train: boolean): void {
    const end = route.length - 1;
    const outbound = phase < end;
    let distance = outbound ? phase : 2 * end - phase;
    const atStart = distance < end / 2;
    const edgeDistance = atStart ? distance : end - distance;
    const turnaround = 0.42;
    if (edgeDistance < turnaround) {
      const t = edgeDistance / turnaround;
      const eased = turnaround * t * t * (2 - t);
      distance = atStart ? eased : end - eased;
    }
    const index = Math.min(end - 1, Math.floor(distance));
    const a = route[index]!;
    const b = route[index + 1]!;
    const f = distance - index;
    const radius = 0.24;
    const joint =
      f < radius && index > 0 ? index : f > 1 - radius && index + 1 < end ? index + 1 : -1;
    let x = a.x + (b.x - a.x) * f;
    let y = a.y + (b.y - a.y) * f;
    let z = a.z + (b.z - a.z) * f;
    let yaw = Math.atan2(b.z - a.z, b.x - a.x);
    if (joint !== -1) {
      const before = route[joint - 1]!;
      const corner = route[joint]!;
      const after = route[joint + 1]!;
      const t = (distance - joint + radius) / (2 * radius);
      const u = 1 - t;
      x = corner.x + radius * (u * u * (before.x - corner.x) + t * t * (after.x - corner.x));
      y = corner.y + radius * (u * u * (before.y - corner.y) + t * t * (after.y - corner.y));
      z = corner.z + radius * (u * u * (before.z - corner.z) + t * t * (after.z - corner.z));
      yaw = Math.atan2(
        u * (corner.z - before.z) + t * (after.z - corner.z),
        u * (corner.x - before.x) + t * (after.x - corner.x),
      );
    }
    if (!train) {
      if (edgeDistance < turnaround) {
        const incoming = atStart ? yaw + Math.PI : yaw;
        const toward = atStart ? yaw : yaw + Math.PI;
        const after = atStart === outbound;
        const t = (1 + ((after ? 1 : -1) * edgeDistance) / turnaround) / 2;
        yaw = incoming + angleBetween(incoming, toward) * t * t * (3 - 2 * t);
      } else if (!outbound) yaw += Math.PI;
    }
    this.matrix.makeRotationY(-yaw);
    this.matrix.setPosition(x - this.origin.x, y, z - this.origin.z);
  }
}
