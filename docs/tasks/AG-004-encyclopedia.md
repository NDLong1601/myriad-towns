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

- [ ] `npm run check` passes
- [ ] Unit test: search + category filtering logic (pure function)
- [ ] E2E: press B, type "giếng", one result; click Xây → panel closes and the build tool is active

## Out of scope

- Live evaluation at a map position (that is the hover checklist).

## Result (filled in by the assignee)
