# AG-008 — Cottage prototype

- Milestone: M7
- Assignee: Antigravity
- Branch: `agent/ag/m7-cottage-prototype`
- Depends on: AG-007 architectural concept and M7 building architecture

## Goal

Build the approved Nhà gỗ 1×1 concept as a real 3D prototype in Myriad Towns. The owner will judge this one building from close and neighbourhood views before authorizing the remaining eleven concepts.

## Context to read first

- `AGENTS.md`, `GEMINI.md`, `docs/contracts/README.md`, `docs/tasks/M7-building-architecture.md`
- `art/concepts/m7-buildings/individual/cottage.png`, the approved reference (read-only)
- The `cottage` definition, `src/render/architecture/housing.ts`, the shared geometry entry point and thumbnail renderer

## Allowed to edit

- `src/render/architecture/housing.ts`
- `src/render/architecture/cottage.ts`, a dedicated cottage geometry recipe
- `src/render/architecture/lot.ts` only if a reusable footprint-scaled geometry primitive is necessary
- `tests/unit/cottageModel.test.ts` for a focused rendering regression if needed, and this spec

## Functional requirements

1. Use the existing `cottage` definition and geometry entry point so the same detail appears in a loaded city, the construction preview, and its thumbnail. Preserve its ID, 1×1 footprint, save compatibility and game rules.
2. Reproduce the approved style at game scale: steep clay-tile roof with a visible eave and support framing, offset dormer, chimney with stone courses, timber-framed plaster walls, stone base, covered entrance with steps, warm inset windows, and a fenced strip of garden. Use concept proportions as a guide and make the silhouette readable at the ordinary game zoom. Use connected shapes and believable shadows and colour contrast. Keep the ground level with neighbouring lots.
3. Build proper all-sided 3D geometry. Use vertex colour and shallow relief or a compact model-local implementation for repeated tile courses and timber. Reuse the cached merged geometry and existing materials; keep additional geometry modest and avoid global shader changes, new dependencies, external assets and per-instance or per-frame overhead.
4. Stop after the cottage prototype and report paths, checks and any deviations. The coordinator will verify the live game and capture two zoom levels. This local approval authorizes neither the other eleven models nor any push or PR.

## Acceptance criteria

- The existing cottage ID resolves to the detailed model in its normal build, thumbnail and preview paths, within its footprint.
- `npm run check` and `npm run format:check` pass. Existing housing growth and save tests still pass.
- Confirm the appearance in Chromium at close and neighbourhood zoom for the owner to review.

## Result

- Created `src/render/architecture/cottage.ts` implementing the approved Nhà gỗ 1×1 cottage prototype based on `art/concepts/m7-buildings/individual/cottage.png`:
  - Steep clay-tile roof with 6 stepped horizontal terracotta tile courses, overhanging eaves, exposed rafter tails, carved ridge beam extending beyond the gables, and prominent dark timber bargeboards.
  - Distinct offset dormer on the +X roof slope with wood-shingle pitched roof, bargeboards, lit window, and flower box.
  - Plaster walls with dark timber framing (corner posts, sills, wall plates, diagonal bracing struts, upper gable stud).
  - Raised stone plinth foundation with corner cobblestone relief blocks.
  - Covered front entrance porch with elevated wooden deck, 3 wooden steps leading down to the front path, timber posts, gabled canopy with pediment truss, wooden plank door with knocker, warm glowing wall lantern, and climbing rose vine with red blossoms.
  - Warm inset windows (`glow = 1` for night illumination) with timber frames and colorful flower boxes on the upper gable, dormer, and ground floor side walls.
  - Fenced vegetable garden in the front-right yard with wooden post-and-rail fence, dark soil bed, cabbage heads, carrots with foliage, garden greens, and metal watering can.
  - Stone water well with cylindrical stone basin, water surface, timber uprights, crossbeam, miniature terracotta gable roof, and bucket.
  - Rear stone masonry chimney with stone courses, cornice cap,.
  - Front dirt/stepping stone pathway, stone curb lot perimeter, two yard trees, and wildflower patches.
- Updated `src/render/architecture/housing.ts` to wire `cottage` to the new dedicated recipe, preserving the existing building ID, 1×1 footprint, save compatibility, thumbnail generation, and construction preview.
- Added `tests/unit/cottageModel.test.ts` to verify footprint bounds ([0, 1]×[0, 1]), ground plane alignment, part count, and glow attributes for lit windows.
- Grounded the porch steps, offset the timber faces from the plaster, and added a stone rim around the visible well water during visual review.
- Passed `npm run check` with 189 unit tests, `npm run format:check`, and four Chromium checks for launch, thumbnails, upgrades and save reload.
- Reopened Bến Sương with 496 residents and 243 buildings. Inspected the cottage row at camera distances 10 and 27.8 and activated the cottage tool from its rendered thumbnail.
- The shared mesh has 3,380 triangles and fits inside the 1×1 footprint. The prototype renders a stone chimney cap as static geometry.
