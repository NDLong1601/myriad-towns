import * as THREE from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { box, gable, part, shade } from '../modelParts';

type Point = readonly [x: number, y: number, z: number];
export type Recipe = (lot: Lot) => void;
export type Recipes = Readonly<Record<string, Recipe>>;

/** Model a building within its footprint. Horizontal dimensions are fractions of the lot. */
export class Lot {
  readonly wall: string;
  readonly roof: string;
  readonly height: number;
  private readonly w: number;
  private readonly d: number;

  constructor(
    private readonly parts: THREE.BufferGeometry[],
    def: BuildingDef,
    private readonly turn = false,
  ) {
    this.w = turn ? def.footprint.d : def.footprint.w;
    this.d = turn ? def.footprint.w : def.footprint.d;
    this.wall = def.visual.color ?? '#d8d0c0';
    this.roof = def.visual.roof ?? shade(this.wall, 0.66);
    this.height = def.visual.height ?? 0.6;
  }

  private add(g: THREE.BufferGeometry): void {
    if (this.turn) g.rotateY(-Math.PI / 2).translate(this.d, 0, 0);
    this.parts.push(g);
  }

  block(
    x: number,
    z: number,
    width: number,
    depth: number,
    y: number,
    h: number,
    color = this.wall,
    glow = 0,
  ): void {
    this.add(box(width * this.w, h, depth * this.d, color, x * this.w, z * this.d, y, glow));
  }

  base(color: string, height = 0.035): void {
    this.block(0.5, 0.5, 0.96, 0.96, 0, height, color);
  }

  roofed(
    x: number,
    z: number,
    w: number,
    d: number,
    y: number,
    h: number,
    along: 'x' | 'z' = 'x',
    color = this.wall,
    roof = this.roof,
  ): void {
    this.block(x, z, w, d, y, h, color);
    this.ridge(x, z, w + 0.065, d + 0.065, y + h, h * 0.46, along, roof);
  }

  ridge(
    x: number,
    z: number,
    w: number,
    d: number,
    y: number,
    h: number,
    along: 'x' | 'z' = 'x',
    color = this.roof,
  ): void {
    const width = w * this.w;
    const depth = d * this.d;
    const g =
      along === 'x'
        ? gable(width, h, depth, color, x * this.w, z * this.d, y)
        : gable(depth, h, width, color, 0, 0, y)
            .rotateY(Math.PI / 2)
            .translate(x * this.w, 0, z * this.d);
    this.add(g);
  }

  round(
    x: number,
    z: number,
    top: number,
    bottom: number,
    y: number,
    h: number,
    color = this.wall,
    glow = 0,
  ): void {
    const scale = Math.min(this.w, this.d);
    const g = new THREE.CylinderGeometry(top * scale, bottom * scale, h, 10);
    this.add(part(g, color, x * this.w, y + h / 2, z * this.d, glow));
  }

  dome(
    x: number,
    z: number,
    rx: number,
    rz: number,
    y: number,
    h: number,
    color = this.roof,
  ): void {
    const g = new THREE.SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(rx * this.w, h, rz * this.d);
    this.add(part(g, color, x * this.w, y, z * this.d));
  }

  beam(from: Point, to: Point, thickness: number, color: string): void {
    const a = new THREE.Vector3(from[0] * this.w, from[1], from[2] * this.d);
    const b = new THREE.Vector3(to[0] * this.w, to[1], to[2] * this.d);
    const direction = b.clone().sub(a);
    const g = new THREE.BoxGeometry(thickness, direction.length(), thickness);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
    );
    const center = a.add(b).multiplyScalar(0.5);
    this.add(part(g, color, center.x, center.y, center.z));
  }

  /** A row of small windows on a front-facing wall. */
  windows(x: number, z: number, span: number, y: number, h: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const offset = ((i + 0.5) / count - 0.5) * span;
      this.block(x + offset, z, (span / count) * 0.52, 0.025, y, h, '#7292a0', 0.8);
    }
  }

  tree(x: number, z: number, height: number, color = '#5b884e'): void {
    this.round(x, z, 0.017, 0.022, 0.035, height * 0.64, '#785941');
    this.dome(x, z, 0.08, 0.08, height * 0.47, height * 0.57, color);
  }
}
