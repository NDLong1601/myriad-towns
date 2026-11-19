import * as THREE from 'three';
import {
  barrel,
  boardBody,
  crate,
  cypress,
  door,
  horse,
  lanternPost,
  off,
  shingleGable,
  tinGable,
  tone,
  wbox,
  wround,
} from './diorama';
import {
  birds,
  butterflies,
  cat,
  cobbles,
  cornice,
  downpipe,
  flowerRow,
  ladder,
  pipe,
  pt,
  rainButt,
  steps,
  tank,
} from './dioramaDetails';
import { crane, dog, smoke, truck, waterSheet } from './dioramaProps';
import { cyl, disc, logPile, p3, wheelbarrow } from './forestryTransitDiorama';
import { site } from './industryDiorama';
import { bands, flywheel, heap, mouth, pylon, railing, stack, vault } from './lightIndustryDiorama';
import {
  blockStack,
  brickBody,
  conveyor,
  railLine,
  wagon,
  windows4,
  workers,
} from './miningDiorama';
import { type Lot, type Recipes } from './lot';

// Group 3A (part 2), drawn as dioramas on 2x2 lots (see `zoomed` in architectureModels.ts):
//   sawmill   -> flume_sawmill -> timber_mill -> steam_sawmill -> lumber_works
//   brickworks -> downdraft_kiln -> kiln_works -> tunnel_kiln_works -> ceramics_manufactory

const slate = '#4d5a66';
const timber = '#5c3f27';
const plank = '#8a6142';
const iron = '#2c3134';
const lumber = '#c9a56c';

/** Stack of sawn boards with spacer sticks, lying along x or z. */
function boards(l: Lot, x: number, z: number, layers: number, ry = 0, len = 0.16, y = 0.034): void {
  for (let i = 0; i < layers; i++) {
    wbox(l, x, z, y + i * 0.016, len, 0.011, 0.075, tone(lumber, 0.15), ry);
    for (const t of [-len * 0.34, 0, len * 0.34]) {
      const [px, pz] = off(l, x, z, Math.cos(ry) * t, -Math.sin(ry) * t);
      wbox(l, px, pz, y + 0.011 + i * 0.016, 0.012, 0.005, 0.08, '#7a5a3a', ry);
    }
  }
}

/** Loose sawdust mound. */
function sawdust(l: Lot, x: number, z: number, r: number): void {
  l.shape(new THREE.ConeGeometry(r, r * 0.7, 9), '#d9bf8a', x, z, 0.034 + r * 0.35);
}

/** Round log lying along ry at height y. */
function log(l: Lot, x: number, z: number, y: number, len: number, ry: number, r = 0.014): void {
  cyl(l, x, z, y, r, len, ry, tone(plank, 0.2), 8);
}

/** Circular saw blade standing in the plane facing +z. */
function blade(l: Lot, x: number, z: number, y: number, r: number): void {
  const g = new THREE.CylinderGeometry(r, r, 0.004, 18);
  g.rotateX(Math.PI / 2);
  l.shape(g, '#aeb7bb', x, z, y + r);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const t = new THREE.BoxGeometry(r * 0.16, r * 0.16, 0.004);
    t.rotateZ(a);
    t.translate(Math.cos(a) * r, Math.sin(a) * r, 0);
    l.shape(t, '#8a9298', x, z, y + r);
  }
}

/** Overshot waterwheel with buckets, standing in the plane facing +x. */
function waterwheel(l: Lot, x: number, z: number, r: number, y = 0.034): void {
  const rim = new THREE.TorusGeometry(r, 0.01, 5, 20);
  rim.rotateY(Math.PI / 2);
  l.shape(rim, '#6b4a2a', x, z, y + r);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    wbox(
      l,
      ...off(l, x, z, 0, Math.cos(a) * r),
      y + r + Math.sin(a) * r,
      0.03,
      0.018,
      0.016,
      '#8a6a48',
      0,
      a,
    );
    const sp = new THREE.BoxGeometry(0.006, r * 2, 0.006);
    sp.rotateX(a);
    l.shape(sp, '#6b4a2a', x, z, y + r);
  }
}

// ---------------------------------------------------------------------------------------------

