# AG-006 — Game menu, setup and in-game interface

- Milestone: M7
- Assignee: Antigravity
- Branch: `agent/ag/m7-game-shell`

## Goal

Give Myriad Towns a full-screen launcher, a configurable new-game flow, and a compact in-game interface that frames the map.

## Allowed to edit

- `index.html`, `src/{entry,main}.ts`
- `src/ui/{launcher,gameStart,newGame,settingsMenu,saveMenu,buildMenu,simBar,sessionControls}.ts`
- `src/ui/gameShell.css`
- `public/art/menu-town.webp`, `CREDITS.md`, `data/i18n/{en,vi}.json`
- `tests/unit/ui/gameStart.test.ts`, `tests/e2e/{progression,save,layout}.spec.ts` and this spec

## Contracts used

Existing settings and IndexedDB save slots, URL game setup, seeded terrain sampling, city stock, simulation clock and build tools.

## Acceptance criteria

- The root opens the launcher without starting the 3D world. New Game, Continue, Load and Settings lead to working screens.
- Name, seed, starting area, terrain and supplies affect the new game. Existing saves and direct game URLs still load.
- In-game controls provide a compact toolbar, a left building inspector and lighting controls, and time controls near the map dock.
- Verify desktop and phone layouts, project checks and browser tests.

## Result

- Added a full-screen launcher with an original riverside city backdrop, new-game setup, recent save, save library, settings and credits. The launcher loads separately from the WebGL game.
- New cities can choose a name, seed, starting area, supply level and terrain surface. The starting area selects a seeded tile in the existing infinite world. The terrain surface applies to the browser's display settings.
- The game now places lighting and the building inspector on the left, population with stock on the right, time and speed beside the map, and a compact icon toolbar at the bottom. The session menu can save and return to the launcher.
- Added unit coverage for seeded spawn selection and supplies. Browser tests cover setup, settings, lighting, saves and mobile sizing.
- Passed `npm run check` with 171 unit tests, `npm run format:check`, and 39 Chromium end-to-end tests. Verified that the production build resolves the artwork under `/myriad-towns/`.

## Artwork

Built-in OpenAI ImageGen prompt for `public/art/menu-town.webp`:

> Generate an original widescreen 16:9 raster background for the main menu of an indie city-builder called Myriad Towns. The image itself contains NO text, letters, logos, GUI, buttons, or labels. Scene: isometric aerial view of a small prosperous riverside brick town with ochre and verdigris roofs, terraced waterfront, a distinctive small clocktower, honey-colored street windows, dense leafy public gardens, quiet boulevards, a narrow stone arcade bridge across a winding teal river, all rendered as refined in-engine voxel/block-built miniature graphics with crisp cuboid geometry and realistic soft ambient occlusion. Town on the mid/right two thirds of the frame, shaded waterfront and relatively quieter detail on the far left third for white menu text overlays. Clear readable scene, spring late afternoon sunlight, warm lamplight, parchment stone, petrol-blue water, dark teal trees and deep shadows. Full bleed crop, no horizon line, no frame. Original town design and composition, no branding or reference-game assets.
