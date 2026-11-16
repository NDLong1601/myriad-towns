# M7 — Detailed buildings

- Assignee: Claude with Antigravity on concept details
- Branch: `agent/claude/m7-detailed-buildings`
- Depends on: AG-007 concepts and AG-008 cottage prototype

## Goal

Bring the bundled catalogue to the approved cottage's visual direction, retaining the geometry cache, footprints and save compatibility.

## Allowed to edit

- `src/render/architecture/*.ts`, `src/render/buildingModels.ts`, `src/render/architectureModels.ts`
- `tests/unit/architectureModels.test.ts` and this spec

## Acceptance criteria

- The eleven remaining concept buildings have recognisable motifs from AG-007.
- Other buildings and specialist structures gain visible details suited to their use or materials.
- All geometry stays compatible with instancing, thumbnails, placement and saves. Check the two zoom levels and run repository checks.

## Result

- Added the approved concepts' signature silhouettes and functional details, including the townhouse Mansard roof, public library dome, town hall clock, sawmill wheel, warehouse clerestory, rail canopy and harbour equipment.
- Extended the detailing to the rest of the catalogue with roof courses, facade trim, working yards, planted lots, fenced crop plots, mine fixtures and bridge and rail details. The approved cottage uses its existing dedicated mesh.
- Used the existing merged, vertex-coloured geometry for the city, construction previews and thumbnails. The station uses opaque coloured panels for the glass effect. No save migration is needed.
- Compared 16 models in Chromium and reopened Bến Sương at both neighbourhood and close zoom with 496 residents and 243 structures.
- Passed `npm run check` with 190 unit tests and `npm run format:check`. The 45-test Chromium suite passed before the last canopy and facade refinements. Six targeted Chromium tests passed on the final build.
