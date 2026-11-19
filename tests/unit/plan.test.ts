import { describe, expect, it } from 'vitest';
import { PlaceCommand } from '@/sim/commands';
import { PlanStore } from '@/sim/plan';
import { tileKey } from '@/sim/terrainQuery';
import { Biome, TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

describe('neighbourhood blueprints', () => {
  it('normalizes a saved draft and turns the full footprints around the new anchor', () => {
    const { city } = makeCity();
    const plans = new PlanStore(city);
    plans.add('road', -3, 8);
    plans.add('berry_field', -2, 8);
    plans.add('hut', -3, 9);

    const saved = plans.readBlueprint(JSON.parse(JSON.stringify(plans.captureBlueprint())));
    expect(saved).toEqual([
      { defId: 'road', x: 0, z: 0 },
      { defId: 'berry_field', x: 1, z: 0 },
      { defId: 'hut', x: 0, z: 1 },
    ]);
    if (!saved) throw new Error('captured layout was rejected');
    plans.clear();

    expect(plans.stampBlueprint(saved, 10, 20, 90)).toBe(3);
    expect(plans.at(11, 20)?.defId).toBe('road');
    expect(plans.at(10, 20)?.defId).toBe('hut');
    expect(plans.at(10, 21)?.defId).toBe('berry_field');
    expect(plans.at(11, 22)).toBe(plans.at(10, 21));
    expect(city.count).toBe(0);
  });

  it('never stamps a partial layout into an occupied or unsuitable area', () => {
    const { city, history, terrain } = makeCity();
    const plans = new PlanStore(city);
    const pieces = [
      { defId: 'road', x: 0, z: 0 },
      { defId: 'hut', x: 1, z: 0 },
    ];
    const original = plans.add('road', -4, 0);
    plans.add('road', 11, 0);
    history.run(new PlaceCommand('road', 21, 0));
    terrain.special.set(tileKey(31, 0), { biome: Biome.Ocean, level: 2, flags: TileFlag.Water });

    expect(plans.stampBlueprint(pieces, 10, 0, 0)).toBe(0);
    expect(plans.stampBlueprint(pieces, 20, 0, 0)).toBe(0);
    expect(plans.stampBlueprint(pieces, 30, 0, 0)).toBe(0);
    expect(plans.stampBlueprint(pieces, Number.MAX_SAFE_INTEGER, 0, 0)).toBe(0);
    expect(plans.count).toBe(2);
    expect(plans.at(-4, 0)).toBe(original);
  });

  it('allows a half turn but rejects quarter turns of fixed rectangular models', () => {
    const { city } = makeCity();
    const plans = new PlanStore(city);
    const pieces = [
      { defId: 'road', x: 0, z: 0 },
      { defId: 'ferry_pier', x: 1, z: 0 },
    ];

    expect(plans.stampBlueprint(pieces, 10, 10, 90)).toBe(0);
    expect(plans.count).toBe(0);
    expect(plans.stampBlueprint(pieces, 10, 10, 180)).toBe(2);
    expect(plans.at(13, 11)?.defId).toBe('road');
    expect(plans.at(10, 10)?.defId).toBe('ferry_pier');
    expect(plans.at(11, 11)).toBe(plans.at(10, 10));
  });

  it('rejects overlaps and removed catalog ids in stored data', () => {
    const { city } = makeCity();
    const plans = new PlanStore(city);

    expect(plans.readBlueprint([{ defId: 'missing', x: 0, z: 0 }])).toBeUndefined();
    expect(
      plans.readBlueprint([
        { defId: 'berry_field', x: 0, z: 0 },
        { defId: 'road', x: 1, z: 1 },
      ]),
    ).toBeUndefined();
  });

  it('separates nominal resource rates from full-occupancy workforce', () => {
    const { city } = makeCity();
    const plans = new PlanStore(city);
    plans.add('hut', 0, 0);
    plans.add('berry_field', 1, 0);

    expect(plans.operations()).toEqual({
      consumed: { food: 0.2 },
      produced: { food: 1.2 },
      workersNeeded: { labor: 1 },
      workersProvided: { labor: 2 },
    });
    expect(plans.totalCost()).toEqual({ wood: 6 });
    expect(city.count).toBe(0);
  });
});
