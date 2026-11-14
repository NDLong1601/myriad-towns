/// <reference lib="webworker" />
import { chunkBuffers, generateChunk } from '@/world/chunk';
import type { GenRequest, GenResult } from '@/world/genProtocol';
import { buildTerrainMesh, meshBuffers } from '@/world/terrainMesh';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<GenRequest>) => {
  const { id, seed, cx, cz } = e.data;
  const t0 = performance.now();
  const chunk = generateChunk(seed, cx, cz);
  const mesh = buildTerrainMesh(seed, chunk);
  const result: GenResult = { id, chunk, mesh, ms: performance.now() - t0 };
  self.postMessage(result, [...chunkBuffers(chunk), ...meshBuffers(mesh)]);
};
