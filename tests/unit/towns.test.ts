import { describe, expect, it } from 'vitest';
import { PlaceCommand } from '@/sim/commands';
import { checkPlacement } from '@/sim/requirements';
import { Simulation } from '@/sim/simulation';
import { MIN_TOWN_GAP, TERRITORY_BASE, TownStore } from '@/sim/towns';
import { makeCity } from './helpers';

function setup() {
  const { city, history } = makeCity();
  const towns = new TownStore(city);
  towns.enforceTerritory = true;
  const sim = new Simulation(city);
  sim.tiers = towns;
  city.stock.charter = 5;
  city.stock.food = 1e6;
  return { city, history, towns, sim };
}

/** A small working village at (ox, oz): road, huts, a berry field. */
function village(history: ReturnType<typeof setup>['history'], ox: number, oz: number): void {
  for (let i = 0; i < 12; i++) history.run(new PlaceCommand('road', ox + i, oz));
  for (let i = 0; i < 6; i++) history.run(new PlaceCommand('hut', ox + i, oz + 1));
  history.run(new PlaceCommand('berry_field', ox + 6, oz + 1));
}

describe('towns', () => {
  it('the first building founds a town; undo removes it', () => {
    const { history, towns } = setup();
    expect(towns.all()).toHaveLength(0);
    history.run(new PlaceCommand('road', 3, 4));
    expect(towns.all()).toHaveLength(1);
    expect(towns.all()[0]).toMatchObject({ x: 3.5, z: 4.5 });
    history.undo();
    expect(towns.all()).toHaveLength(0);
  });

  it('Goals mode keeps building inside the territory', () => {
    const { city, history } = setup();
    history.run(new PlaceCommand('road', 0, 0));
    const inside = checkPlacement(city, city.catalog.get('road'), TERRITORY_BASE - 5, 0);
    expect(inside.ok).toBe(true);
    const outside = checkPlacement(city, city.catalog.get('road'), TERRITORY_BASE + 10, 0);
    expect(outside.ok).toBe(false);
    expect(outside.site.some((c) => c.key === 'req.territory' && !c.ok)).toBe(true);
  });

  it('a town hall founds a second town far enough away and costs a charter', () => {
    const { city, history, towns } = setup();
    history.run(new PlaceCommand('road', 0, 0));
    const hall = city.catalog.get('town_hall');
    const near = checkPlacement(city, hall, 20, 0);
    expect(near.site.find((c) => c.key === 'req.townGap')?.ok).toBe(false);
    expect(history.run(new PlaceCommand('town_hall', MIN_TOWN_GAP + 10, 0))).toBe(true);
    expect(towns.all()).toHaveLength(2);
    expect(city.stock.charter).toBe(4);
    // Now buildings may go next to it.
    expect(checkPlacement(city, city.catalog.get('road'), MIN_TOWN_GAP + 13, 0).ok).toBe(true);
    // Without charters there is no third town.
    city.stock.charter = 0;
    expect(checkPlacement(city, hall, 0, MIN_TOWN_GAP * 2).cost.ok).toBe(false);
  });

  it('territory grows with population', () => {
    const { history, towns, sim, city } = setup();
    history.run(new PlaceCommand('road', 0, 0));
    expect(towns.radiusOf(towns.all()[0]!)).toBe(TERRITORY_BASE);
    village(history, 1, 0);
    sim.run(8);
    city._addStock({}, 1); // population is counted on the stock event
    expect(towns.all()[0]!.population).toBeGreaterThan(0);
    expect(towns.radiusOf(towns.all()[0]!)).toBeGreaterThan(TERRITORY_BASE);
  });
});

describe('dormant tier', () => {
  it('a sleeping town keeps producing at its frozen rate and skips rule checks', () => {
    const a = setup();
    const b = setup();
    for (const s of [a, b]) {
      village(s.history, 0, 0);
      s.history.run(new PlaceCommand('town_hall', 200, 0));
      village(s.history, 202, 3);
      s.sim.run(16);
    }
    const far = b.towns.townOf(203, 3);
    b.sim.setDormant(far, true);
    a.sim.run(200);
    b.sim.run(200);
    // Same economy within rounding: the summary reproduces the steady state.
    expect(b.city.stock.food).toBeCloseTo(a.city.stock.food as number, 0);
    expect(b.sim.population).toBe(a.sim.population);
    expect(b.sim.summaryOf(far)?.population).toBeGreaterThan(0);
    // Waking it resumes the full tick.
    b.sim.setDormant(far, false);
    expect(b.sim.isDormant(far)).toBe(false);
    b.sim.run(8);
  });

  it('a sleeping town never drives stock below zero', () => {
    const s = setup();
    village(s.history, 0, 0);
    s.history.run(new PlaceCommand('town_hall', 200, 0));
    village(s.history, 202, 3);
    s.sim.run(8);
    const far = s.towns.townOf(203, 3);
    s.sim.setDormant(far, true);
    s.sim.setDormant(s.towns.townOf(1, 1), true);
    s.city.stock.food = 0.5;
    s.sim.run(400);
    expect(s.city.stock.food).toBeGreaterThanOrEqual(0);
  });

  it('is cheaper: dormant ticks skip the per-building work', () => {
    const s = setup();
    for (let k = 0; k < 20; k++) village(s.history, 0, k * 3);
    s.sim.run(8);
    const t0 = performance.now();
    s.sim.run(400);
    const active = performance.now() - t0;
    s.sim.setDormant(s.towns.townOf(1, 1), true);
    const t1 = performance.now();
    s.sim.run(400);
    const asleep = performance.now() - t1;
    expect(asleep).toBeLessThan(active);
  });
});
