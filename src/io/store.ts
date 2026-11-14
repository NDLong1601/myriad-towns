/**
 * Save slots in IndexedDB: one record per game, holding the gzip save and a small summary for
 * the list. Browser only (tests use the codec directly; e2e covers this file).
 */
import type { SaveMeta } from './save';

const DB = 'myriad-towns';
const STORE = 'saves';

export interface SlotRecord {
  id: string;
  name: string;
  mode: SaveMeta['mode'];
  seed: string;
  population: number;
  updatedAt: number;
  bytes: Uint8Array;
}

export type SlotSummary = Omit<SlotRecord, 'bytes'> & { size: number };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function putSlot(rec: SlotRecord): Promise<IDBValidKey> {
  return run('readwrite', (s) => s.put(rec));
}

export function getSlot(id: string): Promise<SlotRecord | undefined> {
  return run('readonly', (s) => s.get(id) as IDBRequest<SlotRecord | undefined>);
}

export function deleteSlot(id: string): Promise<undefined> {
  return run('readwrite', (s) => s.delete(id));
}

/** All slots, newest first. */
export async function listSlots(): Promise<SlotSummary[]> {
  const all = await run('readonly', (s) => s.getAll() as IDBRequest<SlotRecord[]>);
  return all
    .map(({ bytes, ...rest }) => ({ ...rest, size: bytes.byteLength }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function newSlotId(): string {
  return `g${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

/** True when this browser can store saves (private windows may refuse IndexedDB). */
export function storageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
