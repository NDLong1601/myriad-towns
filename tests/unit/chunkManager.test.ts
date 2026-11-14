import { describe, expect, it } from 'vitest';
import { type ChunkKey, chunkKey } from '@/core/coords';
import { ChunkManager } from '@/world/chunkManager';
import { InlineGenerator } from '@/world/genPool';

function setup(viewRadius = 2) {
  const loaded = new Set<ChunkKey>();
  const visible = new Set<ChunkKey>();
  let loads = 0;
  const mgr = new ChunkManager(
    1,
    new InlineGenerator(),
    {
      onChunkLoaded: (c) => {
        loads++;
        loaded.add(chunkKey(c.cx, c.cz));
      },
      onChunkUnloaded: (k) => {
        loaded.delete(k);
        visible.delete(k);
      },
      onChunkVisibility: (k, v) => (v ? visible.add(k) : visible.delete(k)),
    },
    { viewRadius },
  );
  return { mgr, loaded, visible, loads: () => loads };
}

/** Let generation promises resolve and the manager refill, until idle. */
async function settle(mgr: ChunkManager, center: { cx: number; cz: number }) {
  for (let i = 0; i < 200; i++) {
    mgr.update(center);
    await Promise.resolve();
    await Promise.resolve();
    if (mgr.stats().pending === 0 && mgr.isReady(mgr.loadRadius)) return;
  }
  throw new Error('chunk manager did not settle');
}

describe('ChunkManager', () => {
  it('loads the preload ring and shows only the view radius', async () => {
    const { mgr, loaded, visible } = setup(2);
    await settle(mgr, { cx: 0, cz: 0 });
    expect(loaded.size).toBe(7 * 7); // radius 3 (2 + preload 1)
    expect(visible.size).toBe(5 * 5); // radius 2
    expect(mgr.isReady()).toBe(true);
  });

  it('unloads far chunks when the center moves', async () => {
    const { mgr, loaded } = setup(2);
    await settle(mgr, { cx: 0, cz: 0 });
    await settle(mgr, { cx: 20, cz: 0 });
    for (const k of loaded) {
      const c = Math.floor(k / 2 ** 26) - 2 ** 25;
      expect(Math.abs(c - 20)).toBeLessThanOrEqual(mgr.unloadRadius);
    }
    expect(loaded.has(chunkKey(0, 0))).toBe(false);
  });

  it('hysteresis: wiggling across a border does not regenerate chunks', async () => {
    const { mgr, loads } = setup(2);
    await settle(mgr, { cx: 0, cz: 0 });
    await settle(mgr, { cx: 1, cz: 0 });
    const after = loads();
    for (let i = 0; i < 5; i++) {
      await settle(mgr, { cx: 0, cz: 0 });
      await settle(mgr, { cx: 1, cz: 0 });
    }
    expect(loads()).toBe(after);
  });

  it('memory stays bounded while travelling far', { timeout: 30_000 }, async () => {
    const { mgr, loaded } = setup(1);
    for (let x = 0; x <= 400; x += 40) await settle(mgr, { cx: x, cz: -x });
    const maxRing = 2 * mgr.unloadRadius + 1;
    expect(loaded.size).toBeLessThanOrEqual(maxRing * maxRing);
    expect(mgr.stats().loaded).toBe(loaded.size);
  });
});
