import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FacilityTraffic } from '@/render/facilityTraffic';
import { FloatingOrigin } from '@/render/floatingOrigin';
import type { Simulation } from '@/sim/simulation';
import { TileFlag } from '@/world/biomes';
import { makeCity } from './helpers';

function setup(
  groundY: (x: number, z: number) => number = () => 0,
  navigation?: Pick<Simulation, 'voyageRouteOf' | 'voyagePhaseOf'>,
) {
  const { city, terrain } = makeCity();
  const origin = new FloatingOrigin();
  const traffic = new FacilityTraffic(city, origin, groundY, 3, navigation);
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
    traffic.update(1 / 3.2, cam, true, false);
    const corner = position('train');
    expect(corner.x).toBeLessThan(1.5);
    expect(corner.z).toBeGreaterThan(2.5);
    traffic.update(0.5 / 3.2, cam, true, false);
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
    traffic.update(0, { x: 1200, z: 0 }, true, false);
    expect(mesh('boat').count).toBe(1);
    const start = position('boat').x;
    traffic.update(1.25, { x: 1200, z: 0 }, true, false);
    expect(Math.abs(position('boat').x - start)).toBeCloseTo(1.25);
    expect(position('boat').x + origin.x).toBeGreaterThan(1200);
    expect(position('boat').z).toBeCloseTo(3.5);
  });

  it('smooths vessel progress between simulation ticks and freezes the drawn pose on pause', () => {
    let phase = 0.125;
    const { traffic, add, position } = setup(() => 0, {
      voyagePhaseOf: () => phase,
      voyageRouteOf: () => [
        { x: 0, z: 3 },
        { x: 1, z: 3 },
        { x: 2, z: 3 },
      ],
    });
    add('fishing_harbor', 0, 0);
    const cam = { x: 0, z: 0 };
    traffic.update(0, cam, true, false);
    const start = position('boat');
    phase = 0.25;
    traffic.update(0.05, cam, true, false);
    const sailing = position('boat');
    expect(sailing.x).toBeGreaterThan(start.x);
    expect(sailing.x).toBeLessThan(1.5);
    traffic.update(0.5, cam, true, true);
    expect(position('boat')).toEqual(sailing);
    traffic.update(0.5, cam, true, false);
    expect(position('boat').x).toBeCloseTo(1.5, 1);
  });

  it('waits on the runway before a local flight and pauses without jumping', () => {
    const { traffic, add, mesh, position } = setup();
    add('airfield', 0, 0);
    const cam = { x: 0, z: 0 };
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    const parked = position('plane');
    traffic.update(3, cam, true, false);
    expect(position('plane')).toEqual(parked);
    traffic.update(1.5, cam, true, false);
    expect(position('plane').y).toBeCloseTo(parked.y);
    traffic.update(4, cam, true, false);
    const airborne = position('plane');
    expect(airborne.y).toBeGreaterThan(2);
    traffic.update(0.5, cam, true, true);
    expect(position('plane')).toEqual(airborne);
    traffic.update(0, cam, false, false);
    expect(mesh('plane').count).toBe(0);
  });

  it('lands at a second airfield, waits there, then flies back to the first', () => {
    const { traffic, add, mesh, position } = setup((x) => (x >= 25 ? 2 : 0));
    add('airfield', 0, 0);
    add('airfield', 35, 9);
    const cam = { x: 18, z: 5 };
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    const home = position('plane');
    let stage = 'outbound';
    let groundFrames = 0;
    let previous = home;
    for (let i = 0; i < 500 && stage !== 'done'; i++) {
      traffic.update(0.1, cam, true, false);
      const pos = position('plane');
      expect(pos.distanceTo(previous)).toBeLessThan(0.36);
      previous = pos;
      if (stage === 'outbound' && Math.abs(pos.x - 37) < 0.01 && Math.abs(pos.y - 2.11) < 0.01)
        stage = 'parked';
      if (stage === 'parked') {
        if (Math.abs(pos.x - 37) < 0.01) groundFrames++;
        else stage = 'return';
      }
      if (stage === 'return' && pos.distanceTo(home) < 0.01) stage = 'done';
    }
    expect(groundFrames).toBeGreaterThanOrEqual(37);
    expect(stage).toBe('done');
  });

  it('draws a flight in transit even when both airfields are far from the camera', () => {
    const { traffic, add, mesh, position, origin } = setup();
    add('airfield', 1200, 0);
    add('airfield', 1350, 0);
    const cam = { x: 1275, z: 0 };
    origin.follow(cam.x, cam.z);
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(0);
    traffic.update(27, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    expect(position('plane').x + origin.x).toBeCloseTo(cam.x, -1);
    expect(position('plane').y).toBeGreaterThan(5);
  });

  it('lets an airborne circuit land before switching and recovers when the second airport is removed', () => {
    const { traffic, city, add, mesh, position } = setup();
    const cam = { x: 18, z: 3 };
    add('airfield', 0, 0);
    traffic.update(0, cam, true, false);
    traffic.update(8, cam, true, false);
    const solo = position('plane');
    const second = add('airfield', 35, 6);
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    expect(position('plane')).toEqual(solo);
    city._remove(second.uid);
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(1);
    expect(position('plane')).toEqual(solo);
  });

  it('keeps an existing shuttle in place when a nearer third airfield opens', () => {
    const { traffic, add, mesh, position } = setup();
    const cam = { x: 26, z: 4 };
    add('airfield', 0, 0);
    add('airfield', 44, 0);
    traffic.update(0, cam, true, false);
    traffic.update(9, cam, true, false);
    const inTransit = position('plane');
    expect(inTransit.y).toBeGreaterThan(1);
    add('airfield', 0, 8);
    traffic.update(0, cam, true, false);
    expect(mesh('plane').count).toBe(2);
    expect(position('plane')).toEqual(inTransit);
  });
});
