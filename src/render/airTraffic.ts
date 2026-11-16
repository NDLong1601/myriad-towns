import * as THREE from 'three';
import type { City, PlacedBuilding } from '@/sim/city';
import { angleBetween, FlightPath, type FlightPose, type Runway } from '@/render/flightPath';
import type { FloatingOrigin } from '@/render/floatingOrigin';

const RUNWAY_WAIT = 4;
const DRAW_REACH = 52;
const AIRFIELD = 'airfield';

interface Flight {
  outbound: FlightPath;
  inbound?: FlightPath;
  start: number;
  initialYaw: number;
  a: number;
  b?: number;
}

function cycle(flight: Flight): number {
  return (
    RUNWAY_WAIT +
    flight.outbound.duration +
    (flight.inbound ? RUNWAY_WAIT + flight.inbound.duration : 0)
  );
}

function sample(flight: Flight, elapsed: number, pose: FlightPose): void {
  const age = elapsed % cycle(flight);
  const inboundAt = RUNWAY_WAIT + flight.outbound.duration;
  const returning = flight.inbound && age >= inboundAt;
  const leg = returning ? flight.inbound! : flight.outbound;
  const t = returning ? age - inboundAt : age;
  if (t >= RUNWAY_WAIT) {
    leg.sample(t - RUNWAY_WAIT, pose);
    return;
  }
  const parked = leg.from;
  const incoming = returning
    ? flight.outbound.arrivalYaw
    : elapsed < cycle(flight)
      ? flight.initialYaw
      : (flight.inbound ?? flight.outbound).arrivalYaw;
  const turn = Math.max(0, Math.min(1, (t - 0.8) / 2.2));
  pose.x = parked.x;
  pose.z = parked.z;
  pose.y = parked.y;
  pose.yaw = incoming + angleBetween(incoming, leg.departureYaw) * turn * turn * (3 - 2 * turn);
  pose.pitch = 0;
}

/** One shuttle per pair of active airfields, with a local circuit for any unpaired strip. */
export class AirTraffic {
  private readonly airfields = new Map<number, PlacedBuilding>();
  private flights: Flight[] = [];
  private readonly finishing: { flight: Flight; until: number }[] = [];
  private readonly pose: FlightPose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  private readonly rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly matrix = new THREE.Matrix4();
  private dirty = true;
  private time = 0;

  constructor(
    private readonly city: City,
    private readonly origin: FloatingOrigin,
    private readonly groundY: (x: number, z: number) => number,
    private readonly mesh: THREE.InstancedMesh,
  ) {
    for (const b of city.all()) if (b.def.id === AIRFIELD) this.airfields.set(b.uid, b);
    city.on((e) => {
      if (!('building' in e) || e.building.def.id !== AIRFIELD) return;
      if (e.type === 'added') this.airfields.set(e.building.uid, e.building);
      else if (e.type === 'removed') this.airfields.delete(e.building.uid);
      this.dirty = true;
    });
  }

  private runway(b: PlacedBuilding): Runway {
    const x = b.x + b.def.footprint.w / 2;
    // Match the centre line of the runway model.
    const z = b.z + b.def.footprint.d * 0.53;
    return { x, z, y: this.groundY(x, z) + 0.11, halfRoll: b.def.footprint.w * 0.36 };
  }

