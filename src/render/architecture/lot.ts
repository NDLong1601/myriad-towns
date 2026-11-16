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
  private readonly finish: boolean;
  private readonly industrial: boolean;

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
    this.finish = def.id !== 'cottage';
    this.industrial = def.category === 'production' || def.category === 'infrastructure';
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
    if (this.finish && !glow && h >= 0.28 && width >= 0.22 && depth >= 0.22) {
      const edges = [x - width / 2, x + width / 2, z - depth / 2, z + depth / 2];
      if (edges.every((edge) => edge > 0.019 && edge < 0.981)) {
        const count = Math.min(7, Math.max(2, Math.round(h / 0.17)));
        const joint = shade(color, this.industrial ? 0.77 : 0.84);
        const cap = shade(color, 1.16);
        for (let i = 1; i < count; i++) {
          const level = y + (h * i) / count;
          this.add(
            box(
              width * this.w + 0.008,
              0.012,
              depth * this.d + 0.008,
              joint,
              x * this.w,
              z * this.d,
              level,
            ),
          );
        }
        this.add(
          box(
            width * this.w + 0.018,
            0.027,
            depth * this.d + 0.018,
            cap,
            x * this.w,
            z * this.d,
            y + h - 0.026,
          ),
        );
      }
    }
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
    if (this.finish && h >= 0.105) {
      const across = (along === 'x' ? depth : width) / 2;
      const length = along === 'x' ? width : depth;
      const seams = Math.max(4, Math.min(8, Math.round(Math.hypot(across, h) / 0.068)));
      for (const side of [-1, 1]) {
        for (let i = 0; i < seams; i++) {
          const t = (i + 0.28) / seams;
          const offset = side * across * (1 - t);
          const tint = shade(color, (i % 3 === 0 ? 1.18 : 0.79) * (side > 0 ? 1 : 0.97));
          const trim = new THREE.BoxGeometry(length * 0.985, 0.012, 0.021);
          trim.rotateX(Math.atan2(side * h, across));
          if (along === 'z') trim.rotateY(Math.PI / 2);
          this.add(
            part(
              trim,
              tint,
              x * this.w + (along === 'z' ? offset : 0),
              y + t * h + 0.005,
              z * this.d + (along === 'x' ? offset : 0),
            ),
          );
        }
      }
    }
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
    if (this.finish && h >= 0.21 && Math.min(top, bottom) > 0.025) {
      for (const t of [0.19, 0.48, 0.78]) {
        const radius = (bottom + (top - bottom) * t) * scale + 0.004;
        const band = new THREE.CylinderGeometry(radius, radius, 0.016, 10);
        this.add(
          part(band, shade(color, t === 0.78 ? 1.2 : 0.78), x * this.w, y + h * t, z * this.d),
        );
      }
    }
  }

  mansard(x: number, z: number, w: number, d: number, y: number, h: number): void {
    const courses = [1, 0.94, 0.87, 0.79, 0.73, 0.6];
    for (let i = 1; i < courses.length; i++) {
      const bottom = courses[i - 1]!;
      const top = courses[i]!;
      const step = h / (courses.length - 1);
      const panel = new THREE.CylinderGeometry(top, bottom, step, 4);
      panel.rotateY(Math.PI / 4);
      panel.scale((w * this.w) / Math.SQRT2, 1, (d * this.d) / Math.SQRT2);
      this.add(
        part(
          panel,
          shade(this.roof, i % 2 ? 1.05 : 0.86),
          x * this.w,
          y + (i - 0.5) * step,
          z * this.d,
        ),
      );
    }
  }

  vaultedCanopy(x: number, z: number, w: number, d: number, y: number, h: number): void {
    const arch = (angle: number): readonly [number, number] => [
      z + (d / 2) * Math.cos(angle),
      y + h * Math.sin(angle),
    ];
    const ends = [x - w / 2, x + w / 2] as const;
    const bays = 6;
    const segments = 10;
    for (let i = 0; i < segments; i++) {
      const [za, ya] = arch((i * Math.PI) / segments);
      const [zb, yb] = arch(((i + 1) * Math.PI) / segments);
      for (let bay = 0; bay < bays; bay++) {
        const left = (ends[0] + (w * (bay + 0.026)) / bays) * this.w;
        const right = (ends[0] + (w * (bay + 0.974)) / bays) * this.w;
        const start = za * this.d;
        const end = zb * this.d;
        const panel = new THREE.BufferGeometry();
        panel.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(
            [
              left,
              ya,
              start,
              right,
              ya,
              start,
              right,
              yb,
              end,
              left,
              ya,
              start,
              right,
              yb,
              end,
              left,
              yb,
              end,
            ],
            3,
          ),
        );
        panel.computeVertexNormals();
        this.add(part(panel, (bay + i) % 3 === 0 ? '#a7c6bf' : '#799f9e', 0, 0, 0));
      }
      for (let bay = 0; bay <= bays; bay++) {
        const px = ends[0] + (w * bay) / bays;
        this.beam([px, ya + 0.01, za], [px, yb + 0.01, zb], 0.024, '#435556');
      }
      if (i % 2 === 0)
        this.beam([ends[0], ya + 0.014, za], [ends[1], ya + 0.014, za], 0.02, '#506666');
    }
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
      const width = (span / count) * 0.52;
      const wx = x + offset;
      if (this.finish) {
        this.block(wx, z + 0.004, width * 1.2, 0.033, y - 0.009, h + 0.018, '#594d40');
        this.block(wx, z + 0.015, width * 1.3, 0.04, y - 0.012, 0.017, '#c2af8e');
        this.block(wx, z + 0.025, width, 0.016, y, h, '#aebcae', 0.8);
        this.block(wx, z + 0.036, width * 0.11, 0.01, y, h, '#695d4b');
      } else this.block(wx, z, width, 0.025, y, h, '#7292a0', 0.8);
    }
  }

  tree(x: number, z: number, height: number, color = '#5b884e'): void {
    this.round(x, z, 0.017, 0.022, 0.035, height * 0.64, '#785941');
    this.dome(x, z, 0.08, 0.08, height * 0.47, height * 0.57, color);
  }
}
