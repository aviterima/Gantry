# Gantry

A parallel company-launch studio: cheap, evidence-ranked launch tournaments that
concentrate attention, capital, and channel trust onto paid demand as fast as possible.

- `FRAMEWORK.md` — the selection framework: lanes, scorecard, gates, portfolio rules
- `CRITIQUE.md` — the adversarial review of the thesis and the four adopted modifications
- `ENGINE-SPEC.md` — the multi-phase build spec (Mission Control, adapters, signal engine)
- `engine/` — Phase 1 implementation: the selection engine and Mission Control shell
  (see `engine/README.md` to run it)
- `data/` — the repo-backed registry: candidates, clusters, operator bench

## Current development

The v0.3 review branch completes the manual selection workflow and adds an optional
research pipeline. Start with `engine/README.md`, the updated Phase 1 PRD, and
`engine/docs/adr/0003-selection-v03.md`. Export findings are recorded in
`engine/docs/reviews/2026-09-29-export-review.md`. The included data is illustrative;
real-candidate acceptance and live-provider validation remain open.
