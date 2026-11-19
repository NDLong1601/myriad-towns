import { type Lot, type Recipes } from './lot';

const stoneCurb = '#7e796e';
const stonePlinth = '#726c62';
const stoneLight = '#c4baa3';
const limestone = '#dfd3bc';
const marble = '#f2eee4';
const plaster = '#ede4d2';
const timber = '#533a24';
const timberDark = '#3d2a19';
const oak = '#7d5a3b';
const brick = '#b5563c';
const brickDark = '#8c3f2b';
const copper = '#558c7c';
const terracotta = '#c85a32';
const terracottaDark = '#a34422';
const gold = '#d9b14a';
const iron = '#32383b';
const windowWarm = '#f5be42';
const fireGlow = '#f76b20';

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

/** Places framed glowing windows & stone sills on all 4 facades (+Z, -Z, +X, -X) plus rear service door. */
function surroundHallDetails(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  colsZ = 2,
  colsX = 2,
  frame = iron,
  sill = stoneLight,
): void {
  const winW = 0.065;
  const spanX = hw * 0.72;
  for (let i = 0; i < colsZ; i++) {
    const wx = hx + (colsZ === 1 ? 0 : ((i + 0.5) / colsZ - 0.5) * spanX);
    for (const sz of [-1, 1] as const) {
      const zWall = hz + sz * (hd / 2);
      l.block(wx, zWall + sz * 0.003, winW + 0.014, 0.016, y - 0.006, h + 0.012, frame);
      l.block(wx, zWall + sz * 0.006, winW, 0.012, y, h, windowWarm, 1);
      l.block(wx, zWall + sz * 0.009, winW + 0.02, 0.02, y - 0.012, 0.012, sill);
    }
  }
  const spanZ = hd * 0.72;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    for (const sx of [-1, 1] as const) {
      const xWall = hx + sx * (hw / 2);
      l.block(xWall + sx * 0.003, wz, 0.016, winW + 0.014, y - 0.006, h + 0.012, frame);
      l.block(xWall + sx * 0.006, wz, 0.012, winW, y, h, windowWarm, 1);
      l.block(xWall + sx * 0.009, wz, 0.02, winW + 0.02, y - 0.012, 0.012, sill);
    }
  }
  // Rear (-Z) loading door & stone lintel
  l.block(hx, hz - hd / 2 - 0.006, 0.1, 0.016, 0.04, 0.18, timberDark);
  l.block(hx, hz - hd / 2 - 0.01, 0.12, 0.022, 0.21, 0.018, sill);
}

