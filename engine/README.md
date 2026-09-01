# Last-Z Engine — Phase 1: Selection Engine

Mission Control shell + selection API implementing ENGINE-SPEC.md Phase 1:
candidate registry, scorecard with gating (FRAMEWORK §3), G0 memo generation,
G0 approval queue, cluster and operator-bench configuration.

## Run

```bash
pip install -r requirements.txt
python -m engine.seed --reset     # seed demo data into ./data
uvicorn engine.app.main:app --reload
# open http://localhost:8000
```

## Test

```bash
python -m pytest engine/tests
```

## Layout

- `app/models.py` — domain models: Candidate, Scorecard (with gating rules),
  GateThresholds, G0Decision, Cluster, Operator
- `app/registry.py` — repo-backed store under `data/` (no DB until Phase 3, per spec)
- `app/memo.py` — deterministic G0 memo drafts (AI research pipeline plugs in here)
- `app/main.py` — FastAPI: Mission Control UI + selection API
- `static/index.html` — Mission Control shell (G0 Queue / Registry / Configuration)
- `seed.py` — demo data covering every candidate status
- `docs/` — PRD and ADRs

## Rules the code enforces (not just documents)

- Gating dimensions (`buyer_reachability`, `time_to_signal`) need score ≥ 3
  **and evidence text**; otherwise the candidate is `untestable` and cannot be
  G0-approved regardless of total score.
- A candidate is decidable only when fully scored, testable, and its G0
  declarations are made: cluster, operator, and G1–G3 thresholds — each either
  set or covered by a written exception.
- After a G0 decision, the scorecard, declarations, and thresholds are locked
  (HTTP 409) — the no-moved-goalposts rule lives in the API, not in discipline.
