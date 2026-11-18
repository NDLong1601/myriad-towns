import { type Lot, type Recipes } from './lot';

const timber = '#856447';
const timberDark = '#3d2a19';
const oak = '#7d5a3b';
const steel = '#6e7b80';
const ironDark = '#32383b';
const brick = '#b5563c';
const brickDark = '#8c3f2b';
const slate = '#465866';
const windowWarm = '#f5be42';

/** Places glowing windows on all 4 sides (+Z, -Z, +X, -X) of a rectangular block. */
function surroundMineWindows(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
): void {
  // +Z and -Z sides (South and North)
  for (const sz of [-1, 1] as const) {
    l.block(hx, hz + sz * (hd / 2 + 0.004), 0.064, 0.014, y, h, windowWarm, 1);
  }
  // +X and -X sides (East and West)
  for (const sx of [-1, 1] as const) {
    l.block(hx + sx * (hw / 2 + 0.004), hz, 0.014, 0.064, y, h, windowWarm, 1);
  }
}

/** A simple ore cart block on a wooden rail section. */
function oreCart(l: Lot, x: number, z: number, y = 0.035): void {
  l.block(x, z, 0.14, 0.055, y, 0.014, oak); // rail sleepers
  l.block(x, z, 0.09, 0.07, y + 0.014, 0.07, '#7a7570'); // cart body
  l.block(x, z, 0.07, 0.06, y + 0.082, 0.016, timberDark); // cart rim
}

/** Brick or steel chimney column. */
function chimney(l: Lot, x: number, z: number, y: number, h: number, color = brick): void {
  l.round(x, z, 0.038, 0.048, y, h, color);
  l.round(x, z, 0.051, 0.044, y + h - 0.018, 0.028, '#252525'); // smoke cap
}

