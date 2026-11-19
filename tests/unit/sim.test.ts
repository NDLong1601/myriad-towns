import { describe, expect, it } from 'vitest';
import { hash32, Rng } from '@/core/prng';
import { type BuildingDef, Catalog, loadCatalog } from '@/sim/catalog';
import { City } from '@/sim/city';
import { BatchCommand, DemolishCommand, History, PlaceCommand } from '@/sim/commands';
import { rectDistance } from '@/sim/geometry';
import { checkPlacement, checkUpgrades } from '@/sim/requirements';
import { type TerrainQuery, tileKey } from '@/sim/terrainQuery';
import { Biome, Resource, TileFlag } from '@/world/biomes';
import type { TileSample } from '@/world/terrain';

/** Flat temperate grass everywhere, with a few configurable tiles. */
class FakeTerrain implements TerrainQuery {
  readonly clearedTrees = new Set<string>();
  special = new Map<string, Partial<TileSample>>();
  tile(x: number, z: number): TileSample {
    const base: TileSample = {
      level: 6,
      biome: Biome.Temperate,
      flags: 0,
      resource: Resource.None,
      moisture: 0.5,
    };
    const s = { ...base, ...this.special.get(tileKey(x, z)) };
    if (s.flags & TileFlag.Tree && this.clearedTrees.has(tileKey(x, z))) s.flags &= ~TileFlag.Tree;
    return s;
  }
}

function setup() {
  const terrain = new FakeTerrain();
  const city = new City(loadCatalog(), terrain);
  city.stock.wood = 1e6;
  city.stock.stone = 1e6;
  city.progress.sandbox = true;
  const history = new History(city);
  return { terrain, city, history };
}

describe('catalog', () => {
  it('loads every building from data/', () => {
    const c = loadCatalog();
    expect(c.defs.length).toBeGreaterThanOrEqual(25);
    expect(c.get('road').category).toBe('infrastructure');
    expect(c.categories).toContain('housing');
  });
  it('rejects duplicate ids', () => {
    const d = {
      id: 'a',
      category: 'x',
      footprint: { w: 1, d: 1 },
      cost: {},
      visual: { shape: 'house' },
    } as BuildingDef;
    expect(() => new Catalog([d, d])).toThrow();
  });
});

describe('geometry', () => {
  it('measures rect distance between closest tiles', () => {
    expect(rectDistance({ x: 0, z: 0, w: 1, d: 1 }, { x: 0, z: 0, w: 1, d: 1 })).toBe(0);
    expect(rectDistance({ x: 0, z: 0, w: 1, d: 1 }, { x: 1, z: 0, w: 1, d: 1 })).toBe(1);
    expect(rectDistance({ x: 0, z: 0, w: 2, d: 2 }, { x: 4, z: 0, w: 1, d: 1 })).toBe(3);
    expect(rectDistance({ x: 0, z: 0, w: 1, d: 1 }, { x: 3, z: 4, w: 1, d: 1 })).toBe(5);
  });
});

describe('placement rules', () => {
  it('a hut needs a road within 2 tiles', () => {
    const { city, history } = setup();
    const hut = city.catalog.get('hut');
    expect(checkPlacement(city, hut, 0, 0).ok).toBe(false);
    expect(history.run(new PlaceCommand('hut', 0, 0))).toBe(false);
    history.run(new PlaceCommand('road', 0, 3));
    expect(checkPlacement(city, hut, 0, 0).ok).toBe(false); // 3 tiles away
    history.run(new PlaceCommand('road', 0, 2));
    const check = checkPlacement(city, hut, 0, 0);
    expect(check.ok).toBe(true);
    expect(history.run(new PlaceCommand('hut', 0, 0))).toBe(true);
    expect(city.at(0, 0)?.def.id).toBe('hut');
  });

  it('cannot build on an occupied tile, on water or on uneven ground', () => {
    const { city, terrain, history } = setup();
    history.run(new PlaceCommand('road', 5, 5));
    expect(history.run(new PlaceCommand('road', 5, 5))).toBe(false);
    terrain.special.set(tileKey(9, 9), { flags: TileFlag.Water, level: 3 });
    expect(checkPlacement(city, city.catalog.get('well'), 9, 9).ok).toBe(false);
    terrain.special.set(tileKey(21, 20), { level: 7 });
    const market = checkPlacement(city, city.catalog.get('market'), 20, 20); // 2×2 spans a step
    expect(market.site.find((c) => c.params.what === 'terrain.flat')?.ok).toBe(false);
  });

  it('a well raises water access within 4 tiles, which the cottage needs', () => {
    const { city, history } = setup();
    history.run(new PlaceCommand('road', 0, 1));
    const cottage = city.catalog.get('cottage');
    expect(checkPlacement(city, cottage, 0, 0).ok).toBe(false);
    history.run(new PlaceCommand('well', 4, 0));
    expect(city.fields.get(0, 0, 'water_access')).toBe(1);
    expect(city.fields.get(-1, 0, 'water_access')).toBe(0);
    expect(checkPlacement(city, cottage, 0, 0).ok).toBe(true);
  });

  it('near / notNear count buildings and report matches', () => {
    const { city, history } = setup();
    for (let x = 0; x < 6; x++) history.run(new PlaceCommand('road', x, 0));
    history.run(new PlaceCommand('hut', 0, 1));
    const villa = checkPlacement(city, city.catalog.get('villa'), 3, 1);
    const notNearHut = villa.requires.find(
      (c) => c.key === 'req.notNear' && c.params.building === 'hut',
    );
    expect(notNearHut?.ok).toBe(false);
    expect(notNearHut?.matches).toHaveLength(1);
  });

  it('terrain requirements count tagged tiles', () => {
    const { city, terrain, history } = setup();
    history.run(new PlaceCommand('road', 0, 2));
    const woodcutter = city.catalog.get('woodcutter');
    for (let i = 1; i <= 3; i++) terrain.special.set(tileKey(i, 0), { flags: TileFlag.Tree });
    terrain.special.set(tileKey(-1, 0), { flags: TileFlag.Tree });
    terrain.special.set(tileKey(-2, -1), { flags: TileFlag.Tree });
    terrain.special.set(tileKey(9, 9), { flags: TileFlag.Tree }); // too far
    expect(checkPlacement(city, woodcutter, 0, 0).ok).toBe(false); // 5 of 6
    terrain.special.set(tileKey(0, -2), { flags: TileFlag.Tree });
    expect(checkPlacement(city, woodcutter, 0, 0).ok).toBe(true);
  });

  it('the checklist and the rule engine always agree', () => {
    const { city, history } = setup();
    const rng = new Rng(5);
    for (let i = 0; i < 300; i++) {
      const def = rng.pick(city.catalog.defs);
      const x = rng.nextInt(-8, 8);
      const z = rng.nextInt(-8, 8);
      const check = checkPlacement(city, def, x, z);
      const all = [...check.site, check.cost, ...check.requires].every((c) => c.ok);
      expect(check.ok).toBe(all);
      expect(history.run(new PlaceCommand(def.id, x, z))).toBe(check.ok);
    }
  });

  it('upgrade conditions are reported for placed buildings', () => {
    const { city, history } = setup();
    history.run(new PlaceCommand('road', 0, 1));
    history.run(new PlaceCommand('hut', 0, 0));
    const uid = city.at(0, 0)?.uid as number;
    expect(checkUpgrades(city, uid)[0]?.ok).toBe(false);
    history.run(new PlaceCommand('well', 2, 0));
    expect(checkUpgrades(city, uid)[0]?.ok).toBe(true);
  });
});

