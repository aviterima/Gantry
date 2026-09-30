# Gantry

A parallel company-launch studio: cheap, evidence-ranked launch tournaments that
concentrate attention, capital, and channel trust onto paid demand as fast as possible.

- `FRAMEWORK.md` — the selection framework: lanes, scorecard, gates, portfolio rules
- `CRITIQUE.md` — the adversarial review of the thesis and the four adopted modifications
- `ENGINE-SPEC.md` — the multi-phase build spec (Mission Control, adapters, signal engine)
- `engine/` — selection and launch operations implementation
  (see `engine/README.md` to run it)
- `data/` — the repo-backed registry: candidates, clusters, operator bench

## Testing release v0.4

Start with **[TESTING.md](TESTING.md)**. On Windows, extract the branch ZIP and
run **Start-Gantry.cmd**. Python 3.11+ and Node.js 22+ are required. The launcher
opens an isolated, persistent local sandbox with a generated reviewer key and
clearly labeled example opportunities.

The release supports selection → tournament → launch readiness → CSV signals →
G1/G2/G3 decisions → concentration → wind-down or promotion → handoff ZIP.
No messages are sent, payments processed, or production assets deployed.

- [Release coverage and remaining integration work](engine/docs/reviews/v0.4-testing-release.md)
- [Operations architecture and invariants](engine/docs/adr/0004-testing-release.md)
- [Selection contract](engine/docs/adr/0003-selection-v03.md)
- [Original export review](engine/docs/reviews/2026-09-29-export-review.md)

GitHub preserves the existing project history. Production deployment and merging
remain separately reviewed actions.
