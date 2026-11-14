# Contracts

Interfaces other modules (and other agents) build against. Owned by Claude; change only through a dedicated PR.

| Contract                           | File                                    | Since |
| ---------------------------------- | --------------------------------------- | ----- |
| Tile/chunk coordinates, chunk keys | `src/core/coords.ts`                    | M0    |
| Seeded hashing and RNG streams     | `src/core/prng.ts`                      | M0    |
| Save/gen versions                  | `src/core/version.ts`                   | M0    |
| Building data                      | `data/schema/building.schema.json` (v0) | M0    |

| Building definitions and catalog | `src/sim/catalog.ts`, `data/schema/building.schema.json` (v0 + `visual`, `placeOn`) | M2 |
| Resources, fields, terrain tags (data) | `data/resources.json`, `data/fields.json`, `data/terrain-tags.json` | M2 |
| Rule checks (`CheckResult`, `checkPlacement`, `checkUpgrades`, `checkSustain`) | `src/sim/requirements.ts` | M2 |
| City state + events (`City.on`) | `src/sim/city.ts` | M2 |
| Commands and undo history | `src/sim/commands.ts` | M2 |
| Build menu tool handle | `src/ui/buildMenu.ts` (`BuildMenu`, `Tool`) | M2 |

Planned: sim read store (M3), `AudioZones` (M6).
