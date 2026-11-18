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
const slate = '#465866';
const slateDark = '#33414d';
const copper = '#558c7c';
const copperBright = '#c77d48';
const terracotta = '#c85a32';
const terracottaDark = '#a34422';
const gold = '#d9b14a';
const iron = '#32383b';
const steel = '#6e7b80';
const water = '#4d8da6';
const windowWarm = '#f5be42';
const fireGlow = '#f76b20';
const moltenGlow = '#ffa62b';

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

function waterwheel(
  l: Lot,
  x: number,
  y: number,
  z: number,
  radius: number,
  rimColor = oak,
  spokeColor = timber,
): void {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const b = a + Math.PI / 4;
    const pos = (angle: number): readonly [number, number, number] => [
      x,
      y + radius * Math.cos(angle),
      z + radius * Math.sin(angle),
    ];
    l.beam(pos(a), pos(b), 0.024, rimColor);
    l.beam([x, y, z], pos(a), 0.018, spokeColor);
  }
  l.block(x, z, 0.06, 0.055, y - 0.028, 0.056, iron);
}

function windmillSails(
  l: Lot,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  blades: number,
  sailColor = '#ede3c6',
  sparColor = timber,
): void {
  l.round(cx, cz, 0.028, 0.028, cy - 0.028, 0.056, iron);
  for (let i = 0; i < blades; i++) {
    const angle = (i * Math.PI * 2) / blades + Math.PI / 4;
    const tx = Math.max(0.12, Math.min(0.88, cx + radius * Math.cos(angle)));
    const ty = Math.max(0.14, cy + radius * Math.sin(angle));
    l.beam([cx, cy, cz], [tx, ty, cz], 0.022, sparColor);
    const mx = cx + (tx - cx) * 0.92;
    const my = cy + (ty - cy) * 0.92;
    l.beam(
      [cx + (tx - cx) * 0.28, cy + (ty - cy) * 0.28, cz + 0.012],
      [mx, my, cz + 0.012],
      0.056,
      sailColor,
    );
  }
}

