import type { ChunkData } from './chunk';
import type { MeshArrays } from './terrainMesh';

/** Main thread → generation worker. */
export interface GenRequest {
  id: number;
  seed: number;
  cx: number;
  cz: number;
  /** Draw land flat (see setFlatTerrain). */
  flat?: boolean;
}

/** Generation worker → main thread. All typed arrays are transferred, not copied. */
export interface GenResult {
  id: number;
  chunk: ChunkData;
  mesh: MeshArrays;
  /** Time spent in the worker, ms. */
  ms: number;
}
