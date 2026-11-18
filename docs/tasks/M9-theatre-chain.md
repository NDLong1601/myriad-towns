# M9 — Detailed theatre chain

- Milestone: M9
- Assignee: Claude scope (renderer, data)
- Branch: `claude/project-thread-q2xyq9`

## Goal

Add a culture building chain modelled with more realistic detail than earlier groups, as a reference for future model upgrades.

## Result

- `data/buildings/theatre.json`: `open_air_stage` -> `playhouse` -> `opera_house` (2×2, culture), with upgrade and decline rules and en/vi names.
- `src/render/architecture/theatreTiers.ts`: hipped roofs with tile courses and hip caps, recessed arched windows, column orders, dentil cornices, layered tree canopies, street furniture and figures.
- `src/render/architecture/weathering.ts`: baked contact shadow and per-part tone variation in vertex colours (no extra draw calls or shader cost). Applied to the theatre chain only.
- `Lot.shape()` places custom geometry in a lot.
- `tools/building-preview.html`: dev-only turntable for any catalogue building (`?ids=`, `yaw`, `pitch`, `zoom`, `night=1`).
