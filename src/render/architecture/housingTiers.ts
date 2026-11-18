import { type Lot, type Recipes } from './lot';

const grass = '#6e9647';
const stoneCurb = '#7e796e';
const stonePlinth = '#767167';
const stoneLight = '#c6bca6';
const limestone = '#e2d7c1';
const limestoneBright = '#efe7d6';
const marble = '#f4f0e6';
const plaster = '#ede4d2';
const plasterWarm = '#e6d7be';
const timber = '#533a24';
const timberDark = '#3d2a19';
const oak = '#7d5a3b';
const pine = '#946846';
const brick = '#b5563c';
const brickDark = '#8c3f2b';
const slate = '#465866';
const slateDark = '#34434f';
const copper = '#558c7c';
const copperLight = '#6fa896';
const terracotta = '#c85a32';
const terracottaDark = '#a34422';
const thatchDark = '#8c693e';
const thatchMid = '#a67f4d';
const thatchLight = '#bd945e';
const gold = '#d9b14a';
const iron = '#2f3538';
const steel = '#6e7b80';
const water = '#4d8da6';
const windowWarm = '#f5be42';
const flowerPink = '#e24864';
const flowerYellow = '#f7d23d';
const foliage = '#467a34';

/** Stone curb border around all 4 edges of the lot, staying strictly within [0.02, 0.98]. */
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

/** Multi-course stepped pitched roof with ridge beam and bargeboards on both gable ends. */
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
  if (along === 'x') {
    l.block(x, z, w + 0.02, 0.034, y + h - 0.012, 0.03, ridgeColor);
    for (const sx of [-1, 1]) {
      const gx = x + sx * (w / 2);
      l.beam([gx, y, z - d / 2], [gx, y + h + 0.015, z], 0.024, ridgeColor);
      l.beam([gx, y, z + d / 2], [gx, y + h + 0.015, z], 0.024, ridgeColor);
    }
  } else {
    l.block(x, z, 0.034, d + 0.02, y + h - 0.012, 0.03, ridgeColor);
    for (const sz of [-1, 1]) {
      const gz = z + sz * (d / 2);
      l.beam([x - w / 2, y, gz], [x, y + h + 0.015, gz], 0.024, ridgeColor);
      l.beam([x + w / 2, y, gz], [x, y + h + 0.015, gz], 0.024, ridgeColor);
    }
  }
}

/** Framed glowing window on a Z-facing wall (dir = +1 for South/+Z, dir = -1 for North/-Z). */
function windowZ(
  l: Lot,
  x: number,
  zWall: number,
  w: number,
  y: number,
  h: number,
  dir: 1 | -1,
  frame = timberDark,
  sill = stoneLight,
  shutters = false,
  flowerBox = false,
): void {
  l.block(x, zWall + dir * 0.002, w + 0.016, 0.018, y - 0.008, h + 0.016, frame);
  l.block(x, zWall + dir * 0.006, w, 0.014, y, h, windowWarm, 1);
  l.block(x, zWall + dir * 0.009, 0.01, 0.014, y, h, frame);
  l.block(x, zWall + dir * 0.01, w + 0.022, 0.022, y - 0.014, 0.014, sill);
  if (shutters) {
    l.block(x - w * 0.64, zWall + dir * 0.006, w * 0.24, 0.014, y, h, frame);
    l.block(x + w * 0.64, zWall + dir * 0.006, w * 0.24, 0.014, y, h, frame);
  }
  if (flowerBox) {
    l.block(x, zWall + dir * 0.015, w + 0.018, 0.024, y - 0.028, 0.02, timber);
    l.block(x - w * 0.24, zWall + dir * 0.017, w * 0.34, 0.018, y - 0.009, 0.015, flowerPink);
    l.block(x + w * 0.24, zWall + dir * 0.017, w * 0.34, 0.018, y - 0.009, 0.015, flowerYellow);
  }
}

/** Framed glowing window on an X-facing wall (dir = +1 for East/+X, dir = -1 for West/-X). */
function windowX(
  l: Lot,
  xWall: number,
  z: number,
  d: number,
  y: number,
  h: number,
  dir: 1 | -1,
  frame = timberDark,
  sill = stoneLight,
  shutters = false,
  flowerBox = false,
): void {
  l.block(xWall + dir * 0.002, z, 0.018, d + 0.016, y - 0.008, h + 0.016, frame);
  l.block(xWall + dir * 0.006, z, 0.014, d, y, h, windowWarm, 1);
  l.block(xWall + dir * 0.009, z, 0.014, 0.01, y, h, frame);
  l.block(xWall + dir * 0.01, z, 0.022, d + 0.022, y - 0.014, 0.014, sill);
  if (shutters) {
    l.block(xWall + dir * 0.006, z - d * 0.64, 0.014, d * 0.24, y, h, frame);
    l.block(xWall + dir * 0.006, z + d * 0.64, 0.014, d * 0.24, y, h, frame);
  }
  if (flowerBox) {
    l.block(xWall + dir * 0.015, z, 0.024, d + 0.018, y - 0.028, 0.02, timber);
    l.block(xWall + dir * 0.017, z - d * 0.24, 0.018, d * 0.34, y - 0.009, 0.015, flowerYellow);
    l.block(xWall + dir * 0.017, z + d * 0.24, 0.018, d * 0.34, y - 0.009, 0.015, flowerPink);
  }
}

/** Places framed windows on all 4 facades (+Z, -Z, +X, -X) of a rectangular building story. */
function surroundWindows(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  colsZ: number,
  colsX: number,
  winW = 0.068,
  frame = timberDark,
  sill = stoneLight,
  shutters = false,
  flowerBox = false,
): void {
  const spanX = hw * 0.76;
  for (let i = 0; i < colsZ; i++) {
    const wx = hx + (colsZ === 1 ? 0 : ((i + 0.5) / colsZ - 0.5) * spanX);
    windowZ(l, wx, hz + hd / 2, winW, y, h, 1, frame, sill, shutters, flowerBox);
    windowZ(l, wx, hz - hd / 2, winW, y, h, -1, frame, sill, shutters, flowerBox);
  }
  const spanZ = hd * 0.76;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    windowX(l, hx + hw / 2, wz, winW, y, h, 1, frame, sill, shutters, flowerBox);
    windowX(l, hx - hw / 2, wz, winW, y, h, -1, frame, sill, shutters, flowerBox);
  }
}

/** Places half-timber framing (corner posts, plates, studs & diagonal braces) on all 4 walls. */
function surroundTimberFrame(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  color = timber,
): void {
  // 4 Corner posts
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      l.block(hx + sx * (hw / 2), hz + sz * (hd / 2), 0.024, 0.024, y, h, color);
    }
  }
  // Horizontal plates on all 4 walls (bottom, mid, top)
  for (const py of [y, y + h * 0.5, y + h - 0.018]) {
    l.block(hx, hz + hd / 2, hw + 0.012, 0.018, py, 0.018, color);
    l.block(hx, hz - hd / 2, hw + 0.012, 0.018, py, 0.018, color);
    l.block(hx + hw / 2, hz, 0.018, hd + 0.012, py, 0.018, color);
    l.block(hx - hw / 2, hz, 0.018, hd + 0.012, py, 0.018, color);
  }
  // Vertical center studs & diagonal knee braces on all 4 faces
  for (const sz of [-1, 1]) {
    const zFace = hz + sz * (hd / 2 + 0.002);
    l.block(hx, zFace, 0.02, 0.018, y, h, color);
    l.beam([hx - hw * 0.44, y + 0.02, zFace], [hx - hw * 0.16, y + h - 0.02, zFace], 0.018, color);
    l.beam([hx + hw * 0.44, y + 0.02, zFace], [hx + hw * 0.16, y + h - 0.02, zFace], 0.018, color);
  }
  for (const sx of [-1, 1]) {
    const xFace = hx + sx * (hw / 2 + 0.002);
    l.block(xFace, hz, 0.018, 0.02, y, h, color);
    l.beam([xFace, y + 0.02, hz - hd * 0.44], [xFace, y + h - 0.02, hz - hd * 0.16], 0.018, color);
    l.beam([xFace, y + 0.02, hz + hd * 0.44], [xFace, y + h - 0.02, hz + hd * 0.16], 0.018, color);
  }
}

/** Places alternating stone corner quoins and wrap-around floor belt courses on all 4 sides. */
function surroundQuoinsAndBelts(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y0: number,
  h: number,
  courses: number,
  beltLevels: readonly number[],
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
          hx + sx * (hw / 2 - wSpan * 0.3),
          hz + sz * (hd / 2 - dSpan * 0.3),
          wSpan,
          dSpan,
          y,
          qh,
          color,
        );
      }
    }
  }
  for (const by of beltLevels) {
    l.block(hx, hz, hw + 0.022, hd + 0.022, by, 0.024, color);
  }
}

