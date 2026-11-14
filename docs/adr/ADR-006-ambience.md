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
