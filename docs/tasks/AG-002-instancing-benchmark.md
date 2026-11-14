# AG-002 — Benchmark InstancedMesh vs BatchedMesh for buildings

- Milestone: M1 → feeds M2
- Assignee: Antigravity
- Branch: `agent/ag/m1-instancing-bench`
- Depends on: nothing

## Goal

Decide, with numbers, how M2 should draw thousands of buildings: `InstancedMesh` per model, or `BatchedMesh`.

## Context to read first

- AGENTS.md, docs/adr/ADR-001-chunks-and-workers.md
- three.js r187 docs: InstancedMesh, BatchedMesh

## Allowed to edit

- `bench/instancing.html` (new), `bench/instancing.ts` (new)
- `vite.config.ts`: only add `bench/instancing.html` as an extra build input if needed
- `docs/adr/ADR-002-building-instancing.md` (new, results)

## Do NOT edit

- `src/**`, `tests/**`, `data/**`.

## Functional requirements

1. A standalone page (`npm run dev` → `/bench/instancing.html`) that draws N low-poly "buildings" (a box + a
   pyramid roof, 12 different colour/size variants) on a 200×200 grid.
2. Modes via URL: `?mode=instanced|batched&n=5000|20000|50000`.
3. Shows avg and p95 frame time over 10 s while the camera orbits automatically, plus draw calls and triangles.
4. A second test per mode: change 1% of instances per frame (move/recolour), report frame time again.

## Acceptance criteria and how to check

- [ ] `npm run check` passes
- [ ] ADR-002 contains a results table for both modes × three N values on the developer's own PC
      (write the GPU and browser) and a recommendation.

## Out of scope

- Integrating into the game.

## Result (filled in by the assignee)
