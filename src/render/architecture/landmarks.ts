import { type Lot, type Recipes } from './lot';

const metal = '#505b58';

function clock(l: Lot, x: number, z: number, y: number): void {
  l.block(x, z, 0.104, 0.022, y, 0.2, '#646154');
  l.block(x, z + 0.012, 0.081, 0.01, y + 0.017, 0.163, '#e6d5a4');
  l.block(x, z + 0.021, 0.012, 0.014, y + 0.076, 0.078, metal);
  l.beam([x, y + 0.092, z + 0.029], [x + 0.031, y + 0.125, z + 0.029], 0.016, metal);
}

/** Large architectural features from the approved concept sheets. */
export const landmarks: Recipes = {
  rail_station(l) {
    l.block(0.2, 0.25, 0.132, 0.15, 0.17, 0.94, '#a46b50');
    l.ridge(0.2, 0.25, 0.159, 0.204, 1.08, 0.26, 'x', metal);
    clock(l, 0.2, 0.331, 0.858);

    // Waiting benches, departure timetable & platform globe lamps
    for (const x of [0.38, 0.72]) {
      l.block(x, 0.22, 0.16, 0.05, 0.17, 0.055, '#5c412a');
      l.block(x, 0.198, 0.16, 0.014, 0.21, 0.05, '#5c412a');
    }
    l.block(0.58, 0.22, 0.075, 0.02, 0.17, 0.13, '#1c2925');
    l.block(0.58, 0.22, 0.078, 0.022, 0.27, 0.025, '#f5c842');
    l.round(0.28, 0.29, 0.022, 0.022, 0.62, 0.04, '#ffefa8', 1);
    l.round(0.72, 0.29, 0.022, 0.022, 0.62, 0.04, '#ffefa8', 1);
  },
  fishing_harbor(l) {
    for (const x of [0.24, 0.78])
      for (const z of [0.49, 0.57, 0.65, 0.73, 0.81, 0.9])
        l.block(x, z, 0.186, 0.011, 0.209, 0.012, '#806447');
    for (let i = 0; i < 5; i++)
      l.beam([0.625 + i * 0.036, 0.528, 0.34], [0.633 + i * 0.032, 0.36, 0.34], 0.016, '#b4a283');
    l.block(0.47, 0.39, 0.16, 0.09, 0.21, 0.125, '#75908a');

    // Mooring bollards & coiled hawser ropes on pier tips
    for (const x of [0.24, 0.78]) {
      l.round(x, 0.94, 0.025, 0.03, 0.21, 0.08, '#26292b');
      l.round(x, 0.94, 0.035, 0.025, 0.28, 0.02, '#26292b');
    }
    l.round(0.51, 0.45, 0.025, 0.03, 0.21, 0.08, '#26292b');
    l.round(0.2, 0.82, 0.045, 0.045, 0.21, 0.022, '#99815a');
    l.round(0.74, 0.82, 0.045, 0.045, 0.21, 0.022, '#99815a');

    // Iced fish crates, slatted crab pots & herring brine barrels
    l.block(0.4, 0.22, 0.14, 0.11, 0.21, 0.05, '#785b3c');
    l.block(0.4, 0.22, 0.12, 0.09, 0.26, 0.018, '#c2d5d9');
    l.block(0.42, 0.22, 0.11, 0.09, 0.28, 0.045, '#856645');
    l.block(0.76, 0.54, 0.1, 0.12, 0.21, 0.08, '#695138');
    l.round(0.12, 0.2, 0.04, 0.035, 0.21, 0.09, '#5c442e');
    l.round(0.18, 0.2, 0.04, 0.035, 0.21, 0.09, '#5c442e');
  },
};
