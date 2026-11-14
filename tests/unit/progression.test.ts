import { describe, expect, it } from 'vitest';
import { CHUNK_SIZE } from '@/core/coords';
import { DemolishCommand, PlaceCommand } from '@/sim/commands';
import { type Chapter, Goals } from '@/sim/goals';
import { poiInChunk, PoiStore } from '@/sim/poi';
import { PACKS, packOf } from '@/sim/progress';
import { checkPlacement } from '@/sim/requirements';
import { Simulation } from '@/sim/simulation';
import { makeCity } from './helpers';

const land = (): boolean => true;

describe('packs', () => {
  it('every building is in at most one pack', () => {
    const seen = new Set<string>();
    for (const p of PACKS)
      for (const b of p.buildings) {
        expect(seen.has(b)).toBe(false);
        seen.add(b);
      }
  });

  it('pack buildings stay locked in Goals mode until the pack is chosen', () => {
    const { city } = makeCity({ sandbox: false });
    city.progress.packsEnabled = true;
    city.progress.update(1000, city.catalog.defs);
    const market = city.catalog.get('market');
    expect(packOf('market')).toBe('trade');
    const c = checkPlacement(city, market, 0, 0);
    expect(c.site.find((s) => s.key === 'req.pack')?.params.pack).toBe('trade');
    city.progress.choosePack('trade');
    expect(city.progress.isUnlocked(market)).toBe(true);
  });

  it('revealAt hides a building from the menu until the town is big enough', () => {
    const { city } = makeCity({ sandbox: false });
    const villa = city.catalog.get('villa');
    expect(city.progress.isRevealed(villa)).toBe(false);
    city.progress.update(80, city.catalog.defs);
    expect(city.progress.isRevealed(villa)).toBe(true);
    expect(city.progress.isUnlocked(villa)).toBe(false); // revealed (greyed) before unlocked
  });
});

describe('sandbox options', () => {
  it('free building costs nothing and undo refunds exactly what was paid', () => {
    const { city, history } = makeCity();
    city.freeBuild = true;
    const wood = city.stock.wood;
    expect(history.run(new PlaceCommand('well', 0, 0))).toBe(true);
    expect(city.stock.wood).toBe(wood);
    history.undo();
    expect(city.stock.stone).toBe(1e6);
  });

  it('no-decline keeps unhappy buildings as they are', () => {
    const { city, history } = makeCity();
    city.stock.food = 0;
    for (let x = 0; x < 4; x++) history.run(new PlaceCommand('road', x, 0));
    history.run(new PlaceCommand('hut', 0, 1));
    const sim = new Simulation(city);
    sim.noDecline = true;
    const events: string[] = [];
    sim.on((e) => events.push(e.type));
    sim.run(400);
    expect(city.isActive(city.at(0, 1)!.uid)).toBe(true);
    expect(events).not.toContain('warn');
    expect(events).not.toContain('declined');
  });
});

describe('points of interest', () => {
  it('are a pure function of seed and chunk, and skip the start chunk', () => {
    const a = poiInChunk(7, 3, -2, land);
    expect(poiInChunk(7, 3, -2, land)).toEqual(a);
    expect(poiInChunk(7, 0, 0, land)).toBeUndefined();
    let n = 0;
    for (let cz = -10; cz < 10; cz++)
      for (let cx = -10; cx < 10; cx++) if (poiInChunk(7, cx, cz, land)) n++;
    expect(n).toBeGreaterThan(40); // ~22 % of 400
    expect(n).toBeLessThan(140);
  });

  it('a POI sits inside its chunk, away from the edge', () => {
    for (let i = 0; i < 50; i++) {
      const p = poiInChunk(1, i, -i, land);
      if (!p) continue;
      const lx = p.x - i * CHUNK_SIZE;
      const lz = p.z + i * CHUNK_SIZE;
      expect(lx).toBeGreaterThanOrEqual(4);
      expect(lz).toBeGreaterThanOrEqual(4);
      expect(lx).toBeLessThan(CHUNK_SIZE - 4);
      expect(lz).toBeLessThan(CHUNK_SIZE - 4);
    }
  });

  it('building within 2 tiles explores it once and pays the reward', () => {
    const { city, history } = makeCity();
    const pois = new PoiStore(city, 11);
    let poi;
    for (let cx = 1; cx < 30 && !poi; cx++) poi = poiInChunk(11, cx, 0, land);
    expect(poi).toBeDefined();
    const before = { ...city.stock };
    const seen: string[] = [];
    pois.on((e) => seen.push(e.poi.key));
    history.run(new PlaceCommand('road', poi!.x + 2, poi!.z));
    expect(pois.exploredCount).toBe(1);
    for (const [r, n] of Object.entries(poi!.reward)) {
      expect(city.stock[r]).toBe((before[r] ?? 0) - (r === 'stone' ? 1 : 0) + n);
    }
    // Undo/redo and more buildings do not pay twice.
    history.undo();
    history.redo();
    history.run(new PlaceCommand('road', poi!.x + 1, poi!.z));
    expect(seen).toEqual([poi!.key]);
    history.run(new DemolishCommand(city.at(poi!.x + 1, poi!.z)!.uid));
  });
});

describe('chapters', () => {
  const tiny: Chapter[] = [
    { id: 'a', goals: [{ type: 'count', building: 'road', min: 3 }], reward: { wood: 10 } },
    {
      id: 'b',
      goals: [{ type: 'count', building: 'well', min: 1 }],
      packChoice: true,
    },
    { id: 'c', goals: [{ type: 'count', building: 'well', min: 2 }], packChoice: true },
  ];

  function setup() {
    const env = makeCity({ sandbox: false });
    const sim = new Simulation(env.city);
    const pois = new PoiStore(env.city, 1);
    const goals = new Goals(env.city, sim, pois, tiny);
    const events: string[] = [];
    goals.on((e) => events.push(e.type === 'choice' ? `choice:${e.packs.join('+')}` : e.type));
    return { ...env, sim, goals, events };
  }

  it('advances chapters, pays rewards and offers two packs', () => {
    const { city, history, goals, events } = setup();
    for (let x = 0; x < 3; x++) history.run(new PlaceCommand('road', x, 0));
    const wood = city.stock.wood as number;
    goals.update();
    expect(goals.index).toBe(1);
    expect(city.stock.wood).toBe(wood + 10);
    history.run(new PlaceCommand('well', 5, 5));
    goals.update();
    expect(goals.pending).toEqual(['trade', 'crafts']);
    expect(events).toContain('choice:trade+crafts');
    // Waiting for the choice: nothing advances.
    goals.update();
    expect(goals.index).toBe(1);
    expect(goals.choose('learning')).toBe(false);
    expect(goals.choose('crafts')).toBe(true);
    expect(city.progress.hasPack('crafts')).toBe(true);
    expect(goals.index).toBe(2);
    // The pack not taken is offered again.
    history.run(new PlaceCommand('well', 8, 8));
    goals.update();
    expect(goals.pending).toEqual(['trade', 'learning']);
    goals.choose('trade');
    expect(goals.finished).toBe(true);
    // At the end every remaining pack opens.
    for (const p of PACKS) expect(city.progress.hasPack(p.id)).toBe(true);
    expect(events.at(-1)).toBe('finished');
  });

  it('the bundled chapters are reachable in order (data sanity)', async () => {
    const { CHAPTERS } = await import('@/sim/goals');
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(5);
    const pops = CHAPTERS.map((c) => c.goals.find((g) => g.type === 'population')?.min ?? 0);
    expect([...pops].sort((a, b) => a - b)).toEqual(pops);
  });
});