  private rebuild(): void {
    this.dirty = false;
    const ready = [...this.airfields.values()]
      .filter((b) => this.city.isActive(b.uid))
      .sort((a, b) => a.uid - b.uid);
    const taken = new Set<number>();
    const previous = this.flights.slice();
    for (const { flight } of this.finishing) previous.push(flight);
    this.flights = [];
    const active = new Set(ready.map((b) => b.uid));
    // A newly built strip can join the network without interrupting an existing shuttle.
    for (const flight of previous) {
      if (flight.b === undefined || !active.has(flight.a) || !active.has(flight.b)) continue;
      this.flights.push(flight);
      taken.add(flight.a);
      taken.add(flight.b);
    }
    for (const a of ready) {
      if (taken.has(a.uid)) continue;
      taken.add(a.uid);
      let closest: PlacedBuilding | undefined;
      let squared = Infinity;
      for (const b of ready) {
        if (taken.has(b.uid)) continue;
        const d = (b.x - a.x) ** 2 + (b.z - a.z) ** 2;
        if (d >= squared) continue;
        squared = d;
        closest = b;
      }
      if (closest) taken.add(closest.uid);
      const same = closest ? undefined : previous.find((f) => f.a === a.uid && f.b === undefined);
      this.flights.push(same ?? this.create(a, closest, previous));
    }
    // Undoing a new airfield can put its already-flying solo circuit back into service.
    for (let i = this.finishing.length - 1; i >= 0; i--) {
      if (this.flights.includes(this.finishing[i]!.flight)) this.finishing.splice(i, 1);
    }
  }

  private create(first: PlacedBuilding, second: PlacedBuilding | undefined, old: Flight[]): Flight {
    const local =
      second &&
      old.find(
        (flight) => flight.b === undefined && (flight.a === first.uid || flight.a === second.uid),
      );
    let a = first;
    let b = second;
    if (local?.a === second?.uid && second) {
      a = second;
      b = first;
    }
    const from = this.runway(a);
    const to = b ? this.runway(b) : from;
    const direction = to.x < from.x ? -1 : 1;
    const outbound = new FlightPath(from, to, direction, !b);
    let start = this.time;
    let initialYaw = outbound.departureYaw;
    if (local) {
      const elapsed = Math.max(0, this.time - local.start);
      const age = elapsed % cycle(local);
      if (age >= RUNWAY_WAIT) {
        // Let the old circuit finish its landing before the new shuttle takes over.
        start += cycle(local) - age;
        initialYaw = local.outbound.arrivalYaw;
        if (!this.finishing.some(({ flight }) => flight === local))
          this.finishing.push({ flight: local, until: start });
      } else {
        sample(local, elapsed, this.pose);
        initialYaw = this.pose.yaw;
      }
    }
    const flight = { outbound, start, initialYaw, a: a.uid };
    return b
      ? { ...flight, b: b.uid, inbound: new FlightPath(to, from, direction === 1 ? -1 : 1, false) }
      : flight;
  }

  update(dt: number, cam: { x: number; z: number }, paused: boolean): void {
    if (!paused) this.time += dt;
    if (this.dirty) this.rebuild();
    for (let i = this.finishing.length - 1; i >= 0; i--) {
      const { flight, until } = this.finishing[i]!;
      if (this.time >= until || !this.city.isActive(flight.a)) {
        this.finishing.splice(i, 1);
      } else {
        this.draw(flight, cam);
      }
    }
    for (const flight of this.flights) {
      if (this.mesh.count >= this.mesh.instanceMatrix.count) break;
      if (this.time >= flight.start) this.draw(flight, cam);
    }
  }

  private draw(flight: Flight, cam: { x: number; z: number }): void {
    if (this.mesh.count >= this.mesh.instanceMatrix.count) return;
    const { outbound: a, inbound: b } = flight;
    if (
      cam.x < Math.min(a.minX, b?.minX ?? a.minX) - DRAW_REACH ||
      cam.x > Math.max(a.maxX, b?.maxX ?? a.maxX) + DRAW_REACH ||
      cam.z < Math.min(a.minZ, b?.minZ ?? a.minZ) - DRAW_REACH ||
      cam.z > Math.max(a.maxZ, b?.maxZ ?? a.maxZ) + DRAW_REACH
    )
      return;
    const p = this.pose;
    sample(flight, this.time - flight.start, p);
    if (Math.abs(p.x - cam.x) > DRAW_REACH || Math.abs(p.z - cam.z) > DRAW_REACH) return;
    this.rotation.set(0, -p.yaw, p.pitch);
    this.matrix.makeRotationFromEuler(this.rotation);
    this.matrix.setPosition(p.x - this.origin.x, p.y, p.z - this.origin.z);
    this.mesh.setMatrixAt(this.mesh.count++, this.matrix);
  }
}
