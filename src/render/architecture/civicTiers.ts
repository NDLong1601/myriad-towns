import { type Lot, type Recipes } from './lot';

const stoneCurb = '#7e796e';
const stonePlinth = '#767167';
const stoneLight = '#c8bfa8';
const limestone = '#dfd3bc';
const limestoneBright = '#ece4d2';
const marble = '#f2eee4';
const plaster = '#ede5d4';
const timber = '#533a24';
const timberDark = '#3d2a19';
const oak = '#7d5a3b';
const brick = '#b85d43';
const slate = '#465866';
const slateDark = '#34434f';
const copper = '#558c7c';
const copperLight = '#6fa896';
const terracotta = '#c85a32';
const terracottaDark = '#a34422';
const burgundy = '#7c2e2b';
const burgundyLight = '#963b37';
const sage = '#6b8e67';
const gold = '#d9b14a';
const iron = '#2f3538';
const water = '#4d8da6';
const windowWarm = '#f5be42';

/** Stone curb border around a lot perimeter, staying strictly inside [0.02, 0.98]. */
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

/** Stepped pitched roof courses along X or Z axis for rich tactile relief. */
function steppedGableRoof(
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
    if (along === 'x') {
      l.block(x, z, w * 1.01, span, cy, ch, col);
    } else {
      l.block(x, z, span, d * 1.01, cy, ch, col);
    }
  }
  if (along === 'x') {
    l.block(x, z, w + 0.02, 0.036, y + h - 0.012, 0.032, ridgeColor);
  } else {
    l.block(x, z, 0.036, d + 0.02, y + h - 0.012, 0.032, ridgeColor);
  }
}

/** Framed glowing window with sill and mullion on a Z-facing or X-facing wall. */
function framedWindowZ(
  l: Lot,
  x: number,
  z: number,
  w: number,
  y: number,
  h: number,
  frame = timberDark,
  sill = stoneLight,
  flowerBox = false,
): void {
  const dir = z >= 0.5 ? 1 : -1;
  l.block(x, z, w + 0.016, 0.018, y - 0.008, h + 0.016, frame);
  l.block(x, z + dir * 0.004, w, 0.014, y, h, windowWarm, 1);
  l.block(x, z + dir * 0.008, w + 0.022, 0.024, y - 0.014, 0.014, sill);
  if (flowerBox) {
    l.block(x, z + dir * 0.014, w + 0.02, 0.026, y - 0.028, 0.022, timber);
    l.block(x - w * 0.25, z + dir * 0.016, w * 0.35, 0.02, y - 0.008, 0.016, '#e24864');
    l.block(x + w * 0.25, z + dir * 0.016, w * 0.35, 0.02, y - 0.008, 0.016, '#f7d23d');
  }
}

function framedWindowX(
  l: Lot,
  x: number,
  z: number,
  d: number,
  y: number,
  h: number,
  frame = timberDark,
  sill = stoneLight,
  flowerBox = false,
): void {
  const dir = x >= 0.5 ? 1 : -1;
  l.block(x, z, 0.018, d + 0.016, y - 0.008, h + 0.016, frame);
  l.block(x + dir * 0.004, z, 0.014, d, y, h, windowWarm, 1);
  l.block(x + dir * 0.008, z, 0.024, d + 0.022, y - 0.014, 0.014, sill);
  if (flowerBox) {
    l.block(x + dir * 0.014, z, 0.026, d + 0.02, y - 0.028, 0.022, timber);
    l.block(x + dir * 0.016, z - d * 0.25, 0.02, d * 0.35, y - 0.008, 0.016, '#f7d23d');
    l.block(x + dir * 0.016, z + d * 0.25, 0.02, d * 0.35, y - 0.008, 0.016, '#e24864');
  }
}

/** Places framed windows on the rear (-Z) and both side (-X, +X) walls, plus a rear portal on -Z. */
function surroundRearAndSideWindows(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  colsZ = 2,
  colsX = 2,
  frame = timberDark,
  sill = stoneLight,
  flowerBox = false,
): void {
  const zBack = hz - hd / 2 - 0.005;
  const spanX = hw * 0.72;
  for (let i = 0; i < colsZ; i++) {
    const wx = hx + (colsZ === 1 ? 0 : ((i + 0.5) / colsZ - 0.5) * spanX);
    framedWindowZ(l, wx, zBack, 0.068, y, h, frame, sill, flowerBox);
  }
  const spanZ = hd * 0.7;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    framedWindowX(l, hx - hw / 2 - 0.005, wz, 0.068, y, h, frame, sill, flowerBox);
    framedWindowX(l, hx + hw / 2 + 0.005, wz, 0.068, y, h, frame, sill, flowerBox);
  }
  l.block(hx, zBack - 0.002, 0.09, 0.016, 0.04, 0.18, oak);
  l.block(hx, zBack - 0.005, 0.11, 0.022, 0.21, 0.018, sill);
}

/** Streetlamp with glowing lantern head. */
function streetLamp(l: Lot, x: number, z: number, y = 0.035, h = 0.22): void {
  l.block(x, z, 0.028, 0.028, y, 0.04, stonePlinth);
  l.round(x, z, 0.009, 0.012, y + 0.04, h - 0.04, iron);
  l.block(x, z, 0.032, 0.032, y + h, 0.042, windowWarm, 1);
  l.block(x, z, 0.04, 0.04, y + h + 0.04, 0.012, iron);
}

/** Striped market stall with counter, posts, pitched awning and produce crates. */
function marketStall(
  l: Lot,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
  stripeA: string,
  stripeB: string,
  crates: readonly string[],
): void {
  l.block(x, z, w, d * 0.82, y, 0.14, oak);
  l.block(x, z, w + 0.02, d * 0.88, y + 0.13, 0.022, '#9e7852');
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      l.block(x + sx * (w * 0.44), z + sz * (d * 0.38), 0.022, 0.022, y, 0.34, timber);
    }
  }
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const bx = x + ((i + 0.5) / bands - 0.5) * (w + 0.03);
    const bw = (w + 0.03) / bands;
    const col = i % 2 === 0 ? stripeA : stripeB;
    l.ridge(bx, z, bw, d + 0.04, y + 0.33, 0.11, 'x', col);
    l.block(bx, z + d * 0.52, bw, 0.014, y + 0.3, 0.035, col);
  }
  for (let i = 0; i < crates.length; i++) {
    const cx = x + ((i + 0.5) / crates.length - 0.5) * (w * 0.78);
    l.block(cx, z + d * 0.18, 0.055, 0.065, y + 0.15, 0.035, '#78583a');
    l.block(cx, z + d * 0.18, 0.045, 0.052, y + 0.18, 0.02, crates[i]!);
  }
}

/** Stone basin fountain with water surface and central jet column. */
function stoneFountain(
  l: Lot,
  x: number,
  z: number,
  radius: number,
  y = 0.035,
  grand = false,
): void {
  l.round(x, z, radius, radius * 1.06, y, 0.085, stoneLight);
  l.round(x, z, radius * 0.82, radius * 0.82, y + 0.08, 0.015, water);
  l.round(x, z, radius * 0.24, radius * 0.32, y + 0.08, 0.14, limestoneBright);
  if (grand) {
    l.round(x, z, radius * 0.52, radius * 0.42, y + 0.18, 0.035, marble);
    l.round(x, z, radius * 0.42, radius * 0.42, y + 0.21, 0.012, water);
    l.round(x, z, radius * 0.12, radius * 0.16, y + 0.21, 0.09, gold);
  }
}

/** Corner ashlar stone quoins on a rectangular building mass. */
function cornerQuoins(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y0: number,
  h: number,
  courses = 5,
  color = stoneLight,
): void {
  const step = h / courses;
  for (let i = 0; i < courses; i++) {
    const y = y0 + i * step + step * 0.1;
    const qh = step * 0.72;
    const wSpan = i % 2 === 0 ? 0.036 : 0.024;
    const dSpan = i % 2 === 0 ? 0.024 : 0.036;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        l.block(
          hx + sx * (hw / 2 - wSpan * 0.35),
          hz + sz * (hd / 2 - dSpan * 0.35),
          wSpan,
          dSpan,
          y,
          qh,
          color,
        );
      }
    }
  }
}

