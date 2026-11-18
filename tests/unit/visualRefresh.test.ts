import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CHUNK_AREA, localIndex } from '@/core/coords';
import { BuildingRenderer } from '@/render/buildingRenderer';
import { FacilityTraffic } from '@/render/facilityTraffic';
import { FloatingOrigin } from '@/render/floatingOrigin';
import { lotFinish } from '@/render/visualPalette';
import { Biome, TileFlag } from '@/world/biomes';
import { hashChunk } from '@/world/chunk';
import { buildTerrainMesh, meshBuffers, WATER_Y } from '@/world/terrainMesh';
import { makeCity } from './helpers';

describe('miniature town finish', () => {
  it('gradients water toward land without painting land or changing chunk data', () => {
    const chunk = {
      cx: 0,
      cz: 0,
      level: new Uint8Array(CHUNK_AREA).fill(7),
      biome: new Uint8Array(CHUNK_AREA).fill(Biome.Temperate),
      flags: new Uint8Array(CHUNK_AREA),
      resource: new Uint8Array(CHUNK_AREA),
    };
    for (let z = 8; z < 19; z++) {
      for (let x = 8; x < 19; x++) {
        const i = localIndex(x, z);
        chunk.flags[i] = TileFlag.Water;
        chunk.level[i] = 0;
        chunk.biome[i] = Biome.Ocean;
      }
    }
    chunk.flags[localIndex(7, 10)] = TileFlag.Tree;
    const hash = hashChunk(chunk);
    const mesh = buildTerrainMesh(91, chunk);
    expect(hashChunk(chunk)).toBe(hash);
    expect(mesh.water.length).toBe(mesh.positions.length / 3);
    expect(meshBuffers(mesh)).toContain(mesh.water.buffer);
    const sample = (x: number, z: number) => {
      const colors: number[] = [];
      for (let i = 0; i < mesh.water.length; i++) {
        if (mesh.water[i] && mesh.positions[i * 3] === x && mesh.positions[i * 3 + 2] === z) {
          expect(mesh.positions[i * 3 + 1]).toBeCloseTo(WATER_Y);
          colors.push(mesh.colors[i * 3 + 1]!);
        }
      }
      return colors;
    };
    const edge = sample(8, 10);
    const deep = sample(12, 12);
    expect(edge).toHaveLength(2);
    expect(deep).toHaveLength(4);
    expect(new Set(deep).size).toBe(1);
    expect(edge[0]).toBe(edge[1]);
    expect(edge[0]).toBeGreaterThan(deep[0]!);
    expect(sample(7, 10)).toEqual([]);
  });

  it('keeps repeat house finishes in one batch after a rebase and a status change', () => {
    const { city } = makeCity();
    const origin = new FloatingOrigin();
    const renderer = new BuildingRenderer(city, origin, () => 0);
    renderer.animate = false;
    const def = city.catalog.get('townhouse');
    const towns = Array.from({ length: 15 }, (_, x) => city._add(def, 1200 + x * 3, 0).building);
    const mesh = renderer.group.children[0] as THREE.InstancedMesh;
    const colors = () =>
      towns.map((_, i) => {
        const color = new THREE.Color();
        mesh.getColorAt(i, color);
        return color.toArray();
      });
    const before = colors();
    expect(renderer.group.children).toHaveLength(1);
    expect(new Set(before.map((c) => c.join())).size).toBe(3);
    expect(before[0]![0]).toBeCloseTo(lotFinish(def.id, 1200, 0).r);
    origin.follow(1200, 0);
    expect(colors()).toEqual(before);
    city._setActive(towns[0]!.uid, false);
    expect(colors()[0]![0]).toBeLessThan(before[0]![0]!);
    city._setActive(towns[0]!.uid, true);
    expect(colors()).toEqual(before);
    renderer.dispose();
  });

  it('animates one wake with a moving boat and freezes the wake on pause', () => {
    const { city, terrain } = makeCity();
    for (let x = 1200; x <= 1204; x++) terrain.special.set(`${x},3`, { flags: TileFlag.Water });
    city._add(city.catalog.get('fishing_harbor'), 1200, 0);
    const origin = new FloatingOrigin();
    const detail = new FacilityTraffic(city, origin, () => WATER_Y, 3, undefined, true);
    const low = new FacilityTraffic(city, origin, () => WATER_Y, 3);
    origin.follow(1200, 0);
    const camera = { x: 1200, z: 0 };
    const wake = detail.group.getObjectByName('vessel-wake') as THREE.InstancedMesh;
    expect(low.group.getObjectByName('vessel-wake')).toBeUndefined();
    detail.update(0, camera, true, false);
    expect(wake.count).toBe(1);
    const flow = wake.geometry.getAttribute('wakeFlow');
    detail.update(1.25, camera, true, false);
    const moving = flow.getX(0);
    expect(moving).toBeGreaterThan(0.5);
    detail.update(1.25, camera, true, true);
    expect(flow.getX(0)).toBe(moving);
    detail.update(0, camera, false, false);
    expect(wake.count).toBe(0);
  });
});
