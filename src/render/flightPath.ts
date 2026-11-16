interface Point {
  x: number;
  y: number;
  z: number;
}

export interface Runway extends Point {
  halfRoll: number;
}

export interface FlightPose extends Point {
  yaw: number;
  pitch: number;
}

interface Sample extends FlightPose {
  distance: number;
}

const FLIGHT_SPEED = 3.4;
const RAMP_SECONDS = 2;
const CURVE_STEPS = 40;

export function angleBetween(from: number, to: number): number {
  const d = to - from;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

/** A leg starts and ends on the runway, with horizontal tangents at ground level. */
export class FlightPath {
  readonly duration: number;
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
  readonly departureYaw: number;
  readonly arrivalYaw: number;
  private readonly samples: Sample[] = [];
  private length = 0;

  constructor(
    readonly from: Runway,
    readonly to: Runway,
    direction: 1 | -1,
    solo: boolean,
  ) {
    const arrival = solo ? -direction : direction;
    this.departureYaw = direction > 0 ? 0 : Math.PI;
    this.arrivalYaw = arrival > 0 ? 0 : Math.PI;
    const takeoff = { ...from, x: from.x + direction * from.halfRoll };
    const touchdown = { ...to, x: to.x - arrival * to.halfRoll };
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const separation = Math.hypot(dx, dz);
    const y = Math.max(from.y, to.y) + 6.5;
    const detour = separation < 24 ? (24 - separation) * 0.5 : 0;
    const ux = separation > 0 ? dx / separation : 1;
    const uz = separation > 0 ? dz / separation : 0;
    const mid = solo
      ? { x: from.x + direction * 14, z: from.z + 7, y }
      : { x: (from.x + to.x) / 2 - uz * detour, z: (from.z + to.z) / 2 + ux * detour, y };
    const midDx = solo ? 0 : ux;
    const midDz = solo ? 1 : uz;
    const runwayHandle = Math.min(8, 2.5 + separation * 0.1);
    const cruiseHandle = Math.min(6, Math.max(4, separation / 7));
    const cruiseHalf = Math.max(0, (separation - 34) / 2);
    const climbEnd = { x: mid.x - midDx * cruiseHalf, z: mid.z - midDz * cruiseHalf, y };
    const descentStart = { x: mid.x + midDx * cruiseHalf, z: mid.z + midDz * cruiseHalf, y };
    this.add(from, direction, 0, 0);
    this.add(takeoff, direction, 0, 0);
    this.cubic(
      takeoff,
      { ...takeoff, x: takeoff.x + runwayHandle * direction },
      { x: climbEnd.x - midDx * cruiseHandle, z: climbEnd.z - midDz * cruiseHandle, y },
      climbEnd,
    );
    if (cruiseHalf > 0) this.add(descentStart, midDx, 0, midDz);
    this.cubic(
      descentStart,
      { x: descentStart.x + midDx * cruiseHandle, z: descentStart.z + midDz * cruiseHandle, y },
      { ...touchdown, x: touchdown.x - runwayHandle * arrival },
      touchdown,
    );
    this.add(to, arrival, 0, 0);
    this.duration = Math.max(12, this.length / FLIGHT_SPEED + RAMP_SECONDS);
    this.minX = Math.min(...this.samples.map((p) => p.x));
    this.maxX = Math.max(...this.samples.map((p) => p.x));
    this.minZ = Math.min(...this.samples.map((p) => p.z));
    this.maxZ = Math.max(...this.samples.map((p) => p.z));
  }

  private add(p: Point, dx: number, dy: number, dz: number): void {
    const previous = this.samples.at(-1);
    if (previous) this.length += Math.hypot(p.x - previous.x, p.y - previous.y, p.z - previous.z);
    this.samples.push({
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: Math.atan2(dz, dx),
      pitch: Math.atan2(dy, Math.hypot(dx, dz)),
      distance: this.length,
    });
  }

  private cubic(a: Point, b: Point, c: Point, d: Point): void {
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS;
      const u = 1 - t;
      const aa = u ** 3;
      const bb = 3 * u * u * t;
      const cc = 3 * u * t * t;
      const dd = t ** 3;
      this.add(
        {
          x: aa * a.x + bb * b.x + cc * c.x + dd * d.x,
          y: aa * a.y + bb * b.y + cc * c.y + dd * d.y,
          z: aa * a.z + bb * b.z + cc * c.z + dd * d.z,
        },
        u * u * (b.x - a.x) + 2 * u * t * (c.x - b.x) + t * t * (d.x - c.x),
        u * u * (b.y - a.y) + 2 * u * t * (c.y - b.y) + t * t * (d.y - c.y),
        u * u * (b.z - a.z) + 2 * u * t * (c.z - b.z) + t * t * (d.z - c.z),
      );
    }
  }

  sample(seconds: number, out: FlightPose): void {
    const end = this.duration;
    const t = Math.min(end, Math.max(0, seconds));
    // Integrate a speed curve that accelerates from rest, cruises and brakes back to rest.
    const ramp = RAMP_SECONDS;
    const span = end - ramp;
    const progress =
      t < ramp
        ? (t * t) / (2 * ramp)
        : t > end - ramp
          ? span - (end - t) ** 2 / (2 * ramp)
          : t - ramp / 2;
    const distance = (this.length * progress) / span;
    let lo = 0;
    let hi = this.samples.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.samples[mid]!.distance < distance) lo = mid;
      else hi = mid;
    }
    const a = this.samples[lo]!;
    const b = this.samples[hi]!;
    const f = (distance - a.distance) / (b.distance - a.distance);
    out.x = a.x + f * (b.x - a.x);
    out.y = a.y + f * (b.y - a.y);
    out.z = a.z + f * (b.z - a.z);
    out.yaw = a.yaw + f * angleBetween(a.yaw, b.yaw);
    out.pitch = a.pitch + f * (b.pitch - a.pitch);
  }
}
