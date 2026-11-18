import { describe, expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { buildingGeometry } from '@/render/buildingModels';
import { loadCatalog } from '@/sim/catalog';

describe('mining models', () => {
  it('models an open stepped quarry, a recessed clay pit, and a taller iron headframe', () => {
    const catalog = loadCatalog();
    const quarry = buildingGeometry(catalog.get('quarry'));
    const clay = buildingGeometry(catalog.get('clay_pit'));
    const iron = buildingGeometry(catalog.get('iron_mine'));
    const material = new MeshBasicMaterial();
    const ray = new Raycaster();
    const sample = (geometry: typeof quarry, x: number, z: number): number => {
      ray.set(new Vector3(x, 2, z), new Vector3(0, -1, 0));
      return ray.intersectObject(new Mesh(geometry, material))[0]?.point.y ?? 0;
    };
    expect(sample(quarry, 0.8, 0.1)).toBeGreaterThan(sample(quarry, 0.8, 0.4) + 0.12);
    expect(sample(clay, 0.9, 0.1)).toBeGreaterThan(sample(clay, 0.9, 0.45) + 0.05);
    for (const geometry of [quarry, clay, iron]) geometry.computeBoundingBox();
    expect(iron.boundingBox!.max.y).toBeGreaterThan(quarry.boundingBox!.max.y);
    expect(iron.boundingBox!.max.y).toBeGreaterThan(clay.boundingBox!.max.y);
    material.dispose();
  });
});
