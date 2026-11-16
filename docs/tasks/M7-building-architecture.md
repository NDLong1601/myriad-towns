# M7 — Building architecture

- Milestone: M7
- Assignee: Claude
- Branch: `agent/claude/m7-building-architecture`
- Depends on: M7 distinct mining silhouettes

## Goal

Give houses, civic buildings, workplaces, and transport sites visible architectural features that identify their use at game scale.

## Context to read first

- `AGENTS.md`, `docs/contracts/README.md`, `docs/tasks/M7-deposit-silhouettes.md`
- `src/render/buildingModels.ts` and the visual definitions in `data/buildings/`

## Allowed to edit

- `src/render/buildingModels.ts`, `src/render/modelParts.ts`, `src/render/architectureModels.ts`
- `src/render/architecture/{lot,housing,civic,workplaces,transport}.ts`
- `tests/unit/architectureModels.test.ts` and this spec

## Acceptance criteria

- Each ordinary building in the bundled catalogue has an original model with distinct massing or functional details. Roads, crop stages and the dedicated mine models use their existing specialised rendering.
- Building assets stay on their tile footprints. Mirrored housing rows use the correct orientation.
- The models appear through the world renderer, construction previews and thumbnails.
- `npm run check`, `npm run format:check` and representative Chromium checks pass.

## Result

- Rebuilt 75 catalogue buildings with distinct roofs, profiles, layouts and functional details. Housing ranges from round huts to courtyard villas, paired rows and balcony towers. Civic buildings, workshops, farms, stores and transport sites use recognisable equipment and layouts.
- Added an irrigation ditch and crossing to irrigated wheat. The crop renderer continues to draw every growth stage.
- Corrected gable alignment and kept the new models inside their footprints. Added geometry checks for catalogue coverage, projected shapes and both orientations of merged housing rows.
- Compared 16 representative models in Chromium and inspected the Bến Sương save with 496 residents and 243 placed buildings.
- Passed `npm run check` with 186 unit tests, `npm run format:check`, and all 45 Chromium tests.
