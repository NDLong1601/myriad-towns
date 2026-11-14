import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { City, PlacedBuilding } from '@/sim/city';
import { TileFlag } from '@/world/biomes';
import { box } from './buildingModels';
import type { FloatingOrigin } from './floatingOrigin';

type Kind = 'train' | 'boat' | 'plane';
interface Point {
  x: number;
  y: number;
  z: number;
}
interface Service {
  building: PlacedBuilding;
  kind: Kind;
  route?: Point[];
  phase: number;
}

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const FACILITIES = new Map<string, Kind>([
  ['rail_station', 'train'],
  ['fishing_harbor', 'boat'],
  ['fishing_dock', 'boat'],
  ['airfield', 'plane'],
]);
const SPEED: Record<Kind, number> = { train: 3.2, boat: 1, plane: 4.2 };

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

/** Visual routes stay near their facilities. Route geometry is refreshed after construction. */
export class FacilityTraffic {
  readonly group = new THREE.Group();
  private readonly services = new Map<number, Service>();
  private readonly meshes: Record<Kind, THREE.InstancedMesh>;
  private readonly matrix = new THREE.Matrix4();
  private refreshIn = 0;
  private readonly nearby: Service[] = [];

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    private readonly groundY: (x: number, z: number) => number,
    private readonly capacity: number,
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
    this.meshes = { train: make('train'), boat: make('boat'), plane: make('plane') };
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
              kind === (changed.def.id === 'rail_track' ? 'train' : 'boat') &&
              Math.abs(changed.x - building.x) <= 32 &&
              Math.abs(changed.z - building.z) <= 32
            ) {
              delete service.route;
              service.phase = 0;
            }
          }
        }
      }
      if (e.type === 'status') this.refreshIn = 0;
    });
  }

  private add(building: PlacedBuilding): void {
    const kind = FACILITIES.get(building.def.id);
    if (kind) this.services.set(building.uid, { building, kind, phase: 0 });
  }

  private route(service: Service): Point[] {
    const { building: b, kind } = service;
    const { w, d } = b.def.footprint;
    if (kind === 'plane') {
      const x = b.x + w / 2;
      const z = b.z + d / 2;
      const y = this.groundY(b.x, b.z);
      return [
        { x: x - 1.6, y: y + 0.11, z },
        { x: x + 1.6, y: y + 0.11, z },
        { x: x + 7, y: y + 3.5, z },
        { x: x + 7, y: y + 5, z: z + 8 },
        { x: x - 8, y: y + 5, z: z + 8 },
        { x: x - 8, y: y + 3.5, z },
      ];
    }

    const suitable = (x: number, z: number): boolean => {
      const tile = this.city.at(x, z);
      return kind === 'train'
        ? tile?.def.id === 'rail_track'
        : !tile && Boolean(this.city.terrain.tile(x, z).flags & TileFlag.Water);
    };
    const points: Point[] = [];
    for (let z = b.z - 1; z < b.z + d + 1; z++) {
      for (let x = b.x - 1; x < b.x + w + 1; x++) {
        const outsideX = x < b.x || x >= b.x + w;
        const outsideZ = z < b.z || z >= b.z + d;
        if (outsideX === outsideZ || !suitable(x, z)) continue;
        const path = this.follow(x, z, kind === 'train' ? 25 : 13, suitable);
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
    const { train, boat, plane } = this.meshes;
    train.count = boat.count = plane.count = 0;
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
      const loop = service.kind === 'plane';
      const end = route.length - 1;
      const period = loop ? route.length : end * 2;
      if (!paused) service.phase = (service.phase + dt * SPEED[service.kind]) % period;
      const segment = Math.floor(service.phase);
      const index = segment <= end || loop ? segment : period - segment;
      const next = loop ? (index + 1) % route.length : index + (segment < end ? 1 : -1);
      const a = route[index]!;
      const b = route[next]!;
      const f = service.phase - segment;
      const angle = Math.atan2(a.z - b.z, b.x - a.x);
      this.matrix.makeRotationY(angle);
      this.matrix.setPosition(
        a.x + (b.x - a.x) * f - this.origin.x,
        a.y + (b.y - a.y) * f,
        a.z + (b.z - a.z) * f - this.origin.z,
      );
      mesh.setMatrixAt(mesh.count++, this.matrix);
    }
    if (train.count) train.instanceMatrix.needsUpdate = true;
    if (boat.count) boat.instanceMatrix.needsUpdate = true;
    if (plane.count) plane.instanceMatrix.needsUpdate = true;
  }
}
