# M9 — Miniature town visual refresh

- Milestone: M9
- Assignee: Claude scope (world and renderer), Antigravity scope (UI)
- Branch: `agent/claude/m9-visual-refresh`

## Goal

Make mature towns easier to read at play zoom and give terrain, buildings, waterfront and HUD a cohesive miniature style.

## Context to read first

- `AGENTS.md`, `docs/contracts/README.md`, `docs/architecture.md`, `docs/tasks/M7-detailed-buildings.md`, `docs/tasks/M8-city-management.md`

## Allowed to edit

- `src/world/terrainMesh.ts`, `src/render/{visualPalette,dayNight,worldView,terrainRenderer,buildingRenderer,buildingModels,placementPreview,thumbnails,facilityTraffic}.ts`
- `src/render/shaders/terrainFinish.ts`, `src/main.ts`, `scripts/visual-review.mjs`
- `src/style.css`, `src/ui/{gameShell.css,ui.css,buildMenu.ts,buildCategory.ts,icons.ts,progressAlerts.ts,goalsPanel.ts,sessionControls.ts,regionalTrade.ts,panels/progressAlerts.css}`, `data/i18n/{en,vi}.json`
- `tests/unit/visualRefresh.test.ts`, `tests/e2e/{layout,livingTown,management,polish}.spec.ts`, this spec

## Contracts used

Seeded chunk data, existing building geometry and instance batches, floating origin, quality presets, save format and HUD events.

## Functional requirements

1. Tune the palette and lighting against a repeatable district and waterfront scene at two zoom levels and three times of day.
2. Soften tile variation, diversify existing trees and simplify street markings while preserving path layouts.
3. Vary heavily repeated housing deterministically within the existing instance batches, with matching preview and thumbnail palettes.
4. Give water a shallow shore transition, gentle detail at supported quality levels and wakes around moving boats.
5. Improve HUD hierarchy and build thumbnails, compress completion and shortage summaries and preserve keyboard and touch access.

## Acceptance criteria

- `npm run check` and `npm run format:check` pass.
- Verify save reload, representative Chromium layouts, placement and quality settings. Compare image and performance captures at matching camera and preset; preserve the baseline world and save schemas.
- Avoid extra terrain passes and per-frame allocations in new rendering paths. Keep optional animation disabled on low quality and for reduced motion.

## Out of scope

Simulation balance, generated tile data, new dependencies and save migrations.

## Result

- Tuned terrain, streets and the day/night lighting for a softer miniature finish. Terrain uses broad, seeded colour patches; five tree silhouettes share the existing chunk meshes. Road routes and building footprints did not change.
- Added three stable finishes for repeatedly placed housing, using the same geometry and palette in the city, building tray and placement ghost. The instance batches still group by building type.
- Added water colour interpolation across the shoreline and shared chunk borders. Medium and high add subtle ripples plus one batched draw for boat wakes and hull contact; low and reduced motion keep the static shoreline.
- Enlarged named building previews, fit all categories and controls into the HUD, and made shortage rows actionable with optional advice. Verified the HUD at desktop, portrait and landscape sizes.
- Captured 24 screenshots with `scripts/visual-review.mjs` on the base and updated builds, with an identical 165-building scene, six fishing docks, world version and simulation hash. At Medium, the four camera views used one additional draw call and 2.8–4.3% fewer triangles; headless Chromium p95 was flat or lower. These timings are comparative and do not establish frame-rate targets for physical devices.
- Passed `npm run check` (217 unit tests; two Vitest workers on the Windows machine) and `npm run format:check`.
- Chromium covered all 51 scenarios. Forty-four passed in the first run; seven hit time limits with three software-WebGL workers and all seven passed on a one-worker retry. Save round-trips, placement, undo, overlays and phone layouts passed.
