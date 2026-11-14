import type { CheckResult } from '@/sim/requirements';
import { buildingName, t } from './i18n';

/** Human-readable line for a rule check. The rule engine decides ok; this only formats. */
export function describeCheck(c: CheckResult): string {
  const p: Record<string, string | number> = { ...c.params };
  if (typeof p.building === 'string') p.building = buildingName(p.building);
  if (typeof p.field === 'string') p.field = t(`field.${p.field}`);
  if (typeof p.terrain === 'string') p.terrain = t(`terrain.${p.terrain}`);
  if (typeof p.what === 'string') p.what = t(p.what);
  return t(c.key, p);
}
