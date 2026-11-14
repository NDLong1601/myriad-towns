/**
 * v1 (the first prototype layout): a flat list of buildings, no per-building simulation state,
 * no towns, packs or ruins. v2 groups buildings per chunk with their state and adds the M4 state.
 */
import { tileToChunk } from '@/core/coords';

interface V1 {
  schemaVersion: 1;
  seed: string;
  mode?: 'goals' | 'sandbox';
  name?: string;
  tick?: number;
  stock?: Record<string, number>;
  buildings: { uid: number; id: string; x: number; z: number }[];
  createdAt?: number;
}

export function v1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const old = raw as unknown as V1;
  const defs: string[] = [];
  const chunks = new Map<string, { cx: number; cz: number; b: number[] }>();
  let maxUid = 0;
  for (const b of old.buildings ?? []) {
    let di = defs.indexOf(b.id);
    if (di < 0) di = defs.push(b.id) - 1;
    const { cx, cz } = tileToChunk(b.x, b.z);
    const key = `${cx},${cz}`;
    let rec = chunks.get(key);
    if (!rec) chunks.set(key, (rec = { cx, cz, b: [] }));
    // v1 had no simulation state: start every building staffed and supplied, nothing pending.
    rec.b.push(b.uid, di, b.x, b.z, 3, 0, -1);
    maxUid = Math.max(maxUid, b.uid);
  }
  const now = old.createdAt ?? 0;
  const mode = old.mode ?? 'goals';
  return {
    schemaVersion: 2,
    genVersion: 1,
    meta: {
      name: old.name ?? old.seed,
      mode,
      seed: old.seed,
      sandbox: { unlockAll: mode === 'sandbox', freeBuild: false, noDecline: false },
      createdAt: now,
      updatedAt: now,
    },
    camera: null,
    tick: old.tick ?? 0,
    nextUid: maxUid + 1,
    stock: old.stock ?? {},
    defs,
    chunks: [...chunks.values()],
    trees: [],
    // v1 predates packs: treat everything as chosen so nothing that was built becomes locked.
    progress: { peak: 0, chosen: [], latched: defs, announced: [] },
    pois: [],
    goals: mode === 'goals' ? { index: 0, pending: null } : null,
    towns: { towns: [], nextId: 1 },
  };
}