/** Places projecting stone balconies with iron railings on all 4 facades (+Z, -Z, +X, -X). */
function surroundBalconies(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  spanZ: number,
  spanX: number,
  slabColor = stoneLight,
  railColor = iron,
): void {
  for (const sz of [-1, 1] as const) {
    const bz = hz + sz * (hd / 2 + 0.024);
    l.block(hx, bz, spanZ, 0.048, y, 0.022, slabColor);
    l.block(hx, bz + sz * 0.018, spanZ, 0.012, y + 0.022, 0.048, railColor);
    l.block(hx - spanZ * 0.3, bz, 0.04, 0.024, y + 0.022, 0.024, foliage);
    l.block(hx + spanZ * 0.3, bz, 0.04, 0.024, y + 0.022, 0.024, flowerPink);
  }
  for (const sx of [-1, 1] as const) {
    const bx = hx + sx * (hw / 2 + 0.024);
    l.block(bx, hz, 0.048, spanX, y, 0.022, slabColor);
    l.block(bx + sx * 0.018, hz, 0.012, spanX, y + 0.022, 0.048, railColor);
    l.block(bx, hz - spanX * 0.3, 0.024, 0.04, y + 0.022, 0.024, foliage);
    l.block(bx, hz + spanX * 0.3, 0.024, 0.04, y + 0.022, 0.024, flowerYellow);
  }
}

/** Places roof dormers on both slopes of a pitched roof (+X and -X slopes for along='z'). */
function surroundDormers(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  roofY: number,
  along: 'x' | 'z',
  zOffsets: readonly number[],
  wallColor = plaster,
  roofColor = slate,
): void {
  if (along === 'z') {
    for (const dz of zOffsets) {
      for (const sx of [-1, 1] as const) {
        const dx = hx + sx * (hw * 0.34);
        const cz = hz + dz;
        l.block(dx, cz, 0.13, 0.12, roofY, 0.12, wallColor);
        l.ridge(dx, cz, 0.15, 0.14, roofY + 0.115, 0.075, 'x', roofColor);
        windowX(l, dx + sx * 0.065, cz, 0.06, roofY + 0.025, 0.068, sx, timberDark, stoneLight);
      }
    }
  } else {
    for (const dx of zOffsets) {
      for (const sz of [-1, 1] as const) {
        const cx = hx + dx;
        const dz = hz + sz * (hd * 0.34);
        l.block(cx, dz, 0.12, 0.13, roofY, 0.12, wallColor);
        l.ridge(cx, dz, 0.14, 0.15, roofY + 0.115, 0.075, 'z', roofColor);
        windowZ(l, cx, dz + sz * 0.065, 0.06, roofY + 0.025, 0.068, sz, timberDark, stoneLight);
      }
    }
  }
}

/** Places dormers on all 4 slopes (+Z, -Z, +X, -X) of a Mansard or hipped roof. */
function mansardFourSideDormers(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  roofY: number,
  wallColor = limestone,
  roofColor = slateDark,
): void {
  for (const dx of [-hw * 0.22, hw * 0.22]) {
    for (const sz of [-1, 1] as const) {
      const cz = hz + sz * (hd * 0.38);
      l.block(hx + dx, cz, 0.11, 0.11, roofY, 0.13, wallColor);
      l.ridge(hx + dx, cz, 0.125, 0.125, roofY + 0.125, 0.07, 'z', roofColor);
      windowZ(l, hx + dx, cz + sz * 0.055, 0.058, roofY + 0.024, 0.072, sz, timberDark, stoneLight);
    }
  }
  for (const dz of [-hd * 0.22, hd * 0.22]) {
    for (const sx of [-1, 1] as const) {
      const cx = hx + sx * (hw * 0.38);
      l.block(cx, hz + dz, 0.11, 0.11, roofY, 0.13, wallColor);
      l.ridge(cx, hz + dz, 0.125, 0.125, roofY + 0.125, 0.07, 'x', roofColor);
      windowX(l, cx + sx * 0.055, hz + dz, 0.058, roofY + 0.024, 0.072, sx, timberDark, stoneLight);
    }
  }
}

/** Rear service door, pitched rear porch awning, lantern, stone step & rain barrel on -Z wall. */
function rearServicePorch(
  l: Lot,
  hx: number,
  zRearWall: number,
  y0: number,
  doorColor = timberDark,
  awningColor = terracotta,
): void {
  // Rear wooden service door & lintel
  l.block(hx, zRearWall - 0.006, 0.085, 0.016, y0 + 0.02, 0.17, doorColor);
  l.block(hx, zRearWall - 0.01, 0.1, 0.022, y0 + 0.185, 0.018, stoneLight);
  // Rear porch canopy & brackets
  l.ridge(hx, zRearWall - 0.04, 0.15, 0.08, y0 + 0.2, 0.06, 'z', awningColor);
  // Stone steps at back door
  l.block(hx, zRearWall - 0.04, 0.12, 0.06, y0, 0.024, stoneLight);
  l.block(hx, zRearWall - 0.08, 0.1, 0.05, 0.035, 0.014, stoneCurb);
  // Glowing rear wall lantern & rainwater barrel
  l.block(hx + 0.075, zRearWall - 0.015, 0.026, 0.026, y0 + 0.12, 0.038, windowWarm, 1);
  l.round(hx - 0.11, zRearWall - 0.04, 0.026, 0.024, 0.035, 0.075, oak);
  l.round(hx - 0.11, zRearWall - 0.04, 0.021, 0.021, 0.108, 0.008, water);
}

/** Detailed 360-degree Row Houses (Artisan Row & Terrace Residence). */
function detailedRowHouses(l: Lot, terrace: boolean): void {
  l.base('#9a9682', 0.035);
  lotCurb(l, 10, 0, 0.042);
  const wallH = terrace ? 1.16 : 0.82;
  for (const x of [0.27, 0.73]) {
    const hw = 0.42;
    const hd = 0.56;
    const hz = 0.5;
    l.block(x, hz, hw + 0.02, hd + 0.02, 0.035, 0.085, stonePlinth);
    l.block(x, hz, hw, hd, 0.12, wallH, terrace ? limestone : plaster);
    surroundQuoinsAndBelts(
      l,
      x,
      hz,
      hw,
      hd,
      0.12,
      wallH,
      terrace ? 6 : 4,
      terrace ? [0.48, 0.86, 1.24] : [0.48, 0.9],
      stoneLight,
    );
    const floors = terrace ? [0.24, 0.58, 0.94] : [0.24, 0.6];
    for (const fy of floors) {
      surroundWindows(
        l,
        x,
        hz,
        hw,
        hd,
        fy,
        0.14,
        2,
        2,
        0.068,
        timberDark,
        stoneLight,
        !terrace,
        true,
      );
    }
    if (terrace) {
      surroundBalconies(l, x, hz, hw, hd, 0.52, 0.28, 0.32, stoneLight, iron);
      l.mansard(x, hz, hw + 0.05, hd + 0.05, 0.12 + wallH, 0.42);
      mansardFourSideDormers(l, x, hz, hw, hd, 0.18 + wallH, limestone, slateDark);
      l.block(x + 0.1, hz - 0.12, 0.08, 0.08, 0.48 + wallH, 0.22, brick);
    } else {
      surroundTimberFrame(l, x, hz, hw, hd, 0.5, wallH - 0.38, timber);
      steppedRoof(l, x, hz, hw + 0.05, hd + 0.05, 0.12 + wallH, 0.4, 'z', [
        terracottaDark,
        terracotta,
        '#d96b3f',
        terracotta,
      ]);
      surroundDormers(l, x, hz, hw, hd, 0.24 + wallH, 'z', [0], plaster, slate);
      l.block(x + 0.08, hz - 0.12, 0.08, 0.08, 0.38 + wallH, 0.24, brick);
    }
    // Front stoop (+Z) and rear garden porch (-Z)
    l.block(x, hz + hd / 2 + 0.01, 0.095, 0.022, 0.12, 0.2, timberDark);
    l.block(x, hz + hd / 2 + 0.045, 0.14, 0.07, 0.035, 0.085, stoneLight);
    rearServicePorch(l, x, hz - hd / 2, 0.035, timberDark, terrace ? slate : terracotta);
  }
}

