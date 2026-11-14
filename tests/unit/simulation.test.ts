import { describe, expect, it } from 'vitest';
import { SimClock, TICK_HZ } from '@/sim/clock';
import { DemolishCommand, PlaceCommand } from '@/sim/commands';
import { checkPlacement } from '@/sim/requirements';
import { declineTimes, type SimEvent, Simulation } from '@/sim/simulation';
import { makeCity } from './helpers';

/** Road along z = 0, huts along z = 1, berry fields along z = -2..-1. */
function village(nHuts: number, nFields: number, sandbox = false) {
  const env = makeCity({ sandbox });
  const { city, history } = env;
  city.stock.food = 100;
  const len = Math.max(nHuts, nFields * 2) + 2;
  for (let x = 0; x < len; x++) history.run(new PlaceCommand('road', x, 0));
  for (let i = 0; i < nHuts; i++) expect(history.run(new PlaceCommand('hut', i, 1))).toBe(true);
  for (let i = 0; i < nFields; i++) {
    expect(history.run(new PlaceCommand('berry_field', i * 2, -2))).toBe(true);
  }
  const sim = new Simulation(city);
  const events: SimEvent[] = [];
  sim.on((e) => events.push(e));
  return { ...env, sim, events };
}

describe('SimClock', () => {
  it('turns frame time into whole ticks at each speed', () => {
    const c = new SimClock();
    let n = 0;
    for (let i = 0; i < 60; i++) n += c.advance(1 / 60);
    expect(n).toBe(TICK_HZ);
    c.setSpeed(4);
    n = 0;
    for (let i = 0; i < 60; i++) n += c.advance(1 / 60);
    expect(n).toBe(TICK_HZ * 4);
    c.togglePause();
    expect(c.advance(1)).toBe(0);
    c.togglePause();
    expect(c.speed).toBe(4);
  });
  it('drops time after a long stall instead of catching up', () => {
    const c = new SimClock(16);
    c.setSpeed(4);
    expect(c.advance(10)).toBeLessThanOrEqual(16);
  });
});

describe('economy', () => {
  it('housing supplies labour, fields use it and produce food', () => {
    const { sim, city } = village(4, 2);
    const food0 = city.stock.food as number;
    sim.run(TICK_HZ * 10);
    expect(sim.flows.population).toBe(16);
    expect(sim.flows.laborTotal.labor).toBe(8);
    expect(sim.flows.laborUsed.labor).toBe(2);
    // 2 fields × 1.2 − 4 huts × 0.2 = +1.6 food per second.
    expect((city.stock.food as number) - food0).toBeCloseTo(16, 5);
  });

  it('workplaces without workers stand idle and say why', () => {
    const { sim, city } = village(0, 1);
    sim.run(4);
    const field = city.at(0, -2);
    expect(field).toBeDefined();
    const s = sim.stateOf(field!.uid)!;
    expect(s.staffed).toBe(false);
    expect(sim.problemsOf(field!.uid)).toContainEqual({ kind: 'labor', tier: 'labor' });
  });
});

