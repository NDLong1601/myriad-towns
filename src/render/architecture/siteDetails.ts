import { type Lot, type Recipes } from './lot';

const brass = '#b5a16f';
const iron = '#535d5b';
const oak = '#876240';
const stone = '#b6aa91';

function paving(l: Lot, x: number, z: number, width: number, rows: number): void {
  for (let i = 0; i < rows; i++) {
    const step = z + i * 0.037;
    for (const offset of [-0.31, 0, 0.31])
      l.block(
        x + offset * width,
        step,
        width * 0.29,
        0.031,
        0.036,
        0.009,
        i % 2 ? '#aa9b80' : stone,
      );
  }
}

function crate(l: Lot, x: number, z: number, y = 0.04): void {
  l.block(x, z, 0.062, 0.071, y, 0.093, '#a88457');
  for (const edge of [-0.021, 0.021])
    l.block(x + edge, z + 0.002, 0.008, 0.077, y + 0.092, 0.01, '#c4a275');
}

function post(l: Lot, x: number, z: number, y = 0.04): void {
  l.block(x, z, 0.027, 0.028, y, 0.25, oak);
  l.block(x, z, 0.038, 0.039, y + 0.24, 0.025, brass);
}

function beds(l: Lot, x: number, z: number, width: number, color: string): void {
  l.block(x, z, width, 0.091, 0.036, 0.028, '#715942');
  for (const offset of [-0.34, -0.1, 0.13, 0.34])
    l.round(x + width * offset, z, 0.012, 0.024, 0.063, 0.04, color);
}

function curb(l: Lot, x: number, z: number, width: number, y: number): void {
  for (let i = 0; i < 5; i++)
    l.block(x + ((i + 0.5) / 5 - 0.5) * width, z, width * 0.182, 0.04, y, 0.035, stone);
}

