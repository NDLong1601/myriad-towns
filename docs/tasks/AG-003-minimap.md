# AG-003 — Minimap

- Milestone: M1
- Assignee: Antigravity
- Branch: `agent/ag/m1-minimap`
- Depends on: M1 merged (`sampleTile`, `BIOME_NAMES`, debug API `window.__MYRIAD__`)

## Goal

A small round minimap in the bottom-right corner showing the biomes around the camera, so the player can see
coasts, rivers and mountains beyond the fog and click to travel.

## Context to read first

- AGENTS.md
- `src/world/terrain.ts` (`sampleTile(seed, x, z)` is pure and cheap, ~5 µs per call)
- `src/world/biomes.ts`, `src/render/cameraController.ts` (`state`, `teleport`), `src/main.ts`

## Allowed to edit

- `src/ui/minimap.ts` (new), `src/ui/minimap.css` (new)
- `src/main.ts` (only: create and mount the minimap, ≤ 8 lines)
- `tests/unit/ui/minimap.test.ts` (new), `tests/e2e/minimap.spec.ts` (new)
- `data/i18n/*.json` (only new `minimap.*` keys)

## Do NOT edit

- `src/core/**`, `src/world/**`, `src/render/**`.

## Contracts used

- `sampleTile(seed, x, z)` (read-only), `CameraController.state` (read-only), `CameraController.teleport(x, z)`.

## Functional requirements

1. 160×160 px canvas (2D context), each pixel = 4×4 tiles, centered on the camera target.
2. Colour per biome, water blue, rivers lighter; a marker for the camera with the view direction (yaw).
3. Redraw only when the camera moved ≥ 16 tiles or rotated; sample in slices (≤ 2 ms per frame) so it never
   causes a frame spike.
4. Click on the minimap teleports the camera there (convert pixel → world tiles, respecting yaw if you rotate
   the map, or keep north-up — document the choice).
5. M key toggles the minimap.

## Non-functional requirements

- No allocations per frame; reuse one ImageData.

## Acceptance criteria and how to check

- [ ] `npm run check` passes
- [ ] Unit test for pixel ↔ world conversion
- [ ] E2E: click the minimap → `window.__MYRIAD__.camera()` moved toward the clicked point

## Out of scope

- Fog of war (comes with exploration, M4).

## Result (filled in by the assignee)
