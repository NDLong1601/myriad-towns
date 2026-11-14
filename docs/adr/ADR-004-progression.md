# ADR-004 — Progression: modes, chapters, packs, biome buildings and ruins (M4a)

- Status: accepted
- Date: 2026-11-14

## Decisions

- **Two modes, chosen on a new-game screen** (`src/ui/newGame.ts`). The game is described by the URL:
  `?seed=…&mode=goals|sandbox&unlock=1&free=1&nodecline=1`. Starting a game reloads the page with those params, so a
  link reproduces a game exactly and there is no hidden state before M5 saves. With no `mode` and no `seed` the dialog
  opens; `?sandbox=1` (old links and tests) means Sandbox with everything unlocked.
- **Sandbox options** are plain flags on the city and simulation: `progress.sandbox` (unlock all), `city.freeBuild`
  (`canAfford` is always true and undo refunds exactly what was paid), `sim.noDecline` (warnings, no decline). They can
  be toggled live from the sandbox panel.
- **Goals mode = chapters** (`data/chapters.json`, `src/sim/goals.ts`). A chapter is a list of goals: population,
  building count, stock, production per second, ruins explored. Goals are checked on the city's `stock` event (once a
  game second), not every tick. Finishing pays the reward and, for most chapters, offers a choice of two packs.
- **Building packs** (`data/packs.json`) gate a building only in Goals mode (`progress.packsEnabled`). A pack not
  chosen is offered again at the next choice, and every remaining pack opens when the last chapter is done, so no
  path closes for good. Population unlocks still apply on top of packs.
- **`unlock.revealAt`** hides advanced buildings from the menu until peak population reaches it, so the early menu
  stays short. Locked but revealed buildings show why (pack or population) in the menu and in the placement checklist.
- **Buildings per biome** (`data/buildings/biomes.json`): steppe, cold, mountain, beach, shore, ruins and temperate
  tags in `data/terrain-tags.json`, checked through `terrainQuery.hasTag`. A new biome building is data only.
- **Ruins (POIs)** (`src/sim/poi.ts`). Placement is a pure function of (seed, chunk) like terrain: 22% of chunks,
  never the start chunk, on land. Only the set of explored keys is state. A POI is explored when a building is placed
  within 2 tiles; the reward is paid once. `PoiRenderer` draws one instanced obelisk per POI near the camera (gold
  until explored, grey after).

## Consequences

- Determinism holds: no new randomness outside the seeded streams; chapters and packs depend only on actions.
- M5 must save: explored POI keys, chapter index, pending choice, chosen packs and the sandbox flags.
- Deferred to M4b: a second town, dormant-town simulation tier, tutorial.
