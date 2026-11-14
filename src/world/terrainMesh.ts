/**
 * Builds the render mesh of one chunk as plain typed arrays (no three.js), so it can run in a
 * worker and be transferred. Blocky terraces: each tile is a flat top at its level; vertical
 * walls are emitted only where a neighbour is lower, including neighbours in other chunks
 * (sampled from the generator, so there are no seams). Trees and rocks are merged into the same
 * mesh: static decoration costs no extra draw calls.
 *
 * Coordinates are local to the chunk: x, z in [0, CHUNK_SIZE], y up. One tile = 1 unit.
 */
import { CHUNK_SIZE, localIndex, localToTile } from '@/core/coords';
import { hash32, hashFloat, Purpose } from '@/core/prng';
import { Biome, TileFlag } from './biomes';
import type { ChunkData } from './chunk';
import { SEA_LEVEL, SNOW_LEVEL, sampleTile } from './terrain';

/** World units per height level. */
export const LEVEL_HEIGHT = 0.5;
/** Water surface sits a little below the sea-level ground so shores read clearly. */
export const WATER_Y = SEA_LEVEL * LEVEL_HEIGHT - 0.2;
/**
 * Flat land (the default): every land tile stands at shore level, so roads, buildings and vehicles
 * never sit on a step. Hills and mountains stay in the game rules and in the colours (rock, snow),
 * only their height is not drawn. Each thread (main, every worker) sets this once at start.
 */
let flatLand = true;
export function setFlatTerrain(flat: boolean): void {
  flatLand = flat;
}
/** Height of the ground at a land tile of height `level`. */
export function landY(level: number): number {
  return (flatLand ? SEA_LEVEL : level) * LEVEL_HEIGHT;
}
/** Lowest y any wall goes down to (sea bed). */
const FLOOR_Y = -0.5;

export interface MeshArrays {
  positions: Float32Array;
  normals: Int8Array;
  colors: Uint8Array;
  indices: Uint32Array;
}

export function meshBuffers(m: MeshArrays): ArrayBuffer[] {
  return [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer] as ArrayBuffer[];
}

type RGB = readonly [number, number, number];
const BIOME_COLOR: Record<number, RGB> = {
  [Biome.Ocean]: [64, 132, 178],
  [Biome.Beach]: [226, 208, 158],
  [Biome.Temperate]: [126, 176, 98],
  [Biome.Forest]: [92, 150, 80],
  [Biome.Steppe]: [196, 186, 112],
  [Biome.Cold]: [206, 220, 222],
  [Biome.Mountain]: [140, 138, 132],
  [Biome.Ruins]: [158, 150, 128],
};
const SNOW: RGB = [240, 244, 246];
const RIVER: RGB = [86, 160, 200];
const DIRT: RGB = [138, 112, 82];
const ROCK: RGB = [120, 118, 112];
const TRUNK: RGB = [110, 80, 52];
const LEAF: Record<number, RGB> = {
  [Biome.Forest]: [58, 116, 62],
  [Biome.Temperate]: [76, 136, 70],
  [Biome.Cold]: [52, 96, 78],
  [Biome.Steppe]: [120, 140, 70],
  [Biome.Ruins]: [96, 120, 74],
};

/**
 * Palette colours are written in sRGB (what an artist picks); three.js expects vertex colours
 * in linear space, so convert once through a lookup table.
 */
const SRGB_TO_LINEAR = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  const lin = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  SRGB_TO_LINEAR[i] = Math.round(lin * 255);
}

