# AG-001 — F3 debug overlay

- Milestone: M1 (first task to test the Antigravity workflow)
- Assignee: Antigravity
- Branch: `agent/ag/m1-debug-overlay`
- Depends on: nothing (uses three.js `renderer.info`, already available)

## Goal

Pressing F3 toggles a small overlay with performance numbers, so every later milestone can be checked against the
performance budget.

## Context to read first

- AGENTS.md
- `src/main.ts`, `src/render/helloScene.ts` (`createHelloScene` returns `{ renderer }`)
- three.js docs: `WebGLRenderer.info` (render.calls, render.triangles, memory.geometries, memory.textures)

## Allowed to edit

- `src/ui/debugOverlay.ts` (new)
- `src/ui/debugOverlay.css` (new)
- `src/main.ts` (only: import and mount the overlay, max ~5 lines)
- `tests/unit/ui/debugOverlay.test.ts` (new)
- `tests/e2e/debugOverlay.spec.ts` (new)
- `data/i18n/vi.json`, `data/i18n/en.json` (only new `debug.*` keys)

## Do NOT edit

- Everything else, especially `src/core/**` and `src/render/**`.

## Contracts used

- `THREE.WebGLRenderer` instance from `createHelloScene(...).renderer` (read-only).

## Functional requirements

1. Export `mountDebugOverlay(renderer: THREE.WebGLRenderer, parent: HTMLElement): { toggle(): void; dispose(): void }`.
2. F3 toggles visibility (prevent the browser default). Hidden by default. `?debug=1` in the URL shows it at start.
3. Shows, updated twice per second: FPS (averaged), frame time ms (avg and worst of the last 0.5 s), draw calls,
   triangles, geometries, textures, JS heap MB when `performance.memory` exists (else "n/a").
4. Positioned bottom-left, monospace, does not capture mouse events.
5. Labels come from `data/i18n` keys `debug.*`.

## Non-functional requirements

- No allocation per frame: keep counters in numbers, update DOM text only on the 0.5 s tick.
- Overlay costs < 0.1 ms per frame.

## Acceptance criteria and how to check

- [ ] `npm run check` passes
- [ ] Unit test for the FPS / frame-time averaging logic (pure function, no DOM needed)
- [ ] E2E: open `/?debug=1`, overlay visible and shows a draw-call number > 0; press F3, overlay hidden
- [ ] Manual: `npm run dev`, press F3, numbers update

## Out of scope

- GPU timer queries, graphs/charts, settings menu.

## Result (filled in by the assignee)
