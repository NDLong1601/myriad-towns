import { describe, expect, it } from 'vitest';
import { RegionalTrade } from '@/sim/regionalTrade';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

function setup(connected = true) {
  const { city, terrain } = makeCity();
  const towns = new TownStore(city);
  const trade = new RegionalTrade(city, towns);
  city._add(city.catalog.get('road'), 0, 0);
  city._add(city.catalog.get('town_hall'), 72, 0);
  const from = city._add(city.catalog.get('cargo_port'), 1, 4).building.uid;
  const to = city._add(city.catalog.get('cargo_port'), 72, 4).building.uid;
  for (let x = 0; x < 76; x++) {
    if (connected || x !== 40) terrain.special.set(`${x},6`, { flags: TileFlag.Water });
  }
  trade.open(1);
  trade.open(2);
  return {
    city,
    towns,
    trade,
    order: { from, to, resource: 'food' as const, amount: 30, keep: 20 },
  };
}

describe('regional commerce', () => {
  it('enforces water connectivity and dispatches only cargo above the reserve floor', () => {
    const isolated = setup(false);
    expect(isolated.trade.add(isolated.order)).toBe('noWater');
    const { trade, order } = setup();
    expect(trade.add(order)).toBe('ok');
    trade.transfer(1, 'food', 49);
    trade.tick(() => true);
    expect(trade.shipments()[0]?.cargo).toBe(0);
    trade.transfer(1, 'food', 1);
    trade.tick(() => false);
    expect(trade.shipments()[0]?.cargo).toBe(0);
    trade.tick(() => true);
    expect(trade.reserve(1)?.food).toBe(20);
    expect(trade.reserve(2)?.food ?? 0).toBe(0);
    const snap = trade.snapshot();
    trade.restore(snap);
    const route = trade.shipments()[0]!;
    for (let tick = 0; tick < route.duration; tick++) trade.tick(() => true);
    expect(trade.reserve(2)?.food).toBe(30);
    expect(trade.shipments()[0]?.delivered).toBe(30);
  });

  it('returns cargo when a route is cancelled and restores local stocks without duplication', () => {
    const { trade, order, city } = setup();
    const total = city.stock.food;
    trade.transfer(1, 'food', 60);
    trade.add(order);
    trade.tick(() => true);
    trade.cancel(trade.shipments()[0]!.id);
    expect(trade.reserve(1)?.food).toBe(60);
    trade.close(1);
    expect(city.stock.food).toBe(total);
    expect(trade.shipments()).toEqual([]);
  });

  it('keeps local inputs and output out of shared stock and applies town specialization', () => {
    const { city, towns, trade } = setup();
    const sim = new Simulation(city);
    sim.tiers = towns;
    sim.regionalTrade = trade;
    const { building: farm } = city._add(city.catalog.get('berry_field'), 5, 0);
    city._add(city.catalog.get('hut'), 1, 0);
    trade.transfer(1, 'food', 10);
    trade.setRole(1, 'farming');
    const stock = city.stock.food;
    sim.run(8);
    expect(sim.stateOf(farm.uid)?.staffed).toBe(true);
    expect(city.stock.food).toBe(stock);
    expect(sim.flows.produced.food).toBeCloseTo((farm.def.produces!.food ?? 0) * 1.25);
    expect(sim.sharedFlows.produced.food).toBe(0);
  });

  it('funds a policy from the town reserve and suspends its effect when the town runs out', () => {
    const { trade, city } = setup();
    trade.setPolicy(1, 'green_city');
    trade.fundPolicies({}, {});
    expect(trade.isPolicyActive(1, 'green_city')).toBe(false);
    city.stock.goods = 1;
    trade.transfer(1, 'goods', 1);
    const amount = trade.reserve(1)?.goods ?? 0;
    const consumed = {};
    const local = {};
    trade.fundPolicies(consumed, local);
    expect(trade.isPolicyActive(1, 'green_city')).toBe(true);
    expect(trade.isPolicyActive(2, 'green_city')).toBe(false);
    expect(trade.reserve(1)?.goods).toBeCloseTo(amount - 0.05);
    expect(city.stock.goods).toBe(0);
    expect(consumed).toEqual({ goods: 0.2 });
    expect(local).toEqual(consumed);
  });
});
