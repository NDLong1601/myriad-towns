import { describe, expect, it } from 'vitest';
import { type SaveMeta, applySave, takeSave } from '@/io/save';
import { TICK_HZ } from '@/sim/clock';
import { PoiStore } from '@/sim/poi';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { makeCity } from './helpers';

const META: SaveMeta = {
  name: 'Population',
  mode: 'sandbox',
  seed: 'population',
  sandbox: { unlockAll: true, freeBuild: false, noDecline: false },
  createdAt: 1,
  updatedAt: 1,
};

function setup() {
  const { city } = makeCity();
  city.stock.food = 100;
  const sim = new Simulation(city);
  const towns = new TownStore(city);
  sim.tiers = towns;
  const pois = new PoiStore(city, 42);
  const add = (id: string, x: number, z: number) => city._add(city.catalog.get(id), x, z).building;
  return { city, sim, towns, pois, add };
}

describe('residents', () => {
  it('staffs the first farm and feeds the first household while vacancies fill', () => {
    const { sim, add } = setup();
    add('road', 0, 0);
    const home = add('hut', 0, 1);
    const field = add('berry_field', 1, 1);

    sim.step();

    expect(sim.residentsOf(home.uid)).toBe(2);
    expect(sim.population).toBe(2);
    expect(sim.housingCapacity).toBe(4);
    expect(sim.stateOf(field.uid)?.staffed).toBe(true);
    expect(sim.flows.laborTotal.labor).toBe(1);
    expect(sim.flows.consumed.food).toBeCloseTo(0.1);

    sim.run(2 * TICK_HZ);

    expect(sim.population).toBe(4);
    expect(sim.flows.laborTotal.labor).toBe(2);
    expect(sim.flows.consumed.food).toBeCloseTo(0.2);
  });

  it('loses residents locally to pollution, then regains them when local services improve', () => {
    const { city, sim, add } = setup();
    add('road', 0, 0);
    add('road', 1, 0);
    const home = add('hut', 0, 1);
    const neighbour = add('hut', 1, 1);
    sim.run(2 * TICK_HZ);
    expect(sim.population).toBe(8);

    const site = { x: home.x, z: home.z, w: 1, d: 1 };
    city.fields.apply(site, [{ field: 'pollution', amount: 4, radius: 0 }], 1);
    sim.run(2 * TICK_HZ);
    expect(sim.residentsOf(home.uid)).toBe(2);
    expect(sim.residentsOf(neighbour.uid)).toBe(4);
    expect(city.isActive(home.uid)).toBe(true);

    city.fields.apply(site, [{ field: 'greenery', amount: 6, radius: 0 }], 1);
    sim.run(2 * TICK_HZ);
    expect(sim.residentsOf(home.uid)).toBe(4);
  });

  it('loses residents when food runs out and regains them after the shortage is resolved', () => {
    const { city, sim, add } = setup();
    add('road', 0, 0);
    const home = add('hut', 0, 1);
    sim.run(2 * TICK_HZ);

    city.stock.food = 0;
    sim.run(3 * TICK_HZ);
    expect(sim.residentsOf(home.uid)).toBe(2);
    expect(sim.problemsOf(home.uid)).toContainEqual({ kind: 'hungry', resource: 'food' });

    city.stock.food = 100;
    sim.run(3 * TICK_HZ);
    expect(sim.residentsOf(home.uid)).toBe(4);
  });

  it('preserves partial occupancy across a save and fills legacy homes on load', () => {
    const source = setup();
    source.add('road', 0, 0);
    const home = source.add('hut', 0, 1);
    source.sim.step();
    const data = takeSave(source, META, null);
    const loaded = setup();
    applySave(loaded, data);
    expect(loaded.sim.population).toBe(2);
    expect(loaded.sim.housingCapacity).toBe(4);
    expect(loaded.sim.residentsOf(home.uid)).toBe(source.sim.residentsOf(home.uid));
    expect(loaded.sim.hash()).toBe(source.sim.hash());
    loaded.sim.run(40);
    source.sim.run(40);
    expect(loaded.sim.hash()).toBe(source.sim.hash());

    delete data.residents;
    const legacy = setup();
    applySave(legacy, data);
    expect(legacy.sim.population).toBe(4);
    expect(legacy.sim.residentsOf(home.uid)).toBe(4);
  });

  it('freezes a remote town’s occupancy and workforce until it wakes', () => {
    const { sim, towns, add } = setup();
    add('road', 0, 0);
    const home = add('hut', 0, 1);
    sim.step();
    const town = towns.townOfBuilding(home);
    sim.setDormant(town, true);
    sim.run(20);
    expect(sim.population).toBe(2);
    expect(sim.flows.laborTotal.labor).toBe(1);
    expect(sim.summaryOf(town)?.housingCapacity).toBe(4);
    sim.setDormant(town, false);
    sim.run(20);
    expect(sim.population).toBe(4);
    expect(sim.flows.laborTotal.labor).toBe(2);
  });
});
