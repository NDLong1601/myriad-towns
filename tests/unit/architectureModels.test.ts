import { describe, expect, it } from 'vitest';
import { type BufferGeometry, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { architectureModel } from '@/render/architectureModels';
import { buildingGeometry } from '@/render/buildingModels';
import { isRoadDef, loadCatalog } from '@/sim/catalog';

const catalog = loadCatalog();

describe('building architecture', () => {
  it('gives every ordinary catalogue building its own model within its lot', () => {
    const specialistModels = ['rail_track', 'quarry', 'clay_pit', 'iron_mine'];
    for (const def of catalog.defs) {
      if (def.crop || isRoadDef(def) || specialistModels.includes(def.id)) continue;
      const parts: BufferGeometry[] = [];
      expect(architectureModel(def, parts), def.id).toBe(true);
      expect(parts.length, def.id).toBeGreaterThan(2);
      for (const part of parts) part.dispose();

      const model = buildingGeometry(def);
      model.computeBoundingBox();
      const bounds = model.boundingBox!;
      expect.soft(bounds.min.x, def.id).toBeGreaterThanOrEqual(-0.001);
      expect.soft(bounds.min.z, def.id).toBeGreaterThanOrEqual(-0.001);
      expect.soft(bounds.max.x, def.id).toBeLessThanOrEqual(def.footprint.w + 0.001);
      expect.soft(bounds.max.z, def.id).toBeLessThanOrEqual(def.footprint.d + 0.001);
      expect(model.getAttribute('glow').count, def.id).toBe(model.getAttribute('position').count);
    }
  });

  it('makes similar-sized buildings distinguishable by shape alone', () => {
    const material = new MeshBasicMaterial();
    const ray = new Raycaster();
    const down = new Vector3(0, -1, 0);
    const start = new Vector3();
    for (const group of [
      ['hut', 'cottage', 'yurt', 'fisher_hut', 'log_cabin', 'mountain_hut'],
      ['market', 'town_hall', 'warehouse', 'grain_store', 'granary'],
      ['workshop', 'smelter', 'brickworks', 'foundry', 'power_plant'],
      ['rail_station', 'metro_station', 'ferry_pier', 'fishing_harbor'],
    ]) {
      const signatures = group.map((id) => {
        const def = catalog.get(id);
        const mesh = new Mesh(buildingGeometry(def), material);
        mesh.geometry.computeBoundingBox();
        const max = mesh.geometry.boundingBox!.max.y;
        const samples: number[] = [];
        for (let z = 0; z < 7; z++) {
          for (let x = 0; x < 7; x++) {
            start.set(
              ((x + 0.5) * def.footprint.w) / 7,
              max + 1,
              ((z + 0.5) * def.footprint.d) / 7,
            );
            ray.set(start, down);
            const hit = ray.intersectObject(mesh)[0];
            samples.push(hit ? Math.round((hit.point.y / max) * 10) : 0);
          }
        }
        return samples.join(',');
      });
      expect(new Set(signatures).size, group.join(', ')).toBe(group.length);
    }
    material.dispose();
  });

  it('rotates a merged housing row onto the matching orientation', () => {
    for (const type of ['artisan_row', 'terrace_residence']) {
      const east = buildingGeometry(catalog.get(`${type}_east`)).getAttribute('position');
      const south = buildingGeometry(catalog.get(`${type}_south`)).getAttribute('position');
      expect(south.count).toBe(east.count);
      for (let i = 0; i < east.count; i++) {
        expect(south.getX(i)).toBeCloseTo(1 - east.getZ(i), 5);
        expect(south.getY(i)).toBeCloseTo(east.getY(i), 5);
        expect(south.getZ(i)).toBeCloseTo(east.getX(i), 5);
      }
    }
  });
});
