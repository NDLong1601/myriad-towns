import { describe, expect, it } from 'vitest';
import type { BuildingDef } from '@/sim/catalog';
import {
  buildUpgradedFromMap,
  filterBuildings,
  formatRequirement,
  normalizeText,
} from '@/ui/encyclopedia';

const sampleDefs: BuildingDef[] = [
  {
    id: 'hut',
    category: 'housing',
    footprint: { w: 1, d: 1 },
    cost: { wood: 2 },
    upgrades: [{ to: 'cottage', when: [] }],
    visual: { shape: 'house' },
  },
  {
    id: 'cottage',
    category: 'housing',
    footprint: { w: 1, d: 1 },
    cost: { wood: 4, stone: 2 },
    upgrades: [{ to: 'townhouse', when: [] }],
    visual: { shape: 'house' },
  },
  {
    id: 'townhouse',
    category: 'housing',
    footprint: { w: 1, d: 1 },
    cost: { wood: 6, stone: 4 },
    visual: { shape: 'house' },
  },
  {
    id: 'well',
    category: 'service',
    footprint: { w: 1, d: 1 },
    cost: { stone: 4 },
    visual: { shape: 'well' },
  },
  {
    id: 'woodcutter',
    category: 'production',
    footprint: { w: 2, d: 2 },
    cost: { wood: 2 },
    visual: { shape: 'house' },
  },
  {
    id: 'road',
    category: 'infrastructure',
    footprint: { w: 1, d: 1 },
    cost: { stone: 1 },
    visual: { shape: 'road' },
  },
];

const names: Record<string, string> = {
  hut: 'Lều tranh',
  cottage: 'Nhà gỗ',
  townhouse: 'Nhà phố',
  well: 'Giếng nước',
  woodcutter: 'Trại đốn gỗ',
  road: 'Đường đất',
};

const nameOf = (d: BuildingDef) => names[d.id] ?? d.id;

describe('normalizeText', () => {
  it('strips accents and converts case', () => {
    expect(normalizeText('Giếng nước')).toBe('gieng nuoc');
    expect(normalizeText('GIẾNG NƯỚC')).toBe('gieng nuoc');
    expect(normalizeText('  Nhà gỗ  ')).toBe('nha go');
  });

  it('handles Vietnamese đ and Đ', () => {
    expect(normalizeText('Đường đất')).toBe('duong dat');
    expect(normalizeText('đá')).toBe('da');
    expect(normalizeText('ĐỒNG')).toBe('dong');
  });
});

describe('filterBuildings', () => {
  it('returns all buildings when query is empty and category is all', () => {
    const result = filterBuildings(sampleDefs, '', 'all', nameOf);
    expect(result).toHaveLength(sampleDefs.length);

    const resultWhitespace = filterBuildings(sampleDefs, '   ', 'all', nameOf);
    expect(resultWhitespace).toHaveLength(sampleDefs.length);
  });

  it('filters by name without diacritics (e.g. "gieng" -> "Giếng nước")', () => {
    const result = filterBuildings(sampleDefs, 'gieng', 'all', nameOf);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('well');
  });

  it('filters by name with diacritics (e.g. "giếng")', () => {
    const result = filterBuildings(sampleDefs, 'giếng', 'all', nameOf);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('well');
  });

  it('filters by partial name matching multiple buildings', () => {
    // "go" matches "Nhà gỗ" (cottage) and "Trại đốn gỗ" (woodcutter)
    const result = filterBuildings(sampleDefs, 'go', 'all', nameOf);
    expect(result.map((d) => d.id)).toEqual(['cottage', 'woodcutter']);
  });

  it('filters by category alone', () => {
    const housing = filterBuildings(sampleDefs, '', 'housing', nameOf);
    expect(housing.map((d) => d.id)).toEqual(['hut', 'cottage', 'townhouse']);

    const service = filterBuildings(sampleDefs, '', 'service', nameOf);
    expect(service.map((d) => d.id)).toEqual(['well']);

    const production = filterBuildings(sampleDefs, '', 'production', nameOf);
    expect(production.map((d) => d.id)).toEqual(['woodcutter']);
  });

  it('filters by combined query and category', () => {
    // "go" in "housing" only returns cottage ("Nhà gỗ")
    const housingGo = filterBuildings(sampleDefs, 'go', 'housing', nameOf);
    expect(housingGo.map((d) => d.id)).toEqual(['cottage']);

    // "go" in "production" only returns woodcutter ("Trại đốn gỗ")
    const prodGo = filterBuildings(sampleDefs, 'go', 'production', nameOf);
    expect(prodGo.map((d) => d.id)).toEqual(['woodcutter']);

    // "go" in "service" returns nothing
    const serviceGo = filterBuildings(sampleDefs, 'go', 'service', nameOf);
    expect(serviceGo).toHaveLength(0);
  });

  it('returns empty array when query does not match anything', () => {
    const result = filterBuildings(sampleDefs, 'khong-co', 'all', nameOf);
    expect(result).toHaveLength(0);
  });
});

describe('buildUpgradedFromMap', () => {
  it('computes reverse upgrades correctly', () => {
    const map = buildUpgradedFromMap(sampleDefs);

    expect(map.get('cottage')).toEqual(['hut']);
    expect(map.get('townhouse')).toEqual(['cottage']);
    expect(map.get('well')).toBeUndefined();
  });
});

describe('formatRequirement', () => {
  it('formats road requirement', () => {
    const text = formatRequirement({ type: 'road', maxDistance: 4 });
    expect(text).toContain('4');
  });

  it('formats near requirement', () => {
    const text = formatRequirement({ type: 'near', building: 'well', radius: 6, min: 1 });
    expect(text).toContain('6');
  });

  it('formats notNear requirement', () => {
    const text = formatRequirement({ type: 'notNear', building: 'quarry', radius: 8 });
    expect(text).toContain('8');
  });

  it('formats field requirement', () => {
    const text = formatRequirement({ type: 'field', field: 'water_access', min: 1 });
    expect(text).toContain('1');
  });

  it('formats terrain requirement', () => {
    const text = formatRequirement({ type: 'terrain', terrain: 'water', radius: 3, min: 2 });
    expect(text).toContain('3');
  });
});
