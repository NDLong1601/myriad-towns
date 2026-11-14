# ADR-000 — Base stack (M0)

- Status: accepted
- Date: 2026-11-14

## Decision

TypeScript 6.0.3 (strict) · Vite 8.3.8 · three 0.187.0 (WebGLRenderer / WebGL2 default) · Vitest 5.1.0 ·
Playwright 1.65.1 · ESLint 10 + typescript-eslint 8.72.2 · Prettier 3.10.1 · Ajv 8.20.0 for data validation.
All pinned exactly. Static hosting on GitHub Pages via GitHub Actions; Cloudflare Pages is the fallback if we ever
need COOP/COEP headers.

## Why

- TypeScript 7.0.2 exists but typescript-eslint 8.72.2 supports `<6.1`, so we stay on 6.0.3 until it catches up.
- No SharedArrayBuffer in v1 (workers use transferables), so GitHub Pages works without special headers.
- `npm audit` reports a moderate minimatch advisory inside typescript-eslint (dev-only, lint time). Accepted;
  recheck when typescript-eslint updates.

## Consequences

Upgrading any of these is a separate PR with `npm run check` and the e2e smoke test green.
