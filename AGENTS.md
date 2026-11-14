# AGENTS.md — rules for every coding agent (Claude Code, Antigravity, others)

This is the single source of truth for conventions. `CLAUDE.md` and `GEMINI.md` only point here.
Read it fully before starting a task. If a task spec in `docs/tasks/` contradicts this file, the task spec wins for that task only.

## The project

Myriad Towns is an **original** browser city builder: an infinite, procedurally generated tile world where
buildings upgrade or decline based on what is within a radius of them. It is inspired by the genre, not a copy:
never use names, art, text, data or assets from other games (e.g. Urbek). All assets must be CC0, CC-BY (credited
in `CREDITS.md`) or made by us.

Design and plan: see `docs/architecture.md` and the research report (kept outside the repo).

## Commands

| What               | Command                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| Install            | `npm ci` (Node 22, see `.nvmrc`)                                                    |
| Dev server         | `npm run dev` → http://localhost:5173                                               |
| Everything CI runs | `npm run check` (lint, typecheck, validate-data, unit tests, build)                 |
| Unit tests         | `npm test` (Vitest, `tests/unit/**/*.test.ts`)                                      |
| E2E smoke          | `npm run build && npm run test:e2e` (first time: `npx playwright install chromium`) |
| Data check         | `npm run validate-data`                                                             |
| Format             | `npm run format`                                                                    |

A task is **not done** until `npm run check` passes and `npm run format:check` is clean.

## Layout and module boundaries

```
src/core     math, coords, prng, version, command/undo, event bus   → imports nothing from src/
src/world    chunk store, generation, biomes, rivers, fog            → core, data
src/sim      tick loop, rule engine, fields, economy, towns, trade   → core, world, data
src/render   three.js: chunk meshes, instancing, overlays, camera    → core, world, sim (read-only)
src/ui       DOM panels, HUD, placement preview, settings            → core, sim/render via contracts
src/io       save/load, migrations, export/import                    → core, world, sim
src/audio    ambience and SFX
src/workers  worker entry points
data/        JSON content (buildings, biomes, goals, i18n) + JSON Schemas
docs/        architecture, contracts, task specs, ADRs
tests/       unit (Vitest), e2e (Playwright)
scripts/     node scripts (validate-data, asset pipeline)
```

- `sim` and `world` must never import `render`, `ui`, `audio` or `three` (they run headless in tests and workers).
  ESLint enforces this.
- Import with the `@/` alias (`import { chunkKey } from '@/core/coords'`), not long relative paths.

## Hard rules

1. **Determinism.** No `Math.random` or `Date.now` in `src/core`, `src/world`, `src/sim`. Use `@/core/prng`
   (`hash32`, `rngFor`). Same seed must give the same world forever; if generation output changes on purpose,
   bump `GEN_VERSION` in `src/core/version.ts` and update golden tests in the same PR.
2. **Contracts first.** Files in `docs/contracts/` and the exported types of `src/core/coords.ts`,
   `src/core/prng.ts` are owned by Claude. Do not change them inside a feature task; ask for a contract change.
3. **No new dependencies** without an ADR in `docs/adr/`. Pin exact versions (`npm i -E`).
4. **Stay in scope.** Only edit files listed under "Allowed to edit" in your task spec.
5. **No per-frame allocation** in render/sim hot paths (reuse vectors, matrices, arrays).
6. **Data over code.** New buildings and rules go in `data/buildings/*.json` and must pass `npm run validate-data`.
   Every building needs a name in every `data/i18n/*.json`.
7. **TypeScript strict.** No `any`, no `@ts-ignore` without a comment saying why.
8. **UI text** comes from `data/i18n` keys (Vietnamese `vi` and English `en`), never hard-coded.

## File ownership

| Area                                                                                                                                             | Owner                       | Others may     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | -------------- |
| `src/core`, `src/world`, `src/sim`, `src/io`, `src/render` core (chunks, instancing, floating origin), `docs/contracts`, `docs/adr`, `AGENTS.md` | Claude                      | read only      |
| `src/ui/panels/*`, `src/render/shaders/*`, `scripts/*`, `data/**` content, `tests/e2e/*`, user docs                                              | Antigravity (per task spec) | Claude reviews |
| Anything else                                                                                                                                    | whoever the task spec names | —              |

## Git workflow

- One task = one branch = one PR into `main`. Branch name: `agent/<claude|ag>/<milestone>-<slug>`,
  e.g. `agent/ag/m1-debug-overlay`.
- Small commits, imperative messages: `Add F3 debug overlay`.
- Squash-merge after review. Claude reviews every Antigravity PR; CI must be green.
- Never force-push `main`. Never commit `node_modules/`, `dist/`, secrets or large binaries outside Git LFS.

## Task specs

Each task lives in `docs/tasks/<ID>.md`, written from `docs/tasks/_TEMPLATE.md`. Read it end to end before coding.
When done, fill in the "Result" section of the spec (what changed, how you tested it) in the same PR.

## Definition of done

- Acceptance criteria in the task spec all hold.
- `npm run check` and `npm run format:check` pass; new logic has unit tests.
- No files changed outside the allowed list.
- Task spec "Result" section filled in.
