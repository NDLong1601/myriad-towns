import { isRoadDef, type BuildingDef, type Requirement } from '@/sim/catalog';
import { rectOf, type City, type PlacedBuilding } from '@/sim/city';
import { FIELD_SCALE, FieldStore } from '@/sim/fields';
import { rectDistance } from '@/sim/geometry';
import { checkRequirement } from '@/sim/requirements';

export interface LocalImpact {
  improved: PlacedBuilding[];
  atRisk: PlacedBuilding[];
}

type Change = { def: BuildingDef; x: number; z: number; removeUid?: number };

/** Check neighbouring rules against a read-only view of one proposed change. */
export class ImpactPreview {
  private reach = 0;

  constructor(private readonly city: City) {
    for (const def of city.catalog.defs) {
      for (const req of [...(def.requires ?? []), ...(def.upgrades ?? []).flatMap((u) => u.when)]) {
        if (req.type === 'near' || req.type === 'notNear')
          this.reach = Math.max(this.reach, req.radius);
        if (req.type === 'road') this.reach = Math.max(this.reach, req.maxDistance);
      }
    }
  }

  inspect(change: Change): LocalImpact {
    const { city } = this;
    const { def, x, z, removeUid } = change;
    const rect = rectOf(def, x, z);
    const removing = removeUid !== undefined;
    const emits = !removing || city.isActive(removeUid) ? (def.emits ?? []) : [];
    const road = isRoadDef(def);
    const reach = Math.max(this.reach, ...emits.map((e) => e.radius));
    const virtual: PlacedBuilding = { uid: -1, def, x, z };
    const view: Parameters<typeof checkRequirement>[0] = {
      terrain: city.terrain,
      near(target, radius, id, selfUid) {
        const found = city.near(target, radius, id, selfUid);
        if (removing) return found.filter((b) => b.uid !== removeUid);
        if ((id === undefined || id === def.id) && rectDistance(rect, target) <= radius)
          found.push(virtual);
        return found;
      },
      roadDistance(target, radius, paved) {
        const old = city.roadDistance(target, radius, paved, removeUid);
        if (!road || removing || (paved && !def.tags?.includes('paved'))) return old;
        const distance = rectDistance(rect, target);
        return distance <= radius ? Math.min(old, distance) : old;
      },
      fields: {
        maxOver(target, field) {
          let best = -Infinity;
          for (let tz = target.z; tz < target.z + target.d; tz++) {
            for (let tx = target.x; tx < target.x + target.w; tx++) {
              const distance = rectDistance(rect, { x: tx, z: tz, w: 1, d: 1 });
              let value = Math.round(city.fields.get(tx, tz, field) * FIELD_SCALE);
              for (const emit of emits) {
                if (emit.field === field && distance <= emit.radius) {
                  value += FieldStore.contribution(emit, distance) * (removing ? -1 : 1);
                }
              }
              best = Math.max(best, value);
            }
          }
          return best / FIELD_SCALE;
        },
      },
    };

    const result: LocalImpact = { improved: [], atRisk: [] };
    for (const b of city.near(rect, reach, undefined, removeUid)) {
      const target = rectOf(b.def, b.x, b.z);
      const distance = rectDistance(rect, target);
      const affected = (req: Requirement): boolean => {
        switch (req.type) {
          case 'road':
            return (
              road && distance <= req.maxDistance && (!req.paved || !!def.tags?.includes('paved'))
            );
          case 'near':
          case 'notNear':
            return def.id === req.building && distance <= req.radius;
          case 'field':
            return emits.some((e) => e.field === req.field && distance <= e.radius);
          case 'terrain':
            return false;
        }
      };
      const holds = (rules: readonly Requirement[], source: typeof view): boolean =>
        rules.every((r) => checkRequirement(source, r, target, b.uid).ok);
      const sustain = b.def.requires ?? [];
      const before = holds(sustain, city);
      const after = sustain.some(affected) ? holds(sustain, view) : before;
      const enablesUpgrade = (): boolean =>
        (b.def.upgrades ?? []).some((upgrade) => {
          const next = city.catalog.get(upgrade.to);
          if (!city.progress.isUnlocked(next)) return false;
          const rules = [...upgrade.when, ...(next.requires ?? [])];
          return rules.some(affected) && !holds(rules, city) && holds(rules, view);
        });
      if (before && !after && city.isActive(b.uid)) {
        result.atRisk.push(b);
      } else if (after && (!before || enablesUpgrade())) {
        result.improved.push(b);
      }
    }
    return result;
  }
}
