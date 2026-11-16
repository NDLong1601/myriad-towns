# M7 — Building tray, crops, housing and water commerce

- Milestone: M7
- Assignee: Claude
- Branch: `agent/claude/m7-living-town`
- Depends on: AG-006 game shell

## Goal

Make buildings easier to browse and give farms, neighbourhoods and shore facilities visible progression.

## Allowed to edit

- `src/main.ts`, `src/ui/{buildMenu,detailPanel,buildTool,encyclopedia}.ts`, `src/ui/gameShell.css`
- `src/sim/{catalog,city,commands,simulation,requirements,waterRoutes}.ts`, `src/io/save.ts`
- `src/render/{buildingModels,buildingRenderer,facilityTraffic}.ts`, `src/world/terrainMesh.ts`
- `data/buildings/*.json`, `data/schema/building.schema.json`, `data/i18n/{vi,en}.json`, `scripts/validate-data.ts`
- `tests/unit/{livingTown,facilityTraffic}.test.ts`, `tests/e2e/livingTown.spec.ts`, and this spec

## Acceptance criteria

- The thumbnail tray scrolls by wheel, drag, touch and arrow buttons. Each tile has an accessible name and the inspector explains placement requirements.
- Farms show successive crop stages, with recognisable designs for different crops. Simulation time drives stages and save/load restores them.
- Eligible adjacent homes can merge along paved streets into either orientation of a row or a square. Occupancy, population and local fields stay consistent.
- New warehouse and building tiers use data-driven requirements. Fishing boats and cargo ships follow connected water and return with deliveries.
- Geometry makes broadleaf trees, conifers, snow and stone outcrops distinct. Tile generation remains stable.
- Run project and browser checks.

## Result

- Turned the tray into thumbnail buttons with arrows, wheel scrolling, mouse drag, touch panning and keyboard navigation. Selection shows the building name, costs, capacity and site requirements in the inspector.
- Added 11 definitions including warehouse, field, harbour and housing tiers. A new warehouse checks for a nearby stockpile at placement. The produce storehouse checks for two local berry fields and spacing from another storehouse.
- Staffed crops pass through four visual stages. Working fishing and cargo vessels follow connected water paths and unload when they return. Both work phases are stored as optional save data alongside the existing building records.
- Matching townhouses facing paved infrastructure can combine into two orientations of a row or a 2×2 court. Consolidation updates fields, occupancy and building events together. Undo and redo entries whose plots were replaced expire, and unrelated entries stay usable.
- Redesigned broadleaf trees, layered conifers, snow caps and rock clusters in the mesh while retaining seeded tile data.
- Passed `npm run check` (180 unit tests), `npm run format:check`, and `npm run test:e2e -- --workers=1` (42 Chromium tests). Verified native touch panning at 375 px and inspected crop and winter terrain previews.
