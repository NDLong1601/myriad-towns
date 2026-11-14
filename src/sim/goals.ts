/**
 * Goals mode: chapters of objectives (data/chapters.json). Finishing a chapter grants its reward
 * and, for most chapters, a choice between two building packs. The pack not chosen is offered
 * again later, so no path closes for good.
 */
import chaptersJson from '../../data/chapters.json';
import type { Amounts } from './catalog';
import type { City } from './city';
import type { PoiStore } from './poi';
import { PACKS } from './progress';
import type { Simulation } from './simulation';

export type Goal =
  | { type: 'population'; min: number }
  | { type: 'count'; building: string; min: number }
  | { type: 'stock'; resource: string; min: number }
  | { type: 'production'; resource: string; min: number }
  | { type: 'explore'; min: number }
  | { type: 'towns'; min: number };

export interface Chapter {
  id: string;
  goals: Goal[];
  reward?: Amounts;
  packChoice?: boolean;
}

export const CHAPTERS: readonly Chapter[] = chaptersJson.chapters as Chapter[];

export interface GoalStatus {
  goal: Goal;
  have: number;
  done: boolean;
}

export type GoalsEvent =
  | { type: 'chapterDone'; chapter: Chapter }
  | { type: 'choice'; packs: readonly string[] }
  | { type: 'packChosen'; pack: string }
  | { type: 'finished' };

export class Goals {
  /** Index of the current chapter (CHAPTERS.length when all are done). */
  index = 0;
  /** Packs offered and waiting for the player's pick. */
  pending: readonly string[] | null = null;
  private busy = false;
  /** Number of towns (set by the game once towns exist; 1 by default). */
  townCount: () => number = () => 1;
  private listeners: ((e: GoalsEvent) => void)[] = [];

  constructor(
    private readonly city: City,
    private readonly sim: Simulation,
    private readonly pois: PoiStore,
    readonly chapters: readonly Chapter[] = CHAPTERS,
  ) {
    city.progress.packsEnabled = true;
    // Checked once per game second (the simulation's stock event).
    city.on((e) => {
      if (e.type === 'stock') this.update();
    });
  }

  on(fn: (e: GoalsEvent) => void): void {
    this.listeners.push(fn);
  }

  get current(): Chapter | undefined {
    return this.chapters[this.index];
  }

  get finished(): boolean {
    return this.index >= this.chapters.length;
  }

  status(): GoalStatus[] {
    const ch = this.current;
    if (!ch) return [];
    return ch.goals.map((goal) => {
      const have = this.measure(goal);
      return { goal, have, done: have >= goal.min };
    });
  }

  /** Advances when every goal of the current chapter is met (and no pack choice is pending). */
  update(): void {
    // Paying a reward emits a stock event, which calls update again: ignore re-entry.
    if (this.busy || this.pending || this.finished) return;
    const ch = this.current as Chapter;
    if (!this.status().every((s) => s.done)) return;
    this.busy = true;
    try {
      this.complete(ch);
    } finally {
      this.busy = false;
    }
  }

  /** Debug and tests: finishes the current chapter now, as if its goals were met. */
  skip(): void {
    if (this.busy || this.pending || this.finished) return;
    this.busy = true;
    try {
      this.complete(this.current as Chapter);
    } finally {
      this.busy = false;
    }
  }

  private complete(ch: Chapter): void {
    if (ch.reward) this.city._addStock(ch.reward, 1);
    this.emit({ type: 'chapterDone', chapter: ch });
    const offer = ch.packChoice ? this.remainingPacks().slice(0, 2) : [];
    if (offer.length === 2) {
      this.pending = offer;
      this.emit({ type: 'choice', packs: offer });
      return;
    }
    if (offer.length === 1) this.grant(offer[0] as string);
    this.next();
  }

  /** The player's pick from a pending choice. */
  choose(pack: string): boolean {
    if (!this.pending?.includes(pack)) return false;
    this.pending = null;
    this.grant(pack);
    this.next();
    return true;
  }

  private next(): void {
    this.index++;
    if (this.finished) {
      // Everything left opens at the end: the paths not taken are not lost.
      for (const p of this.remainingPacks()) this.grant(p);
      this.emit({ type: 'finished' });
    }
  }

  private grant(pack: string): void {
    this.city.progress.choosePack(pack);
    this.emit({ type: 'packChosen', pack });
  }

  private remainingPacks(): string[] {
    return PACKS.map((p) => p.id).filter((id) => !this.city.progress.hasPack(id));
  }

  private measure(g: Goal): number {
    switch (g.type) {
      case 'population':
        return this.sim.population;
      case 'count':
        return this.city.countOf(g.building);
      case 'stock':
        return Math.floor(this.city.stock[g.resource] ?? 0);
      case 'production':
        return Math.round((this.sim.flows.produced[g.resource] ?? 0) * 10) / 10;
      case 'explore':
        return this.pois.exploredCount;
      case 'towns':
        return this.townCount();
    }
  }

  private emit(e: GoalsEvent): void {
    for (const l of this.listeners) l(e);
  }
}
