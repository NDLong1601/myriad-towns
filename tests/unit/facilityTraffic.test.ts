import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FacilityTraffic } from '@/render/facilityTraffic';
import { FloatingOrigin } from '@/render/floatingOrigin';
import { TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

function setup() {
  const { city, terrain } = makeCity();
  const origin = new FloatingOrigin();
  const traffic = new FacilityTraffic(city, origin, () => 0, 3);
  const add = (id: string, x: number, z: number) => city._add(city.catalog.get(id), x, z).building;
  const mesh = (kind: string) => traffic.group.getObjectByName(kind) as THREE.InstancedMesh;
  const position = (kind: string) => {
    const matrix = new THREE.Matrix4();
    mesh(kind).getMatrixAt(0, matrix);
    return new THREE.Vector3().setFromMatrixPosition(matrix);
  };
  return { city, terrain, origin, traffic, add, mesh, position };
}

describe('facility traffic', () => {
  it('trains need connected rail and follow corners, then stop when a connection is removed', () => {
    const { city, add, traffic, mesh, position } = setup();
    const cam = { x: 0, z: 0 };
    add('rail_station', 0, 0);
    add('rail_track', 0, 2);
    add('rail_track', 1, 3);
    traffic.update(0, cam, true, false);
    expect(mesh('train').count).toBe(0);
    const junction = add('rail_track', 1, 2);
    traffic.update(1.5 / 3.2, cam, true, false);
    expect(mesh('train').count).toBe(1);
    expect(position('train').x).toBeCloseTo(1.5);
    expect(position('train').z).toBeCloseTo(3);
    city._remove(junction.uid);
    traffic.update(0, cam, true, false);
    expect(mesh('train').count).toBe(0);
  });

  it('patrols adjacent water and follows the floating origin', () => {
    const { terrain, origin, traffic, add, mesh, position } = setup();
    add('fishing_harbor', 1200, 0);
    for (let x = 1200; x <= 1204; x++) terrain.special.set(`${x},3`, { flags: TileFlag.Water });
    origin.follow(1200, 0);
    traffic.update(1.25, { x: 1200, z: 0 }, true, false);
    expect(mesh('boat').count).toBe(1);
    expect(position('boat').x + origin.x).toBeCloseTo(1201.75);
    expect(position('boat').z).toBeCloseTo(3.5);
  });

  it('flies above the runway, pauses and respects the traffic toggle', () => {
    const { traffic, add, mesh, position } = setup();
    add('airfield', 0, 0);
    const cam = { x: 0, z: 0 };
    traffic.update(1.75 / 4.2, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    const airborne = position('plane');
    expect(airborne.y).toBeGreaterThan(2);
    traffic.update(0.5, cam, true, true);
    expect(position('plane')).toEqual(airborne);
    traffic.update(0, cam, false, false);
    expect(mesh('plane').count).toBe(0);
  });
});
