import { cottage } from './cottage';
import { type Lot, type Recipes } from './lot';

const grass = '#729953';
const wood = '#765740';
const stone = '#a09d8a';

function stiltHome(l: Lot, cottage: boolean): void {
  const deck = cottage ? 0.22 : 0.16;
  l.block(0.5, 0.5, 0.93, 0.76, deck, 0.075, '#99754f');
  for (const x of [0.14, 0.86]) {
    for (const z of [0.21, 0.76]) l.block(x, z, 0.066, 0.066, 0, deck, wood);
    l.block(x, 0.86, 0.05, 0.045, deck + 0.07, 0.12, wood);
  }
  if (cottage) {
    l.roofed(0.48, 0.39, 0.58, 0.44, deck + 0.075, 0.36, 'x');
    l.windows(0.51, 0.618, 0.43, deck + 0.22, 0.11, 2);
    l.beam([0.2, deck + 0.17, 0.86], [0.8, deck + 0.17, 0.86], 0.038, wood);
  } else {
    l.roofed(0.4, 0.4, 0.55, 0.47, deck + 0.075, 0.29, 'z');
    l.block(0.75, 0.54, 0.17, 0.13, deck + 0.075, 0.085, '#686a55');
  }
  l.block(0.53, 0.925, 0.26, 0.12, 0.015, deck * 0.64, '#876a4e');
}

function rowHouses(l: Lot, terrace: boolean): void {
  l.base('#929077');
  const wallHeight = l.height * 0.68;
  for (const x of [0.26, 0.74]) {
    l.block(x, 0.52, 0.43, 0.61, 0.035, wallHeight);
    if (terrace) {
      l.block(x, 0.52, 0.45, 0.65, wallHeight, 0.1, l.roof);
      l.block(x + 0.045, 0.45, 0.23, 0.43, wallHeight + 0.085, 0.25, '#d9c3a0');
      l.block(x, 0.854, 0.3, 0.07, wallHeight * 0.61, 0.1, '#c9bca3');
    } else {
      l.ridge(x, 0.52, 0.455, 0.67, wallHeight + 0.02, 0.4, 'z');
      l.block(x + 0.12, 0.49, 0.07, 0.14, wallHeight + 0.1, 0.34, '#874f41');
    }
    l.windows(x, 0.829, 0.39, wallHeight * 0.62, 0.15, 2);
    l.windows(x, 0.829, 0.37, wallHeight * 0.3, 0.15, 2);
    l.block(x, 0.85, 0.115, 0.07, 0.04, 0.22, wood);
    for (const z of [0.907, 0.942, 0.973]) l.block(x, z, 0.15, 0.024, 0.035, 0.033, '#c2b29a');
    l.block(x - 0.133, 0.867, 0.067, 0.057, 0.036, 0.071, '#9c7355');
  }
}

