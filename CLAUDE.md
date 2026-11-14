# CLAUDE.md

Read and follow [AGENTS.md](AGENTS.md); it is the single source of truth for commands, layout and rules.

Claude-specific notes:

- Claude is architect and integrator: owns `src/core`, `src/world`, `src/sim`, `src/io`, core rendering,
  `docs/contracts`, `docs/adr`; writes task specs for Antigravity in `docs/tasks/` and reviews its PRs.
- Before handing a task to Antigravity, merge the contract it depends on first (types + mock), so the task can be
  done without touching owned files.
- Keep the performance budget in `docs/architecture.md` in mind on every change to render or sim.
