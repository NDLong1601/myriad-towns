# M7 — Streets, deposits and transport controls

- Milestone: M7
- Assignee: Claude
- Branch: `agent/claude/m7-streets-and-resources`
- Depends on: M7 living town

## Goal

Make roads and deposits easy to read on the map, and make transport easier to build and find.

## Context to read first

- `AGENTS.md`, `docs/contracts/README.md`, `docs/tasks/M7-living-town.md`
- Existing road, terrain, and building-tray tests

## Allowed to edit

- `src/main.ts`, `src/render/buildingModels.ts`, `src/render/heatmap.ts`
- `src/world/biomes.ts`, `src/world/terrainMesh.ts`
- `src/ui/buildCategory.ts`, `src/ui/buildMenu.ts`, `src/ui/buildTool.ts`, `src/ui/encyclopedia.ts`, `src/ui/heatmapControls.ts`, `src/ui/ui.css`
- `data/i18n/en.json`, `data/i18n/vi.json`
- `tests/unit/roadTiling.test.ts`, `tests/unit/terrain.test.ts`, `tests/e2e/build.spec.ts`, `tests/e2e/economy.spec.ts`, `tests/e2e/livingTown.spec.ts`, and this spec

## Acceptance criteria

- Dirt roads, paved streets and bridges use distinct original models with continuous ends and junctions. Lamps change as roads upgrade.
- Stone, clay and iron are visually distinct and have a map-layer shortcut with a legend. Ground decoration is hidden under construction, including in existing saves.
- Dragging rail shows a build preview, places the route, and groups the placement in one undo step.
- The infrastructure tray contains transport. Available buildings appear first in every tab.
- `npm run check`, `npm run format:check` and the Chromium smoke suite pass.

## Out of scope

- Changing terrain generation, unlock thresholds, traffic routing or the save format.

## Result

- Rebuilt the connected road surfaces, curbs and bridge guardrails. Dirt, stone and brick roads have distinct lamps that follow paving upgrades.
- Made stone, clay and iron visually distinct and added a resource layer with a colour legend and the G shortcut. Rendering covers exposed rock under existing and new construction. Demolition and undo restore the exposed geometry.
- Added rail dragging with live cost and path previews and one undo step. Grouped transport in Infrastructure, moved storage and services to their respective tabs, and sorted unlocked buildings first.
- Reopened the Bến Sương save in Chromium and inspected the new roads and resource layer with 496 residents and 243 buildings.
- Passed `npm run check` (182 unit tests), `npm run format:check`, and the 45-test Chromium suite. Reran all nine construction, economy and simulation browser tests against the final map-layer rendering.
