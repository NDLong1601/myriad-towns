import './debugOverlay.css';
import type * as THREE from 'three';
import vi from '../../data/i18n/vi.json';

export interface FrameStats {
  fps: number;
  avgMs: number;
  p95Ms: number;
  worstMs: number;
}

/**
 * Calculates FPS and frame time statistics (avg, p95, worst) from sample frame durations in ms.
 *
 * @param samples Array or typed array of frame durations in ms.
 * @param count Number of valid samples in the array to consider (0 .. count - 1).
 * @param elapsedMs Optional total elapsed wall-clock duration in ms. If not provided or <= 0, sum of samples is used.
 */
export function computeFrameStats(
  samples: ArrayLike<number>,
  count: number,
  elapsedMs?: number,
): FrameStats {
  if (count <= 0) {
    return { fps: 0, avgMs: 0, p95Ms: 0, worstMs: 0 };
  }

  let sum = 0;
  let worst = 0;
  for (let i = 0; i < count; i++) {
    const s = samples[i]!;
    sum += s;
    if (s > worst) worst = s;
  }

  const avg = sum / count;
  const durationSec = (elapsedMs !== undefined && elapsedMs > 0 ? elapsedMs : sum) / 1000;
  const fps = durationSec > 0 ? count / durationSec : 0;

  const sorted = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sorted[i] = samples[i]!;
  }
  sorted.sort();

  const p95Index = Math.min(Math.max(0, Math.ceil(count * 0.95) - 1), count - 1);
  const p95 = sorted[p95Index] ?? worst;

  return {
    fps,
    avgMs: avg,
    p95Ms: p95,
    worstMs: worst,
  };
}

/**
 * Pre-allocated ring/buffer tracker to record frame durations without per-frame heap allocations.
 */
export class FrameTracker {
  private readonly buffer: Float32Array;
  private count = 0;
  private sumMs = 0;
  private worstMs = 0;

  constructor(capacity = 1024) {
    this.buffer = new Float32Array(capacity);
  }

  record(dtMs: number): void {
    if (this.count < this.buffer.length) {
      this.buffer[this.count] = dtMs;
    }
    this.count++;
    this.sumMs += dtMs;
    if (dtMs > this.worstMs) {
      this.worstMs = dtMs;
    }
  }

  compute(elapsedMs?: number): FrameStats {
    const validCount = Math.min(this.count, this.buffer.length);
    const stats = computeFrameStats(this.buffer, validCount, elapsedMs);
    if (this.worstMs > stats.worstMs) {
      stats.worstMs = this.worstMs;
    }
    return stats;
  }

  reset(): void {
    this.count = 0;
    this.sumMs = 0;
    this.worstMs = 0;
  }

  get currentCount(): number {
    return this.count;
  }
}

export interface DebugOverlayHandle {
  toggle(): void;
  dispose(): void;
}

export interface DebugOverlayOptions {
  getStats?: () => {
    visible?: number;
    loaded?: number;
    pending?: number;
    avgGenMs?: number;
  };
  labels?: Record<string, string>;
}

function getMemoryMb(): string {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const mem = (performance as { memory?: { usedJSHeapSize?: number } }).memory;
    if (mem && typeof mem.usedJSHeapSize === 'number') {
      return `${(mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
  return 'n/a';
}

/**
 * Mounts the F3 debug overlay to the specified parent element.
 */
export function mountDebugOverlay(
  renderer: THREE.WebGLRenderer,
  parent: HTMLElement,
  options?: DebugOverlayOptions,
): DebugOverlayHandle {
  const urlParams =
    typeof window !== 'undefined' && window.location
      ? new URLSearchParams(window.location.search)
      : null;
  let isVisible = urlParams ? urlParams.get('debug') === '1' : false;

  const el = document.createElement('div');
  el.id = 'debug-overlay';
  el.className = 'debug-overlay' + (isVisible ? '' : ' hidden');
  el.setAttribute('aria-live', 'polite');
  parent.appendChild(el);

  const labels = options?.labels ?? (vi as Record<string, string>);
  const tracker = new FrameTracker();
  let animId = 0;
  let lastTime = typeof performance !== 'undefined' ? performance.now() : 0;
  let lastTickTime = lastTime;

  function updateText() {
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    const elapsed = now - lastTickTime;
    const stats = tracker.compute(elapsed > 0 ? elapsed : undefined);
    tracker.reset();
    lastTickTime = now;

    const calls = renderer.info.render.calls;
    const triangles = renderer.info.render.triangles;
    const geometries = renderer.info.memory.geometries;
    const textures = renderer.info.memory.textures;

    const chunkStats =
      options?.getStats?.() ??
      (typeof window !== 'undefined' ? window.__MYRIAD__?.stats() : undefined);
    const visibleChunks = chunkStats?.visible ?? 0;
    const loadedChunks = chunkStats?.loaded ?? 0;
    const pendingChunks = chunkStats?.pending ?? 0;
    const avgGenMs = chunkStats?.avgGenMs ?? 0;

    const memMb = getMemoryMb();

    el.textContent = [
      `${labels['debug.fps'] ?? 'FPS'}: ${Math.round(stats.fps)}`,
      `${labels['debug.frameTime'] ?? 'Thời gian khung'}: ${stats.avgMs.toFixed(1)} ms (p95: ${stats.p95Ms.toFixed(1)} ms, worst: ${stats.worstMs.toFixed(1)} ms)`,
      `${labels['debug.drawCalls'] ?? 'Draw call'}: ${calls}`,
      `${labels['debug.triangles'] ?? 'Tam giác'}: ${triangles.toLocaleString('en-US')}`,
      `${labels['debug.geometries'] ?? 'Hình học'}: ${geometries}`,
      `${labels['debug.textures'] ?? 'Họa tiết'}: ${textures}`,
      `${labels['debug.chunks'] ?? 'Chunk (thấy/tải/chờ)'}: ${visibleChunks}/${loadedChunks}/${pendingChunks}`,
      `${labels['debug.chunkGen'] ?? 'Tạo chunk TB'}: ${avgGenMs.toFixed(1)} ms`,
      `${labels['debug.memory'] ?? 'Bộ nhớ JS'}: ${memMb}`,
    ].join('\n');
  }

  function onFrame(now: number) {
    animId = requestAnimationFrame(onFrame);
    const dt = now - lastTime;
    lastTime = now;
    tracker.record(dt);

    if (now - lastTickTime >= 500) {
      if (isVisible) {
        updateText();
      } else {
        tracker.reset();
        lastTickTime = now;
      }
    } else if (isVisible && el.textContent === '') {
      updateText();
    }
  }

  function toggle() {
    isVisible = !isVisible;
    if (isVisible) {
      el.classList.remove('hidden');
      updateText();
    } else {
      el.classList.add('hidden');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'F3' || e.code === 'F3') {
      e.preventDefault();
      toggle();
    }
  }

  window.addEventListener('keydown', onKeyDown);
  animId = requestAnimationFrame(onFrame);

  function dispose() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = 0;
    }
    window.removeEventListener('keydown', onKeyDown);
    el.remove();
  }

  return { toggle, dispose };
}
