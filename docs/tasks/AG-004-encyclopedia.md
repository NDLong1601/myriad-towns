# AG-004 — Building encyclopedia panel

- Milestone: M2 follow-up
- Assignee: Antigravity
- Branch: `agent/ag/m2-encyclopedia`
- Depends on: M2 merged

## Goal

A searchable list of every building with its cost, production, what it spreads, its requirements and its upgrade
chain, so players can plan without trial and error (a common complaint about games in this genre).

## Context to read first

- AGENTS.md, docs/adr/ADR-002-buildings-and-rules.md
- `src/sim/catalog.ts` (`Catalog`, `BuildingDef`), `src/ui/i18n.ts` (`t`, `buildingName`, `formatAmounts`),
  `src/ui/describe.ts`, `src/ui/infoPanel.ts`, `src/ui/ui.css`

## Allowed to edit

- `src/ui/encyclopedia.ts` (new), `src/ui/encyclopedia.css` (new)
- `src/main.ts` (only: mount it, ≤ 5 lines)
- `data/i18n/vi.json`, `data/i18n/en.json` (only new `encyclopedia.*` keys)
- `tests/unit/ui/encyclopedia.test.ts`, `tests/e2e/encyclopedia.spec.ts` (new)

## Do NOT edit

- `src/sim/**`, `src/render/**`, `src/world/**`, `src/core/**`, `data/buildings/**`.

## Functional requirements

1. Key `B` or a "📖" button opens a modal list; `Esc` closes it.
2. Search box filters by translated name; category chips filter by category.
3. Each entry shows: name, footprint, cost, housing, produces/upkeep, emits (field, amount, radius), requirements
   (formatted as text from the requirement data, no evaluation), upgrade target(s) and what upgrades into it.
4. Clicking "Xây" selects that building as the current tool (use the `BuildMenu.setTool` handle passed in).
5. Works at 360 px wide (phone): single column, scrollable.

## Acceptance criteria

- [x] `npm run check` passes
- [x] Unit test: search + category filtering logic (pure function)
- [x] E2E: press B, type "giếng", one result; click Xây → panel closes and the build tool is active

## Out of scope

- Live evaluation at a map position (that is the hover checklist).

## Result (filled in by the assignee)

### Files changed

- `src/ui/encyclopedia.ts` (new): Implemented `mountEncyclopedia(parent, catalog, buildMenu)`, pure functions `normalizeText`, `filterBuildings`, `buildUpgradedFromMap`, and `formatRequirement`.
- `src/ui/encyclopedia.css` (new): Styles for the modal dialog with blurred backdrop, responsive single-column layout at 360px, category chip styling, building card details, and floating 📖 toggle button.
- `src/main.ts`: Imported `mountEncyclopedia` and mounted it (2 lines added).
- `data/i18n/vi.json`: Added `encyclopedia.*` localization keys in Vietnamese.
- `data/i18n/en.json`: Added `encyclopedia.*` localization keys in English.
- `tests/unit/ui/encyclopedia.test.ts` (new): 15 unit tests covering diacritics removal (including đ/Đ), search by name (with and without accents), category filtering, combined filtering, empty query, reverse upgrade chain mapping, and requirement formatting.
- `tests/e2e/encyclopedia.spec.ts` (new): Playwright E2E tests verifying opening with key B, search filtering, build tool activation with panel close, typing "x" in search box without triggering demolish mode, opening via 📖 button, and Esc closing modal without cancelling active tool.
- `docs/tasks/AG-004-encyclopedia.md`: Marked acceptance criteria and documented results.

### Testing

- `npm run format`: Prettier check clean (`npm run format:check`).
- `npm run check`: All checks passed (eslint, typecheck, validate-data, 72 unit tests across 9 test files, and production build).
- `npx playwright test`: All 10 Playwright E2E tests passed (smoke, world streaming & camera, debugOverlay, build tool, and encyclopedia).
