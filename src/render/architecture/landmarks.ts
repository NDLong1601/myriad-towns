import { type Lot, type Recipes } from './lot';

const brass = '#bc975d';
const timber = '#6e4c33';
const metal = '#505b58';
const limestone = '#d2bf9e';

function clock(l: Lot, x: number, z: number, y: number): void {
  l.block(x, z, 0.104, 0.022, y, 0.2, '#646154');
  l.block(x, z + 0.012, 0.081, 0.01, y + 0.017, 0.163, '#e6d5a4');
  l.block(x, z + 0.021, 0.012, 0.014, y + 0.076, 0.078, metal);
  l.beam([x, y + 0.092, z + 0.029], [x + 0.031, y + 0.125, z + 0.029], 0.016, metal);
}

function railing(l: Lot, x: number, z: number, y: number, width: number): void {
  l.block(x, z, width, 0.02, y + 0.101, 0.021, metal);
  for (let i = 0; i < 5; i++) {
    const offset = (i / 4 - 0.5) * width;
    l.block(x + offset, z, 0.009, 0.011, y, 0.11, metal);
  }
}

/** Large architectural features from the approved concept sheets. */
export const landmarks: Recipes = {
  townhouse(l) {
    l.block(0.5, 0.42, 0.63, 0.683, 1.21, 0.082, '#8e9b97');
    // The lower ledge flares out beneath the slate roof.
    l.block(0.5, 0.405, 0.64, 0.693, 1.294, 0.062, '#4e6470');
    for (const x of [0.37, 0.61]) {
      l.block(x, 0.675, 0.137, 0.163, 1.34, 0.154, limestone);
      l.ridge(x, 0.676, 0.149, 0.18, 1.49, 0.105, 'z', '#576a72');
      l.block(x, 0.76, 0.073, 0.022, 1.363, 0.099, '#c5b790', 0.7);
      l.block(x, 0.778, 0.118, 0.054, 0.87, 0.04, limestone);
      railing(l, x, 0.806, 0.906, 0.108);
    }
    for (const x of [0.195, 0.805]) {
      for (const z of [0.28, 0.53]) {
        for (const y of [0.19, 0.58, 0.94]) {
          l.block(x, z, 0.024, 0.108, y, 0.153, '#8e7761');
          l.block(x < 0.5 ? x - 0.013 : x + 0.013, z, 0.011, 0.078, y + 0.02, 0.11, '#869d9d', 0.7);
          l.block(x, z, 0.041, 0.127, y - 0.018, 0.024, limestone);
        }
      }
    }

    // Corner ashlar quoins and horizontal floor belt courses
    for (const y of [0.12, 0.32, 0.52, 0.72, 0.92, 1.12]) {
      l.block(0.208, 0.758, 0.045, 0.018, y, 0.08, '#c2b7a3');
      l.block(0.792, 0.758, 0.045, 0.018, y, 0.08, '#c2b7a3');
    }
    l.block(0.5, 0.759, 0.62, 0.02, 0.53, 0.026, '#c4b9a5');
    l.block(0.5, 0.762, 0.64, 0.028, 1.2, 0.035, '#bcb09c');

    // Entrance handrails, carriage lantern & stoop urns
    l.beam([0.38, 0.09, 0.88], [0.38, 0.44, 0.82], 0.016, '#2a2c2d');
    l.beam([0.38, 0.44, 0.82], [0.38, 0.44, 0.76], 0.016, '#2a2c2d');
    l.block(0.55, 0.868, 0.015, 0.02, 0.26, 0.015, '#2a2c2d');
    l.block(0.55, 0.875, 0.032, 0.032, 0.22, 0.045, '#ffd97d', 1);
    for (const x of [0.33, 0.71]) {
      l.round(x, 0.84, 0.035, 0.025, 0.075, 0.06, '#b0a996');
      l.dome(x, 0.84, 0.045, 0.045, 0.135, 0.05, '#4e803c');
    }
  },
  villa(l) {
    l.block(0.5, 0.25, 0.19, 0.19, 0.81, 0.36, limestone);
    l.dome(0.5, 0.25, 0.106, 0.109, 1.17, 0.22, '#805c84');
    for (const x of [0.35, 0.65]) l.round(x, 0.45, 0.017, 0.021, 0.056, 0.47, limestone);
    l.block(0.5, 0.46, 0.46, 0.1, 0.51, 0.064, limestone);
    l.round(0.5, 0.58, 0.057, 0.069, 0.06, 0.055, '#bda98b');
    l.round(0.5, 0.58, 0.047, 0.047, 0.112, 0.022, '#8bb7bc');
    l.round(0.5, 0.58, 0.012, 0.02, 0.133, 0.086, limestone);

    // Courtyard balustrade, gateway piers and Italian cypress accents
    l.block(0.39, 0.77, 0.09, 0.025, 0.035, 0.055, '#cfc7b0');
    l.block(0.61, 0.77, 0.09, 0.025, 0.035, 0.055, '#cfc7b0');
    for (const x of [0.44, 0.56]) {
      l.block(x, 0.77, 0.03, 0.03, 0.035, 0.085, '#bcb39a');
      l.round(x, 0.77, 0.015, 0.015, 0.12, 0.03, '#e0d8c3');
    }
    l.block(0.5, 0.86, 0.09, 0.16, 0.035, 0.005, '#d4cbb4');
    for (const x of [0.1, 0.9]) {
      l.round(x, 0.35, 0.015, 0.02, 0.035, 0.12, '#6b4f3a');
      l.round(x, 0.35, 0.01, 0.045, 0.15, 0.45, '#2e5428');
    }
  },
  market(l) {
    for (const x of [0.645, 0.865])
      for (const z of [0.58, 0.85]) l.block(x, z, 0.028, 0.029, 0.043, 0.56, timber);
    l.ridge(0.755, 0.715, 0.293, 0.373, 0.589, 0.28, 'x', '#985941');
    l.ridge(0.755, 0.715, 0.17, 0.21, 0.82, 0.15, 'z', '#bb7950');
    for (const x of [0.67, 0.755, 0.84]) l.block(x, 0.84, 0.053, 0.026, 0.045, 0.11, '#aa8654');

    // Scalloped stall valances & colorful market crates
    l.block(0.23, 0.445, 0.32, 0.018, 0.56, 0.045, '#e8dcc4');
    l.block(0.76, 0.445, 0.32, 0.018, 0.56, 0.045, '#e8dcc4');
    l.block(0.24, 0.885, 0.32, 0.018, 0.56, 0.045, '#e8dcc4');
    l.block(0.16, 0.32, 0.08, 0.09, 0.29, 0.045, '#bf3b36');
    l.block(0.26, 0.32, 0.08, 0.09, 0.29, 0.045, '#e0822b');
    l.block(0.7, 0.32, 0.08, 0.09, 0.29, 0.045, '#4e823b');
    l.block(0.8, 0.32, 0.08, 0.09, 0.29, 0.045, '#d9b668');
    l.round(0.2, 0.74, 0.025, 0.03, 0.29, 0.06, '#9c583f');
    l.block(0.28, 0.74, 0.09, 0.07, 0.29, 0.05, '#3e6b8c');

    // Town bulletin notice board, vendor barrow & barrels
    l.block(0.44, 0.82, 0.02, 0.02, 0.035, 0.24, '#5e432c');
    l.block(0.56, 0.82, 0.02, 0.02, 0.035, 0.24, '#5e432c');
    l.block(0.5, 0.82, 0.14, 0.018, 0.12, 0.12, '#cfbe97');
    l.ridge(0.5, 0.82, 0.16, 0.035, 0.24, 0.035, 'x', '#6e4f34');
    l.block(0.64, 0.48, 0.13, 0.08, 0.08, 0.05, '#825f3d');
    l.round(0.64, 0.43, 0.035, 0.035, 0.035, 0.015, '#543c26');
    l.round(0.64, 0.53, 0.035, 0.035, 0.035, 0.015, '#543c26');
    l.dome(0.64, 0.48, 0.045, 0.03, 0.13, 0.035, '#528a3f');
    l.round(0.12, 0.48, 0.035, 0.03, 0.035, 0.08, '#63472f');
  },
  public_library(l) {
    l.round(0.5, 0.39, 0.151, 0.161, 1.085, 0.24, '#9aafa1');
    l.dome(0.5, 0.39, 0.159, 0.164, 1.31, 0.52, '#6c9584');
    l.round(0.5, 0.39, 0.018, 0.04, 1.775, 0.16, brass);
    for (const x of [0.29, 0.45, 0.6, 0.75]) l.round(x, 0.73, 0.02, 0.022, 0.85, 0.086, limestone);
    l.ridge(0.52, 0.727, 0.5, 0.145, 1.075, 0.17, 'z', '#a8a687');

    // Grand double oak portal with arched fanlight & torchères
    l.block(0.52, 0.665, 0.16, 0.02, 0.24, 0.38, '#4f3724');
    l.dome(0.52, 0.67, 0.08, 0.02, 0.62, 0.09, '#638b99');
    l.block(0.42, 0.668, 0.035, 0.022, 0.24, 0.46, '#cfc5ad');
    l.block(0.62, 0.668, 0.035, 0.022, 0.24, 0.46, '#cfc5ad');
    l.block(0.52, 0.675, 0.04, 0.025, 0.71, 0.045, '#b8ad96');
    for (const x of [0.39, 0.65]) {
      l.block(x, 0.672, 0.018, 0.02, 0.45, 0.05, '#2e261f');
      l.block(x, 0.68, 0.025, 0.025, 0.48, 0.035, '#ffdf80', 1);
    }

    // Forecourt balustrades, scholar busts and outdoor reading benches
    l.block(0.24, 0.81, 0.035, 0.22, 0.04, 0.13, '#c2baa7');
    l.block(0.8, 0.81, 0.035, 0.22, 0.04, 0.13, '#c2baa7');
    for (const x of [0.24, 0.8]) {
      l.block(x, 0.91, 0.05, 0.05, 0.04, 0.17, '#b3aa97');
      l.round(x, 0.91, 0.025, 0.03, 0.21, 0.055, '#c9c2b1');
    }
    l.block(0.15, 0.73, 0.14, 0.05, 0.04, 0.05, '#c2bba8');
    l.block(0.85, 0.73, 0.14, 0.05, 0.04, 0.05, '#c2bba8');
  },
  town_hall(l) {
    l.block(0.5, 0.426, 0.225, 0.28, 1.25, 0.51, '#cdb89b');
    l.block(0.5, 0.426, 0.246, 0.312, 1.741, 0.08, '#917d65');
    l.round(0.5, 0.426, 0.016, 0.137, 1.81, 0.43, '#4f6570');
    clock(l, 0.5, 0.577, 1.47);
    for (const x of [0.31, 0.69]) {
      l.block(x, 0.66, 0.041, 0.026, 0.39, 0.25, '#9b5644');
      l.block(x, 0.677, 0.02, 0.01, 0.49, 0.061, brass);
    }

    // Stepped civic terrace & monumental bronze standard lanterns
    l.block(0.5, 0.82, 0.68, 0.1, 0.035, 0.055, '#c2baa7');
    l.block(0.5, 0.88, 0.74, 0.08, 0.035, 0.035, '#b5ad9b');
    for (const x of [0.2, 0.8]) {
      l.block(x, 0.82, 0.06, 0.06, 0.04, 0.16, '#9c9584');
      l.round(x, 0.82, 0.015, 0.02, 0.2, 0.18, '#2e302e');
      l.block(x, 0.82, 0.05, 0.05, 0.38, 0.06, '#ffe180', 1);
    }
  },
  sawmill(l) {
    const x = 0.83;
    const y = 0.205;
    const z = 0.66;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const b = a + Math.PI / 4;
      const position = (angle: number): readonly [number, number, number] => [
        x,
        y + 0.147 * Math.cos(angle),
        z + 0.153 * Math.sin(angle),
      ];
      l.beam(position(a), position(b), 0.026, '#91643e');
      l.beam([x, y, z], position(a), 0.019, timber);
    }
    l.block(0.846, z, 0.072, 0.064, y - 0.034, 0.068, metal);
    l.block(0.877, 0.63, 0.125, 0.488, 0.039, 0.014, '#73959a');

    // Stacked dimensional lumber with drying racks
    l.block(0.23, 0.8, 0.25, 0.17, 0.038, 0.04, '#cca056');
    l.block(0.23, 0.8, 0.23, 0.15, 0.078, 0.04, '#ddb46c');
    l.block(0.23, 0.8, 0.21, 0.13, 0.118, 0.04, '#ecc87d');
    l.block(0.23, 0.8, 0.27, 0.19, 0.158, 0.015, '#785b3e');
    for (const z of [0.26, 0.34, 0.42]) {
      l.beam([0.88, 0.035, z], [0.83, 0.32, z], 0.022, '#d9b26a');
    }

    // Steel circular saw blade, carriage bed & log ramp
    l.block(0.46, 0.54, 0.018, 0.06, 0.16, 0.14, '#b5bebe');
    l.round(0.46, 0.54, 0.018, 0.018, 0.22, 0.06, '#3e4242');
    l.block(0.46, 0.54, 0.34, 0.035, 0.07, 0.025, '#42362b');
    l.beam([0.62, 0.04, 0.65], [0.52, 0.17, 0.54], 0.035, '#694e36');
    l.beam([0.62, 0.04, 0.5], [0.52, 0.17, 0.46], 0.035, '#694e36');
  },
  brickworks(l) {
    l.block(0.79, 0.22, 0.111, 0.116, 0.04, 1.13, '#945945');
    l.block(0.79, 0.22, 0.14, 0.145, 1.15, 0.056, '#ad745a');
    for (const z of [0.72, 0.82])
      for (const x of [0.26, 0.47, 0.7]) {
        l.block(x, z, 0.17, 0.087, 0.09, 0.072, '#ba7050');
        l.block(x, z, 0.158, 0.078, 0.162, 0.021, '#cc8a65');
      }

    // Kiln tension iron hoops, glowing stokehole fire & chimney spark arrestors
    for (const x of [0.28, 0.7]) {
      l.round(x, 0.38, 0.21, 0.21, 0.15, 0.025, '#36302b');
      l.round(x, 0.38, 0.195, 0.195, 0.28, 0.025, '#36302b');
      l.block(x, 0.58, 0.09, 0.02, 0.065, 0.08, '#f75c20', 1);
    }
    l.round(0.24, 0.36, 0.075, 0.065, 1.04, 0.035, '#574136');
    l.round(0.66, 0.36, 0.075, 0.065, 1.04, 0.035, '#574136');
  },
  warehouse(l) {
    l.block(0.5, 0.42, 0.64, 0.17, 1.045, 0.29, '#a48666');
    l.ridge(0.5, 0.42, 0.706, 0.22, 1.33, 0.15, 'x', '#71786d');
    l.windows(0.5, 0.507, 0.56, 1.17, 0.106, 5);
    l.beam([0.69, 0.74, 0.735], [0.69, 0.74, 0.93], 0.072, timber);
    l.beam([0.69, 0.74, 0.91], [0.69, 0.44, 0.91], 0.021, metal);

    // Heavy timber loading dock apron, dock bumpers & corrugated doors
    l.block(0.52, 0.76, 0.74, 0.1, 0.04, 0.07, '#6b5038');
    for (const x of [0.22, 0.38, 0.52, 0.66, 0.82]) {
      l.block(x, 0.815, 0.05, 0.02, 0.045, 0.06, '#382f27');
    }
    l.block(0.36, 0.745, 0.22, 0.015, 0.11, 0.42, '#555b57');
    l.block(0.66, 0.745, 0.22, 0.015, 0.11, 0.42, '#555b57');

    // Dockside cargo staging: pallets with steel drums, grain sacks & hand truck
    l.block(0.15, 0.85, 0.14, 0.14, 0.04, 0.025, '#785f44');
    l.round(0.12, 0.85, 0.04, 0.04, 0.065, 0.11, '#3b5f63');
    l.round(0.18, 0.85, 0.04, 0.04, 0.065, 0.11, '#a64d38');
    l.block(0.87, 0.75, 0.13, 0.12, 0.04, 0.025, '#785f44');
    l.block(0.87, 0.75, 0.12, 0.11, 0.065, 0.11, '#c7b693');
    l.block(0.42, 0.82, 0.035, 0.045, 0.04, 0.14, '#7a5438');
  },
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
  cargo_port(l) {
    l.beam([0.74, 0.31, 0.34], [0.74, 1.21, 0.52], 0.081, brass);
    l.beam([0.74, 1.24, 0.34], [0.74, 1.007, 0.51], 0.05, metal);
    l.beam([0.74, 1.39, 0.5], [0.74, 1.34, 0.79], 0.056, metal);
    for (const z of [0.321, 0.53, 0.741])
      for (const x of [0.14, 0.22, 0.3, 0.38])
        l.block(x, z - 0.016, 0.008, 0.012, 0.211, 0.215, '#c2a782');

    // Lattice crane portal legs, operator cab & counterweight
    l.beam([0.68, 0.195, 0.22], [0.74, 0.52, 0.3], 0.032, '#c48733');
    l.beam([0.8, 0.195, 0.22], [0.74, 0.52, 0.3], 0.032, '#c48733');
    l.beam([0.68, 0.195, 0.38], [0.74, 0.52, 0.3], 0.032, '#c48733');
    l.beam([0.8, 0.195, 0.38], [0.74, 0.52, 0.3], 0.032, '#c48733');
    l.beam([0.68, 0.52, 0.22], [0.8, 0.52, 0.22], 0.026, '#3d3831');
    l.beam([0.68, 0.52, 0.38], [0.8, 0.52, 0.38], 0.026, '#3d3831');
    l.block(0.74, 0.36, 0.11, 0.1, 0.98, 0.13, '#dfdcd5');
    l.block(0.74, 0.415, 0.09, 0.015, 1.01, 0.075, '#6b98a1', 0.8);
    l.block(0.74, 0.18, 0.11, 0.09, 1.25, 0.11, '#474a4a');
    l.beam([0.74, 1.48, 0.3], [0.74, 1.28, 0.18], 0.018, '#2b2e2e');

    // Crane railway tracks, high-visibility dock curb & mooring bitts
    l.block(0.68, 0.5, 0.022, 0.84, 0.195, 0.014, '#54595c');
    l.block(0.8, 0.5, 0.022, 0.84, 0.195, 0.014, '#54595c');
    l.block(0.52, 0.945, 0.92, 0.024, 0.195, 0.035, '#cfa332');
    for (const x of [0.3, 0.6, 0.88]) {
      l.round(x, 0.92, 0.03, 0.035, 0.195, 0.08, '#2b2d2e');
    }
  },
};
