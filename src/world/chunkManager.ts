import {
  type ChunkCoord,
  type ChunkKey,
  chunkKey,
  chunkRingDistance,
  chunksInRadius,
  unpackChunkKey,
} from '@/core/coords';
import type { ChunkData } from './chunk';
import type { ChunkGenerator } from './genPool';
import type { MeshArrays } from './terrainMesh';

export interface ChunkManagerOptions {
  /** Chunks within this Chebyshev radius of the center are shown. */
  viewRadius: number;
  /** Chunks are generated up to viewRadius + preload. Default 1. */
  preload?: number;
  /** Chunks beyond viewRadius + unloadMargin are dropped. Must be > preload. Default 2. */
  unloadMargin?: number;
}

export interface ChunkListener {
  /** A chunk finished generating. The mesh arrays are handed over; the listener owns them. */
  onChunkLoaded(chunk: ChunkData, mesh: MeshArrays): void;
  onChunkUnloaded(key: ChunkKey, coord: ChunkCoord): void;
  /** Called when visibility changes; visible = within viewRadius. */
  onChunkVisibility(key: ChunkKey, visible: boolean): void;
}

export interface ChunkStats {
  loaded: number;
  pending: number;
  visible: number;
  generated: number;
  /** Average worker time per chunk, ms. */
  avgGenMs: number;
}

/**
 * Keeps the set of generated chunks around a moving center (the camera target).
 * Load ring R+preload, unload beyond R+unloadMargin: the gap is hysteresis so a camera
 * moving back and forth across a chunk border does not regenerate chunks.
 */
export class ChunkManager {
  readonly viewRadius: number;
  readonly loadRadius: number;
  readonly unloadRadius: number;
  private chunks = new Map<ChunkKey, { data: ChunkData; visible: boolean }>();
  private pending = new Set<ChunkKey>();
  private center: ChunkCoord = { cx: 0, cz: 0 };
  private generated = 0;
  private genMsTotal = 0;
  private disposed = false;

  constructor(
    private readonly seed: number,
    private readonly generator: ChunkGenerator,
    private readonly listener: ChunkListener,
    opts: ChunkManagerOptions,
  ) {
    this.viewRadius = opts.viewRadius;
    this.loadRadius = opts.viewRadius + (opts.preload ?? 1);
    this.unloadRadius = opts.viewRadius + (opts.unloadMargin ?? 2);
    if (this.unloadRadius <= this.loadRadius)
      throw new RangeError('unloadMargin must exceed preload');
  }

  /** Call every frame (cheap when the center chunk has not changed and nothing is queued). */
  update(center: ChunkCoord): void {
    const moved = center.cx !== this.center.cx || center.cz !== this.center.cz;
    this.center = center;
    if (moved) {
      for (const [key, entry] of this.chunks) {
        const d = chunkRingDistance(unpackChunkKey(key), center);
        if (d > this.unloadRadius) {
          this.chunks.delete(key);
          this.listener.onChunkUnloaded(key, { cx: entry.data.cx, cz: entry.data.cz });
          continue;
        }
        const visible = d <= this.viewRadius;
        if (visible !== entry.visible) {
          entry.visible = visible;
          this.listener.onChunkVisibility(key, visible);
        }
      }
    }
    this.fill();
  }

  /** Queue missing chunks, nearest first, keeping the generator busy but not flooded. */
  private fill(): void {
    const budget = this.generator.parallelism * 2;
    if (this.pending.size >= budget) return;
    for (const c of chunksInRadius(this.center, this.loadRadius)) {
      if (this.pending.size >= budget) break;
      const key = chunkKey(c.cx, c.cz);
      if (this.chunks.has(key) || this.pending.has(key)) continue;
      this.pending.add(key);
      this.generator.request(this.seed, c.cx, c.cz).then(
        (r) => this.onGenerated(key, r.chunk, r.mesh, r.ms),
        (err: unknown) => {
          this.pending.delete(key);
          if (!this.disposed) console.error(err);
        },
      );
    }
  }

  private onGenerated(key: ChunkKey, data: ChunkData, mesh: MeshArrays, ms: number): void {
    this.pending.delete(key);
    if (this.disposed) return;
    this.generated++;
    this.genMsTotal += ms;
    const d = chunkRingDistance({ cx: data.cx, cz: data.cz }, this.center);
    if (d <= this.unloadRadius) {
      const visible = d <= this.viewRadius;
      this.chunks.set(key, { data, visible });
      this.listener.onChunkLoaded(data, mesh);
      this.listener.onChunkVisibility(key, visible);
    }
    this.fill();
  }

  get(key: ChunkKey): ChunkData | undefined {
    return this.chunks.get(key)?.data;
  }

  /** True when every chunk within `radius` of the center is loaded. */
  isReady(radius = this.viewRadius): boolean {
    for (const c of chunksInRadius(this.center, radius)) {
      if (!this.chunks.has(chunkKey(c.cx, c.cz))) return false;
    }
    return true;
  }

  stats(): ChunkStats {
    let visible = 0;
    for (const e of this.chunks.values()) if (e.visible) visible++;
    return {
      loaded: this.chunks.size,
      pending: this.pending.size,
      visible,
      generated: this.generated,
      avgGenMs: this.generated ? this.genMsTotal / this.generated : 0,
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const [key, e] of this.chunks)
      this.listener.onChunkUnloaded(key, { cx: e.data.cx, cz: e.data.cz });
    this.chunks.clear();
    this.pending.clear();
  }
}
