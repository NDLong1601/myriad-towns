import { describe, expect, it } from 'vitest';
import { PlaceCommand, DemolishCommand } from '@/sim/commands';
import { BuildingRenderer } from '@/render/buildingRenderer';
import { ROAD_E, ROAD_N, ROAD_S, ROAD_W, buildingGeometry } from '@/render/buildingModels';
import { FloatingOrigin } from '@/render/floatingOrigin';
import { makeCity } from './helpers';

function setup() {
  const { city, history } = makeCity();
  city.stock.stone = 1e6;
  const r = new BuildingRenderer(city, new FloatingOrigin(), () => 0);
  r.animate = false;
  const mask = (x: number, z: number): number => r.variantOf(city.at(x, z)?.uid ?? -1);
  return { city, history, r, mask };
}

describe('road auto-tiling', () => {
  it('a lone road has no connections; neighbours connect both ways', () => {
    const { history, mask } = setup();
    history.run(new PlaceCommand('road', 5, 5));
    expect(mask(5, 5)).toBe(0);
    history.run(new PlaceCommand('road', 6, 5));
    expect(mask(5, 5)).toBe(ROAD_E);
    expect(mask(6, 5)).toBe(ROAD_W);
  });

  it('builds a crossing and reverts when a tile is removed', () => {
    const { city, history, mask } = setup();
    for (const [x, z] of [
      [5, 5],
      [4, 5],
      [6, 5],
      [5, 4],
      [5, 6],
    ] as const)
      history.run(new PlaceCommand('road', x, z));
    expect(mask(5, 5)).toBe(ROAD_E | ROAD_W | ROAD_S | ROAD_N);
    expect(mask(4, 5)).toBe(ROAD_E);
    const uid = city.at(5, 4)!.uid;
    history.run(new DemolishCommand(uid));
    expect(mask(5, 5)).toBe(ROAD_E | ROAD_W | ROAD_S);
    history.undo();
    expect(mask(5, 5)).toBe(ROAD_E | ROAD_W | ROAD_S | ROAD_N);
  });

  it('keeps every road drawn exactly once while retiling', () => {
    const { city, history, r } = setup();
    for (let i = 0; i < 40; i++) history.run(new PlaceCommand('road', i, 0));
    for (let i = 0; i < 40; i += 3) history.run(new PlaceCommand('road', i, 1));
    expect(r.drawnCount).toBe(city.count);
  });

  it('every mask has a valid model with the glow attribute; junctions get a lit lamp', () => {
    const { city } = setup();
    const def = city.catalog.get('road');
    for (let m = 0; m < 16; m++) {
      const g = buildingGeometry(def, m);
      expect(g.getAttribute('glow').count).toBe(g.getAttribute('position').count);
    }
    const lit = (m: number): number =>
      Array.from(buildingGeometry(def, m).getAttribute('glow').array).filter((v) => v > 0).length;
    expect(lit(ROAD_E | ROAD_W)).toBe(0); // straight: no lamp
    expect(lit(ROAD_E | ROAD_W | ROAD_S)).toBeGreaterThan(0); // T junction
    expect(lit(ROAD_E)).toBeGreaterThan(0); // dead end
  });

  it('houses have lit windows', () => {
    const { city } = setup();
    const g = buildingGeometry(city.catalog.get('hut'));
    expect(Array.from(g.getAttribute('glow').array).some((v) => v > 0)).toBe(true);
  });

  it('keeps the carriageway width at connected edges and raises lamps as roads upgrade', () => {
    const { city } = setup();
    const mask = ROAD_E | ROAD_W | ROAD_S;
    const lampHeights = ['road', 'stone_road', 'brick_road'].map((id) => {
      const g = buildingGeometry(city.catalog.get(id), mask);
      const vertices = g.getAttribute('position');
      const glow = g.getAttribute('glow');
      const edge: number[] = [];
      let height = 0;
      for (let i = 0; i < vertices.count; i++) {
        if (vertices.getX(i) === 1) edge.push(vertices.getZ(i));
        if (glow.getX(i)) height = Math.max(height, vertices.getY(i));
      }
      expect(Math.min(...edge)).toBeCloseTo(0.07, 2);
      expect(Math.max(...edge)).toBeCloseTo(0.93, 2);
      return height;
    });
    expect(lampHeights[0]).toBeLessThan(lampHeights[1]!);
    expect(lampHeights[1]).toBeLessThan(lampHeights[2]!);
  });
});
