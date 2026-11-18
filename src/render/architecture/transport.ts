import { type Lot, type Recipes } from './lot';

const wood = '#99794f';
const timberDark = '#3d2a19';
const steel = '#718181';
const concrete = '#a4a396';
const windowWarm = '#f5be42';

function surroundCabinWindows(
  l: Lot,
  hx: number,
  hz: number,
  hw: number,
  hd: number,
  y: number,
  h: number,
  colsZ = 2,
  colsX = 2,
): void {
  const spanX = hw * 0.72;
  for (let i = 0; i < colsZ; i++) {
    const wx = hx + (colsZ === 1 ? 0 : ((i + 0.5) / colsZ - 0.5) * spanX);
    for (const sz of [-1, 1] as const) {
      l.block(wx, hz + sz * (hd / 2 + 0.004), 0.064, 0.014, y, h, windowWarm, 1);
      l.block(wx, hz + sz * (hd / 2 + 0.002), 0.076, 0.018, y - 0.006, h + 0.012, timberDark);
    }
  }
  const spanZ = hd * 0.72;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    for (const sx of [-1, 1] as const) {
      l.block(hx + sx * (hw / 2 + 0.004), wz, 0.014, 0.064, y, h, windowWarm, 1);
      l.block(hx + sx * (hw / 2 + 0.002), wz, 0.018, 0.076, y - 0.006, h + 0.012, timberDark);
    }
  }
}

export const transport: Recipes = {
  fishing_dock(l) {
    l.block(0.42, 0.51, 0.65, 0.94, 0.1, 0.095, wood);
    l.roofed(0.32, 0.26, 0.31, 0.3, 0.195, 0.26, 'z', '#a48460');
    surroundCabinWindows(l, 0.32, 0.26, 0.31, 0.3, 0.26, 0.11, 1, 1);
    for (const z of [0.4, 0.87]) l.block(0.74, z, 0.07, 0.085, 0, 0.27, '#6a5742');
    l.block(0.47, 0.7, 0.25, 0.19, 0.197, 0.092, '#74796c');
    l.block(0.14, 0.78, 0.042, 0.24, 0.195, 0.16, '#7f6648');
  },
  fishing_harbor(l) {
    l.block(0.51, 0.25, 0.91, 0.44, 0.12, 0.09, '#a1825e');
    for (const x of [0.24, 0.78]) {
      l.block(x, 0.67, 0.2, 0.61, 0.12, 0.09, wood);
      for (const z of [0.5, 0.88]) l.block(x + 0.08, z, 0.046, 0.045, 0, 0.29, '#80654d');
    }
    l.roofed(0.3, 0.24, 0.35, 0.28, 0.21, 0.34, 'x', '#b0a083');
    surroundCabinWindows(l, 0.3, 0.24, 0.35, 0.28, 0.3, 0.12, 2, 1);
    l.beam([0.57, 0.2, 0.34], [0.58, 0.73, 0.34], 0.075, '#74624c');
    l.beam([0.83, 0.2, 0.34], [0.82, 0.73, 0.34], 0.075, '#74624c');
    l.block(0.7, 0.34, 0.26, 0.032, 0.55, 0.067, '#7d6b51');
    l.block(0.7, 0.34, 0.19, 0.019, 0.36, 0.19, '#899288');
  },
  ice_fishery(l) {
    l.round(0.49, 0.49, 0.37, 0.45, 0.025, 0.11, '#c8d9d7');
    l.round(0.52, 0.65, 0.145, 0.156, 0.132, 0.013, '#4c798e');
    l.block(0.42, 0.28, 0.52, 0.28, 0.13, 0.2, '#8c7258');
    surroundCabinWindows(l, 0.42, 0.28, 0.52, 0.28, 0.18, 0.1, 2, 1);
    l.ridge(0.42, 0.28, 0.59, 0.33, 0.33, 0.22, 'z', '#b39e81');
    l.block(0.73, 0.47, 0.12, 0.19, 0.131, 0.1, wood);
    l.beam([0.71, 0.21, 0.52], [0.54, 0.36, 0.65], 0.032, '#7b6650');
  },
  ferry_pier(l) {
    l.block(0.5, 0.39, 0.93, 0.65, 0.12, 0.095, '#9a8867');
    l.block(0.52, 0.76, 0.39, 0.42, 0.12, 0.095, wood);
    l.block(0.55, 0.23, 0.62, 0.22, 0.2, 0.33, '#acb5a5');
    surroundCabinWindows(l, 0.55, 0.23, 0.62, 0.22, 0.28, 0.14, 3, 1);
    l.ridge(0.55, 0.32, 0.71, 0.41, 0.56, 0.21, 'x', '#539095');
    for (const x of [0.23, 0.84]) l.block(x, 0.5, 0.035, 0.056, 0.212, 0.36, steel);
    l.block(0.55, 0.47, 0.43, 0.08, 0.27, 0.08, '#b39a6d');
  },
  rail_station(l) {
    l.base(concrete);
    l.block(0.5, 0.29, 0.95, 0.31, 0.05, 0.12, '#bab29c');
    l.block(0.5, 0.36, 0.95, 0.038, 0.166, 0.016, '#d7bf72');
    l.block(0.5, 0.7, 0.98, 0.33, 0.04, 0.015, '#807a6f');
    for (const z of [0.65, 0.78]) l.block(0.5, z, 0.98, 0.027, 0.06, 0.036, '#b7b5a6');
    for (const x of [0.16, 0.39, 0.62, 0.84]) {
      l.block(x, 0.7, 0.037, 0.22, 0.057, 0.032, '#635a4d');
      l.block(x, 0.29, 0.032, 0.061, 0.166, 0.51, steel);
    }
    l.vaultedCanopy(0.5, 0.29, 0.89, 0.42, 0.68, 0.245);
    l.block(0.5, 0.24, 0.36, 0.18, 0.17, 0.34, '#a38261');
    surroundCabinWindows(l, 0.5, 0.24, 0.36, 0.18, 0.26, 0.14, 2, 1);
  },
  airfield(l) {
    l.base('#87996d');
    l.block(0.5, 0.53, 0.98, 0.31, 0.035, 0.06, '#697370');
    for (const x of [0.16, 0.34, 0.52, 0.7, 0.88])
      l.block(x, 0.53, 0.1, 0.015, 0.094, 0.009, '#ded8ba');
    l.block(0.28, 0.22, 0.42, 0.24, 0.042, 0.39, '#a8ac9e');
    surroundCabinWindows(l, 0.28, 0.22, 0.42, 0.24, 0.18, 0.14, 2, 2);
    l.dome(0.28, 0.22, 0.22, 0.127, 0.43, 0.3, '#8b9d94');
    l.block(0.28, 0.342, 0.29, 0.012, 0.05, 0.32, '#636e6b');
    l.block(0.74, 0.24, 0.097, 0.12, 0.04, 0.69, '#aaa99a');
    l.block(0.74, 0.24, 0.13, 0.16, 0.73, 0.24, '#779499');
    surroundCabinWindows(l, 0.74, 0.24, 0.13, 0.16, 0.78, 0.14, 1, 1);
    l.block(0.74, 0.24, 0.15, 0.18, 0.97, 0.06, '#c2beb1');
    l.block(0.75, 0.83, 0.19, 0.11, 0.042, 0.07, concrete);
  },
};
