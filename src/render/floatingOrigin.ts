import { CHUNK_SIZE } from '@/core/coords';

/**
 * World positions are float64 tile coordinates (JS numbers). three.js uses float32 on the GPU,
 * which loses precision far from 0 (jitter at ~10⁶). So everything is rendered relative to an
 * origin that jumps (in whole chunks) to follow the camera once it gets far enough away.
 */
export class FloatingOrigin {
  /** Current origin in world tiles; always a multiple of CHUNK_SIZE. */
  x = 0;
  z = 0;
  private listeners: (() => void)[] = [];

  /** Re-center when the focus is more than this many tiles from the origin. */
  constructor(readonly threshold = 1024) {}

  toLocal(wx: number, wz: number): { x: number; z: number } {
    return { x: wx - this.x, z: wz - this.z };
  }

  toWorld(lx: number, lz: number): { x: number; z: number } {
    return { x: lx + this.x, z: lz + this.z };
  }

  /** Returns true if the origin moved; listeners must re-place their objects. */
  follow(wx: number, wz: number): boolean {
    if (Math.abs(wx - this.x) <= this.threshold && Math.abs(wz - this.z) <= this.threshold)
      return false;
    this.x = Math.floor(wx / CHUNK_SIZE) * CHUNK_SIZE;
    this.z = Math.floor(wz / CHUNK_SIZE) * CHUNK_SIZE;
    for (const l of this.listeners) l();
    return true;
  }

  onShift(fn: () => void): void {
    this.listeners.push(fn);
  }
}