export const productionTiers: Recipes = {
  // ===========================================================================
  // 3. BAKERY CHAIN (5 TIERS: Cấp 1 -> Cấp 5)
  // ===========================================================================
  bakery(l) {
    // Tier 1: Village Bakery with Outdoor Domed Brick Oven (Max Y ~ 0.66)
    l.base('#889e5c', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.54;
    const hz = 0.42;
    l.block(hx, hz, 0.48, 0.46, 0.035, 0.3, plaster);
    surroundHallDetails(l, hx, hz, 0.48, 0.46, 0.12, 0.11, 2, 2, timberDark, stoneLight);
    steppedRoof(l, hx, hz, 0.54, 0.5, 0.335, 0.26, 'z', [terracottaDark, terracotta, '#d96b3f']);
    l.block(hx + 0.08, hz - 0.14, 0.1, 0.1, 0.48, 0.18, brick);
    // Outdoor domed brick bread oven on left (-X) with glowing fire mouth
    l.block(0.22, 0.52, 0.24, 0.24, 0.035, 0.12, stonePlinth);
    l.dome(0.22, 0.52, 0.11, 0.11, 0.155, 0.18, brick);
    l.block(0.22, 0.44, 0.08, 0.08, 0.28, 0.16, brickDark);
    l.block(0.22, 0.635, 0.08, 0.02, 0.16, 0.09, fireGlow, 1);
    // Wooden bread table in front
    l.block(0.46, 0.78, 0.22, 0.11, 0.035, 0.075, oak);
    l.round(0.42, 0.78, 0.025, 0.03, 0.11, 0.025, '#e09b3e');
    l.round(0.5, 0.78, 0.025, 0.03, 0.11, 0.025, '#e09b3e');
  },

  market_bakery(l) {
    // Tier 2: 1.5-Story Market Bakery with Cloth Awning & Bread Racks (Max Y ~ 0.84)
    l.base('#9e9580', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.48;
    const hz = 0.42;
    l.block(hx, hz, 0.54, 0.5, 0.035, 0.08, stonePlinth);
    l.block(hx, hz, 0.52, 0.48, 0.115, 0.36, brick);
    surroundHallDetails(l, hx, hz, 0.52, 0.48, 0.2, 0.14, 2, 2, timberDark, stoneLight);
    steppedRoof(l, hx, hz, 0.58, 0.54, 0.475, 0.34, 'z', [terracottaDark, terracotta, '#d96b3f']);
    // Cream cloth front awning & bread display counter
    l.ridge(hx, 0.72, 0.48, 0.16, 0.34, 0.09, 'x', '#ede2c8');
    l.block(hx, 0.7, 0.42, 0.1, 0.035, 0.12, oak);
    l.block(hx, 0.665, 0.34, 0.02, 0.16, 0.14, windowWarm, 1);
  },

  guild_bakery(l) {
    // Tier 3: 2-Story Tudor Guild Bakery with Striped Awning, Tall Chimney & Pretzel Sign (Max Y ~ 1.04)
    l.base('#aba391', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.46;
    const hz = 0.42;
    const hw = 0.52;
    const hd = 0.52;
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.035, 0.24, brick);
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.275, 0.3, plaster);
    surroundHallDetails(l, hx, hz, hw + 0.04, hd + 0.04, 0.34, 0.14, 2, 2, timberDark, timber);
    for (const y of [0.275, 0.42, 0.56]) {
      l.block(hx, hz + hd / 2 + 0.022, hw + 0.05, 0.022, y, 0.022, timber);
      l.block(hx + hw / 2 + 0.022, hz, 0.022, hd + 0.05, y, 0.022, timber);
    }
    steppedRoof(l, hx, hz, hw + 0.08, hd + 0.06, 0.575, 0.38, 'z', [
      terracottaDark,
      terracotta,
      '#e07040',
      terracotta,
    ]);
    // Tall brick chimney on right (+X)
    l.block(0.75, 0.38, 0.13, 0.13, 0.035, 0.99, brick);
    // Orange-and-cream striped front awning over glowing pastry counter
    for (let i = 0; i < 5; i++) {
      const bx = hx - 0.18 + i * 0.09;
      l.ridge(bx, 0.73, 0.09, 0.14, 0.28, 0.08, 'x', i % 2 === 0 ? '#d9652b' : '#f2e8cf');
    }
    l.block(hx, 0.69, 0.42, 0.02, 0.1, 0.16, windowWarm, 1);
    // Golden Pretzel Signboard & flour sacks
    l.block(0.16, 0.64, 0.08, 0.018, 0.48, 0.018, iron);
    l.round(0.14, 0.64, 0.038, 0.038, 0.39, 0.075, gold, 1);
    l.round(0.68, 0.74, 0.032, 0.036, 0.035, 0.075, '#d6c39c');
  },

  patisserie_salon(l) {
    // Tier 4: 2-Story French Limestone Patisserie with Slate Roof & Bistro Tables (Max Y ~ 1.24)
    l.base('#bab3a2', 0.04);
    lotCurb(l, 10, 0, 0.045);
    const hx = 0.48;
    const hz = 0.42;
    const hw = 0.62;
    const hd = 0.52;
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.04, 0.09, stonePlinth);
    l.block(hx, hz, hw, hd, 0.13, 0.68, limestone);
    surroundHallDetails(l, hx, hz, hw, hd, 0.2, 0.18, 3, 2, iron, marble);
    surroundHallDetails(l, hx, hz, hw, hd, 0.54, 0.18, 3, 2, iron, marble);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.46, 0.028, marble);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.79, 0.038, marble);
    l.mansard(hx, hz, hw + 0.04, hd + 0.04, 0.83, 0.38);
    // Glowing storefront & upper arched windows
    for (const wx of [0.3, 0.48, 0.66]) {
      l.block(wx, hz + hd / 2 + 0.008, 0.11, 0.018, 0.16, 0.24, windowWarm, 1);
      l.block(wx, hz + hd / 2 + 0.008, 0.09, 0.018, 0.52, 0.2, windowWarm, 1);
    }
    // Bistro cafe table in front
    l.round(0.66, 0.82, 0.055, 0.055, 0.04, 0.075, marble);
  },

  royal_confectionery(l) {
    // Tier 5: 3-Story Royal Confectionery Palace with Verdigris Mansard & Golden Crown (Max Y ~ 1.54)
    l.base('#ccc5b6', 0.04);
    lotCurb(l, 10, 0, 0.048);
    const hx = 0.48;
    const hz = 0.42;
    const hw = 0.66;
    const hd = 0.54;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.1, stoneLight);
    l.block(hx, hz, hw, hd, 0.14, 0.84, marble);
    surroundHallDetails(l, hx, hz, hw, hd, 0.22, 0.2, 3, 2, gold, marble);
    surroundHallDetails(l, hx, hz, hw, hd, 0.6, 0.2, 3, 2, gold, marble);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.48, 0.03, gold);
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.96, 0.045, gold);
    // Verdigris-copper Mansard roof with Golden Crown Emblem on top
    steppedRoof(l, hx, hz, hw + 0.04, hd + 0.04, 1.0, 0.4, 'x', [
      '#3d6e60',
      copper,
      '#6ca694',
      copper,
    ]);
    l.round(hx, hz, 0.075, 0.06, 1.38, 0.14, gold, 1);
    // Radiant golden storefront & rear brick oven chimney
    l.block(hx, hz + hd / 2 + 0.012, 0.52, 0.02, 0.16, 0.28, windowWarm, 1);
    l.block(hx, hz + hd / 2 + 0.018, 0.16, 0.022, 0.56, 0.14, gold, 1);
    l.round(0.84, 0.34, 0.055, 0.07, 0.04, 0.92, brick);
  },
};
