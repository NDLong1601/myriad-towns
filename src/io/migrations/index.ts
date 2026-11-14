/**
 * Save migrations: each step turns schema version N into N+1, and they run in order on load,
 * so a file from any older version reaches the current one. Add a step whenever
 * SAVE_SCHEMA_VERSION is bumped; never edit a step that has shipped.
 */
import { GEN_VERSION, SAVE_SCHEMA_VERSION } from '@/core/version';
import type { SaveData } from '../save';
import { v1ToV2 } from './v1_to_v2';

type Step = (old: Record<string, unknown>) => Record<string, unknown>;

/** STEPS[n] migrates version n to n + 1. */
const STEPS: Record<number, Step> = {
  1: v1ToV2,
};

export class SaveError extends Error {}

export function migrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') throw new SaveError('not a save file');
  let data = raw as Record<string, unknown>;
  let v = Number(data.schemaVersion);
  if (!Number.isInteger(v) || v < 1) throw new SaveError('missing schemaVersion');
  if (v > SAVE_SCHEMA_VERSION) {
    throw new SaveError(`save is from a newer version (${v} > ${SAVE_SCHEMA_VERSION})`);
  }
  while (v < SAVE_SCHEMA_VERSION) {
    const step = STEPS[v];
    if (!step) throw new SaveError(`no migration from version ${v}`);
    data = step(data);
    v = Number(data.schemaVersion);
  }
  const out = data as unknown as SaveData;
  if (typeof out.genVersion !== 'number') out.genVersion = GEN_VERSION;
  return out;
}
