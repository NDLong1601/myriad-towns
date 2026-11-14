import type { BuildingDef } from './catalog';

/**
 * Unlocks: a building becomes available once the town has reached its population threshold
 * (peak, so a later dip does not re-lock it) and has the listed buildings. Latched once met.
 */
export class Progress {
  peakPopulation = 0;
  /** Everything unlocked (testing and, later, the Sandbox mode). */
  sandbox = false;
  private latched = new Set<string>();
  private announced = new Set<string>();

  constructor(private readonly countOf: (defId: string) => number) {}

  isUnlocked(def: BuildingDef): boolean {
    if (this.sandbox || !def.unlock || this.latched.has(def.id)) return true;
    const u = def.unlock;
    if ((u.population ?? 0) > this.peakPopulation) return false;
    for (const [id, n] of Object.entries(u.buildings ?? {})) if (this.countOf(id) < n) return false;
    this.latched.add(def.id);
    return true;
  }

  /** Records a new population; returns the ids of buildings this unlocks. */
  update(population: number, defs: readonly BuildingDef[]): string[] {
    if (population > this.peakPopulation) this.peakPopulation = population;
    const fresh: string[] = [];
    for (const d of defs) {
      if (!d.unlock || this.announced.has(d.id) || this.sandbox) continue;
      if (this.isUnlocked(d)) {
        this.announced.add(d.id);
        fresh.push(d.id);
      }
    }
    return fresh;
  }

  /** Latched ids, for saves (M5). */
  get unlockedIds(): readonly string[] {
    return [...this.latched];
  }
}
