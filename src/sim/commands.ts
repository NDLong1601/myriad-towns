import { type City, rectOf } from './city';
import { type Rect, rectDistance } from './geometry';
import { checkPlacement } from './requirements';

/** A reversible change to the city. `do` returns false if it could not be applied. */
export interface Command {
  readonly label: string;
  do(city: City): boolean;
  undo(city: City): void;
  /** Whether an automatic land change can invalidate this command. */
  touches?(city: City, area: Rect): boolean;
}

export class PlaceCommand implements Command {
  readonly label: string;
  private uid: number | undefined;
  private cut: string[] = [];
  /** What was actually paid (nothing with Sandbox free building), refunded exactly on undo. */
  private paid: Record<string, number> = {};

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
    this.paid = city.freeBuild ? {} : { ...def.cost };
    city._addStock(this.paid, -1);
    // Redo reuses the same uid so later commands that refer to it stay valid.
    const { building, cut } = city._add(def, this.x, this.z, this.uid);
    this.uid = building.uid;
    this.cut = cut;
    return true;
  }

  undo(city: City): void {
    if (this.uid === undefined) return;
    city._remove(this.uid, this.cut);
    city._addStock(this.paid, 1);
  }

  get placedUid(): number | undefined {
    return this.uid;
  }

  touches(city: City, area: Rect): boolean {
    return rectDistance(area, rectOf(city.catalog.get(this.defId), this.x, this.z)) === 0;
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

  touches(city: City, area: Rect): boolean {
    if (!this.removed) return false;
    const { defId, x, z } = this.removed;
    return rectDistance(area, rectOf(city.catalog.get(defId), x, z)) === 0;
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

  touches(city: City, area: Rect): boolean {
    return this.parts.some((command) => command.touches?.(city, area) ?? true);
  }
}

/** Undo/redo stack, 50 steps by default. */
export class History {
  private done: Command[] = [];
  private undone: Command[] = [];
  private listeners: (() => void)[] = [];
  private rejectListeners: ((cmd: Command) => void)[] = [];

  constructor(
    private readonly city: City,
    readonly limit = 50,
  ) {
    city.on((event) => {
      // Older commands refer to plots and ids replaced by the automatic consolidation.
      if (event.type !== 'consolidated') return;
      const { building } = event;
      const area = rectOf(building.def, building.x, building.z);
      const untouched = (command: Command): boolean => command.touches?.(city, area) === false;
      const done = this.done.filter(untouched);
      const undone = this.undone.filter(untouched);
      if (done.length === this.done.length && undone.length === this.undone.length) return;
      this.done = done;
      this.undone = undone;
      this.changed();
    });
  }

  run(cmd: Command): boolean {
    if (!cmd.do(this.city)) {
      for (const l of this.rejectListeners) l(cmd);
      return false;
    }
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

  /** Called when a command could not be done (invalid site, not enough resources). */
  onRejected(fn: (cmd: Command) => void): void {
    this.rejectListeners.push(fn);
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  private changed(): void {
    for (const l of this.listeners) l();
  }
}
