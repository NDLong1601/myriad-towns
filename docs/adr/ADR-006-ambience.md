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
