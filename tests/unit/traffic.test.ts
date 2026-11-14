import { describe, expect, it } from 'vitest';
import { FloatingOrigin } from '@/render/floatingOrigin';
import { pickVehicle, trafficPlan } from '@/render/trafficPlan';
import { TrafficRenderer } from '@/render/trafficRenderer';
import { PlaceCommand, DemolishCommand } from '@/sim/commands';
import { makeCity } from './helpers';

describe('trafficPlan', () => {
  it('has nobody on an empty map and more people as the town grows', () => {
    expect(trafficPlan(0, 0, 100).pedestrians).toBe(0);
    expect(trafficPlan(0, 0, 100).vehicles).toBe(0);
    expect(trafficPlan(100, 0, 100).pedestrians).toBeGreaterThan(
      trafficPlan(20, 0, 100).pedestrians,
    );
  });

  it('never exceeds the cap', () => {
    const p = trafficPlan(100000, 1, 60);
    expect(p.pedestrians + p.vehicles).toBeLessThanOrEqual(60);
  });

  it('vehicles follow the era: carts, then cars and buses on paved roads only', () => {
    expect(trafficPlan(60, 0, 100).weights).toMatchObject({ horsecart: 0, car: 0 });
    expect(trafficPlan(200, 0, 100).weights.horsecart).toBeGreaterThan(0);
    expect(trafficPlan(500, 0, 100).weights.car).toBe(0); // dirt roads only
    expect(trafficPlan(500, 0.3, 100).weights.car).toBeGreaterThan(0);
    expect(trafficPlan(900, 0.05, 100).weights.bus).toBe(0);
    expect(trafficPlan(900, 0.5, 100).weights.bus).toBeGreaterThan(0);
  });

  it('pickVehicle respects the weights', () => {
    const w = { handcart: 0, horsecart: 1, car: 0, bus: 0 };
    expect(pickVehicle(w, 0.5)).toBe('horsecart');
    expect(pickVehicle({ handcart: 0, horsecart: 0, car: 0, bus: 0 }, 0.5)).toBeNull();
  });
});

describe('TrafficRenderer', () => {
  function setup() {
    const ctx = makeCity();
    for (let x = 0; x < 10; x++) ctx.history.run(new PlaceCommand('road', x, 5));
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const tr = new TrafficRenderer(ctx.city, new FloatingOrigin(), () => 0, 50, rnd);
    tr.setPlan(trafficPlan(300, 0, 50));
    return { ...ctx, tr };
  }
  const run = (tr: TrafficRenderer, secs: number) => {
    for (let i = 0; i < secs * 10; i++) tr.update(0.1, { x: 5, z: 5 }, 30);
  };

  it('fills the street and keeps everyone on road tiles', () => {
    const { tr, city } = setup();
    run(tr, 20);
    expect(tr.counts.pedestrians).toBeGreaterThan(0);
    for (const a of tr.tiles()) expect(city.at(a.x, a.z)).toBeDefined();
  });

  it('removes people when their road is demolished', () => {
    const { tr, city, history } = setup();
    run(tr, 10);
    for (let x = 0; x < 10; x++) {
      const b = city.at(x, 5);
      if (b) history.run(new DemolishCommand(b.uid));
    }
    run(tr, 1);
    expect(tr.counts.pedestrians + tr.counts.vehicles).toBe(0);
  });

  it('draws nobody when disabled, and nobody without roads', () => {
    const { tr } = setup();
    tr.enabled = false;
    run(tr, 5);
    expect(tr.counts.pedestrians).toBe(0);
    const empty = makeCity();
    const t2 = new TrafficRenderer(empty.city, new FloatingOrigin(), () => 0, 50);
    t2.setPlan(trafficPlan(300, 0, 50));
    run(t2, 5);
    expect(t2.counts.pedestrians).toBe(0);
  });
});
