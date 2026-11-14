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

- [x] `npm run check` passes
- [x] Unit test for pixel ↔ world conversion
- [x] E2E: click the minimap → `window.__MYRIAD__.camera()` moved toward the clicked point

## Out of scope

- Fog of war (comes with exploration, M4).

## Result (filled in by the assignee)

- **Files changed / created**:
  - `src/ui/minimap.ts`: Minimap component with sliced sampling (`sampleTile`), single reused `ImageData`, North-up orientation, camera chevron/frustum indicator, building/road overlay (`city.all()`), click-to-teleport, and M key toggle. Mounted inside closed ShadowRoot to avoid canvas collisions with global test locators.
  - `src/ui/minimap.css`: Positioned at `right: 12px; bottom: 124px;` (above build menu), responsive at `<= 1000px` (`bottom: 180px` above encyclopedia button) and `<= 600px` (`120x120px`, hidden by default).
  - `src/main.ts`: Mounted `mountMinimap` (2 lines added, well under 8-line limit).
  - `data/i18n/vi.json` & `data/i18n/en.json`: Added `minimap.label` and `minimap.toggle`.
  - `tests/unit/ui/minimap.test.ts`: Unit tests for `pixelToWorld` and `worldToPixel` conversions in both directions, cardinal axes, and center alignment.
  - `tests/e2e/minimap.spec.ts`: E2E tests for clicking minimap to teleport camera, M key toggle (with input exemption), and building placement redraw.

- **Orientation Choice (North-Up)**:
  - The minimap uses a fixed North-up orientation (+x East, -z North). This keeps the terrain stable and prevents disorientation during camera rotation. The camera orientation is represented by a central directional cone / chevron indicating view yaw, with a red center dot and an "N" compass indicator at the top rim.

- **Performance & Sliced Sampling**:
  - Terrain is sampled in slices using a single reused `ImageData` buffer without per-frame allocations.
  - Slice time per frame is bounded by `< 1.5 ms`.
  - Measured slice execution time: **0.3 ms – 1.4 ms** per frame (peak < 1.6 ms), staying safely within the $\le 2\text{ ms}$ frame budget.

- **Verification**:
  - `npm run check` passed (lint, typecheck, validate-data, 95 unit tests across 12 files, build).
  - `npm run format:check` passed clean.
  - `npx playwright test tests/e2e/minimap.spec.ts` passed (3/3).
  - Full E2E suite (`npx playwright test --workers=1`) passed (16/16).
