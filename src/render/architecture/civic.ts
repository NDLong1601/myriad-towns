import { civicTiers } from './civicTiers';
import { infraTiers } from './infraTiers';
import type { Lot, Recipes } from './lot';

const timber = '#816149';
const timberDark = '#3d2a19';
const tile = '#b4aa90';
const windowWarm = '#f5be42';

function surroundFourSideWindows(
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
      l.block(wx, hz + sz * (hd / 2 + 0.004), 0.068, 0.014, y, h, windowWarm, 1);
      l.block(wx, hz + sz * (hd / 2 + 0.002), 0.08, 0.018, y - 0.008, h + 0.016, timberDark);
    }
  }
  const spanZ = hd * 0.72;
  for (let i = 0; i < colsX; i++) {
    const wz = hz + (colsX === 1 ? 0 : ((i + 0.5) / colsX - 0.5) * spanZ);
    for (const sx of [-1, 1] as const) {
      l.block(hx + sx * (hw / 2 + 0.004), wz, 0.014, 0.068, y, h, windowWarm, 1);
      l.block(hx + sx * (hw / 2 + 0.002), wz, 0.018, 0.08, y - 0.008, h + 0.016, timberDark);
    }
  }
}

export const civic: Recipes = {
  ...civicTiers,
  ...infraTiers,
  community_classroom(l) {
    l.base('#8e9c73');
    l.roofed(0.47, 0.22, 0.77, 0.27, 0.04, 0.53);
    surroundFourSideWindows(l, 0.47, 0.22, 0.77, 0.27, 0.2, 0.16, 3, 1);
    l.roofed(0.22, 0.5, 0.25, 0.35, 0.04, 0.42, 'z', '#ccaf86');
    surroundFourSideWindows(l, 0.22, 0.5, 0.25, 0.35, 0.16, 0.14, 1, 2);
    l.block(0.62, 0.44, 0.36, 0.11, 0.46, 0.08, '#82735c');
    l.block(0.58, 0.74, 0.51, 0.3, 0.038, 0.016, '#b68462');
    l.block(0.61, 0.74, 0.016, 0.26, 0.054, 0.009, '#ebd6a8');
    l.tree(0.15, 0.83, 0.82);
  },
  research_campus(l) {
    l.base('#849879');
    l.block(0.22, 0.48, 0.3, 0.68, 0.04, 1.28);
    surroundFourSideWindows(l, 0.22, 0.48, 0.3, 0.68, 0.3, 0.22, 2, 3);
    surroundFourSideWindows(l, 0.22, 0.48, 0.3, 0.68, 0.78, 0.22, 2, 3);
    l.block(0.77, 0.48, 0.28, 0.61, 0.04, 1.0, '#bbcabf');
    surroundFourSideWindows(l, 0.77, 0.48, 0.28, 0.61, 0.28, 0.2, 2, 3);
    surroundFourSideWindows(l, 0.77, 0.48, 0.28, 0.61, 0.68, 0.2, 2, 3);
    l.block(0.5, 0.47, 0.35, 0.18, 0.85, 0.34, '#789ca2');
    l.block(0.21, 0.48, 0.33, 0.72, 1.3, 0.075, '#6f817d');
    l.block(0.77, 0.48, 0.31, 0.64, 1.02, 0.08, '#8d9e8c');
    l.dome(0.21, 0.34, 0.128, 0.123, 1.38, 0.62, '#aec6c4');
    l.block(0.78, 0.4, 0.21, 0.28, 1.12, 0.055, '#678c9c');
    l.tree(0.51, 0.79, 0.68);
  },
  waterside_retreat(l) {
    l.block(0.5, 0.5, 0.9, 0.91, 0.1, 0.11, '#a88763');
    l.block(0.5, 0.25, 0.64, 0.31, 0.21, 0.56, '#aa9a79');
    surroundFourSideWindows(l, 0.5, 0.25, 0.64, 0.31, 0.36, 0.18, 3, 2);
    l.ridge(0.5, 0.28, 0.78, 0.46, 0.77, 0.42, 'x', '#6c8070');
    l.ridge(0.5, 0.61, 0.53, 0.43, 0.72, 0.35, 'z');
    for (const x of [0.28, 0.72]) l.block(x, 0.77, 0.04, 0.04, 0.21, 0.54, timber);
    l.block(0.5, 0.85, 0.51, 0.06, 0.21, 0.17, '#c0aa85');
  },
  planted_grove(l) {
    l.base('#698e58');
    l.tree(0.32, 0.34, 0.92);
    l.tree(0.68, 0.36, 0.78);
    l.tree(0.52, 0.68, 0.64, '#789b59');
    l.tree(0.26, 0.7, 0.52, '#5c8248');
  },
  herb_garden(l) {
    l.base('#7d985d');
    for (const x of [0.26, 0.7]) {
      for (const z of [0.29, 0.72]) {
        l.block(x, z, 0.34, 0.32, 0.035, 0.045, '#9b7c59');
        l.block(x, z, 0.24, 0.22, 0.081, 0.077, '#74834e');
        l.round(x - 0.06, z, 0.045, 0.062, 0.15, 0.045, '#b38ba9');
      }
    }
    l.block(0.48, 0.5, 0.09, 0.87, 0.036, 0.012, tile);
    l.block(0.5, 0.5, 0.87, 0.09, 0.036, 0.012, tile);
  },
  flower_garden(l) {
    l.base('#789b59');
    l.block(0.5, 0.49, 0.19, 0.95, 0.036, 0.017, '#c3a980');
    l.block(0.5, 0.49, 0.95, 0.19, 0.036, 0.017, '#c3a980');
    for (const x of [0.23, 0.76]) {
      for (const [z, bloom] of [
        [0.26, '#c86772'],
        [0.52, '#edc171'],
        [0.77, '#a695b4'],
      ] as const) {
        l.block(x, z, 0.29, 0.187, 0.036, 0.046, '#7c634b');
        for (const offset of [-0.082, 0, 0.082])
          l.dome(x + offset, z, 0.037, 0.068, 0.117, 0.1, bloom);
      }
      for (const sz of [0.17, 0.83]) {
        l.beam(
          [0.5 + (x - 0.5) * 0.52, 0.05, sz],
          [0.5 + (x - 0.5) * 0.52, 0.55, sz],
          0.075,
          timber,
        );
      }
    }
    l.ridge(0.5, 0.83, 0.35, 0.13, 0.55, 0.18, 'z', '#a8ad72');
    l.ridge(0.5, 0.17, 0.35, 0.13, 0.55, 0.18, 'z', '#a8ad72');
  },
  botanical_park(l) {
    l.base('#739561');
    l.block(0.5, 0.5, 0.64, 0.54, 0.055, 0.42, '#82a8a3');
    surroundFourSideWindows(l, 0.5, 0.5, 0.64, 0.54, 0.14, 0.24, 4, 3);
    l.dome(0.5, 0.5, 0.33, 0.28, 0.47, 0.69, '#8cb6ad');
    l.block(0.5, 0.5, 0.16, 0.92, 0.037, 0.012, tile);
    l.block(0.5, 0.5, 0.92, 0.16, 0.037, 0.012, tile);
    for (const [tx, tz] of [
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8],
    ] as const) {
      l.tree(tx, tz, 0.88);
    }
  },
};
