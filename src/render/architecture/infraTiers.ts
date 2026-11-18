import { type Lot, type Recipes } from './lot';

const grass = '#6e9647';
const stoneCurb = '#7e796e';
const stonePlinth = '#767167';
const stoneLight = '#c6bca6';
const limestoneBright = '#efe7d6';
const marble = '#f4f0e6';
const plaster = '#ede4d2';
const timber = '#533a24';
const timberDark = '#3d2a19';
const oak = '#7d5a3b';
const brick = '#b5563c';
const brickDark = '#8c3f2b';
const slate = '#465866';
const slateDark = '#34434f';
const copper = '#558c7c';
const copperLight = '#6fa896';
const copperBright = '#c77d48';
const terracotta = '#c85a32';
const terracottaDark = '#a34422';
const gold = '#d9b14a';
const iron = '#2f3538';
const steel = '#6e7b80';
const water = '#4d8da6';
const windowWarm = '#f5be42';
const fireGlow = '#f76b20';
const flowerPink = '#e24864';
const flowerYellow = '#f7d23d';
const foliage = '#467a34';

function lotCurb(l: Lot, count = 8, y = 0, h = 0.04): void {
  const step = 0.88 / count;
  const span = step * 0.88;
  for (let i = 0; i < count; i++) {
    const t = 0.06 + (i + 0.5) * step;
    l.block(t, 0.965, span, 0.032, y, h, stoneCurb);
    l.block(t, 0.035, span, 0.032, y, h, stoneCurb);
    l.block(0.035, t, 0.032, span, y, h, stoneCurb);
    l.block(0.965, t, 0.032, span, y, h, stoneCurb);
  }
}

function steppedRoof(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  h: number,
  along: 'x' | 'z',
  colors: readonly string[],
  ridgeColor = timberDark,
): void {
  l.ridge(x, z, w, d, y, h, along, colors[0] ?? terracotta);
  const courses = colors.length;
  for (let i = 0; i < courses; i++) {
    const t0 = i / courses;
    const t1 = (i + 1) / courses;
    const cy = y + h * t0;
    const ch = h * (t1 - t0) * 0.92;
    const span = (1 - t0 * 0.88) * (along === 'x' ? d : w);
    const col = colors[i]!;
    if (along === 'x') l.block(x, z, w * 1.01, span, cy, ch, col);
    else l.block(x, z, span, d * 1.01, cy, ch, col);
  }
  if (along === 'x') l.block(x, z, w + 0.02, 0.034, y + h - 0.012, 0.03, ridgeColor);
  else l.block(x, z, 0.034, d + 0.02, y + h - 0.012, 0.03, ridgeColor);
}

/** Framed glowing windows on all 4 facades (+Z, -Z, +X, -X) of a rectangular volume. */
function surroundWindows(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  colsZ = 2,
  colsX = 2,
  winW = 0.068,
  frame = iron,
  sill = stoneLight,
): void {
  const spanX = hw * 0.74;
  for (let i = 0; i < colsZ; i++) {
    const wx = hx + (colsZ === 1 ? 0 : ((i + 0.5) / colsZ - 0.5) * spanX);
    for (const sz of [-1, 1] as const) {
      const zWall = hz + sz * (hd / 2);
      l.block(wx, zWall + sz * 0.003, winW + 0.014, 0.016, y - 0.006, h + 0.012, frame);
      l.block(wx, zWall + sz * 0.006, winW, 0.012, y, h, windowWarm, 1);
      l.block(wx, zWall + sz * 0.009, winW + 0.02, 0.02, y - 0.012, 0.012, sill);
    }
  }
  const spanZ = hd * 0.74;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    for (const sx of [-1, 1] as const) {
      const xWall = hx + sx * (hw / 2);
      l.block(xWall + sx * 0.003, wz, 0.016, winW + 0.014, y - 0.006, h + 0.012, frame);
      l.block(xWall + sx * 0.006, wz, 0.012, winW, y, h, windowWarm, 1);
      l.block(xWall + sx * 0.009, wz, 0.02, winW + 0.02, y - 0.012, 0.012, sill);
    }
  }
}

/** 4-sided loading or entrance doors (+Z, -Z, +X, -X) with pitched awnings. */
function surroundDoorsAndAwnings(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y0: number,
  doorH = 0.22,
  doorColor = oak,
  awningColor = slate,
): void {
  for (const sz of [-1, 1] as const) {
    const zFace = hz + sz * (hd / 2);
    l.block(hx, zFace + sz * 0.005, 0.12, 0.018, y0, doorH, doorColor);
    l.ridge(hx, zFace + sz * 0.035, 0.18, 0.07, y0 + doorH, 0.055, 'x', awningColor);
  }
  for (const sx of [-1, 1] as const) {
    const xFace = hx + sx * (hw / 2);
    l.block(xFace + sx * 0.005, hz, 0.018, 0.12, y0, doorH, doorColor);
    l.ridge(xFace + sx * 0.035, hz, 0.07, 0.18, y0 + doorH, 0.055, 'z', awningColor);
  }
}

/** Harbor crane with 4-legged portal base, operator cab, jib & hook. */
function harborCrane(
  l: Lot,
  x: number,
  z: number,
  reachZ: number,
  height: number,
  col = copperBright,
): void {
  for (const sx of [-0.05, 0.05]) {
    for (const sz of [-0.06, 0.06]) {
      l.beam([x + sx, 0.18, z + sz], [x, 0.52, z], 0.028, col);
    }
  }
  l.block(x, z, 0.11, 0.12, 0.5, 0.18, steel);
  l.block(x, z + 0.062, 0.08, 0.014, 0.54, 0.09, windowWarm, 1);
  l.beam([x, 0.65, z], [x, height, reachZ], 0.055, col);
  l.beam([x, height, reachZ], [x, height - 0.36, reachZ], 0.018, iron);
  l.block(x, reachZ, 0.045, 0.045, height - 0.4, 0.05, gold);
}

