# ADR-003 — Simulation, economy and the rule engine (M3)

- Status: accepted
- Date: 2026-11-14

## Decisions

- **Fixed tick, 4 Hz at 1×** (`src/sim/clock.ts`). Speeds 0 / 1 / 2 / 4 run more ticks per frame, at most 16 per
  frame (a stall drops time instead of catching up). All rates in data are **per second at 1×**.
- **One `Simulation.step()`** (`src/sim/simulation.ts`): economy → rule engine → unlocks. Deterministic: no clocks or
  randomness, buildings visited in uid order. `Simulation.hash()` covers stock and every building's state; a headless
  test runs 10,000 ticks three times and compares hashes.
- **Economy every tick.** Housing that was fed on the previous tick supplies labour (`labor`, `skilled`, `expert`,
  never stored). Workplaces are staffed in priority order (food → service → production → others, then uid); a
  workplace without staff idles. Staffed buildings consume inputs and produce outputs if the stock covers one tick;
  housing that cannot eat is "hungry". Population = housing capacity of active housing.
- **Rule engine on 1/8 of buildings per tick** (each checked every 2 s at 1×), using the same `checkRequirement` as
  placement and the hover checklist:
  - a building that fails its own `requires`, or housing that is hungry, accumulates `unmetTicks`;
  - at `graceTicks − warnAtTicks` it emits **`warn`** (toast, warm tint, countdown in the panel);
  - at `graceTicks`, and never sooner than `warnAtTicks` after the warning, it **declines**: to `decline.to` if set,
    otherwise it is **abandoned** (stops working, its emits are removed, drawn dark);
  - abandoned buildings **recover** as soon as their requirements hold and their inputs are in stock;
  - healthy, supplied buildings **upgrade** in place to the first `upgrades[]` entry whose `when` holds, whose target
    is unlocked, has the same footprint, and whose own `requires` would hold (no upgrade into an immediate decline).
    Upgrades are free.
- **Upgrades and declines are not undo steps.** They are `City._replace` (removed + added with the same uid) so
  renderers need no new case. Undoing a placement removes whatever the building has become and refunds the original
  cost; fields stay exact because removal always uses the current type.
- **Unlocks** (`src/sim/progress.ts`): by peak population and optional building counts, latched once met. Locked
  buildings stay in the menu, greyed, with their threshold; placing one shows `req.locked` in the checklist.
  `?sandbox=1` unlocks everything (tests; real Sandbox mode in M4).
- **Plan mode** (`src/sim/plan.ts`, key P): free ghost drafts that ignore cost and requirements but not the ground.
  "Build plan" places every draft that is valid and affordable, roads first, as **one** undo step.
- **Heatmap** (`src/render/heatmap.ts`, keys 1–9, 0): one field around the camera (81×81 tiles), viridis ramp,
  rebuilt only when buildings change or the camera moves 6+ tiles.

## Measured (cloud machine, Node, unit test)

| What                                              | Value        |
| ------------------------------------------------- | ------------ |
| Tick with 5,000 non-road buildings (+3,200 roads) | ≈ 1.8 ms     |
| Economy part / rule part                          | 1.0 / 0.7 ms |

Two optimisations got there from 12.7 ms: per-type precompiled upkeep/produce lists (no `Object.entries` per tick),
and numeric tile keys plus a ring-outward scan for the road-distance rule.

## Not done in M3 (moved)

- The three simulation tiers for far-away towns and the town summary → M4, with a second town.
- Storage caps and warehouses → M4 balance pass.
- Plan drafts are not saved and not in undo history → M5 (saves).