export const housing: Recipes = {
  hut(l) {
    l.base(grass);
    l.round(0.43, 0.44, 0.26, 0.28, 0.035, 0.24);
    l.round(0.43, 0.44, 0.054, 0.36, 0.26, 0.32, '#aa8551');
    l.block(0.44, 0.7, 0.14, 0.095, 0.035, 0.18, '#634531');
    l.windows(0.59, 0.649, 0.13, 0.14, 0.072, 1);
    l.block(0.68, 0.78, 0.17, 0.11, 0.035, 0.08, '#988566');
  },
  cottage,
  townhouse(l) {
    l.base('#9c9c89');
    l.block(0.5, 0.42, 0.6, 0.67, 0.05, 1.18);
    l.mansard(0.5, 0.42, 0.68, 0.75, 1.22, 0.45);
    l.block(0.52, 0.79, 0.42, 0.13, 0.075, 0.44, '#d2baa1');
    l.block(0.46, 0.865, 0.15, 0.05, 0.09, 0.29, wood);
    for (const y of [0.58, 0.94]) l.windows(0.5, 0.759, 0.54, y, 0.17, 2);
  },
  villa(l) {
    l.base('#779b62');
    l.roofed(0.5, 0.23, 0.82, 0.33, 0.05, 0.55);
    for (const x of [0.21, 0.79]) l.roofed(x, 0.54, 0.23, 0.41, 0.05, 0.39, 'z', '#dfd0b4');
    l.block(0.5, 0.56, 0.3, 0.31, 0.043, 0.038, '#bdb395');
    l.block(0.5, 0.57, 0.22, 0.23, 0.079, 0.012, '#619fac');
    l.tree(0.77, 0.84, 0.42);
    l.tree(0.22, 0.85, 0.44);
  },
  fisher_hut: (l) => stiltHome(l, false),
  fisher_cottage: (l) => stiltHome(l, true),
  yurt(l) {
    l.round(0.5, 0.49, 0.37, 0.38, 0.014, 0.21, '#d5c0a0');
    l.round(0.5, 0.49, 0.38, 0.38, 0.1, 0.055, '#976653');
    l.round(0.5, 0.49, 0.115, 0.4, 0.22, 0.16, '#e2d1ab');
    l.round(0.5, 0.49, 0.095, 0.115, 0.38, 0.05, '#a06b55');
    l.block(0.5, 0.85, 0.19, 0.14, 0.02, 0.2, wood);
  },
  log_cabin(l) {
    l.base('#c1ccca');
    l.block(0.49, 0.4, 0.66, 0.54, 0.035, 0.36, '#8e6650');
    for (const y of [0.1, 0.2, 0.3]) l.block(0.49, 0.4, 0.72, 0.59, y, 0.045, '#9e775c');
    l.ridge(0.49, 0.42, 0.84, 0.74, 0.38, 0.37, 'x', '#5d625d');
    l.ridge(0.49, 0.42, 0.84, 0.65, 0.43, 0.35, 'x', '#e1e9e4');
    l.block(0.52, 0.79, 0.28, 0.2, 0.035, 0.077, wood);
    l.windows(0.37, 0.701, 0.18, 0.19, 0.1, 1);
  },
  mountain_hut(l) {
    l.block(0.52, 0.51, 0.68, 0.7, 0.01, 0.16, stone);
    l.ridge(0.52, 0.51, 0.89, 0.78, 0.16, 0.62, 'z', '#6e594f');
    l.ridge(0.52, 0.84, 0.65, 0.07, 0.16, 0.41, 'z', '#bb9b76');
    l.block(0.52, 0.879, 0.14, 0.05, 0.085, 0.21, '#664732');
    l.block(0.17, 0.31, 0.13, 0.11, 0.13, 0.52, '#807d75');
  },
  miner_cottage(l) {
    l.base('#878579');
    l.roofed(0.47, 0.42, 0.7, 0.51, 0.04, 0.35, 'x', '#9c9185', '#585457');
    l.block(0.2, 0.39, 0.14, 0.17, 0.32, 0.4, '#706a63');
    l.windows(0.43, 0.682, 0.47, 0.2, 0.11, 2);
    l.block(0.69, 0.78, 0.28, 0.2, 0.038, 0.16, '#66676b');
    l.block(0.68, 0.78, 0.22, 0.15, 0.19, 0.045, '#43484a');
  },
  lumberjack_cottage(l) {
    l.base('#6b8d54');
    l.roofed(0.39, 0.43, 0.54, 0.66, 0.055, 0.36, 'z', '#946746', '#594a3f');
    l.block(0.71, 0.54, 0.27, 0.45, 0.33, 0.09, '#8b7259');
    for (const z of [0.36, 0.71]) l.block(0.82, z, 0.06, 0.06, 0.04, 0.3, wood);
    for (const x of [0.66, 0.76, 0.85]) l.block(x, 0.51, 0.06, 0.24, 0.035, 0.1, '#a78257');
    l.windows(0.35, 0.764, 0.35, 0.21, 0.115, 1);
  },
  artisan_row_east: (l) => rowHouses(l, false),
  artisan_row_south: (l) => rowHouses(l, false),
  terrace_residence_east: (l) => rowHouses(l, true),
  terrace_residence_south: (l) => rowHouses(l, true),
  garden_court(l) {
    l.base(grass);
    l.roofed(0.49, 0.22, 0.78, 0.29, 0.05, 0.88);
    for (const x of [0.2, 0.78]) l.roofed(x, 0.57, 0.22, 0.56, 0.05, 0.67, 'z', '#cfc5a0');
    l.block(0.48, 0.8, 0.3, 0.21, 0.035, 0.02, '#ccba94');
    l.tree(0.43, 0.58, 0.7);
    l.tree(0.56, 0.68, 0.58);
    l.windows(0.5, 0.37, 0.57, 0.5, 0.19, 4);
  },
  civic_court(l) {
    l.base('#939384');
    l.block(0.5, 0.28, 0.8, 0.35, 0.05, 1.42);
    l.block(0.5, 0.285, 0.76, 0.34, 1.47, 0.14, l.roof);
    for (const x of [0.19, 0.8]) {
      l.block(x, 0.55, 0.29, 0.52, 0.05, 1.88, '#d8bf9e');
      l.block(x, 0.55, 0.32, 0.55, 1.93, 0.14, l.roof);
      l.windows(x, 0.813, 0.24, 1.36, 0.22, 2);
      l.windows(x, 0.813, 0.24, 0.8, 0.22, 2);
    }
    l.block(0.5, 0.71, 0.3, 0.35, 0.039, 0.018, '#c3ad90');
    l.round(0.5, 0.63, 0.091, 0.116, 0.056, 0.085, '#e2c7a3');
    l.round(0.5, 0.63, 0.081, 0.081, 0.139, 0.012, '#77a9b0');
  },
  tenement(l) {
    l.base('#8d8d82');
    l.block(0.48, 0.43, 0.76, 0.61, 0.04, 1.44);
    l.block(0.48, 0.43, 0.83, 0.67, 1.47, 0.12, l.roof);
    l.block(0.28, 0.42, 0.18, 0.34, 1.59, 0.23, '#a29e8f');
    for (const y of [0.49, 0.86, 1.23]) {
      l.windows(0.49, 0.739, 0.61, y, 0.15, 3);
      l.block(0.48, 0.773, 0.49, 0.16, y - 0.08, 0.06, '#c5b697');
    }
  },
  apartment_tower(l) {
    l.base('#8b9a82');
    l.block(0.5, 0.45, 0.7, 0.57, 0.04, 2.12);
    l.block(0.38, 0.37, 0.28, 0.46, 2.16, 0.36, l.roof);
    for (const y of [0.51, 0.94, 1.37, 1.8]) {
      l.block(0.5, 0.52, 0.8, 0.63, y, 0.08, '#d9d4c4');
      l.windows(0.53, 0.74, 0.62, y + 0.1, 0.18, 4);
    }
    l.tree(0.23, 0.86, 0.55);
  },
  skyscraper(l) {
    l.base('#8f9995');
    l.block(0.52, 0.51, 0.86, 0.75, 0.04, 0.68, '#b9beb2');
    l.block(0.53, 0.44, 0.44, 0.52, 0.69, 3.2, '#608a9d');
    l.block(0.28, 0.46, 0.23, 0.32, 0.7, 2.36, '#8e9e9f');
    for (const x of [0.33, 0.52, 0.72]) l.block(x, 0.706, 0.035, 0.055, 0.72, 3.15, '#bcc5bc');
    for (const y of [1.1, 1.64, 2.18, 2.72, 3.26]) l.windows(0.53, 0.706, 0.38, y, 0.2, 2);
    l.block(0.53, 0.44, 0.5, 0.57, 3.89, 0.13, '#b9c2b8');
    l.block(0.65, 0.44, 0.023, 0.025, 4.0, 0.45, '#d9c4a0');
  },
};
