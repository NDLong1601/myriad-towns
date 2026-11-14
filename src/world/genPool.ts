import { generateChunk } from './chunk';
import type { GenRequest, GenResult } from './genProtocol';
import { buildTerrainMesh } from './terrainMesh';

/** Anything that can turn (seed, cx, cz) into a chunk and its mesh, asynchronously. */
export interface ChunkGenerator {
  request(seed: number, cx: number, cz: number): Promise<GenResult>;
  /** Number of requests that can usefully run at once. */
  readonly parallelism: number;
  dispose(): void;
}

/** Runs generation on the calling thread. Used in tests and as a fallback without Worker. */
export class InlineGenerator implements ChunkGenerator {
  readonly parallelism = 1;
  private nextId = 1;
  request(seed: number, cx: number, cz: number): Promise<GenResult> {
    const t0 = performance.now();
    const chunk = generateChunk(seed, cx, cz);
    const mesh = buildTerrainMesh(seed, chunk);
    return Promise.resolve({ id: this.nextId++, chunk, mesh, ms: performance.now() - t0 });
  }
  dispose(): void {}
}

/** A small pool of module workers; each request goes to the least busy worker. */
export class WorkerPoolGenerator implements ChunkGenerator {
  readonly parallelism: number;
  private workers: { w: Worker; busy: number }[] = [];
  private pending = new Map<
    number,
    { resolve: (r: GenResult) => void; reject: (e: unknown) => void; worker: number }
  >();
  private nextId = 1;

  constructor(
    private readonly flat = true,
    size = defaultPoolSize(),
  ) {
    this.parallelism = size;
    for (let i = 0; i < size; i++) {
      const w = new Worker(new URL('../workers/gen.worker.ts', import.meta.url), {
        type: 'module',
      });
      w.onmessage = (e: MessageEvent<GenResult>) => this.onResult(e.data);
      w.onerror = (e) => this.onError(i, e);
      this.workers.push({ w, busy: 0 });
    }
  }

  request(seed: number, cx: number, cz: number): Promise<GenResult> {
    let best = 0;
    for (let i = 1; i < this.workers.length; i++) {
      if ((this.workers[i]?.busy ?? 0) < (this.workers[best]?.busy ?? 0)) best = i;
    }
    const slot = this.workers[best];
    if (!slot) return Promise.reject(new Error('worker pool disposed'));
    const id = this.nextId++;
    slot.busy++;
    const msg: GenRequest = { id, seed, cx, cz, flat: this.flat };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, worker: best });
      slot.w.postMessage(msg);
    });
  }

  private onResult(r: GenResult): void {
    const p = this.pending.get(r.id);
    if (!p) return;
    this.pending.delete(r.id);
    const slot = this.workers[p.worker];
    if (slot) slot.busy--;
    p.resolve(r);
  }

  private onError(worker: number, e: ErrorEvent): void {
    for (const [id, p] of this.pending) {
      if (p.worker === worker) {
        this.pending.delete(id);
        p.reject(new Error(`generation worker failed: ${e.message}`));
      }
    }
  }

  dispose(): void {
    for (const { w } of this.workers) w.terminate();
    this.workers = [];
    for (const p of this.pending.values()) p.reject(new Error('worker pool disposed'));
    this.pending.clear();
  }
}

function defaultPoolSize(): number {
  const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4;
  return Math.max(1, Math.min(4, cores - 1));
}
