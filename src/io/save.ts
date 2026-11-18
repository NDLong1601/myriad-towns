/**
 * Save files (M5, ADR-005). A save is the seed plus everything the player changed: the world
 * itself is regenerated from the seed, so only buildings, cut trees and game state are stored.
 *
 * Buildings are grouped per chunk as flat number arrays (7 numbers per building) with a table of
 * building ids, which keeps saves small and makes "modified chunks" explicit.
 */
import { tileToChunk } from '@/core/coords';
import { GEN_VERSION, SAVE_SCHEMA_VERSION } from '@/core/version';
import type { BuildingRotation, City } from '@/sim/city';
import type { Goals } from '@/sim/goals';
import type { PoiStore } from '@/sim/poi';
import type { ProgressSnapshot } from '@/sim/progress';
import type { RegionalTrade } from '@/sim/regionalTrade';
import type { Simulation } from '@/sim/simulation';
import type { TownStore } from '@/sim/towns';

export type GameMode = 'goals' | 'sandbox';

export interface SaveMeta {
  name: string;
  mode: GameMode;
  /** The seed text the player typed (the numeric seed is derived from it). */
  seed: string;
  sandbox: { unlockAll: boolean; freeBuild: boolean; noDecline: boolean };
  createdAt: number;
  updatedAt: number;
}

export interface CameraSave {
  x: number;
  z: number;
  distance: number;
  yaw: number;
  pitch: number;
}

/** Numbers per building in ChunkRec.b. */
export const BUILDING_STRIDE = 7;

export interface ChunkRec {
  cx: number;
  cz: number;
  /** Per building: uid, def index, x, z, flags (1 staffed, 2 supplied, 4 abandoned), unmetTicks, warnedAt. */
  b: number[];
}

export interface SaveData {
  schemaVersion: number;
  genVersion: number;
  meta: SaveMeta;
  camera: CameraSave | null;
  tick: number;
  nextUid: number;
  stock: Record<string, number>;
  defs: string[];
  chunks: ChunkRec[];
  /** Tiles whose trees were cut ("x,z"). */
  trees: string[];
  progress: ProgressSnapshot;
  pois: string[];
  goals: { index: number; pending: string[] | null } | null;
  towns: ReturnType<TownStore['snapshot']>;
  policies?: string[];
  /** Active crop and voyage phases keyed by building uid. Legacy saves start at phase zero. */
  work?: [number, number][];
  /** Residents keyed by home uid. Legacy saves treat active housing as full. */
  residents?: [number, number][];
  regionalTrade?: ReturnType<RegionalTrade['snapshot']>;
}

/** The live objects a save is taken from and loaded into. */
export interface Game {
  city: City;
  sim: Simulation;
  towns: TownStore;
  pois: PoiStore;
  goals?: Goals | undefined;
  regionalTrade?: RegionalTrade;
}

export function takeSave(game: Game, meta: SaveMeta, camera: CameraSave | null): SaveData {
  const { city, sim } = game;
  const defs: string[] = [];
  const defIndex = new Map<string, number>();
  const chunks = new Map<string, ChunkRec>();
  const states = new Map<number, number[]>();
  for (const s of sim.exportStates()) states.set(s[0] as number, s);
  const all = [...city.all()].sort((a, b) => a.uid - b.uid);
  for (const b of all) {
    let di = defIndex.get(b.def.id);
    if (di === undefined) {
      di = defs.length;
      defs.push(b.def.id);
      defIndex.set(b.def.id, di);
    }
    const { cx, cz } = tileToChunk(b.x, b.z);
    const key = `${cx},${cz}`;
    let rec = chunks.get(key);
    if (!rec) {
      rec = { cx, cz, b: [] };
      chunks.set(key, rec);
    }
    const st = states.get(b.uid) ?? [b.uid, 3, 0, -1];
    const flags = (st[1] as number) | (city.isActive(b.uid) ? 0 : 4) | (((b.rot ?? 0) & 3) << 3);
    rec.b.push(b.uid, di, b.x, b.z, flags, st[2] as number, st[3] as number);
  }
  const stock: Record<string, number> = {};
  for (const [r, n] of Object.entries(city.stock)) stock[r] = n;
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    genVersion: GEN_VERSION,
    meta,
    camera,
    tick: sim.tick,
    nextUid: city.nextUidValue,
    stock,
    defs,
    chunks: [...chunks.values()],
    trees: [...(city.terrain.clearedTrees ?? [])].sort(),
    progress: city.progress.snapshot(),
    pois: game.pois.exploredKeys(),
    goals: game.goals
      ? { index: game.goals.index, pending: game.goals.pending ? [...game.goals.pending] : null }
      : null,
    towns: game.towns.snapshot(),
    policies: [...city.policies],
    work: sim.exportWork(),
    residents: sim.exportResidents(),
    ...(game.regionalTrade ? { regionalTrade: game.regionalTrade.snapshot() } : {}),
  };
}