describe('commands and undo', () => {
  it('costs are paid and refunded; undo restores stock exactly', () => {
    const { city, history } = setup();
    city.stock.stone = 10;
    history.run(new PlaceCommand('well', 0, 0)); // costs 3 stone
    expect(city.stock.stone).toBe(7);
    const uid = city.at(0, 0)?.uid as number;
    history.run(new DemolishCommand(uid)); // refund 75% → 2
    expect(city.stock.stone).toBe(9);
    history.undo();
    expect(city.stock.stone).toBe(7);
    expect(city.at(0, 0)?.uid).toBe(uid);
    history.undo();
    expect(city.stock.stone).toBe(10);
    expect(city.count).toBe(0);
  });

  it('cannot place without materials', () => {
    const { city, history } = setup();
    city.stock.stone = 2;
    expect(history.run(new PlaceCommand('well', 0, 0))).toBe(false);
  });

  it('building on trees cuts them; undo grows them back', () => {
    const { terrain, history } = setup();
    terrain.special.set(tileKey(0, 0), { flags: TileFlag.Tree });
    history.run(new PlaceCommand('well', 0, 0));
    expect(terrain.tile(0, 0).flags & TileFlag.Tree).toBe(0);
    history.undo();
    expect(terrain.tile(0, 0).flags & TileFlag.Tree).toBe(TileFlag.Tree);
  });

  it('property: any sequence of commands, fully undone, leaves fields and occupancy byte-identical', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { city, history: setupHistory } = setup();
      const rng = new Rng(hash32(seed, 99));
      // Some fixed starting buildings, outside the history under test.
      for (let x = -6; x <= 6; x++) setupHistory.run(new PlaceCommand('road', x, 0));
      setupHistory.run(new PlaceCommand('well', 2, 2));
      const history = new History(city);
      const before = city.fields.snapshot();
      const stockBefore = { ...city.stock };
      const countBefore = city.count;

      let applied = 0;
      for (let i = 0; i < 45; i++) {
        const r = rng.nextFloat();
        if (r < 0.6) {
          const def = rng.pick(city.catalog.defs);
          if (history.run(new PlaceCommand(def.id, rng.nextInt(-8, 8), rng.nextInt(-8, 8))))
            applied++;
        } else if (r < 0.8) {
          const list = [...city.all()];
          if (list.length && history.run(new DemolishCommand(rng.pick(list).uid))) applied++;
        } else {
          const parts = Array.from(
            { length: 4 },
            (_, k) => new PlaceCommand('road', k, rng.nextInt(-8, 8)),
          );
          if (history.run(new BatchCommand('road', parts))) applied++;
        }
      }
      expect(applied).toBeLessThanOrEqual(history.limit);
      while (history.undo()) {
        /* undo everything */
      }
      expect(city.fields.snapshot()).toEqual(before);
      expect(city.stock).toEqual(stockBefore);
      expect(city.count).toBe(countBefore);
    }
  });

  it('keeps at most 50 undo steps', () => {
    const { history } = setup();
    for (let i = 0; i < 60; i++) history.run(new PlaceCommand('road', i, 0));
    let n = 0;
    while (history.undo()) n++;
    expect(n).toBe(50);
  });

  it('redo re-applies with the same building id', () => {
    const { city, history } = setup();
    history.run(new PlaceCommand('well', 0, 0));
    const uid = city.at(0, 0)?.uid;
    history.undo();
    history.redo();
    expect(city.at(0, 0)?.uid).toBe(uid);
  });
});
