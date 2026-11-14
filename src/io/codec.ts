/**
 * Save files on disk and in IndexedDB: gzip(JSON). gzip uses the platform CompressionStream,
 * available in every browser we target and in Node 18+ (tests).
 */
import { migrate } from './migrations';
import type { SaveData } from './save';

export const SAVE_EXTENSION = '.mtsave';

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeSave(data: SaveData): Promise<Uint8Array> {
  return pipe(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream('gzip'));
}

/** Decodes a gzip or plain JSON save of any supported version into the current layout. */
export async function decodeSave(bytes: Uint8Array): Promise<SaveData> {
  const gz = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const raw = gz ? await pipe(bytes, new DecompressionStream('gzip')) : bytes;
  return migrate(JSON.parse(new TextDecoder().decode(raw)));
}
