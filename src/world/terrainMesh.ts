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
import { simplex2 } from '@/core/noise';
import { hash32, hashFloat, Purpose } from '@/core/prng';
import { Biome, Resource, TileFlag } from './biomes';
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
  water: Uint8Array;
  indices: Uint32Array;
}

export function meshBuffers(m: MeshArrays): ArrayBuffer[] {
  return [
    m.positions.buffer,
    m.normals.buffer,
    m.colors.buffer,
    m.water.buffer,
    m.indices.buffer,
  ] as ArrayBuffer[];
}

type RGB = readonly [number, number, number];
type Point = readonly [x: number, y: number, z: number];
const OCTAGON = [
  [1, 0],
  [0.707, 0.707],
  [0, 1],
  [-0.707, 0.707],
  [-1, 0],
  [-0.707, -0.707],
  [0, -1],
  [0.707, -0.707],
] as const;

function ring(x: number, y: number, z: number, rx: number, rz: number): Point[] {
  return OCTAGON.map(([dx, dz]) => [x + dx * rx, y, z + dz * rz]);
}

const BIOME_COLOR: Record<number, RGB> = {
  [Biome.Ocean]: [53, 106, 122],
  [Biome.Beach]: [207, 188, 145],
  [Biome.Temperate]: [143, 166, 106],
  [Biome.Forest]: [113, 143, 97],
  [Biome.Steppe]: [180, 168, 113],
  [Biome.Cold]: [206, 220, 222],
  [Biome.Mountain]: [140, 138, 132],
  [Biome.Ruins]: [158, 150, 128],
};
const SNOW: RGB = [240, 244, 246];
const SHALLOWS: RGB = [106, 157, 150];
const DIRT: RGB = [138, 112, 82];
const ROCK: RGB = [120, 118, 112];
const TRUNK: RGB = [110, 80, 52];
const RESOURCE_COLOR: Partial<Record<number, RGB>> = {
  [Resource.Iron]: [137, 105, 96],
  [Resource.Coal]: [104, 101, 93],
  [Resource.Clay]: [173, 121, 87],
  [Resource.Stone]: [158, 152, 134],
  [Resource.FertileSoil]: [129, 151, 97],
};
const ORE_ROCK_COLOR: Partial<Record<number, RGB>> = {
  [Resource.Coal]: [66, 71, 79],
};