describe('rule engine', () => {
  it('upgrades huts to cottages once unlocked and watered, explains nothing missing', () => {
    const { sim, city, history, events } = village(10, 3);
    // 10 huts = 40 people: unlocks cottages.
    sim.run(TICK_HZ * 2);
    expect(events.some((e) => e.type === 'unlocked' && e.ids.includes('cottage'))).toBe(true);
    expect(history.run(new PlaceCommand('well', 2, 2))).toBe(true);
    sim.run(TICK_HZ * 5);
    expect(city.at(2, 1)?.def.id).toBe('cottage');
    expect(city.at(9, 1)?.def.id).toBe('hut'); // out of the well's radius
    expect(events.filter((e) => e.type === 'upgraded').length).toBeGreaterThan(0);
  });

  it('warns at least warnAtTicks before a decline, then declines a level', () => {
    const { sim, city, history, events } = village(10, 3);
    sim.run(TICK_HZ * 2);
    history.run(new PlaceCommand('well', 2, 2));
    sim.run(TICK_HZ * 5);
    const cottage = city.at(2, 1)!;
    expect(cottage.def.id).toBe('cottage');
    // Take the water away: the cottage no longer meets its own requirements.
    history.run(new DemolishCommand(city.at(2, 2)!.uid));
    const warnTick: Record<number, number> = {};
    const declineTick: Record<number, number> = {};
    sim.on((e) => {
      if (e.type === 'warn') warnTick[e.uid] = sim.tick;
      if (e.type === 'declined') declineTick[e.uid] = sim.tick;
    });
    sim.run(200);
    expect(city.at(2, 1)?.def.id).toBe('hut');
    const { warn } = declineTimes(city.catalog.get('cottage'));
    expect(warnTick[cottage.uid]).toBeDefined();
    expect(declineTick[cottage.uid]! - warnTick[cottage.uid]!).toBeGreaterThanOrEqual(warn);
    expect(events.some((e) => e.type === 'declined' && e.to === 'hut')).toBe(true);
  });

  it('never declines without a prior warning (random towns)', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const { sim, city, history } = village(6 + seed, seed % 3);
      city.stock.food = seed * 3;
      const warned = new Map<number, number>();
      let bad = 0;
      sim.on((e) => {
        if (e.type === 'warn') warned.set(e.uid, sim.tick);
        if (e.type === 'resolved') warned.delete(e.uid);
        if (e.type === 'declined') {
          const w = warned.get(e.uid);
          const { warn } = declineTimes(city.catalog.get(e.from));
          if (w === undefined || sim.tick - w < warn) bad++;
          warned.delete(e.uid);
        }
      });
      for (let t = 0; t < 600; t++) {
        if (t === 100) history.run(new PlaceCommand('well', seed, 2));
        if (t === 300) history.run(new DemolishCommand(city.at(seed, 2)!.uid));
        sim.step();
      }
      expect(bad).toBe(0);
    }
  });

  it('starving housing is abandoned after a warning and recovers when fed', () => {
    const { sim, city, events } = village(3, 0);
    city.stock.food = 0;
    sim.run(200);
    const hut = city.at(0, 1)!;
    expect(city.isActive(hut.uid)).toBe(false);
    expect(
      events.some((e) => e.type === 'warn' && e.problems.some((p) => p.kind === 'hungry')),
    ).toBe(true);
    // Abandoned buildings stop spreading their fields.
    expect(city.fields.get(0, 1, 'density')).toBeLessThan(3);
    city.stock.food = 100;
    sim.run(20);
    expect(city.isActive(hut.uid)).toBe(true);
  });
});

describe('unlocks', () => {
  it('locked buildings cannot be placed until the population is reached', () => {
    const { city } = makeCity({ sandbox: false });
    const market = city.catalog.get('market');
    const c = checkPlacement(city, market, 0, 0);
    expect(c.ok).toBe(false);
    expect(c.site.some((s) => s.key === 'req.locked' && !s.ok)).toBe(true);
    city.progress.update(60, city.catalog.defs);
    expect(checkPlacement(city, market, 0, 0).site.some((s) => s.key === 'req.locked')).toBe(false);
    // Latched: a later dip does not re-lock.
    city.progress.update(0, city.catalog.defs);
    expect(city.progress.isUnlocked(market)).toBe(true);
  });
});

describe('determinism and budget', () => {
  const runTown = (): number => {
    const { sim, city, history } = village(30, 6);
    city.stock.food = 40;
    for (let t = 0; t < 10_000; t++) {
      if (t === 50) history.run(new PlaceCommand('well', 5, 2));
      if (t === 400) history.run(new PlaceCommand('well', 20, 2));
      if (t === 3000) history.run(new DemolishCommand(city.at(5, 2)!.uid));
      sim.step();
    }
    return sim.hash();
  };

  it('10,000 ticks give the same state hash on 3 runs', () => {
    const a = runTown();
    expect(runTown()).toBe(a);
    expect(runTown()).toBe(a);
  });

  it('ticks 5,000 active buildings within budget', () => {
    const { city, history } = makeCity();
    city.stock.food = 1e6;
    // Blocks: a road row every 3 rows, huts and workplaces in between.
    let n = 0;
    for (let z = 0; n < 5000; z += 3) {
      for (let x = 0; x < 100; x++) history.run(new PlaceCommand('road', x, z));
      for (let x = 0; x < 100; x++) {
        if (history.run(new PlaceCommand(x % 4 === 0 ? 'well' : 'hut', x, z + 1))) n++;
        if (history.run(new PlaceCommand(x % 3 === 0 ? 'market' : 'hut', x, z + 2))) n++;
      }
    }
    const sim = new Simulation(city);
    sim.run(16); // warm up
    const t0 = performance.now();
    sim.run(80);
    const perTick = (performance.now() - t0) / 80;
    console.log(`tick with ${city.count} buildings: ${perTick.toFixed(2)} ms`);
    // Budget is 4 ms on a mid-range desktop; CI machines are slower, so allow 3×.
    expect(perTick).toBeLessThan(12);
  });
});
