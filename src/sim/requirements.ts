import type { BuildingDef, Requirement } from './catalog';
import { type City, rectOf } from './city';
import { type Rect, forTilesInRadius } from './geometry';
import { hasTag } from './terrainQuery';
import { TileFlag } from '@/world/biomes';

/**
 * One line of the requirement checklist. The UI only formats these; it never decides validity,
 * so what the player sees always matches what the rules do.
 */
export interface CheckResult {
  ok: boolean;
  /** i18n key + params for the line. */
  key: string;
  params: Record<string, string | number>;
  /** Radius to highlight in the preview, if the check looks around the building. */
  radius?: number;
  /** Buildings counted by this check (highlighted in the preview). */
  matches?: number[];
}

export interface PlacementCheck {
  ok: boolean;
  /** Footprint free, on allowed terrain and flat. */
  site: CheckResult[];
  cost: CheckResult;
  requires: CheckResult[];
  /** Tiles on the footprint that currently have trees (they get cut). */
  treesToCut: number;
}

/** Evaluate one requirement for a building (placed or hypothetical) at rect. */
export function checkRequirement(
  city: City,
  req: Requirement,
  rect: Rect,
  selfUid?: number,
): CheckResult {
  switch (req.type) {
    case 'near': {
      const found = city.near(rect, req.radius, req.building, selfUid);
      const need = req.min ?? 1;
      return {
        ok: found.length >= need,
        key: 'req.near',
        params: { building: req.building, r: req.radius, need, have: found.length },
        radius: req.radius,
        matches: found.map((b) => b.uid),
      };
    }
    case 'notNear': {
      const found = city.near(rect, req.radius, req.building, selfUid);
      return {
        ok: found.length === 0,
        key: 'req.notNear',
        params: { building: req.building, r: req.radius, have: found.length },
        radius: req.radius,
        matches: found.map((b) => b.uid),
      };
    }
    case 'field': {
      const have = city.fields.maxOver(rect, req.field);
      const okMin = req.min === undefined || have >= req.min;
      const okMax = req.max === undefined || have <= req.max;
      return req.min !== undefined
        ? {
            ok: okMin && okMax,
            key: 'req.fieldMin',
            params: { field: req.field, min: req.min, have: round(have) },
          }
        : {
            ok: okMax,
            key: 'req.fieldMax',
            params: { field: req.field, max: req.max ?? 0, have: round(have) },
          };
    }
    case 'terrain': {
      let have = 0;
      forTilesInRadius(rect, req.radius, (x, z) => {
        if (hasTag(city.terrain, x, z, req.terrain)) have++;
      });
      const need = req.min ?? 1;
      return {
        ok: have >= need,
        key: 'req.terrain',
        params: { terrain: req.terrain, r: req.radius, need, have },
        radius: req.radius,
      };
    }
    case 'road': {
      const d = city.roadDistance(rect, req.maxDistance);
      if (d === Infinity)
        return {
          ok: false,
          key: 'req.roadNone',
          params: { d: req.maxDistance },
          radius: req.maxDistance,
        };
      return {
        ok: true,
        key: 'req.roadHave',
        params: { d: req.maxDistance, have: round(d) },
        radius: req.maxDistance,
      };
    }
  }
}

/** Everything that decides whether `def` can be placed with its corner at (x, z). */
export function checkPlacement(city: City, def: BuildingDef, x: number, z: number): PlacementCheck {
  const rect = rectOf(def, x, z);
  const site: CheckResult[] = [];

  let occupied = false;
  let treesToCut = 0;
  let level: number | undefined;
  let flat = true;
  for (let tz = z; tz < z + def.footprint.d; tz++) {
    for (let tx = x; tx < x + def.footprint.w; tx++) {
      if (city.at(tx, tz)) occupied = true;
      const t = city.terrain.tile(tx, tz);
      if (t.flags & TileFlag.Tree) treesToCut++;
      if (level === undefined) level = t.level;
      else if (t.level !== level) flat = false;
    }
  }
  if (occupied) site.push({ ok: false, key: 'req.occupied', params: {} });
  if (!city.progress.isUnlocked(def)) {
    site.push({
      ok: false,
      key: 'req.locked',
      params: { pop: def.unlock?.population ?? 0, have: city.progress.peakPopulation },
    });
  }
  for (const tag of city.catalog.placeOn(def)) {
    let ok: boolean;
    if (tag === 'flat') ok = flat;
    else {
      ok = true;
      for (let tz = z; tz < z + def.footprint.d && ok; tz++) {
        for (let tx = x; tx < x + def.footprint.w && ok; tx++)
          ok = hasTag(city.terrain, tx, tz, tag);
      }
    }
    site.push({ ok, key: 'req.footprint', params: { what: `terrain.${tag}` } });
  }

  const cost: CheckResult = { ok: city.canAfford(def.cost), key: 'req.cost', params: { cost: '' } };
  const requires = (def.requires ?? []).map((r) => checkRequirement(city, r, rect));
  const ok = site.every((c) => c.ok) && cost.ok && requires.every((c) => c.ok);
  return { ok, site, cost, requires, treesToCut };
}

/** Conditions for each upgrade of a placed building, in priority order. */
export function checkUpgrades(
  city: City,
  uid: number,
): { to: string; checks: CheckResult[]; ok: boolean }[] {
  const b = city.get(uid);
  if (!b) return [];
  const rect = rectOf(b.def, b.x, b.z);
  return (b.def.upgrades ?? []).map((u) => {
    const checks = u.when.map((r) => checkRequirement(city, r, rect, uid));
    return { to: u.to, checks, ok: checks.every((c) => c.ok) };
  });
}

/** Whether a placed building still meets its own requirements (M3 uses this for decline). */
export function checkSustain(city: City, uid: number): CheckResult[] {
  const b = city.get(uid);
  if (!b) return [];
  const rect = rectOf(b.def, b.x, b.z);
  return (b.def.requires ?? []).map((r) => checkRequirement(city, r, rect, uid));
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}