class Builder {
  pos: number[] = [];
  nrm: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  quad(
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number,
    dx: number,
    dy: number,
    dz: number,
    n: readonly [number, number, number],
    c: RGB,
  ): void {
    const base = this.pos.length / 3;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    for (let k = 0; k < 4; k++) {
      this.nrm.push(n[0] * 127, n[1] * 127, n[2] * 127);
      this.col.push(lin(c[0]), lin(c[1]), lin(c[2]));
    }
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  tri(a: readonly number[], b: readonly number[], c: readonly number[], col: RGB): void {
    // Flat normal from the triangle itself.
    const ux = (b[0] as number) - (a[0] as number);
    const uy = (b[1] as number) - (a[1] as number);
    const uz = (b[2] as number) - (a[2] as number);
    const vx = (c[0] as number) - (a[0] as number);
    const vy = (c[1] as number) - (a[1] as number);
    const vz = (c[2] as number) - (a[2] as number);
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    const base = this.pos.length / 3;
    for (const p of [a, b, c]) {
      this.pos.push(p[0] as number, p[1] as number, p[2] as number);
      this.nrm.push(nx * 127, ny * 127, nz * 127);
      this.col.push(lin(col[0]), lin(col[1]), lin(col[2]));
    }
    this.idx.push(base, base + 1, base + 2);
  }

  /** Axis-aligned box from (x0,y0,z0) to (x1,y1,z1), without the bottom face. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: RGB): void {
    this.quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0, [0, 1, 0], c);
    this.quad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, [0, 0, 1], c);
    this.quad(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0, [0, 0, -1], c);
    this.quad(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1, [1, 0, 0], c);
    this.quad(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0, [-1, 0, 0], c);
  }

  /** Four-sided pyramid with apex at (x, yTop, z). */
  pyramid(x: number, y0: number, yTop: number, z: number, r: number, c: RGB): void {
    const a = [x - r, y0, z - r];
    const b = [x + r, y0, z - r];
    const cc = [x + r, y0, z + r];
    const d = [x - r, y0, z + r];
    const t = [x, yTop, z];
    this.tri(d, cc, t, c);
    this.tri(cc, b, t, c);
    this.tri(b, a, t, c);
    this.tri(a, d, t, c);
  }

  finish(): MeshArrays {
    return {
      positions: new Float32Array(this.pos),
      normals: new Int8Array(this.nrm),
      colors: new Uint8Array(this.col),
      indices: new Uint32Array(this.idx),
    };
  }
}

function lin(v: number): number {
  return SRGB_TO_LINEAR[v] as number;
}

function shade(c: RGB, f: number): RGB {
  return [
    Math.min(255, Math.round(c[0] * f)),
    Math.min(255, Math.round(c[1] * f)),
    Math.min(255, Math.round(c[2] * f)),
  ];
}

/** Top surface y of a tile; water tiles render at the water surface. */
function surfaceY(level: number, water: boolean): number {
  return water ? WATER_Y : landY(level);
}

export function buildTerrainMesh(seed: number, chunk: ChunkData): MeshArrays {
  const S = CHUNK_SIZE;
  const b = new Builder();

  // Surface heights with a one-tile apron from neighbouring chunks.
  const W = S + 2;
  const apron = new Float32Array(W * W);
  for (let az = 0; az < W; az++) {
    for (let ax = 0; ax < W; ax++) {
      const lx = ax - 1;
      const lz = az - 1;
      let y: number;
      if (lx >= 0 && lx < S && lz >= 0 && lz < S) {
        const i = localIndex(lx, lz);
        y = surfaceY(chunk.level[i] as number, ((chunk.flags[i] as number) & TileFlag.Water) !== 0);
      } else if ((lx < 0 || lx >= S) && (lz < 0 || lz >= S)) {
        y = 0; // corners are never needed
      } else {
        const { x, z } = localToTile(chunk.cx, chunk.cz, lx, lz);
        const s = sampleTile(seed, x, z);
        y = surfaceY(s.level, (s.flags & TileFlag.Water) !== 0);
      }
      apron[az * W + ax] = y;
    }
  }
  const yAt = (lx: number, lz: number): number => apron[(lz + 1) * W + (lx + 1)] as number;

  for (let lz = 0; lz < S; lz++) {
    for (let lx = 0; lx < S; lx++) {
      const i = localIndex(lx, lz);
      const level = chunk.level[i] as number;
      const flags = chunk.flags[i] as number;
      const biome = chunk.biome[i] as number;
      const water = (flags & TileFlag.Water) !== 0;
      const { x, z } = localToTile(chunk.cx, chunk.cz, lx, lz);
      const y = yAt(lx, lz);

      // Top colour: biome, snow on peaks, deeper water darker, small per-tile variation.
      let top: RGB;
      if (water) {
        top =
          flags & TileFlag.River
            ? RIVER
            : shade(BIOME_COLOR[Biome.Ocean] as RGB, 0.75 + level * 0.06);
      } else if (level >= SNOW_LEVEL) {
        top = SNOW;
      } else {
        top = shade(BIOME_COLOR[biome] as RGB, 0.94 + (hash32(seed, x, z) % 13) / 100);
      }
      b.quad(lx, y, lz, lx, y, lz + 1, lx + 1, y, lz + 1, lx + 1, y, lz, [0, 1, 0], top);

      // Walls toward lower neighbours (+x, -x, +z, -z).
      const side = water
        ? shade(BIOME_COLOR[Biome.Ocean] as RGB, 0.6)
        : level >= SNOW_LEVEL - 1
          ? ROCK
          : DIRT;
      const nE = yAt(lx + 1, lz);
      if (nE < y)
        b.quad(
          lx + 1,
          Math.max(nE, FLOOR_Y),
          lz + 1,
          lx + 1,
          Math.max(nE, FLOOR_Y),
          lz,
          lx + 1,
          y,
          lz,
          lx + 1,
          y,
          lz + 1,
          [1, 0, 0],
          shade(side, 0.92),
        );
      const nW = yAt(lx - 1, lz);
      if (nW < y)
        b.quad(
          lx,
          Math.max(nW, FLOOR_Y),
          lz,
          lx,
          Math.max(nW, FLOOR_Y),
          lz + 1,
          lx,
          y,
          lz + 1,
          lx,
          y,
          lz,
          [-1, 0, 0],
          shade(side, 0.92),
        );
      const nS = yAt(lx, lz + 1);
      if (nS < y)
        b.quad(
          lx,
          Math.max(nS, FLOOR_Y),
          lz + 1,
          lx + 1,
          Math.max(nS, FLOOR_Y),
          lz + 1,
          lx + 1,
          y,
          lz + 1,
          lx,
          y,
          lz + 1,
          [0, 0, 1],
          side,
        );
      const nN = yAt(lx, lz - 1);
      if (nN < y)
        b.quad(
          lx + 1,
          Math.max(nN, FLOOR_Y),
          lz,
          lx,
          Math.max(nN, FLOOR_Y),
          lz,
          lx,
          y,
          lz,
          lx + 1,
          y,
          lz,
          [0, 0, -1],
          side,
        );

      // Decoration, jittered inside the tile.
      const jx = lx + 0.35 + hashFloat(seed, Purpose.Decoration, x, z, 1) * 0.3;
      const jz = lz + 0.35 + hashFloat(seed, Purpose.Decoration, x, z, 2) * 0.3;
      if (flags & TileFlag.Tree) {
        const h = 0.9 + hashFloat(seed, Purpose.Trees, x, z, 3) * 0.7;
        const leaf = shade(
          (LEAF[biome] ?? LEAF[Biome.Temperate]) as RGB,
          0.9 + hashFloat(seed, Purpose.Trees, x, z, 4) * 0.2,
        );
        b.box(jx - 0.06, y, jz - 0.06, jx + 0.06, y + 0.25, jz + 0.06, TRUNK);
        if (biome === Biome.Cold || biome === Biome.Forest) {
          b.pyramid(jx, y + 0.2, y + 0.25 + h, jz, 0.32, leaf); // conifer
        } else {
          b.box(jx - 0.25, y + 0.25, jz - 0.25, jx + 0.25, y + 0.25 + h * 0.6, jz + 0.25, leaf); // broadleaf block
        }
      } else if (flags & TileFlag.Rock) {
        const r = 0.15 + hashFloat(seed, Purpose.Decoration, x, z, 5) * 0.15;
        b.box(jx - r, y, jz - r * 0.8, jx + r, y + r * 1.1, jz + r * 0.8, shade(ROCK, 1.1));
      }
    }
  }
  return b.finish();
}