export const civicTiers: Recipes = {
  // ===========================================================================
  // 1. MARKET CHAIN (2×2): market -> covered_market -> grand_bazaar
  // ===========================================================================
  market(l) {
    l.base('#b8a582', 0.035);
    lotCurb(l, 10, 0, 0.04);

    // Cobblestone patches in the dirt market square
    for (const [px, pz, pw, pd] of [
      [0.48, 0.52, 0.46, 0.38],
      [0.48, 0.82, 0.34, 0.2],
      [0.24, 0.68, 0.22, 0.18],
    ] as const) {
      l.block(px, pz, pw, pd, 0.035, 0.006, '#9e9580');
    }

    // 3 rustic wooden stalls with plain cream canvas pitched roofs
    marketStall(l, 0.24, 0.3, 0.3, 0.2, 0.035, '#dfd3b8', '#cbbba0', [
      '#c83e37',
      '#df852b',
      '#53873e',
    ]);
    marketStall(l, 0.62, 0.28, 0.3, 0.2, 0.035, '#e5d9be', '#cfbfa2', [
      '#d9b65c',
      '#c83e37',
      '#6d9449',
    ]);
    marketStall(l, 0.72, 0.64, 0.28, 0.22, 0.035, '#dfd3b8', '#c8b798', [
      '#df852b',
      '#53873e',
      '#a86445',
    ]);

    // Grain sacks, apple crates & barrels around the square
    for (const [sx, sz] of [
      [0.44, 0.22],
      [0.48, 0.26],
      [0.86, 0.46],
    ] as const) {
      l.round(sx, sz, 0.026, 0.032, 0.035, 0.065, '#c7b28a');
    }
    l.round(0.14, 0.52, 0.028, 0.025, 0.035, 0.075, oak);
    l.round(0.19, 0.54, 0.028, 0.025, 0.035, 0.075, oak);

    // Rustic wooden market signpost & 4-directional market lanterns
    l.block(0.32, 0.84, 0.024, 0.024, 0.035, 0.24, timber);
    l.block(0.37, 0.84, 0.11, 0.02, 0.23, 0.022, timber);
    l.block(0.38, 0.84, 0.08, 0.014, 0.15, 0.068, '#d4b886');
    streetLamp(l, 0.16, 0.82, 0.035, 0.2);
    streetLamp(l, 0.84, 0.18, 0.035, 0.2);
  },

  covered_market(l) {
    l.base('#aca38e', 0.035);
    lotCurb(l, 12, 0, 0.044);

    // Central raised stone plinth for the Timber Market Pavilion
    const px = 0.52;
    const pz = 0.33;
    const pw = 0.64;
    const pd = 0.4;
    l.block(px, pz, pw, pd, 0.035, 0.075, stonePlinth);
    l.block(px, pz, pw - 0.02, pd - 0.02, 0.11, 0.015, stoneLight);
    // Front entrance steps up to the pavilion
    for (const [stepZ, stepH] of [
      [pz + pd / 2 + 0.025, 0.06],
      [pz + pd / 2 + 0.055, 0.04],
      [pz + pd / 2 + 0.085, 0.02],
    ] as const) {
      l.block(px, stepZ, 0.2, 0.032, 0.035, stepH, stoneLight);
    }

    // 6 heavy oak timber columns & diagonal knee braces
    const colY = 0.125;
    const colH = 0.34;
    for (const cx of [px - 0.27, px, px + 0.27]) {
      for (const cz of [pz - 0.16, pz + 0.16]) {
        l.block(cx, cz, 0.038, 0.038, colY, 0.035, stoneLight);
        l.block(cx, cz, 0.03, 0.03, colY + 0.035, colH, timber);
      }
    }
    l.block(px, pz - 0.16, pw - 0.04, 0.028, colY + colH, 0.03, timberDark);
    l.block(px, pz + 0.16, pw - 0.04, 0.028, colY + colH, 0.03, timberDark);

    // Interior market counters inside pavilion
    l.block(px - 0.16, pz, 0.18, 0.22, colY, 0.11, oak);
    l.block(px + 0.16, pz, 0.18, 0.22, colY, 0.11, oak);

    // Stepped terracotta roof + cross-gable over front stairs
    const roofY = colY + colH + 0.02;
    steppedGableRoof(l, px, pz, pw + 0.06, pd + 0.06, roofY, 0.32, 'x', [
      terracottaDark,
      terracotta,
      '#d96b3f',
      terracotta,
    ]);
    steppedGableRoof(l, px, pz + 0.08, 0.28, 0.32, roofY + 0.02, 0.26, 'z', [
      terracottaDark,
      terracotta,
      '#d96b3f',
    ]);

    // Clock & Bell Cupola crowning the pavilion ridge (4-sided glowing clock faces)
    const cupY = roofY + 0.28;
    l.block(px, pz, 0.11, 0.11, cupY, 0.12, plaster);
    l.block(px, pz + 0.056, 0.065, 0.012, cupY + 0.025, 0.065, windowWarm, 1);
    l.block(px, pz - 0.056, 0.065, 0.012, cupY + 0.025, 0.065, windowWarm, 1);
    l.block(px + 0.056, pz, 0.012, 0.065, cupY + 0.025, 0.065, windowWarm, 1);
    l.block(px - 0.056, pz, 0.012, 0.065, cupY + 0.025, 0.065, windowWarm, 1);
    for (const sx of [-0.04, 0.04]) {
      for (const sz of [-0.04, 0.04]) {
        l.block(px + sx, pz + sz, 0.016, 0.016, cupY + 0.12, 0.09, timber);
      }
    }
    l.round(px, pz, 0.02, 0.028, cupY + 0.13, 0.05, gold);
    l.round(px, pz, 0.008, 0.085, cupY + 0.21, 0.14, terracottaDark);

    // 3 Vibrant striped merchant stalls in the foreground plaza
    marketStall(l, 0.24, 0.58, 0.26, 0.18, 0.035, '#c24238', '#f0e4cc', [
      '#c83832',
      '#e28429',
      '#528a3d',
    ]);
    marketStall(l, 0.5, 0.68, 0.26, 0.18, 0.035, '#3d6f8a', '#e8c35a', [
      '#3f6b82',
      '#c96f44',
      '#d9b65c',
    ]);
    marketStall(l, 0.78, 0.58, 0.24, 0.18, 0.035, '#598249', '#efe5ce', [
      '#d9b65c',
      '#648f47',
      '#9e6b43',
    ]);

    // Roofed town notice board on the left
    l.block(0.11, 0.44, 0.02, 0.16, 0.035, 0.22, timber);
    l.block(0.115, 0.44, 0.016, 0.13, 0.11, 0.11, '#dfd2b5');
    l.ridge(0.11, 0.44, 0.06, 0.19, 0.24, 0.05, 'z', terracotta);

    // Wooden two-wheel handcart & long wooden table
    l.block(0.36, 0.84, 0.16, 0.08, 0.035, 0.065, oak);
    l.block(0.54, 0.86, 0.11, 0.07, 0.065, 0.045, '#7c5838');
    l.round(0.54, 0.82, 0.026, 0.026, 0.035, 0.014, timberDark);
    l.round(0.54, 0.9, 0.026, 0.026, 0.035, 0.014, timberDark);

    // Octagonal stone fountain in front-right plaza & warm brass lanterns
    stoneFountain(l, 0.76, 0.82, 0.095, 0.035, false);
    streetLamp(l, 0.26, 0.38, 0.035, 0.24);
    streetLamp(l, 0.46, 0.88, 0.035, 0.22);
  },

  grand_bazaar(l) {
    l.base('#c9c2b2', 0.04);
    lotCurb(l, 14, 0, 0.048);

    // Patterned marble forecourt & central 2-tier fountain
    l.block(0.5, 0.78, 0.46, 0.28, 0.04, 0.008, marble);
    stoneFountain(l, 0.5, 0.8, 0.11, 0.045, true);

    // Grand two-story Neoclassical Market Hall (U-shaped / basilica mass)
    const hx = 0.5;
    const hz = 0.38;
    const hw = 0.84;
    const hd = 0.52;
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.04, 0.08, stonePlinth);
    l.block(hx, hz, hw, hd, 0.12, 0.68, limestone);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.22,
      0.2,
      4,
      2,
      stoneLight,
      limestoneBright,
      false,
    );
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.5,
      0.2,
      4,
      2,
      stoneLight,
      limestoneBright,
      false,
    );
    cornerQuoins(l, hx, hz, hw, hd, 0.12, 0.68, 6, stoneLight);

    // Belt courses and upper cornice
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.44, 0.028, limestoneBright);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.78, 0.04, limestoneBright);

    // Ground-floor merchant arcade arches & crimson-gold banners
    for (const ax of [0.2, 0.34, 0.66, 0.8]) {
      l.block(ax, hz + hd / 2 + 0.005, 0.08, 0.022, 0.12, 0.26, '#3d2c20');
      l.block(ax, hz + hd / 2 + 0.01, 0.068, 0.016, 0.14, 0.22, windowWarm, 1);
      l.block(ax + 0.055, hz + hd / 2 + 0.012, 0.026, 0.012, 0.18, 0.2, '#a82828');
      // Upper floor arched windows
      framedWindowZ(l, ax, hz + hd / 2 + 0.006, 0.072, 0.5, 0.2, stoneLight, limestoneBright);
    }

    // Glazed steel-and-glass clerestory vaulted roof over the market wings
    l.vaultedCanopy(0.27, hz, 0.34, 0.42, 0.82, 0.18);
    l.vaultedCanopy(0.73, hz, 0.34, 0.42, 0.82, 0.18);
    // Pediment gables at wing ends
    l.ridge(0.24, hz + hd / 2 - 0.04, 0.26, 0.12, 0.82, 0.16, 'z', limestoneBright);
    l.ridge(0.76, hz + hd / 2 - 0.04, 0.26, 0.12, 0.82, 0.16, 'z', limestoneBright);

    // Central Clock & Bell Tower rising above the Grand Entrance Portal
    l.block(0.5, hz + 0.06, 0.22, 0.24, 0.12, 1.02, limestoneBright);
    l.block(0.5, hz + hd / 2 + 0.012, 0.12, 0.026, 0.12, 0.32, oak);
    l.dome(0.5, hz + hd / 2 + 0.012, 0.06, 0.02, 0.44, 0.06, gold);
    // Illuminated 4-sided clock faces
    l.block(0.5, hz + 0.182, 0.095, 0.016, 0.94, 0.11, gold);
    l.block(0.5, hz + 0.188, 0.075, 0.014, 0.95, 0.09, windowWarm, 1);
    l.block(0.612, hz + 0.06, 0.016, 0.095, 0.94, 0.11, gold);
    l.block(0.388, hz + 0.06, 0.016, 0.095, 0.94, 0.11, gold);
    // Gilded copper spire
    l.ridge(0.5, hz + 0.06, 0.24, 0.26, 1.14, 0.14, 'x', slate);
    l.round(0.5, hz + 0.06, 0.012, 0.095, 1.24, 0.34, copper);
    l.round(0.5, hz + 0.06, 0.005, 0.022, 1.56, 0.09, gold);

    // Ornate double-globe brass streetlamps in the plaza
    streetLamp(l, 0.16, 0.78, 0.04, 0.28);
    streetLamp(l, 0.84, 0.78, 0.04, 0.28);
  },

  // ===========================================================================
  // 2. TAVERN CHAIN (1×1): tavern -> guild_tavern -> grand_inn
  // ===========================================================================
  tavern(l) {
    l.base('#7b9654', 0.035);
    lotCurb(l, 8, 0, 0.04);

    // Dirt & cobble front yard
    l.block(0.46, 0.76, 0.56, 0.3, 0.035, 0.006, '#a49579');

    // 1-story rustic timber-and-plaster alehouse
    const hx = 0.44;
    const hz = 0.43;
    const hw = 0.54;
    const hd = 0.5;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.07, stonePlinth);
    l.block(hx, hz, hw, hd, 0.105, 0.26, plaster);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.16, 0.1, 2, 2, timberDark, stoneLight, false);
    l.ridge(hx, hz, hw, hd, 0.365, 0.26, 'z', plaster);

    // Timber framing on walls
    for (const cx of [hx - hw / 2 + 0.015, hx + hw / 2 - 0.015]) {
      for (const cz of [hz - hd / 2 + 0.015, hz + hd / 2 - 0.015]) {
        l.block(cx, cz, 0.028, 0.028, 0.105, 0.26, timber);
      }
    }
    l.block(hx, hz + hd / 2 + 0.002, hw, 0.02, 0.35, 0.022, timber);
    l.beam(
      [hx - 0.22, 0.12, hz + hd / 2 + 0.004],
      [hx - 0.08, 0.35, hz + hd / 2 + 0.004],
      0.02,
      timber,
    );
    l.beam(
      [hx + 0.22, 0.12, hz + hd / 2 + 0.004],
      [hx + 0.08, 0.35, hz + hd / 2 + 0.004],
      0.02,
      timber,
    );

    // Weathered shingle pitched roof + side cross-gable
    steppedGableRoof(l, hx, hz, hw + 0.08, hd + 0.06, 0.365, 0.28, 'z', [
      '#5e4b3c',
      '#6e5846',
      '#594739',
    ]);
    l.block(hx + 0.18, hz + 0.14, 0.24, 0.24, 0.105, 0.22, plaster);
    steppedGableRoof(l, hx + 0.18, hz + 0.14, 0.28, 0.28, 0.325, 0.16, 'x', ['#8f553c', '#a36346']);

    // Front oak door, wooden bench & hanging wooden sign
    l.block(hx - 0.08, hz + hd / 2 + 0.008, 0.1, 0.018, 0.105, 0.19, oak);
    framedWindowZ(l, hx + 0.18, hz + 0.265, 0.09, 0.17, 0.1);
    framedWindowX(l, hx + hw / 2 + 0.006, hz - 0.08, 0.1, 0.17, 0.1);
    l.block(hx - 0.28, hz + hd / 2 + 0.04, 0.08, 0.018, 0.32, 0.018, timber);
    l.block(hx - 0.3, hz + hd / 2 + 0.04, 0.05, 0.014, 0.25, 0.065, '#cfa055');

    // Bench & two oak barrels outside
    l.block(hx + 0.08, 0.73, 0.18, 0.055, 0.035, 0.055, oak);
    l.round(0.79, 0.56, 0.038, 0.034, 0.035, 0.09, oak);
    l.round(0.84, 0.66, 0.038, 0.034, 0.035, 0.09, oak);
  },

  guild_tavern(l) {
    // Matches the approved Concept Art for Quán rượu 1×1 (Tudor Guild Tavern with Beer Garden)
    l.base('#9a927e', 0.035);
    lotCurb(l, 9, 0, 0.042);

    const hx = 0.42;
    const hz = 0.4;
    const hw = 0.46;
    const hd = 0.52;
    const plinthY = 0.035;
    const plinthH = 0.095;
    const wallY = plinthY + plinthH; // 0.13
    const wallH = 0.36;
    const roofY = wallY + wallH; // 0.49
    const roofH = 0.38;

    // Raised stone plinth with masonry relief blocks
    l.block(hx, hz, hw + 0.035, hd + 0.035, plinthY, plinthH, stonePlinth);
    l.block(hx + hw / 2 + 0.01, hz + hd / 2, 0.05, 0.04, plinthY + 0.015, 0.065, stoneLight);
    l.block(hx - hw / 2 - 0.01, hz + hd / 2, 0.05, 0.04, plinthY + 0.015, 0.065, stoneLight);

    // Cream plaster walls & gable
    l.block(hx, hz, hw, hd, wallY, wallH, plaster);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      wallY + 0.06,
      0.12,
      2,
      2,
      timberDark,
      timber,
      true,
    );
    l.ridge(hx, hz, hw, hd, roofY, roofH, 'z', plaster);

    // Rich Tudor dark oak timber framing (corner posts, floor belt, studs & diagonal braces)
    for (const cx of [hx - hw / 2 + 0.012, hx + hw / 2 - 0.012]) {
      for (const cz of [hz - hd / 2 + 0.012, hz + hd / 2 - 0.012]) {
        l.block(cx, cz, 0.028, 0.028, wallY, wallH, timber);
      }
    }
    for (const y of [wallY, wallY + 0.19, roofY - 0.018]) {
      l.block(hx, hz + hd / 2 + 0.003, hw + 0.01, 0.022, y, 0.022, timber);
      l.block(hx + hw / 2 + 0.003, hz, 0.022, hd + 0.01, y, 0.022, timber);
      l.block(hx - hw / 2 - 0.003, hz, 0.022, hd + 0.01, y, 0.022, timber);
    }
    const fz = hz + hd / 2 + 0.005;
    l.beam([hx, roofY, fz], [hx, roofY + roofH - 0.03, fz], 0.024, timber);
    l.beam([hx - 0.18, roofY, fz], [hx - 0.05, roofY + 0.2, fz], 0.02, timber);
    l.beam([hx + 0.18, roofY, fz], [hx + 0.05, roofY + 0.2, fz], 0.02, timber);

    // Steep 6-course burgundy-terracotta stepped tile roof + overhanging eaves & bargeboards
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.08,
      hd + 0.06,
      roofY,
      roofH,
      'z',
      ['#692320', burgundy, burgundyLight, burgundy, '#8c3531', '#692320'],
      oak,
    );
    l.beam(
      [hx - hw / 2 - 0.04, roofY, fz + 0.02],
      [hx, roofY + roofH + 0.02, fz + 0.02],
      0.032,
      timber,
    );
    l.beam(
      [hx + hw / 2 + 0.04, roofY, fz + 0.02],
      [hx, roofY + roofH + 0.02, fz + 0.02],
      0.032,
      timber,
    );

    // Offset Dormer window on +X slope
    const dx = hx + 0.16;
    const dz = hz - 0.02;
    l.block(dx, dz, 0.16, 0.14, roofY + 0.12, 0.15, plaster);
    framedWindowX(l, dx + 0.082, dz, 0.075, roofY + 0.15, 0.085, timberDark, timber, true);
    l.ridge(dx, dz, 0.2, 0.18, roofY + 0.26, 0.09, 'x', burgundy);

    // Tall rear stone masonry chimney
    l.block(hx - 0.04, hz - hd / 2 + 0.08, 0.11, 0.11, roofY + 0.18, 0.34, stonePlinth);
    l.block(hx - 0.04, hz - hd / 2 + 0.08, 0.13, 0.13, roofY + 0.49, 0.03, stoneLight);

    // Covered front timber porch with steps & Wrought-Iron Golden Tankard Signboard
    const px = hx - 0.06;
    const pz = hz + hd / 2 + 0.075;
    l.block(px, hz + hd / 2 + 0.008, 0.095, 0.018, wallY, 0.19, oak);
    l.block(px, pz, 0.17, 0.13, plinthY, 0.085, oak);
    for (const [sz, sh] of [
      [pz + 0.08, 0.06],
      [pz + 0.11, 0.035],
    ] as const) {
      l.block(px + 0.06, sz, 0.09, 0.03, plinthY, sh, oak);
    }
    l.block(px - 0.07, pz + 0.05, 0.022, 0.022, plinthY + 0.085, 0.2, timber);
    l.block(px + 0.07, pz + 0.05, 0.022, 0.022, plinthY + 0.085, 0.2, timber);
    steppedGableRoof(l, px, pz, 0.21, 0.16, plinthY + 0.28, 0.1, 'z', [burgundy, burgundyLight]);

    // Wrought-iron bracket & golden beer mug signboard above porch
    l.block(px, fz + 0.05, 0.016, 0.1, roofY + 0.06, 0.018, iron);
    l.block(px, fz + 0.09, 0.022, 0.08, roofY - 0.04, 0.095, oak);
    l.round(px, fz + 0.09, 0.022, 0.022, roofY - 0.02, 0.055, gold, 1);

    // Warm leaded windows with flower boxes on +X and +Z walls
    framedWindowZ(l, hx + 0.13, fz, 0.085, wallY + 0.06, 0.11, timberDark, timber, true);
    for (const wz of [hz - 0.13, hz + 0.12]) {
      framedWindowX(
        l,
        hx + hw / 2 + 0.006,
        wz,
        0.095,
        wallY + 0.06,
        0.12,
        timberDark,
        timber,
        true,
      );
    }

    // Side Beer Garden: low stone perimeter wall, 2 round oak tables, stools, 2-tier ale barrel rack & lanterns
    l.block(0.89, 0.62, 0.035, 0.44, plinthY, 0.085, stonePlinth);
    l.block(0.76, 0.84, 0.28, 0.035, plinthY, 0.085, stonePlinth);
    for (const [tx, tz] of [
      [0.54, 0.83],
      [0.75, 0.68],
    ] as const) {
      l.round(tx, tz, 0.018, 0.024, plinthY, 0.065, timberDark);
      l.round(tx, tz, 0.062, 0.062, plinthY + 0.065, 0.016, oak);
      for (const [ox, oz] of [
        [-0.075, 0],
        [0.075, 0],
        [0, 0.075],
      ] as const) {
        l.round(tx + ox, tz + oz, 0.022, 0.02, plinthY, 0.042, oak);
      }
    }
    // 2-tier oak ale cask rack in rear-right of beer garden
    l.block(0.78, 0.46, 0.14, 0.16, plinthY, 0.09, timber);
    for (const bz of [0.42, 0.5]) {
      l.round(0.78, bz, 0.034, 0.034, plinthY + 0.02, 0.065, oak);
      l.round(0.78, bz, 0.034, 0.034, plinthY + 0.09, 0.065, '#966b43');
    }
    streetLamp(l, 0.66, 0.76, plinthY, 0.19);
    streetLamp(l, 0.86, 0.44, plinthY, 0.21);
  },

  grand_inn(l) {
    l.base('#b5ad9b', 0.035);
    lotCurb(l, 10, 0, 0.045);

    const hx = 0.44;
    const hz = 0.42;
    const hw = 0.54;
    const hd = 0.54;
    // Dressed stone ground story + carved oak half-timbered upper stories
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.035, 0.24, stoneLight);
    cornerQuoins(l, hx, hz, hw + 0.02, hd + 0.02, 0.035, 0.24, 3, limestoneBright);
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.275, 0.34, plaster);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw + 0.04,
      hd + 0.04,
      0.34,
      0.14,
      2,
      2,
      timberDark,
      gold,
      true,
    );
    l.ridge(hx, hz, hw + 0.04, hd + 0.04, 0.615, 0.42, 'z', plaster);

    // Timber framing on upper stories
    for (const y of [0.275, 0.45, 0.6]) {
      l.block(hx, hz + hd / 2 + 0.022, hw + 0.05, 0.024, y, 0.024, timber);
      l.block(hx + hw / 2 + 0.022, hz, 0.024, hd + 0.05, y, 0.024, timber);
    }

    // Steep slate-and-terracotta roof with twin dormers
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.1,
      hd + 0.08,
      0.615,
      0.44,
      'z',
      [slateDark, slate, '#556b7a', slate, terracotta],
      gold,
    );
    for (const dz of [hz - 0.11, hz + 0.09]) {
      l.block(hx + 0.18, dz, 0.16, 0.11, 0.72, 0.15, plaster);
      framedWindowX(l, hx + 0.262, dz, 0.065, 0.75, 0.085, timberDark, gold);
      l.ridge(hx + 0.18, dz, 0.19, 0.14, 0.87, 0.09, 'x', slateDark);
    }

    // Cylindrical Corner Turret with Conical Slate Spire (front-right of inn)
    const tx = 0.76;
    const tz = 0.56;
    l.round(tx, tz, 0.105, 0.11, 0.035, 0.26, stoneLight);
    l.round(tx, tz, 0.115, 0.11, 0.295, 0.46, plaster);
    l.round(tx, tz, 0.12, 0.12, 0.52, 0.024, timber);
    l.round(tx, tz, 0.12, 0.12, 0.74, 0.024, timber);
    l.round(tx, tz, 0.01, 0.135, 0.755, 0.38, slateDark);
    l.round(tx, tz, 0.005, 0.02, 1.13, 0.07, gold);

    // Second-floor flower-draped balcony on +X and +Z facades
    l.block(hx + hw / 2 + 0.05, hz - 0.04, 0.06, 0.32, 0.42, 0.025, oak);
    l.block(hx + hw / 2 + 0.07, hz - 0.04, 0.024, 0.32, 0.445, 0.055, timber);
    l.block(hx + hw / 2 + 0.075, hz - 0.04, 0.028, 0.3, 0.48, 0.03, '#447b31');
    l.block(hx + hw / 2 + 0.08, hz - 0.1, 0.02, 0.08, 0.49, 0.025, '#e24864');
    l.block(hx + hw / 2 + 0.08, hz + 0.04, 0.02, 0.08, 0.49, 0.025, '#f7d23d');

    // Ground floor arched glowing windows, Gilded Crest Signboard & festive patio
    framedWindowZ(l, hx - 0.12, hz + hd / 2 + 0.012, 0.09, 0.1, 0.12, stonePlinth, stoneLight);
    framedWindowZ(l, hx + 0.08, hz + hd / 2 + 0.012, 0.09, 0.1, 0.12, stonePlinth, stoneLight);
    framedWindowZ(l, hx, hz + hd / 2 + 0.024, 0.12, 0.34, 0.14, timberDark, gold, true);
    l.block(0.18, 0.68, 0.08, 0.018, 0.46, 0.02, iron);
    l.block(0.16, 0.68, 0.06, 0.016, 0.36, 0.095, gold, 1);

    // Outdoor patio table & lanterns
    l.round(0.58, 0.82, 0.065, 0.065, 0.035, 0.075, oak);
    streetLamp(l, 0.42, 0.86, 0.035, 0.22);
    streetLamp(l, 0.78, 0.82, 0.035, 0.22);
  },

  // ===========================================================================
  // 3. TOWN HALL CHAIN (2×2): town_hall -> civic_hall -> magistrate_palace
  // ===========================================================================
  town_hall(l) {
    l.base('#909c6f', 0.035);
    lotCurb(l, 12, 0, 0.042);

    // Cobblestone forecourt & side lawns
    l.block(0.5, 0.68, 0.68, 0.48, 0.035, 0.008, '#aca48e');

    // 1.5-story stone-and-timber Meeting Hall
    const hx = 0.5;
    const hz = 0.39;
    const hw = 0.72;
    const hd = 0.46;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.085, stonePlinth);
    l.block(hx, hz, hw, hd, 0.12, 0.38, stoneLight);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.22, 0.16, 3, 2, timberDark, stonePlinth, false);
    cornerQuoins(l, hx, hz, hw, hd, 0.12, 0.38, 4, stonePlinth);

    // Stepped wood-shingle roof + front cross-gable
    steppedGableRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.5, 0.34, 'x', [
      '#5e4938',
      '#705844',
      '#5e4938',
    ]);
    steppedGableRoof(l, hx, hz + 0.12, 0.36, 0.36, 0.5, 0.3, 'z', ['#705844', '#826750']);

    // 4-post timber entrance porch & stone steps
    l.block(hx, 0.68, 0.38, 0.16, 0.035, 0.085, stoneLight);
    for (const cx of [0.35, 0.45, 0.55, 0.65]) {
      l.block(cx, 0.73, 0.028, 0.028, 0.12, 0.34, timber);
    }
    l.ridge(hx, 0.67, 0.4, 0.18, 0.45, 0.14, 'z', '#5e4938');

    // Open timber bell turret on the ridge
    l.block(hx, hz, 0.14, 0.14, 0.78, 0.16, timber);
    l.round(hx, hz, 0.028, 0.038, 0.82, 0.06, gold);
    l.ridge(hx, hz, 0.17, 0.17, 0.94, 0.11, 'x', '#4f3d2f');

    // Glowing windows
    for (const wx of [0.24, 0.76]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.008, 0.1, 0.22, 0.16, timberDark, stonePlinth);
    }
  },

  civic_hall(l) {
    // Matches the approved Concept Art for Toà thị chính 2×2 (Neoclassical Civic Hall)
    l.base('#bab3a0', 0.035);
    lotCurb(l, 12, 0, 0.045);

    const hx = 0.5;
    const hz = 0.38;
    const hw = 0.78;
    const hd = 0.48;
    // Raised stone plinth & 2-story limestone main block
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.1, stonePlinth);
    l.block(hx, hz, hw, hd, 0.135, 0.68, limestone);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.22,
      0.16,
      3,
      2,
      timberDark,
      limestoneBright,
      false,
    );
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.54,
      0.16,
      3,
      2,
      timberDark,
      limestoneBright,
      false,
    );
    cornerQuoins(l, hx, hz, hw, hd, 0.135, 0.68, 6, stoneLight);
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.46, 0.028, limestoneBright);
    l.block(hx, hz, hw + 0.035, hd + 0.035, 0.8, 0.04, limestoneBright);

    // Steep blue-grey slate roof with dormers & wrought-iron cresting railing
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.04,
      hd + 0.04,
      0.84,
      0.34,
      'x',
      [slateDark, slate, '#566b7a', slate],
      iron,
    );
    l.block(hx, hz, hw * 0.65, 0.12, 1.17, 0.035, iron);
    for (const dx of [0.24, 0.76]) {
      l.block(dx, hz + 0.15, 0.11, 0.1, 0.9, 0.13, limestone);
      framedWindowZ(l, dx, hz + 0.205, 0.055, 0.92, 0.08, timberDark, limestoneBright);
      l.ridge(dx, hz + 0.15, 0.13, 0.12, 1.03, 0.07, 'z', slateDark);
    }

    // Projecting 4-Column Classical Portico with Golden Crest Pediment & Crimson Banners
    const pz = hz + hd / 2 + 0.09;
    l.block(hx, pz, 0.44, 0.18, 0.035, 0.12, stoneLight);
    for (const cx of [0.33, 0.44, 0.56, 0.67]) {
      l.round(cx, pz + 0.06, 0.022, 0.026, 0.155, 0.64, limestoneBright);
    }
    l.block(hx, pz + 0.01, 0.46, 0.18, 0.79, 0.055, limestoneBright);
    l.ridge(hx, pz + 0.01, 0.48, 0.2, 0.845, 0.18, 'z', slate);
    l.block(hx, pz + 0.105, 0.11, 0.018, 0.87, 0.08, gold, 1);

    // Crimson vertical banners flanking portico
    for (const bx of [0.29, 0.71]) {
      l.block(bx, hz + hd / 2 + 0.012, 0.045, 0.014, 0.38, 0.34, '#9e2a2b');
      l.block(bx, hz + hd / 2 + 0.014, 0.05, 0.016, 0.71, 0.018, gold);
    }

    // Grand entrance staircase with balustrades & twin bronze standard lanterns
    for (const [sz, sh] of [
      [0.76, 0.1],
      [0.8, 0.075],
      [0.84, 0.05],
      [0.88, 0.025],
    ] as const) {
      l.block(hx, sz, 0.28, 0.042, 0.035, sh, stoneLight);
    }
    l.block(0.35, 0.82, 0.035, 0.16, 0.035, 0.14, limestoneBright);
    l.block(0.65, 0.82, 0.035, 0.16, 0.035, 0.14, limestoneBright);
    streetLamp(l, 0.35, 0.89, 0.14, 0.22);
    streetLamp(l, 0.65, 0.89, 0.14, 0.22);

    // 2-story facade windows + corner square planter boxes
    for (const wx of [0.19, 0.81]) {
      for (const wy of [0.22, 0.54]) {
        framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.085, wy, 0.16, timberDark, limestoneBright);
      }
    }
    for (const [qx, qz] of [
      [0.14, 0.78],
      [0.86, 0.78],
    ] as const) {
      l.block(qx, qz, 0.09, 0.09, 0.035, 0.055, stoneLight);
      l.block(qx, qz, 0.065, 0.065, 0.09, 0.03, '#4c7d3c');
    }

    // Central Clock Tower with 4 illuminated clock faces, open belfry & spire
    l.block(hx, hz, 0.22, 0.22, 1.08, 0.32, limestoneBright);
    l.block(hx, hz + 0.112, 0.095, 0.014, 1.16, 0.11, gold);
    l.block(hx, hz + 0.116, 0.075, 0.012, 1.17, 0.09, windowWarm, 1);
    l.block(hx + 0.112, hz, 0.014, 0.095, 1.16, 0.11, gold);
    l.block(hx + 0.116, hz, 0.012, 0.075, 1.17, 0.09, windowWarm, 1);
    // Open belfry arches & bronze bell
    for (const sx of [-0.08, 0.08]) {
      for (const sz of [-0.08, 0.08]) {
        l.block(hx + sx, hz + sz, 0.032, 0.032, 1.4, 0.18, limestoneBright);
      }
    }
    l.round(hx, hz, 0.032, 0.045, 1.44, 0.08, gold);
    l.block(hx, hz, 0.24, 0.24, 1.58, 0.04, slate);
    l.round(hx, hz, 0.012, 0.13, 1.62, 0.42, slateDark);
    l.round(hx, hz, 0.005, 0.02, 2.02, 0.08, gold);
  },

  magistrate_palace(l) {
    l.base('#d4cec0', 0.04);
    lotCurb(l, 14, 0, 0.048);

    const hx = 0.5;
    const hz = 0.36;
    const hw = 0.84;
    const hd = 0.5;
    // Monumental 2.5-story Palace body
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.12, stonePlinth);
    l.block(hx, hz, hw, hd, 0.16, 0.78, marble);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.24, 0.18, 4, 2, gold, stoneLight, false);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.6, 0.18, 4, 2, gold, stoneLight, false);
    cornerQuoins(l, hx, hz, hw, hd, 0.16, 0.78, 7, stoneLight);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.52, 0.032, stoneLight);
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.92, 0.045, gold);

    // Verdigris-copper & slate Mansard roof with gilded cresting
    l.mansard(hx, hz, hw + 0.04, hd + 0.04, 0.96, 0.34);
    l.block(hx, hz, hw * 0.78, hd * 0.65, 1.3, 0.04, copper);
    l.block(hx, hz, hw * 0.74, hd * 0.6, 1.34, 0.03, gold);

    // Grand Corinthian Portico with gilded pediment & Red Carpet Grand Staircase
    const pz = hz + hd / 2 + 0.09;
    l.block(hx, pz, 0.48, 0.18, 0.04, 0.14, stoneLight);
    for (const cx of [0.3, 0.38, 0.46, 0.54, 0.62, 0.7]) {
      l.round(cx, pz + 0.06, 0.02, 0.024, 0.18, 0.72, marble);
    }
    l.block(hx, pz + 0.01, 0.5, 0.2, 0.9, 0.055, marble);
    l.ridge(hx, pz + 0.01, 0.52, 0.22, 0.955, 0.2, 'z', copper);
    l.block(hx, pz + 0.115, 0.18, 0.02, 0.98, 0.09, gold, 1);

    // Red-carpeted marble staircase + twin circular fountains
    for (let i = 0; i < 5; i++) {
      const sz = 0.74 + i * 0.038;
      const sh = 0.13 - i * 0.024;
      l.block(hx, sz, 0.3, 0.04, 0.04, sh, marble);
      l.block(hx, sz, 0.14, 0.042, 0.04 + sh, 0.008, '#b02525');
    }
    stoneFountain(l, 0.2, 0.8, 0.095, 0.04, true);
    stoneFountain(l, 0.8, 0.8, 0.095, 0.04, true);

    // Soaring Ornate Clock & Gilded Dome Spire
    l.block(hx, hz, 0.24, 0.24, 1.34, 0.38, marble);
    l.block(hx, hz + 0.122, 0.1, 0.016, 1.44, 0.12, gold);
    l.block(hx, hz + 0.126, 0.08, 0.014, 1.45, 0.1, windowWarm, 1);
    l.dome(hx, hz, 0.13, 0.13, 1.72, 0.24, copper);
    l.round(hx, hz, 0.012, 0.06, 1.94, 0.32, gold);

    // Multi-story arched glowing windows
    for (const wx of [0.16, 0.24, 0.76, 0.84]) {
      for (const wy of [0.24, 0.6]) {
        framedWindowZ(l, wx, hz + hd / 2 + 0.008, 0.06, wy, 0.18, gold, stoneLight);
      }
    }
  },

  // ===========================================================================
  // 4. CHAPEL CHAIN (1×1): chapel -> parish_church -> sanctuary_chapel
  // ===========================================================================
  chapel(l) {
    l.base('#7b9655', 0.035);
    lotCurb(l, 8, 0, 0.04);

    // Flagstone path
    for (const pz of [0.76, 0.84, 0.91]) {
      l.block(0.5, pz, 0.18, 0.055, 0.035, 0.008, stoneLight);
    }

    // Tier 1 Wayside Stone Chapel
    const hx = 0.5;
    const hz = 0.44;
    const hw = 0.48;
    const hd = 0.56;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.075, stonePlinth);
    l.block(hx, hz, hw, hd, 0.11, 0.38, '#b8b09c');
    l.ridge(hx, hz, hw, hd, 0.49, 0.32, 'z', '#b8b09c');
    steppedGableRoof(l, hx, hz, hw + 0.06, hd + 0.04, 0.49, 0.33, 'z', [
      slateDark,
      slate,
      '#586975',
    ]);

    // Arched oak door & small wooden front belfry
    l.block(hx, hz + hd / 2 + 0.008, 0.12, 0.018, 0.11, 0.22, oak);
    l.block(hx, hz + hd / 2 - 0.06, 0.14, 0.14, 0.74, 0.18, timber);
    l.round(hx, hz + hd / 2 - 0.06, 0.025, 0.032, 0.78, 0.05, gold);
    l.ridge(hx, hz + hd / 2 - 0.06, 0.17, 0.17, 0.92, 0.11, 'z', slateDark);

    // Side & rear lancet windows + front portal rose window
    framedWindowZ(l, hx, hz + hd / 2 + 0.008, 0.08, 0.36, 0.11, stonePlinth, stoneLight);
    framedWindowZ(l, hx, hz - hd / 2 - 0.006, 0.08, 0.22, 0.18, stonePlinth, stoneLight);
    for (const wz of [hz - 0.14, hz + 0.1]) {
      framedWindowX(l, hx + hw / 2 + 0.006, wz, 0.065, 0.22, 0.16, stonePlinth, stoneLight);
      framedWindowX(l, hx - hw / 2 - 0.006, wz, 0.065, 0.22, 0.16, stonePlinth, stoneLight);
    }
  },

  parish_church(l) {
    // Matches the approved Concept Art for Nhà nguyện 1×1 (Parish Church with Rose Window & Bell Tower)
    l.base('#6d9448', 0.035);
    lotCurb(l, 9, 0, 0.042);

    // Forecourt low stone garden walls, rose/lavender flower beds & flagstone walkway
    l.block(0.5, 0.84, 0.24, 0.22, 0.035, 0.01, stoneLight);
    for (const sx of [-1, 1]) {
      l.block(0.5 + sx * 0.28, 0.88, 0.28, 0.035, 0.035, 0.075, stoneLight);
      l.block(0.5 + sx * 0.41, 0.74, 0.035, 0.28, 0.035, 0.075, stoneLight);
      l.block(0.5 + sx * 0.28, 0.82, 0.22, 0.06, 0.035, 0.04, '#436e31');
      l.block(0.5 + sx * 0.24, 0.82, 0.06, 0.045, 0.075, 0.025, '#d63a52');
      l.block(0.5 + sx * 0.33, 0.82, 0.06, 0.045, 0.075, 0.03, '#8866a8');
    }
    streetLamp(l, 0.35, 0.88, 0.08, 0.14);
    streetLamp(l, 0.65, 0.88, 0.08, 0.14);

    // Dressed warm limestone Nave with 4 stepped side buttresses
    const hx = 0.5;
    const hz = 0.42;
    const hw = 0.46;
    const hd = 0.56;
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.035, 0.08, stonePlinth);
    l.block(hx, hz, hw, hd, 0.115, 0.44, limestone);
    l.ridge(hx, hz, hw, hd, 0.555, 0.36, 'z', limestone);

    // Stepped side buttresses & 3 stained-glass lancet windows
    for (const bz of [hz - 0.22, hz - 0.06, hz + 0.1, hz + 0.24]) {
      for (const sx of [-1, 1]) {
        l.block(hx + sx * (hw / 2 + 0.018), bz, 0.04, 0.042, 0.115, 0.26, stoneLight);
        l.block(hx + sx * (hw / 2 + 0.01), bz, 0.026, 0.034, 0.375, 0.16, limestone);
      }
    }
    for (const wz of [hz - 0.14, hz + 0.02, hz + 0.17]) {
      framedWindowX(l, hx + hw / 2 + 0.005, wz, 0.06, 0.22, 0.22, stonePlinth, stoneLight);
      framedWindowX(l, hx - hw / 2 - 0.005, wz, 0.06, 0.22, 0.22, stonePlinth, stoneLight);
    }
    framedWindowZ(l, hx, hz - hd / 2 - 0.006, 0.11, 0.22, 0.26, stonePlinth, stoneLight);

    // Steep dark-slate stepped roof + crow-stepped front/rear gables
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.05,
      hd + 0.02,
      0.555,
      0.38,
      'z',
      ['#28333d', slateDark, slate, slateDark],
      stoneLight,
    );
    for (let i = 0; i < 4; i++) {
      const stepW = hw * (1 - i * 0.22);
      const stepY = 0.56 + i * 0.09;
      l.block(hx, hz + hd / 2 + 0.01, stepW, 0.028, stepY, 0.08, limestoneBright);
      l.block(hx, hz - hd / 2 - 0.01, stepW, 0.028, stepY, 0.08, limestoneBright);
    }

    // Gabled stone entrance porch + Circular Rose Window above
    const pz = hz + hd / 2 + 0.055;
    l.block(hx, pz, 0.22, 0.11, 0.115, 0.26, limestoneBright);
    l.ridge(hx, pz, 0.25, 0.13, 0.375, 0.12, 'z', slateDark);
    l.block(hx, pz + 0.056, 0.11, 0.018, 0.115, 0.21, timberDark);
    // Circular Rose Window
    l.block(hx, hz + hd / 2 + 0.018, 0.13, 0.02, 0.54, 0.13, stonePlinth);
    l.block(hx, hz + hd / 2 + 0.024, 0.095, 0.016, 0.558, 0.095, '#e87a52', 1);

    // Tall Square Stone Bell Tower with arched belfry, bronze bell & octagonal spire
    const tz = hz + 0.14;
    l.block(hx, tz, 0.22, 0.22, 0.72, 0.44, limestone);
    l.block(hx, tz, 0.24, 0.24, 0.92, 0.028, limestoneBright);
    l.block(hx, tz + 0.095, 0.09, 0.028, 0.96, 0.14, '#2b2927');
    l.block(hx + 0.095, tz, 0.028, 0.09, 0.96, 0.14, '#2b2927');
    l.round(hx, tz, 0.032, 0.044, 0.99, 0.075, gold, 1);
    l.block(hx, tz, 0.24, 0.24, 1.15, 0.035, slateDark);
    l.round(hx, tz, 0.012, 0.135, 1.185, 0.52, slateDark);
    // Brass cross finial at top of spire
    l.block(hx, tz, 0.016, 0.016, 1.7, 0.12, gold);
    l.block(hx, tz, 0.065, 0.016, 1.76, 0.018, gold);
  },

  sanctuary_chapel(l) {
    l.base('#d8d2c5', 0.04);
    lotCurb(l, 10, 0, 0.045);

    const hx = 0.5;
    const hz = 0.44;
    const hw = 0.54;
    const hd = 0.62;
    // White carved limestone Gothic Sanctuary with crocketed corner & side pinnacles
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.04, 0.1, stoneLight);
    l.block(hx, hz, hw, hd, 0.14, 0.58, marble);
    l.ridge(hx, hz, hw, hd, 0.72, 0.44, 'z', marble);

    // Side buttresses topped with sharp Gothic pinnacles
    for (const bz of [hz - 0.26, hz - 0.09, hz + 0.08, hz + 0.25]) {
      for (const sx of [-1, 1]) {
        const bx = hx + sx * (hw / 2 + 0.022);
        l.block(bx, bz, 0.044, 0.044, 0.14, 0.58, stoneLight);
        l.round(bx, bz, 0.006, 0.028, 0.72, 0.2, marble);
      }
    }
    for (const wz of [hz - 0.17, hz, hz + 0.17]) {
      framedWindowX(l, hx + hw / 2 + 0.006, wz, 0.075, 0.24, 0.34, stonePlinth, gold);
      framedWindowX(l, hx - hw / 2 - 0.006, wz, 0.075, 0.24, 0.34, stonePlinth, gold);
    }
    framedWindowZ(l, hx, hz - hd / 2 - 0.006, 0.13, 0.24, 0.36, stonePlinth, gold);

    // Steep verdigris-copper roof with gold ridge crest
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.04,
      hd + 0.02,
      0.72,
      0.46,
      'z',
      ['#3b695c', copper, copperLight, copper],
      gold,
    );

    // Grand sculpted front portal & radiant Rose Window
    const fz = hz + hd / 2 + 0.02;
    l.block(hx, fz + 0.02, 0.26, 0.08, 0.14, 0.36, marble);
    l.ridge(hx, fz + 0.02, 0.28, 0.1, 0.5, 0.18, 'z', gold);
    l.block(hx, fz + 0.055, 0.13, 0.018, 0.14, 0.28, oak);
    l.block(hx, fz, 0.17, 0.022, 0.68, 0.17, gold);
    l.block(hx, fz + 0.008, 0.13, 0.018, 0.7, 0.13, '#f07c65', 1);

    // Soaring Gothic Bell Tower & Copper-Gold Spire
    const tz = hz + 0.12;
    l.block(hx, tz, 0.25, 0.25, 0.92, 0.52, marble);
    for (const sx of [-0.11, 0.11]) {
      for (const sz of [-0.11, 0.11]) {
        l.round(hx + sx, tz + sz, 0.006, 0.026, 1.44, 0.22, gold);
      }
    }
    l.round(hx, tz, 0.036, 0.048, 1.18, 0.09, gold, 1);
    l.round(hx, tz, 0.01, 0.145, 1.44, 0.68, copper);
    l.block(hx, tz, 0.018, 0.018, 2.12, 0.14, gold);
    l.block(hx, tz, 0.075, 0.018, 2.19, 0.02, gold);

    streetLamp(l, 0.26, 0.86, 0.04, 0.22);
    streetLamp(l, 0.74, 0.86, 0.04, 0.22);
  },

  // ===========================================================================
  // 5. CLINIC CHAIN (1×1): clinic -> infirmary -> medical_hall
  // ===========================================================================
  clinic(l) {
    l.base('#829c62', 0.035);
    lotCurb(l, 8, 0, 0.04);

    l.block(0.5, 0.82, 0.24, 0.24, 0.035, 0.008, stoneLight);

    const hx = 0.48;
    const hz = 0.44;
    const hw = 0.56;
    const hd = 0.5;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.07, stonePlinth);
    l.block(hx, hz, hw, hd, 0.105, 0.3, '#f2eee3');
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.17, 0.12, 2, 2, timberDark, stoneLight, true);
    l.ridge(hx, hz, hw, hd, 0.405, 0.26, 'x', '#f2eee3');
    steppedGableRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.405, 0.28, 'x', [
      '#7a5a42',
      '#8f6b4e',
      '#7a5a42',
    ]);

    // Front wooden porch & Green Medical Cross sign
    const pz = hz + hd / 2 + 0.065;
    l.block(hx + 0.06, pz, 0.24, 0.12, 0.035, 0.065, oak);
    l.block(hx - 0.04, pz + 0.04, 0.022, 0.022, 0.1, 0.2, timber);
    l.block(hx + 0.16, pz + 0.04, 0.022, 0.022, 0.1, 0.2, timber);
    l.ridge(hx + 0.06, pz, 0.28, 0.15, 0.29, 0.09, 'z', '#7a5a42');
    // Green medical cross above porch
    l.block(hx + 0.06, hz + hd / 2 + 0.015, 0.11, 0.016, 0.36, 0.11, '#ffffff');
    l.block(hx + 0.06, hz + hd / 2 + 0.02, 0.08, 0.016, 0.395, 0.03, '#2e8b57');
    l.block(hx + 0.06, hz + hd / 2 + 0.02, 0.03, 0.016, 0.37, 0.08, '#2e8b57');

    framedWindowZ(l, hx - 0.14, hz + hd / 2 + 0.006, 0.09, 0.17, 0.12);
    // Potted herbs outside
    l.round(0.22, 0.75, 0.032, 0.024, 0.035, 0.05, terracotta);
    l.dome(0.22, 0.75, 0.038, 0.038, 0.085, 0.045, '#437d38');
  },

  infirmary(l) {
    // Matches the approved Concept Art for Trạm xá 1×1 (Town Infirmary)
    l.base('#b8b1a0', 0.035);
    lotCurb(l, 9, 0, 0.042);

    const hx = 0.48;
    const hz = 0.43;
    const hw = 0.58;
    const hd = 0.54;
    const wallY = 0.12;
    const wallH = 0.36;
    const roofY = wallY + wallH; // 0.48
    const roofH = 0.36;

    l.block(hx, hz, hw + 0.035, hd + 0.035, 0.035, 0.085, stonePlinth);
    l.block(hx, hz, hw, hd, wallY, wallH, '#f5efe2');
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      wallY + 0.08,
      0.13,
      2,
      2,
      timberDark,
      stoneLight,
      true,
    );
    l.ridge(hx, hz, hw, hd, roofY, roofH, 'z', '#f5efe2');
    cornerQuoins(l, hx, hz, hw, hd, wallY, wallH, 4, stoneLight);

    // Stepped Sage-Green & Terracotta tile roof + side Dormer
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.08,
      hd + 0.06,
      roofY,
      roofH,
      'z',
      [terracotta, sage, '#7ca177', sage, terracotta],
      terracottaDark,
    );
    const dx = hx + 0.18;
    l.block(dx, hz - 0.02, 0.16, 0.15, roofY + 0.11, 0.15, '#f5efe2');
    framedWindowX(l, dx + 0.082, hz - 0.02, 0.075, roofY + 0.14, 0.085, timberDark, stoneLight);
    l.ridge(dx, hz - 0.02, 0.2, 0.18, roofY + 0.25, 0.09, 'x', sage);

    // Prominent Emerald-Green Medical Cross with white border on front gable
    const fz = hz + hd / 2 + 0.008;
    l.block(hx, fz, 0.14, 0.018, roofY + 0.08, 0.048, '#ffffff');
    l.block(hx, fz, 0.048, 0.018, roofY + 0.034, 0.14, '#ffffff');
    l.block(hx, fz + 0.006, 0.12, 0.016, roofY + 0.087, 0.034, '#288c52');
    l.block(hx, fz + 0.006, 0.034, 0.016, roofY + 0.044, 0.12, '#288c52');

    // Covered timber front porch with warm glowing lantern
    const px = hx - 0.04;
    const pz = hz + hd / 2 + 0.075;
    l.block(px, hz + hd / 2 + 0.008, 0.1, 0.018, wallY, 0.21, oak);
    l.block(px, pz, 0.22, 0.13, 0.035, 0.085, stoneLight);
    l.block(px - 0.085, pz + 0.045, 0.024, 0.024, 0.12, 0.22, timber);
    l.block(px + 0.085, pz + 0.045, 0.024, 0.024, 0.12, 0.22, timber);
    steppedGableRoof(l, px, pz, 0.26, 0.16, 0.34, 0.11, 'z', [terracotta, sage]);
    l.block(px - 0.05, pz + 0.02, 0.03, 0.03, 0.26, 0.042, windowWarm, 1);

    // Glowing windows + Wooden medicinal herb planter boxes
    framedWindowZ(l, hx + 0.16, fz, 0.075, wallY + 0.08, 0.13, timberDark, stoneLight);
    for (const wz of [hz - 0.14, hz + 0.13]) {
      framedWindowX(
        l,
        hx + hw / 2 + 0.006,
        wz,
        0.095,
        wallY + 0.08,
        0.14,
        timberDark,
        stoneLight,
        true,
      );
    }
    for (const bx of [0.23, 0.64]) {
      l.block(bx, 0.8, 0.14, 0.065, 0.035, 0.055, oak);
      l.block(bx, 0.8, 0.12, 0.048, 0.09, 0.035, '#487d3c');
    }
  },

  medical_hall(l) {
    l.base('#c9c3b4', 0.04);
    lotCurb(l, 10, 0, 0.045);

    // 2.5-story L-shaped Classical Medical Hall
    l.block(0.52, 0.32, 0.72, 0.36, 0.04, 0.74, marble);
    surroundRearAndSideWindows(
      l,
      0.52,
      0.32,
      0.72,
      0.36,
      0.18,
      0.16,
      3,
      2,
      stonePlinth,
      stoneLight,
      false,
    );
    surroundRearAndSideWindows(
      l,
      0.52,
      0.32,
      0.72,
      0.36,
      0.52,
      0.16,
      3,
      2,
      stonePlinth,
      stoneLight,
      false,
    );
    l.block(0.7, 0.56, 0.36, 0.52, 0.04, 0.74, marble);
    l.block(0.52, 0.32, 0.75, 0.39, 0.42, 0.028, stoneLight);
    l.block(0.7, 0.56, 0.39, 0.55, 0.42, 0.028, stoneLight);

    // Verdigris-copper Mansard roofs & rooftop ventilation cupola
    l.mansard(0.52, 0.32, 0.76, 0.4, 0.78, 0.24);
    l.mansard(0.7, 0.56, 0.4, 0.56, 0.78, 0.24);
    l.block(0.52, 0.32, 0.7, 0.34, 1.02, 0.03, copper);
    l.block(0.7, 0.56, 0.34, 0.5, 1.02, 0.03, copper);
    l.round(0.62, 0.34, 0.075, 0.08, 1.04, 0.14, marble);
    l.dome(0.62, 0.34, 0.08, 0.08, 1.18, 0.1, copper);

    // Emerald & Gold Medical Cross Emblem on the front wing gable
    l.ridge(0.28, 0.32, 0.24, 0.38, 0.78, 0.22, 'z', copper);
    l.block(0.28, 0.515, 0.11, 0.018, 0.56, 0.036, '#288c52');
    l.block(0.28, 0.515, 0.036, 0.018, 0.52, 0.11, '#288c52');

    // Multi-story windows & manicured medicinal courtyard garden
    for (const wy of [0.16, 0.52]) {
      framedWindowZ(l, 0.46, 0.506, 0.08, wy, 0.15, stonePlinth, stoneLight);
      framedWindowX(l, 0.514, 0.62, 0.08, wy, 0.15, stonePlinth, stoneLight);
      framedWindowX(l, 0.514, 0.76, 0.08, wy, 0.15, stonePlinth, stoneLight);
    }
    l.block(0.32, 0.76, 0.26, 0.22, 0.04, 0.045, '#497d3b');
    l.round(0.32, 0.76, 0.018, 0.045, 0.085, 0.22, '#2e5927');
  },

  // ===========================================================================
  // 6. SCHOOL CHAIN (2×1): school -> grammar_school -> academy
  // ===========================================================================
  school(l) {
    l.base('#889c60', 0.035);
    lotCurb(l, 10, 0, 0.04);

    const hx = 0.58;
    const hz = 0.44;
    const hw = 0.62;
    const hd = 0.52;
    l.block(hx, hz, hw + 0.02, hd + 0.03, 0.035, 0.075, stonePlinth);
    l.block(hx, hz, hw, hd, 0.11, 0.36, '#d9c5a0');
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.2, 0.16, 3, 2, timberDark, stoneLight, false);
    steppedGableRoof(l, hx, hz, hw + 0.05, hd + 0.06, 0.47, 0.3, 'x', [
      slateDark,
      slate,
      '#586e7d',
    ]);

    // Small wooden bell turret & classroom windows
    l.block(hx, hz, 0.1, 0.14, 0.74, 0.14, timber);
    l.ridge(hx, hz, 0.12, 0.17, 0.88, 0.09, 'x', slateDark);
    for (const wx of [0.38, 0.52, 0.66, 0.8]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.07, 0.2, 0.16, timberDark, stoneLight);
    }

    // Play yard on left with wooden benches & tree
    l.block(0.16, 0.56, 0.18, 0.6, 0.035, 0.008, '#c7ad82');
    l.tree(0.16, 0.3, 0.65);
    l.block(0.16, 0.76, 0.12, 0.06, 0.035, 0.055, oak);
  },

  grammar_school(l) {
    // Matches the approved Concept Art for Trường học 2×1 (Brick & Quoined Grammar School)
    l.base('#8a9e62', 0.035);
    lotCurb(l, 12, 0, 0.042);

    const hx = 0.58;
    const hz = 0.42;
    const hw = 0.62;
    const hd = 0.54;
    const wallY = 0.12;
    const wallH = 0.46;
    const roofY = wallY + wallH; // 0.58

    // Raised stone plinth, warm brick walls & corner ashlar quoins
    l.block(hx, hz, hw + 0.025, hd + 0.035, 0.035, 0.085, stonePlinth);
    l.block(hx, hz, hw, hd, wallY, wallH, brick);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      wallY + 0.09,
      0.24,
      3,
      2,
      timberDark,
      stoneLight,
      false,
    );
    cornerQuoins(l, hx, hz, hw, hd, wallY, wallH, 5, stoneLight);

    // Stepped slate-blue pitched roof + Open Timber Bell Cupola with Brass Bell
    steppedGableRoof(
      l,
      hx,
      hz,
      hw + 0.05,
      hd + 0.06,
      roofY,
      0.38,
      'x',
      [slateDark, slate, '#576f80', slate],
      oak,
    );
    const cupY = roofY + 0.34;
    l.block(hx, hz, 0.13, 0.18, cupY, 0.06, oak);
    for (const sx of [-0.045, 0.045]) {
      for (const sz of [-0.06, 0.06]) {
        l.block(hx + sx, hz + sz, 0.018, 0.018, cupY + 0.06, 0.14, timber);
      }
    }
    l.round(hx, hz, 0.028, 0.038, cupY + 0.08, 0.065, gold, 1);
    l.ridge(hx, hz, 0.16, 0.22, cupY + 0.2, 0.12, 'x', slate);

    // Row of 4 tall glowing multi-pane classroom windows on front facade
    for (const wx of [0.36, 0.48, 0.6, 0.72]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.068, wallY + 0.09, 0.26, timberDark, stoneLight);
    }

    // Timber-framed entrance porch with stone steps on right end (+X) & Flagpole with banner
    const px = 0.84;
    const pz = 0.62;
    l.block(px, pz, 0.14, 0.22, 0.035, 0.1, stoneLight);
    l.block(px - 0.05, pz + 0.08, 0.022, 0.022, 0.135, 0.28, timber);
    l.block(px + 0.05, pz + 0.08, 0.022, 0.022, 0.135, 0.28, timber);
    l.ridge(px, pz, 0.16, 0.24, 0.41, 0.14, 'z', slate);
    // Flagpole & terracotta banner
    l.round(0.92, 0.78, 0.008, 0.01, 0.035, 0.78, '#707878');
    l.block(0.935, 0.78, 0.045, 0.016, 0.56, 0.2, '#d46b3e');

    // Fenced schoolyard on left (-X) with picket fence, shade tree & wooden benches
    l.block(0.18, 0.62, 0.24, 0.52, 0.035, 0.008, '#c9ae80');
    l.tree(0.16, 0.34, 0.78, '#4e823c');
    l.block(0.22, 0.58, 0.09, 0.05, 0.035, 0.055, oak);
    l.block(0.22, 0.74, 0.09, 0.05, 0.035, 0.055, oak);
    for (let i = 0; i < 6; i++) {
      l.block(0.08 + i * 0.045, 0.88, 0.018, 0.018, 0.035, 0.085, oak);
      l.block(0.08, 0.38 + i * 0.09, 0.018, 0.018, 0.035, 0.085, oak);
    }
    l.block(0.19, 0.88, 0.24, 0.012, 0.07, 0.02, oak);
    l.block(0.08, 0.62, 0.012, 0.52, 0.07, 0.02, oak);
  },

  academy(l) {
    l.base('#b8b2a2', 0.04);
    lotCurb(l, 12, 0, 0.045);

    const hx = 0.5;
    const hz = 0.4;
    const hw = 0.84;
    const hd = 0.52;
    // 2-story Classical Brick-and-Limestone Academy
    l.block(hx, hz, hw + 0.02, hd + 0.03, 0.04, 0.1, stonePlinth);
    l.block(hx, hz, hw, hd, 0.14, 0.68, brick);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.22, 0.16, 4, 2, marble, stoneLight, false);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.54, 0.16, 4, 2, marble, stoneLight, false);
    cornerQuoins(l, hx, hz, hw, hd, 0.14, 0.68, 6, marble);
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.46, 0.028, marble);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.8, 0.04, marble);

    // Mansard slate roof & central Copper Observatory Cupola
    l.mansard(hx, hz, hw + 0.03, hd + 0.04, 0.84, 0.28);
    l.round(hx, hz, 0.09, 0.095, 1.12, 0.18, marble);
    l.dome(hx, hz, 0.095, 0.095, 1.3, 0.18, copper);
    l.round(hx, hz, 0.005, 0.02, 1.47, 0.08, gold);

    // Central limestone pedimented entrance pavilion
    l.block(hx, hz + hd / 2 + 0.04, 0.28, 0.1, 0.14, 0.68, marble);
    l.ridge(hx, hz + hd / 2 + 0.04, 0.3, 0.12, 0.82, 0.18, 'z', slateDark);
    l.block(hx, hz + hd / 2 + 0.092, 0.09, 0.018, 0.14, 0.24, oak);

    for (const wx of [0.18, 0.28, 0.72, 0.82]) {
      for (const wy of [0.22, 0.54]) {
        framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.06, wy, 0.16, marble, stoneLight);
      }
    }
    streetLamp(l, 0.32, 0.84, 0.04, 0.24);
    streetLamp(l, 0.68, 0.84, 0.04, 0.24);
  },

  // ===========================================================================
  // 7. PUBLIC LIBRARY CHAIN (3×3): public_library -> grand_library -> royal_archive
  // ===========================================================================
  public_library(l) {
    l.base('#909d6e', 0.035);
    lotCurb(l, 14, 0, 0.042);

    // Paved forecourt & side trees
    l.block(0.5, 0.68, 0.72, 0.46, 0.035, 0.008, '#b5ae9a');
    l.tree(0.14, 0.78, 0.72);
    l.tree(0.86, 0.78, 0.72);

    const hx = 0.5;
    const hz = 0.42;
    const hw = 0.76;
    const hd = 0.48;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.095, stonePlinth);
    l.block(hx, hz, hw, hd, 0.13, 0.58, limestone);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.26,
      0.26,
      3,
      2,
      timberDark,
      limestoneBright,
      false,
    );
    steppedGableRoof(l, hx, hz, hw + 0.04, hd + 0.04, 0.71, 0.28, 'x', [
      slateDark,
      slate,
      '#586e7d',
    ]);

    // Central reading rotunda & 4-column entrance portico
    l.round(hx, hz, 0.15, 0.16, 0.92, 0.18, limestoneBright);
    l.dome(hx, hz, 0.16, 0.16, 1.1, 0.28, copper);
    for (const cx of [0.36, 0.45, 0.55, 0.64]) {
      l.round(cx, 0.72, 0.02, 0.024, 0.13, 0.54, limestoneBright);
    }
    l.ridge(hx, 0.7, 0.36, 0.16, 0.67, 0.16, 'z', slate);

    for (const wx of [0.22, 0.78]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.09, 0.26, 0.28, timberDark, limestoneBright);
    }
  },

  grand_library(l) {
    // Matches the approved Concept Art for Thư viện công cộng 3×3 (Classical Revival Library)
    l.base('#c2baa6', 0.04);
    lotCurb(l, 16, 0, 0.048);

    const hx = 0.5;
    const hz = 0.42;
    const hw = 0.76;
    const hd = 0.5;
    // Dark rusticated stone plinth + Warm limestone main block
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.16, stonePlinth);
    l.block(hx, hz, hw, hd, 0.2, 0.68, limestone);
    surroundRearAndSideWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      0.28,
      0.42,
      4,
      2,
      timberDark,
      limestoneBright,
      false,
    );
    cornerQuoins(l, hx, hz, hw, hd, 0.2, 0.68, 6, stoneLight);

    // Carved entablature frieze & rooftop stone balustrade
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.86, 0.06, limestoneBright);
    l.block(hx, hz, hw + 0.01, hd + 0.01, 0.92, 0.065, stoneLight);
    steppedGableRoof(l, hx, hz, hw - 0.04, hd - 0.04, 0.92, 0.22, 'x', [
      '#786b59',
      '#8c7d68',
      '#786b59',
    ]);

    // Tall arched reading-room windows glowing warmly + Corinthian pilasters
    for (const wx of [0.2, 0.3, 0.7, 0.8]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.065, 0.28, 0.44, timberDark, limestoneBright);
    }
    for (const wz of [0.26, 0.36, 0.46, 0.56]) {
      framedWindowX(l, hx - hw / 2 - 0.006, wz, 0.06, 0.28, 0.44, timberDark, limestoneBright);
      framedWindowX(l, hx + hw / 2 + 0.006, wz, 0.06, 0.28, 0.44, timberDark, limestoneBright);
    }

    // 4-Column Ionic Entrance Portico with carved pediment & arched fanlight oak doors
    const pz = hz + hd / 2 + 0.08;
    l.block(hx, pz, 0.38, 0.16, 0.04, 0.16, stoneLight);
    for (const cx of [0.36, 0.45, 0.55, 0.64]) {
      l.round(cx, pz + 0.05, 0.022, 0.026, 0.2, 0.66, limestoneBright);
    }
    l.block(hx, pz, 0.4, 0.18, 0.86, 0.065, limestoneBright);
    l.ridge(hx, pz, 0.42, 0.2, 0.925, 0.19, 'z', '#786b59');
    l.block(hx, hz + hd / 2 + 0.012, 0.13, 0.02, 0.2, 0.38, oak);
    l.dome(hx, hz + hd / 2 + 0.012, 0.065, 0.02, 0.58, 0.08, windowWarm);

    // Central Octagonal Drum with arched windows + Ribbed Verdigris Copper Dome & Brass Finial
    l.round(hx, hz, 0.17, 0.18, 1.06, 0.26, limestoneBright);
    for (const [wx, wz] of [
      [hx, hz + 0.175],
      [hx + 0.175, hz],
      [hx - 0.175, hz],
    ] as const) {
      l.block(wx, wz, 0.045, 0.045, 1.12, 0.13, windowWarm, 1);
    }
    l.dome(hx, hz, 0.18, 0.18, 1.32, 0.42, copper);
    l.round(hx, hz, 0.032, 0.038, 1.72, 0.1, limestoneBright);
    l.dome(hx, hz, 0.034, 0.034, 1.82, 0.06, gold);
    l.round(hx, hz, 0.005, 0.016, 1.88, 0.07, gold);

    // Forecourt grand steps, balustrades, scholar busts, torchère lamps, benches & trees
    for (let i = 0; i < 4; i++) {
      l.block(hx, 0.78 + i * 0.035, 0.26, 0.038, 0.04, 0.14 - i * 0.03, stoneLight);
    }
    for (const sx of [-1, 1]) {
      l.block(0.5 + sx * 0.26, 0.78, 0.22, 0.03, 0.04, 0.12, limestoneBright);
      // Scholar bust on pedestal
      l.block(0.5 + sx * 0.22, 0.72, 0.045, 0.045, 0.16, 0.11, stoneLight);
      l.round(0.5 + sx * 0.22, 0.72, 0.02, 0.024, 0.27, 0.05, marble);
      streetLamp(l, 0.5 + sx * 0.15, 0.77, 0.16, 0.22);
      l.tree(0.5 + sx * 0.36, 0.84, 0.58, '#4a7d3a');
    }
  },

  royal_archive(l) {
    l.base('#d8d2c4', 0.04);
    lotCurb(l, 16, 0, 0.05);

    const hx = 0.5;
    const hz = 0.4;
    const hw = 0.82;
    const hd = 0.52;
    // Monumental 2-story Beaux-Arts Royal Archive
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.16, stonePlinth);
    l.block(hx, hz, hw, hd, 0.2, 0.78, marble);
    surroundRearAndSideWindows(l, hx, hz, hw, hd, 0.28, 0.5, 4, 2, gold, stoneLight, false);
    cornerQuoins(l, hx, hz, hw, hd, 0.2, 0.78, 7, stoneLight);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.96, 0.06, gold);
    l.block(hx, hz, hw + 0.01, hd + 0.01, 1.02, 0.07, marble);

    // Soaring Central Ribbed Verdigris-and-Gold Dome + Two Flanking Wing Cupola Domes
    l.round(hx, hz, 0.19, 0.2, 1.08, 0.3, marble);
    l.dome(hx, hz, 0.2, 0.2, 1.38, 0.48, copper);
    l.round(hx, hz, 0.035, 0.042, 1.84, 0.12, gold);
    l.round(hx, hz, 0.006, 0.02, 1.96, 0.09, gold);

    for (const wx of [0.2, 0.8]) {
      l.round(wx, hz, 0.095, 0.1, 1.08, 0.18, marble);
      l.dome(wx, hz, 0.1, 0.1, 1.26, 0.22, copperLight);
      l.round(wx, hz, 0.005, 0.018, 1.48, 0.07, gold);
    }

    // 6-Column Grand Portico with Gilded Pediment & Twin Forecourt Fountains
    const pz = hz + hd / 2 + 0.08;
    l.block(hx, pz, 0.44, 0.16, 0.04, 0.16, stoneLight);
    for (const cx of [0.32, 0.39, 0.46, 0.54, 0.61, 0.68]) {
      l.round(cx, pz + 0.05, 0.02, 0.024, 0.2, 0.76, marble);
    }
    l.ridge(hx, pz, 0.46, 0.2, 0.98, 0.2, 'z', copper);
    l.block(hx, pz + 0.105, 0.18, 0.018, 1.01, 0.09, gold, 1);

    for (const wx of [0.18, 0.26, 0.74, 0.82]) {
      framedWindowZ(l, wx, hz + hd / 2 + 0.006, 0.058, 0.28, 0.54, gold, stoneLight);
    }

    stoneFountain(l, 0.22, 0.8, 0.09, 0.04, true);
    stoneFountain(l, 0.78, 0.8, 0.09, 0.04, true);
    streetLamp(l, 0.36, 0.84, 0.04, 0.26);
    streetLamp(l, 0.64, 0.84, 0.04, 0.26);
  },
};
