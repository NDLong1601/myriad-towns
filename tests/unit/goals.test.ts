import { describe, expect, it } from 'vitest';
import { type Chapter, Goals } from '@/sim/goals';
import { PoiStore } from '@/sim/poi';
import { Simulation } from '@/sim/simulation';
import { makeCity } from './helpers';

const chapter: Chapter = {
  id: 'town',
  goals: [
    { type: 'count', building: 'road', min: 2 },
    { type: 'stock', resource: 'stone', min: 50 },
  ],
  alternativeGoals: [
    { type: 'happyTowns', min: 2, happiness: 80, population: 50 },
    { type: 'production', resource: 'food', min: 4 },
  ],
  reward: { wood: 10 },
  packChoice: true,
};

function setup() {
  const { city } = makeCity();
  const sim = new Simulation(city);
  const goals = new Goals(city, sim, new PoiStore(city, 1), [chapter]);
  return { city, sim, goals };
}

describe('chapter alternatives', () => {
  it('requires a complete path and rewards it once, excluding empty or unhappy towns', () => {
    const { city, sim, goals } = setup();
    const towns = [
      { population: 65, happiness: 90 },
      { population: 100, happiness: 79 },
      { population: 0, happiness: 100 },
    ];
    goals.townMetrics = () => towns;
    sim.flows.produced.food = 5;
    const wood = city.stock.wood ?? 0;

    goals.update();
    expect(goals.status().map(({ done }) => done)).toEqual([false, true]);
    expect(goals.alternativeStatus().map(({ have, done }) => ({ have, done }))).toEqual([
      { have: 1, done: false },
      { have: 5, done: true },
    ]);
    expect(goals.pending).toBeNull();

    towns[1]!.happiness = 80;
    goals.update();
    goals.update();
    expect(goals.pending).toEqual(['trade', 'crafts']);
    expect(city.stock.wood).toBe(wood + 10);
    expect(goals.choose('crafts')).toBe(true);
    expect(goals.finished).toBe(true);
  });

  it('still completes the original objectives without meeting the alternative goals', () => {
    const { city, goals } = setup();
    city._add(city.catalog.get('road'), 0, 0);
    city._add(city.catalog.get('road'), 1, 0);
    goals.update();
    expect(goals.pending).toEqual(['trade', 'crafts']);
  });
});
