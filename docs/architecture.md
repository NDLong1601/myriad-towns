# Architecture (draft, M0)

Full design lives in the research report "Nghiên cứu Urbek City Builder" (part B). This file keeps the parts code
depends on, and is updated as milestones land.

## World

- Infinite grid of integer tiles (x, z), split into **32×32 chunks** (`src/core/coords.ts`).
- Every chunk is generated from `(worldSeed, cx, cz)` alone (`src/core/prng.ts`), so untouched chunks need no storage.
- Generation runs in a Web Worker and returns typed arrays by transfer (no SharedArrayBuffer in v1).

### Generation pipeline (M1, `src/world/terrain.ts`)

1. Domain warp (x, z) with two fBm fields.
2. Elevation = detail fBm + low-frequency continent fBm, reshaped (flat lowlands, sharp peaks) → level 0..15.
   Sea level 5.
3. Rivers: ridge lines of a low-frequency noise on the warped coordinates, through land below level 12.
4. Moisture and temperature fBm (temperature drops with height) → biome: Ocean, Beach, Temperate, Forest,
   Steppe, Cold, Mountain, plus rare Ruins patches.
5. Resources (stone, iron, clay, fertile soil) from a deposit noise; trees and rocks from per-tile hashes.

Mesh (`src/world/terrainMesh.ts`): blocky terraces, walls only toward lower neighbours (neighbours in other
chunks are sampled, so no seams), trees/rocks merged in. Colours are sRGB palettes converted to linear.

## City and rules (M2)

See ADR-002. `src/sim/city.ts` holds placed buildings, tile occupancy, a per-chunk spatial index and integer local
fields. All rule checks go through `src/sim/requirements.ts`; all changes go through commands with a 50-step undo.
UI (`src/ui/buildTool.ts`) turns pointer input into commands and shows the same `CheckResult`s as a checklist.

## Simulation tiers

| Tier     | Which chunks                          | What runs                                              |
| -------- | ------------------------------------- | ------------------------------------------------------ |
| Active   | towns near the camera / selected town | full 4 Hz tick: rules, upgrades, decline, fields       |
| Dormant  | modified but far away                 | town summary only (net production/consumption) at 1 Hz |
| Pristine | never touched                         | nothing; regenerated from the seed                     |

## Rendering

- three.js WebGLRenderer (WebGL2). Terrain: one merged mesh per chunk. Trees/rocks are baked into that mesh.
  Buildings: one InstancedMesh per type (ADR-002), to be confirmed by AG-002. One shared palette material.
- Floating origin: float64 world coordinates; the render origin shifts (whole chunks) when the camera is > 1024 tiles away.
- Load radius R = 6 chunks desktop / 4 mobile; generate at R+1; unload at R+2.

## Saves

`SaveMeta` (seed, versions, towns, camera…) + one compressed `ChunkRec` per **modified** chunk in IndexedDB.
`SAVE_SCHEMA_VERSION` and `GEN_VERSION` in `src/core/version.ts`; migrations in `src/io/migrations/`.

## Render quality

`src/render/quality.ts`: presets `low` / `medium` (default) / `high`, chosen with `?quality=`. Medium caps the pixel
ratio at 1.5 and runs adaptive resolution (scale down when p90 frame time > 1.3× the display interval, back up after
calm windows; the display interval is estimated from the fastest frames, so a 30 Hz-capped browser is not treated as a
slow GPU). Shadows use PCF, not PCFSoft. Measured 2026-11-14 on Iris Xe at DPR 1.88: the game was fill-rate bound
(full res 27 fps / p95 50 ms; at ~1.4 px ratio it reached the browser's 30 Hz cap with p95 34 ms).

## Performance budget (targets, to be measured from M1)

| Metric           | Desktop mid-range          | Weak laptop / phone |
| ---------------- | -------------------------- | ------------------- |
| Frame time       | ≤ 16.6 ms (60 fps)         | ≤ 33 ms (30 fps)    |
| Draw calls       | ≤ 300                      | ≤ 150               |
| Sim tick         | ≤ 4 ms                     | ≤ 8 ms              |
| Chunk generation | ≤ 5 ms per chunk in worker | ≤ 12 ms             |

## Milestones

M0 setup ✔ · M1 infinite terrain ✔ · M2 placement and adjacency rules ✔ · M3 economy and simulation ✔ ·
M4 progression and biomes · M5 save/load and settings · M6 polish, audio, art · M7 public deploy and PWA.
