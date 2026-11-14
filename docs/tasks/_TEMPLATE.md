# <ID> — <Short title>

- Milestone: M?
- Assignee: Claude | Antigravity
- Branch: `agent/<claude|ag>/<milestone>-<slug>`
- Depends on: <contracts / other tasks that must be merged first>

## Goal

<1–2 sentences: what the player or developer gets.>

## Context to read first

- AGENTS.md
- <contract files, related source>

## Allowed to edit

- <exact paths or globs>

## Do NOT edit

- Everything else, especially `src/core/**`, `src/world/**`, `src/sim/**`, `docs/contracts/**`.

## Contracts used

- <types / events / functions this task consumes, read-only>

## Functional requirements

1. <numbered, testable>

## Non-functional requirements

- No per-frame allocation; <time budget>; UI strings via `data/i18n`.

## Acceptance criteria and how to check

- [ ] `npm run check` passes
- [ ] <specific test command or manual step>

## Out of scope

- <what not to do>

## Result (filled in by the assignee)

<What changed, how it was tested, anything the reviewer should look at.>
