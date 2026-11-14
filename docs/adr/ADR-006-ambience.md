# ADR-006: Day/night, procedural audio and placement feedback (M6a)

Status: accepted (M6a)

## Context

M6 is about how the game feels. It must not cost download size, frame time or determinism.

## Decisions

- **Day and night follow game time**, not wall time: `timeOfDay(sim.tick)` with
  `TICKS_PER_DAY = 2400` (10 minutes at ×1). Pausing stops the sun, and a loaded save comes back at
  the same hour. Lighting is a pure keyframe table (`src/render/dayNight.ts`), smoothstepped
  between keys; only light colours, intensities, sky/fog colour and the sun direction change per
  frame (no new lights, no shader changes). The light never drops below ~25° elevation, so shadows
  stay short, and night ambient stays at ≥ 0.75 so buildings remain readable.
- **All audio is synthesised with WebAudio** (`src/audio/audioEngine.ts`): oscillators and one
  shared 2 s noise buffer. No assets to download. The context starts on the first pointer or key
  press (browser autoplay rules) and is suspended while the tab is hidden.
- **Ambient beds** (wind, water, town hum) are looped filtered noise with slow LFOs; birds and
  crickets are short scheduled calls. Their loudness comes from `ambientMix(surroundings)`, a pure,
  unit-tested function of time of day, water/tree share and buildings around the camera, and zoom.
  The surroundings are sampled twice a second (169 tile flags + one spatial query).
- **Sound effects are tied to events**, not to UI code: player city changes (outside `sim.run`) →
  place/road/demolish; `History.onRejected` → error; sim `upgraded`/`declined`; goals chapter,
  town founded, POI explored. Each sound is rate-limited, so a 40-tile road drag is one gesture.
- **Placement "pop"**: `BuildingRenderer` scales new instances about their footprint centre with
  easeOutBack over 0.35 s. More than 48 adds in one frame (loading, bulk tools) skip it.

## Test and screenshot switches

`?daynight=0` (fixed classic daylight), `?time=0..1` (fixed hour), `?audio=0`, `?anim=0`.
The debug API has `timeOfDay(fixed?)` and `audio()`.

## M6b: road auto-tiling, night lights, palette

- **Roads auto-tile by batching per variant.** A road's variant is the mask of its four road
  neighbours (16 geometries, built once). `BuildingRenderer` keeps one InstancedMesh per
  `def#variant`; when a road appears or disappears its road neighbours move to the batch for their
  new mask. Draw calls grow by at most 16 for roads, not per tile.
- **Night lights without a second material.** Window and lamp vertices carry a `glow` attribute;
  the shared Lambert material is patched (`onBeforeCompile`) to add a warm emissive term scaled by a
  `uNight` uniform. Abandoned buildings (dark instance colour) do not glow. No extra lights.
- **Colourblind palette** is a setting (`palette: 'cvd'`, `?palette=cvd`): `data-palette` on the root
  switches CSS colours and `previewColors()` switches the 3D placement colours. Toasts always carry a
  symbol (✔ ▲ ✖) so meaning never rests on hue alone.

## M6d: roads as a family, bridges, industry

- **"Road" is a tag, not an id.** `isRoadDef` (tag `road`) decides what counts for road requirements, goals
  (`City.countTag('road')`), the minimap, plans and the drag tool. Dirt road, stone road, brick road, wooden
  and stone bridges all carry it, and the renderer auto-tiles them together (`shape: road | bridge`).
- **Road upgrades use a field, not neighbour queries.** Cottages, townhouses and villas emit an `urban` field
  (radius 2); a road upgrades to stone at `urban >= 1` and to brick at `urban >= 4`. A field lookup is O(1),
  while three `near` queries per road made the 5,000-building tick 5x slower. Roads now join the rule
  engine; measured tick for 8,246 buildings went from 1.7 ms to about 2.5 ms.
- **Bridges** are `placeOn: [water]` and need a road within 1 tile, so they always continue a road.
- **Stone everywhere:** `gravel_pit` (no terrain need), `trading_post` (food in, stone and wood out), quarry
  needs 1 stone tile instead of 2, and the starting stock is larger.

## M6c: icons, thumbnails, detail panel

- **Icons are inline SVG** (`src/ui/icons.ts`), one per resource, with the name as tooltip and label.
  A unit test fails if a resource in `data/resources.json` has no icon.
- **Thumbnails are rendered from the real building models** (`src/render/thumbnails.ts`): one small
  offscreen WebGL renderer, isometric orthographic camera, PNG data URL cached per `def#variant`.
  Without WebGL it returns '' and the UI shows text only.
- **Detail panel** (`src/ui/detailPanel.ts`) is docked on the right. `detailHtml()` is pure and tested.
  It shows the chosen (menu) or selected (inspect) building with cost, stats, requirements and the
  next upgrade step. The cursor card keeps only the live site checklist and verdict.

## M6e: people and vehicles

- **Visual only.** `TrafficRenderer` never touches the simulation or saves. Agents live on road tiles
  (tracked through city events, swap-remove index), walk tile to tile, keep right, turn at dead ends and
  cross bridges (+0.14 lift). They exist only within `reach` of the camera, so cost does not grow with the map.
- **One draw call per kind** (pedestrian, handcart, horsecart, car, bus): instanced low-poly models from
  `vehicleModels.ts`; the cap is 60 agents on coarse/small devices, 160 otherwise.
- **`trafficPlan` is pure and unit tested**: pedestrians ~ pop/5, vehicles ~ pop/25; the vehicle mix follows
  the era (carts by population, cars and buses also need a paved share of roads).
- **Paused games still populate the streets** (agents just freeze), which also keeps screenshots and tests
  deterministic in time. `?traffic=0` and the settings toggle switch it off.

## M6f: corner layout and flat land

- **Resources are a column** (top right); the detail panel moved left of it. Minimap bottom left (where the
  heat map used to be), heat map bottom right. Both have a corner toggle; the choice is saved in settings
  (`showMinimap`, `showHeatmap`).
- **Flat land is a drawing choice, not a world change.** `landY(level)` in `terrainMesh.ts` returns shore
  height for every land level unless hills are on (`?terrain=hills`, setting `flatTerrain`). Generation,
  biomes, resources and saves are untouched. The flag is per thread: main sets it at start and sends it with
  every worker request. Steps between road tiles caused vehicles to jump; with flat land they cannot.
- **Bridges** use one `BRIDGE_LIFT` (0.2 = shore height minus water surface) shared by the model and the
  traffic renderer, so the deck is level with the roads at both ends.
