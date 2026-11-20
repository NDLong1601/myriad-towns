import * as THREE from 'three';
import type { BuildingDef } from '@/sim/catalog';
import {
  barrel,
  crate,
  lanternPost,
  off,
  person,
  rand,
  reseed,
  shrub,
  tone,
  wbox,
  wround,
} from './diorama';
import { dog } from './dioramaProps';
import { type Lot } from './lot';

// Everyday life around homes: residents, pets, laundry, gardens and the tools of each trade.
// Homes keep their own models; this only dresses the free strip of yard between the house
// and the lot edge, kept light because homes are the most common building in a town.

const Y = 0.036;
const coats = [
  '#c84a3a',
  '#3a5a7a',
  '#5a6a4a',
  '#8a5a3a',
  '#6a3a5a',
  '#2f6f9a',
  '#d8a832',
  '#e9e0c8',
];
const hats = ['#3a3a3c', '#8a6a3a', '#e9e0c8', '#2c2c2e'];

type Style = 'rustic' | 'town' | 'grand' | 'highrise';

function styleOf(def: BuildingDef): Style {
  const tags = def.tags ?? [];
  if (tags.includes('highrise')) return 'highrise';
  if (/villa|manor|mansion|estate|court|condominium/.test(def.id)) return 'grand';
  if (/hut|cottage|cabin|homestead|lodge|dormitory|yurt/.test(def.id) || tags.includes('starter'))
    return 'rustic';
  return 'town';
}

const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;

function resident(l: Lot, x: number, z: number): void {
  person(l, x, z, Y, pick(coats), pick(hats));
}

/** Child: a smaller figure. */
function child(l: Lot, x: number, z: number): void {
  const c = pick(coats);
  for (const s of [-0.003, 0.003])
    wbox(l, ...off(l, x, z, s, 0), Y, 0.004, 0.016, 0.005, '#3c4a5e');
  wbox(l, x, z, Y + 0.016, 0.012, 0.018, 0.009, c);
  wround(l, x, z, 0.0055, 0.0055, Y + 0.034, 0.01, '#e8c4a0', 8);
}

function cat(l: Lot, x: number, z: number, ry: number): void {
  const c = pick(['#d8843a', '#3a3a3c', '#e9e0c8', '#8a8274']);
  wbox(l, x, z, Y, 0.02, 0.01, 0.009, c, ry);
  wbox(
    l,
    ...off(l, x, z, Math.cos(ry) * 0.012, -Math.sin(ry) * 0.012),
    Y + 0.006,
    0.008,
    0.009,
    0.008,
    c,
    ry,
  );
  l.beam(
    [x, Y + 0.008, z],
    [x - (Math.cos(ry) * 0.016) / l.spanX, Y + 0.02, z + (Math.sin(ry) * 0.016) / l.spanZ],
    0.003,
    c,
  );
}

function hens(l: Lot, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const [hx, hz] = off(l, x, z, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.04);
    const c = rand() < 0.5 ? '#f2efe6' : '#a0582e';
    wbox(l, hx, hz, Y + 0.004, 0.012, 0.01, 0.008, c, rand() * 3);
    wbox(l, hx, hz, Y + 0.012, 0.004, 0.004, 0.004, '#c8392c');
  }
}

/** Washing line between two posts with clothes pegged out. */
function laundry(l: Lot, x0: number, z0: number, x1: number, z1: number): void {
  for (const [x, z] of [
    [x0, z0],
    [x1, z1],
  ] as const)
    wbox(l, x, z, Y, 0.005, 0.09, 0.005, '#6b4a2c');
  l.beam([x0, Y + 0.085, z0], [x1, Y + 0.085, z1], 0.0015, '#e9e4d6');
  const ry = -Math.atan2((z1 - z0) * l.spanZ, (x1 - x0) * l.spanX);
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    wbox(l, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, Y + 0.05, 0.022, 0.032, 0.002, pick(coats), ry);
  }
}