export const infraTiers: Recipes = {
  // ===========================================================================
  // 1. WATER SUPPLY CHAIN (1×1 — 5 TIERS: well -> cistern_well -> pump_house
  //    -> water_tower -> aqueduct_reservoir)
  // ===========================================================================
  well(l) {
    // Tier 1: Stone Village Well with Terracotta Canopy & 4-Sided Stepping Stones (Max Y ~ 0.62)
    l.base(grass, 0.035);
    lotCurb(l, 8, 0, 0.038);
    // 4-directional cobble stepping paths (+Z, -Z, +X, -X)
    l.block(0.5, 0.5, 0.78, 0.18, 0.035, 0.008, stoneLight);
    l.block(0.5, 0.5, 0.18, 0.78, 0.035, 0.008, stoneLight);
    // Circular masonry well curb & clear blue water
    l.round(0.5, 0.5, 0.22, 0.24, 0.035, 0.18, stonePlinth);
    l.round(0.5, 0.5, 0.24, 0.24, 0.19, 0.03, stoneLight);
    l.round(0.5, 0.5, 0.18, 0.18, 0.2, 0.015, water);
    // Timber posts, windlass axle, hanging oak bucket & stepped terracotta roof
    for (const sx of [-0.19, 0.19]) {
      l.block(0.5 + sx, 0.5, 0.04, 0.04, 0.21, 0.24, timber);
    }
    l.beam([0.3, 0.36, 0.5], [0.7, 0.36, 0.5], 0.028, oak);
    l.round(0.5, 0.5, 0.045, 0.04, 0.25, 0.07, oak);
    steppedRoof(l, 0.5, 0.5, 0.52, 0.48, 0.44, 0.18, 'x', [terracottaDark, terracotta, '#db6a3b']);
    // Hanging lanterns on front (+Z) and back (-Z) gables
    for (const sz of [-0.22, 0.22]) {
      l.block(0.5, 0.5 + sz, 0.032, 0.032, 0.38, 0.045, windowWarm, 1);
    }
  },

  cistern_well(l) {
    // Tier 2: Octagonal Limestone Cistern Pavilion with 4 Brass Spouts & Slate Dome (Max Y ~ 0.84)
    l.base('#9e9886', 0.035);
    lotCurb(l, 8, 0, 0.04);
    // 4-sided stone catch-basins on +Z, -Z, +X, -X with brass spouts & flowing water
    for (const sz of [-0.28, 0.28]) {
      l.block(0.5, 0.5 + sz, 0.22, 0.12, 0.035, 0.075, stoneLight);
      l.block(0.5, 0.5 + sz, 0.16, 0.08, 0.105, 0.012, water);
      l.block(0.5, 0.5 + sz * 0.82, 0.035, 0.06, 0.22, 0.035, gold);
      l.block(0.5, 0.5 + sz * 1.05, 0.036, 0.036, 0.36, 0.05, windowWarm, 1);
    }
    for (const sx of [-0.28, 0.28]) {
      l.block(0.5 + sx, 0.5, 0.12, 0.22, 0.035, 0.075, stoneLight);
      l.block(0.5 + sx, 0.5, 0.08, 0.16, 0.105, 0.012, water);
      l.block(0.5 + sx * 0.82, 0.5, 0.06, 0.035, 0.22, 0.035, gold);
      l.block(0.5 + sx * 1.05, 0.5, 0.036, 0.036, 0.36, 0.05, windowWarm, 1);
    }
    // Central octagonal carved limestone cistern & ribbed slate dome
    l.round(0.5, 0.5, 0.24, 0.26, 0.035, 0.42, limestoneBright);
    l.round(0.5, 0.5, 0.27, 0.27, 0.44, 0.04, stoneLight);
    l.dome(0.5, 0.5, 0.25, 0.25, 0.48, 0.26, slate);
    l.round(0.5, 0.5, 0.012, 0.035, 0.74, 0.1, gold);
  },

  pump_house(l) {
    // Tier 3: 1.5-Story Red-Brick Steam Pump House with Iron Flywheel & 4-Way Copper Pipes (Max Y ~ 1.18)
    l.base('#969184', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.48;
    const hz = 0.48;
    const hw = 0.54;
    const hd = 0.54;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.1, stonePlinth);
    l.block(hx, hz, hw, hd, 0.135, 0.46, brick);
    surroundWindows(l, hx, hz, hw, hd, 0.24, 0.18, 2, 2, 0.072, iron, stoneLight);
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.595, 0.34, 'z', [
      slateDark,
      slate,
      '#586e7d',
      slate,
    ]);
    // Copper water mains emerging from all 4 walls (+Z, -Z, +X, -X)
    for (const sz of [-1, 1] as const) {
      l.block(hx + 0.12, hz + sz * (hd / 2 + 0.04), 0.055, 0.08, 0.035, 0.24, copperBright);
    }
    for (const sx of [-1, 1] as const) {
      l.block(hx + sx * (hw / 2 + 0.04), hz - 0.12, 0.08, 0.055, 0.035, 0.24, copperBright);
    }
    // Cast-iron flywheel on West (-X) & glowing boiler firebox + tall brick stack on East (+X)
    l.round(hx - hw / 2 - 0.03, hz + 0.08, 0.12, 0.12, 0.14, 0.04, iron);
    l.block(0.8, 0.26, 0.14, 0.14, 0.035, 1.1, brickDark);
    l.block(0.8, 0.26, 0.16, 0.16, 1.12, 0.04, stoneLight);
    l.block(hx + hw / 2 + 0.008, hz + 0.1, 0.02, 0.1, 0.08, 0.11, fireGlow, 1);
  },

  water_tower(l) {
    // Tier 4: Riveted Elevated Water Tank on 4-Sided Braced Frame + Brick Valve House (Max Y ~ 1.62)
    l.base('#839666', 0.035);
    lotCurb(l, 9, 0, 0.042);
    // Brick valve house at base with glowing windows on all 4 sides
    l.block(0.5, 0.5, 0.36, 0.36, 0.035, 0.34, brick);
    surroundWindows(l, 0.5, 0.5, 0.36, 0.36, 0.12, 0.14, 1, 1, 0.068, iron, stoneLight);
    // 4 heavy braced steel legs & cross-braces on all 4 sides
    for (const x of [0.22, 0.78]) {
      for (const z of [0.22, 0.78]) {
        l.beam([x, 0.035, z], [0.5 + (x - 0.5) * 0.68, 0.96, 0.5 + (z - 0.5) * 0.68], 0.05, iron);
      }
    }
    for (const sz of [0.22, 0.78]) {
      l.beam([0.22, 0.12, sz], [0.72, 0.88, sz], 0.03, steel);
      l.beam([0.78, 0.12, sz], [0.28, 0.88, sz], 0.03, steel);
    }
    for (const sx of [0.22, 0.78]) {
      l.beam([sx, 0.12, 0.22], [sx, 0.88, 0.72], 0.03, steel);
      l.beam([sx, 0.12, 0.78], [sx, 0.88, 0.28], 0.03, steel);
    }
    // Circular catwalk, riveted tank & conical roof with finial
    l.round(0.5, 0.5, 0.35, 0.22, 0.92, 0.14, steel);
    l.round(0.5, 0.5, 0.37, 0.37, 1.04, 0.03, iron);
    l.round(0.5, 0.5, 0.33, 0.33, 1.06, 0.34, '#8ca8b3');
    l.round(0.5, 0.5, 0.02, 0.36, 1.4, 0.22, slateDark);
  },

  aqueduct_reservoir(l) {
    // Tier 5: Royal Marble Aqueduct & Copper Pressure Dome Tower with 4-Side Fountains (Max Y ~ 2.02)
    l.base('#b8b2a2', 0.04);
    lotCurb(l, 10, 0, 0.048);
    // 4 semicircular fountain basins on +Z, -Z, +X, -X
    for (const [fx, fz] of [
      [0.5, 0.82],
      [0.5, 0.18],
      [0.82, 0.5],
      [0.18, 0.5],
    ] as const) {
      l.round(fx, fz, 0.11, 0.12, 0.04, 0.08, marble);
      l.round(fx, fz, 0.09, 0.09, 0.115, 0.015, water);
      l.round(fx, fz, 0.02, 0.025, 0.12, 0.09, gold);
    }
    // Monumental 2-story arched marble tower with glowing windows on all 4 sides
    l.block(0.5, 0.5, 0.52, 0.52, 0.04, 1.24, marble);
    for (const fy of [0.22, 0.76]) {
      surroundWindows(l, 0.5, 0.5, 0.52, 0.52, fy, 0.28, 2, 2, 0.072, gold, stoneLight);
    }
    l.block(0.5, 0.5, 0.58, 0.58, 0.64, 0.045, stoneLight);
    l.block(0.5, 0.5, 0.6, 0.6, 1.26, 0.055, gold);
    // Ribbed verdigris-copper pressure dome & golden finial spire
    l.round(0.5, 0.5, 0.24, 0.25, 1.31, 0.16, limestoneBright);
    l.dome(0.5, 0.5, 0.25, 0.25, 1.47, 0.34, copper);
    l.round(0.5, 0.5, 0.01, 0.04, 1.81, 0.21, gold);
  },

  // ===========================================================================
  // 2. LOGISTICS & STORAGE CHAIN (2×2 — 4 TIERS: stockpile -> warehouse
  //    -> distribution_depot -> automated_logistics_hub)
  // ===========================================================================
  stockpile(l) {
    // Tier 1 (2×2): Timber-Decked Open Yard with 3 Resource Bays & 4-Sided Tool Shed (Max Y ~ 0.58)
    l.base('#9c8b70', 0.035);
    lotCurb(l, 12, 0, 0.04);
    l.block(0.5, 0.5, 0.86, 0.86, 0.035, 0.03, oak);
    // Low timber divider walls around all 4 sides with entrance gaps
    for (const x of [0.24, 0.76]) {
      l.block(x, 0.1, 0.32, 0.03, 0.065, 0.14, timber);
      l.block(x, 0.9, 0.32, 0.03, 0.065, 0.14, timber);
    }
    for (const z of [0.24, 0.76]) {
      l.block(0.1, z, 0.03, 0.32, 0.065, 0.14, timber);
      l.block(0.9, z, 0.03, 0.32, 0.065, 0.14, timber);
    }
    // Bay 1 (NW): Stacked timber logs; Bay 2 (NE): Cut ashlar stone blocks; Bay 3 (SW): Coal & Ore
    for (const dz of [0.22, 0.32, 0.42]) {
      l.block(0.28, dz, 0.26, 0.075, 0.065, 0.08, '#9e7446');
      l.block(0.28, dz, 0.22, 0.07, 0.145, 0.075, '#b58856');
    }
    for (const [sx, sz] of [
      [0.66, 0.24],
      [0.78, 0.24],
      [0.72, 0.36],
    ] as const) {
      l.block(sx, sz, 0.1, 0.1, 0.065, 0.12, stoneLight);
      l.block(sx, sz, 0.08, 0.08, 0.185, 0.09, marble);
    }
    l.round(0.28, 0.72, 0.06, 0.16, 0.065, 0.22, '#3d4245');
    l.round(0.44, 0.76, 0.05, 0.13, 0.065, 0.18, '#8c583a');
    // Tally Clerk's Shed in SE corner with windows on all 4 walls
    l.block(0.74, 0.72, 0.24, 0.24, 0.065, 0.28, oak);
    surroundWindows(l, 0.74, 0.72, 0.24, 0.24, 0.15, 0.1, 1, 1, 0.058, timberDark, stoneLight);
    steppedRoof(l, 0.74, 0.72, 0.28, 0.28, 0.345, 0.18, 'z', [terracottaDark, terracotta]);
  },

  warehouse(l) {
    // Tier 2 (2×2): 2-Story Half-Timber & Brick Warehouse with 4-Side Loading Docks & Dual Hoists (Max Y ~ 1.48)
    l.base('#9b9484', 0.035);
    lotCurb(l, 12, 0, 0.044);
    const hx = 0.5;
    const hz = 0.5;
    const hw = 0.68;
    const hd = 0.62;
    // Wrap-around timber loading dock platform on all 4 sides
    l.block(hx, hz, hw + 0.16, hd + 0.16, 0.035, 0.09, oak);
    // Brick ground story + half-timbered upper story
    l.block(hx, hz, hw, hd, 0.125, 0.38, brick);
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.505, 0.42, plaster);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.125, 0.28, timberDark, slate);
    surroundWindows(l, hx, hz, hw, hd, 0.2, 0.16, 3, 3, 0.065, timberDark, stoneLight);
    surroundWindows(l, hx, hz, hw + 0.02, hd + 0.02, 0.6, 0.16, 3, 3, 0.068, timberDark, oak);
    steppedRoof(l, hx, hz, hw + 0.08, hd + 0.08, 0.925, 0.44, 'x', [
      slateDark,
      slate,
      '#586e7d',
      slate,
    ]);
    // Front (+Z) & Rear (-Z) roof lucarne dormers + East/West gable hoist beams
    for (const sz of [-1, 1] as const) {
      l.block(hx, hz + sz * 0.2, 0.22, 0.18, 1.04, 0.2, plaster);
      l.ridge(hx, hz + sz * 0.2, 0.26, 0.22, 1.24, 0.12, 'z', slateDark);
    }
    for (const sx of [-1, 1] as const) {
      l.beam([hx + sx * 0.3, 1.18, hz], [hx + sx * 0.44, 1.18, hz], 0.032, timberDark);
      l.beam([hx + sx * 0.42, 1.18, hz], [hx + sx * 0.42, 0.72, hz], 0.014, iron);
    }
  },

  distribution_depot(l) {
    // Tier 3 (2×2): 2.5-Story Industrial Depot with 4-Side Loading Bays & Dispatch Control Tower (Max Y ~ 1.72)
    l.base('#9e9b8e', 0.04);
    lotCurb(l, 12, 0, 0.046);
    const hx = 0.46;
    const hz = 0.5;
    const hw = 0.66;
    const hd = 0.64;
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.04, 0.1, stonePlinth);
    l.block(hx, hz, hw, hd, 0.14, 0.78, '#9da698');
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.14, 0.34, iron, '#567875');
    for (const fy of [0.22, 0.6]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.16, 3, 3, 0.068, iron, stoneLight);
    }
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.92, 0.34, 'x', [
      '#4c6b68',
      '#628582',
      '#4c6b68',
    ]);
    // Corner 4-sided Dispatch Control Tower at (0.76, 0.28)
    l.block(0.76, 0.28, 0.26, 0.26, 0.04, 1.38, brick);
    surroundWindows(l, 0.76, 0.28, 0.26, 0.26, 1.14, 0.18, 1, 1, 0.14, iron, stoneLight);
    l.dome(0.76, 0.28, 0.15, 0.15, 1.42, 0.22, copper);
    l.round(0.76, 0.28, 0.008, 0.02, 1.64, 0.08, gold);
  },

  automated_logistics_hub(l) {
    // Tier 4 (2×2): Grand 3-Story Brick & Steel Logistics Hub with 4-Side Arcades, Clock Tower & Rooftop Crane (Max Y ~ 2.12)
    l.base('#aba698', 0.04);
    lotCurb(l, 12, 0, 0.048);
    const hx = 0.5;
    const hz = 0.5;
    const hw = 0.76;
    const hd = 0.72;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.38, stoneLight);
    l.block(hx, hz, hw, hd, 0.42, 0.92, brick);
    l.block(hx, hz, hw + 0.04, hd + 0.04, 1.32, 0.055, marble);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.04, 0.3, iron, copper);
    for (const fy of [0.14, 0.52, 0.94]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.18, 4, 4, 0.068, iron, marble);
    }
    // 4-sided Clock & Dispatch Tower on East (+X) + Rotating Gantry Crane on West (-X) roof
    l.block(0.72, 0.5, 0.24, 0.24, 1.36, 0.44, brick);
    surroundWindows(l, 0.72, 0.5, 0.24, 0.24, 1.5, 0.16, 1, 1, 0.1, gold, marble);
    l.dome(0.72, 0.5, 0.13, 0.13, 1.8, 0.22, slateDark);
    l.round(0.72, 0.5, 0.01, 0.025, 2.02, 0.1, gold);
    // Rooftop steel crane
    l.block(0.32, 0.5, 0.18, 0.18, 1.36, 0.24, iron);
    l.beam([0.32, 1.56, 0.5], [0.16, 1.92, 0.76], 0.045, steel);
    l.beam([0.16, 1.92, 0.76], [0.16, 1.52, 0.76], 0.016, gold);
  },

  // ===========================================================================
  // 3. GRANARY & FOOD STORAGE CHAIN (2×2 — 4 TIERS: grain_store & granary
  //    -> elevator_granary -> imperial_food_exchange)
  // ===========================================================================
  grain_store(l) {
    // Tier 1 (2×2): Elevated Timber-and-Stone Granary on Stone Piers with 4-Side Details (Max Y ~ 1.12)
    l.base('#9a8f76', 0.035);
    lotCurb(l, 12, 0, 0.042);
    // 9 anti-rodent stone piers supporting raised timber floor
    for (const px of [0.22, 0.5, 0.78]) {
      for (const pz of [0.24, 0.5, 0.76]) {
        l.block(px, pz, 0.09, 0.09, 0.035, 0.16, stonePlinth);
      }
    }
    const hx = 0.5;
    const hz = 0.48;
    const hw = 0.72;
    const hd = 0.58;
    l.block(hx, hz, hw + 0.06, hd + 0.06, 0.18, 0.04, oak);
    l.block(hx, hz, hw, hd, 0.22, 0.46, plaster);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.22, 0.24, oak, terracotta);
    surroundWindows(l, hx, hz, hw, hd, 0.3, 0.16, 3, 2, 0.068, timberDark, oak);
    steppedRoof(l, hx, hz, hw + 0.08, hd + 0.08, 0.68, 0.4, 'x', [
      terracottaDark,
      terracotta,
      '#db6a3b',
      terracotta,
    ]);
    // Grain sacks around all 4 sides
    for (const [sx, sz] of [
      [0.24, 0.84],
      [0.76, 0.84],
      [0.24, 0.14],
      [0.76, 0.14],
    ] as const) {
      l.round(sx, sz, 0.038, 0.046, 0.035, 0.09, '#d4bc8b');
    }
  },

  granary(l) {
    // Tier 2 (2×2): Twin Cylindrical Stone Silos + Central 4-Sided Timber Storehouse (Max Y ~ 1.48)
    l.base('#918978', 0.035);
    lotCurb(l, 12, 0, 0.044);
    for (const [sx, sh] of [
      [0.28, 1.08],
      [0.72, 0.92],
    ] as const) {
      l.round(sx, 0.36, 0.18, 0.19, 0.035, sh, stoneLight);
      l.round(sx, 0.36, 0.015, 0.21, 0.035 + sh, 0.28, '#7d6347');
      // Silo inspection windows on all 4 cardinal directions
      surroundWindows(l, sx, 0.36, 0.26, 0.26, 0.56, 0.14, 1, 1, 0.055, timberDark, stonePlinth);
    }
    const hx = 0.5;
    const hz = 0.66;
    const hw = 0.64;
    const hd = 0.34;
    l.block(hx, hz, hw, hd, 0.035, 0.46, oak);
    surroundWindows(l, hx, hz, hw, hd, 0.18, 0.15, 3, 1, 0.065, timberDark, stoneLight);
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.495, 0.24, 'x', ['#6e5842', '#82694f']);
  },

  elevator_granary(l) {
    // Tier 3 (2×2): 4 Tall Brick-and-Steel Silo Towers + Overhead Conveyor Headhouse (Max Y ~ 1.82)
    l.base('#9c9586', 0.04);
    lotCurb(l, 12, 0, 0.046);
    for (const sx of [0.28, 0.72]) {
      for (const sz of [0.3, 0.66]) {
        l.round(sx, sz, 0.16, 0.17, 0.04, 1.38, brick);
        l.dome(sx, sz, 0.165, 0.165, 1.42, 0.16, steel);
      }
    }
    // Overhead steel conveyor gallery & central 4-sided headhouse
    l.block(0.5, 0.48, 0.66, 0.54, 1.48, 0.22, steel);
    surroundWindows(l, 0.5, 0.48, 0.66, 0.54, 1.52, 0.12, 3, 2, 0.065, iron, stoneLight);
    l.ridge(0.5, 0.48, 0.7, 0.58, 1.7, 0.12, 'x', slateDark);
    // Ground-floor brick weighing office with 4-sided doors/windows
    l.block(0.5, 0.48, 0.38, 0.82, 0.04, 0.44, brickDark);
    surroundWindows(l, 0.5, 0.48, 0.38, 0.82, 0.16, 0.16, 1, 3, 0.068, iron, stoneLight);
  },

  imperial_food_exchange(l) {
    // Tier 4 (2×2): Neoclassical Marble Food Exchange with 4 Copper-Domed Corner Silos (Max Y ~ 2.16)
    l.base('#bab4a4', 0.04);
    lotCurb(l, 12, 0, 0.048);
    // 4 Corner Marble Silo Towers with Verdigris-Copper Domes & Gold Finials
    for (const sx of [0.22, 0.78]) {
      for (const sz of [0.22, 0.78]) {
        l.round(sx, sz, 0.14, 0.15, 0.04, 1.42, marble);
        surroundWindows(l, sx, sz, 0.2, 0.2, 0.82, 0.2, 1, 1, 0.055, gold, stoneLight);
        l.dome(sx, sz, 0.15, 0.15, 1.46, 0.26, copper);
        l.round(sx, sz, 0.008, 0.025, 1.72, 0.12, gold);
      }
    }
    // Central Neoclassical Exchange Hall with 4-sided colonnades & golden wheat pediments
    l.block(0.5, 0.5, 0.58, 0.58, 0.04, 1.26, limestoneBright);
    for (const fy of [0.18, 0.64, 1.0]) {
      surroundWindows(l, 0.5, 0.5, 0.58, 0.58, fy, 0.2, 3, 3, 0.068, gold, marble);
    }
    surroundDoorsAndAwnings(l, 0.5, 0.5, 0.58, 0.58, 0.04, 0.32, oak, copper);
    steppedRoof(l, 0.5, 0.5, 0.62, 0.62, 1.3, 0.44, 'x', ['#3d6e60', copper, copperLight, copper]);
    steppedRoof(l, 0.5, 0.5, 0.62, 0.62, 1.3, 0.44, 'z', ['#3d6e60', copper, copperLight, copper]);
    l.dome(0.5, 0.5, 0.16, 0.16, 1.72, 0.26, gold);
    l.round(0.5, 0.5, 0.01, 0.03, 1.98, 0.18, gold);
  },

  // ===========================================================================
  // 4. URBAN TRANSIT & METRO (bus_stop -> tram_pavilion -> grand_transit_kiosk;
  //    metro_station -> central_metro_plaza -> grand_terminus)
  // ===========================================================================
  bus_stop(l) {
    // Tier 1 Transit (1×1): Open-Sided Glass & Steel Shelter with 4-Side Visibility (Max Y ~ 0.68)
    l.base('#9da294', 0.035);
    lotCurb(l, 8, 0, 0.038);
    // 4 steel corner posts & translucent glass panels + pitched canopy
    for (const sx of [0.22, 0.72]) {
      for (const sz of [0.28, 0.62]) {
        l.block(sx, sz, 0.035, 0.035, 0.035, 0.42, steel);
      }
    }
    l.block(0.47, 0.28, 0.52, 0.025, 0.08, 0.32, '#88b2bd', 0.7);
    l.block(0.22, 0.45, 0.025, 0.34, 0.08, 0.32, '#88b2bd', 0.7);
    l.block(0.72, 0.45, 0.025, 0.34, 0.08, 0.32, '#88b2bd', 0.7);
    l.block(0.47, 0.45, 0.54, 0.12, 0.035, 0.08, oak);
    l.ridge(0.47, 0.45, 0.62, 0.46, 0.45, 0.12, 'x', '#3498db');
    // Route sign pole with glowing timetable on both sides
    l.block(0.84, 0.76, 0.03, 0.03, 0.035, 0.58, iron);
    l.block(0.84, 0.76, 0.12, 0.04, 0.52, 0.12, windowWarm, 1);
  },

  tram_pavilion(l) {
    // Tier 2 Transit (1×1): Ornate Cast-Iron & Timber Tram Pavilion with 4-Side Clocks & Lanterns (Max Y ~ 0.92)
    l.base('#a6a090', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.block(0.5, 0.5, 0.72, 0.64, 0.035, 0.075, stoneLight);
    // Central double-sided oak waiting bench & ticket kiosk with 4-side glowing windows
    l.block(0.5, 0.5, 0.34, 0.3, 0.11, 0.34, oak);
    surroundWindows(l, 0.5, 0.5, 0.34, 0.3, 0.18, 0.16, 1, 1, 0.14, timberDark, gold);
    for (const sx of [0.2, 0.8]) {
      for (const sz of [0.24, 0.76]) {
        l.block(sx, sz, 0.036, 0.036, 0.11, 0.38, iron);
        l.block(sx, sz, 0.042, 0.042, 0.36, 0.055, windowWarm, 1);
      }
    }
    steppedRoof(l, 0.5, 0.5, 0.74, 0.66, 0.48, 0.28, 'x', [slateDark, slate, '#586e7d']);
    // 4-sided clock turret on roof ridge
    l.block(0.5, 0.5, 0.16, 0.16, 0.72, 0.12, limestoneBright);
    surroundWindows(l, 0.5, 0.5, 0.16, 0.16, 0.74, 0.08, 1, 1, 0.07, gold, marble);
    l.dome(0.5, 0.5, 0.09, 0.09, 0.84, 0.08, gold);
  },

  grand_transit_kiosk(l) {
    // Tier 3 Transit (1×1): Art-Nouveau Verdigris Copper & Stained-Glass Octagonal Kiosk (Max Y ~ 1.24)
    l.base('#b5afa0', 0.04);
    lotCurb(l, 9, 0, 0.044);
    l.round(0.5, 0.5, 0.34, 0.36, 0.04, 0.1, marble);
    l.round(0.5, 0.5, 0.26, 0.27, 0.14, 0.48, copper);
    // Glowing stained-glass windows & brass canopies on all 4 cardinal sides (+Z, -Z, +X, -X)
    surroundWindows(l, 0.5, 0.5, 0.44, 0.44, 0.2, 0.32, 2, 2, 0.085, gold, marble);
    surroundDoorsAndAwnings(l, 0.5, 0.5, 0.46, 0.46, 0.14, 0.32, copperLight, gold);
    // Glowing glass drum & ribbed golden dome with spire
    l.round(0.5, 0.5, 0.2, 0.22, 0.62, 0.18, windowWarm, 1);
    l.dome(0.5, 0.5, 0.23, 0.23, 0.8, 0.28, gold);
    l.round(0.5, 0.5, 0.01, 0.03, 1.08, 0.16, copper);
  },

  metro_station(l) {
    // Tier 1 Metro (2×2): Concrete & Glass Underground Entrance with 4-Side Balustrade (Max Y ~ 1.04)
    l.base('#989e92', 0.035);
    lotCurb(l, 12, 0, 0.042);
    for (let i = 0; i < 5; i++) {
      l.block(0.48, 0.32 + i * 0.11, 0.48, 0.11, 0.035, 0.035 + i * 0.048, '#7b857f');
    }
    for (const sx of [0.18, 0.78]) {
      l.block(sx, 0.54, 0.08, 0.72, 0.035, 0.34, stoneLight);
    }
    l.block(0.48, 0.2, 0.68, 0.08, 0.035, 0.34, stoneLight);
    // Glazed canopy over stairs with glowing clerestory on all 4 sides
    l.block(0.48, 0.38, 0.64, 0.44, 0.36, 0.22, '#688b8f');
    surroundWindows(l, 0.48, 0.38, 0.64, 0.44, 0.4, 0.14, 3, 2, 0.075, steel, stoneLight);
    l.block(0.48, 0.38, 0.68, 0.48, 0.58, 0.06, steel);
    // Tall Metro 'M' beacon pylon
    l.block(0.86, 0.76, 0.035, 0.035, 0.035, 0.84, steel);
    l.block(0.86, 0.76, 0.14, 0.14, 0.86, 0.16, '#c0392b', 1);
  },

  central_metro_plaza(l) {
    // Tier 2 Metro (2×2): Vaulted Iron-and-Glass Metro Pavilion with 4-Side Entrances (Max Y ~ 1.46)
    l.base('#aba698', 0.04);
    lotCurb(l, 12, 0, 0.045);
    const hx = 0.5;
    const hz = 0.5;
    const hw = 0.72;
    const hd = 0.64;
    l.block(hx, hz, hw + 0.06, hd + 0.06, 0.04, 0.12, stoneLight);
    l.block(hx, hz, hw, hd, 0.16, 0.56, limestoneBright);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.16, 0.36, iron, copper);
    surroundWindows(l, hx, hz, hw, hd, 0.24, 0.28, 4, 3, 0.072, iron, marble);
    // Barrel-vaulted glass & steel roof + rooftop clock cupola
    l.vaultedCanopy(hx, hz, hw, hd, 0.72, 0.38);
    l.block(hx, hz, 0.2, 0.2, 1.06, 0.18, marble);
    surroundWindows(l, hx, hz, 0.2, 0.2, 1.1, 0.1, 1, 1, 0.08, gold, marble);
    l.dome(hx, hz, 0.11, 0.11, 1.24, 0.18, copper);
  },

  grand_terminus(l) {
    // Tier 3 Metro (2×2): 3-Story Beaux-Arts Grand Terminus with 4-Side Clock Tower & Twin Fountains (Max Y ~ 2.18)
    l.base('#beb8a8', 0.04);
    lotCurb(l, 12, 0, 0.048);
    const hx = 0.5;
    const hz = 0.46;
    const hw = 0.78;
    const hd = 0.62;
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.04, 0.14, stonePlinth);
    l.block(hx, hz, hw, hd, 0.18, 0.88, marble);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.18, 0.38, gold, copper);
    for (const fy of [0.24, 0.68]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.22, 4, 3, 0.072, gold, stoneLight);
    }
    l.vaultedCanopy(hx, hz, hw - 0.04, hd - 0.04, 1.06, 0.38);
    // Soaring 4-sided Central Clock Tower
    l.block(hx, hz, 0.24, 0.24, 1.38, 0.42, marble);
    surroundWindows(l, hx, hz, 0.24, 0.24, 1.48, 0.18, 1, 1, 0.1, gold, marble);
    l.dome(hx, hz, 0.14, 0.14, 1.8, 0.24, slateDark);
    l.round(hx, hz, 0.01, 0.03, 2.04, 0.14, gold);
    // Twin forecourt plaza fountains
    for (const fx of [0.24, 0.76]) {
      l.round(fx, 0.84, 0.075, 0.08, 0.04, 0.065, marble);
      l.round(fx, 0.84, 0.06, 0.06, 0.1, 0.012, water);
    }
  },

  // ===========================================================================
  // 5. LIGHTHOUSE & SEAPORT (lighthouse -> harbor_beacon_tower -> imperial_pharos;
  //    cargo_port -> trade_harbor -> imperial_seaport)
  // ===========================================================================
  lighthouse(l) {
    // Tier 1 Lighthouse (1×1): Classic Red-and-White Striped Lighthouse on Coastal Crag (Max Y ~ 2.45)
    l.round(0.5, 0.5, 0.32, 0.38, 0.01, 0.16, stonePlinth);
    l.round(0.5, 0.5, 0.15, 0.26, 0.17, 1.58, limestoneBright);
    for (const [y, r0, r1] of [
      [0.48, 0.22, 0.24],
      [1.04, 0.18, 0.2],
      [1.56, 0.16, 0.17],
    ] as const) {
      l.round(0.5, 0.5, r0, r1, y, 0.22, '#b84a3c');
    }
    // 4-directional tower windows
    surroundWindows(l, 0.5, 0.5, 0.3, 0.3, 0.8, 0.14, 1, 1, 0.05, iron, marble);
    l.round(0.5, 0.5, 0.22, 0.18, 1.75, 0.1, iron);
    l.round(0.5, 0.5, 0.15, 0.15, 1.85, 0.32, windowWarm, 1);
    l.round(0.5, 0.5, 0.02, 0.22, 2.17, 0.28, '#b84a3c');
  },

  harbor_beacon_tower(l) {
    // Tier 2 Lighthouse (1×1): Octagonal Granite & Brick Beacon with Keeper's Cottage (Max Y ~ 2.68)
    l.base('#7d857b', 0.03);
    lotCurb(l, 8, 0, 0.04);
    // Keeper's cottage at base with windows on all 4 walls
    l.block(0.58, 0.56, 0.48, 0.48, 0.03, 0.36, brick);
    surroundWindows(l, 0.58, 0.56, 0.48, 0.48, 0.14, 0.14, 2, 2, 0.06, timberDark, stoneLight);
    steppedRoof(l, 0.58, 0.56, 0.52, 0.52, 0.39, 0.24, 'z', [slateDark, slate]);
    // Octagonal stone & brick beacon tower rising to 2.68
    const tx = 0.38;
    const tz = 0.42;
    l.round(tx, tz, 0.2, 0.26, 0.03, 0.65, stonePlinth);
    l.round(tx, tz, 0.15, 0.2, 0.68, 1.24, limestoneBright);
    l.round(tx, tz, 0.18, 0.19, 1.2, 0.24, brick);
    l.round(tx, tz, 0.22, 0.17, 1.92, 0.1, gold);
    l.round(tx, tz, 0.16, 0.16, 2.02, 0.36, windowWarm, 1);
    l.dome(tx, tz, 0.18, 0.18, 2.38, 0.22, copper);
    l.round(tx, tz, 0.008, 0.025, 2.6, 0.08, gold);
  },

  imperial_pharos(l) {
    // Tier 3 Lighthouse (1×1): Tiered Marble & Gold Imperial Pharos Monument (Max Y ~ 2.96)
    l.base('#b8b2a2', 0.04);
    lotCurb(l, 10, 0, 0.048);
    // Tier 1: Square colonnaded marble base (all 4 facades)
    l.block(0.5, 0.5, 0.68, 0.68, 0.04, 0.68, marble);
    surroundWindows(l, 0.5, 0.5, 0.68, 0.68, 0.2, 0.32, 3, 3, 0.068, gold, stoneLight);
    l.block(0.5, 0.5, 0.72, 0.72, 0.7, 0.05, gold);
    // Tier 2: Octagonal fluted marble shaft (4-sided windows)
    l.block(0.5, 0.5, 0.46, 0.46, 0.75, 0.96, limestoneBright);
    for (const fy of [0.88, 1.32]) {
      surroundWindows(l, 0.5, 0.5, 0.46, 0.46, fy, 0.24, 2, 2, 0.065, gold, marble);
    }
    l.block(0.5, 0.5, 0.5, 0.5, 1.7, 0.05, gold);
    // Tier 3: Cylindrical colonnaded lantern drum, blazing beacon & copper-gold dome
    l.round(0.5, 0.5, 0.18, 0.2, 1.75, 0.52, marble);
    l.round(0.5, 0.5, 0.15, 0.15, 2.27, 0.36, windowWarm, 1);
    l.dome(0.5, 0.5, 0.18, 0.18, 2.63, 0.22, copper);
    l.round(0.5, 0.5, 0.01, 0.03, 2.85, 0.11, gold);
  },

  cargo_port(l) {
    // Tier 1 Port (3×2): Stone Quay, Harbour Crane, 4-Side Freight Shed & Cargo Containers (Max Y ~ 1.48)
    l.block(0.5, 0.5, 0.94, 0.92, 0.06, 0.14, stonePlinth);
    l.block(0.5, 0.5, 0.92, 0.9, 0.19, 0.02, stoneLight);
    harborCrane(l, 0.74, 0.34, 0.82, 1.42, copperBright);
    // Harbour freight shed with windows & doors on all 4 walls
    l.block(0.3, 0.34, 0.38, 0.34, 0.21, 0.44, brick);
    surroundWindows(l, 0.3, 0.34, 0.38, 0.34, 0.34, 0.16, 2, 2, 0.065, iron, stoneLight);
    steppedRoof(l, 0.3, 0.34, 0.42, 0.38, 0.65, 0.24, 'x', [slateDark, slate]);
    // Stacked cargo crates & mooring bollards
    l.block(0.32, 0.72, 0.28, 0.16, 0.21, 0.22, '#a46954');
    l.block(0.32, 0.72, 0.24, 0.14, 0.43, 0.18, '#587c83');
  },

  trade_harbor(l) {
    // Tier 2 Port (3×2): Twin Harbour Cranes & 2-Story Brick Customs House (Max Y ~ 1.68)
    l.block(0.5, 0.5, 0.95, 0.93, 0.06, 0.16, stonePlinth);
    l.block(0.5, 0.5, 0.93, 0.91, 0.21, 0.025, stoneLight);
    for (const cx of [0.22, 0.78]) {
      harborCrane(l, cx, 0.38, 0.84, 1.62, copperBright);
    }
    // Central 2-story Customs Warehouse with 4-sided windows & dormers
    const hx = 0.5;
    const hz = 0.32;
    const hw = 0.38;
    const hd = 0.36;
    l.block(hx, hz, hw, hd, 0.23, 0.68, brick);
    for (const fy of [0.32, 0.62]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.16, 2, 2, 0.065, iron, stoneLight);
    }
    steppedRoof(l, hx, hz, hw + 0.04, hd + 0.04, 0.91, 0.32, 'x', [slateDark, slate, '#586e7d']);
    l.block(0.5, 0.68, 0.26, 0.16, 0.23, 0.22, '#c09a5c');
    l.block(0.5, 0.68, 0.24, 0.14, 0.45, 0.2, '#587c83');
  },

  imperial_seaport(l) {
    // Tier 3 Port (3×2): Monumental Marble Customs Palace with Copper Dome & Twin Gilded Cranes (Max Y ~ 2.04)
    l.block(0.5, 0.5, 0.96, 0.94, 0.06, 0.18, stoneLight);
    l.block(0.5, 0.5, 0.94, 0.92, 0.23, 0.03, marble);
    for (const cx of [0.2, 0.8]) {
      harborCrane(l, cx, 0.42, 0.86, 1.88, gold);
    }
    // Grand 2.5-story Neoclassical Customs Palace at centre-north (all 4 facades)
    const hx = 0.5;
    const hz = 0.34;
    const hw = 0.44;
    const hd = 0.42;
    l.block(hx, hz, hw, hd, 0.26, 0.86, marble);
    surroundDoorsAndAwnings(l, hx, hz, hw, hd, 0.26, 0.32, gold, copper);
    for (const fy of [0.36, 0.74]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.2, 3, 2, 0.062, gold, stoneLight);
    }
    l.block(hx, hz, hw + 0.03, hd + 0.03, 1.1, 0.05, gold);
    l.round(hx, hz, 0.15, 0.16, 1.15, 0.26, limestoneBright);
    l.dome(hx, hz, 0.16, 0.16, 1.41, 0.42, copper);
    l.round(hx, hz, 0.01, 0.03, 1.83, 0.2, gold);
  },

  // ===========================================================================
  // 6. URBAN PARKS (2×2 — 4 TIERS: park -> promenade_park -> sculpture_park
  //    -> crystal_conservatory_park)
  // ===========================================================================
  park(l) {
    // Tier 1 Park (2×2): Cross-Path Lawn Park with Central Fountain, 4 Benches & 4 Corner Trees (Max Y ~ 0.78)
    l.base('#789c5c', 0.035);
    lotCurb(l, 12, 0, 0.04);
    l.block(0.5, 0.5, 0.9, 0.16, 0.035, 0.012, stoneLight);
    l.block(0.5, 0.5, 0.16, 0.9, 0.035, 0.012, stoneLight);
    l.round(0.5, 0.5, 0.18, 0.2, 0.045, 0.085, limestoneBright);
    l.round(0.5, 0.5, 0.15, 0.15, 0.125, 0.016, water);
    l.round(0.5, 0.5, 0.035, 0.05, 0.13, 0.18, marble);
    for (const [tx, tz] of [
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8],
    ] as const) {
      l.tree(tx, tz, 0.74, foliage);
    }
    // Benches & flowerbeds on all 4 sides
    for (const sz of [0.28, 0.72]) l.block(0.36, sz, 0.14, 0.05, 0.035, 0.06, oak);
    for (const sx of [0.28, 0.72]) l.block(sx, 0.64, 0.05, 0.14, 0.035, 0.06, oak);
    // 4 cast-iron gas lanterns along the cross paths (+Z, -Z, +X, -X)
    for (const [lx, lz] of [
      [0.5, 0.86],
      [0.5, 0.14],
      [0.14, 0.5],
      [0.86, 0.5],
    ] as const) {
      l.block(lx, lz, 0.025, 0.025, 0.035, 0.28, iron);
      l.block(lx, lz, 0.038, 0.038, 0.315, 0.05, windowWarm, 1);
    }
  },

  promenade_park(l) {
    // Tier 2 Park (2×2): Octagonal Bandstand Gazebo, Ornamental Pond with Bridge & 4 Lamps (Max Y ~ 0.96)
    l.base('#729a58', 0.035);
    lotCurb(l, 12, 0, 0.042);
    // Octagonal Bandstand Gazebo at NW (all 8 posts + stepped copper/terracotta roof)
    const gx = 0.36;
    const gz = 0.36;
    l.round(gx, gz, 0.22, 0.24, 0.035, 0.09, stoneLight);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      l.block(gx + 0.18 * Math.cos(a), gz + 0.18 * Math.sin(a), 0.025, 0.025, 0.125, 0.36, timber);
    }
    l.round(gx, gz, 0.04, 0.25, 0.48, 0.32, terracotta);
    l.round(gx, gz, 0.01, 0.04, 0.8, 0.15, gold);
    // Ornamental pond & arched wooden footbridge at SE
    l.round(0.68, 0.68, 0.2, 0.21, 0.035, 0.02, water);
    l.block(0.68, 0.68, 0.28, 0.09, 0.055, 0.06, oak);
    for (const [lx, lz] of [
      [0.16, 0.82],
      [0.84, 0.18],
      [0.16, 0.16],
      [0.84, 0.84],
    ] as const) {
      l.block(lx, lz, 0.03, 0.03, 0.035, 0.22, iron);
      l.block(lx, lz, 0.04, 0.04, 0.25, 0.05, windowWarm, 1);
    }
    l.tree(0.2, 0.68, 0.78, foliage);
    l.tree(0.72, 0.24, 0.76, '#52873e');
  },

  sculpture_park(l) {
    // Tier 3 Park (2×2): Classical Marble Colonnade, Twin Fountains & 4-Side Rose Pergolas (Max Y ~ 1.18)
    l.base('#6d9654', 0.04);
    lotCurb(l, 12, 0, 0.045);
    l.block(0.5, 0.5, 0.88, 0.18, 0.04, 0.015, marble);
    l.block(0.5, 0.5, 0.18, 0.88, 0.04, 0.015, marble);
    // Classical Marble Colonnade & Heroic Statue at centre
    l.round(0.5, 0.5, 0.12, 0.14, 0.04, 0.22, marble);
    l.round(0.5, 0.5, 0.04, 0.06, 0.26, 0.56, gold);
    l.dome(0.5, 0.5, 0.055, 0.055, 0.82, 0.34, gold);
    // Rose Pergola Arches on all 4 cardinal paths (+Z, -Z, +X, -X)
    for (const sz of [0.2, 0.8]) {
      l.block(0.4, sz, 0.035, 0.08, 0.04, 0.42, marble);
      l.block(0.6, sz, 0.035, 0.08, 0.04, 0.42, marble);
      l.block(0.5, sz, 0.26, 0.12, 0.46, 0.05, foliage);
      l.block(0.5, sz, 0.2, 0.08, 0.51, 0.03, flowerPink);
    }
    for (const sx of [0.2, 0.8]) {
      l.block(sx, 0.4, 0.08, 0.035, 0.04, 0.42, marble);
      l.block(sx, 0.6, 0.08, 0.035, 0.04, 0.42, marble);
      l.block(sx, 0.5, 0.12, 0.26, 0.46, 0.05, foliage);
      l.block(sx, 0.5, 0.08, 0.2, 0.51, 0.03, flowerYellow);
    }
    for (const [fx, fz] of [
      [0.24, 0.24],
      [0.76, 0.76],
      [0.24, 0.76],
      [0.76, 0.24],
    ] as const) {
      l.round(fx, fz, 0.08, 0.09, 0.04, 0.07, marble);
      l.round(fx, fz, 0.065, 0.065, 0.1, 0.015, water);
    }
    // 4 marble lantern bollards along the promenade paths (+Z, -Z, +X, -X)
    for (const [lx, lz] of [
      [0.5, 0.88],
      [0.5, 0.12],
      [0.12, 0.5],
      [0.88, 0.5],
    ] as const) {
      l.block(lx, lz, 0.03, 0.03, 0.04, 0.28, marble);
      l.block(lx, lz, 0.04, 0.04, 0.32, 0.05, windowWarm, 1);
    }
  },

  crystal_conservatory_park(l) {
    // Tier 4 Park (2×2): Victorian Wrought-Iron & Glowing Glass Conservatory Dome with 4-Side Porticoes (Max Y ~ 1.62)
    l.base('#658f4d', 0.04);
    lotCurb(l, 12, 0, 0.048);
    // Manicured topiary boxwood parterre hedges in all 4 corners
    for (const sx of [0.2, 0.8]) {
      for (const sz of [0.2, 0.8]) {
        l.block(sx, sz, 0.18, 0.18, 0.04, 0.09, foliage);
        l.round(sx, sz, 0.02, 0.05, 0.13, 0.26, '#2f5e27');
      }
    }
    // Central Octagonal Glass & Iron Conservatory + 4-directional entrance pavilions
    l.round(0.5, 0.5, 0.3, 0.32, 0.04, 0.1, marble);
    l.round(0.5, 0.5, 0.26, 0.26, 0.14, 0.56, windowWarm, 1);
    surroundWindows(l, 0.5, 0.5, 0.48, 0.48, 0.18, 0.44, 2, 2, 0.09, iron, gold);
    surroundDoorsAndAwnings(l, 0.5, 0.5, 0.5, 0.5, 0.14, 0.38, iron, copper);
    l.dome(0.5, 0.5, 0.27, 0.27, 0.7, 0.48, windowWarm);
    l.round(0.5, 0.5, 0.08, 0.1, 1.18, 0.22, copper);
    l.round(0.5, 0.5, 0.01, 0.035, 1.4, 0.22, gold);
  },
};
