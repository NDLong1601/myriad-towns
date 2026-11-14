import type { City } from './city';
import { checkPlacement } from './requirements';

/** A reversible change to the city. `do` returns false if it could not be applied. */
export interface Command {
  readonly label: string;
  do(city: City): boolean;
  undo(city: City): void;
}

export class PlaceCommand implements Command {
  readonly label: string;
  private uid: number | undefined;
  private cut: string[] = [];

  constructor(
    private readonly defId: string,
    private readonly x: number,
    private readonly z: number,
  ) {
    this.label = `place ${defId} @${x},${z}`;
  }

  do(city: City): boolean {
    const def = city.catalog.get(this.defId);
    if (!checkPlacement(city, def, this.x, this.z).ok) return false;
    city._addStock(def.cost, -1);
    // Redo reuses the same uid so later commands that refer to it stay valid.
    const { building, cut } = city._add(def, this.x, this.z, this.uid);
    this.uid = building.uid;
    this.cut = cut;
    return true;
  }

  undo(city: City): void {
    if (this.uid === undefined) return;
    const def = city.catalog.get(this.defId);
    city._remove(this.uid, this.cut);
    city._addStock(def.cost, 1);
  }

  get placedUid(): number | undefined {
    return this.uid;
  }
}

export class DemolishCommand implements Command {
  readonly label: string;
  private removed:
    { defId: string; x: number; z: number; refund: Record<string, number> } | undefined;

  constructor(private readonly uid: number) {
    this.label = `demolish #${uid}`;
  }

  do(city: City): boolean {
    const b = city.get(this.uid);
    if (!b) return false;
    const refund = city.refundOf(b.def);
    city._remove(this.uid);
    city._addStock(refund, 1);
    this.removed = { defId: b.def.id, x: b.x, z: b.z, refund };
    return true;
  }

  undo(city: City): void {
    if (!this.removed) return;
    const { defId, x, z, refund } = this.removed;
    city._addStock(refund, -1);
    // Trees cut by the original placement stay cut (they were not restored on demolish).
    city._add(city.catalog.get(defId), x, z, this.uid);
  }
}

/** Several commands as one undo step (a dragged road). Applies those that succeed. */
export class BatchCommand implements Command {
  private applied: Command[] = [];
  constructor(
    readonly label: string,
    private readonly parts: Command[],
  ) {}

  do(city: City): boolean {
    this.applied = [];
    for (const c of this.parts) if (c.do(city)) this.applied.push(c);
    return this.applied.length > 0;
  }

  undo(city: City): void {
    for (let i = this.applied.length - 1; i >= 0; i--) this.applied[i]?.undo(city);
  }
}

/** Undo/redo stack, 50 steps by default. */
export class History {
  private done: Command[] = [];
  private undone: Command[] = [];
  private listeners: (() => void)[] = [];

  constructor(
    private readonly city: City,
    readonly limit = 50,
  ) {}

  run(cmd: Command): boolean {
    if (!cmd.do(this.city)) return false;
    this.done.push(cmd);
    if (this.done.length > this.limit) this.done.shift();
    this.undone = [];
    this.changed();
    return true;
  }

  undo(): boolean {
    const c = this.done.pop();
    if (!c) return false;
    c.undo(this.city);
    this.undone.push(c);
    this.changed();
    return true;
  }

  redo(): boolean {
    const c = this.undone.pop();
    if (!c) return false;
    if (c.do(this.city)) this.done.push(c);
    this.changed();
    return true;
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }

  get canRedo(): boolean {
    return this.undone.length > 0;
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  private changed(): void {
    for (const l of this.listeners) l();
  }
}