export const housingTiers: Recipes = {
  // ===========================================================================
  // 1. URBAN 1×1 CHAIN (7 TIERS: hut -> cottage -> gable_homestead -> townhouse
  //    -> tenement -> boulevard_mansion -> metropolitan_residence)
  // ===========================================================================
  hut(l) {
    // Tier 1: Rustic Wattle-and-Daub Thatch Hut — 360-degree details (Max Y ~ 0.62)
    l.base(grass, 0.035);
    lotCurb(l, 7, 0, 0.036);
    const hx = 0.46;
    const hz = 0.46;
    const hw = 0.42;
    const hd = 0.46;
    // Fieldstone footing & wattle-and-daub walls with corner posts on all 4 sides
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.065, stonePlinth);
    l.block(hx, hz, hw, hd, 0.1, 0.22, '#dfd0b2');
    surroundTimberFrame(l, hx, hz, hw, hd, 0.1, 0.22, oak);
    // Windows on all 4 walls (+Z, -Z, +X, -X) with wooden shutters
    surroundWindows(l, hx, hz, hw, hd, 0.15, 0.095, 1, 1, 0.062, oak, timber, true, false);
    // 4-course thick stepped golden thatch roof + crossed ridge poles
    steppedRoof(
      l,
      hx,
      hz,
      hw + 0.08,
      hd + 0.08,
      0.31,
      0.28,
      'z',
      [thatchDark, thatchMid, thatchLight, thatchMid],
      oak,
    );
    // Front timber porch (+Z) & rear firewood lean-to (-Z)
    l.block(hx, hz + hd / 2 + 0.045, 0.16, 0.08, 0.035, 0.045, oak);
    l.block(hx, hz + hd / 2 + 0.008, 0.08, 0.018, 0.08, 0.16, timberDark);
    l.ridge(hx, hz + hd / 2 + 0.045, 0.19, 0.1, 0.24, 0.07, 'z', thatchMid);
    // Rear (-Z) clay chimney flue & firewood stack
    l.block(hx, hz - hd / 2 - 0.02, 0.08, 0.07, 0.035, 0.56, stonePlinth);
    for (const dz of [-0.04, 0.04]) {
      l.block(hx + 0.18, hz - hd / 2 - 0.06 + dz, 0.14, 0.045, 0.035, 0.055, pine);
    }
    // East (+X) woven wattle garden plot & West (-X) clay water jars
    l.block(0.8, 0.56, 0.18, 0.34, 0.035, 0.018, '#543b25');
    for (const cz of [0.44, 0.56, 0.68]) {
      l.round(0.8, cz, 0.024, 0.028, 0.05, 0.028, foliage);
    }
    l.round(0.16, 0.58, 0.026, 0.034, 0.035, 0.075, terracotta);
    l.round(0.22, 0.66, 0.022, 0.028, 0.035, 0.06, '#b87a4b');
    l.tree(0.18, 0.22, 0.34, '#4c7d3a');
  },

  gable_homestead(l) {
    // Tier 3: 2-Story Tudor Jettied Gable Homestead — 360-degree details (Max Y ~ 1.18)
    l.base(grass, 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.46;
    const hz = 0.45;
    const hw = 0.46;
    const hd = 0.52;
    // Dressed stone ground plinth & lower plaster walls
    l.block(hx, hz, hw + 0.02, hd + 0.02, 0.035, 0.09, stonePlinth);
    l.block(hx, hz, hw, hd, 0.125, 0.28, plaster);
    surroundTimberFrame(l, hx, hz, hw, hd, 0.125, 0.28, timber);
    surroundWindows(l, hx, hz, hw, hd, 0.18, 0.11, 2, 2, 0.065, timberDark, stoneLight, true, true);

    // Overhanging Jettied 2nd Story on ALL 4 SIDES (+Z, -Z, +X, -X) supported by corbel brackets
    const jw = hw + 0.055;
    const jd = hd + 0.055;
    const jy = 0.405;
    const jh = 0.3;
    l.block(hx, hz, jw, jd, jy - 0.018, 0.024, timberDark);
    l.block(hx, hz, jw, jd, jy, jh, plaster);
    surroundTimberFrame(l, hx, hz, jw, jd, jy, jh, timber);
    surroundWindows(
      l,
      hx,
      hz,
      jw,
      jd,
      jy + 0.06,
      0.12,
      2,
      2,
      0.068,
      timberDark,
      timber,
      false,
      true,
    );

    // Steep stepped terracotta roof + cross-gables & dormers on both East & West slopes
    const roofY = jy + jh;
    l.ridge(hx, hz, jw, jd, roofY, 0.38, 'z', plaster);
    steppedRoof(l, hx, hz, jw + 0.06, jd + 0.06, roofY, 0.4, 'z', [
      terracottaDark,
      terracotta,
      '#db6a3b',
      terracotta,
      terracottaDark,
    ]);
    surroundDormers(l, hx, hz, jw, jd, roofY + 0.1, 'z', [-0.1, 0.1], plaster, slate);

    // Twin tall brick chimneys at North-West and South-East roof slopes
    for (const [cx, cz] of [
      [hx - 0.14, hz - 0.16],
      [hx + 0.14, hz + 0.12],
    ] as const) {
      l.block(cx, cz, 0.09, 0.09, roofY + 0.16, 0.3, brick);
      l.block(cx, cz, 0.11, 0.11, roofY + 0.44, 0.028, stoneLight);
    }

    // Front arched porch (+Z) & Rear kitchen porch (-Z)
    l.block(hx, hz + hd / 2 + 0.055, 0.18, 0.1, 0.035, 0.085, stonePlinth);
    l.block(hx - 0.07, hz + hd / 2 + 0.09, 0.024, 0.024, 0.12, 0.2, timber);
    l.block(hx + 0.07, hz + hd / 2 + 0.09, 0.024, 0.024, 0.12, 0.2, timber);
    l.ridge(hx, hz + hd / 2 + 0.055, 0.21, 0.12, 0.31, 0.085, 'z', terracotta);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, terracotta);

    // Side East (+X) rose trellis arbor & West (-X) stone well + bench
    l.block(0.84, 0.56, 0.14, 0.28, 0.035, 0.22, timber);
    l.block(0.84, 0.56, 0.16, 0.3, 0.25, 0.03, foliage);
    l.round(0.15, 0.62, 0.05, 0.055, 0.035, 0.08, stonePlinth);
    l.round(0.15, 0.62, 0.04, 0.04, 0.11, 0.01, water);
    l.tree(0.16, 0.2, 0.42, '#487d37');
  },

  townhouse(l) {
    // Tier 4: 3-Story Georgian/Haussmann Limestone Townhouse with 4-Side Mansard Roof (Max Y ~ 1.56)
    l.base('#9c9887', 0.035);
    lotCurb(l, 9, 0, 0.044);
    const hx = 0.5;
    const hz = 0.46;
    const hw = 0.56;
    const hd = 0.6;
    const wallY = 0.12;
    const wallH = 0.98;
    // Rusticated stone ground floor & upper limestone facades
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.34, stoneLight);
    l.block(hx, hz, hw, hd, 0.375, wallH - 0.255, limestone);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, wallY, wallH, 6, [0.37, 0.72, 1.08], '#c8bea8');
    // Windows on ALL 4 FACADES across all 3 stories
    for (const [fy, fh, flower] of [
      [0.18, 0.14, false],
      [0.45, 0.16, true],
      [0.8, 0.15, true],
    ] as const) {
      surroundWindows(
        l,
        hx,
        hz,
        hw,
        hd,
        fy,
        fh,
        2,
        2,
        0.072,
        timberDark,
        stoneLight,
        false,
        flower,
      );
    }
    // Wrought-iron balconies on 2nd story on all 4 facades
    surroundBalconies(l, hx, hz, hw, hd, 0.42, 0.38, 0.38, stoneLight, iron);

    // Slate Mansard Roof with dormers on all 4 slopes (+Z, -Z, +X, -X) & twin chimneys
    l.mansard(hx, hz, hw + 0.06, hd + 0.06, 1.1, 0.38);
    mansardFourSideDormers(l, hx, hz, hw, hd, 1.16, limestone, slateDark);
    for (const sx of [-0.18, 0.18]) {
      l.block(hx + sx, hz - 0.12, 0.08, 0.09, 1.32, 0.24, brick);
      l.block(hx + sx, hz - 0.12, 0.095, 0.105, 1.53, 0.025, stoneLight);
    }

    // Front grand stone stoop (+Z) with urns & carriage lamps, plus Rear courtyard porch (-Z)
    l.block(hx, hz + hd / 2 + 0.055, 0.22, 0.1, 0.035, 0.1, stoneLight);
    l.block(hx, hz + hd / 2 + 0.01, 0.1, 0.02, 0.135, 0.21, timberDark);
    for (const sx of [-0.13, 0.13]) {
      l.round(hx + sx, hz + hd / 2 + 0.06, 0.028, 0.02, 0.135, 0.05, stonePlinth);
      l.dome(hx + sx, hz + hd / 2 + 0.06, 0.035, 0.035, 0.185, 0.04, foliage);
    }
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, slate);
  },

  tenement(l) {
    // Tier 5: 4-Story Red-Brick Mixed-Use Tenement with 4-Sided Balconies & Rooftop Tank (Max Y ~ 1.88)
    l.base('#8f8d82', 0.035);
    lotCurb(l, 10, 0, 0.044);
    const hx = 0.48;
    const hz = 0.47;
    const hw = 0.64;
    const hd = 0.62;
    // Dressed stone ground-floor shopfront arcade on all 4 sides + 3 upper brick residential stories
    l.block(hx, hz, hw + 0.025, hd + 0.025, 0.035, 0.34, stonePlinth);
    l.block(hx, hz, hw, hd, 0.375, 1.08, brick);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.1, 1.35, 8, [0.37, 0.72, 1.07, 1.43], stoneLight);
    // Glowing ground-floor shop windows & awnings on Front (+Z) and East (+X), service windows on -Z and -X
    surroundWindows(l, hx, hz, hw, hd, 0.12, 0.18, 3, 3, 0.072, iron, stoneLight, false, false);
    l.ridge(hx, hz + hd / 2 + 0.035, hw * 0.84, 0.07, 0.31, 0.055, 'x', '#9e382f');
    l.ridge(hx + hw / 2 + 0.035, hz, 0.07, hd * 0.84, 0.31, 0.055, 'z', '#3b6978');

    // Upper 3 residential stories: windows & wrought-iron fire-escape balconies on all 4 facades
    for (const fy of [0.46, 0.81, 1.16]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.16, 3, 3, 0.068, iron, stoneLight, false, true);
      surroundBalconies(l, hx, hz, hw, hd, fy - 0.04, 0.44, 0.42, stoneLight, iron);
    }
    // External diagonal iron fire-escape stairs on Front (+Z) and Rear (-Z)
    for (const sz of [-1, 1] as const) {
      const fz = hz + sz * (hd / 2 + 0.038);
      l.beam([hx - 0.16, 0.44, fz], [hx + 0.16, 0.79, fz], 0.016, iron);
      l.beam([hx + 0.16, 0.79, fz], [hx - 0.16, 1.14, fz], 0.016, iron);
    }

    // Projecting stone cornice, rooftop stairwell penthouse & wooden water tank on stilts
    l.block(hx, hz, hw + 0.06, hd + 0.06, 1.45, 0.06, stoneLight);
    l.block(hx - 0.14, hz - 0.1, 0.2, 0.22, 1.51, 0.18, brickDark);
    l.block(hx + 0.14, hz + 0.08, 0.14, 0.14, 1.51, 0.12, timber);
    l.round(hx + 0.14, hz + 0.08, 0.08, 0.08, 1.63, 0.18, oak);
    l.round(hx + 0.14, hz + 0.08, 0.01, 0.09, 1.81, 0.07, slateDark);
  },

  boulevard_mansion(l) {
    // Tier 6: 5-Story Beaux-Arts Limestone Boulevard Mansion with Corner Cupolas (Max Y ~ 2.24)
    l.base('#aca696', 0.04);
    lotCurb(l, 10, 0, 0.046);
    const hx = 0.5;
    const hz = 0.48;
    const hw = 0.66;
    const hd = 0.64;
    // Grand rusticated podium + 4 carved limestone stories
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.04, 0.36, stoneLight);
    l.block(hx, hz, hw, hd, 0.4, 1.32, limestoneBright);
    surroundQuoinsAndBelts(
      l,
      hx,
      hz,
      hw,
      hd,
      0.08,
      1.64,
      10,
      [0.39, 0.72, 1.05, 1.38, 1.7],
      stoneLight,
    );
    // Cylindrical corner turrets at all 4 corners
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const tx = hx + sx * (hw / 2 - 0.02);
        const tz = hz + sz * (hd / 2 - 0.02);
        l.round(tx, tz, 0.075, 0.075, 0.04, 1.72, limestone);
      }
    }
    // 5 stories of tall arched/framed windows & continuous balconies on all 4 sides
    for (const fy of [0.14, 0.46, 0.79, 1.12, 1.44]) {
      surroundWindows(
        l,
        hx,
        hz,
        hw * 0.88,
        hd * 0.88,
        fy,
        0.17,
        3,
        3,
        0.068,
        iron,
        stoneLight,
        false,
        true,
      );
    }
    surroundBalconies(l, hx, hz, hw, hd, 0.42, 0.48, 0.46, marble, iron);
    surroundBalconies(l, hx, hz, hw, hd, 1.08, 0.48, 0.46, marble, iron);

    // Slate Mansard crown + 4-side dormers + twin oxidized-copper corner cupolas
    l.mansard(hx, hz, hw + 0.04, hd + 0.04, 1.72, 0.34);
    mansardFourSideDormers(l, hx, hz, hw, hd, 1.78, marble, slateDark);
    for (const [cx, cz] of [
      [hx + hw / 2 - 0.02, hz + hd / 2 - 0.02],
      [hx - hw / 2 + 0.02, hz - hd / 2 + 0.02],
    ] as const) {
      l.dome(cx, cz, 0.088, 0.088, 1.76, 0.24, copper);
      l.round(cx, cz, 0.015, 0.03, 2.0, 0.16, gold);
    }
    l.dome(hx, hz, 0.16, 0.16, 2.02, 0.16, copperLight);
    l.round(hx, hz, 0.012, 0.028, 2.16, 0.08, gold);
  },

  metropolitan_residence(l) {
    // Tier 7: 7-Story Stepped Art-Deco Royal Residence Tower with Sky Terraces & Gold Spire (Max Y ~ 2.68)
    l.base('#b8b2a2', 0.04);
    lotCurb(l, 10, 0, 0.048);
    const hx = 0.5;
    const hz = 0.5;
    // Lower 3-story colonnaded marble base (all 4 sides)
    l.block(hx, hz, 0.72, 0.72, 0.04, 0.76, marble);
    surroundQuoinsAndBelts(l, hx, hz, 0.72, 0.72, 0.04, 0.76, 5, [0.3, 0.55, 0.78], gold);
    for (const fy of [0.12, 0.38, 0.6]) {
      surroundWindows(l, hx, hz, 0.72, 0.72, fy, 0.14, 3, 3, 0.072, iron, gold, false, false);
    }
    // Hanging sky-garden terraces on all 4 corners at y = 0.80
    for (const sx of [-0.26, 0.26]) {
      for (const sz of [-0.26, 0.26]) {
        l.dome(hx + sx, hz + sz, 0.065, 0.065, 0.8, 0.07, foliage);
      }
    }
    // Mid 2-story setback tier (all 4 sides)
    l.block(hx, hz, 0.54, 0.54, 0.8, 0.68, limestoneBright);
    surroundQuoinsAndBelts(l, hx, hz, 0.54, 0.54, 0.8, 0.68, 4, [1.12, 1.46], gold);
    for (const fy of [0.88, 1.2]) {
      surroundWindows(l, hx, hz, 0.54, 0.54, fy, 0.16, 2, 2, 0.072, iron, stoneLight, false, true);
    }
    surroundBalconies(l, hx, hz, 0.54, 0.54, 1.16, 0.36, 0.36, marble, gold);

    // Upper 2-story penthouse crown + 4-sided lantern observatory & gilded spire
    l.block(hx, hz, 0.38, 0.38, 1.48, 0.58, marble);
    for (const fy of [1.56, 1.82]) {
      surroundWindows(l, hx, hz, 0.38, 0.38, fy, 0.15, 2, 2, 0.065, gold, marble, false, false);
    }
    l.dome(hx, hz, 0.2, 0.2, 2.06, 0.28, copper);
    l.round(hx, hz, 0.065, 0.075, 2.3, 0.16, windowWarm, 1);
    l.round(hx, hz, 0.01, 0.045, 2.46, 0.22, gold);
  },

  // ===========================================================================
  // 2. SPECIALIZED NEIGHBORHOOD BRANCHES (1×1: worker_dormitory, scholar_salon_house,
  //    merchant_arcade_house)
  // ===========================================================================
  worker_dormitory(l) {
    // Industrial Worker Dormitory (3.5-story heavy brick, iron stairs & roof vents on all 4 sides, Max Y ~ 1.32)
    l.base('#8a857b', 0.035);
    lotCurb(l, 9, 0, 0.042);
    const hx = 0.48;
    const hz = 0.48;
    const hw = 0.62;
    const hd = 0.58;
    l.block(hx, hz, hw + 0.025, hd + 0.025, 0.035, 0.1, stonePlinth);
    l.block(hx, hz, hw, hd, 0.135, 0.86, brick);
    // Iron vertical pilaster straps & belt courses on all 4 sides
    for (const sx of [-0.28, 0, 0.28]) {
      l.block(hx + sx, hz, 0.026, hd + 0.016, 0.135, 0.86, iron);
    }
    for (const sz of [-0.26, 0, 0.26]) {
      l.block(hx, hz + sz, hw + 0.016, 0.026, 0.135, 0.86, iron);
    }
    for (const fy of [0.2, 0.48, 0.76]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.14, 3, 2, 0.066, iron, stoneLight, false, false);
    }
    surroundBalconies(l, hx, hz, hw, hd, 0.44, 0.44, 0.38, iron, iron);
    // Dual sawtooth-style slate roof ridges + iron ventilation stacks & rear coal bunker
    steppedRoof(l, hx, hz - 0.13, hw + 0.04, hd * 0.5, 0.995, 0.22, 'x', [
      slateDark,
      slate,
      slateDark,
    ]);
    steppedRoof(l, hx, hz + 0.13, hw + 0.04, hd * 0.5, 0.995, 0.22, 'x', [
      slateDark,
      slate,
      slateDark,
    ]);
    l.round(hx - 0.16, hz - 0.12, 0.045, 0.055, 1.1, 0.22, iron);
    l.round(hx + 0.16, hz + 0.12, 0.045, 0.055, 1.1, 0.22, steel);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, iron, slateDark);
  },

  scholar_salon_house(l) {
    // Cultural Bohemian / Scholar Salon House (3.5-story Renaissance house with skylight atelier & brass telescope, Max Y ~ 1.76)
    l.base('#90a17b', 0.035);
    lotCurb(l, 9, 0, 0.044);
    const hx = 0.5;
    const hz = 0.48;
    const hw = 0.58;
    const hd = 0.58;
    l.block(hx, hz, hw + 0.025, hd + 0.025, 0.035, 0.12, stoneLight);
    l.block(hx, hz, hw, hd, 0.155, 1.06, limestoneBright);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.155, 1.06, 6, [0.48, 0.84, 1.2], copper);
    for (const fy of [0.22, 0.56, 0.9]) {
      surroundWindows(
        l,
        hx,
        hz,
        hw,
        hd,
        fy,
        0.16,
        2,
        2,
        0.075,
        timberDark,
        stoneLight,
        false,
        true,
      );
    }
    surroundBalconies(l, hx, hz, hw, hd, 0.52, 0.4, 0.4, limestone, copper);
    // Copper hipped roof + glowing glass skylight studio + brass astronomical dome & telescope
    l.mansard(hx, hz, hw + 0.05, hd + 0.05, 1.215, 0.32);
    mansardFourSideDormers(l, hx, hz, hw, hd, 1.26, limestoneBright, copper);
    l.block(hx - 0.08, hz + 0.06, 0.18, 0.16, 1.5, 0.12, windowWarm, 1);
    l.dome(hx + 0.1, hz - 0.08, 0.12, 0.12, 1.5, 0.22, copperLight);
    l.beam([hx + 0.1, 1.64, hz - 0.08], [hx + 0.22, 1.76, hz + 0.04], 0.024, gold);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, copper);
  },

  merchant_arcade_house(l) {
    // Nightlife / Merchant Arcade House (3.5-story mixed commercial with glowing lantern arcades on all 4 sides, Max Y ~ 1.80)
    l.base('#a69b86', 0.035);
    lotCurb(l, 9, 0, 0.044);
    const hx = 0.5;
    const hz = 0.48;
    const hw = 0.62;
    const hd = 0.62;
    // Ground-floor stone colonnade & warm glowing bazaar windows on all 4 sides
    l.block(hx, hz, hw, hd, 0.035, 0.36, stoneLight);
    surroundWindows(l, hx, hz, hw, hd, 0.1, 0.2, 3, 3, 0.074, oak, stonePlinth, false, false);
    // Striped merchant awnings & warm glowing lanterns on all 4 sides
    for (const sz of [-1, 1] as const) {
      l.ridge(hx, hz + sz * (hd / 2 + 0.035), hw * 0.88, 0.07, 0.33, 0.06, 'x', '#b83b32');
      l.round(hx - 0.18, hz + sz * (hd / 2 + 0.05), 0.022, 0.022, 0.26, 0.045, windowWarm, 1);
      l.round(hx + 0.18, hz + sz * (hd / 2 + 0.05), 0.022, 0.022, 0.26, 0.045, windowWarm, 1);
    }
    for (const sx of [-1, 1] as const) {
      l.ridge(hx + sx * (hw / 2 + 0.035), hz, 0.07, hd * 0.88, 0.33, 0.06, 'z', '#d99b38');
      l.round(hx + sx * (hw / 2 + 0.05), hz, 0.022, 0.022, 0.26, 0.045, windowWarm, 1);
    }
    // Upper 2 stories of warm ochre plaster & timber + rooftop lantern pavilion
    l.block(hx, hz, hw - 0.02, hd - 0.02, 0.395, 0.84, plasterWarm);
    surroundTimberFrame(l, hx, hz, hw - 0.02, hd - 0.02, 0.395, 0.84, timber);
    for (const fy of [0.48, 0.86]) {
      surroundWindows(
        l,
        hx,
        hz,
        hw - 0.02,
        hd - 0.02,
        fy,
        0.16,
        2,
        2,
        0.072,
        timberDark,
        oak,
        true,
        true,
      );
    }
    surroundBalconies(l, hx, hz, hw - 0.02, hd - 0.02, 0.82, 0.42, 0.42, oak, iron);
    steppedRoof(l, hx, hz, hw + 0.05, hd + 0.05, 1.235, 0.36, 'z', [
      terracottaDark,
      terracotta,
      '#db6a3b',
      terracotta,
    ]);
    // Rooftop belvedere lantern cupola
    l.block(hx, hz, 0.2, 0.2, 1.52, 0.16, windowWarm, 1);
    l.dome(hx, hz, 0.13, 0.13, 1.68, 0.12, gold);
  },

  // ===========================================================================
  // 3. 2×2 ESTATE & HIGHRISE CHAIN (5 TIERS: villa -> manor_estate
  //    -> apartment_tower -> grand_condominium -> skyscraper)
  // ===========================================================================
  villa(l) {
    // Tier 1 (2×2): Mediterranean U-Shaped Courtyard Villa with Pool, Loggias & 4-Side Detail (Max Y ~ 1.22)
    l.base('#789c60', 0.035);
    lotCurb(l, 12, 0, 0.042);
    // North main hall (2 stories) + East & West wings
    const mx = 0.5;
    const mz = 0.26;
    const mw = 0.78;
    const md = 0.3;
    l.block(mx, mz, mw + 0.02, md + 0.02, 0.035, 0.08, stoneLight);
    l.block(mx, mz, mw, md, 0.115, 0.52, limestoneBright);
    surroundQuoinsAndBelts(l, mx, mz, mw, md, 0.115, 0.52, 4, [0.36, 0.62], stoneLight);
    surroundWindows(l, mx, mz, mw, md, 0.18, 0.13, 4, 2, 0.058, timberDark, stoneLight, true, true);
    surroundWindows(l, mx, mz, mw, md, 0.42, 0.13, 4, 2, 0.058, timberDark, stoneLight, true, true);
    steppedRoof(l, mx, mz, mw + 0.05, md + 0.05, 0.635, 0.26, 'x', [
      terracottaDark,
      terracotta,
      '#db6a3b',
    ]);
    // Central Belvedere Tower with purple-terracotta dome
    l.block(0.5, 0.26, 0.2, 0.2, 0.82, 0.22, limestone);
    surroundWindows(l, 0.5, 0.26, 0.2, 0.2, 0.86, 0.11, 1, 1, 0.05, timberDark, stoneLight);
    l.dome(0.5, 0.26, 0.12, 0.12, 1.04, 0.18, '#7d5278');

    // East & West lateral wings with windows on outer (-X/+X), inner, front (+Z) & rear (-Z) faces
    for (const wx of [0.22, 0.78]) {
      l.block(wx, 0.56, 0.22, 0.42, 0.035, 0.42, plasterWarm);
      surroundWindows(
        l,
        wx,
        0.56,
        0.22,
        0.42,
        0.16,
        0.14,
        1,
        2,
        0.055,
        timberDark,
        stoneLight,
        true,
        true,
      );
      steppedRoof(l, wx, 0.56, 0.26, 0.46, 0.455, 0.2, 'z', [terracottaDark, terracotta]);
    }
    // Courtyard reflecting pool, fountain jet, rear (-Z) Cypress colonnade & front gateway
    l.block(0.5, 0.58, 0.28, 0.26, 0.035, 0.045, marble);
    l.block(0.5, 0.58, 0.22, 0.2, 0.075, 0.015, water);
    l.round(0.5, 0.58, 0.025, 0.035, 0.08, 0.11, marble);
    for (const [tx, tz] of [
      [0.14, 0.84],
      [0.86, 0.84],
      [0.14, 0.14],
      [0.86, 0.14],
    ] as const) {
      l.tree(tx, tz, 0.42, '#3d6e2f');
    }
  },

  manor_estate(l) {
    // Tier 2 (2×2): Grand French Chateau Manor Estate with Clock Tower & Twin Fountains (Max Y ~ 1.68)
    l.base('#73965b', 0.035);
    lotCurb(l, 12, 0, 0.045);
    // Symmetrical 2.5-story Mansard Chateau corps-de-logis + flanking pavilions
    const mx = 0.5;
    const mz = 0.32;
    const mw = 0.76;
    const md = 0.34;
    l.block(mx, mz, mw + 0.03, md + 0.03, 0.035, 0.1, stoneLight);
    l.block(mx, mz, mw, md, 0.135, 0.74, limestoneBright);
    surroundQuoinsAndBelts(l, mx, mz, mw, md, 0.135, 0.74, 5, [0.48, 0.85], stoneLight);
    for (const fy of [0.2, 0.54]) {
      surroundWindows(l, mx, mz, mw, md, fy, 0.16, 4, 2, 0.058, timberDark, marble, false, true);
    }
    l.mansard(mx, mz, mw + 0.04, md + 0.04, 0.875, 0.32);
    mansardFourSideDormers(l, mx, mz, mw, md, 0.92, marble, slateDark);

    // East & West advancing wings (all 4 sides detailed)
    for (const wx of [0.2, 0.8]) {
      l.block(wx, 0.56, 0.24, 0.42, 0.035, 0.88, limestone);
      surroundQuoinsAndBelts(l, wx, 0.56, 0.24, 0.42, 0.035, 0.88, 5, [0.48, 0.88], stoneLight);
      for (const fy of [0.2, 0.54]) {
        surroundWindows(
          l,
          wx,
          0.56,
          0.24,
          0.42,
          fy,
          0.16,
          1,
          2,
          0.058,
          timberDark,
          marble,
          false,
          true,
        );
      }
      l.mansard(wx, 0.56, 0.27, 0.45, 0.915, 0.3);
    }

    // Central Clock & Bell Turret rising above main corps-de-logis
    l.block(0.5, 0.32, 0.2, 0.2, 1.15, 0.26, marble);
    surroundWindows(l, 0.5, 0.32, 0.2, 0.2, 1.2, 0.12, 1, 1, 0.06, gold, marble);
    l.dome(0.5, 0.32, 0.12, 0.12, 1.41, 0.18, slateDark);
    l.round(0.5, 0.32, 0.01, 0.025, 1.58, 0.1, gold);

    // Parterre gardens & Twin circular fountains in courtyard
    for (const fx of [0.39, 0.61]) {
      l.round(fx, 0.64, 0.075, 0.08, 0.035, 0.065, marble);
      l.round(fx, 0.64, 0.06, 0.06, 0.095, 0.012, water);
      l.round(fx, 0.64, 0.018, 0.024, 0.1, 0.09, gold);
    }
  },

  apartment_tower(l) {
    // Tier 3 (2×2): 5-Story Modern-Classical L-Wing Apartment Tower with 4-Side Balconies (Max Y ~ 2.46)
    l.base('#8b9882', 0.04);
    lotCurb(l, 12, 0, 0.046);
    const hx = 0.5;
    const hz = 0.46;
    const hw = 0.68;
    const hd = 0.58;
    l.block(hx, hz, hw + 0.04, hd + 0.04, 0.04, 0.36, stoneLight);
    l.block(hx, hz, hw, hd, 0.4, 1.68, limestoneBright);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.08, 2.0, 10, [0.4, 0.8, 1.2, 1.6, 2.04], '#d5cec0');
    for (const fy of [0.14, 0.5, 0.9, 1.3, 1.7]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.18, 4, 3, 0.068, iron, stoneLight, false, true);
    }
    for (const by of [0.46, 1.26, 1.66]) {
      surroundBalconies(l, hx, hz, hw, hd, by, 0.48, 0.42, stoneLight, '#5b7c85');
    }
    // Rooftop penthouse terrace, pergola & water tower
    l.block(0.38, 0.4, 0.28, 0.34, 2.08, 0.28, limestone);
    l.block(0.38, 0.4, 0.31, 0.37, 2.36, 0.1, '#2980b9');
    l.dome(0.64, 0.52, 0.1, 0.1, 2.08, 0.1, foliage);
    l.tree(0.2, 0.84, 0.5, '#4b7d3b');
    l.tree(0.8, 0.84, 0.48, '#558a43');
  },

  grand_condominium(l) {
    // Tier 4 (2×2): 7-Story Twin Luxury Condominium Towers Linked by Skybridge (Max Y ~ 3.05)
    l.base('#9c9a8e', 0.04);
    lotCurb(l, 12, 0, 0.048);
    // Grand 2-story arched podium base spanning the lot with windows on all 4 sides
    l.block(0.5, 0.48, 0.78, 0.68, 0.04, 0.52, marble);
    surroundQuoinsAndBelts(l, 0.5, 0.48, 0.78, 0.68, 0.04, 0.52, 4, [0.3, 0.54], gold);
    surroundWindows(l, 0.5, 0.48, 0.78, 0.68, 0.12, 0.16, 4, 4, 0.068, iron, gold, false, false);
    surroundWindows(l, 0.5, 0.48, 0.78, 0.68, 0.34, 0.14, 4, 4, 0.068, iron, gold, false, true);
    // Podium rooftop garden between the twin towers
    l.dome(0.5, 0.48, 0.12, 0.16, 0.56, 0.09, foliage);

    // Twin 7-story towers (West x=0.28, East x=0.72), each detailed on all 4 facades
    for (const tx of [0.28, 0.72]) {
      const tw = 0.3;
      const td = 0.54;
      l.block(tx, 0.48, tw, td, 0.56, 2.04, limestoneBright);
      surroundQuoinsAndBelts(
        l,
        tx,
        0.48,
        tw,
        td,
        0.56,
        2.04,
        10,
        [0.96, 1.36, 1.76, 2.16, 2.56],
        stoneLight,
      );
      for (const fy of [0.66, 1.04, 1.44, 1.84, 2.24]) {
        surroundWindows(l, tx, 0.48, tw, td, fy, 0.18, 2, 3, 0.058, iron, marble, false, false);
      }
      surroundBalconies(l, tx, 0.48, tw, td, 1.4, 0.2, 0.36, marble, copper);
      l.dome(tx, 0.48, 0.14, 0.22, 2.6, 0.26, copper);
      l.round(tx, 0.48, 0.01, 0.025, 2.86, 0.18, gold);
    }
    // Glowing glazed Skybridge linking West and East towers at y = 1.82
    l.block(0.5, 0.48, 0.18, 0.22, 1.8, 0.22, copper);
    l.block(0.5, 0.48, 0.16, 0.24, 1.84, 0.14, windowWarm, 1);
  },

  skyscraper(l) {
    // Tier 5 (2×2): 11-Story Art-Deco Setback Skyscraper with 4-Side Mullions & Golden Spire (Max Y ~ 4.42)
    l.base('#969d99', 0.04);
    lotCurb(l, 12, 0, 0.05);
    const hx = 0.5;
    const hz = 0.5;
    // Tier A: Grand 2-story colonnaded stone podium (all 4 facades)
    l.block(hx, hz, 0.82, 0.78, 0.04, 0.68, '#c5c9bf');
    surroundQuoinsAndBelts(l, hx, hz, 0.82, 0.78, 0.04, 0.68, 4, [0.38, 0.7], gold);
    for (const fy of [0.14, 0.44]) {
      surroundWindows(l, hx, hz, 0.82, 0.78, fy, 0.18, 4, 4, 0.07, iron, gold);
    }
    // Tier B: Main 6-story shaft with vertical limestone piers & windows on all 4 facades
    l.block(hx, hz, 0.56, 0.56, 0.72, 2.1, '#5d8496');
    for (const offset of [-0.2, 0, 0.2]) {
      l.block(hx + offset, hz, 0.04, 0.58, 0.72, 2.1, '#c8cfc6');
      l.block(hx, hz + offset, 0.58, 0.04, 0.72, 2.1, '#c8cfc6');
    }
    for (const fy of [0.84, 1.18, 1.52, 1.86, 2.2, 2.54]) {
      surroundWindows(l, hx, hz, 0.56, 0.56, fy, 0.18, 2, 2, 0.072, iron, '#c8cfc6');
    }
    // Tier C: Upper 3-story setback tower + Art-Deco crown & golden beacon spire
    l.block(hx, hz, 0.38, 0.38, 2.82, 0.96, '#7196a6');
    for (const fy of [2.92, 3.22, 3.52]) {
      surroundWindows(l, hx, hz, 0.38, 0.38, fy, 0.18, 2, 2, 0.062, gold, '#dfe6e0');
    }
    l.block(hx, hz, 0.42, 0.42, 3.78, 0.1, gold);
    l.round(hx, hz, 0.1, 0.15, 3.88, 0.24, windowWarm, 1);
    l.round(hx, hz, 0.012, 0.035, 4.12, 0.3, gold);
  },

  // ===========================================================================
  // 4. OCCUPATIONAL MULTI-TIER CHAINS (Fisher 4-Tier, Miner 3-Tier, Lumberjack 3-Tier)
  // ===========================================================================
  fisher_hut(l) {
    // Tier 1 Fisher: Stilt Shack with Drying Net Rack, Pier & Moored Skiff (Max Y ~ 0.60)
    const deckY = 0.16;
    // Timber stilts on all 4 corners + center pilings
    for (const x of [0.16, 0.5, 0.84]) {
      for (const z of [0.18, 0.78]) {
        l.block(x, z, 0.055, 0.055, 0, deckY + 0.06, timber);
      }
    }
    l.block(0.5, 0.48, 0.82, 0.72, deckY, 0.055, oak);
    // Shack cabin with windows on all 4 walls
    const hx = 0.42;
    const hz = 0.42;
    const hw = 0.46;
    const hd = 0.44;
    l.block(hx, hz, hw, hd, deckY + 0.055, 0.22, '#9fb0b8');
    surroundTimberFrame(l, hx, hz, hw, hd, deckY + 0.055, 0.22, oak);
    surroundWindows(l, hx, hz, hw, hd, deckY + 0.1, 0.09, 1, 1, 0.06, timberDark, oak, true, false);
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, deckY + 0.275, 0.16, 'z', [
      '#466370',
      '#587987',
      '#466370',
    ]);
    // East (+X) net-drying A-frame rack & fish crates; Front (+Z) pier ladder
    l.beam([0.74, deckY + 0.05, 0.28], [0.74, deckY + 0.26, 0.48], 0.02, timber);
    l.beam([0.74, deckY + 0.05, 0.68], [0.74, deckY + 0.26, 0.48], 0.02, timber);
    l.block(0.74, 0.48, 0.014, 0.28, deckY + 0.1, 0.12, '#c8ba9b');
    l.block(0.5, 0.88, 0.22, 0.12, 0.02, deckY - 0.01, oak);
  },

  fisher_cottage(l) {
    // Tier 2 Fisher: 1.5-Story Wrap-Around Veranda Stilt Cottage with Lanterns (Max Y ~ 0.78)
    const deckY = 0.2;
    for (const x of [0.14, 0.5, 0.86]) {
      for (const z of [0.16, 0.5, 0.82]) {
        l.block(x, z, 0.06, 0.06, 0, deckY + 0.08, stonePlinth);
      }
    }
    l.block(0.5, 0.5, 0.86, 0.76, deckY, 0.06, oak);
    // Veranda railings on all 4 deck edges
    for (const sz of [0.14, 0.86]) l.block(0.5, sz, 0.82, 0.02, deckY + 0.06, 0.07, timber);
    for (const sx of [0.09, 0.91]) l.block(sx, 0.5, 0.02, 0.72, deckY + 0.06, 0.07, timber);
    // 1.5-story cabin with 4-sided windows & dormer
    const hx = 0.48;
    const hz = 0.46;
    const hw = 0.54;
    const hd = 0.48;
    l.block(hx, hz, hw, hd, deckY + 0.06, 0.28, '#b8c8cf');
    surroundTimberFrame(l, hx, hz, hw, hd, deckY + 0.06, 0.28, timber);
    surroundWindows(
      l,
      hx,
      hz,
      hw,
      hd,
      deckY + 0.12,
      0.11,
      2,
      1,
      0.065,
      timberDark,
      stoneLight,
      true,
      true,
    );
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, deckY + 0.34, 0.24, 'x', [
      slateDark,
      slate,
      '#587382',
      slate,
    ]);
    surroundDormers(l, hx, hz, hw, hd, deckY + 0.4, 'x', [0], plaster, slateDark);
    l.round(0.78, 0.78, 0.024, 0.024, deckY + 0.12, 0.05, windowWarm, 1);
  },

  harbor_inn_house(l) {
    // Tier 3 Fisher: 2-Story Stone Quay & Tudor Harbor House with Gable Hoist (Max Y ~ 1.12)
    l.base('#6d8c96', 0.02);
    // Dressed stone quay wall & timber front jetty
    l.block(0.5, 0.46, 0.84, 0.74, 0.02, 0.16, stonePlinth);
    l.block(0.5, 0.46, 0.86, 0.76, 0.17, 0.025, stoneLight);
    const hx = 0.48;
    const hz = 0.44;
    const hw = 0.56;
    const hd = 0.52;
    l.block(hx, hz, hw, hd, 0.195, 0.52, plaster);
    surroundTimberFrame(l, hx, hz, hw, hd, 0.195, 0.52, timber);
    for (const fy of [0.25, 0.51]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.12, 2, 2, 0.066, timberDark, stoneLight, true, true);
    }
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.715, 0.36, 'z', [
      slateDark,
      slate,
      terracotta,
      slate,
    ]);
    surroundDormers(l, hx, hz, hw, hd, 0.8, 'z', [0], plaster, slateDark);
    // Front (+Z) & Rear (-Z) gable hoist beams + stone chimney
    l.block(hx, hz + hd / 2 + 0.06, 0.03, 0.12, 0.94, 0.03, timberDark);
    l.block(hx + 0.16, hz - 0.14, 0.085, 0.085, 0.88, 0.24, brick);
    l.block(0.5, 0.9, 0.34, 0.12, 0.04, 0.08, oak);
  },

  maritime_guild_house(l) {
    // Tier 4 Fisher: 3-Story Captain's Maritime Guild Mansion with Lantern Observatory (Max Y ~ 1.48)
    l.base('#5d808c', 0.02);
    l.block(0.5, 0.48, 0.86, 0.78, 0.02, 0.18, stonePlinth);
    l.block(0.5, 0.48, 0.88, 0.8, 0.19, 0.03, marble);
    const hx = 0.5;
    const hz = 0.46;
    const hw = 0.6;
    const hd = 0.56;
    l.block(hx, hz, hw, hd, 0.22, 0.78, limestoneBright);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.22, 0.78, 6, [0.48, 0.74, 0.98], copper);
    for (const fy of [0.28, 0.54, 0.79]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.13, 2, 2, 0.068, timberDark, marble, false, true);
    }
    surroundBalconies(l, hx, hz, hw, hd, 0.5, 0.38, 0.36, marble, gold);
    l.mansard(hx, hz, hw + 0.05, hd + 0.05, 1.0, 0.26);
    mansardFourSideDormers(l, hx, hz, hw, hd, 1.04, marble, copper);
    // Rooftop Harbor Watchtower Cupola with glowing beacon
    l.round(hx, hz, 0.09, 0.1, 1.24, 0.14, windowWarm, 1);
    l.dome(hx, hz, 0.1, 0.1, 1.38, 0.1, copper);
  },

  miner_cottage(l) {
    // Tier 2 Miner: Sturdy Granite Miner's Cottage with Rear Forge Chimney & Ore Cart (Max Y ~ 1.04)
    l.base('#878478', 0.035);
    lotCurb(l, 8, 0, 0.042);
    const hx = 0.46;
    const hz = 0.44;
    const hw = 0.54;
    const hd = 0.5;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.12, stonePlinth);
    l.block(hx, hz, hw, hd, 0.155, 0.34, '#9e9589');
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.155, 0.34, 4, [0.32, 0.48], stonePlinth);
    surroundWindows(l, hx, hz, hw, hd, 0.22, 0.13, 2, 2, 0.066, iron, stoneLight, true, false);
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.495, 0.34, 'x', [
      slateDark,
      slate,
      '#596670',
      slate,
    ]);
    surroundDormers(l, hx, hz, hw, hd, 0.56, 'x', [0], '#9e9589', slateDark);
    // Heavy stone chimney on West (-X), timber tool shed on East (+X), rear service porch (-Z)
    l.block(hx - hw / 2 - 0.03, hz, 0.11, 0.14, 0.035, 0.98, stonePlinth);
    l.block(hx - hw / 2 - 0.03, hz, 0.13, 0.16, 0.99, 0.04, stoneLight);
    l.block(0.82, 0.54, 0.16, 0.24, 0.035, 0.24, oak);
    l.ridge(0.82, 0.54, 0.19, 0.27, 0.275, 0.08, 'z', slateDark);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, iron, slateDark);
  },

  master_miner_lodge(l) {
    // Tier 3 Miner: 2.5-Story Granite & Red-Brick Master Miner's Lodge with Twin Chimneys (Max Y ~ 1.32)
    l.base('#8c887d', 0.035);
    lotCurb(l, 9, 0, 0.044);
    const hx = 0.48;
    const hz = 0.45;
    const hw = 0.58;
    const hd = 0.54;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.32, stonePlinth);
    l.block(hx, hz, hw, hd, 0.355, 0.44, brick);
    surroundQuoinsAndBelts(l, hx, hz, hw, hd, 0.08, 0.7, 6, [0.35, 0.58, 0.78], stoneLight);
    for (const fy of [0.16, 0.46]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.14, 2, 2, 0.068, iron, stoneLight, true, true);
    }
    steppedRoof(l, hx, hz, hw + 0.06, hd + 0.06, 0.795, 0.38, 'z', [
      slateDark,
      slate,
      '#586975',
      slateDark,
    ]);
    surroundDormers(l, hx, hz, hw, hd, 0.88, 'z', [-0.1, 0.1], brick, slateDark);
    // Twin tall granite chimneys & iron roof cresting
    for (const sx of [-0.22, 0.22]) {
      l.block(hx + sx, hz - 0.1, 0.1, 0.1, 0.82, 0.48, stonePlinth);
      l.block(hx + sx, hz - 0.1, 0.12, 0.12, 1.28, 0.035, stoneLight);
    }
    // Front (+Z) mineral display pedestal with glowing ore crystal & Rear (-Z) porch
    l.block(0.2, 0.82, 0.12, 0.12, 0.035, 0.09, stonePlinth);
    l.round(0.2, 0.82, 0.02, 0.045, 0.125, 0.09, copperLight, 1);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, iron, slate);
  },

  lumberjack_cottage(l) {
    // Tier 2 Lumberjack: Timber Log Cottage with Covered Woodshed & Pine Trees (Max Y ~ 1.04)
    l.base('#6b8e52', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.42;
    const hz = 0.44;
    const hw = 0.5;
    const hd = 0.54;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.09, stonePlinth);
    l.block(hx, hz, hw, hd, 0.125, 0.38, pine);
    // Interlocking horizontal log courses protruding at all 4 corners
    for (const ly of [0.15, 0.25, 0.35, 0.45]) {
      l.block(hx, hz, hw + 0.045, hd + 0.045, ly, 0.036, oak);
    }
    surroundWindows(l, hx, hz, hw, hd, 0.21, 0.13, 2, 2, 0.064, timberDark, oak, true, true);
    steppedRoof(l, hx, hz, hw + 0.08, hd + 0.08, 0.505, 0.38, 'z', [
      '#594637',
      '#6e5745',
      '#7d634f',
      '#594637',
    ]);
    surroundDormers(l, hx, hz, hw, hd, 0.58, 'z', [0], pine, '#4a3a2d');
    // River-stone chimney + East (+X) covered log storage shed & chopping block
    l.block(hx - 0.14, hz - 0.16, 0.1, 0.1, 0.68, 0.35, stonePlinth);
    l.block(0.78, 0.48, 0.2, 0.42, 0.32, 0.04, oak);
    for (const cz of [0.32, 0.64]) l.block(0.85, cz, 0.03, 0.03, 0.035, 0.29, timber);
    for (const lx of [0.73, 0.81]) l.block(lx, 0.48, 0.06, 0.3, 0.035, 0.12, '#b58958');
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, oak);
    l.tree(0.16, 0.2, 0.44, '#3d6e30');
  },

  forester_manor(l) {
    // Tier 3 Lumberjack: 2.5-Story Alpine Timber & Stone Forester Manor (Max Y ~ 1.34)
    l.base('#678c4f', 0.035);
    lotCurb(l, 9, 0, 0.044);
    const hx = 0.46;
    const hz = 0.45;
    const hw = 0.56;
    const hd = 0.56;
    // Dressed stone ground floor + carved timber upper story with wrap-around balcony
    l.block(hx, hz, hw + 0.025, hd + 0.025, 0.035, 0.34, stonePlinth);
    l.block(hx, hz, hw, hd, 0.375, 0.44, pine);
    surroundTimberFrame(l, hx, hz, hw, hd, 0.375, 0.44, timberDark);
    for (const fy of [0.16, 0.48]) {
      surroundWindows(l, hx, hz, hw, hd, fy, 0.14, 2, 2, 0.068, timberDark, stoneLight, true, true);
    }
    surroundBalconies(l, hx, hz, hw, hd, 0.42, 0.42, 0.42, oak, timberDark);
    // Steep Alpine cross-gable roof with carved ridge & river-stone chimney
    steppedRoof(l, hx, hz, hw + 0.08, hd + 0.08, 0.815, 0.42, 'z', [
      '#4f3d2f',
      '#634d3c',
      '#785e4a',
      '#4f3d2f',
    ]);
    steppedRoof(l, hx, hz, hw + 0.06, hd * 0.55, 0.84, 0.36, 'x', [
      '#4f3d2f',
      '#634d3c',
      '#785e4a',
    ]);
    l.block(hx + 0.16, hz - 0.16, 0.11, 0.11, 0.92, 0.41, stonePlinth);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, oak);
    l.tree(0.16, 0.2, 0.52, '#356329');
    l.tree(0.84, 0.22, 0.48, '#3f7331');
  },

  // ===========================================================================
  // 5. MERGED MULTI-TILE ROWS & COURTS + BIOME HOUSES (All 4 sides detailed)
  // ===========================================================================
  artisan_row_east: (l) => detailedRowHouses(l, false),
  artisan_row_south: (l) => detailedRowHouses(l, false),
  terrace_residence_east: (l) => detailedRowHouses(l, true),
  terrace_residence_south: (l) => detailedRowHouses(l, true),

  garden_court(l) {
    // 2×2 Merged Garden Court: 4-winged perimeter courtyard block with windows on all outer & inner walls (Max Y ~ 1.65)
    l.base(grass, 0.035);
    lotCurb(l, 12, 0, 0.044);
    // North & South wings
    for (const [mz, mh] of [
      [0.22, 0.92],
      [0.78, 0.72],
    ] as const) {
      l.block(0.5, mz, 0.78, 0.24, 0.035, mh, limestone);
      surroundQuoinsAndBelts(l, 0.5, mz, 0.78, 0.24, 0.035, mh, 5, [0.42, mh], stoneLight);
      for (const fy of [0.16, 0.52]) {
        surroundWindows(
          l,
          0.5,
          mz,
          0.78,
          0.24,
          fy,
          0.15,
          4,
          1,
          0.06,
          timberDark,
          stoneLight,
          false,
          true,
        );
      }
      steppedRoof(l, 0.5, mz, 0.82, 0.28, 0.035 + mh, 0.28, 'x', [copper, copperLight, copper]);
    }
    // East & West wings
    for (const wx of [0.21, 0.79]) {
      l.block(wx, 0.5, 0.22, 0.52, 0.035, 0.82, plasterWarm);
      for (const fy of [0.16, 0.5]) {
        surroundWindows(
          l,
          wx,
          0.5,
          0.22,
          0.52,
          fy,
          0.14,
          1,
          2,
          0.058,
          timberDark,
          stoneLight,
          false,
          true,
        );
      }
      steppedRoof(l, wx, 0.5, 0.26, 0.54, 0.855, 0.24, 'z', [terracottaDark, terracotta]);
    }
    // Central courtyard trees & stone fountain
    l.round(0.5, 0.5, 0.08, 0.09, 0.035, 0.07, stoneLight);
    l.round(0.5, 0.5, 0.065, 0.065, 0.1, 0.012, water);
    l.tree(0.4, 0.52, 0.58, foliage);
    l.tree(0.6, 0.48, 0.52, '#52873e');
  },

  civic_court(l) {
    // 2×2 Upgraded Civic Court: Grand 4-Story Beaux-Arts Courtyard Block with Corner Towers (Max Y ~ 2.28)
    l.base('#969485', 0.04);
    lotCurb(l, 12, 0, 0.048);
    for (const mz of [0.22, 0.78]) {
      l.block(0.5, mz, 0.8, 0.26, 0.04, 1.38, limestoneBright);
      surroundQuoinsAndBelts(l, 0.5, mz, 0.8, 0.26, 0.04, 1.38, 7, [0.44, 0.9, 1.38], stoneLight);
      for (const fy of [0.16, 0.56, 0.98]) {
        surroundWindows(l, 0.5, mz, 0.8, 0.26, fy, 0.16, 4, 1, 0.062, iron, marble, false, true);
      }
      l.mansard(0.5, mz, 0.84, 0.3, 1.42, 0.32);
    }
    for (const wx of [0.2, 0.8]) {
      l.block(wx, 0.5, 0.24, 0.52, 0.04, 1.56, '#e2c6a4');
      for (const fy of [0.16, 0.56, 0.98, 1.32]) {
        surroundWindows(l, wx, 0.5, 0.24, 0.52, fy, 0.15, 1, 3, 0.06, iron, marble, false, true);
      }
      l.mansard(wx, 0.5, 0.28, 0.56, 1.6, 0.34);
      l.dome(wx, 0.5, 0.11, 0.11, 1.94, 0.22, copper);
      l.round(wx, 0.5, 0.01, 0.025, 2.16, 0.12, gold);
    }
    l.round(0.5, 0.5, 0.1, 0.12, 0.04, 0.09, marble);
    l.round(0.5, 0.5, 0.08, 0.08, 0.125, 0.015, water);
    l.round(0.5, 0.5, 0.02, 0.03, 0.13, 0.14, gold);
  },

  yurt(l) {
    l.base('#ccb995', 0.03);
    lotCurb(l, 8, 0, 0.036);
    l.round(0.5, 0.5, 0.36, 0.37, 0.03, 0.24, '#dfd0b4');
    // Decorative woven bands & vertical felt tension ropes around all 360 degrees
    for (const y of [0.09, 0.18, 0.26]) {
      l.round(0.5, 0.5, 0.368, 0.368, y, 0.028, '#9e4738');
    }
    l.round(0.5, 0.5, 0.11, 0.39, 0.27, 0.18, '#e8dac0');
    l.round(0.5, 0.5, 0.095, 0.115, 0.44, 0.055, '#b85d3b');
    l.round(0.5, 0.5, 0.07, 0.07, 0.49, 0.02, windowWarm, 1);
    // Painted wooden door (+Z) & 4-directional Kazakh felt windows
    l.block(0.5, 0.86, 0.16, 0.06, 0.03, 0.22, '#7d3b2a');
    for (const sx of [-1, 1] as const) {
      windowX(l, 0.5 + sx * 0.35, 0.5, 0.08, 0.11, 0.09, sx, '#7d3b2a', oak);
    }
    windowZ(l, 0.5, 0.15, 0.08, 0.11, 0.09, -1, '#7d3b2a', oak);
  },

  log_cabin(l) {
    l.base('#c4cfcd', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.48;
    const hz = 0.46;
    const hw = 0.58;
    const hd = 0.52;
    l.block(hx, hz, hw + 0.03, hd + 0.03, 0.035, 0.08, stonePlinth);
    l.block(hx, hz, hw, hd, 0.115, 0.34, '#8e6650');
    for (const y of [0.14, 0.23, 0.32, 0.4]) {
      l.block(hx, hz, hw + 0.05, hd + 0.05, y, 0.038, '#a1775c');
    }
    surroundWindows(l, hx, hz, hw, hd, 0.19, 0.12, 2, 2, 0.064, timberDark, oak, true, false);
    steppedRoof(l, hx, hz, hw + 0.1, hd + 0.1, 0.455, 0.34, 'x', [
      '#59615c',
      '#cfd9d5',
      '#e4ede9',
      '#ffffff',
    ]);
    l.block(0.7, 0.3, 0.11, 0.11, 0.52, 0.36, stonePlinth);
    rearServicePorch(l, hx, hz - hd / 2, 0.035, timberDark, '#59615c');
  },

  mountain_hut(l) {
    l.base('#9a968b', 0.035);
    lotCurb(l, 8, 0, 0.04);
    const hx = 0.5;
    const hz = 0.48;
    const hw = 0.6;
    const hd = 0.62;
    l.block(hx, hz, hw, hd, 0.035, 0.22, stonePlinth);
    surroundWindows(l, hx, hz, hw, hd, 0.09, 0.1, 2, 2, 0.062, timberDark, stoneLight, true, false);
    steppedRoof(l, hx, hz, hw + 0.12, hd + 0.08, 0.255, 0.56, 'z', [
      '#59473e',
      '#6e594f',
      '#826a5e',
      '#59473e',
    ]);
    // Front (+Z) & Rear (-Z) upper chalet gable windows & balconies
    for (const sz of [-1, 1] as const) {
      const gz = hz + sz * (hd / 2 + 0.01);
      windowZ(l, hx, gz, 0.09, 0.36, 0.12, sz, timberDark, oak, true, true);
      l.block(hx, gz + sz * 0.025, 0.28, 0.045, 0.32, 0.025, oak);
    }
    l.block(0.22, 0.32, 0.12, 0.12, 0.22, 0.66, stoneLight);
  },
};
