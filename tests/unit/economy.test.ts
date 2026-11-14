import { describe, expect, it } from 'vitest';
import { PlaceCommand } from '@/sim/commands';
import { checkPlacement } from '@/sim/requirements';
import { Simulation } from '@/sim/simulation';
import { TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

const WATER = { flags: TileFlag.Water };

describe('roads upgrade with the neighbourhood', () => {
  function street(len = 12) {
    const ctx = makeCity();
    const sim = new Simulation(ctx.city);
    for (let x = 0; x < len; x++) ctx.history.run(new PlaceCommand('road', x, 5));
    return { ...ctx, sim };
  }
  const kinds = (ctx: ReturnType<typeof street>, len = 12): string[] =>
    Array.from({ length: len }, (_, x) => ctx.city.at(x, 5)?.def.id ?? '-');

  it('a dirt road next to cottages becomes a stone road; far tiles stay dirt', () => {
    const c = street();
    c.city._add(c.city.catalog.get('cottage'), 1, 6);
    c.sim.run(40);
    const k = kinds(c);
    expect(k[1]).toBe('stone_road');
    expect(k[0]).toBe('stone_road'); // within 2 tiles of the cottage
    expect(k[11]).toBe('road');
  });

  it('a dense neighbourhood gets brick roads', () => {
    const c = street();
    for (const x of [1, 2, 3]) {
      c.city._add(c.city.catalog.get('cottage'), x, 6);
      c.city._add(c.city.catalog.get('cottage'), x, 4);
    }
    c.sim.run(40);
    expect(c.city.at(2, 5)?.def.id).toBe('brick_road');
    expect(kinds(c)[11]).toBe('road');
  });

  it('the road keeps its uid and every kind counts as a road for rules', () => {
    const c = street();
    const uid = c.city.at(1, 5)!.uid;
    c.city._add(c.city.catalog.get('cottage'), 1, 6);
    c.sim.run(40);
    expect(c.city.at(1, 5)!.uid).toBe(uid);
    expect(c.city.countTag('road')).toBe(12);
    // A hut needs a road within 1: a stone road satisfies it just like dirt.
    const hut = c.city.catalog.get('hut');
    expect(checkPlacement(c.city, hut, 1, 4).requires.every((r) => r.ok)).toBe(true);
  });

  it('the economy stays deterministic with road upgrades', () => {
    const run = (): number => {
      const c = street();
      for (const x of [1, 2, 3, 4]) c.city._add(c.city.catalog.get('cottage'), x, 6);
      c.sim.run(300);
      return c.sim.hash();
    };
    expect(run()).toBe(run());
  });
});

describe('bridges', () => {
  it('can be built on water next to a road, not on land and not far from a road', () => {
    const { city, terrain } = makeCity();
    for (const x of [10, 11, 12]) terrain.special.set(`${x},5`, WATER);
    city.progress.sandbox = true;
    const bridge = city.catalog.get('bridge');
    const place = (x: number, z: number) => checkPlacement(city, bridge, x, z);
    // No road yet: the requirement fails even on water.
    expect(place(10, 5).ok).toBe(false);
    for (let x = 6; x < 10; x++) city._add(city.catalog.get('road'), x, 5);
    expect(place(10, 5).ok).toBe(true);
    expect(place(8, 4).ok).toBe(false); // land
    expect(place(12, 5).ok).toBe(false); // road too far
    city._add(bridge, 10, 5);
    expect(place(11, 5).ok).toBe(true); // a bridge continues the road
  });
});

describe('stone is available everywhere', () => {
  it('a gravel pit needs no deposits while a quarry does', () => {
    const { city } = makeCity();
    city._add(city.catalog.get('road'), 4, 5);
    const at = (id: string) => checkPlacement(city, city.catalog.get(id), 5, 5);
    expect(at('quarry').ok).toBe(false);
    expect(at('gravel_pit').ok).toBe(true);
    expect(at('trading_post').ok).toBe(true);
  });

  it('a gravel pit produces stone from labour alone', () => {
    const { city } = makeCity();
    const sim = new Simulation(city);
    for (let x = 0; x < 6; x++) city._add(city.catalog.get('road'), x, 5);
    for (let x = 0; x < 3; x++) city._add(city.catalog.get('hut'), x, 6);
    city._add(city.catalog.get('gravel_pit'), 4, 6);
    city.stock.food = 1000;
    city.stock.stone = 0;
    sim.run(160);
    expect(city.stock.stone).toBeGreaterThan(0);
  });
});

describe('industry chain', () => {
  it('every industry building has a recipe that uses or makes real resources', () => {
    const { city } = makeCity();
    for (const id of ['windmill', 'power_plant', 'foundry', 'factory']) {
      const d = city.catalog.get(id);
      expect(Object.keys(d.produces ?? {}).length, id).toBeGreaterThan(0);
    }
    expect(city.catalog.get('factory').produces?.goods).toBeGreaterThan(0);
    expect(city.catalog.get('factory').upkeep?.energy).toBeGreaterThan(0);
    expect(city.catalog.get('power_plant').produces?.energy).toBeGreaterThan(0);
  });
});
