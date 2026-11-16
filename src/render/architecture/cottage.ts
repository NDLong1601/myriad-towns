import { type Lot } from './lot';

const grass = '#6a9443';
const stonePlinth = '#767167';
const stonePlinthLight = '#878277';
const plaster = '#ede5d4';
const timber = '#533a24';
const timberDark = '#412d1b';
const roofOrangeEave = '#c25326';
const roofOrange1 = '#d6632f';
const roofOrange2 = '#cb5927';
const roofOrange3 = '#e2733c';
const roofOrange4 = '#cf5e2a';
const roofOrangeRidge = '#bc4c1f';
const roofCrest = '#db6932';
const dormerShingle = '#695a4d';
const windowLit = '#f5be42';
const soil = '#4a321f';
const cabbageOuter = '#447d35';
const cabbageHeart = '#72b356';
const carrotOrange = '#e26922';
const carrotFoliage = '#3b782c';
const water = '#3d7793';
const flowerYellow = '#f7d23d';
const flowerPink = '#e24864';
const flowerWhite = '#edf0f2';
const flowerGreen = '#447b31';
const roseRed = '#d62643';

/**
 * Detailed 3D Cottage (Nhà gỗ 1×1) matching the approved concept art.
 * Features steep stepped terracotta tile courses, dormer window, timber-framed plaster walls,
 * stone plinth, covered front porch with steps, warm lit windows with flower boxes,
 * fenced vegetable garden, stone water well, rear chimney, and trees.
 */
