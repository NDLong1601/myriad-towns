# ADR-002 — Buildings, rules and undo (M2)

- Status: accepted (instancing choice provisional until AG-002 reports)
- Date: 2026-11-14

## Decisions

- **Buildings are data.** `data/buildings/*.json`, validated by `npm run validate-data` against
  `data/schema/building.schema.json`, plus cross-checks: every resource, field, terrain tag and building id must
  exist (`data/resources.json`, `data/fields.json`, `data/terrain-tags.json`) and have vi/en names.
- **One rule engine** (`src/sim/requirements.ts`). Placement, the hover checklist, inspection and (from M3)
  upgrade/decline all call the same `checkRequirement`. The UI only formats `CheckResult`s, so what the player sees
  is exactly what the rules decide (tested: 300 random placements, checklist verdict = command result).
- **Distance rule**: Euclidean distance between the nearest tiles of two footprints (`src/sim/geometry.ts`), used
  by every radius: emits, `near`, `notNear`, `terrain`, `road`.
- **Local fields are integers** (hundredths) per chunk (`src/sim/fields.ts`), updated incrementally when a building
  is added or removed. Add then remove is exact, so undo restores fields byte for byte (property-tested).
- **Spatial index**: per-chunk sets of building ids; radius queries visit only chunks the radius touches.
- **Commands + 50-step history** (`src/sim/commands.ts`): Place, Demolish (75 % refund, `data/resources.json`),
  Batch (a dragged road is one undo step). Redo keeps the same building id.
- **Cutting trees is a terrain edit**: placing on a tree tile removes the tree; undo grows it back. Edits live in
  `GeneratedTerrain.clearedTrees` and are re-applied when a chunk is regenerated; affected chunk meshes are rebuilt
  on the main thread (~2 ms each).
- **Rendering**: one `InstancedMesh` per building type with procedural low-poly geometry built from the `visual`
  block (shared vertex-coloured material). Buildings stand on the generated surface height, so they do not depend
  on chunks being loaded.
- **Picking** walks the camera ray across the tile grid (DDA) against tile heights instead of raycasting meshes.

## Measured (cloud machine, headless Chromium + SwiftShader)

| What                                               | Value                              |
| -------------------------------------------------- | ---------------------------------- |
| `checkPlacement` with 2,000 buildings placed       | ~0.012 ms                          |
| Place command (check + apply + render update)      | ~0.3 ms                            |
| Draw calls with 2,000 buildings of 6 types in view | 94 (terrain + 6 instanced batches) |

## Not done in M2 (moved)

- Plan mode (ghost buildings without cost) → M3, together with the tick loop.
- Context variants (coastal/industrial looks) → M6 with real models.
- Unlock thresholds are in the data but not enforced yet (no population until M3).
