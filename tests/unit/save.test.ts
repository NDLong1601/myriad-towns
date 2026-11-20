import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAVE_SCHEMA_VERSION } from '@/core/version';
import { decodeSave, encodeSave } from '@/io/codec';
import { migrate, SaveError } from '@/io/migrations';
import { type Game, type SaveMeta, applySave, takeSave } from '@/io/save';
import { History, PlaceCommand } from '@/sim/commands';
import { Goals } from '@/sim/goals';
import { PoiStore } from '@/sim/poi';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { makeCity } from './helpers';

function newGame(goals = true): Game & { history: History } {
  const { city } = makeCity({ sandbox: !goals });
  city.stock.food = 500;
  const history = new History(city);
  const towns = new TownStore(city);
  const sim = new Simulation(city);
  sim.tiers = towns;
  const pois = new PoiStore(city, 42);
  const g = goals ? new Goals(city, sim, pois) : undefined;
  return { city, sim, towns, pois, goals: g, history };
}

const META: SaveMeta = {
  name: 'test',
  mode: 'goals',
  seed: 'x',
  sandbox: { unlockAll: false, freeBuild: false, noDecline: false },
  createdAt: 1,
  updatedAt: 2,
};

function village(game: Game & { history: History }, ox: number, oz: number): void {
  const h = game.history;
  for (let i = 0; i < 12; i++) h.run(new PlaceCommand('road', ox + i, oz));
  for (let i = 0; i < 8; i++) h.run(new PlaceCommand('hut', ox + i, oz + 1));
  h.run(new PlaceCommand('berry_field', ox + 8, oz + 1));
  h.run(new PlaceCommand('well', ox + 3, oz + 2));
}

describe('save round trip', () => {
  it('a loaded game has the same hash and stays in step afterwards', async () => {
    const a = newGame();
    village(a, 0, 0);
    a.sim.run(300);
    // Demolish one building so uids have a gap and nextUid matters.
    const last = Math.max(...[...a.city.all()].map((b) => b.uid));
    a.city._remove(last);
    a.sim.run(37);
    const bytes = await encodeSave(takeSave(a, META, null));
    const b = newGame();
    applySave(b, await decodeSave(bytes));
    expect(b.sim.hash()).toBe(a.sim.hash());
    expect(b.city.nextUidValue).toBe(a.city.nextUidValue);
    a.sim.run(500);
    b.sim.run(500);
    expect(b.sim.hash()).toBe(a.sim.hash());
    expect(b.towns.all()).toEqual(a.towns.all());
    expect(b.goals?.index).toBe(a.goals?.index);
  });

  it('keeps explored ruins without paying them again, and chosen packs', async () => {
    const a = newGame();
    village(a, 0, 0);
    a.pois.restoreExplored(['3,4']);
    a.city.progress.choosePack('trade');
    const data = takeSave(a, META, { x: 1, z: 2, distance: 50, yaw: 0.5, pitch: 0.8 });
    const b = newGame();
    const stockBefore = JSON.stringify(data.stock);
    applySave(b, await decodeSave(await encodeSave(data)));
    expect(b.pois.isExplored('3,4')).toBe(true);
    expect(b.city.progress.hasPack('trade')).toBe(true);
    expect(JSON.stringify(b.city.stock)).toBe(stockBefore);
  });

  it('skips building types this version no longer has', () => {
    const a = newGame();
    village(a, 0, 0);
    const data = takeSave(a, META, null);
    data.defs[0] = 'teleporter';
    const b = newGame();
    const { missing } = applySave(b, data);
    expect(missing).toEqual(['teleporter']);
    expect(b.city.count).toBeLessThan(a.city.count);
  });

  it('skips a building that grew since the save and now overlaps a neighbour', () => {
    const a = newGame();
    village(a, 0, 0);
    const data = takeSave(a, META, null);
    // Turn one 1x1 hut into a 2x2 building in place: it now covers its neighbours.
    const hut = data.defs.indexOf('hut');
    data.defs.push('market');
    const market = data.defs.length - 1;
    const chunk = data.chunks.find((c) => c.b.some((v, i) => i % 7 === 1 && v === hut))!;
    for (let i = 0; i < chunk.b.length; i += 7) {
      if (chunk.b[i + 1] === hut) {
        chunk.b[i + 1] = market;
        break;
      }
    }
    const b = newGame();
    const { missing, displaced } = applySave(b, data);
    expect(missing).toEqual([]);
    expect(displaced.length).toBeGreaterThan(0);
    expect(b.city.count).toBeGreaterThan(0);
  });

  it('50 modified chunks stay well under 1 MB', async () => {
    const a = newGame(false);
    for (let c = 0; c < 50; c++) village(a, (c % 10) * 32 + 2, Math.floor(c / 10) * 32 + 2);
    const data = takeSave(a, META, null);
    expect(data.chunks.length).toBeGreaterThanOrEqual(50);
    const bytes = await encodeSave(data);
    expect(bytes.length).toBeLessThan(1_000_000);
    // Recorded in ADR-005.
    expect(bytes.length).toBeLessThan(64_000);
  });
});

describe('migrations', () => {
  it('a version 1 file loads after the schema moved on', async () => {
    const raw = readFileSync('tests/fixtures/save-v1.json');
    const data = await decodeSave(new Uint8Array(raw));
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(data.meta.seed).toBe('old-village');
    const g = newGame();
    applySave(g, data);
    expect(g.city.count).toBe(7);
    expect(g.city.nextUidValue).toBe(10);
    expect(g.sim.tick).toBe(1200);
    g.sim.run(40);
  });

  it('refuses files from the future and non-saves', () => {
    expect(() => migrate({ schemaVersion: SAVE_SCHEMA_VERSION + 1 })).toThrow(SaveError);
    expect(() => migrate('hello')).toThrow(SaveError);
    expect(() => migrate({})).toThrow(SaveError);
  });
});