export function cottage(l: Lot): void {
  // 1. Lot base and stone curb border
  l.base(grass, 0.035);

  // Border stone curb blocks around plot edge
  for (let i = 0; i < 9; i++) {
    const t = 0.08 + i * 0.1;
    // Front edge (+z)
    l.block(t, 0.965, 0.088, 0.04, 0, 0.042, '#7e796e');
    // Back edge (-z)
    l.block(t, 0.035, 0.088, 0.04, 0, 0.042, '#7e796e');
    // Left edge (-x)
    l.block(0.035, t, 0.04, 0.088, 0, 0.042, '#7e796e');
    // Right edge (+x)
    l.block(0.965, t, 0.04, 0.088, 0, 0.042, '#7e796e');
  }

  // 2. Main house foundation / Stone Plinth
  const hx = 0.47;
  const hz = 0.43;
  const hw = 0.44;
  const hd = 0.54;
  const plinthH = 0.095;
  const plinthY = 0.035;
  const wallY = plinthY + plinthH; // 0.13
  const wallH = 0.25;
  const roofBaseY = wallY + wallH; // 0.38
  const ridgeY = 0.79;

  // Stone plinth footing (slightly wider than upper wall)
  l.block(hx, hz, hw + 0.035, hd + 0.035, plinthY, plinthH, stonePlinth);
  // Masonry relief stones along the plinth base
  for (const [bx, bz, bw, bd] of [
    [hx - hw / 2 - 0.01, hz + hd / 2, 0.05, 0.04],
    [hx + hw / 2 + 0.01, hz + hd / 2, 0.05, 0.04],
    [hx - hw / 2 - 0.01, hz - hd / 2, 0.05, 0.04],
    [hx + hw / 2 + 0.01, hz - hd / 2, 0.05, 0.04],
    [hx + hw / 2 + 0.015, hz, 0.025, 0.12],
    [hx - hw / 2 - 0.015, hz, 0.025, 0.12],
    [hx, hz + hd / 2 + 0.015, 0.14, 0.025],
  ] as const) {
    l.block(bx, bz, bw, bd, plinthY + 0.015, plinthH * 0.7, stonePlinthLight);
  }

  // 3. Main upper walls (cream plaster)
  l.block(hx, hz, hw, hd, wallY, wallH, plaster);

  // Gable wall tops (triangular plaster mass in front and back)
  l.ridge(hx, hz, hw, hd, roofBaseY, ridgeY - roofBaseY, 'z', plaster);

  // Timber framing: corner posts
  const postSize = 0.026;
  const postInset = postSize / 2 - 0.004;
  for (const cx of [hx - hw / 2 + postInset, hx + hw / 2 - postInset]) {
    for (const cz of [hz - hd / 2 + postInset, hz + hd / 2 - postInset]) {
      l.block(cx, cz, postSize, postSize, wallY, wallH, timber);
    }
  }

  // Horizontal timber plates (plinth sill and wall plate under eaves)
  l.block(hx, hz + hd / 2 - 0.005, hw, 0.02, wallY, 0.022, timber);
  l.block(hx, hz + hd / 2 - 0.005, hw, 0.02, roofBaseY - 0.018, 0.022, timber);
  l.block(hx + hw / 2 - 0.005, hz, 0.02, hd, wallY, 0.022, timber);
  l.block(hx + hw / 2 - 0.005, hz, 0.02, hd, roofBaseY - 0.018, 0.022, timber);
  l.block(hx - hw / 2 + 0.005, hz, 0.02, hd, wallY, 0.022, timber);
  l.block(hx - hw / 2 + 0.005, hz, 0.02, hd, roofBaseY - 0.018, 0.022, timber);

  // Front gable timber framing (diagonal braces and vertical studs)
  const fz = hz + hd / 2 + 0.002;
  l.beam([hx - 0.18, wallY + 0.02, fz], [hx - 0.07, roofBaseY - 0.02, fz], 0.022, timber);
  l.beam([hx + 0.18, wallY + 0.02, fz], [hx + 0.07, roofBaseY - 0.02, fz], 0.022, timber);
  // Upper gable vertical stud & diagonal struts
  l.beam([hx, roofBaseY, fz], [hx, ridgeY - 0.03, fz], 0.024, timber);
  l.beam([hx - 0.14, roofBaseY, fz], [hx - 0.05, roofBaseY + 0.18, fz], 0.02, timber);
  l.beam([hx + 0.14, roofBaseY, fz], [hx + 0.05, roofBaseY + 0.18, fz], 0.02, timber);

  // Side (+X) wall middle studs
  l.block(hx + hw / 2 + 0.002, hz - 0.02, 0.02, 0.026, wallY, wallH, timber);
  l.beam(
    [hx + hw / 2 + 0.002, wallY + 0.02, hz - 0.22],
    [hx + hw / 2 + 0.002, roofBaseY - 0.02, hz - 0.08],
    0.02,
    timber,
  );
  l.beam(
    [hx + hw / 2 + 0.002, wallY + 0.02, hz + 0.22],
    [hx + hw / 2 + 0.002, roofBaseY - 0.02, hz + 0.08],
    0.02,
    timber,
  );

  // 4. Steep terracotta tile roof with distinct courses
  const roofDepth = hd + 0.06;
  const roofSpan = 0.26; // half-span on each side of ridge

  // Exposed rafter tails under eaves
  for (let i = 0; i < 7; i++) {
    const rz = hz - roofDepth / 2 + 0.04 + i * 0.085;
    l.block(hx + roofSpan + 0.015, rz, 0.04, 0.024, roofBaseY - 0.012, 0.02, timber);
    l.block(hx - roofSpan - 0.015, rz, 0.04, 0.024, roofBaseY - 0.012, 0.02, timber);
  }
  // Wooden eave fascia beams
  l.block(hx + roofSpan + 0.02, hz, 0.018, roofDepth, roofBaseY - 0.008, 0.026, timberDark);
  l.block(hx - roofSpan - 0.02, hz, 0.018, roofDepth, roofBaseY - 0.008, 0.026, timberDark);

  // Stepped horizontal terracotta courses on +X (front-right) slope
  // Course 0 (eave overhang)
  l.block(hx + 0.245, hz, 0.052, roofDepth, roofBaseY + 0.005, 0.072, roofOrangeEave);
  // Course 1
  l.block(hx + 0.205, hz, 0.052, roofDepth, roofBaseY + 0.07, 0.072, roofOrange1);
  // Course 2
  l.block(hx + 0.165, hz, 0.052, roofDepth, roofBaseY + 0.135, 0.072, roofOrange2);
  // Course 3
  l.block(hx + 0.125, hz, 0.052, roofDepth, roofBaseY + 0.2, 0.072, roofOrange3);
  // Course 4
  l.block(hx + 0.085, hz, 0.052, roofDepth, roofBaseY + 0.265, 0.072, roofOrange4);
  // Course 5 (near ridge)
  l.block(hx + 0.045, hz, 0.045, roofDepth, roofBaseY + 0.33, 0.065, roofOrangeRidge);

  // Symmetric tile courses on -X (back-left) slope
  l.block(hx - 0.245, hz, 0.052, roofDepth, roofBaseY + 0.005, 0.072, roofOrangeEave);
  l.block(hx - 0.205, hz, 0.052, roofDepth, roofBaseY + 0.07, 0.072, roofOrange1);
  l.block(hx - 0.165, hz, 0.052, roofDepth, roofBaseY + 0.135, 0.072, roofOrange2);
  l.block(hx - 0.125, hz, 0.052, roofDepth, roofBaseY + 0.2, 0.072, roofOrange3);
  l.block(hx - 0.085, hz, 0.052, roofDepth, roofBaseY + 0.265, 0.072, roofOrange4);
  l.block(hx - 0.045, hz, 0.045, roofDepth, roofBaseY + 0.33, 0.065, roofOrangeRidge);

  // Prominent carved ridge beam extending beyond the gable ends
  l.block(hx, hz, 0.046, roofDepth + 0.07, ridgeY - 0.015, 0.046, timber);
  // Stepped terracotta ridge crest cap
  l.block(hx, hz, 0.068, roofDepth + 0.03, ridgeY + 0.015, 0.024, roofCrest);
  l.block(hx, hz, 0.042, roofDepth + 0.02, ridgeY + 0.032, 0.018, roofOrangeRidge);

  // Thick wooden bargeboards along the front and back gables
  const bargeFz = hz + hd / 2 + 0.018;
  l.beam([hx - roofSpan - 0.02, roofBaseY, bargeFz], [hx, ridgeY + 0.03, bargeFz], 0.034, timber);
  l.beam([hx + roofSpan + 0.02, roofBaseY, bargeFz], [hx, ridgeY + 0.03, bargeFz], 0.034, timber);
  const bargeBz = hz - hd / 2 - 0.018;
  l.beam([hx - roofSpan - 0.02, roofBaseY, bargeBz], [hx, ridgeY + 0.03, bargeBz], 0.034, timber);
  l.beam([hx + roofSpan + 0.02, roofBaseY, bargeBz], [hx, ridgeY + 0.03, bargeBz], 0.034, timber);

  // 5. Distinct Dormer on the +X roof slope
  const dormerX = hx + 0.155;
  const dormerZ = hz + 0.04;
  const dormerW = 0.16;
  const dormerD = 0.14;
  const dormerY = roofBaseY + 0.14;
  const dormerH = 0.16;

  // Dormer wall structure
  l.block(dormerX, dormerZ, dormerW, dormerD, dormerY, dormerH, plaster);
  l.block(dormerX + dormerW / 2, dormerZ, 0.022, dormerD, dormerY, dormerH, timber);
  // Dormer window facing +X
  const dormerWinX = dormerX + dormerW / 2 + 0.012;
  l.block(dormerWinX, dormerZ, 0.018, 0.076, dormerY + 0.035, 0.082, windowLit, 1);
  // Window frame & mullions
  l.block(dormerWinX + 0.002, dormerZ, 0.02, 0.084, dormerY + 0.03, 0.012, timberDark);
  l.block(dormerWinX + 0.002, dormerZ, 0.02, 0.084, dormerY + 0.115, 0.012, timberDark);
  l.block(dormerWinX + 0.002, dormerZ, 0.02, 0.012, dormerY + 0.035, 0.082, timberDark);
  // Dormer flower box
  l.block(dormerWinX + 0.016, dormerZ, 0.028, 0.094, dormerY + 0.012, 0.026, timber);
  l.block(dormerWinX + 0.018, dormerZ - 0.025, 0.024, 0.03, dormerY + 0.034, 0.02, flowerYellow);
  l.block(dormerWinX + 0.018, dormerZ + 0.015, 0.024, 0.03, dormerY + 0.034, 0.02, flowerPink);
  l.block(dormerWinX + 0.018, dormerZ + 0.035, 0.024, 0.02, dormerY + 0.034, 0.016, flowerGreen);

  // Dormer roof (shingled pitched roof running along X)
  const dormerRoofY = dormerY + dormerH - 0.01;
  l.ridge(dormerX, dormerZ, dormerW + 0.04, dormerD + 0.04, dormerRoofY, 0.095, 'x', dormerShingle);
  // Dormer bargeboards
  l.beam(
    [dormerX + dormerW / 2 + 0.02, dormerRoofY, dormerZ - dormerD / 2 - 0.01],
    [dormerX + dormerW / 2 + 0.02, dormerRoofY + 0.095, dormerZ],
    0.022,
    timberDark,
  );
  l.beam(
    [dormerX + dormerW / 2 + 0.02, dormerRoofY, dormerZ + dormerD / 2 + 0.01],
    [dormerX + dormerW / 2 + 0.02, dormerRoofY + 0.095, dormerZ],
    0.022,
    timberDark,
  );

  // 6. Windows on ground floor (+X wall) and front gable (+Z wall)
  // Upper gable window (facing +Z)
  const winGableZ = hz + hd / 2 + 0.012;
  l.block(hx, winGableZ, 0.084, 0.018, roofBaseY + 0.11, 0.105, windowLit, 1);
  l.block(hx, winGableZ + 0.002, 0.092, 0.02, roofBaseY + 0.1, 0.014, timberDark);
  l.block(hx, winGableZ + 0.002, 0.092, 0.02, roofBaseY + 0.21, 0.014, timberDark);
  l.block(hx, winGableZ + 0.002, 0.012, 0.02, roofBaseY + 0.11, 0.105, timberDark);
  // Upper flower box
  l.block(hx, winGableZ + 0.016, 0.105, 0.03, roofBaseY + 0.08, 0.026, timber);
  l.block(hx - 0.03, winGableZ + 0.018, 0.032, 0.024, roofBaseY + 0.102, 0.018, flowerYellow);
  l.block(hx + 0.01, winGableZ + 0.018, 0.032, 0.024, roofBaseY + 0.102, 0.018, flowerPink);
  l.block(hx + 0.04, winGableZ + 0.018, 0.024, 0.024, roofBaseY + 0.102, 0.016, flowerWhite);

  // Ground floor windows on +X wall
  const winX = hx + hw / 2 + 0.012;
  for (const wz of [hz - 0.14, hz + 0.15]) {
    l.block(winX, wz, 0.018, 0.088, wallY + 0.065, 0.11, windowLit, 1);
    l.block(winX + 0.002, wz, 0.02, 0.096, wallY + 0.055, 0.014, timberDark);
    l.block(winX + 0.002, wz, 0.02, 0.096, wallY + 0.17, 0.014, timberDark);
    l.block(winX + 0.002, wz, 0.02, 0.012, wallY + 0.065, 0.11, timberDark);
    // Flower box with flowers
    l.block(winX + 0.016, wz, 0.03, 0.105, wallY + 0.035, 0.026, timber);
    l.block(winX + 0.018, wz - 0.03, 0.025, 0.032, wallY + 0.058, 0.02, flowerYellow);
    l.block(winX + 0.018, wz + 0.01, 0.025, 0.032, wallY + 0.058, 0.02, flowerPink);
    l.block(winX + 0.018, wz + 0.038, 0.025, 0.022, wallY + 0.058, 0.018, flowerWhite);
  }

  // The secondary elevations retain the same timber and inset glazing.
  const rearZ = hz - hd / 2 - 0.012;
  const westX = hx - hw / 2 - 0.012;
  l.block(hx, rearZ, hw, 0.023, roofBaseY - 0.018, 0.022, timber);
  l.block(hx, rearZ, 0.1, 0.022, wallY + 0.057, 0.123, timberDark);
  l.block(hx, rearZ - 0.005, 0.073, 0.016, wallY + 0.071, 0.096, windowLit, 1);
  l.block(westX, hz - 0.025, 0.025, 0.115, wallY + 0.057, 0.123, timberDark);
  l.block(westX - 0.006, hz - 0.025, 0.016, 0.088, wallY + 0.071, 0.096, windowLit, 1);
  l.beam([westX, wallY + 0.026, hz + 0.19], [westX, roofBaseY - 0.026, hz + 0.071], 0.019, timber);
  l.beam([hx - 0.16, wallY + 0.03, rearZ], [hx - 0.075, roofBaseY - 0.024, rearZ], 0.02, timber);

  // 7. Covered Front Porch with Steps & Front Door
  const porchX = hx - 0.02;
  const doorZ = hz + hd / 2 + 0.008;

  // Wooden plank door
  l.block(porchX, doorZ, 0.09, 0.018, wallY, 0.18, timberDark);
  l.block(porchX, doorZ + 0.003, 0.105, 0.018, wallY + 0.175, 0.016, timber);
  l.block(porchX - 0.022, doorZ + 0.01, 0.012, 0.012, wallY + 0.085, 0.015, '#2e2b29'); // door knocker/handle

  // Porch deck (elevated wooden floor)
  const deckZ = hz + hd / 2 + 0.07;
  const deckW = 0.16;
  const deckD = 0.12;
  const deckY = wallY - 0.025; // 0.105
  l.block(porchX, deckZ, deckW, deckD, deckY, 0.026, '#866444');
  // Stone foundation block supporting porch deck
  l.block(porchX, deckZ, deckW - 0.02, deckD - 0.02, plinthY, deckY - plinthY, stonePlinth);

  // The stair treads descend from the deck to the path on a continuous footing.
  for (const [offset, height] of [
    [0.073, 0.074],
    [0.106, 0.05],
    [0.139, 0.026],
  ] as const) {
    l.block(porchX, deckZ + offset, deckW, 0.036, plinthY, height, '#76563a');
  }

  // Porch timber posts
  const postX1 = porchX - deckW / 2 + 0.016;
  const postX2 = porchX + deckW / 2 - 0.016;
  const postFrontZ = deckZ + deckD / 2 - 0.016;
  const porchRoofY = wallY + 0.2;
  l.block(postX1, postFrontZ, 0.024, 0.024, deckY + 0.02, porchRoofY - deckY, timber);
  l.block(postX2, postFrontZ, 0.024, 0.024, deckY + 0.02, porchRoofY - deckY, timber);

  // Porch gabled roof canopy
  l.ridge(porchX, deckZ + 0.01, deckW + 0.04, deckD + 0.05, porchRoofY, 0.085, 'z', roofOrangeEave);
  // Porch pediment truss
  l.beam(
    [postX1, porchRoofY, postFrontZ],
    [porchX, porchRoofY + 0.08, postFrontZ],
    0.022,
    timberDark,
  );
  l.beam(
    [postX2, porchRoofY, postFrontZ],
    [porchX, porchRoofY + 0.08, postFrontZ],
    0.022,
    timberDark,
  );

  // Wall lantern beside porch (facing +z)
  const lanternX = porchX - deckW / 2 - 0.045;
  const lanternZ = hz + hd / 2 + 0.025;
  l.block(lanternX, lanternZ, 0.014, 0.035, wallY + 0.13, 0.014, '#2f2c2a'); // bracket
  l.block(lanternX, lanternZ + 0.015, 0.034, 0.034, wallY + 0.08, 0.048, windowLit, 1); // warm glowing lantern body
  l.block(lanternX, lanternZ + 0.015, 0.042, 0.042, wallY + 0.125, 0.014, '#2f2c2a'); // cap

  // Climbing rose vine on right of porch
  const vineX = porchX + deckW / 2 + 0.035;
  const vineZ = hz + hd / 2 + 0.015;
  l.block(vineX, vineZ, 0.035, 0.025, wallY, 0.22, '#3b6a2b');
  l.block(vineX + 0.015, vineZ + 0.005, 0.022, 0.022, wallY + 0.06, 0.022, roseRed);
  l.block(vineX - 0.01, vineZ + 0.005, 0.022, 0.022, wallY + 0.12, 0.022, flowerPink);
  l.block(vineX + 0.01, vineZ + 0.005, 0.022, 0.022, wallY + 0.18, 0.022, roseRed);

  // Stone chimney with a projecting cap
  const chimX = hx;
  const chimZ = hz - hd / 2 + 0.08;
  const chimW = 0.105;
  const chimD = 0.105;
  const chimBaseY = roofBaseY + 0.22;
  const chimH = 0.32; // reaches y = 0.92

  l.block(chimX, chimZ, chimW, chimD, chimBaseY, chimH, stonePlinth);
  // Relief stone bands / courses on chimney
  l.block(chimX, chimZ, chimW + 0.015, chimD + 0.015, chimBaseY + 0.16, 0.025, stonePlinthLight);
  l.block(chimX, chimZ, chimW + 0.02, chimD + 0.02, chimBaseY + chimH - 0.028, 0.03, stonePlinth);
  l.block(chimX, chimZ, chimW - 0.02, chimD - 0.02, chimBaseY + chimH, 0.02, '#48443e');

  // 9. Fenced Vegetable Garden (in front-right yard)
  const gX1 = 0.56;
  const gX2 = 0.93;
  const gZ1 = 0.54;
  const gZ2 = 0.92;
  const postH = 0.095;
  const postThick = 0.022;

  // Fence posts
  for (const fx of [gX1, (gX1 + gX2) / 2, gX2]) {
    for (const fz of [gZ1, (gZ1 + gZ2) / 2, gZ2]) {
      // Don't put post inside house plinth area
      if (fx < hx + hw / 2 && fz < hz + hd / 2) continue;
      l.block(fx, fz, postThick, postThick, plinthY, postH, timber);
    }
  }

  // Horizontal rails along +Z side and +X side
  l.block((gX1 + gX2) / 2, gZ2, gX2 - gX1, 0.015, plinthY + 0.03, 0.014, timber);
  l.block((gX1 + gX2) / 2, gZ2, gX2 - gX1, 0.015, plinthY + 0.065, 0.014, timber);
  l.block(gX2, (gZ1 + gZ2) / 2, 0.015, gZ2 - gZ1, plinthY + 0.03, 0.014, timber);
  l.block(gX2, (gZ1 + gZ2) / 2, 0.015, gZ2 - gZ1, plinthY + 0.065, 0.014, timber);
  // Interior rail separating garden from front path
  l.block(gX1, (gZ1 + gZ2) / 2 + 0.04, 0.015, (gZ2 - gZ1) * 0.75, plinthY + 0.03, 0.014, timber);
  l.block(gX1, (gZ1 + gZ2) / 2 + 0.04, 0.015, (gZ2 - gZ1) * 0.75, plinthY + 0.065, 0.014, timber);

  // Garden soil bed
  const soilX = (gX1 + gX2) / 2 + 0.015;
  const soilZ = (gZ1 + gZ2) / 2 + 0.015;
  const soilW = gX2 - gX1 - 0.04;
  const soilD = gZ2 - gZ1 - 0.04;
  l.block(soilX, soilZ, soilW, soilD, plinthY, 0.016, soil);

  // Cabbage row (Row 1: furthest right, x ~ 0.85)
  for (let i = 0; i < 4; i++) {
    const cz = gZ1 + 0.06 + i * 0.085;
    l.round(0.85, cz, 0.024, 0.028, plinthY + 0.016, 0.028, cabbageOuter);
    l.round(0.85, cz, 0.014, 0.016, plinthY + 0.038, 0.016, cabbageHeart);
  }

  // Carrot row (Row 2: middle, x ~ 0.74)
  for (let i = 0; i < 4; i++) {
    const cz = gZ1 + 0.06 + i * 0.085;
    l.block(0.74, cz, 0.022, 0.022, plinthY + 0.016, 0.014, carrotOrange);
    l.block(0.74, cz, 0.036, 0.036, plinthY + 0.028, 0.026, carrotFoliage);
  }

  // Garden greens row (Row 3: inner, x ~ 0.64)
  for (let i = 0; i < 4; i++) {
    const cz = gZ1 + 0.06 + i * 0.085;
    l.block(0.64, cz, 0.03, 0.03, plinthY + 0.016, 0.024, cabbageOuter);
  }

  // Metal watering can near the garden fence
  l.round(0.58, gZ2 + 0.02, 0.018, 0.018, plinthY, 0.035, '#6a7e8a');
  l.block(0.58, gZ2 + 0.036, 0.008, 0.016, plinthY + 0.015, 0.025, '#566974'); // spout

  // 10. Stone Water Well (in front-left yard)
  const wellX = 0.19;
  const wellZ = 0.61;
  const wellWallH = 0.088;

  // Coping stones surround a visible water surface inside the basin.
  l.round(wellX, wellZ, 0.065, 0.065, plinthY, wellWallH - 0.021, stonePlinth);
  l.round(wellX, wellZ, 0.058, 0.058, plinthY + wellWallH - 0.022, 0.007, water);
  const rimY = plinthY + wellWallH - 0.01;
  for (let i = 0; i < 8; i++) {
    const start = (i * Math.PI) / 4;
    const end = ((i + 1) * Math.PI) / 4;
    l.beam(
      [wellX + 0.066 * Math.cos(start), rimY, wellZ + 0.066 * Math.sin(start)],
      [wellX + 0.066 * Math.cos(end), rimY, wellZ + 0.066 * Math.sin(end)],
      0.021,
      stonePlinthLight,
    );
  }

  // Well upright timber posts & crossbeam
  const wellPostH = 0.13;
  l.block(wellX - 0.055, wellZ, 0.018, 0.018, plinthY + wellWallH, wellPostH, timber);
  l.block(wellX + 0.055, wellZ, 0.018, 0.018, plinthY + wellWallH, wellPostH, timber);
  l.block(wellX, wellZ, 0.13, 0.018, plinthY + wellWallH + wellPostH - 0.012, 0.018, timber);

  // Well roof canopy (terracotta tiles running along X)
  const wellRoofY = plinthY + wellWallH + wellPostH;
  l.ridge(wellX, wellZ, 0.15, 0.15, wellRoofY, 0.065, 'x', roofOrangeEave);

  // Wooden water bucket on well curb
  l.round(wellX + 0.085, wellZ + 0.025, 0.022, 0.02, plinthY, 0.035, timberDark);
  l.block(wellX + 0.085, wellZ + 0.025, 0.008, 0.028, plinthY + 0.035, 0.015, '#757c82'); // handle

  // 11. Dirt & stone path leading to porch steps
  for (const [px, pz, pw, pd, col] of [
    [0.34, 0.93, 0.1, 0.06, '#b69b76'],
    [0.38, 0.88, 0.09, 0.06, '#a78b66'],
    [0.44, 0.88, 0.08, 0.05, '#88847a'], // stone stepping paver
    [0.3, 0.84, 0.09, 0.06, '#b69b76'],
    [0.26, 0.76, 0.08, 0.07, '#a78b66'],
    [0.24, 0.69, 0.08, 0.06, '#88847a'],
  ] as const) {
    l.block(px, pz, pw, pd, plinthY, 0.004, col);
  }

  // 12. Trees & wildflower patches
  l.tree(0.18, 0.24, 0.38, '#447535');
  l.tree(0.82, 0.23, 0.35, '#4e853e');

  // Wildflower dots in the lawn
  l.block(0.11, 0.78, 0.02, 0.02, plinthY, 0.015, flowerYellow);
  l.block(0.14, 0.82, 0.02, 0.02, plinthY, 0.015, flowerPink);
  l.block(0.32, 0.72, 0.02, 0.02, plinthY, 0.015, flowerWhite);
  l.block(0.36, 0.67, 0.02, 0.02, plinthY, 0.015, flowerYellow);
  l.block(0.85, 0.44, 0.02, 0.02, plinthY, 0.015, flowerYellow);
  l.block(0.88, 0.47, 0.02, 0.02, plinthY, 0.015, flowerPink);
}
