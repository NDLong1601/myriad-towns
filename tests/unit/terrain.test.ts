import { describe, expect, it } from 'vitest';
import { CHUNK_SIZE, localIndex, localToTile } from '@/core/coords';
import { BIOME_COUNT, Biome, TileFlag } from '@/world/biomes';
import { generateChunk, hashChunk } from '@/world/chunk';
import { MAX_LEVEL, SEA_LEVEL, sampleTile } from '@/world/terrain';
import { buildTerrainMesh } from '@/world/terrainMesh';

const SEED = 42;

describe('terrain generation', () => {
  it('chunk arrays equal the per-tile function (so chunk edges always match)', () => {
    for (const [cx, cz] of [
      [0, 0],
      [-1, 0],
      [3, -7],
    ] as const) {
      const c = generateChunk(SEED, cx, cz);
      for (let lz = 0; lz < CHUNK_SIZE; lz += 5) {
        for (let lx = 0; lx < CHUNK_SIZE; lx += 3) {
          const { x, z } = localToTile(cx, cz, lx, lz);
          const s = sampleTile(SEED, x, z);
          const i = localIndex(lx, lz);
          expect([c.level[i], c.biome[i], c.flags[i], c.resource[i]]).toEqual([
            s.level,
            s.biome,
            s.flags,
            s.resource,
          ]);
        }
      }
    }
  });

  it('neighbouring chunks agree on their shared border', () => {
    const a = generateChunk(SEED, 0, 0);
    const b = generateChunk(SEED, 1, 0);
    // The last column of a and the first column of b are adjacent world tiles: both must
    // equal sampleTile at their own coordinates (no duplicated or shifted column).
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      expect(a.level[localIndex(CHUNK_SIZE - 1, lz)]).toBe(sampleTile(SEED, 31, lz).level);
      expect(b.level[localIndex(0, lz)]).toBe(sampleTile(SEED, 32, lz).level);
    }
  });

  it('values stay in range', () => {
    const c = generateChunk(SEED, 5, 5);
    for (let i = 0; i < c.level.length; i++) {
      expect(c.level[i]).toBeLessThanOrEqual(MAX_LEVEL);
      expect(c.biome[i]).toBeLessThan(BIOME_COUNT);
      const water = ((c.flags[i] as number) & TileFlag.Water) !== 0;
      if (water) expect(c.level[i]).toBeLessThan(SEA_LEVEL);
      if (water) expect((c.flags[i] as number) & TileFlag.Tree).toBe(0);
    }
  });

  it('a large area has a sensible mix of biomes and water', () => {
    const counts = new Array<number>(BIOME_COUNT).fill(0);
    let water = 0;
    let n = 0;
    for (let x = -2000; x < 2000; x += 37) {
      for (let z = -2000; z < 2000; z += 37) {
        const s = sampleTile(SEED, x, z);
        counts[s.biome] = (counts[s.biome] ?? 0) + 1;
        if (s.flags & TileFlag.Water) water++;
        n++;
      }
    }
    expect(water / n).toBeGreaterThan(0.1);
    expect(water / n).toBeLessThan(0.45);
    for (const b of [
      Biome.Ocean,
      Biome.Temperate,
      Biome.Forest,
      Biome.Steppe,
      Biome.Cold,
      Biome.Mountain,
    ]) {
      expect((counts[b] ?? 0) / n).toBeGreaterThan(0.01);
    }
  });

  it('works far from the origin', () => {
    const c = generateChunk(SEED, 31_250, -31_250);
    expect(c.level.some((v) => v > 0)).toBe(true);
  });
});

describe('terrain mesh', () => {
  it('produces consistent buffers', () => {
    const c = generateChunk(SEED, 0, 0);
    const m = buildTerrainMesh(SEED, c);
    const verts = m.positions.length / 3;
    expect(m.normals.length).toBe(verts * 3);
    expect(m.colors.length).toBe(verts * 3);
    expect(m.indices.length % 3).toBe(0);
    for (const i of m.indices) expect(i).toBeLessThan(verts);
    // At least one top quad per tile.
    expect(m.indices.length / 3).toBeGreaterThanOrEqual(CHUNK_SIZE * CHUNK_SIZE * 2);
    // Everything stays inside the chunk footprint (decoration is jittered inside its tile).
    for (let i = 0; i < m.positions.length; i += 3) {
      expect(m.positions[i]).toBeGreaterThanOrEqual(0);
      expect(m.positions[i]).toBeLessThanOrEqual(CHUNK_SIZE);
      expect(m.positions[i + 2]).toBeGreaterThanOrEqual(0);
      expect(m.positions[i + 2]).toBeLessThanOrEqual(CHUNK_SIZE);
    }
  });
});

// If this fails, generation output changed: every existing world changes. Only update the
// snapshot together with a GEN_VERSION bump (src/core/version.ts).
describe('golden (generation stability)', () => {
  it('9 chunks around the origin', () => {
    const hashes: string[] = [];
    for (let cz = -1; cz <= 1; cz++) {
      for (let cx = -1; cx <= 1; cx++) {
        hashes.push(`${cx},${cz}:${hashChunk(generateChunk(SEED, cx, cz))}`);
      }
    }
    expect(hashes).toMatchInlineSnapshot(`
      [
        "-1,-1:968379863",
        "0,-1:40084060",
        "1,-1:282014366",
        "-1,0:1156696876",
        "0,0:147666414",
        "1,0:3686196559",
        "-1,1:982368543",
        "0,1:1327883185",
        "1,1:3595456727",
      ]
    `);
  });
});
