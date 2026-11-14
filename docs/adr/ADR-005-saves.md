# ADR-005: Saves, migrations and settings (M5)

- Status: accepted
- Date: 2026-11-14

## Decisions

- **A save is the seed plus the player's changes** (`src/io/save.ts`). The world is regenerated from the seed, so a
  save holds:
  - Buildings, grouped per chunk (`ChunkRec`, 7 numbers per building: uid, def index, x, z, flags, unmetTicks,
    warnedAt) with one table of building ids.
  - Cut trees.
  - Stock, tick and `nextUid`.
  - Unlock progress (peak population, packs, latched and announced unlocks).
  - Explored ruins, the chapter index and any pending pack choice.
  - Towns and the camera.

  The undo history, plan drafts and per-tick shortages are not saved. Shortages are recomputed on the next tick.

- **Loading rebuilds a fresh game** (`applySave`): explored ruins and towns first (so re-adding buildings neither
  pays rewards nor founds towns), then buildings in uid order through `City._add`, then per-building simulation
  state, stock and tick. A loaded game has the same `Simulation.hash()` and stays in step tick for tick (unit test).
  Building ids missing from the current data are skipped and reported.
- **Format: gzip(JSON)** via the platform `CompressionStream` (`src/io/codec.ts`), file extension `.mtsave`. JSON
  keeps saves debuggable; gzip removes most of its overhead. Measured: 50 dense chunks with 21,600 buildings
  are 92 KB (465 KB as plain JSON). The M5 budget was ≤ 1 MB for 50 chunks. msgpack was not worth a dependency.
- **IndexedDB slots** (`src/io/store.ts`): one record per game (summary + bytes). Each game gets a slot id. The first
  save rewrites the URL to `?load=<id>`, so reloading the tab continues the game.
  - Autosave: every 2 minutes and when the page is hidden; off in settings or with `?autosave=0`.
  - Ctrl+S saves.
  - The new-game screen offers "Continue" for the latest slot.
  - Export and import move a slot to and from a `.mtsave` file.
- **Migrations** (`src/io/migrations/`). `SAVE_SCHEMA_VERSION` is now 2.
  - `STEPS[n]` turns version n into n + 1, and the steps run in order on load.
  - Files from a newer version are refused with a clear error.
  - Version 1 is the flat prototype layout (a list of buildings, no simulation state). Its fixture
    `tests/fixtures/save-v1.json` must keep loading.
- **`genVersion`**: saves record the generator version. With a single generator so far, a mismatch only shows a
  warning and the save loads on the current generator. When generation changes for real, either keep the old
  generator in the bundle for old saves, or store full terrain for modified chunks; decide in that PR.
- **Settings** (`src/ui/settingsStore.ts`, localStorage `mt.settings`): graphics quality, view radius, language and
  autosave. URL params still win (tests, shared links). These options apply on reload, so "Apply" saves the game
  and reloads into its slot.

## Consequences

- New state must be added to `takeSave`/`applySave`, and a schema change needs a migration step plus a fixture.
- Not done in M5: separate per-chunk records and dirty-chunk autosave (a whole save is under 100 KB and takes a few
  ms, so it is not needed yet), UI scale, key rebinding and the WebGPU option.