function woodpile(l: Lot, x: number, z: number, ry = 0): void {
  for (let k = 0; k < 3; k++)
    for (let i = 0; i < 4 - k; i++) {
      const g = new THREE.CylinderGeometry(0.007, 0.007, 0.06, 5).rotateZ(Math.PI / 2).rotateY(ry);
      const t = (i - (3 - k) / 2) * 0.014;
      l.shape(
        g,
        tone('#8a6a48', 0.12),
        ...off(l, x, z, -Math.sin(ry) * t, Math.cos(ry) * t),
        Y + 0.007 + k * 0.012,
      );
    }
}

function vegPatch(l: Lot, x: number, z: number, w: number, d: number): void {
  wbox(l, x, z, Y - 0.002, w, 0.006, d, '#6f4c34');
  for (let i = 0; i < 6; i++)
    shrub(
      l,
      ...off(l, x, z, (rand() - 0.5) * (w - 0.01), (rand() - 0.5) * (d - 0.01)),
      0.008,
      pick(['#4f8a3a', '#7aa85a', '#c84a3a']),
    );
}

function pots(l: Lot, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const [px, pz] = off(l, x, z, (i - (n - 1) / 2) * 0.018, 0);
    wround(l, px, pz, 0.007, 0.005, Y, 0.012, '#b4613f', 8);
    shrub(l, px, pz, 0.008, pick(['#d84a6a', '#e8c84a', '#8a6ab8', '#4f8a3a']));
  }
}

function bench(l: Lot, x: number, z: number, ry: number): void {
  wbox(l, x, z, Y + 0.012, 0.05, 0.004, 0.016, '#7a5634', ry);
  for (const s of [-1, 1])
    wbox(
      l,
      ...off(l, x, z, Math.cos(ry) * s * 0.02, -Math.sin(ry) * s * 0.02),
      Y,
      0.004,
      0.012,
      0.014,
      '#3a3530',
      ry,
    );
}

function bicycle(l: Lot, x: number, z: number, ry: number): void {
  for (const s of [-1, 1]) {
    const w = new THREE.TorusGeometry(0.009, 0.0015, 4, 10).rotateY(ry);
    l.shape(
      w,
      '#2c2c2e',
      ...off(l, x, z, Math.cos(ry) * s * 0.012, -Math.sin(ry) * s * 0.012),
      Y + 0.009,
    );
  }
  wbox(l, x, z, Y + 0.012, 0.024, 0.003, 0.003, pick(['#c8392c', '#2f6f9a', '#3f8a6a']), ry);
  wbox(l, x, z, Y + 0.018, 0.004, 0.012, 0.003, '#2c2c2e', ry);
}

function cafeTable(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.012, 0.012, Y + 0.022, 0.002, '#e9e4d6', 10);
  wround(l, x, z, 0.002, 0.002, Y, 0.022, '#2c2c2e', 4);
  l.shape(
    new THREE.ConeGeometry(0.03, 0.014, 8),
    pick(['#c8392c', '#2f6f9a', '#3f8a6a']),
    x,
    z,
    Y + 0.066,
  );
  wround(l, x, z, 0.0015, 0.0015, Y + 0.022, 0.04, '#e9e4d6', 4);
}

function topiary(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.01, 0.008, Y, 0.014, '#a49c8c', 8);
  l.shape(new THREE.SphereGeometry(0.014, 8, 6), '#3f6a3a', x, z, Y + 0.028);
}

function birdbath(l: Lot, x: number, z: number): void {
  wround(l, x, z, 0.004, 0.006, Y, 0.03, '#c4bea8', 8);
  wround(l, x, z, 0.016, 0.01, Y + 0.03, 0.006, '#c4bea8', 10);
  wround(l, x, z, 0.013, 0.013, Y + 0.036, 0.001, '#5fa2b8', 10);
}

/** Fishing nets drying on a frame, with a basket of fish. */
function nets(l: Lot, x: number, z: number): void {
  for (const s of [-1, 1]) wbox(l, ...off(l, x, z, s * 0.03, 0), Y, 0.004, 0.06, 0.004, '#6b4a2c');
  wbox(l, x, z, Y + 0.02, 0.06, 0.04, 0.002, '#7a8a6a');
  wround(l, ...off(l, x, z, 0, 0.02), 0.01, 0.008, Y, 0.012, '#a07a4a', 8);
}