export function hasDepositModel(resource: number): boolean {
  return resource === Resource.Stone || resource === Resource.Clay || resource === Resource.Iron;
}
const LEAF: Record<number, RGB> = {
  [Biome.Forest]: [66, 104, 75],
  [Biome.Temperate]: [93, 130, 82],
  [Biome.Cold]: [50, 104, 84],
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
  waterQuads: number[] = [];
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
    water?: readonly [RGB, RGB, RGB, RGB],
  ): void {
    const base = this.pos.length / 3;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    for (let k = 0; k < 4; k++) {
      this.nrm.push(n[0] * 127, n[1] * 127, n[2] * 127);
      const color = water?.[k] ?? c;
      this.col.push(lin(color[0]), lin(color[1]), lin(color[2]));
    }
    if (water) this.waterQuads.push(base);
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

  band(outer: readonly Point[], inner: readonly Point[], color: RGB): void {
    for (let i = 0; i < outer.length; i++) {
      const next = (i + 1) % outer.length;
      const a = outer[i] as Point;
      const b = inner[i] as Point;
      const c = inner[next] as Point;
      this.tri(a, b, c, color);
      this.tri(a, c, outer[next] as Point, color);
    }
  }

  cap(rim: readonly Point[], center: Point, color: RGB): void {
    for (let i = 0; i < rim.length; i++)
      this.tri(center, rim[(i + 1) % rim.length] as Point, rim[i] as Point, color);
  }

  finish(): MeshArrays {
    const water = new Uint8Array(this.pos.length / 3);
    for (const base of this.waterQuads) water.fill(1, base, base + 4);
    return {
      positions: new Float32Array(this.pos),
      normals: new Int8Array(this.nrm),
      colors: new Uint8Array(this.col),
      water,
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

const HEXAGON = [
  [1, 0],
  [0.5, 0.866],
  [-0.5, 0.866],
  [-1, 0],
  [-0.5, -0.866],
  [0.5, -0.866],
] as const;

function treeRing(x: number, y: number, z: number, rx: number, rz: number): Point[] {
  return HEXAGON.map(([dx, dz]) => [x + dx * rx, y, z + dz * rz]);
}

function crown(
  b: Builder,
  x: number,
  y: number,
  z: number,
  rx: number,
  rz: number,
  h: number,
  leaf: RGB,
): void {
  const rim = treeRing(x, y, z, rx, rz);
  const top = treeRing(x - rx * 0.09, y + h * 0.55, z, rx * 0.61, rz * 0.65);
  b.band(rim, top, leaf);
  b.cap(top, [x, y + h * 0.72, z], shade(leaf, 1.1));
  b.cap(rim.reverse(), [x, y - h * 0.74, z], shade(leaf, 0.88));
}

function stoneDeposit(b: Builder, x: number, y: number, z: number): void {
  for (const [dx, dz, width, depth, height] of [
    [-0.13, -0.06, 0.23, 0.22, 0.23],
    [0.21, 0.09, 0.16, 0.19, 0.145],
    [-0.15, 0.24, 0.125, 0.125, 0.1],
  ] as const) {
    const cx = x + dx;
    const cz = z + dz;
    const skirt = ring(cx, y, cz, width * 0.82, depth * 0.82);
    const body = ring(cx, y + height * 0.44, cz, width, depth);
    const crown = ring(cx + width * 0.16, y + height, cz - depth * 0.27, width * 0.52, depth * 0.5);
    b.band(skirt, body, [140, 140, 132]);
    b.band(body, crown, [185, 184, 170]);
    b.cap(crown, [cx + width * 0.3, y + height + 0.03, cz - depth * 0.29], [207, 204, 188]);
  }
}

function clayDeposit(b: Builder, x: number, y: number, z: number): void {
  const bank = ring(x, y, z, 0.46, 0.41);
  const rim = ring(x, y + 0.14, z, 0.35, 0.31);
  const cut = ring(x - 0.025, y + 0.073, z, 0.27, 0.225);
  const bed = ring(x - 0.045, y + 0.012, z + 0.01, 0.185, 0.14);
  b.band(bank, rim, [182, 102, 65]);
  b.band(rim, cut, [216, 131, 83]);
  b.band(cut, bed, [162, 81, 53]);
  b.cap(bed, [x - 0.045, y + 0.012, z + 0.01], [109, 58, 44]);
}

function ironDeposit(b: Builder, x: number, y: number, z: number): void {
  for (const [dx, dz, width, depth, height] of [
    [-0.15, 0.08, 0.105, 0.13, 0.4],
    [0.015, -0.085, 0.145, 0.19, 0.72],
    [0.17, 0.12, 0.107, 0.12, 0.51],
  ] as const) {
    const cx = x + dx;
    const cz = z + dz;
    const foot = ring(cx, y, cz, width, depth);
    const vein = ring(cx - height * 0.075, y + height * 0.55, cz, width * 0.88, depth * 0.91);
    const crest = ring(
      cx - height * 0.19,
      y + height,
      cz - depth * 0.25,
      width * 0.3,
      depth * 0.46,
    );
    b.band(foot, vein, [73, 76, 86]);
    b.band(vein, crest, [157, 87, 70]);
    b.cap(crest, [cx - height * 0.19, y + height + 0.09, cz - depth * 0.45], [96, 93, 101]);
  }
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
  const depths = new Int8Array(W * W);
  for (let az = 0; az < W; az++) {
    for (let ax = 0; ax < W; ax++) {
      const lx = ax - 1;
      const lz = az - 1;
      let level: number;
      let flags: number;
      if (lx >= 0 && lx < S && lz >= 0 && lz < S) {
        const i = localIndex(lx, lz);
        level = chunk.level[i] as number;
        flags = chunk.flags[i] as number;
      } else {
        const { x, z } = localToTile(chunk.cx, chunk.cz, lx, lz);
        const s = sampleTile(seed, x, z);
        level = s.level;
        flags = s.flags;
      }
      const water = (flags & TileFlag.Water) !== 0;
      apron[az * W + ax] = surfaceY(level, water);
      depths[az * W + ax] = !water
        ? -1
        : flags & TileFlag.River
          ? 2
          : Math.max(0, SEA_LEVEL - level);
    }
  }
  const yAt = (lx: number, lz: number): number => apron[(lz + 1) * W + (lx + 1)] as number;
  // The four tiles meeting at a water vertex determine its colour. Every copy of a
  // shared vertex sees the same neighbours, including on a diagonal chunk boundary.
  const shore = new Array<RGB | undefined>((S + 1) ** 2);
  const waterAt = (lx: number, lz: number): RGB => {
    const key = lz * (S + 1) + lx;
    const hit = shore[key];
    if (hit) return hit;
    const i = lz * W + lx;
    let dry = 0;
    let depth = 0;
    for (const j of [i, i + 1, i + W, i + W + 1]) {
      const d = depths[j] as number;
      if (d < 0) dry++;
      else depth += d;
    }
    const shallow = dry ? 0.79 + dry * 0.05 : Math.max(0, 0.46 - depth * 0.035);
    const deep = BIOME_COLOR[Biome.Ocean] as RGB;
    return (shore[key] = [
      Math.round(deep[0] + (SHALLOWS[0] - deep[0]) * shallow),
      Math.round(deep[1] + (SHALLOWS[1] - deep[1]) * shallow),
      Math.round(deep[2] + (SHALLOWS[2] - deep[2]) * shallow),
    ]);
  };

  for (let lz = 0; lz < S; lz++) {
    for (let lx = 0; lx < S; lx++) {
      const i = localIndex(lx, lz);
      const level = chunk.level[i] as number;
      const flags = chunk.flags[i] as number;
      const biome = chunk.biome[i] as number;
      const water = (flags & TileFlag.Water) !== 0;
      const { x, z } = localToTile(chunk.cx, chunk.cz, lx, lz);
      const y = yAt(lx, lz);

      const res = chunk.resource[i] as number;
      const base =
        level >= SNOW_LEVEL ? SNOW : (RESOURCE_COLOR[res] ?? (BIOME_COLOR[biome] as RGB));
      const top = water
        ? base
        : shade(base, 1 + simplex2(seed ^ 0x3d3c, x * 0.065, z * 0.065) * 0.05);
      b.quad(
        lx,
        y,
        lz,
        lx,
        y,
        lz + 1,
        lx + 1,
        y,
        lz + 1,
        lx + 1,
        y,
        lz,
        [0, 1, 0],
        top,
        water
          ? [waterAt(lx, lz), waterAt(lx, lz + 1), waterAt(lx + 1, lz + 1), waterAt(lx + 1, lz)]
          : undefined,
      );

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

      if (water || flags & TileFlag.Covered) continue;
      // Decoration, jittered inside the tile.
      const jx = lx + 0.35 + hashFloat(seed, Purpose.Decoration, x, z, 1) * 0.3;
      const jz = lz + 0.35 + hashFloat(seed, Purpose.Decoration, x, z, 2) * 0.3;
      const deposit = hasDepositModel(res);
      const exposed =
        deposit &&
        !(flags & TileFlag.Tree) &&
        (flags & TileFlag.Rock || hash32(seed, x, z) % 5 === 0);
      if (exposed) {
        const cx = lx + 0.5 + (jx - lx - 0.5) * 0.18;
        const cz = lz + 0.5 + (jz - lz - 0.5) * 0.18;
        if (res === Resource.Stone) stoneDeposit(b, cx, y, cz);
        else if (res === Resource.Clay) clayDeposit(b, cx, y, cz);
        else ironDeposit(b, cx, y, cz);
      } else if (flags & TileFlag.Tree) {
        const h = 0.9 + hashFloat(seed, Purpose.Trees, x, z, 3) * 0.7;
        const leaf = shade(
          (LEAF[biome] ?? LEAF[Biome.Temperate]) as RGB,
          0.9 + hashFloat(seed, Purpose.Trees, x, z, 4) * 0.2,
        );
        const snowy = biome === Biome.Cold || level >= SNOW_LEVEL;
        const style = hash32(seed, x, z, Purpose.Decoration) % 5;
        const conifer = snowy || (biome === Biome.Forest && style >= 3);
        b.box(jx - 0.05, y, jz - 0.05, jx + 0.05, y + h * 0.71, jz + 0.05, TRUNK);
        if (conifer) {
          for (let tier = 0; tier < 3; tier++) {
            const base = y + h * (0.22 + 0.22 * tier);
            const radius = (0.24 - tier * 0.048) * (style === 4 ? 0.83 : 1);
            const rim = treeRing(jx, base, jz, radius, radius);
            b.cap(
              rim,
              [jx, base + h * 0.45, jz],
              snowy ? shade(SNOW, 0.81 + tier * 0.07) : shade(leaf, 0.87 + tier * 0.095),
            );
            // Undersides keep the tier silhouette solid at shallow camera angles.
            b.cap([...rim].reverse(), [jx, base - h * 0.065, jz], shade(leaf, 0.76));
          }
        } else {
          const width = style === 0 ? 0.3 : style === 1 ? 0.19 : 0.255;
          const crownY = y + h * (style === 1 ? 0.65 : 0.73);
          crown(b, jx, crownY, jz, width, width * (style === 0 ? 0.76 : 0.95), h * 0.42, leaf);
          if (style === 2)
            crown(
              b,
              jx + 0.12,
              crownY - h * 0.13,
              jz + 0.065,
              0.15,
              0.13,
              h * 0.26,
              shade(leaf, 0.89),
            );
        }
      } else if (flags & TileFlag.Rock) {
        const r = 0.14 + hashFloat(seed, Purpose.Decoration, x, z, 5) * 0.1;
        const rockCol = (res && ORE_ROCK_COLOR[res]) || ROCK;
        b.box(jx - r, y, jz - r * 0.7, jx + r, y + r * 1.3, jz + r * 0.7, shade(rockCol, 1.38));
        b.box(
          jx - r * 0.6,
          y + r * 1.3,
          jz - r * 0.5,
          jx + r * 0.7,
          y + r * 1.8,
          jz + r * 0.52,
          shade(rockCol, 1.55),
        );
        b.box(
          jx - r * 1.22,
          y,
          jz + r * 0.16,
          jx - r * 0.48,
          y + r * 0.7,
          jz + r * 1.14,
          shade(rockCol, 1.22),
        );
        b.box(
          jx + r * 0.51,
          y,
          jz + r * 0.42,
          jx + r * 1.23,
          y + r * 0.55,
          jz + r * 1.24,
          shade(rockCol, 1.45),
        );
      }
    }
  }
  return b.finish();
}
