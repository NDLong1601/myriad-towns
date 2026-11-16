import { describe, expect, it } from 'vitest';
import type { BufferGeometry } from 'three';
import { architectureModel } from '@/render/architectureModels';
import { buildingGeometry } from '@/render/buildingModels';
import { loadCatalog } from '@/sim/catalog';

describe('cottage model prototype', () => {
  const catalog = loadCatalog();
  const def = catalog.get('cottage');

  it('resolves cottage through architectureModel with rich geometry parts', () => {
    const parts: BufferGeometry[] = [];
    expect(architectureModel(def, parts)).toBe(true);
    expect(parts.length).toBeGreaterThan(20);
    for (const p of parts) p.dispose();
  });

  it('stays strictly within its 1×1 footprint and ground plane', () => {
    const model = buildingGeometry(def);
    model.computeBoundingBox();
    const bounds = model.boundingBox!;

    expect(bounds.min.x).toBeGreaterThanOrEqual(-0.001);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-0.001);
    expect(bounds.max.x).toBeLessThanOrEqual(def.footprint.w + 0.001);
    expect(bounds.max.z).toBeLessThanOrEqual(def.footprint.d + 0.001);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-0.001);
    expect(bounds.max.y).toBeGreaterThan(0.7); // steep roof reaches above 0.7
  });

  it('contains lit elements with glow attributes', () => {
    const model = buildingGeometry(def);
    const glowAttr = model.getAttribute('glow');
    const posAttr = model.getAttribute('position');
    const colAttr = model.getAttribute('color');

    expect(glowAttr).toBeDefined();
    expect(posAttr).toBeDefined();
    expect(colAttr).toBeDefined();
    expect(glowAttr.count).toBe(posAttr.count);

    let hasLitVertex = false;
    for (let i = 0; i < glowAttr.count; i++) {
      if (glowAttr.getX(i) > 0.5) {
        hasLitVertex = true;
        break;
      }
    }
    expect(hasLitVertex).toBe(true);
  });
});