/** Places a small scene in each free corner/edge spot, chosen by the home's style. */
export function housingLife(l: Lot, def: BuildingDef): void {
  // Mirrored row variants (_east/_south) share one layout, so the south one is an exact turn.
  reseed(`life:${def.id.replace(/_(east|south)$/, '')}`);
  const style = styleOf(def);
  const tags = def.tags ?? [];
  // Front strip (+z) and back strip (-z), left and right corners, kept clear of the house.
  const front = 0.92;
  const back = 0.08;
  const left = 0.1;
  const right = 0.9;

  // Residents in the front yard; a child and a pet in most homes.
  resident(l, 0.3 + rand() * 0.1, front);
  if (rand() < 0.6) child(l, 0.62 + rand() * 0.08, front + 0.01);
  if (rand() < 0.5) dog(l, 0.72, front - 0.02, rand() * 3, pick(['#8a6a48', '#3a3a3c', '#d8b27a']));
  else cat(l, right - 0.02, front - 0.03, rand() * 3);

  if (style === 'rustic') {
    woodpile(l, left, back + 0.04, Math.PI / 2);
    hens(l, right - 0.04, back + 0.04, 3);
    laundry(l, left, 0.3, left, 0.62);
    vegPatch(l, right, 0.5, 0.06, 0.16);
    if (rand() < 0.5) barrel(l, right - 0.02, front - 0.08);
  } else if (style === 'town') {
    pots(l, left + 0.02, front, 3);
    bench(l, right - 0.04, 0.5, Math.PI / 2);
    bicycle(l, left, 0.5, Math.PI / 2);
    laundry(l, 0.3, back, 0.7, back);
    if (rand() < 0.5) crate(l, right - 0.02, back + 0.04, Y, '#8a6a48', 0.3);
  } else if (style === 'grand') {
    topiary(l, left, front - 0.04);
    topiary(l, right, front - 0.04);
    birdbath(l, left, 0.5);
    bench(l, right, 0.5, Math.PI / 2);
    resident(l, left + 0.06, back + 0.04);
    lanternPost(l, right - 0.04, back + 0.04, 0.12);
  } else {
    for (let i = 0; i < 3; i++) bicycle(l, left + i * 0.04, back + 0.02, 0);
    pots(l, 0.5, back + 0.02, 4);
    cafeTable(l, right - 0.04, front - 0.06);
    cafeTable(l, right - 0.04, 0.6);
    resident(l, right - 0.08, 0.66);
    resident(l, left, 0.5);
  }

  // Bigger lots get a busier yard: more people strolling along the front and sides, and a
  // bench or bicycles between them.
  const extra = Math.round(l.spanX * l.spanZ * 2);
  for (let i = 0; i < extra; i++) {
    const t = (i + 0.5) / extra;
    if (i % 2 === 0) resident(l, 0.15 + t * 0.7, front - 0.01);
    else resident(l, i % 4 === 1 ? left - 0.02 : right + 0.02, 0.2 + t * 0.6);
    if (i % 3 === 2) {
      if (style === 'highrise' || style === 'town') bicycle(l, 0.2 + t * 0.6, front + 0.02, 0);
      else bench(l, 0.2 + t * 0.6, front + 0.02, 0);
    }
  }

  // Trades: tools of the household's work by the back door.
  if (/fisher|harbor|maritime/.test(def.id) || tags.includes('coastal')) nets(l, 0.5, back + 0.02);
  else if (/miner/.test(def.id)) {
    wbox(l, 0.5, back + 0.03, Y, 0.04, 0.016, 0.026, '#4a4440');
    wbox(l, 0.5, back + 0.03, Y + 0.016, 0.036, 0.008, 0.022, '#7a4a3a');
  } else if (/lumberjack|forester/.test(def.id)) woodpile(l, 0.5, back + 0.03, 0);
}
