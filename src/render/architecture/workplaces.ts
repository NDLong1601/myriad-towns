import { type Lot, type Recipes } from './lot';
import { productionTiers } from './productionTiers';

const timber = '#856447';
const timberDark = '#3d2a19';
const windowWarm = '#f5be42';

function surroundWorkWindows(
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

export const workplaces: Recipes = {
  ...productionTiers,
  hunting_lodge(l) {
    l.base('#7f935c');
    l.roofed(0.47, 0.35, 0.72, 0.48, 0.055, 0.34, 'x', '#876247');
    surroundWorkWindows(l, 0.47, 0.35, 0.72, 0.48, 0.16, 0.12, 2, 2);
    l.ridge(0.57, 0.68, 0.38, 0.28, 0.37, 0.12, 'z', '#776452');
    l.block(0.57, 0.75, 0.52, 0.2, 0.04, 0.085, '#a08055');
    for (const x of [0.4, 0.73]) l.block(x, 0.79, 0.05, 0.05, 0.1, 0.3, timber);
    l.block(0.79, 0.27, 0.12, 0.11, 0.32, 0.3, '#9e9c8b');
  },
  scholar_camp(l) {
    l.base('#a89978');
    l.block(0.36, 0.27, 0.46, 0.34, 0.04, 0.18, '#cbb082');
    surroundWorkWindows(l, 0.36, 0.27, 0.46, 0.34, 0.09, 0.09, 1, 1);
    l.ridge(0.36, 0.27, 0.52, 0.39, 0.21, 0.34, 'z', '#d4b88a');
    l.block(0.61, 0.69, 0.5, 0.38, 0.04, 0.025, '#785d49');
    for (const [x, z] of [
      [0.44, 0.61],
      [0.72, 0.58],
      [0.59, 0.77],
    ] as const)
      l.block(x, z, 0.11, 0.13, 0.062, 0.073, '#c1ad8c');
    l.block(0.23, 0.75, 0.17, 0.11, 0.04, 0.15, timber);
  },
  pasture(l) {
    l.base('#8e9c63');
    for (const x of [0.09, 0.91]) l.block(x, 0.5, 0.026, 0.84, 0.17, 0.04, timber);
    for (const z of [0.09, 0.91]) l.block(0.5, z, 0.84, 0.026, 0.17, 0.04, timber);
    for (const x of [0.09, 0.5, 0.91]) {
      for (const z of [0.09, 0.91]) l.block(x, z, 0.035, 0.035, 0.04, 0.23, timber);
    }
    l.roofed(0.27, 0.28, 0.29, 0.23, 0.04, 0.29, 'x', '#977851');
    surroundWorkWindows(l, 0.27, 0.28, 0.29, 0.23, 0.14, 0.1, 1, 1);
    for (const [x, z] of [
      [0.42, 0.62],
      [0.72, 0.72],
      [0.77, 0.38],
    ] as const) {
      l.block(x, z, 0.11, 0.071, 0.075, 0.13, '#ddd9c3');
      l.block(x + 0.056, z, 0.04, 0.048, 0.105, 0.095, '#847a69');
    }
  },
};