export const miningTiers: Recipes = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. quarry group (3 tiers: quarry < steam_quarry < industrial_quarry)
  // ─────────────────────────────────────────────────────────────────────────

  quarry(l) {
    // Low base so terrace at z=0.11 achieves delta > 0.3 against pit floor at z=0.89
    l.base('#9a8e82', 0.02);
    // Cut rock face at z=0.13: y_top = 0.02 + 0.335 = 0.355 (delta to 0.02 is 0.335 > 0.3)
    l.block(0.5, 0.13, 0.88, 0.22, 0.02, 0.335, '#9a9890');
    l.block(0.5, 0.25, 0.86, 0.14, 0.02, 0.22, '#88847c');
    // Rubble piles on open pit floor
    l.round(0.38, 0.52, 0.052, 0.088, 0.02, 0.08, '#9a9890');
    l.round(0.62, 0.6, 0.044, 0.072, 0.02, 0.065, '#aeaaa2');
    // Wooden crane tower: max height 0.36
    l.block(0.78, 0.25, 0.048, 0.048, 0.02, 0.34, timber);
    l.block(0.66, 0.25, 0.24, 0.034, 0.34, 0.02, timber);
    // Worker hut with ALL 4-sided windows
    l.block(0.24, 0.5, 0.22, 0.22, 0.02, 0.16, timber);
    surroundMineWindows(l, 0.24, 0.5, 0.22, 0.22, 0.06, 0.07);
    l.ridge(0.24, 0.5, 0.26, 0.26, 0.18, 0.1, 'x', '#5c3d24');
    // Ore carts on track
    oreCart(l, 0.5, 0.74, 0.02);
    oreCart(l, 0.64, 0.74, 0.02);
  },

  steam_quarry(l) {
    l.base('#a09585');
    // Two-tier stone terraces
    l.block(0.5, 0.48, 0.72, 0.62, 0.035, 0.08, '#9a9890');
    l.block(0.5, 0.44, 0.52, 0.42, 0.115, 0.08, '#888480');
    // Steam engine house (red brick, all 4 windows)
    l.block(0.26, 0.28, 0.33, 0.37, 0.035, 0.36, brick);
    surroundMineWindows(l, 0.26, 0.28, 0.33, 0.37, 0.16, 0.12);
    l.ridge(0.26, 0.28, 0.37, 0.41, 0.395, 0.15, 'x', brickDark);
    // Chimney: total height 0.035 + 0.64 = 0.675
    chimney(l, 0.14, 0.18, 0.035, 0.64);
    // Steam crane arm
    l.block(0.5, 0.26, 0.052, 0.052, 0.035, 0.48, '#76848a');
    l.block(0.38, 0.26, 0.24, 0.038, 0.48, 0.032, steel);
    // Large ore carts
    oreCart(l, 0.72, 0.68);
    oreCart(l, 0.72, 0.84);
    // Boiler drum
    l.round(0.4, 0.68, 0.055, 0.14, 0.035, 0.11, '#7a8880');
  },

  industrial_quarry(l) {
    l.base('#948f88');
    // Three-tier excavation
    l.block(0.5, 0.5, 0.86, 0.72, 0.035, 0.05, '#9a9890');
    l.block(0.5, 0.48, 0.66, 0.52, 0.085, 0.06, '#888480');
    l.block(0.5, 0.46, 0.46, 0.33, 0.145, 0.065, '#777470');
    // Stone crusher building (steel, all 4 windows)
    l.block(0.28, 0.27, 0.38, 0.4, 0.035, 0.58, steel);
    surroundMineWindows(l, 0.28, 0.27, 0.38, 0.4, 0.22, 0.16);
    surroundMineWindows(l, 0.28, 0.27, 0.38, 0.4, 0.44, 0.14);
    l.block(0.28, 0.27, 0.42, 0.44, 0.615, 0.035, '#4e5c62');
    // Crusher hopper on top
    l.block(0.28, 0.27, 0.19, 0.19, 0.65, 0.18, '#5a6870');
    // Conveyors / belt structure
    l.beam([0.44, 0.07, 0.3], [0.72, 0.42, 0.68], 0.072, '#5a6264');
    // Silos
    l.round(0.75, 0.3, 0.072, 0.09, 0.035, 0.72, '#7a8486');
    l.round(0.82, 0.55, 0.055, 0.072, 0.035, 0.52, '#7a8486');
    // Chimney stacks: total height 0.035 + 0.92 = 0.955
    chimney(l, 0.17, 0.5, 0.035, 0.92, steel);
    chimney(l, 0.17, 0.66, 0.035, 0.68, '#6e7b80');
    // Ore carts / truck platform
    l.block(0.72, 0.76, 0.26, 0.26, 0.035, 0.065, '#a09898');
    l.block(0.72, 0.76, 0.22, 0.14, 0.1, 0.08, '#5a5a5a');
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. clay_pit group (3 tiers: clay_pit < brick_works < industrial_brickyard)
  // ─────────────────────────────────────────────────────────────────────────

  clay_pit(l) {
    // Low base: 0.015
    l.base('#b08060', 0.015);
    // Recessed clay pit rim at x=0.9, z=0.48: height 0.165 + 0.015 = 0.18 (delta > 0.15)
    l.block(0.9, 0.48, 0.16, 0.62, 0.015, 0.17, '#b5764f');
    // Pit floor
    l.block(0.48, 0.48, 0.54, 0.52, 0.015, 0.01, '#9e6a44');
    // Clay mounds
    l.round(0.36, 0.4, 0.038, 0.07, 0.015, 0.05, '#b5764f');
    l.round(0.58, 0.6, 0.032, 0.055, 0.015, 0.04, '#c4845c');
    // Low wooden storage shelter: max height = 0.015 + 0.11 + 0.055 = 0.18
    l.block(0.22, 0.22, 0.22, 0.22, 0.015, 0.11, timber);
    surroundMineWindows(l, 0.22, 0.22, 0.22, 0.22, 0.055, 0.055);
    l.ridge(0.22, 0.22, 0.26, 0.26, 0.125, 0.055, 'z', '#5c3d24');
    // Ore carts on clay track
    oreCart(l, 0.52, 0.76, 0.015);
    oreCart(l, 0.68, 0.76, 0.015);
    // Drying racks
    l.block(0.74, 0.24, 0.034, 0.2, 0.015, 0.09, timber);
  },

  brick_works(l) {
    l.base('#a87050');
    // Open clay area
    l.block(0.72, 0.62, 0.38, 0.38, 0.035, 0.016, '#a06040');
    // Brick kiln (round)
    l.round(0.68, 0.33, 0.13, 0.13, 0.035, 0.32, brick);
    l.round(0.68, 0.33, 0.09, 0.09, 0.355, 0.06, brickDark);
    // Chimney on kiln: total height = 0.035 + 0.55 = 0.585
    chimney(l, 0.68, 0.33, 0.415, 0.17, brickDark);
    // Fire glow inside kiln
    l.round(0.68, 0.33, 0.065, 0.065, 0.08, 0.08, '#f76b20', 1);
    // Admin office (all 4 windows)
    l.block(0.26, 0.28, 0.33, 0.37, 0.035, 0.3, brick);
    surroundMineWindows(l, 0.26, 0.28, 0.33, 0.37, 0.13, 0.1);
    l.ridge(0.26, 0.28, 0.37, 0.41, 0.335, 0.14, 'z', brickDark);
    // Stacked raw bricks
    l.block(0.52, 0.72, 0.18, 0.14, 0.035, 0.11, '#b5764f');
    l.block(0.72, 0.72, 0.18, 0.14, 0.035, 0.085, '#c4845c');
  },

  industrial_brickyard(l) {
    l.base('#9a6040');
    // Open yard
    l.block(0.5, 0.56, 0.72, 0.62, 0.035, 0.016, '#8c5030');
    // Hoffman kiln
    l.block(0.52, 0.52, 0.52, 0.42, 0.035, 0.28, brickDark);
    l.block(0.52, 0.52, 0.42, 0.52, 0.035, 0.28, brickDark);
    // Kiln tunnel openings (glow)
    for (const side of [-1, 1] as const) {
      l.block(0.52 + side * 0.22, 0.52, 0.06, 0.06, 0.035, 0.18, '#f76b20', 1);
      l.block(0.52, 0.52 + side * 0.22, 0.06, 0.06, 0.035, 0.18, '#f76b20', 1);
    }
    // Factory main building (all 4 windows)
    l.block(0.26, 0.26, 0.37, 0.4, 0.035, 0.56, brickDark);
    surroundMineWindows(l, 0.26, 0.26, 0.37, 0.4, 0.18, 0.14);
    surroundMineWindows(l, 0.26, 0.26, 0.37, 0.4, 0.4, 0.14);
    l.ridge(0.26, 0.26, 0.41, 0.44, 0.595, 0.18, 'x', '#5c2a1a');
    // Multiple chimneys: main chimney total height = 0.035 + 0.92 = 0.955 (> 0.585)
    chimney(l, 0.14, 0.14, 0.035, 0.92, brickDark);
    chimney(l, 0.14, 0.33, 0.035, 0.72, brickDark);
    // Conveyor belt to stacking area
    l.beam([0.6, 0.07, 0.3], [0.8, 0.28, 0.72], 0.07, '#5a4030');
    // Finished brick stacks
    l.block(0.75, 0.75, 0.22, 0.22, 0.035, 0.1, '#c85a32');
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. iron_mine group (3 tiers: iron_mine < shaft_iron_mine < deep_iron_mine)
  // ─────────────────────────────────────────────────────────────────────────

  iron_mine(l) {
    l.base('#706e78');
    // Open-cut mine floor
    l.block(0.5, 0.5, 0.52, 0.52, 0.035, 0.016, '#5e5c64');
    // Ore rubble
    l.round(0.4, 0.4, 0.052, 0.09, 0.035, 0.08, '#6d6a70');
    l.round(0.6, 0.56, 0.038, 0.072, 0.035, 0.064, '#7c7880');
    // Headframe tower: total height = 0.035 + 0.79 = 0.825
    // Satisfies: 0.825 > 2 * quarry (2 * 0.36 = 0.72) and > 4 * clay (4 * 0.18 = 0.72)
    l.block(0.48, 0.44, 0.065, 0.065, 0.035, 0.765, '#485258');
    l.block(0.48, 0.44, 0.07, 0.07, 0.8, 0.025, '#2e353a');
    l.beam([0.34, 0.05, 0.32], [0.48, 0.74, 0.44], 0.048, '#3e4850');
    l.beam([0.62, 0.05, 0.32], [0.48, 0.74, 0.44], 0.048, '#3e4850');
    // Wooden mine entrance portal
    l.block(0.5, 0.22, 0.19, 0.038, 0.035, 0.24, timber);
    l.block(0.5, 0.22, 0.19, 0.016, 0.24, 0.08, timberDark);
    // Worker hut with all 4-sided windows
    l.block(0.78, 0.74, 0.24, 0.24, 0.035, 0.18, timber);
    surroundMineWindows(l, 0.78, 0.74, 0.24, 0.24, 0.08, 0.08);
    l.ridge(0.78, 0.74, 0.28, 0.28, 0.215, 0.1, 'x', '#5c3d24');
    // Ore carts
    oreCart(l, 0.5, 0.72);
    oreCart(l, 0.36, 0.72);
    // Iron ore pile
    l.round(0.78, 0.33, 0.044, 0.09, 0.035, 0.07, '#6d6a70');
  },

  shaft_iron_mine(l) {
    l.base('#606876');
    // Mine surface
    l.block(0.5, 0.5, 0.78, 0.68, 0.035, 0.016, '#505860');
    // Headframe tower: total height = 0.035 + 0.98 = 1.015 (> 0.825)
    l.block(0.38, 0.28, 0.062, 0.062, 0.035, 0.95, slate);
    l.block(0.38, 0.28, 0.068, 0.068, 0.985, 0.03, '#33414d');
    l.beam([0.34, 0.07, 0.25], [0.42, 0.65, 0.31], 0.04, '#3a4850');
    l.beam([0.42, 0.07, 0.31], [0.34, 0.65, 0.25], 0.04, '#3a4850');
    // Winding house / engine room (all 4 windows)
    l.block(0.26, 0.6, 0.35, 0.44, 0.035, 0.44, brick);
    surroundMineWindows(l, 0.26, 0.6, 0.35, 0.44, 0.17, 0.14);
    l.ridge(0.26, 0.6, 0.39, 0.48, 0.473, 0.19, 'z', brickDark);
    // Chimney
    chimney(l, 0.14, 0.76, 0.035, 0.72, brick);
    // Ore carts on surface
    oreCart(l, 0.64, 0.56);
    oreCart(l, 0.78, 0.56);
  },

  deep_iron_mine(l) {
    l.base('#545c66');
    // Industrial surface
    l.block(0.5, 0.5, 0.88, 0.76, 0.035, 0.016, '#484e56');
    // Large steel headframe: total height = 0.035 + 1.22 = 1.255 (> 1.015 and <= 1.4)
    l.block(0.38, 0.28, 0.06, 0.06, 0.035, 1.19, ironDark);
    l.block(0.38, 0.28, 0.065, 0.065, 1.225, 0.03, '#20262a');
    l.beam([0.34, 0.07, 0.25], [0.43, 0.65, 0.31], 0.044, '#28303a');
    l.beam([0.43, 0.07, 0.31], [0.34, 0.65, 0.25], 0.044, '#28303a');
    // Processing building (all 4 windows)
    l.block(0.26, 0.58, 0.37, 0.52, 0.035, 0.68, ironDark);
    surroundMineWindows(l, 0.26, 0.58, 0.37, 0.52, 0.22, 0.16);
    surroundMineWindows(l, 0.26, 0.58, 0.37, 0.52, 0.48, 0.16);
    l.block(0.26, 0.58, 0.41, 0.56, 0.714, 0.038, '#1e2628');
    // Multiple chimneys
    chimney(l, 0.14, 0.42, 0.035, 0.88, steel);
    // Ore processing / separator (all 4 windows)
    l.block(0.72, 0.72, 0.28, 0.32, 0.035, 0.52, steel);
    surroundMineWindows(l, 0.72, 0.72, 0.28, 0.32, 0.18, 0.14);
    l.block(0.72, 0.72, 0.3, 0.34, 0.549, 0.038, '#4e5c62');
    // Ore carts on steel rails
    oreCart(l, 0.56, 0.74);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. rail_track group (2 tiers: rail_track < iron_rail_track)
  // ─────────────────────────────────────────────────────────────────────────

  rail_track(l) {
    l.base('#7a7060');
    // Wooden sleepers (ties) across lot
    for (let i = 0; i < 7; i++) {
      const z = 0.1 + i * 0.12;
      l.block(0.5, z, 0.68, 0.052, 0.035, 0.03, oak);
    }
    // Two wooden rails running lengthwise
    for (const sx of [-1, 1] as const) {
      l.block(0.5 + sx * 0.16, 0.5, 0.052, 0.86, 0.065, 0.025, '#6b5a40');
    }
    // Trackman watch shanty with all 4-sided windows: max height = 0.035 + 0.15 + 0.06 = 0.245
    l.block(0.2, 0.2, 0.18, 0.18, 0.035, 0.15, timber);
    surroundMineWindows(l, 0.2, 0.2, 0.18, 0.18, 0.07, 0.07);
    l.ridge(0.2, 0.2, 0.22, 0.22, 0.185, 0.06, 'x', timberDark);
    // Corner marker posts
    for (const x of [0.14, 0.86] as const) {
      for (const z of [0.14, 0.86] as const) {
        if (x === 0.14 && z === 0.14) continue;
        l.block(x, z, 0.028, 0.028, 0.035, 0.09, timber);
      }
    }
  },

  iron_rail_track(l) {
    l.base('#706a60');
    // Oak sleepers (ties) — denser than wooden tier
    for (let i = 0; i < 9; i++) {
      const z = 0.07 + i * 0.097;
      l.block(0.5, z, 0.74, 0.056, 0.035, 0.028, oak);
    }
    // Iron rails — two flat bars running lengthwise
    for (const sx of [-1, 1] as const) {
      l.block(0.5 + sx * 0.17, 0.5, 0.044, 0.9, 0.063, 0.028, '#4a4a52');
      l.block(0.5 + sx * 0.17, 0.5, 0.028, 0.9, 0.09, 0.012, '#5a5a62');
    }
    // Switchman signal cabin with all 4-sided windows: max height = 0.035 + 0.22 + 0.1 = 0.355 (> 0.245)
    l.block(0.2, 0.2, 0.2, 0.2, 0.035, 0.22, brick);
    surroundMineWindows(l, 0.2, 0.2, 0.2, 0.2, 0.1, 0.09);
    l.ridge(0.2, 0.2, 0.24, 0.24, 0.255, 0.1, 'z', slate);
    // Junction / switch lever post at one end
    l.block(0.5, 0.1, 0.028, 0.028, 0.035, 0.14, steel);
    l.block(0.5, 0.1, 0.11, 0.014, 0.17, 0.014, steel);
    // Corner marker posts
    for (const x of [0.1, 0.9] as const) {
      for (const z of [0.1, 0.9] as const) {
        if (x === 0.1 && z === 0.1) continue;
        l.block(x, z, 0.026, 0.026, 0.035, 0.1, steel);
      }
    }
  },
};
