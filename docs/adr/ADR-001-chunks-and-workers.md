# ADR-001 — Chunks, streaming and workers (M1)

- Status: accepted
- Date: 2026-11-14

## Decision

- **Chunk = 32×32 tiles.** View radius R = 6 chunks on desktop, 4 on touch/small screens (`?r=` overrides).
  Generate up to R+1, unload beyond R+2 (hysteresis). Chebyshev rings, nearest first.
- **Generation is a pure function of (seed, x, z)** (`src/world/terrain.ts`), so chunks line up without
  coordination and untouched chunks never need saving.
- **Workers use `postMessage` with transferable typed arrays; no SharedArrayBuffer.** Works on GitHub Pages
  without COOP/COEP headers. Pool size = min(4, cores − 1).
- **One merged mesh per chunk, including trees and rocks.** Static decoration is baked into the terrain mesh in
  the worker, so a chunk costs one draw call (plus its shadow pass). Instancing is reserved for buildings (M2),
  where per-instance changes matter.
- **Floating origin**: world positions are float64 tile coordinates; the render origin jumps by whole chunks when
  the camera is more than 1024 tiles from it.
- **Own simplex noise** (`src/core/noise.ts`) instead of a package, so a dependency upgrade can never change worlds.

## Measured (cloud machine, Node 22 / headless Chromium with SwiftShader, not a real GPU)

| What                                                       | Value                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| Generate + mesh one chunk (worker)                         | ~5–6 ms average                                          |
| Triangles per chunk                                        | ~4.6k average, ~13k max                                  |
| 13×13 visible chunks                                       | ~770k triangles, 85–140 draw calls after frustum culling |
| JS heap after 30 s of fast travel (1,400 chunks generated) | ~100 MB, loaded chunks stayed bounded                    |

Frame-time targets (p95 ≤ 20 ms) must be checked on a real GPU with the F3 overlay (task AG-001).

## Consequences

- Editing terrain later (M2+) means rebuilding one chunk mesh in the worker; acceptable at ~5 ms.
- If far chunks become too heavy, add a decoration-free LOD for rings > 4 (backlog).
- Rivers use the ridged-noise fallback from the plan (they wind and connect across chunks but do not
  strictly flow downhill). Region-based flow rivers stay in the backlog.
