# AG-005 — HUD refactor

- Milestone: M7
- Assignee: Antigravity
- Branch: `agent/ag/m7-hud-refactor`

## Goal

Address UI-01 through UI-08 in the supplied Myriad Towns UI refactor specification.

## Allowed to edit

- `src/main.ts`, `src/style.css`
- `src/ui/{resourceBar,buildMenu,goalsPanel,townsPanel,simBar,minimap,planBar,heatmapControls,encyclopedia,policyMenu}.ts`
- `src/ui/{ui,minimap,encyclopedia,policyMenu}.css`
- `data/i18n/{vi,en}.json`, `tests/e2e/{build,layout,minimap,save}.spec.ts` and this spec

## Contracts used

City stock and capacity, simulation flows, chapters, town events, build menu, map controls, plans and settings.

## Acceptance criteria

- Dark HUD, legible warnings and unambiguous localized resource values.
- Collapsible goals, towns and building tray, with existing build shortcuts and dialogs supported.
- Map tools share one dock. Encyclopedia and policies are accessible from the build menu.
- No overlap between the dock and build menu at desktop and phone widths. Run check, format check and browser tests.

## Result

- Applied dark HUD surfaces with shared contrast tokens, exact localized stock and capacity figures, and visible full-storage and workforce warnings.
- Grouped the map controls in one dock and moved the encyclopedia and policy launchers into the construction menu. The building tray scrolls horizontally and collapses on its active tab or Escape.
- Added collapsible goals and towns, an automatic compact completion summary, and a localized help button. The top and bottom HUD reserve space for each other at narrow widths.
- Extended browser checks for full storage, negative flows, long seeds, chapter completion, scrolling and non-overlapping controls. Checked the dock and wheel in Chrome, Edge, Firefox and WebKit at 1280×720, 375×667 and 667×375.
- Passed `npm run check` (167 unit tests), `npm run format:check`, and `npm run test:e2e -- --workers=1` (38 browser tests).
