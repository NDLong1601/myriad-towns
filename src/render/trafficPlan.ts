/** Kinds of people and vehicles on the roads, oldest to newest. */
export type AgentKind = 'pedestrian' | 'handcart' | 'horsecart' | 'car' | 'bus' | 'truck';

export const VEHICLE_KINDS = ['handcart', 'horsecart', 'car', 'bus', 'truck'] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number];

/** Walking or driving speed in tiles per second. */
export const SPEED: Record<AgentKind, number> = {
  pedestrian: 0.8,
  handcart: 1.3,
  horsecart: 1.9,
  car: 3.0,
  bus: 2.3,
  truck: 2.4,
};

export interface TrafficPlan {
  pedestrians: number;
  vehicles: number;
  /** Share of each vehicle kind among new vehicles (not normalised; 0 = not yet invented). */
  weights: Record<VehicleKind, number>;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * How much traffic a town of `population` shows, and what kind of vehicles. Society moves from
 * handcarts through horse carts to cars and buses as it grows; engines need paved roads
 * (`paved` is the share of roads that are stone or brick, 0..1). `max` caps the agents drawn.
 * Pure, so it is unit tested.
 */
export function trafficPlan(
  population: number,
  paved: number,
  max: number,
  hasTransit = false,
): TrafficPlan {
  const pop = Math.max(0, population);
  const w: Record<VehicleKind, number> = { handcart: 0, horsecart: 0, car: 0, bus: 0, truck: 0 };
  if (pop >= 40) w.handcart = clamp(1 - (pop - 40) / 400, 0.1, 1);
  if (pop >= 120) w.horsecart = clamp(1 - (pop - 400) / 800, 0.25, 1);
  if (pop >= 300 && paved >= 0.05) w.car = clamp((pop - 300) / 400, 0.15, 1);
  if (pop >= 500 && paved >= 0.1) w.truck = clamp((pop - 500) / 800, 0.1, 0.6);
  if (pop >= 700 && paved >= 0.15) w.bus = clamp((pop - 700) / 1600, 0.1, 0.5);
  if (hasTransit && paved >= 0.05) w.bus = Math.max(w.bus, 0.35);
  const hasVehicles = Object.values(w).some((x) => x > 0);
  return {
    pedestrians: clamp(Math.round(pop / 5), 0, Math.floor(max * 0.65)),
    vehicles: hasVehicles ? clamp(Math.round(pop / 25), 1, Math.floor(max * 0.35)) : 0,
    weights: w,
  };
}

/** Picks a vehicle kind by weight; `r` is a random number in [0, 1). */
export function pickVehicle(
  weights: Partial<Record<VehicleKind, number>>,
  r: number,
): VehicleKind | null {
  const total = VEHICLE_KINDS.reduce((s, k) => s + (weights[k] ?? 0), 0);
  if (total <= 0) return null;
  let x = r * total;
  for (const k of VEHICLE_KINDS) {
    x -= weights[k] ?? 0;
    if (x < 0) return k;
  }
  return VEHICLE_KINDS[VEHICLE_KINDS.length - 1] as VehicleKind;
}
