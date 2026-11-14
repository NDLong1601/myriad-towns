# ADR-004 — Progression: modes, chapters, packs, biome buildings, ruins, towns (M4)

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
- M5 must also save the towns (centre, founding uid) and the tutorial flag stays in localStorage.

## M4b: towns, the dormant tier, the tutorial

- **Towns** (`src/sim/towns.ts`). The first building founds the first town at its centre. A **Town hall**
  (`data/buildings/towns.json`) founds another one; it costs a **Charter** (a stock resource: the "town" chapter
  rewards one, Sandbox starts with 3) and must be at least `MIN_TOWN_GAP` = 64 tiles from every other town centre.
  The last chapter now asks for 2 towns.
- **Territory**: radius `28 + 3·√population` around each centre, drawn as a line on the ground. In Goals mode
  buildings must be placed inside a territory (`req.territory` says how far outside); Sandbox does not enforce it.
  Placement rules are pluggable: `City.siteRules` lets a system add a site check without touching
  `requirements.ts` again.
- **Membership** is the nearest town centre, not the territory, so it only changes when a town is founded or
  removed. The simulation caches it per building and rebuilds when `TownStore.version` changes.
- **Dormant tier** (`Simulation.setDormant`). A town whose border is more than 96 tiles from the camera sleeps:
  its buildings leave the per-tick lists, and its economy continues as the rates it had on its last active tick
  (production, consumption, population, its own labour). Consumption takes at most what the stock holds, so a
  sleeping town can run short but never drives stock negative. No rule checks run, so nothing upgrades or declines
  while nobody watches; waking resumes from the frozen per-building state. Re-evaluated once a second; `?tiers=0`
  turns it off.
  - Measured (Node, 8,551 buildings in two equal towns, best of 5 × 200 ticks): both active 1.11 ms/tick, one
    asleep 0.53–0.68 ms, both asleep 0.06 ms.
  - Trade-off: a sleeping town's rates do not react to stock running out elsewhere; good enough for a summary
    tier, and the town catches up with real rules the moment the camera comes back.
- **Tutorial** (`src/ui/tutorial.ts`): seven steps in the left column (move, road, hut, food, well, inspect,
  finish). Each finishes by doing it, steps already done are skipped, and it can be skipped at any time. The
  new-game dialog turns it on (`?tut=1`) until this browser has finished or skipped it once.
- Not done: the "Wilderness" expansion cost from the plan, and trade routes between towns (shared stock stands in
  for trade for now).