export const siteDetails: Recipes = {
  community_classroom(l) {
    for (const x of [0.4, 0.58, 0.75]) l.block(x, 0.87, 0.115, 0.036, 0.052, 0.069, oak);
    post(l, 0.77, 0.54);
  },
  research_campus(l) {
    for (const z of [0.26, 0.44, 0.6]) l.block(0.77, z, 0.22, 0.024, 1.115, 0.044, brass);
    paving(l, 0.51, 0.85, 0.22, 3);
  },
  waterside_retreat(l) {
    for (const x of [0.2, 0.32, 0.44, 0.56, 0.68, 0.8])
      l.block(x, 0.73, 0.013, 0.26, 0.211, 0.01, '#775e47');
    for (const x of [0.16, 0.85]) post(l, x, 0.87, 0.21);
  },
  planted_grove(l) {
    for (const [x, z] of [
      [0.19, 0.19],
      [0.83, 0.22],
      [0.74, 0.83],
    ] as const)
      l.dome(x, z, 0.068, 0.075, 0.035, 0.103, '#748a4c');
  },
  herb_garden(l) {
    for (const x of [0.26, 0.7]) curb(l, x, 0.89, 0.34, 0.037);
    crate(l, 0.48, 0.13);
  },
  flower_garden(l) {
    for (const x of [0.33, 0.67]) post(l, x, 0.92);
    paving(l, 0.5, 0.09, 0.19, 5);
  },
  botanical_park(l) {
    for (const x of [0.34, 0.5, 0.66]) l.beam([x, 0.51, 0.645], [x, 0.78, 0.53], 0.027, '#c5c4ad');
    beds(l, 0.49, 0.9, 0.35, '#c49191');
  },
  woodcutter(l) {
    for (const z of [0.56, 0.65, 0.74]) l.block(0.68, z, 0.37, 0.018, 0.115, 0.022, '#d4ac77');
    crate(l, 0.42, 0.86);
  },
  forester(l) {
    for (const x of [0.55, 0.73, 0.89]) l.block(x, 0.87, 0.104, 0.026, 0.039, 0.06, oak);
    paving(l, 0.4, 0.8, 0.12, 4);
  },
  fur_trapper(l) {
    for (const x of [0.23, 0.34]) crate(l, x, 0.77);
    l.block(0.65, 0.75, 0.43, 0.047, 0.39, 0.027, oak);
  },
  hunting_lodge(l) {
    paving(l, 0.57, 0.83, 0.24, 4);
    l.block(0.57, 0.77, 0.13, 0.025, 0.39, 0.055, brass);
  },
  stone_cutter(l) {
    curb(l, 0.6, 0.88, 0.58, 0.037);
    l.block(0.34, 0.34, 0.045, 0.035, 0.3, 0.18, '#bcbab0');
  },
  gravel_pit(l) {
    for (const z of [0.8, 0.87]) l.block(0.31, z, 0.25, 0.039, 0.04, 0.048, '#a19c8d');
    post(l, 0.83, 0.76);
  },
  coal_mine(l) {
    for (const z of [0.52, 0.63, 0.74, 0.85]) l.block(0.357, z, 0.19, 0.026, 0.047, 0.014, oak);
    l.block(0.38, 0.455, 0.22, 0.04, 0.49, 0.042, brass);
  },
  scholar_camp(l) {
    for (const x of [0.39, 0.79]) l.block(x, 0.86, 0.09, 0.036, 0.049, 0.05, stone);
    crate(l, 0.26, 0.6);
  },
  craft_studio(l) {
    crate(l, 0.38, 0.78);
    crate(l, 0.49, 0.78);
    l.round(0.82, 0.82, 0.053, 0.065, 0.036, 0.123, '#a1866b');
  },
  foundry(l) {
    for (const z of [0.59, 0.66, 0.73]) l.block(0.49, z, 0.19, 0.033, 0.044, 0.061, '#949085');
    l.beam([0.82, 0.63, 0.26], [0.78, 0.92, 0.47], 0.04, brass);
  },
  steelworks(l) {
    for (const y of [0.22, 0.35, 0.48]) l.block(0.64, 0.791, 0.25, 0.014, y, 0.036, '#999388');
    curb(l, 0.62, 0.91, 0.59, 0.052);
  },
  factory(l) {
    for (const x of [0.28, 0.5, 0.72]) {
      l.block(x, 0.781, 0.17, 0.028, 0.051, 0.081, stone);
      l.block(x, 0.755, 0.12, 0.013, 0.24, 0.025, '#929990');
    }
  },
  power_plant(l) {
    for (const z of [0.72, 0.82]) l.block(0.32, z, 0.12, 0.062, 0.047, 0.11, iron);
    for (const y of [0.18, 0.25]) l.block(0.25, 0.85, 0.19, 0.026, y, 0.017, brass);
  },
  trading_post(l) {
    crate(l, 0.24, 0.83);
    crate(l, 0.34, 0.84);
    l.block(0.51, 0.711, 0.3, 0.021, 0.474, 0.068, brass);
  },
  pasture(l) {
    l.block(0.57, 0.79, 0.16, 0.084, 0.037, 0.042, oak);
    l.block(0.57, 0.79, 0.135, 0.061, 0.078, 0.009, '#83a3aa');
    for (const x of [0.19, 0.77]) l.block(x, 0.9, 0.17, 0.018, 0.093, 0.024, oak);
  },
  salt_pan(l) {
    for (const x of [0.26, 0.74])
      for (const z of [0.42, 0.83]) l.block(x, z, 0.31, 0.019, 0.09, 0.013, '#e8ddbe');
  },
  fishing_dock(l) {
    for (const z of [0.48, 0.56, 0.64, 0.75, 0.84, 0.92])
      l.block(0.43, z, 0.61, 0.012, 0.195, 0.008, '#71573b');
    crate(l, 0.29, 0.62, 0.195);
  },
  ice_fishery(l) {
    for (const x of [0.39, 0.57, 0.7]) l.block(x, 0.8, 0.09, 0.028, 0.135, 0.013, '#a7c5c8');
  },
  ferry_pier(l) {
    for (const z of [0.59, 0.68, 0.79, 0.88])
      l.block(0.52, z, 0.35, 0.014, 0.214, 0.011, '#746044');
    for (const x of [0.37, 0.67]) post(l, x, 0.93, 0.214);
  },
  airfield(l) {
    for (const x of [0.09, 0.3, 0.51, 0.72, 0.91])
      for (const z of [0.382, 0.678]) l.block(x, z, 0.019, 0.018, 0.096, 0.021, '#e7d37e', 0.5);
  },
};
