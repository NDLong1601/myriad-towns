# Architecture (draft, M0)

Full design lives in the research report "Nghiên cứu Urbek City Builder" (part B). This file keeps the parts code
depends on, and is updated as milestones land.

## World

- Infinite grid of integer tiles (x, z), split into **32×32 chunks** (`src/core/coords.ts`).
- Every chunk is generated from `(worldSeed, cx, cz)` alone (`src/core/prng.ts`), so untouched chunks need no storage.
- Generation runs in a Web Worker and returns typed arrays by transfer (no SharedArrayBuffer in v1).

## Simulation tiers

| Tier     | Which chunks                          | What runs                                              |
| -------- | ------------------------------------- | ------------------------------------------------------ |
| Active   | towns near the camera / selected town | full 4 Hz tick: rules, upgrades, decline, fields       |
| Dormant  | modified but far away                 | town summary only (net production/consumption) at 1 Hz |
| Pristine | never touched                         | nothing; regenerated from the seed                     |

## Rendering

- three.js WebGLRenderer (WebGL2). Terrain: one merged mesh per chunk. Buildings: one InstancedMesh per model per
  4×4-chunk group. One shared palette material.
- Floating origin: integer world coordinates; the render origin shifts when the camera is > 4096 tiles away.
- Load radius R = 6 chunks desktop / 4 mobile; generate at R+1; unload at R+2.

## Saves

`SaveMeta` (seed, versions, towns, camera…) + one compressed `ChunkRec` per **modified** chunk in IndexedDB.
`SAVE_SCHEMA_VERSION` and `GEN_VERSION` in `src/core/version.ts`; migrations in `src/io/migrations/`.

## Performance budget (targets, to be measured from M1)

| Metric           | Desktop mid-range          | Weak laptop / phone |
| ---------------- | -------------------------- | ------------------- |
| Frame time       | ≤ 16.6 ms (60 fps)         | ≤ 33 ms (30 fps)    |
| Draw calls       | ≤ 300                      | ≤ 150               |
| Sim tick         | ≤ 4 ms                     | ≤ 8 ms              |
| Chunk generation | ≤ 5 ms per chunk in worker | ≤ 12 ms             |

## Milestones

M0 setup ✔ · M1 infinite terrain · M2 placement and adjacency rules · M3 economy and simulation ·
M4 progression and biomes · M5 save/load and settings · M6 polish, audio, art · M7 public deploy and PWA.
