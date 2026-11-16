# M7 — Distinct mining silhouettes

- Milestone: M7
- Assignee: Claude
- Branch: `agent/claude/m7-deposit-silhouettes`
- Depends on: M7 streets, deposits and transport controls

## Goal

Make stone deposits, iron outcrops, and clay pits recognisable by shape in the world and in the construction tray.

## Context to read first

- `AGENTS.md`, `docs/contracts/README.md`, `docs/tasks/M7-streets-and-resources.md`
- `src/world/terrainMesh.ts`, `src/render/buildingModels.ts`, `src/render/thumbnails.ts`

## Allowed to edit

- `src/world/terrainMesh.ts`, `src/render/buildingModels.ts`
- `tests/unit/terrain.test.ts`, `tests/unit/miningModels.test.ts`, and this spec

## Acceptance criteria

- Natural stone reads as a low boulder cluster, iron as a tall narrow ridge, and clay as a wide depression with visible terraces.
- The constructed quarry, iron mine and clay pit have recognisable silhouettes both on the map and in their thumbnails.
- Covered deposits still hide their decorations. Terrain generation and save compatibility are verified by the existing tests.
- Run `npm run check`, `npm run format:check`, and inspect the models in Chromium.

## Result

- Natural stone uses a low cluster of faceted boulders. Natural iron uses tall, narrow ridges. Natural clay uses a broad terraced basin with an open centre.
- The constructed quarry has a stepped cut face and an exposed working floor. The iron mine has a steel headframe with a winding wheel. The clay pit has concentric terraces around its floor.
- Checked all six models at the same scale in Chromium and confirmed that the three mining thumbnails render in the Production tray.
- Passed `npm run check` (183 unit tests), `npm run format:check`, and four Chromium tests covering game boot, construction thumbnails, deposit coverage and save reload.
