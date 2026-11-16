import { describe, expect, it } from 'vitest';
import { applySave, takeSave, type SaveMeta } from '@/io/save';
import { buildingGeometry } from '@/render/buildingModels';
import { History, PlaceCommand } from '@/sim/commands';
import { PoiStore } from '@/sim/poi';
import { checkPlacement, checkRequirement, checkSustain } from '@/sim/requirements';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

const META: SaveMeta = {
  name: 'Living town',
  seed: 'living-town',
  mode: 'sandbox',
  sandbox: { unlockAll: true, freeBuild: false, noDecline: true },
  createdAt: 1,
  updatedAt: 1,
};

function setup(river = false) {
  const { city, terrain } = makeCity({ sandbox: true });
  if (river) {
    for (let x = 0; x < 12; x++)
      terrain.special.set(`${x},-1`, { flags: TileFlag.Water | TileFlag.River });
    for (let z = -2; z >= -8; z--)
      terrain.special.set(`11,${z}`, { flags: TileFlag.Water | TileFlag.River });
  }
  const history = new History(city);
  const sim = new Simulation(city);
  sim.noDecline = true;
  const add = (id: string, x: number, z: number) => city._add(city.catalog.get(id), x, z).building;
  return { city, sim, history, add, towns: new TownStore(city), pois: new PoiStore(city, 42) };
}

describe('living town', () => {
  it('requires a local stockpile for warehouses', () => {
    const { city, add } = setup();
    const warehouse = city.catalog.get('warehouse');
    add('road', 0, -1);
    const missing = checkPlacement(city, warehouse, 0, 0);
    expect(missing.ok).toBe(false);
    expect(missing.requires.find((check) => check.key === 'req.near')?.ok).toBe(false);
    const existing = add('warehouse', 0, 0);
    expect(checkSustain(city, existing.uid).every((check) => check.ok)).toBe(true);
    city._remove(existing.uid);
    add('stockpile', 4, 0);
    expect(checkPlacement(city, warehouse, 0, 0).ok).toBe(true);
  });

  it.each([
    [2, 1, 'artisan_row_east'],
    [1, 2, 'artisan_row_south'],
    [2, 2, 'garden_court'],
  ] as const)(
    'combines matching active homes on paved streets into a %i×%i plot',
    (w, d, target) => {
      const { city, sim, history, add } = setup();
      history.run(new PlaceCommand('road', -8, 0));
      expect(
        checkRequirement(
          city,
          { type: 'road', maxDistance: 1, paved: true },
          { x: -8, z: 1, w: 1, d: 1 },
        ).ok,
      ).toBe(false);
      const rect = { x: 0, z: 0, w, d };
      city.fields.apply(
        rect,
        [
          { field: 'water_access', amount: 1, radius: 2 },
          { field: 'commerce', amount: 1, radius: 2 },
          { field: 'education', amount: 1, radius: 2 },
        ],
        1,
      );
      city.stock.goods = 100;
      for (let z = 0; z < d; z++) {
        add('stone_road', -1, z);
        if (w === 2) add('stone_road', 2, z);
        for (let x = 0; x < w; x++)
          expect(history.run(new PlaceCommand('townhouse', x, z))).toBe(true);
      }
      sim.run(12);
      const merged = city.at(0, 0);
      expect(merged?.def.id).toBe(target);
      expect(city.at(w - 1, d - 1)).toBe(merged);
      expect(city.countOf('townhouse')).toBe(0);
      expect(sim.population).toBe(w * d * 16);
      expect(city.fields.maxOver(rect, 'density')).toBe(w * d * 3);
      expect(history.undo()).toBe(true);
      expect(city.at(-8, 0)).toBeUndefined();
      expect(city.at(0, 0)).toBe(merged);
      expect(history.canUndo).toBe(false);
    },
  );

  it('grows staffed crops, changes their geometry and retains their stage across saves', () => {
    const game = setup();
    game.add('road', 0, 0);
    const crop = game.add('berry_field', 0, 1);
    expect(game.sim.cropStageOf(crop.uid)).toBe(1);
    game.sim.run(18);
    expect(game.sim.cropStageOf(crop.uid)).toBe(1);
    game.add('hut', -1, 0);
    game.sim.run(32);
    expect(game.sim.cropStageOf(crop.uid)).toBe(3);
    const stored = takeSave(game, META, null);
    const loaded = setup();
    applySave(loaded, stored);
    expect(loaded.sim.cropStageOf(crop.uid)).toBe(3);
    loaded.sim.run(16);
    expect(loaded.sim.cropStageOf(crop.uid)).toBe(4);
    expect(buildingGeometry(crop.def, 4).getAttribute('position').count).toBeGreaterThan(
      buildingGeometry(crop.def, 1).getAttribute('position').count,
    );
    loaded.sim.run(16);
    expect(loaded.sim.cropStageOf(crop.uid)).toBe(1);
  });

  it('keeps adjacent homes separate until either road is paved', () => {
    const { city, sim, add } = setup();
    city.stock.goods = 100;
    city.fields.apply(
      { x: 0, z: 0, w: 2, d: 1 },
      [
        { field: 'water_access', amount: 1, radius: 0 },
        { field: 'commerce', amount: 1, radius: 0 },
        { field: 'education', amount: 1, radius: 0 },
      ],
      1,
    );
    const street = add('road', -1, 0);
    add('road', 2, 0);
    add('townhouse', 0, 0);
    add('townhouse', 1, 0);
    sim.run(16);
    expect(city.countOf('townhouse')).toBe(2);
    city._replace(street.uid, city.catalog.get('stone_road'));
    sim.run(16);
    expect(city.countOf('artisan_row_east')).toBe(1);
  });

  it.each([
    ['fishing_dock', 'food'],
    ['cargo_port', 'goods'],
  ] as const)(
    'has %s deliver %s only on return, including after reloading mid-voyage',
    (id, resource) => {
      const game = setup(true);
      const pier = game.add(id, 1, 0);
      game.add('townhouse', -1, 1);
      game.city.stock.food = 100;
      game.city.stock.goods = 60;
      const path = game.sim.voyageRouteOf(pier.uid)!;
      expect(path.length).toBeGreaterThan(4);
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]!;
        const b = path[i]!;
        expect(Math.abs(a.x - b.x) + Math.abs(a.z - b.z)).toBe(1);
      }
      game.sim.run(pier.def.voyage!.ticks - 1);
      expect(game.city.stock[resource]).toBeLessThan(resource === 'food' ? 100 : 60);
      const loaded = setup(true);
      applySave(loaded, takeSave(game, META, null));
      expect(loaded.sim.voyagePhaseOf(pier.uid)).toBeGreaterThan(0.95);
      const before = loaded.city.stock[resource]!;
      loaded.sim.run(1);
      expect(loaded.city.stock[resource]).toBeGreaterThan(before + 5);
      expect(loaded.sim.voyagePhaseOf(pier.uid)).toBe(0);
    },
  );

  it('keeps a vessel at a dock when there is no connected route', () => {
    const game = setup();
    game.add('hut', -1, 0);
    const pier = game.add('fishing_dock', 0, 0);
    game.sim.run(100);
    expect(game.sim.voyageRouteOf(pier.uid)).toEqual([]);
    expect(game.sim.voyagePhaseOf(pier.uid)).toBe(0);
    expect(game.sim.flows.produced.food).toBeUndefined();
  });
});