function logStack(l: Lot, x: number, z: number, w: number, y = 0.035): void {
  for (const dz of [-0.075, 0, 0.075]) {
    l.block(x, z + dz, w, 0.065, y, 0.065, '#9e7548');
    l.block(x - w / 2, z + dz, 0.02, 0.055, y + 0.005, 0.055, '#d4b47c');
  }
  for (const dz of [-0.038, 0.038]) {
    l.block(x, z + dz, w * 0.92, 0.06, y + 0.062, 0.06, '#ad8354');
  }
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
  // 1. SMELTER CHAIN (7 TIERS: Cấp 1 -> Cấp 7)
  // ===========================================================================
  smelter(l) {
    // Tier 1: Bloomery Smelter (Max Y ~ 0.68)
    l.base('#8c8273', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.round(0.46, 0.44, 0.14, 0.26, 0.035, 0.52, '#8c6f5a');
    l.round(0.46, 0.44, 0.16, 0.18, 0.54, 0.08, '#6e5544');
    l.round(0.46, 0.44, 0.1, 0.1, 0.61, 0.03, fireGlow, 1);
    surroundHallDetails(l, 0.46, 0.44, 0.34, 0.34, 0.12, 0.1, 1, 1, timberDark, stonePlinth);
    l.block(0.46, 0.68, 0.14, 0.08, 0.035, 0.16, '#59483d');
    l.block(0.46, 0.72, 0.1, 0.04, 0.05, 0.11, fireGlow, 1);
    logStack(l, 0.2, 0.68, 0.22, 0.035);
    l.round(0.76, 0.7, 0.05, 0.14, 0.035, 0.14, '#46484a');
  },

  bellows_smelter(l) {
    // Tier 2: Waterwheel-Bellows Stone Smelter (Max Y ~ 0.86)
    l.base('#8d8678', 0.035);
    lotCurb(l, 8, 0, 0.04);
    // Stone raceway & wooden waterwheel on left
    l.block(0.2, 0.52, 0.16, 0.68, 0.035, 0.045, stonePlinth);
    l.block(0.2, 0.52, 0.1, 0.64, 0.075, 0.014, water);
    waterwheel(l, 0.27, 0.22, 0.54, 0.14, oak, timber);
    // Tapered stone furnace shaft
    l.block(0.48, 0.42, 0.34, 0.34, 0.035, 0.48, stonePlinth);
    surroundHallDetails(l, 0.48, 0.42, 0.34, 0.34, 0.14, 0.12, 1, 1, iron, stoneLight);
    l.round(0.48, 0.42, 0.13, 0.2, 0.5, 0.34, '#8a8275');
    l.round(0.48, 0.42, 0.09, 0.09, 0.83, 0.025, fireGlow, 1);
    l.block(0.48, 0.61, 0.12, 0.06, 0.06, 0.14, fireGlow, 1);
    // Timber bellows shed on right
    l.block(0.76, 0.46, 0.24, 0.42, 0.035, 0.26, oak);
    l.ridge(0.76, 0.46, 0.28, 0.46, 0.295, 0.14, 'z', '#5e4632');
  },

  reverberatory_furnace(l) {
    // Tier 3: Red-Brick Reverberatory Furnace with Iron Straps (Max Y ~ 1.06)
    l.base('#8a8377', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const fx = 0.48;
    const fz = 0.46;
    l.block(fx, fz, 0.56, 0.52, 0.035, 0.38, brick);
    surroundHallDetails(l, fx, fz, 0.56, 0.52, 0.12, 0.14, 2, 2, iron, stoneLight);
    l.dome(fx, fz, 0.29, 0.27, 0.41, 0.22, brickDark);
    // Iron tension straps & corner buckstays
    for (const sx of [-0.28, 0, 0.28]) {
      l.block(fx + sx, fz, 0.03, 0.55, 0.035, 0.42, iron);
    }
    for (const sz of [-0.26, 0, 0.26]) {
      l.block(fx, fz + sz, 0.59, 0.03, 0.035, 0.42, iron);
    }
    // Glowing fireboxes on front & side
    l.block(fx, fz + 0.27, 0.14, 0.03, 0.06, 0.15, fireGlow, 1);
    l.block(fx + 0.29, fz, 0.03, 0.14, 0.06, 0.15, fireGlow, 1);
    // Square banded brick chimney rising from vault
    l.block(fx, fz - 0.04, 0.18, 0.18, 0.56, 0.48, brick);
    l.block(fx, fz - 0.04, 0.21, 0.21, 0.82, 0.03, iron);
    l.block(fx, fz - 0.04, 0.22, 0.22, 1.02, 0.04, stoneLight);
  },

  blast_furnace(l) {
    // Tier 4: Industrial Blast Furnace with Skip Hoist & Glowing Ingot Bed (Max Y ~ 1.28)
    l.base('#827d74', 0.035);
    lotCurb(l, 9, 0, 0.042);
    // Conical iron-banded brick blast furnace
    const fx = 0.46;
    const fz = 0.42;
    l.block(fx, fz, 0.36, 0.36, 0.035, 0.22, stonePlinth);
    surroundHallDetails(l, fx, fz, 0.36, 0.36, 0.08, 0.11, 1, 1, iron, stoneLight);
    l.round(fx, fz, 0.14, 0.22, 0.25, 0.68, brick);
    for (const y of [0.36, 0.54, 0.72, 0.88]) {
      const r = 0.22 - ((y - 0.25) / 0.68) * 0.075;
      l.round(fx, fz, r, r, y, 0.03, iron);
    }
    l.round(fx, fz, 0.16, 0.14, 0.92, 0.08, steel);
    l.round(fx, fz, 0.11, 0.11, 0.99, 0.025, moltenGlow, 1);
    // Inclined skip-hoist ramp on left (-X)
    l.beam([0.14, 0.05, 0.64], [0.36, 0.96, 0.44], 0.055, iron);
    l.beam([0.14, 0.05, 0.52], [0.36, 0.96, 0.36], 0.055, iron);
    // Tall smokestack & cylindrical hot-blast stove on right (+X)
    l.round(0.68, 0.26, 0.06, 0.085, 0.035, 1.24, '#585450');
    l.round(0.78, 0.56, 0.095, 0.095, 0.035, 0.58, steel);
    l.dome(0.78, 0.56, 0.095, 0.095, 0.61, 0.09, steel);
    // Glowing molten metal runner & casting bed in foreground
    l.block(0.54, 0.74, 0.24, 0.16, 0.035, 0.06, stonePlinth);
    l.block(0.54, 0.74, 0.19, 0.11, 0.09, 0.02, moltenGlow, 1);
  },

  bessemer_converter(l) {
    // Tier 5: Bessemer Converter Hall with Molten Pour & Twin Stacks (Max Y ~ 1.48)
    l.base('#807c75', 0.04);
    lotCurb(l, 10, 0, 0.045);
    // Heavy brick-and-steel converter hall
    l.block(0.38, 0.46, 0.46, 0.54, 0.04, 0.58, brick);
    surroundHallDetails(l, 0.38, 0.46, 0.46, 0.54, 0.24, 0.16, 2, 2, iron, stoneLight);
    l.ridge(0.38, 0.46, 0.5, 0.58, 0.62, 0.22, 'z', slateDark);
    // Twin tall industrial smokestacks at rear
    for (const sx of [0.56, 0.74]) {
      l.round(sx, 0.22, 0.055, 0.08, 0.04, 1.42, '#4f5457');
      l.round(sx, 0.22, 0.07, 0.065, 1.43, 0.04, iron);
    }
    // Tilted Pear-Shaped Bessemer Converter Vessel pouring golden molten steel
    l.block(0.64, 0.52, 0.04, 0.28, 0.04, 0.52, iron);
    l.round(0.64, 0.54, 0.11, 0.15, 0.38, 0.34, steel);
    l.dome(0.64, 0.6, 0.11, 0.12, 0.68, 0.14, iron);
    // Molten pour stream & glowing spark pit
    l.block(0.64, 0.68, 0.07, 0.07, 0.12, 0.42, moltenGlow, 1);
    l.block(0.64, 0.72, 0.2, 0.18, 0.04, 0.08, stonePlinth);
    l.block(0.64, 0.72, 0.15, 0.13, 0.11, 0.03, moltenGlow, 1);
  },

  electric_arc_smelter(l) {
    // Tier 6: Steel-and-Glass Electric Arc Smelter with Copper Coils & Filter Tower (Max Y ~ 1.68)
    l.base('#969892', 0.04);
    lotCurb(l, 10, 0, 0.045);
    // Vaulted steel-and-glass industrial hall
    const hx = 0.38;
    const hz = 0.46;
    l.block(hx, hz, 0.48, 0.58, 0.04, 0.52, '#7d888c');
    surroundHallDetails(l, hx, hz, 0.48, 0.58, 0.22, 0.16, 2, 2, iron, stoneLight);
    l.vaultedCanopy(hx, hz, 0.48, 0.58, 0.56, 0.22);
    // Glowing electric arc furnace mouth at front
    l.block(hx, hz + 0.295, 0.18, 0.025, 0.08, 0.24, moltenGlow, 1);
    // Twin copper transformer coils in front-right yard
    for (const cx of [0.68, 0.8]) {
      l.round(cx, 0.68, 0.052, 0.052, 0.04, 0.36, copperBright);
      l.round(cx, 0.68, 0.06, 0.06, 0.16, 0.03, iron);
      l.round(cx, 0.68, 0.06, 0.06, 0.28, 0.03, iron);
    }
    // Tall cylindrical clean-air dust scrubber tower
    l.round(0.76, 0.32, 0.11, 0.12, 0.04, 1.56, '#b0b8ba');
    l.dome(0.76, 0.32, 0.11, 0.11, 1.6, 0.08, steel);
    for (const y of [0.45, 0.85, 1.25]) {
      l.round(0.76, 0.32, 0.122, 0.122, y, 0.03, iron);
    }
  },

  metallurgical_spire(l) {
    // Tier 7: Grand Brass & Copper Metallurgical Spire (Max Y ~ 2.02)
    l.base('#b8b3a6', 0.04);
    lotCurb(l, 10, 0, 0.048);
    // Dressed stone pedestal & glowing glass cupola annex
    l.block(0.46, 0.46, 0.64, 0.58, 0.04, 0.16, stoneLight);
    surroundHallDetails(l, 0.46, 0.46, 0.64, 0.58, 0.07, 0.08, 2, 2, gold, marble);
    l.round(0.24, 0.54, 0.12, 0.13, 0.2, 0.34, limestone);
    l.dome(0.24, 0.54, 0.125, 0.125, 0.54, 0.18, windowWarm);
    // Soaring Brass-and-Copper Condenser Reaction Spire
    const sx = 0.48;
    const sz = 0.4;
    l.round(sx, sz, 0.18, 0.22, 0.2, 0.48, copperBright);
    l.round(sx, sz, 0.11, 0.18, 0.68, 0.46, gold);
    l.round(sx, sz, 0.085, 0.11, 1.14, 0.48, '#c8d0d0');
    l.round(sx, sz, 0.065, 0.085, 1.62, 0.38, gold);
    for (const y of [0.66, 1.12, 1.6, 1.96]) {
      l.round(sx, sz, 0.12, 0.12, y, 0.035, copper);
    }
    // Overhead steel-and-brass gantry crane on right (+X) & gleaming alloy ingot stack
    l.block(0.82, 0.24, 0.045, 0.045, 0.04, 0.86, copperBright);
    l.block(0.82, 0.78, 0.045, 0.045, 0.04, 0.86, copperBright);
    l.block(0.82, 0.51, 0.06, 0.58, 0.88, 0.05, gold);
    for (const iz of [0.68, 0.76, 0.84]) {
      l.block(0.52, iz, 0.18, 0.05, 0.2, 0.055, '#dfe6e8');
      l.block(0.74, iz - 0.12, 0.16, 0.05, 0.2, 0.055, gold);
    }
  },

  // ===========================================================================
  // 2. WORKSHOP CHAIN (6 TIERS: Cấp 1 -> Cấp 6)
  // ===========================================================================
  workshop(l) {
    // Tier 1: Artisan Shed (Max Y ~ 0.68)
    l.base('#889b5e', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.44;
    const hz = 0.44;
    l.block(hx, hz, 0.56, 0.52, 0.035, 0.34, '#d4c3a3');
    surroundHallDetails(l, hx, hz, 0.56, 0.52, 0.14, 0.12, 2, 2, timberDark, oak);
    steppedRoof(l, hx, hz, 0.62, 0.56, 0.375, 0.28, 'z', ['#695846', '#7d6954', '#695846']);
    l.block(hx, hz + 0.265, 0.18, 0.02, 0.035, 0.24, oak);
    // Open side timber awning & wooden crates
    l.block(0.78, 0.5, 0.2, 0.36, 0.3, 0.04, oak);
    l.block(0.85, 0.35, 0.025, 0.025, 0.035, 0.27, timber);
    l.block(0.85, 0.65, 0.025, 0.025, 0.035, 0.27, timber);
    l.block(0.58, 0.8, 0.1, 0.1, 0.035, 0.085, '#9e784e');
  },

  guild_workshop(l) {
    // Tier 2: Tudor Half-Timbered Guild Workshop with Hoist & Side Forge (Max Y ~ 0.94)
    l.base('#a19987', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.42;
    const hz = 0.44;
    l.block(hx, hz, 0.52, 0.52, 0.035, 0.085, stonePlinth);
    l.block(hx, hz, 0.5, 0.5, 0.12, 0.42, plaster);
    surroundHallDetails(l, hx, hz, 0.5, 0.5, 0.2, 0.14, 2, 2, timberDark, stoneLight);
    l.ridge(hx, hz, 0.5, 0.5, 0.54, 0.34, 'z', plaster);
    for (const y of [0.12, 0.32, 0.52]) {
      l.block(hx, hz + 0.252, 0.52, 0.022, y, 0.022, timber);
      l.block(hx + 0.252, hz, 0.022, 0.52, y, 0.022, timber);
    }
    steppedRoof(l, hx, hz, 0.56, 0.54, 0.54, 0.36, 'z', [terracotta, '#d96b3f', terracotta]);
    // Gable hoist beam lifting a wooden crate
    l.block(hx, 0.74, 0.03, 0.16, 0.76, 0.03, timberDark);
    l.block(hx, 0.8, 0.012, 0.012, 0.54, 0.22, iron);
    l.block(hx, 0.8, 0.09, 0.09, 0.45, 0.09, '#a87e4f');
    // Glowing workbench window & side stone forge with tall chimney
    l.block(hx + 0.255, hz + 0.04, 0.018, 0.22, 0.18, 0.16, windowWarm, 1);
    l.block(0.76, 0.38, 0.22, 0.26, 0.035, 0.36, stonePlinth);
    l.block(0.76, 0.515, 0.09, 0.02, 0.08, 0.11, fireGlow, 1);
    l.block(0.76, 0.34, 0.13, 0.13, 0.39, 0.54, stonePlinth);
  },

  waterwheel_workshop(l) {
    // Tier 3: 2-Story Waterwheel Mechanical Workshop (Max Y ~ 1.08)
    l.base('#9a9483', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.42;
    const hz = 0.44;
    l.block(hx, hz, 0.52, 0.54, 0.035, 0.24, stonePlinth);
    l.block(hx, hz, 0.5, 0.52, 0.275, 0.36, plaster);
    surroundHallDetails(l, hx, hz, 0.5, 0.52, 0.36, 0.15, 2, 2, timberDark, stoneLight);
    steppedRoof(l, hx, hz, 0.56, 0.56, 0.635, 0.42, 'z', ['#5c4a38', '#6e5944', '#5c4a38']);
    // Stone water channel & side waterwheel driving line shafts
    l.block(0.76, 0.52, 0.18, 0.68, 0.035, 0.045, stonePlinth);
    l.block(0.76, 0.52, 0.12, 0.64, 0.075, 0.015, water);
    waterwheel(l, 0.7, 0.25, 0.48, 0.16, oak, timberDark);
    l.block(hx, hz + 0.265, 0.22, 0.018, 0.36, 0.16, windowWarm, 1);
  },

  steam_manufactory(l) {
    // Tier 4: Red-Brick Steam Manufactory with Sawtooth Skylights & Brass Boiler (Max Y ~ 1.28)
    l.base('#9e9888', 0.04);
    lotCurb(l, 10, 0, 0.045);
    const hx = 0.42;
    const hz = 0.46;
    l.block(hx, hz, 0.54, 0.56, 0.04, 0.62, brick);
    surroundHallDetails(l, hx, hz, 0.54, 0.56, 0.28, 0.18, 3, 2, iron, stoneLight);
    for (const sz of [0.3, 0.46, 0.62]) {
      l.ridge(hx, sz, 0.56, 0.16, 0.66, 0.2, 'x', slate);
      l.block(hx, sz + 0.04, 0.5, 0.02, 0.7, 0.1, windowWarm, 1);
    }
    // Tall tapered brick smokestack & shiny brass steam boiler on right (+X)
    l.block(0.76, 0.26, 0.14, 0.14, 0.04, 1.22, brickDark);
    l.block(0.76, 0.26, 0.17, 0.17, 1.22, 0.04, iron);
    l.round(0.76, 0.56, 0.085, 0.085, 0.04, 0.36, gold);
    l.dome(0.76, 0.56, 0.085, 0.085, 0.4, 0.08, copperBright);
    for (const wx of [0.26, 0.42, 0.58]) {
      l.block(wx, hz + 0.285, 0.08, 0.018, 0.36, 0.18, windowWarm, 1);
    }
  },

  precision_manufactory(l) {
    // Tier 5: Brick & Limestone Precision Manufactory with Vaulted Skylight & Golden Gear (Max Y ~ 1.46)
    l.base('#b8b2a2', 0.04);
    lotCurb(l, 10, 0, 0.045);
    const hx = 0.5;
    const hz = 0.44;
    const hw = 0.68;
    const hd = 0.56;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.12, stoneLight);
    l.block(hx, hz, hw, hd, 0.16, 0.78, brick);
    surroundHallDetails(l, hx, hz, hw, hd, 0.32, 0.38, 3, 2, iron, limestone);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.92, 0.05, limestone);
    // Vaulted glass-and-steel skylight roof
    l.vaultedCanopy(hx, hz, hw - 0.04, hd - 0.04, 0.97, 0.36);
    // Front limestone pediment & Golden Clockwork Gear Emblem
    l.ridge(hx, hz + hd / 2 - 0.02, hw * 0.72, 0.12, 0.97, 0.38, 'z', limestone);
    l.block(hx, hz + hd / 2 + 0.045, 0.18, 0.022, 1.04, 0.18, gold, 1);
    // Glowing arched factory windows & luxury goods pallets
    for (const wx of [0.26, 0.5, 0.74]) {
      l.block(wx, hz + hd / 2 + 0.01, 0.09, 0.018, 0.28, 0.48, windowWarm, 1);
    }
    l.block(0.24, 0.82, 0.12, 0.1, 0.04, 0.09, '#759c58');
    l.block(0.76, 0.82, 0.12, 0.1, 0.04, 0.09, '#c99d52');
  },

  grand_artificery(l) {
    // Tier 6: Grand 3-Story Clockwork Artificery with Astronomical Clock Tower & Twin Glass Domes (Max Y ~ 1.82)
    l.base('#ccc6b6', 0.04);
    lotCurb(l, 10, 0, 0.048);
    const hx = 0.5;
    const hz = 0.44;
    const hw = 0.76;
    const hd = 0.54;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.14, stoneLight);
    l.block(hx, hz, hw, hd, 0.18, 0.76, brick);
    surroundHallDetails(l, hx, hz, hw, hd, 0.32, 0.42, 3, 2, gold, marble);
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.92, 0.05, marble);
    // Twin side glass domes on left & right wings
    for (const wx of [0.24, 0.76]) {
      l.round(wx, hz, 0.11, 0.12, 0.97, 0.12, marble);
      l.dome(wx, hz, 0.115, 0.115, 1.09, 0.2, copper);
      l.block(wx, hz + hd / 2 + 0.01, 0.09, 0.018, 0.28, 0.52, windowWarm, 1);
    }
    // Central Astronomical Clock Tower with Verdigris Copper Spire
    l.block(hx, hz, 0.26, 0.26, 0.97, 0.38, marble);
    l.block(hx, hz + 0.132, 0.11, 0.016, 1.08, 0.12, gold);
    l.block(hx, hz + 0.136, 0.088, 0.014, 1.09, 0.1, windowWarm, 1);
    l.dome(hx, hz, 0.14, 0.14, 1.35, 0.26, copper);
    l.round(hx, hz, 0.008, 0.035, 1.61, 0.2, gold);
  },

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

  // ===========================================================================
  // 4. SAWMILL CHAIN (5 TIERS: Cấp 1 -> Cấp 5)
  // ===========================================================================
  sawmill(l) {
    // Tier 1: Rustic Open Sawmill with Waterwheel (Max Y ~ 0.62)
    l.base('#889a5c', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.block(0.2, 0.54, 0.16, 0.66, 0.035, 0.045, stonePlinth);
    l.block(0.2, 0.54, 0.1, 0.62, 0.075, 0.014, water);
    waterwheel(l, 0.27, 0.2, 0.54, 0.13, oak, timber);
    // Open-sided timber shed & log pile
    for (const sx of [0.32, 0.68]) {
      for (const sz of [0.26, 0.62]) {
        l.block(sx, sz, 0.03, 0.03, 0.035, 0.34, timber);
      }
    }
    steppedRoof(l, 0.5, 0.44, 0.44, 0.44, 0.375, 0.22, 'x', ['#6e533b', '#826449']);
    surroundHallDetails(l, 0.5, 0.44, 0.34, 0.34, 0.16, 0.1, 1, 1, timberDark, oak);
    l.block(0.5, 0.44, 0.26, 0.1, 0.035, 0.12, oak);
    logStack(l, 0.72, 0.76, 0.26, 0.035);
  },

  flume_sawmill(l) {
    // Tier 2: Flume Sawmill with Elevated Stone Flume & Enclosed Shed (Max Y ~ 0.78)
    l.base('#968e78', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.block(0.2, 0.52, 0.16, 0.7, 0.035, 0.18, stonePlinth);
    l.block(0.2, 0.52, 0.1, 0.66, 0.21, 0.015, water);
    waterwheel(l, 0.28, 0.23, 0.54, 0.15, oak, timber);
    l.block(0.54, 0.44, 0.46, 0.48, 0.035, 0.42, oak);
    surroundHallDetails(l, 0.54, 0.44, 0.46, 0.48, 0.18, 0.14, 2, 2, timberDark, oak);
    steppedRoof(l, 0.54, 0.44, 0.52, 0.52, 0.455, 0.3, 'x', ['#594635', '#6e5844', '#594635']);
    logStack(l, 0.66, 0.8, 0.28, 0.035);
  },

  timber_mill(l) {
    // Tier 3: Waterpowered Timber Mill with Clerestory, Jib Crane & Saw Bed (Max Y ~ 0.96)
    l.base('#a19986', 0.035);
    lotCurb(l, 9, 0, 0.042);
    l.block(0.2, 0.52, 0.16, 0.68, 0.035, 0.12, stonePlinth);
    l.block(0.2, 0.52, 0.1, 0.64, 0.15, 0.016, water);
    waterwheel(l, 0.28, 0.24, 0.54, 0.16, oak, iron);
    const hx = 0.52;
    const hz = 0.42;
    l.block(hx, hz, 0.48, 0.48, 0.035, 0.48, plaster);
    surroundHallDetails(l, hx, hz, 0.48, 0.48, 0.2, 0.15, 2, 2, timberDark, stoneLight);
    steppedRoof(l, hx, hz, 0.54, 0.54, 0.515, 0.34, 'x', [slateDark, slate, '#576f80']);
    l.block(hx, hz, 0.28, 0.16, 0.78, 0.16, timber);
    // Timber jib crane on right (+X) & outdoor circular saw carriage
    l.block(0.78, 0.42, 0.035, 0.035, 0.42, 0.38, timber);
    l.beam([0.78, 0.74, 0.42], [0.88, 0.78, 0.64], 0.028, oak);
    l.block(0.56, 0.78, 0.32, 0.08, 0.035, 0.075, oak);
    l.round(0.56, 0.78, 0.055, 0.055, 0.11, 0.02, '#c8d2d4');
  },

  steam_sawmill(l) {
    // Tier 4: 2-Story Brick-and-Timber Steam Sawmill with Boiler Stack (Max Y ~ 1.18)
    l.base('#a69f8e', 0.04);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.5;
    const hz = 0.42;
    l.block(hx, hz, 0.56, 0.52, 0.04, 0.58, brick);
    surroundHallDetails(l, hx, hz, 0.56, 0.52, 0.22, 0.18, 2, 2, iron, stoneLight);
    steppedRoof(l, hx, hz, 0.62, 0.56, 0.62, 0.36, 'x', [slateDark, slate, '#576f80']);
    l.round(0.24, 0.24, 0.055, 0.075, 0.04, 1.12, brickDark);
    logStack(l, 0.64, 0.8, 0.3, 0.04);
  },

  lumber_works(l) {
    // Tier 5: Mechanized Brick-and-Steel Lumber Works with Sawtooth Skylight & Gantry Crane (Max Y ~ 1.38)
    l.base('#b3ad9e', 0.04);
    lotCurb(l, 10, 0, 0.045);
    l.block(0.18, 0.52, 0.14, 0.66, 0.04, 0.08, stonePlinth);
    waterwheel(l, 0.25, 0.24, 0.54, 0.16, steel, iron);
    const hx = 0.48;
    const hz = 0.4;
    l.block(hx, hz, 0.54, 0.5, 0.04, 0.68, brick);
    surroundHallDetails(l, hx, hz, 0.54, 0.5, 0.24, 0.2, 2, 2, iron, stoneLight);
    l.ridge(hx, hz, 0.58, 0.54, 0.72, 0.34, 'x', slate);
    l.round(0.28, 0.2, 0.05, 0.068, 0.04, 1.32, copperBright);
    // Steel overhead gantry crane spanning front-right lumber yard
    l.block(0.84, 0.42, 0.04, 0.04, 0.04, 0.78, iron);
    l.block(0.84, 0.78, 0.04, 0.04, 0.04, 0.78, iron);
    l.block(0.68, 0.6, 0.36, 0.4, 0.8, 0.04, steel);
    l.block(0.56, 0.8, 0.24, 0.12, 0.04, 0.1, '#d9b26a');
    l.block(0.8, 0.68, 0.18, 0.1, 0.04, 0.1, '#e6c27a');
  },

  // ===========================================================================
  // 5. WINDMILL CHAIN (5 TIERS: Cấp 1 -> Cấp 5)
  // ===========================================================================
  windmill(l) {
    // Tier 1: Wooden Post Mill (Max Y ~ 1.15)
    l.base('#889e5c', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.block(0.5, 0.46, 0.38, 0.38, 0.035, 0.2, stonePlinth);
    surroundHallDetails(l, 0.5, 0.46, 0.38, 0.38, 0.08, 0.1, 1, 1, timberDark, stoneLight);
    l.round(0.5, 0.46, 0.15, 0.23, 0.235, 0.54, plaster);
    l.ridge(0.5, 0.46, 0.32, 0.36, 0.775, 0.22, 'z', '#6e5239');
    windmillSails(l, 0.5, 0.78, 0.68, 0.34, 4, '#ede2c4', timber);
  },

  smock_windmill(l) {
    // Tier 2: Octagonal White Smock Windmill on Brick Base (Max Y ~ 1.32)
    l.base('#939e68', 0.035);
    lotCurb(l, 8, 0, 0.04);
    l.round(0.5, 0.46, 0.25, 0.28, 0.035, 0.28, brick);
    surroundHallDetails(l, 0.5, 0.46, 0.38, 0.38, 0.12, 0.12, 1, 1, timberDark, stoneLight);
    l.round(0.5, 0.46, 0.16, 0.24, 0.315, 0.62, '#f2ede0');
    l.dome(0.5, 0.46, 0.17, 0.17, 0.935, 0.22, '#5c4632');
    windmillSails(l, 0.5, 0.92, 0.68, 0.36, 4, '#f5ecd4', timber);
  },

  stone_windmill(l) {
    // Tier 3: Tall Dutch Stone Windmill with Wooden Stage Gallery (Max Y ~ 1.52)
    l.base('#aba391', 0.035);
    lotCurb(l, 9, 0, 0.042);
    l.round(0.46, 0.46, 0.27, 0.3, 0.035, 0.36, stonePlinth);
    surroundHallDetails(l, 0.46, 0.46, 0.4, 0.4, 0.14, 0.14, 1, 1, timberDark, stoneLight);
    // Wooden wrap-around stage gallery balcony
    l.round(0.46, 0.46, 0.34, 0.34, 0.38, 0.03, oak);
    l.round(0.46, 0.46, 0.34, 0.34, 0.44, 0.025, timber);
    // Tall dressed-stone tower & rotating cap
    l.round(0.46, 0.46, 0.16, 0.26, 0.395, 0.72, stoneLight);
    l.dome(0.46, 0.46, 0.17, 0.17, 1.115, 0.24, timber);
    windmillSails(l, 0.46, 1.1, 0.68, 0.38, 4, '#f5ecd4', oak);
    // Side grain storehouse shed
    l.block(0.74, 0.58, 0.22, 0.28, 0.035, 0.26, oak);
    l.ridge(0.74, 0.58, 0.26, 0.32, 0.295, 0.12, 'z', '#5c4632');
  },

  multi_vane_mill(l) {
    // Tier 4: Multi-Vane Mechanical Wind Tower with Brick Powerhouse (Max Y ~ 1.72)
    l.base('#b5ad9c', 0.04);
    lotCurb(l, 9, 0, 0.042);
    l.round(0.44, 0.46, 0.26, 0.3, 0.04, 0.42, stoneLight);
    surroundHallDetails(l, 0.44, 0.46, 0.4, 0.4, 0.16, 0.15, 1, 1, iron, marble);
    l.round(0.44, 0.46, 0.16, 0.25, 0.46, 0.82, limestone);
    l.dome(0.44, 0.46, 0.17, 0.17, 1.28, 0.24, copperBright);
    windmillSails(l, 0.44, 1.28, 0.68, 0.39, 6, '#f2e8cf', copperBright);
    l.block(0.74, 0.54, 0.26, 0.36, 0.04, 0.38, brick);
    l.ridge(0.74, 0.54, 0.3, 0.4, 0.42, 0.16, 'z', slateDark);
  },

  wind_turbine_spire(l) {
    // Tier 5: Brass-Ribbed Limestone & Copper Dome Wind Turbine Spire (Max Y ~ 1.96)
    l.base('#c7c0b0', 0.04);
    lotCurb(l, 10, 0, 0.045);
    const tx = 0.44;
    const tz = 0.46;
    l.round(tx, tz, 0.26, 0.31, 0.04, 0.48, stoneLight);
    surroundHallDetails(l, tx, tz, 0.42, 0.42, 0.18, 0.16, 1, 1, gold, marble);
    l.round(tx, tz, 0.17, 0.25, 0.52, 0.9, marble);
    for (const y of [0.52, 0.96, 1.4]) {
      l.round(tx, tz, 0.21, 0.21, y, 0.03, gold);
    }
    l.dome(tx, tz, 0.18, 0.18, 1.42, 0.32, copper);
    l.round(tx, tz, 0.008, 0.03, 1.74, 0.18, gold);
    windmillSails(l, tx, 1.44, 0.69, 0.4, 5, '#fbf6e8', gold);
    // Brick powerhouse annex with glowing windows
    l.block(0.75, 0.54, 0.26, 0.38, 0.04, 0.44, brick);
    l.ridge(0.75, 0.54, 0.3, 0.42, 0.48, 0.18, 'z', slate);
    l.block(0.75, 0.735, 0.12, 0.018, 0.16, 0.18, windowWarm, 1);
  },

  // ===========================================================================
  // 6. BRICKWORKS CHAIN (5 TIERS: Cấp 1 -> Cấp 5)
  // ===========================================================================
  brickworks(l) {
    // Tier 1: Clay Clamp Beehive Kilns & Drying Bricks (Max Y ~ 0.74)
    l.base('#ad8e6d', 0.035);
    lotCurb(l, 8, 0, 0.04);
    for (const [kx, kz, r, h] of [
      [0.28, 0.42, 0.16, 0.26],
      [0.52, 0.32, 0.18, 0.32],
    ] as const) {
      l.round(kx, kz, r * 0.85, r, 0.035, h, '#a66e4e');
      l.dome(kx, kz, r * 0.85, r * 0.85, 0.035 + h, r * 0.9, '#b87b58');
      l.block(kx, kz + r, 0.08, 0.03, 0.05, 0.1, fireGlow, 1);
    }
    l.round(0.62, 0.24, 0.045, 0.065, 0.035, 0.68, '#8f593f');
    surroundHallDetails(l, 0.42, 0.38, 0.44, 0.42, 0.08, 0.1, 1, 1, brickDark, stonePlinth);
    for (const bx of [0.34, 0.56, 0.76]) {
      for (const bz of [0.68, 0.82]) {
        l.block(bx, bz, 0.14, 0.08, 0.035, 0.045, brick);
      }
    }
  },

  downdraft_kiln(l) {
    // Tier 2: Twin Iron-Banded Red-Brick Downdraft Kilns & Shared Stack (Max Y ~ 0.96)
    l.base('#a88c6f', 0.035);
    lotCurb(l, 8, 0, 0.04);
    for (const kx of [0.3, 0.68]) {
      l.round(kx, 0.42, 0.18, 0.19, 0.035, 0.32, brick);
      l.round(kx, 0.42, 0.195, 0.195, 0.18, 0.025, iron);
      l.dome(kx, 0.42, 0.18, 0.18, 0.355, 0.2, brickDark);
      l.block(kx, 0.6, 0.09, 0.025, 0.06, 0.11, fireGlow, 1);
    }
    l.block(0.49, 0.22, 0.13, 0.13, 0.035, 0.9, brick);
    surroundHallDetails(l, 0.49, 0.42, 0.58, 0.36, 0.1, 0.12, 2, 1, iron, stonePlinth);
    l.block(0.49, 0.22, 0.16, 0.16, 0.91, 0.035, iron);
  },

  kiln_works(l) {
    // Tier 3: Vaulted Hoffman Brick Kiln with Iron Straps, Tall Chimney & Shed (Max Y ~ 1.18)
    l.base('#a68e74', 0.035);
    lotCurb(l, 9, 0, 0.042);
    // Barrel-vaulted red-brick Hoffman kiln
    const kx = 0.44;
    const kz = 0.44;
    l.block(kx, kz, 0.48, 0.54, 0.035, 0.28, brick);
    surroundHallDetails(l, kx, kz, 0.48, 0.54, 0.08, 0.12, 2, 2, iron, stoneLight);
    l.vaultedCanopy(kx, kz, 0.48, 0.54, 0.315, 0.2);
    for (const sz of [0.26, 0.44, 0.62]) {
      l.block(kx, sz, 0.51, 0.028, 0.035, 0.32, iron);
      l.block(kx + 0.245, sz, 0.02, 0.08, 0.06, 0.11, fireGlow, 1);
    }
    // Tall square brick chimney with iron spark arrestor
    l.block(0.58, 0.2, 0.14, 0.14, 0.035, 1.1, brick);
    l.block(0.58, 0.2, 0.17, 0.17, 1.12, 0.045, iron);
    // Timber molding shed & red brick pallets
    l.block(0.8, 0.48, 0.2, 0.32, 0.035, 0.24, oak);
    l.ridge(0.8, 0.48, 0.24, 0.36, 0.275, 0.11, 'z', '#5c4632');
    l.block(0.48, 0.82, 0.16, 0.12, 0.035, 0.09, brick);
  },

  tunnel_kiln_works(l) {
    // Tier 4: 1.5-Story Tunnel Kiln Hall with Kiln Cart Track & Twin Stacks (Max Y ~ 1.42)
    l.base('#aba18e', 0.04);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.5;
    const hz = 0.44;
    l.block(hx, hz, 0.62, 0.52, 0.04, 0.52, brick);
    surroundHallDetails(l, hx, hz, 0.62, 0.52, 0.24, 0.16, 2, 2, iron, stoneLight);
    steppedRoof(l, hx, hz, 0.66, 0.56, 0.56, 0.28, 'x', [slateDark, slate, '#576f80']);
    for (const sx of [0.28, 0.46]) {
      l.round(sx, 0.2, 0.055, 0.075, 0.04, 1.36, brick);
      l.round(sx, 0.2, 0.065, 0.065, 1.37, 0.035, iron);
    }
    l.block(0.36, 0.705, 0.14, 0.025, 0.06, 0.2, fireGlow, 1);
    l.block(0.64, 0.705, 0.14, 0.025, 0.06, 0.2, fireGlow, 1);
    l.block(0.64, 0.8, 0.12, 0.14, 0.04, 0.11, iron);
  },

  ceramics_manufactory(l) {
    // Tier 5: 2-Story Ceramics & Glazed Tile Manufactory with Clerestory & Banded Twin Stacks (Max Y ~ 1.66)
    l.base('#bab3a2', 0.04);
    lotCurb(l, 10, 0, 0.045);
    const hx = 0.52;
    const hz = 0.44;
    l.block(hx, hz, 0.64, 0.52, 0.04, 0.22, stoneLight);
    l.block(hx, hz, 0.62, 0.5, 0.26, 0.42, brick);
    surroundHallDetails(l, hx, hz, 0.62, 0.5, 0.34, 0.18, 2, 2, iron, marble);
    steppedRoof(l, hx, hz, 0.66, 0.54, 0.68, 0.28, 'x', [slateDark, slate, '#576f80']);
    l.block(hx, hz, 0.44, 0.2, 0.88, 0.16, slateDark);
    // Twin tall white-banded brick smokestacks
    for (const sx of [0.26, 0.42]) {
      l.round(sx, 0.2, 0.058, 0.082, 0.04, 1.6, brick);
      for (const y of [0.6, 1.05, 1.48]) {
        l.round(sx, 0.2, 0.072, 0.072, y, 0.035, marble);
      }
    }
    // Glowing tunnel kiln arches & glazed blue/white ceramic pallets
    l.block(0.38, 0.705, 0.12, 0.025, 0.06, 0.18, fireGlow, 1);
    l.block(0.64, 0.705, 0.12, 0.025, 0.06, 0.18, fireGlow, 1);
    l.block(0.22, 0.78, 0.12, 0.1, 0.04, 0.09, '#6ca3a8');
    l.block(0.82, 0.78, 0.12, 0.1, 0.04, 0.09, marble);
  },
};
