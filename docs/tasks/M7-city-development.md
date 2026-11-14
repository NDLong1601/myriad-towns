# M7 — City progression, transport and landscape

- Milestone: M7
- Assignee: Claude
- Branch: `agent/claude/m7-city-development`

## Goal

Give every chapter a viable production route, expand the build catalog, and improve map controls within the existing HUD.

## Context to read first

- AGENTS.md, docs/architecture.md, docs/contracts/README.md and docs/tasks/AG-003-minimap.md.
- Existing building requirements, chapter packs, economy, construction and traffic.

## Allowed to edit

- `data/buildings/*.json`, `data/i18n/{en,vi}.json`
- `scripts/validate-data.ts`
- `src/sim/{requirements,goals}.ts`
- `src/render/{buildingModels,buildingRenderer,facilityTraffic}.ts`, `src/main.ts`
- `src/ui/{buildMenu,encyclopedia,goalsPanel,heatmapControls,i18n,icons,minimap,resourceBar}.ts`, `src/ui/{minimap,ui}.css`
- `tests/unit/ui/detail.test.ts`, `tests/unit/{economy,progression,simulation,facilityTraffic}.test.ts`, `tests/e2e/{economy,layout,minimap,polish}.spec.ts`
- `public/icons/resources/*.webp`, `CREDITS.md` and this spec.

## Contracts used

Building data tags, stock and workforce rates, city placement checks, fields, city events and the floating origin.

## Functional requirements

1. Make the Chapter 4 goods and Chapter 5 knowledge goals reachable without depending on pack order or a rare terrain.
2. Allow direct construction of dirt roads and wooden bridges. Upgrade surfaces in place when neighboring infrastructure qualifies.
3. Add varied footprints, neighborhood services, tourism, planting and transport facilities. Show trains on connected rail, boats on water and aircraft at airfields.
4. Adjust production and consumption rates, and validate the resources required by chapter objectives.
5. Align the minimap and heat map with their corner controls using the existing HUD layout and palette. Integrate the approved nine resource icons with transparent backgrounds.

## Non-functional requirements

- Preserve building IDs, save format and world generation.
- Localize new UI strings. Reuse renderer state in frame updates.

## Acceptance criteria and how to check

- Existing chapter saves can build the new producers. Unit tests use the actual catalog and check all pack paths.
- Roads cannot be placed in upgraded form. Ordinary homes alone leave dirt roads in place.
- Multi-tile buildings occupy their full footprint. Rail traffic follows connected tiles and boats follow water.
- Run `npm run check`, `npm run format:check` and browser smoke tests.

## Out of scope

- Replacement of the HUD layout or palette.
- Inter-town cargo accounting and route scheduling for the new transport modes.

## Result

- Added 12 buildings, including the pack-independent Community Classroom, Craft Studio and Public Library. The studio produces 1.5 goods/s and the library produces 1.2 knowledge/s. Regression tests exercise all eight pack paths on the bundled catalog.
- Dirt streets pave to stone with local water and urban coverage, then to brick when commerce and urban coverage increase. Wooden bridges can upgrade to stone. Old save IDs still resolve.
- Added distinct track, runway and flower-garden geometry. Railway, fishing and aviation facilities spawn local animated vehicles. Tests cover connected track, water routes, origin shifts and pause controls.
- Adjusted farming, fishing, bakery, gravel and trading-post rates. Data validation now checks chapter producer availability, stock and one-time cost references, and replacement footprint sizes.
- Following design review, kept the existing HUD and palette. Aligned the minimap and heat-map toggles and placed their panels above them. Integrated nine approved transparent WebP stockpile icons.
- Verified with `npm run check`, `npm run format:check`, and `npm run test:e2e -- --workers=1` (including responsive map controls and transparent stockpile images).
