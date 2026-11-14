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
- `src/main.ts` (`view.renderer` is the `THREE.WebGLRenderer`; `view.onFrame(dt => …)` runs every frame; `window.__MYRIAD__.stats()` already exposes chunk counts)
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

- `THREE.WebGLRenderer` instance `view.renderer` (read-only), `view.onFrame`, `view.chunks.stats()` (read-only).

## Functional requirements

1. Export `mountDebugOverlay(renderer: THREE.WebGLRenderer, parent: HTMLElement): { toggle(): void; dispose(): void }`.
2. F3 toggles visibility (prevent the browser default). Hidden by default. `?debug=1` in the URL shows it at start.
3. Shows, updated twice per second: FPS (averaged), frame time ms (avg, p95 and worst of the last 0.5 s), draw calls,
   triangles, geometries, textures, chunks visible/loaded/pending, avg chunk generation ms,
   JS heap MB when `performance.memory` exists (else "n/a").
4. Positioned bottom-left, monospace, does not capture mouse events.
5. Labels come from `data/i18n` keys `debug.*`.

## Non-functional requirements

- No allocation per frame: keep counters in numbers, update DOM text only on the 0.5 s tick.
- Overlay costs < 0.1 ms per frame.

## Acceptance criteria and how to check

- [x] `npm run check` passes
- [x] Unit test for the FPS / frame-time averaging logic (pure function, no DOM needed)
- [x] E2E: open `/?debug=1`, overlay visible and shows a draw-call number > 0; press F3, overlay hidden
- [x] Manual: `npm run dev`, press F3, numbers update

## Out of scope

- GPU timer queries, graphs/charts, settings menu.

## Result (filled in by the assignee)

### Files changed

- `src/ui/debugOverlay.ts` (new): Implemented `mountDebugOverlay`, `computeFrameStats` (pure function for FPS/frame time stats), and zero-allocation per-frame `FrameTracker`.
- `src/ui/debugOverlay.css` (new): Styles for the overlay positioned bottom-left, monospace font, `pointer-events: none`, hidden state toggle.
- `src/main.ts`: Imported `mountDebugOverlay` and mounted it to `document.body` (2 lines added).
- `tests/unit/ui/debugOverlay.test.ts` (new): Unit tests for `computeFrameStats` (empty, single sample, 60fps uniform, uneven frame times with p95/worst, elapsed duration) and `FrameTracker`.
- `tests/e2e/debugOverlay.spec.ts` (new): Playwright E2E tests for `/?debug=1` (visible on load, draw calls > 0, F3 toggle) and default hidden state (F3 toggle).
- `data/i18n/vi.json`: Added `debug.*` keys in Vietnamese.
- `data/i18n/en.json`: Added `debug.*` keys in English.
- `docs/tasks/AG-001-debug-overlay.md`: Checked acceptance criteria and documented task results.

### Testing

- `npm run format`: Prettier check clean (`npm run format:check`).
- `npm run check`: All checks passed (eslint, typecheck, validate-data, 41 unit tests across 7 test files, and production build).
- `npm run test:e2e`: All 5 Playwright E2E tests passed on Chromium (smoke, world streaming, world camera, and the 2 new debug overlay tests).

### Numbers measured on this machine (`npm run dev` + F3)

- FPS: 7 - 8 FPS (headless Chromium with SwiftShader / software WebGL)
- Frame time: 126.6 ms (p95: 133.4 ms, worst: 133.4 ms)
- Draw calls: 87
- Triangles: 402,508
- Geometries: 65
- Textures: 2
- Chunks: 169 visible / 225 loaded / 0 pending
- Avg chunk gen: 17.9 ms
- JS Heap: 48.1 MB
