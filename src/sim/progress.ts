import type { BuildingDef } from './catalog';
import packsJson from '../../data/packs.json';

export interface Pack {
  id: string;
  buildings: readonly string[];
}
export const PACKS: readonly Pack[] = packsJson.packs;
const PACK_OF = new Map<string, string>();
for (const p of PACKS) for (const b of p.buildings) PACK_OF.set(b, p.id);

/** Pack a building belongs to, if any. */
export function packOf(defId: string): string | undefined {
  return PACK_OF.get(defId);
}

export interface ProgressSnapshot {
  peak: number;
  chosen: string[];
  latched: string[];
  announced: string[];
}

export type LockReason =
  | { key: 'req.locked'; params: { pop: number; have: number } }
  | { key: 'req.pack'; params: { pack: string } };

/**
 * Unlocks: a building becomes available once the town has reached its population threshold
 * (peak, so a later dip does not re-lock it), has the listed buildings and, for buildings in a
 * pack, once that pack was chosen. Latched once met.
 */
export class Progress {
  peakPopulation = 0;
  /** Everything unlocked (Sandbox option, tests). */
  sandbox = false;
  /** Packs gate buildings only in Goals mode; off by default (free play, older tests). */
  packsEnabled = false;
  private chosen = new Set<string>();
  private latched = new Set<string>();
  private announced = new Set<string>();

  constructor(private readonly countOf: (defId: string) => number) {}

  isUnlocked(def: BuildingDef): boolean {
    return this.lockReason(def) === null;
  }

  /** Why a building is still locked, or null. */
  lockReason(def: BuildingDef): LockReason | null {
    if (this.sandbox || this.latched.has(def.id)) return null;
    const pack = this.packsEnabled ? packOf(def.id) : undefined;
    if (pack && !this.chosen.has(pack)) return { key: 'req.pack', params: { pack } };
    const u = def.unlock;
    if (u) {
      if ((u.population ?? 0) > this.peakPopulation) {
        return { key: 'req.locked', params: { pop: u.population ?? 0, have: this.peakPopulation } };
      }
      for (const [id, n] of Object.entries(u.buildings ?? {})) {
        if (this.countOf(id) < n) {
          return {
            key: 'req.locked',
            params: { pop: u.population ?? 0, have: this.peakPopulation },
          };
        }
      }
    }
    if (u || pack) this.latched.add(def.id);
    return null;
  }

  /** Hidden from the menu until the town is big enough to care (unlock.revealAt). */
  isRevealed(def: BuildingDef): boolean {
    const at = def.unlock?.revealAt;
    return (
      this.sandbox || at === undefined || this.peakPopulation >= at || this.latched.has(def.id)
    );
  }

  get chosenPacks(): readonly string[] {
    return [...this.chosen];
  }

  hasPack(id: string): boolean {
    return this.chosen.has(id);
  }

  choosePack(id: string): void {
    this.chosen.add(id);
  }

  /** Records a new population; returns the ids of buildings this unlocks. */
  update(population: number, defs: readonly BuildingDef[]): string[] {
    if (population > this.peakPopulation) this.peakPopulation = population;
    const fresh: string[] = [];
    if (this.sandbox) return fresh;
    for (const d of defs) {
      if ((!d.unlock && !(this.packsEnabled && packOf(d.id))) || this.announced.has(d.id)) continue;
      if (this.isUnlocked(d)) {
        this.announced.add(d.id);
        fresh.push(d.id);
      }
    }
    return fresh;
  }

  snapshot(): ProgressSnapshot {
    return {
      peak: this.peakPopulation,
      chosen: [...this.chosen],
      latched: [...this.latched],
      announced: [...this.announced],
    };
  }

  restore(s: ProgressSnapshot): void {
    this.peakPopulation = s.peak;
    this.chosen = new Set(s.chosen);
    this.latched = new Set(s.latched);
    this.announced = new Set(s.announced);
  }

  /** Latched ids, for saves (M5). */
  get unlockedIds(): readonly string[] {
    return [...this.latched];
  }
}
