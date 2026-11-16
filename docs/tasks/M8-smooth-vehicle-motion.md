# M8 — Vehicle motion and flights between airfields

- Milestone: M8
- Assignee: Claude
- Branch: `agent/claude/m8-smooth-vehicle-motion`
- Depends on: The M7 transport models and current M8 checkout

## Goal

Make road, rail, water and air traffic easier to follow. Airfields can share a shuttle that visibly takes off, cruises and lands.

## Context to read first

- AGENTS.md, docs/architecture.md and docs/contracts/README.md
- M7 city development and living town task specs
- Facility traffic, road traffic, and the airfield model

## Allowed to edit

- This spec, `src/render/{airTraffic,flightPath,facilityTraffic,trafficRenderer}.ts`
- `tests/unit/{facilityTraffic,traffic}.test.ts`

## Contracts used

- City building and status events, active buildings, the floating origin, voyage phase and connected routes

## Functional requirements

1. Give aircraft distinct ground, climb, cruise and descent movement and time on the runway between flights.
2. Fly a local circuit with one active airfield. Connect two active airfields both ways. With more airfields use deterministic pairs and a solo circuit for any spare airfield.
3. Keep non-air paths connected. Round facility traffic corners, soften reversal and synchronize the display of working vessels to simulation progress.
4. Smooth road vehicle braking, acceleration and turning. Keep pause and the traffic setting working.

## Non-functional requirements

- Keep route and motion data render-side. Reuse objects in frame updates and draw aircraft near the camera even when both airfields are outside it.

## Acceptance criteria and how to check

- Unit tests verify motion, runway arrivals, pairing changes, connected rail and water, pause and floating origin behavior.
- Run the project checks, formatter and focused Chromium traffic checks.

## Result

- Aircraft now use distance based flight paths with runway roll, gradual climb and descent, and a four second stop between legs. Each leg takes at least twelve seconds. A solo flight lands before it hands over to a shuttle. Existing pairs keep their routes when new strips open.
- Rail and water traffic round corners and ease at the ends of their routes. Vessel animation approaches the simulated voyage phase gradually. Road traffic brakes into turns and accelerates from rest using rounded paths.
- `npm run check` passed with 214 unit tests, and `npm run format:check` passed. Both focused Chromium tests passed. The flight tests cover two runway arrivals, time spent parked, rendering far from both airports, and pairing changes.