export const sawKilnDiorama: Recipes = {
  // -------------------------------------------------------------------------------------------
  // Sawmills: sawmill -> flume_sawmill -> timber_mill -> steam_sawmill -> lumber_works
  // -------------------------------------------------------------------------------------------
  sawmill(l) {
    site(l, 'sawmill', '#8a7556', [0.06, 0.06, 0.94, 0.94]);
    const sx = 0.42;
    const sz = 0.34;
    // Open timber shed on posts with a plank roof, housing a saw pit and a frame saw.
    for (const [a, b] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const)
      wbox(l, ...off(l, sx, sz, a * 0.2, b * 0.12), 0.034, 0.02, 0.15, 0.02, timber);
    wbox(l, sx, sz, 0.034, 0.4, 0.008, 0.24, '#a68a60');
    tinGable(l, sx, sz, 'x', 0.44, 0.28, 0.184, 0.08, '#6a5a48', '#7a6a50');
    for (const t of [-0.1, 0.1])
      wbox(l, ...off(l, sx, sz, 0, t), 0.044, 0.34, 0.03, 0.026, '#6b4a2a');
    // Frame saw: two uprights, a toothed blade and a log on trestles.
    for (const t of [-1, 1])
      l.beam(
        pt(off(l, sx, sz, t * 0.05, 0), 0.044),
        pt(off(l, sx, sz, t * 0.05, 0), 0.17),
        0.008,
        timber,
      );
    wbox(l, sx, sz, 0.16, 0.12, 0.012, 0.016, timber);
    wbox(l, sx, sz, 0.066, 0.004, 0.09, 0.03, '#aeb7bb');
    log(l, sx, sz, 0.078, 0.3, 0.0, 0.016);
    // Log stacks, boards drying on stickers, sawdust and offcuts.
    logPile(l, 0.16, 0.22, Math.PI / 2, 4, 0.14);
    logPile(l, 0.84, 0.28, 0, 3, 0.14);
    boards(l, 0.2, 0.62, 5, 0.1);
    boards(l, 0.78, 0.66, 4, Math.PI / 2);
    sawdust(l, 0.6, 0.18, 0.07);
    sawdust(l, 0.3, 0.52, 0.05);
    for (let i = 0; i < 8; i++)
      wbox(
        l,
        0.4 + i * 0.03,
        0.54 + (i % 3) * 0.02,
        0.036,
        0.04,
        0.006,
        0.014,
        tone(lumber, 0.3),
        i,
      );
    // Ox cart with a log, sawyers, a dog and tools.
    wbox(l, 0.58, 0.8, 0.07, 0.14, 0.012, 0.07, '#6b4a2a');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.58, 0.8, 0, t * 0.04), 0.036, 0.026, 0.006, '#2c2a28');
    log(l, 0.58, 0.8, 0.082, 0.16, 0.0, 0.016);
    horse(l, 0.74, 0.82, 0.3, '#7a4a2a');
    wheelbarrow(l, 0.42, 0.72, 0.5, lumber);
    barrel(l, 0.12, 0.8);
    rainButt(l, 0.2, 0.84);
    railing(l, 0.06, 0.94, 0.95);
    cypress(l, 0.08, 0.1, 0.26);
    cypress(l, 0.93, 0.12, 0.22);
    dog(l, 0.34, 0.66, 0.6);
    cat(l, 0.5, 0.5, 0.034, '#c27a3a');
    birds(l, [
      [0.7, 0.92, 0.07],
      [0.8, 0.92, 0.07],
      [0.42, 0.2, 0.184],
    ]);
    workers(l, [
      [0.46, 0.44, '#8a4a3a', '#3a3a3c'],
      [0.36, 0.44, '#5a7a9a', '#d9c38a'],
      [0.66, 0.56, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.5, 0.14);
  },

  flume_sawmill(l) {
    site(l, 'flume_sawmill', '#85775a', [0.05, 0.06, 0.95, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Plank mill house over the saw floor, with a cut-out loading bay and shingle roof.
    boardBody(l, hx, hz, 0.46, 0.28, 0.034, 0.12, '#8a6a48');
    windows4(l, hx, hz, 0.46, 0.28, 0.09, 0.04, { shutters: '#2f5f6a' });
    door(l, hx, hz, 0.46, 0.28, '+z', -0.1, 0.034, 0.08, 0.1, '#2a1c12');
    shingleGable(l, hx, hz, 'x', 0.46, 0.28, 0.154, 0.1, '#6a4f38', '#8a6a48');
    stack(l, ...off(l, hx, hz, 0.16, -0.06), 0.154, 0.14, 0.02, '#9a948a', 3);
    steps(l, ...off(l, hx, hz, 0.1, 0.15), 0.07, 2);
    downpipe(l, ...off(l, hx, hz, 0.23, 0.14), 0.034, 0.12);
    // Log pond with floating logs, a log ramp, and a wooden flume feeding an overshot wheel.
    waterSheet(l, 0.2, 0.74, 0.34, 0.3, 0.036, '#4f93b0');
    for (let i = 0; i < 6; i++)
      log(
        l,
        0.1 + (i % 3) * 0.1,
        0.66 + Math.floor(i / 3) * 0.12,
        0.04,
        0.16,
        0.3 + i * 0.3,
        0.013,
      );
    l.beam([0.4, 0.05, 0.7], [0.4, 0.1, 0.5], 0.04, '#7a5a3a');
    for (let i = 0; i < 5; i++)
      wbox(l, 0.4 + (i * 0.1) / l.spanX, 0.6, 0.08 + i * 0.02, 0.018, 0.012, 0.02, '#4a3a2a');
    for (let i = 0; i < 6; i++) wbox(l, 0.62 + i * 0.05, 0.12, 0.2, 0.06, 0.006, 0.05, '#5a93ad');
    for (const x of [0.62, 0.8]) l.beam([x, 0.03, 0.12], [x, 0.19, 0.12], 0.008, timber);
    waterwheel(l, 0.86, 0.32, 0.09);
    l.beam([0.86, 0.124, 0.32], [0.7, 0.124, 0.32], 0.008, iron);
    wbox(l, 0.72, 0.5, 0.034, 0.1, 0.012, 0.28, '#5a93ad');
    // Carriage rail with a log on it, boards, sawdust and a handcart.
    wbox(l, 0.4, 0.56, 0.044, 0.5, 0.008, 0.03, '#6a6a70');
    log(l, 0.5, 0.56, 0.054, 0.22, 0, 0.016);
    boards(l, 0.84, 0.66, 5, Math.PI / 2);
    boards(l, 0.64, 0.82, 4, 0.1);
    logPile(l, 0.16, 0.24, Math.PI / 2, 3, 0.14);
    sawdust(l, 0.6, 0.2, 0.06);
    wheelbarrow(l, 0.5, 0.78, 0.5, lumber);
    barrel(l, 0.9, 0.84);
    rainButt(l, ...off(l, hx, hz, -0.2, 0.1));
    flowerRow(l, ...off(l, hx, hz, 0.12, 0.17), 0.12, '#f0c24a', 6);
    railing(l, 0.06, 0.94, 0.96);
    cypress(l, 0.07, 0.1, 0.26);
    cypress(l, 0.93, 0.9, 0.22);
    cat(l, ...off(l, hx, hz, -0.1, 0.16), 0.036, '#c27a3a');
    birds(l, [
      [0.7, 0.9, 0.07],
      [0.76, 0.9, 0.07],
      [0.4, 0.2, 0.154],
    ]);
    dog(l, 0.58, 0.62, 0.3);
    workers(l, [
      [0.5, 0.46, '#8a4a3a', '#3a3a3c'],
      [0.3, 0.62, '#5a7a9a', '#d9c38a'],
      [0.74, 0.76, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.56, 0.15);
  },

  timber_mill(l) {
    site(l, 'timber_mill', '#807459', [0.05, 0.06, 0.95, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Long mill shed with a monitor roof over the circular saw bench and a covered planer bay.
    boardBody(l, hx, hz, 0.54, 0.3, 0.034, 0.14, '#7a6a52');
    windows4(l, hx, hz, 0.54, 0.3, 0.1, 0.044, { shutters: '#3f5a3a' });
    for (const t of [-0.14, 0.14])
      door(l, hx, hz, 0.54, 0.3, '+z', t, 0.034, 0.09, 0.11, '#2a1c12');
    tinGable(l, hx, hz, 'x', 0.54, 0.3, 0.174, 0.09, '#59636a', '#7a6a52');
    wbox(l, hx, hz, 0.25, 0.46, 0.04, 0.07, '#cfe6ee', 0, 0, 0.4);
    wbox(l, hx, hz, 0.29, 0.48, 0.008, 0.09, '#59636a');
    cornice(l, hx, hz, 0.54, 0.3, 0.172, '#c9a56c');
    // Open-front saw bay: circular saw on a bench, with a log carriage and a feed belt.
    blade(l, ...off(l, hx, hz, -0.14, 0.155), 0.06, 0.04);
    wbox(l, ...off(l, hx, hz, -0.14, 0.155), 0.046, 0.12, 0.026, 0.05, '#6b4a2a');
    // Steam boiler house with an iron chimney and a firewood store.
    brickBody(l, 0.82, 0.22, 0.16, 0.18, 0.034, 0.12, '#8a4a38');
    tinGable(l, 0.82, 0.22, 'x', 0.16, 0.18, 0.154, 0.05, slate, '#8a4a38');
    stack(l, 0.86, 0.12, 0.034, 0.34, 0.022, '#9c5640', 4);
    logPile(l, 0.9, 0.42, Math.PI / 2, 3, 0.1);
    // Kiln shed with louvres, tram rails through the yard and a loaded log truck.
    boardBody(l, 0.82, 0.62, 0.2, 0.18, 0.034, 0.1, '#8a7a62');
    tinGable(l, 0.82, 0.62, 'x', 0.2, 0.18, 0.134, 0.05, '#6a6a70', '#8a7a62');
    for (let i = 0; i < 4; i++)
      wbox(l, ...off(l, 0.82, 0.62, -0.06 + i * 0.04, 0.092), 0.08, 0.03, 0.004, 0.004, '#4a3a2a');
    railLine(l, 0.04, 0.9, 0.7, 0.9, 0.034, { steel: false });
    wagon(l, 0.24, 0.9, 0, '#8a6142', 0.042, '#5a4a3a');
    wagon(l, 0.5, 0.9, 0, '#8a6142', 0.042, '#5a4a3a');
    log(l, 0.24, 0.9, 0.084, 0.16, 0, 0.014);
    boards(l, 0.14, 0.62, 6, 0.0);
    boards(l, 0.4, 0.7, 5, Math.PI / 2);
    logPile(l, 0.14, 0.2, Math.PI / 2, 4, 0.14);
    sawdust(l, 0.62, 0.52, 0.06);
    crane(l, 0.62, 0.72, 0.22, 0);
    barrel(l, 0.7, 0.8);
    cypress(l, 0.07, 0.9, 0.24);
    cypress(l, 0.94, 0.88, 0.22);
    birds(l, [
      [0.5, 0.94, 0.04],
      [0.56, 0.94, 0.04],
    ]);
    cat(l, ...off(l, hx, hz, 0.14, 0.16), 0.036, '#3a3a3c');
    workers(l, [
      [0.44, 0.52, '#8a4a3a', '#3a3a3c'],
      [0.3, 0.52, '#5a7a9a', '#d9c38a'],
      [0.6, 0.62, '#c9a83a', '#3a3a3c'],
      [0.2, 0.74, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.16);
    lanternPost(l, 0.66, 0.54, 0.16);
  },

  steam_sawmill(l) {
    site(l, 'steam_sawmill', '#756b58', [0.04, 0.06, 0.96, 0.94]);
    const hx = 0.4;
    const hz = 0.32;
    // Brick engine and saw house with arched windows, a slate roof and a lantern.
    brickBody(l, hx, hz, 0.58, 0.3, 0.034, 0.2, '#9a4a35');
    windows4(l, hx, hz, 0.58, 0.3, 0.12, 0.05, { frame: '#e3d9bf' });
    cornice(l, hx, hz, 0.58, 0.3, 0.232, '#cfc9b9');
    door(l, hx, hz, 0.58, 0.3, '+z', 0, 0.034, 0.1, 0.12, '#2a1c12', true);
    tinGable(l, hx, hz, 'x', 0.58, 0.3, 0.244, 0.09, slate, '#9a4a35');
    wbox(l, hx, hz, 0.33, 0.48, 0.04, 0.07, '#cfe6ee', 0, 0, 0.4);
    wbox(l, hx, hz, 0.37, 0.5, 0.008, 0.09, slate);
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.29, 0.155), 0.034, 0.2);
    // Boiler stack, engine flywheel and the sawdust burner (a glowing teepee).
    stack(l, 0.84, 0.16, 0.034, 0.5, 0.03, '#9c5640', 5);
    for (const y of [0.16, 0.28, 0.4]) wround(l, 0.84, 0.16, 0.026, 0.026, y, 0.008, iron, 12);
    flywheel(l, ...off(l, hx, hz, 0.34, 0.16), 0.04, 0.07);
    l.shape(new THREE.ConeGeometry(0.09, 0.26, 12, 1, true), '#5a5a5c', 0.86, 0.6, 0.17);
    mouth(l, ...off(l, 0.86, 0.6, 0, 0.082), 0.05, 0.05, 0.06);
    smoke(l, 0.86, 0.6, 0.3, 3);
    // Log haul-up: chain conveyor from the pond up into the mill, with logs riding on it.
    waterSheet(l, 0.2, 0.8, 0.34, 0.26, 0.036, '#4f93b0');
    for (let i = 0; i < 6; i++)
      log(l, 0.1 + (i % 3) * 0.1, 0.74 + Math.floor(i / 3) * 0.1, 0.04, 0.16, 0.3 + i * 0.3, 0.013);
    conveyor(l, [0.34, 0.04, 0.68], [0.34, 0.14, 0.5], 3);
    for (let i = 0; i < 3; i++)
      log(l, 0.34, 0.66 - i * 0.05, 0.07 + i * 0.03, 0.12, Math.PI / 2, 0.012);
    // Lumber yard with stacked boards, a gantry crane, a rail siding and a loaded wagon.
    boards(l, 0.6, 0.78, 6, Math.PI / 2);
    boards(l, 0.74, 0.74, 5, Math.PI / 2);
    boards(l, 0.14, 0.5, 6, 0.0);
    crane(l, 0.5, 0.62, 0.26, 0);
    railLine(l, 0.04, 0.96, 0.96, 0.96, 0.034, { steel: true });
    wagon(l, 0.3, 0.96, 0, lumber, 0.042, '#5a4a3a');
    wagon(l, 0.5, 0.96, 0, lumber, 0.042, '#5a4a3a');
    sawdust(l, 0.9, 0.4, 0.07);
    heap(l, 0.9, 0.5, 0.07, '#1f1f1f', 0.06);
    pylon(l, 0.94, 0.76, 0.3);
    birds(l, [
      [0.7, 0.92, 0.04],
      [0.76, 0.92, 0.04],
      [0.4, 0.2, 0.246],
    ]);
    cat(l, ...off(l, hx, hz, 0.1, 0.16), 0.036, '#c27a3a');
    cypress(l, 0.07, 0.12, 0.26);
    workers(l, [
      [0.44, 0.5, '#8a4a3a', '#3a3a3c'],
      [0.28, 0.58, '#5a7a9a', '#d9c38a'],
      [0.64, 0.66, '#c9a83a', '#3a3a3c'],
      [0.84, 0.82, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.1, 0.5, 0.17);
    lanternPost(l, 0.7, 0.58, 0.17);
  },

  lumber_works(l) {
    site(l, 'lumber_works', '#6e6a62', [0.04, 0.05, 0.96, 0.95]);
    // Main sawing hall: brick, long, with a tall clerestory and two glowing sawtooth lights.
    const hx = 0.38;
    const hz = 0.28;
    brickBody(l, hx, hz, 0.62, 0.3, 0.034, 0.22, '#8a4a38');
    windows4(l, hx, hz, 0.62, 0.3, 0.13, 0.05, { frame: '#d8dde0' });
    cornice(l, hx, hz, 0.62, 0.3, 0.254, '#cfc9b9');
    for (const t of [-0.16, 0.16])
      door(l, hx, hz, 0.62, 0.3, '+z', t, 0.034, 0.1, 0.13, '#2a2a2c', true);
    tinGable(l, hx, hz, 'x', 0.62, 0.3, 0.266, 0.08, slate, '#8a4a38');
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, hx, hz, -0.26 + i * 0.104, 0), 0.34, 0.01, 0.015, 0.3, '#3a4a52');
    wbox(l, hx, hz, 0.35, 0.56, 0.05, 0.07, '#cfe6ee', 0, 0, 0.5);
    wbox(l, hx, hz, 0.4, 0.58, 0.008, 0.09, '#59636a');
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.31, 0.155), 0.034, 0.22);
    ladder(l, ...off(l, hx, hz, 0.2, 0.152), 0.04, 0.22);
    // Power house: two brick stacks, a boiler and a cooling tank.
    brickBody(l, 0.82, 0.26, 0.18, 0.22, 0.034, 0.16, '#7a3a2a');
    tinGable(l, 0.82, 0.26, 'z', 0.22, 0.18, 0.194, 0.06, slate, '#7a3a2a');
    stack(l, 0.78, 0.12, 0.034, 0.58, 0.032, '#9c5640', 5);
    stack(l, 0.88, 0.14, 0.034, 0.46, 0.026, '#9c5640', 3);
    for (const y of [0.2, 0.34, 0.5]) wround(l, 0.78, 0.12, 0.028, 0.028, y, 0.008, iron, 12);
    tank(l, 0.9, 0.5, 0.034, 0.05, 0.12, '#b9b6ae');
    // Drying kilns in a row, with steam pipes, and a veneer and plywood stack.
    for (let i = 0; i < 3; i++) {
      const x = 0.14 + i * 0.16;
      boardBody(l, x, 0.6, 0.14, 0.14, 0.034, 0.1, '#9a8a72');
      tinGable(l, x, 0.6, 'x', 0.14, 0.14, 0.134, 0.04, '#6a6a70', '#9a8a72');
      for (let k = 0; k < 3; k++)
        wbox(l, ...off(l, x, 0.6, -0.04 + k * 0.04, 0.074), 0.08, 0.034, 0.004, 0.004, '#4a3a2a');
      pipe(l, pt([x, 0.52], 0.06), pt([x + 0.16 / l.spanX, 0.52], 0.06), 0.004, '#9aa4a8');
    }
    for (let i = 0; i < 6; i++)
      wbox(l, 0.7, 0.62, 0.036 + i * 0.012, 0.16, 0.01, 0.1, tone('#d9bf8a', 0.1), 0.02 * i);
    // Gantry crane over the lumber yard, conveyor to a sorter, trucks and rail siding.
    for (const x of [0.1, 0.62])
      for (const z of [0.82, 0.94]) l.beam([x, 0.034, z], [x, 0.3, z], 0.01, '#7a8a92');
    wbox(l, 0.36, 0.82, 0.3, 0.52, 0.016, 0.03, '#b64c39');
    wbox(l, 0.36, 0.94, 0.3, 0.52, 0.016, 0.03, '#b64c39');
    wbox(l, 0.36, 0.88, 0.3, 0.03, 0.02, 0.14, '#6a2a22');
    l.beam([0.36, 0.3, 0.88], [0.36, 0.2, 0.88], 0.003, iron);
    boards(l, 0.2, 0.88, 6, 0.0);
    boards(l, 0.46, 0.88, 6, 0.0);
    conveyor(l, [0.66, 0.06, 0.62], [0.9, 0.18, 0.7], 3);
    truck(l, 0.82, 0.88, Math.PI, '#3f5a3a');
    railLine(l, 0.04, 0.46, 0.7, 0.46, 0.034, { steel: true });
    wagon(l, 0.3, 0.46, 0, lumber, 0.042, '#5a4a3a');
    pylon(l, 0.94, 0.74, 0.34);
    birds(l, [
      [0.5, 0.5, 0.04],
      [0.56, 0.5, 0.04],
      [0.4, 0.2, 0.268],
    ]);
    cat(l, ...off(l, hx, hz, 0.1, 0.16), 0.036, '#3a3a3c');
    cypress(l, 0.06, 0.12, 0.26);
    workers(l, [
      [0.3, 0.54, '#e8742a', '#f2cf4a'],
      [0.52, 0.52, '#e8742a', '#f2cf4a'],
      [0.7, 0.72, '#5a7a9a', '#3a3a3c'],
      [0.18, 0.74, '#6a8a5a', '#d9c38a'],
    ]);
    lanternPost(l, 0.08, 0.5, 0.17);
    lanternPost(l, 0.66, 0.52, 0.17);
  },

  // -------------------------------------------------------------------------------------------
  // Kilns: brickworks -> downdraft_kiln -> kiln_works -> tunnel_kiln_works -> ceramics_manufactory
  // -------------------------------------------------------------------------------------------
  brickworks(l) {
    site(l, 'brickworks', '#a0805c', [0.06, 0.06, 0.94, 0.94]);
    // Clamp kiln: a stack of green bricks with fire holes, plastered with clay and smoking.
    const kx = 0.4;
    const kz = 0.36;
    for (let r = 0; r < 6; r++)
      wbox(
        l,
        kx,
        kz,
        0.034 + r * 0.02,
        0.26 - r * 0.026,
        0.02,
        0.2 - r * 0.02,
        tone('#b0503a', 0.18),
      );
    for (const t of [-0.07, 0.07])
      wbox(l, ...off(l, kx, kz, t, 0.104), 0.04, 0.036, 0.034, 0.008, hot, 0, 0, 1);
    wbox(l, kx, kz, 0.154, 0.1, 0.01, 0.08, '#6a5a48');
    smoke(l, kx, kz, 0.17, 4);
    // Drying hacks: rows of brick stacks under a plank roof on posts.
    for (const [a, b] of [
      [-1, 1],
      [1, 1],
    ] as const)
      wround(l, ...off(l, 0.78, 0.66, a * 0.15, b * 0.12), 0.006, 0.006, 0.034, 0.1, timber, 6);
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
    ] as const)
      wround(l, ...off(l, 0.78, 0.66, a * 0.15, b * 0.12), 0.006, 0.006, 0.034, 0.1, timber, 6);
    wbox(l, 0.78, 0.66, 0.134, 0.34, 0.01, 0.28, '#7a5a3a', 0, 0.08);
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 2; k++)
        wbox(l, 0.7 + i * 0.07, 0.62 + k * 0.1, 0.034, 0.05, 0.05, 0.034, tone('#c06a4a', 0.2));
    // Clay pit with a pugmill turned by a horse, a barrow and fresh moulded bricks on boards.
    wround(l, 0.18, 0.72, 0.1, 0.12, 0.03, 0.01, '#6a4a30', 14);
    wround(l, 0.18, 0.72, 0.08, 0.08, 0.04, 0.004, '#8a5a3a', 14);
    wround(l, 0.3, 0.2, 0.03, 0.036, 0.034, 0.05, '#6a5a48', 10);
    l.beam([0.3, 0.084, 0.2], [0.42, 0.084, 0.2], 0.006, '#6b4a2a');
    horse(l, 0.42, 0.2, 1.3, '#8a5a3a');
    for (let i = 0; i < 10; i++)
      wbox(
        l,
        0.46 + (i % 5) * 0.045,
        0.52 + Math.floor(i / 5) * 0.04,
        0.036,
        0.036,
        0.02,
        0.022,
        tone('#b0503a', 0.2),
      );
    wheelbarrow(l, 0.34, 0.6, 0.5, '#b0503a');
    heap(l, 0.12, 0.4, 0.06, '#6a3a2a', 0.06);
    heap(l, 0.9, 0.3, 0.05, '#2a2826', 0.05);
    logPile(l, 0.88, 0.14, 0, 3, 0.12);
    barrel(l, 0.56, 0.84);
    railing(l, 0.06, 0.94, 0.95);
    cypress(l, 0.08, 0.1, 0.22);
    birds(l, [
      [0.6, 0.9, 0.036],
      [0.66, 0.9, 0.036],
    ]);
    cat(l, 0.5, 0.46, 0.034, '#c27a3a');
    dog(l, 0.5, 0.74, 0.5);
    workers(l, [
      [0.46, 0.5, '#8a4a3a', '#3a3a3c'],
      [0.24, 0.6, '#5a7a9a', '#d9c38a'],
      [0.64, 0.72, '#c9a83a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.9, 0.5, 0.14);
  },

  downdraft_kiln(l) {
    site(l, 'downdraft_kiln', '#98785a', [0.05, 0.06, 0.95, 0.94]);
    const kx = 0.4;
    const kz = 0.36;
    // Round brick downdraft kiln: domed crown, buttresses, iron hoops and six fire mouths.
    wround(l, kx, kz, 0.17, 0.17, 0.034, 0.16, '#a8503a', 24);
    bands(l, kx, kz, 0.034, 0.16, 0.17, 4);
    l.dome(kx, kz, 0.17, 0.17, 0.194, 0.12, '#8a4430');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      wbox(
        l,
        ...off(l, kx, kz, Math.cos(a) * 0.17, Math.sin(a) * 0.17),
        0.034,
        0.03,
        0.17,
        0.04,
        '#7a3a2a',
        -a,
      );
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.25 + i * 0.125);
      mouth(l, ...off(l, kx, kz, Math.cos(a) * 0.178, Math.sin(a) * 0.178), 0.054, 0.04, 0.05);
    }
    wround(l, kx, kz, 0.03, 0.036, 0.3, 0.05, '#8a4430', 10);
    smoke(l, kx, kz, 0.35, 3);
    // Tall brick chimney joined to the kiln floor by an underground flue.
    stack(l, 0.78, 0.2, 0.034, 0.3, 0.034, '#9c5640', 5);
    for (const y of [0.12, 0.2, 0.28]) wround(l, 0.78, 0.2, 0.03, 0.03, y, 0.008, iron, 12);
    wbox(l, 0.6, 0.3, 0.036, 0.26, 0.012, 0.03, '#6a5a48');
    // Setters' shed: fired bricks being loaded on handcarts, stacks sorted by colour.
    boardBody(l, 0.8, 0.62, 0.24, 0.18, 0.034, 0.1, '#8a7a62');
    tinGable(l, 0.8, 0.62, 'x', 0.24, 0.18, 0.134, 0.05, slate, '#8a7a62');
    door(l, 0.8, 0.62, 0.24, 0.18, '+z', 0, 0.034, 0.06, 0.08, '#2a1c12');
    blockStack(l, 0.14, 0.74, 0.034, 3, 2, 3, '#b0503a', 0.036);
    blockStack(l, 0.28, 0.82, 0.034, 3, 2, 2, '#c06a4a', 0.036);
    blockStack(l, 0.5, 0.82, 0.034, 2, 2, 3, '#a8503a', 0.036);
    wheelbarrow(l, 0.62, 0.78, 0.5, '#b0503a');
    wheelbarrow(l, 0.16, 0.56, 1.2, '#c06a4a');
    heap(l, 0.12, 0.3, 0.06, '#2a2826', 0.06);
    logPile(l, 0.9, 0.4, Math.PI / 2, 3, 0.12);
    rainButt(l, 0.7, 0.5);
    barrel(l, 0.4, 0.62);
    flowerRow(l, 0.8, 0.74, 0.18, '#f0c24a', 6);
    railing(l, 0.06, 0.94, 0.96);
    cypress(l, 0.08, 0.1, 0.24);
    birds(l, [
      [0.56, 0.7, 0.036],
      [0.6, 0.7, 0.036],
      [0.4, 0.2, 0.3],
    ]);
    cat(l, 0.6, 0.5, 0.034, '#3a3a3c');
    workers(l, [
      [0.34, 0.66, '#8a4a3a', '#3a3a3c'],
      [0.6, 0.6, '#5a7a9a', '#3a3a3c'],
      [0.2, 0.66, '#c9a83a', '#d9c38a'],
    ]);
    lanternPost(l, 0.06, 0.5, 0.15);
    lanternPost(l, 0.92, 0.76, 0.15);
  },

  kiln_works(l) {
    site(l, 'kiln_works', '#94735a', [0.05, 0.06, 0.95, 0.94]);
    const kx = 0.46;
    const kz = 0.36;
    // Hoffman annular kiln: a long oval brick vault with arched loading doors all round
    // and a tall central stack.
    vault(l, kx, kz, 0.1, 0.56, 0.17, 0.08, '#8a4430');
    brickBody(l, kx, kz, 0.56, 0.3, 0.034, 0.08, '#a8503a');
    for (let i = 0; i < 6; i++) {
      const x = -0.22 + i * 0.088;
      wbox(l, ...off(l, kx, kz, x, 0.152), 0.044, 0.06, 0.008, 0.012, iron);
      wbox(
        l,
        ...off(l, kx, kz, x, 0.153),
        0.046,
        0.05,
        0.05,
        0.008,
        i % 2 ? '#7a3a2a' : hot,
        0,
        0,
        i % 2 ? 0 : 1,
      );
    }
    for (let i = 0; i < 6; i++)
      wbox(l, ...off(l, kx, kz, -0.25 + i * 0.1, 0), 0.114, 0.012, 0.28, 0.01, iron);
    for (const sx of [-1, 1])
      l.shape(
        new THREE.CylinderGeometry(0.15, 0.15, 0.08, 18),
        '#8a4430',
        ...off(l, kx, kz, sx * 0.28, 0),
        0.074,
      );
    stack(l, kx, kz, 0.14, 0.38, 0.04, '#9c5640', 5);
    for (const y of [0.22, 0.3, 0.4]) wround(l, kx, kz, 0.036, 0.036, y, 0.008, iron, 12);
    ladder(l, kx, kz + 0.04 / l.spanZ, 0.14, 0.3, '+z');
    // Drying shed with louvres, brick press house and a loading yard on a narrow-gauge line.
    boardBody(l, 0.8, 0.7, 0.26, 0.2, 0.034, 0.1, '#8a7a62');
    tinGable(l, 0.8, 0.7, 'x', 0.26, 0.2, 0.134, 0.05, '#6a6a70', '#8a7a62');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, 0.8, 0.7, -0.09 + i * 0.045, 0.102), 0.08, 0.03, 0.004, 0.004, '#4a3a2a');
    brickBody(l, 0.16, 0.74, 0.2, 0.2, 0.034, 0.12, '#8a4a38');
    tinGable(l, 0.16, 0.74, 'x', 0.2, 0.2, 0.154, 0.05, slate, '#8a4a38');
    stack(l, 0.1, 0.66, 0.034, 0.28, 0.02, '#9c5640', 3);
    railLine(l, 0.04, 0.94, 0.96, 0.94, 0.034, { steel: false });
    wagon(l, 0.34, 0.94, 0, '#c06a4a', 0.042, '#5a4a3a');
    wagon(l, 0.56, 0.94, 0, '#c06a4a', 0.042, '#5a4a3a');
    blockStack(l, 0.5, 0.78, 0.034, 3, 2, 3, '#b0503a', 0.036);
    blockStack(l, 0.36, 0.78, 0.034, 2, 2, 2, '#c06a4a', 0.036);
    heap(l, 0.9, 0.2, 0.07, '#1f1f1f', 0.06);
    heap(l, 0.12, 0.3, 0.06, '#6a3a2a', 0.06);
    wheelbarrow(l, 0.66, 0.56, 0.3, '#b0503a');
    barrel(l, 0.94, 0.52);
    pylon(l, 0.94, 0.4, 0.3);
    cypress(l, 0.07, 0.1, 0.22);
    birds(l, [
      [0.56, 0.6, 0.036],
      [0.6, 0.6, 0.036],
      [0.4, 0.2, 0.18],
    ]);
    cat(l, 0.4, 0.62, 0.034, '#c27a3a');
    workers(l, [
      [0.44, 0.58, '#8a4a3a', '#3a3a3c'],
      [0.58, 0.64, '#5a7a9a', '#3a3a3c'],
      [0.26, 0.64, '#c9a83a', '#d9c38a'],
      [0.74, 0.54, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.06, 0.5, 0.16);
    lanternPost(l, 0.66, 0.6, 0.16);
  },

  tunnel_kiln_works(l) {
    site(l, 'tunnel_kiln_works', '#7a7468', [0.04, 0.06, 0.96, 0.94]);
    // Long tunnel-kiln hall running across the lot: brick walls, a steel roof with exhaust
    // stacks, gas manifold pipes and a rail-car track through both ends.
    const hx = 0.5;
    const hz = 0.34;
    brickBody(l, hx, hz, 0.72, 0.22, 0.034, 0.14, '#8a4a38');
    windows4(l, hx, hz, 0.72, 0.22, 0.09, 0.04, { frame: '#d8dde0' });
    cornice(l, hx, hz, 0.72, 0.22, 0.172, '#cfc9b9');
    vault(l, hx, hz, 0.174, 0.72, 0.12, 0.05, '#6e7b82');
    for (const x of [-0.24, -0.04, 0.16, 0.34]) {
      wround(l, ...off(l, hx, hz, x, -0.04), 0.014, 0.016, 0.2, 0.12, '#9aa4a8', 10);
      smoke(l, ...off(l, hx, hz, x, -0.04), 0.33, 2);
    }
    for (const sx of [-1, 1]) {
      wbox(l, ...off(l, hx, hz, sx * 0.372, 0), 0.034, 0.1, 0.18, 0.14, '#3a3836');
      mouth(l, ...off(l, hx, hz, sx * 0.372, 0.072), 0.08, 0.06, 0.05);
    }
    stack(l, 0.9, 0.2, 0.034, 0.64, 0.032, '#9c5640', 4);
    for (const y of [0.2, 0.34, 0.5]) wround(l, 0.9, 0.2, 0.029, 0.029, y, 0.008, iron, 12);
    pipe(
      l,
      pt(off(l, hx, hz, -0.3, 0.12), 0.2),
      pt(off(l, hx, hz, 0.3, 0.12), 0.2),
      0.008,
      '#b0463a',
    );
    for (const x of [-0.2, 0, 0.2])
      l.beam(p3(off(l, hx, hz, x, 0.12), 0.2), p3(off(l, hx, hz, x, 0.12), 0.14), 0.005, '#b0463a');
    for (let i = 0; i < 4; i++) gauge2(l, ...off(l, hx, hz, -0.24 + i * 0.16, 0.13), 0.1);
    // Rail cars loaded with bricks on the through track, and a transfer car.
    railLine(l, 0.02, 0.34, 0.98, 0.34, 0.034, { steel: true });
    for (const x of [0.12, 0.88]) {
      wbox(l, x, 0.34, 0.05, 0.1, 0.014, 0.07, '#4a4f54');
      blockStack(l, x, 0.34, 0.064, 2, 1, 3, '#c06a4a', 0.03);
    }
    // Packing shed, fan house with a big blower and cooling duct, loading dock and trucks.
    boardBody(l, 0.18, 0.7, 0.28, 0.2, 0.034, 0.1, '#9a8a72');
    tinGable(l, 0.18, 0.7, 'x', 0.28, 0.2, 0.134, 0.05, '#7a8a92', '#9a8a72');
    for (let i = 0; i < 5; i++)
      wbox(l, ...off(l, 0.18, 0.7, -0.1 + i * 0.05, 0.102), 0.074, 0.03, 0.004, 0.004, '#4a3a2a');
    wround(l, 0.7, 0.7, 0.07, 0.07, 0.034, 0.04, '#7a8a92', 14);
    cyl(l, 0.7, 0.7, 0.07, 0.06, 0.02, 0, '#aeb7bb', 12);
    pipe(l, pt([0.7, 0.7], 0.14), pt([0.7, 0.5], 0.14), 0.016, '#9aa4a8');
    pipe(l, pt([0.7, 0.5], 0.14), pt(off(l, hx, hz, 0.2, 0.11), 0.14), 0.016, '#9aa4a8');
    wbox(l, 0.5, 0.78, 0.04, 0.5, 0.012, 0.08, '#8a8a90');
    truck(l, 0.42, 0.88, 0, '#e8e4d8');
    truck(l, 0.62, 0.88, 0, '#3f5a8a');
    for (let i = 0; i < 6; i++)
      crate(l, 0.4 + (i % 3) * 0.05, 0.78 + Math.floor(i / 3) * 0.04, 0.052, '#c06a4a');
    blockStack(l, 0.9, 0.64, 0.034, 3, 2, 3, '#b0503a', 0.036);
    pylon(l, 0.94, 0.9, 0.34);
    pylon(l, 0.06, 0.9, 0.34);
    l.beam([0.06, 0.28, 0.9], [0.94, 0.28, 0.9], 0.002, '#1c1c1c');
    cypress(l, 0.07, 0.14, 0.24);
    birds(l, [
      [0.52, 0.5, 0.036],
      [0.56, 0.5, 0.036],
      [0.3, 0.2, 0.2],
    ]);
    cat(l, 0.5, 0.58, 0.034, '#3a3a3c');
    workers(l, [
      [0.32, 0.56, '#e8742a', '#f2cf4a'],
      [0.62, 0.56, '#e8742a', '#f2cf4a'],
      [0.5, 0.68, '#5a7a9a', '#3a3a3c'],
      [0.82, 0.8, '#6a8a5a', '#3a3a3c'],
    ]);
    lanternPost(l, 0.08, 0.56, 0.17);
    lanternPost(l, 0.92, 0.5, 0.17);
  },

  ceramics_manufactory(l) {
    site(l, 'ceramics_manufactory', '#8f8576', [0.04, 0.05, 0.96, 0.95]);
    const hx = 0.42;
    const hz = 0.34;
    // Showroom and works: whitewashed brick with a pantile roof, arched display windows and
    // a glazed-tile frieze.
    brickBody(l, hx, hz, 0.56, 0.3, 0.034, 0.18, '#e3d9bf');
    windows4(l, hx, hz, 0.56, 0.3, 0.1, 0.05, { frame: '#8a6a48' });
    for (let i = 0; i < 12; i++)
      wbox(
        l,
        ...off(l, hx, hz, -0.25 + i * 0.045, 0.153),
        0.19,
        0.03,
        0.03,
        0.004,
        ['#2f5f86', '#e8e4d8'][i % 2]!,
      );
    cornice(l, hx, hz, 0.56, 0.3, 0.214, '#c9c2ae');
    door(l, hx, hz, 0.56, 0.3, '+z', 0, 0.034, 0.1, 0.12, '#2f5f86', true);
    tinGable(l, hx, hz, 'x', 0.56, 0.3, 0.226, 0.08, '#b0463a', '#e3d9bf');
    steps(l, ...off(l, hx, hz, 0, 0.155), 0.1, 3);
    for (const sx of [-1, 1]) downpipe(l, ...off(l, hx, hz, sx * 0.29, 0.155), 0.034, 0.18);
    // Three bottle kilns, the signature of a pottery, each with a smoking neck.
    for (const [i, x] of [
      [0, 0.8],
      [1, 0.88],
      [2, 0.72],
    ] as const) {
      const z = 0.2 + i * 0.12;
      const r = 0.07 - i * 0.006;
      const bottle = new THREE.LatheGeometry(
        [
          [0.0, 0.0],
          [r, 0.0],
          [r * 1.05, 0.1],
          [r * 0.85, 0.2],
          [r * 0.4, 0.3],
          [r * 0.34, 0.4],
          [r * 0.42, 0.42],
          [0.0, 0.42],
        ].map(([rx, y]) => new THREE.Vector2(rx!, y!)),
        18,
      );
      bottle.scale(1, 1.65, 1);
      l.shape(bottle, '#a8503a', x, z, 0.034);
      bands(l, x, z, 0.04, 0.2, r * 1.0, 3);
      mouth(l, ...off(l, x, z, 0, r * 1.02), 0.05, 0.04, 0.05);
      smoke(l, x, z, 0.74, 3);
    }
    // Pottery court: throwing wheels, a drying rack of pots, a decorative china fountain,
    // crated tableware and a delivery cart with a horse.
    for (let i = 0; i < 2; i++) {
      wbox(l, 0.14 + i * 0.12, 0.66, 0.034, 0.05, 0.04, 0.05, '#6b4a2a');
      wround(l, 0.14 + i * 0.12, 0.66, 0.02, 0.02, 0.074, 0.01, '#8a6a48', 10);
      wround(l, 0.14 + i * 0.12, 0.66, 0.012, 0.014, 0.084, 0.024, '#c06a4a', 8);
    }
    for (let k = 0; k < 2; k++)
      for (let i = 0; i < 6; i++)
        wround(
          l,
          0.1 + i * 0.05,
          0.84,
          0.012,
          0.01,
          0.07 + k * 0.034,
          0.026,
          ['#2f5f86', '#e8e4d8', '#c06a4a'][i % 3]!,
          8,
        );
    wbox(l, 0.2, 0.84, 0.06, 0.34, 0.008, 0.05, '#8a6a48');
    wbox(l, 0.2, 0.84, 0.094, 0.34, 0.008, 0.05, '#8a6a48');
    wround(l, 0.5, 0.66, 0.05, 0.054, 0.034, 0.02, '#e8e4d8', 14);
    wround(l, 0.5, 0.66, 0.044, 0.044, 0.05, 0.004, '#6fb3c8', 14);
    wround(l, 0.5, 0.66, 0.01, 0.014, 0.05, 0.05, '#2f5f86', 8);
    for (let i = 0; i < 4; i++)
      crate(l, 0.66 + (i % 2) * 0.05, 0.62 + Math.floor(i / 2) * 0.04, 0.034, '#8a6a48');
    wbox(l, 0.68, 0.82, 0.07, 0.14, 0.012, 0.07, '#6b4a2a');
    for (const t of [-1, 1])
      disc(l, ...off(l, 0.68, 0.82, 0, t * 0.04), 0.036, 0.026, 0.006, '#2c2a28');
    for (let i = 0; i < 3; i++) crate(l, 0.68 + (i - 1) * 0.04, 0.82, 0.082, '#c9a56c');
    horse(l, 0.84, 0.84, 0.3, '#8a5a3a');
    flowerRow(l, ...off(l, hx, hz, -0.18, 0.18), 0.14, '#d6455a', 7);
    flowerRow(l, ...off(l, hx, hz, 0.18, 0.18), 0.14, '#2f5f86', 7);
    cobbles(l, 0.3, 0.52, 0.6, 0.6, 18, 0.036, '#c9c2ae');
    cypress(l, 0.06, 0.12, 0.26);
    birds(
      l,
      [
        [0.5, 0.54, 0.036],
        [0.55, 0.54, 0.036],
        [0.4, 0.2, 0.226],
      ],
      '#f1ece2',
    );
    cat(l, ...off(l, hx, hz, 0.12, 0.17), 0.04, '#c27a3a');
    butterflies(l, [
      [0.3, 0.7, 0.12],
      [0.6, 0.76, 0.1],
    ]);
    workers(l, [
      [0.12, 0.74, '#5a7a9a', '#3a3a3c'],
      [0.36, 0.7, '#b0463a', '#d9c38a'],
      [0.6, 0.72, '#6a8a5a', '#3a3a3c'],
      [0.8, 0.64, '#8a5a8a', '#d9c38a'],
    ]);
    lanternPost(l, 0.1, 0.56, 0.16);
    lanternPost(l, 0.56, 0.58, 0.16);
  },
};

const hot = '#ff8a2a';

/** Gas valve wheel on a short post, used on the kiln manifold. */
function gauge2(l: Lot, x: number, z: number, y: number): void {
  wbox(l, x, z, y, 0.006, 0.03, 0.006, '#4a4f54');
  wround(l, x, z, 0.01, 0.01, y + 0.03, 0.006, '#b0463a', 10);
}