/**
 * Loads a save into a freshly built game (same seed and mode, nothing placed yet).
 * Returns ids of buildings the save names that this version no longer has (they are skipped).
 */
export function applySave(game: Game, data: SaveData): { missing: string[] } {
  const { city, sim } = game;
  if (city.count > 0) throw new Error('applySave needs an empty city');
  const missing = new Set<string>();
  // Order matters: explored ruins and towns first, so re-adding buildings neither pays ruin
  // rewards again nor founds new towns.
  game.pois.restoreExplored(data.pois);
  const towns = game.towns.restore(data.towns);
  city.progress.restore(data.progress);
  city.setPolicies(data.policies ?? []);
  const cleared = city.terrain.clearedTrees;
  const pending: number[][] = [];
  for (const rec of data.chunks) {
    for (let i = 0; i < rec.b.length; i += BUILDING_STRIDE) {
      const [uid, di, x, z, flags, unmet, warned] = rec.b.slice(i, i + BUILDING_STRIDE) as number[];
      const id = data.defs[di as number] as string;
      if (!city.catalog.has(id)) {
        missing.add(id);
        continue;
      }
      pending.push([
        uid as number,
        x as number,
        z as number,
        flags as number,
        unmet as number,
        warned as number,
        di as number,
      ]);
    }
  }
  pending.sort((a, b) => (a[0] as number) - (b[0] as number));
  for (const [uid, x, z, flags, unmet, warned, di] of pending as number[][]) {
    const rot = (((flags as number) >> 3) & 3) as BuildingRotation;
    city._add(
      city.catalog.get(data.defs[di as number] as string),
      x as number,
      z as number,
      uid,
      rot,
    );
    if ((flags as number) & 4) city._setActive(uid as number, false);
    sim.importState(uid as number, (flags as number) & 3, unmet as number, warned as number);
  }
  if (cleared) {
    cleared.clear();
    for (const k of data.trees) cleared.add(k);
  }
  if (Array.isArray(data.work)) {
    for (const entry of data.work) {
      if (Array.isArray(entry)) sim.importWork(entry[0], entry[1]);
    }
  }
  if (Array.isArray(data.residents)) {
    for (const entry of data.residents) {
      if (Array.isArray(entry)) sim.importResidents(entry[0], entry[1]);
    }
  }
  city._setNextUid(data.nextUid);
  for (const k of Object.keys(city.stock)) delete city.stock[k];
  Object.assign(city.stock, data.stock);
  sim.tick = data.tick;
  sim.refreshPopulation();
  if (game.goals && data.goals) {
    game.goals.index = data.goals.index;
    game.goals.pending = data.goals.pending;
  }
  towns.done();
  if (data.regionalTrade) game.regionalTrade?.restore(data.regionalTrade);
  city._addStock({}, 1); // refresh every stock listener once
  return { missing: [...missing] };
}
