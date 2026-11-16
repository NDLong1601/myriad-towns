# M8 — City management and regional growth

- Milestone: M8
- Assignee: Claude
- Branch: `agent/claude/m8-city-management`

## Goal

Help players understand the consequences of building choices and make neighbourhoods and multiple towns worth managing.

## Context to read first

- AGENTS.md, docs/architecture.md, docs/contracts/README.md
- M7 living town and city development task specs

## Allowed to edit

- This spec, `docs/tasks/AG-009-economy-panel.md`, `src/main.ts`
- `src/sim/{city,catalog,fields,requirements,impact,simulation,goals,plan,towns,regionalTrade}.ts`, `src/io/save.ts`
- `src/ui/{buildTool,notifications,goalsPanel,planBar,townsPanel,resourceBar,progressAlerts,regionalTrade}.ts`, `src/ui/{ui,gameShell}.css`, `src/ui/panels/*`
- `data/chapters.json`, `data/i18n/{en,vi}.json`, `scripts/validate-data.ts`
- `tests/unit/{impact,population,plan,goals,progression,simulation,regionalTrade}.test.ts`, `tests/e2e/{management,economy,layout,sim}.spec.ts`

## Functional requirements

1. Economy inspection shows sources, consumers, shortages, and an estimated time to depletion.
2. Construction and demolition previews show local building effects and nominal operating costs without mutating the city.
3. Group the causes of operational shortages and direct the player to an affected building.
4. Simulate residents filling available homes based on local conditions and preserve population in saves.
5. Make spatial blueprints reusable and offer alternative objectives tied to production and town quality.
6. Give towns distinct economic roles and add player-configured harbour shipments with separate town reserves.

## Non-functional requirements

- No changes to seeded terrain or legacy save usability.
- Preserve game HUD, localization and determinism. Avoid allocations in frame hot paths.
- Review Antigravity UI work before integration.

## Acceptance criteria and how to check

- Run `npm run check` and `npm run format:check`.
- Run focused Chromium tests for the new player flows.

## Result

- Resource chips open a shared stock inspector with current flows, estimated time to depletion, and links to producing, consuming or blocked sites. Persistent alerts group shortages by cause.
- A read-only placement view evaluates the same local rules as the simulation and marks nearby sites affected by construction or demolition. Operating rates are estimates at full capacity.
- Homes report residents separately from capacity. Local conditions and supplies affect migration, staffing and upkeep. Upgrades and mergers retain residents, and older saves default to full occupied housing.
- Plan mode saves reusable neighbourhoods in the browser, previews operating needs, and checks the whole layout before stamping it. Plans that contain rectangular footprints can turn 180°. Chapters 2–5 offer an alternative set of goals.
- Towns can specialize and apply local policies. Optional local reserves separate cargo supplies and staffing from the shared pool. Working cargo ports on connected water can send timed deliveries while keeping a chosen minimum at the source. Construction, energy and knowledge use the shared stock.
- `npm run check` passed (208 unit tests), as did `npm run format:check`. Chromium passed 50 cases in the full run. The village growth case passed on rerun after targeting the cottage unlock toast specifically, since gradual growth triggers several unlocks at separate population thresholds.
