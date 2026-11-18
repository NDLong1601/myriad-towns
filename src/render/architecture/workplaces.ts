import { type Lot, type Recipes } from './lot';
import { productionTiers } from './productionTiers';

const yard = '#908777';
const dark = '#525955';
const timber = '#856447';
const timberDark = '#3d2a19';
const steel = '#899593';
const brick = '#9b614f';
const windowWarm = '#f5be42';

function logs(l: Lot, x: number, z: number, width: number): void {
  for (const offset of [-0.095, 0, 0.095]) {
    l.block(x, z + offset, width, 0.076, 0.038, 0.08, '#a78053');
    l.block(x - width / 2, z + offset, 0.025, 0.067, 0.046, 0.062, '#ceb27c');
  }
}

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
  woodcutter(l) {
    l.base('#789761');
    l.roofed(0.29, 0.33, 0.43, 0.37, 0.04, 0.28, 'x', timber, '#6f5c47');
    surroundWorkWindows(l, 0.29, 0.33, 0.43, 0.37, 0.14, 0.1, 1, 1);
    logs(l, 0.66, 0.62, 0.4);
    l.round(0.21, 0.72, 0.102, 0.118, 0.035, 0.13, '#b79365');
    l.block(0.71, 0.28, 0.35, 0.048, 0.035, 0.19, timber);
  },
  forester(l) {
    l.base('#72905a');
    l.roofed(0.26, 0.26, 0.37, 0.34, 0.04, 0.28, 'z', '#a99269');
    surroundWorkWindows(l, 0.26, 0.26, 0.37, 0.34, 0.14, 0.1, 1, 1);
    for (const x of [0.61, 0.8]) {
      l.block(x, 0.59, 0.13, 0.57, 0.04, 0.035, '#756047');
      for (const z of [0.41, 0.61, 0.81]) l.round(x, z, 0.012, 0.06, 0.075, 0.25, '#54814e');
    }
    l.block(0.3, 0.71, 0.3, 0.056, 0.038, 0.16, timber);
  },
  fur_trapper(l) {
    l.base('#c2cdca');
    l.block(0.35, 0.31, 0.51, 0.37, 0.04, 0.18, timber);
    surroundWorkWindows(l, 0.35, 0.31, 0.51, 0.37, 0.09, 0.09, 1, 1);
    l.ridge(0.35, 0.32, 0.58, 0.51, 0.21, 0.35, 'x', '#92816e');
    for (const x of [0.46, 0.85]) l.block(x, 0.75, 0.06, 0.055, 0.04, 0.49, timber);
    l.block(0.65, 0.75, 0.44, 0.044, 0.48, 0.06, timber);
    for (const x of [0.56, 0.74]) l.block(x, 0.75, 0.11, 0.04, 0.23, 0.26, '#a7775b');
  },
  hunting_lodge(l) {
    l.base('#7f935c');
    l.roofed(0.47, 0.35, 0.72, 0.48, 0.055, 0.34, 'x', '#876247');
    surroundWorkWindows(l, 0.47, 0.35, 0.72, 0.48, 0.16, 0.12, 2, 2);
    l.ridge(0.57, 0.68, 0.38, 0.28, 0.37, 0.12, 'z', '#776452');
    l.block(0.57, 0.75, 0.52, 0.2, 0.04, 0.085, '#a08055');
    for (const x of [0.4, 0.73]) l.block(x, 0.79, 0.05, 0.05, 0.1, 0.3, timber);
    l.block(0.79, 0.27, 0.12, 0.11, 0.32, 0.3, '#9e9c8b');
  },
  stone_cutter(l) {
    l.base('#a29e89');
    l.block(0.38, 0.31, 0.53, 0.34, 0.04, 0.22, '#bcb5a0');
    surroundWorkWindows(l, 0.38, 0.31, 0.53, 0.34, 0.1, 0.09, 2, 1);
    l.block(0.38, 0.31, 0.4, 0.23, 0.25, 0.073, '#857f71');
    l.beam([0.17, 0.19, 0.34], [0.19, 0.52, 0.34], 0.062, dark);
    l.beam([0.57, 0.19, 0.34], [0.56, 0.52, 0.34], 0.062, dark);
    l.block(0.37, 0.34, 0.44, 0.045, 0.48, 0.065, steel);
    l.block(0.66, 0.73, 0.39, 0.21, 0.04, 0.14, '#ccbea2');
    l.block(0.64, 0.75, 0.23, 0.13, 0.17, 0.1, '#dfd1b8');
  },
  gravel_pit(l) {
    l.base('#a19980');
    l.block(0.44, 0.42, 0.6, 0.61, 0.04, 0.014, '#716a5d');
    for (const [x, z, radius] of [
      [0.27, 0.36, 0.17],
      [0.45, 0.59, 0.15],
      [0.76, 0.69, 0.138],
    ] as const) {
      l.round(x, z, 0.036, radius, 0.052, radius * 1.6, '#b5ac98');
    }
    l.beam([0.14, 0.12, 0.82], [0.78, 0.36, 0.24], 0.12, '#767f75');
    l.block(0.78, 0.25, 0.18, 0.16, 0.05, 0.27, timber);
    surroundWorkWindows(l, 0.78, 0.25, 0.18, 0.16, 0.12, 0.09, 1, 1);
  },
  coal_mine(l) {
    l.base('#7b756e');
    l.block(0.37, 0.23, 0.61, 0.32, 0.04, 0.66, '#625d57');
    surroundWorkWindows(l, 0.37, 0.23, 0.61, 0.32, 0.24, 0.16, 2, 1);
    l.round(0.37, 0.35, 0.15, 0.34, 0.47, 0.38, '#77716a');
    l.block(0.35, 0.41, 0.27, 0.058, 0.04, 0.42, '#252b2c');
    l.block(0.35, 0.44, 0.33, 0.1, 0.44, 0.1, timber);
    for (const x of [0.29, 0.42]) l.block(x, 0.665, 0.021, 0.47, 0.045, 0.022, steel);
    l.beam([0.53, 0.57, 0.3], [0.78, 0.91, 0.72], 0.14, '#535854');
    l.block(0.79, 0.74, 0.12, 0.09, 0.04, 0.77, '#737c75');
    l.round(0.2, 0.73, 0.055, 0.17, 0.045, 0.19, '#41413e');
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
  craft_studio(l) {
    l.base('#a9987c');
    l.roofed(0.38, 0.31, 0.65, 0.41, 0.04, 0.45, 'x', '#bfab8d');
    surroundWorkWindows(l, 0.38, 0.31, 0.65, 0.41, 0.18, 0.14, 2, 2);
    l.block(0.32, 0.64, 0.4, 0.23, 0.36, 0.087, '#998260');
    for (const x of [0.15, 0.49]) l.block(x, 0.73, 0.04, 0.043, 0.04, 0.31, timber);
    l.round(0.77, 0.64, 0.16, 0.18, 0.04, 0.3, brick);
    l.round(0.77, 0.64, 0.06, 0.16, 0.33, 0.25, '#a9795a');
    l.block(0.64, 0.84, 0.23, 0.1, 0.044, 0.08, timber);
  },
  foundry(l) {
    l.base(yard);
    l.block(0.29, 0.33, 0.46, 0.53, 0.04, 0.48, '#868e85');
    surroundWorkWindows(l, 0.29, 0.33, 0.46, 0.53, 0.2, 0.16, 2, 2);
    l.ridge(0.29, 0.33, 0.51, 0.58, 0.52, 0.22, 'z', dark);
    l.round(0.73, 0.7, 0.18, 0.104, 0.11, 0.28, '#656b63');
    l.round(0.73, 0.7, 0.135, 0.135, 0.383, 0.021, '#d38c49', 1);
    l.beam([0.82, 0.04, 0.26], [0.82, 0.94, 0.26], 0.074, '#ad8652');
    l.beam([0.82, 0.94, 0.26], [0.73, 0.94, 0.7], 0.074, '#c69750');
    l.beam([0.73, 0.94, 0.7], [0.73, 0.51, 0.7], 0.022, '#434b46');
  },
  steelworks(l) {
    l.base('#8b8980');
    l.block(0.48, 0.45, 0.81, 0.59, 0.05, 0.82, '#8e9891');
    surroundWorkWindows(l, 0.48, 0.45, 0.81, 0.59, 0.24, 0.2, 3, 2);
    surroundWorkWindows(l, 0.48, 0.45, 0.81, 0.59, 0.56, 0.18, 3, 2);
    l.ridge(0.48, 0.45, 0.85, 0.65, 0.86, 0.34, 'x', '#697775');
    for (const [x, y] of [
      [0.2, 1.05],
      [0.39, 1.3],
    ] as const) {
      l.round(x, 0.26, 0.055, 0.087, 0.85, y, '#81766a');
      l.round(x, 0.26, 0.073, 0.07, 0.87 + y, 0.095, '#b78d70');
    }
    l.block(0.64, 0.765, 0.27, 0.04, 0.1, 0.5, '#565e5a');
    l.block(0.81, 0.82, 0.29, 0.16, 0.05, 0.11, '#c18459');
  },
  factory(l) {
    l.base('#949589');
    l.block(0.49, 0.42, 0.86, 0.61, 0.04, 0.6, '#a8ada3');
    surroundWorkWindows(l, 0.49, 0.42, 0.86, 0.61, 0.24, 0.2, 3, 3);
    for (const z of [0.22, 0.42, 0.62]) l.ridge(0.49, z, 0.89, 0.19, 0.64, 0.33, 'x', '#78918b');
    l.block(0.22, 0.31, 0.11, 0.15, 0.69, 0.62, '#666d66');
    for (const x of [0.28, 0.5, 0.72]) l.block(x, 0.731, 0.14, 0.038, 0.06, 0.38, '#515b56');
    l.block(0.5, 0.78, 0.72, 0.13, 0.44, 0.09, '#bca06e');
    l.block(0.71, 0.885, 0.16, 0.08, 0.04, 0.11, '#997954');
  },
  power_plant(l) {
    l.base('#94968c');
    l.block(0.28, 0.37, 0.43, 0.55, 0.04, 0.44, '#a6a698');
    surroundWorkWindows(l, 0.28, 0.37, 0.43, 0.55, 0.18, 0.16, 2, 2);
    l.block(0.28, 0.37, 0.48, 0.6, 0.47, 0.087, '#6d7d79');
    l.round(0.68, 0.55, 0.177, 0.271, 0.04, 0.55, '#b4b3a5');
    l.round(0.68, 0.55, 0.148, 0.177, 0.586, 0.63, '#b7baab');
    l.round(0.68, 0.55, 0.211, 0.149, 1.212, 0.65, '#c1c1af');
    l.round(0.68, 0.55, 0.208, 0.189, 1.857, 0.095, '#a1a599');
    l.round(0.68, 0.55, 0.173, 0.172, 1.885, 0.018, '#5e6b69');
    l.block(0.19, 0.78, 0.16, 0.15, 0.05, 0.24, '#71827b');
  },
  trading_post(l) {
    l.base('#a5997d');
    l.block(0.49, 0.42, 0.71, 0.56, 0.04, 0.53, '#b9a98b');
    surroundWorkWindows(l, 0.49, 0.42, 0.71, 0.56, 0.2, 0.16, 3, 2);
    l.block(0.49, 0.4, 0.75, 0.57, 0.56, 0.16, '#8b7565');
    l.block(0.5, 0.72, 0.52, 0.22, 0.37, 0.078, '#ae765b');
    l.block(0.74, 0.87, 0.15, 0.13, 0.045, 0.145, timber);
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
  salt_pan(l) {
    l.base('#c3b195');
    for (const x of [0.26, 0.74]) {
      for (const z of [0.29, 0.7]) {
        l.block(x, z, 0.42, 0.35, 0.036, 0.043, '#ab997a');
        l.block(x, z, 0.35, 0.28, 0.079, 0.014, z < 0.5 ? '#99b8b5' : '#dfd8bd');
      }
    }
    l.round(0.52, 0.5, 0.015, 0.095, 0.047, 0.23, '#efead7');
  },
};
