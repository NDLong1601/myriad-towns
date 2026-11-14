# Contracts

Interfaces other modules (and other agents) build against. Owned by Claude; change only through a dedicated PR.

| Contract                           | File                                    | Since |
| ---------------------------------- | --------------------------------------- | ----- |
| Tile/chunk coordinates, chunk keys | `src/core/coords.ts`                    | M0    |
| Seeded hashing and RNG streams     | `src/core/prng.ts`                      | M0    |
| Save/gen versions                  | `src/core/version.ts`                   | M0    |
| Building data                      | `data/schema/building.schema.json` (v0) | M0    |

Planned: `CameraController` (M1), `PlacementPreview` and command/undo (M2), sim read store (M3), `AudioZones` (M6).
