import { describe, expect, it } from 'vitest';
import { ImpactPreview } from '@/sim/impact';
import { makeCity } from './helpers';

describe('local build impact', () => {
  it('previews a well unlocking cottage upgrades without changing fields, stock or occupancy', () => {
    const { city } = makeCity();
    city._add(city.catalog.get('road'), 0, 0);
    const { building: hut } = city._add(city.catalog.get('hut'), 1, 0);
    const before = city.fields.snapshot();
    const stock = { ...city.stock };
    const impact = new ImpactPreview(city).inspect({ def: city.catalog.get('well'), x: 1, z: 1 });
    expect(impact.improved.map((b) => b.uid)).toEqual([hut.uid]);
    expect(impact.atRisk).toEqual([]);
    expect(city.fields.snapshot()).toEqual(before);
    expect(city.stock).toEqual(stock);
    expect(city.at(1, 1)).toBeUndefined();
  });

  it('warns only when demolishing the last road or water source that satisfies a home', () => {
    const { city } = makeCity();
    const { building: road } = city._add(city.catalog.get('road'), 0, 0);
    const { building: cottage } = city._add(city.catalog.get('cottage'), 1, 0);
    const { building: well } = city._add(city.catalog.get('well'), 1, 1);
    const { building: backup } = city._add(city.catalog.get('well'), 2, 0);
    const preview = new ImpactPreview(city);
    const remove = (b: typeof well) => preview.inspect({ ...b, removeUid: b.uid }).atRisk;
    expect(remove(road)).toContain(cottage);
    expect(remove(well)).not.toContain(cottage);
    city._setActive(backup.uid, false);
    expect(remove(well)).toContain(cottage);
    expect(city.get(well.uid)).toBe(well);
  });
});
