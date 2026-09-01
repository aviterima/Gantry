"""Mission Control shell — Phase 1 (ENGINE-SPEC).

Serves the web UI and the selection-engine API: candidate registry,
scorecard with gating, G0 approval queue, cluster and operator config.

Run:  uvicorn engine.app.main:app --reload   (from the repo root)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .memo import draft_memo
from .models import (
    Candidate,
    CandidateStatus,
    Cluster,
    DimensionScore,
    G0Decision,
    GateThresholds,
    Operator,
)
from .registry import Registry

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.environ.get("LASTZ_DATA_DIR", REPO_ROOT / "data"))
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"

app = FastAPI(title="Last-Z Mission Control", version="0.1.0")
registry = Registry(DATA_DIR)


def candidate_view(c: Candidate) -> dict:
    decidable, blockers = c.is_decidable()
    view = c.model_dump(mode="json")
    view["status"] = c.status.value
    view["total_score"] = c.scorecard.total()
    view["band"] = c.scorecard.band()
    view["failed_gates"] = c.scorecard.failed_gates()
    view["decidable"] = decidable
    view["blockers"] = blockers
    return view


# -- summary (Data pane) ---------------------------------------------------


@app.get("/api/summary")
def summary():
    candidates = registry.list_candidates()
    by_status: dict[str, int] = {s.value: 0 for s in CandidateStatus}
    for c in candidates:
        by_status[c.status.value] += 1
    queue = [c for c in candidates if c.status == CandidateStatus.scored and c.is_decidable()[0]]
    return {
        "candidates": len(candidates),
        "by_status": by_status,
        "g0_queue": len(queue),
        "clusters": len(registry.list_clusters()),
        "operators": len(registry.list_operators()),
    }


# -- candidates (Registry) -------------------------------------------------


@app.get("/api/candidates")
def list_candidates():
    return [candidate_view(c) for c in registry.list_candidates()]


@app.get("/api/candidates/{slug}")
def get_candidate(slug: str):
    try:
        return candidate_view(registry.get_candidate(slug))
    except KeyError:
        raise HTTPException(404, f"no candidate '{slug}'")


class CandidateIn(BaseModel):
    slug: str
    name: str
    one_liner: str
    lane: str
    delivery_mode: str
    persona: str = ""
    channel: str = ""
    cluster: Optional[str] = None
    cluster_exception: str = ""
    operator: Optional[str] = None
    operator_exception: str = ""
    case_against: str = ""
    kill_criterion: str = ""


@app.post("/api/candidates", status_code=201)
def create_candidate(body: CandidateIn):
    try:
        registry.get_candidate(body.slug)
        raise HTTPException(409, f"candidate '{body.slug}' already exists")
    except KeyError:
        pass
    c = Candidate.model_validate(body.model_dump())
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.put("/api/candidates/{slug}")
def update_candidate(slug: str, body: CandidateIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already has a G0 decision; declarations are locked")
    updated = c.model_copy(update=body.model_dump(exclude={"slug"}))
    updated.memo = draft_memo(updated)
    registry.save_candidate(updated)
    return candidate_view(updated)


class ScoreIn(BaseModel):
    dimensions: dict[str, DimensionScore]


@app.post("/api/candidates/{slug}/score")
def score_candidate(slug: str, body: ScoreIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already has a G0 decision; the scorecard is locked")
    c.scorecard.dimensions.update(body.dimensions)
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.post("/api/candidates/{slug}/thresholds")
def set_thresholds(slug: str, body: GateThresholds):
    c = _get_or_404(slug)
    if c.decision is not None:
        # Mission Control enforces the no-moved-goalposts rule (ENGINE-SPEC).
        raise HTTPException(409, "thresholds are locked at G0; use the extension-memo flow")
    c.thresholds = body
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


class CaseIn(BaseModel):
    case_against: str
    kill_criterion: str


@app.post("/api/candidates/{slug}/case")
def set_case(slug: str, body: CaseIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already has a G0 decision; the case against is locked")
    c.case_against = body.case_against
    c.kill_criterion = body.kill_criterion
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.post("/api/candidates/{slug}/memo")
def regenerate_memo(slug: str):
    c = _get_or_404(slug)
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return {"memo": c.memo}


# -- G0 queue (Control pane) -----------------------------------------------


@app.get("/api/g0-queue")
def g0_queue():
    out = []
    for c in registry.list_candidates():
        if c.status in (CandidateStatus.scored, CandidateStatus.untestable):
            out.append(candidate_view(c))
    return out


class DecisionIn(BaseModel):
    approved: bool
    decided_by: str
    notes: str = ""


@app.post("/api/candidates/{slug}/decision")
def decide(slug: str, body: DecisionIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already decided")
    decidable, blockers = c.is_decidable()
    if body.approved and not decidable:
        raise HTTPException(422, "cannot approve: " + "; ".join(blockers))
    c.decision = G0Decision(**body.model_dump())
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


# -- configuration (Configuration pane) ------------------------------------


@app.get("/api/clusters")
def list_clusters():
    return registry.list_clusters()


@app.post("/api/clusters", status_code=201)
def add_cluster(body: Cluster):
    clusters = registry.list_clusters()
    if any(c.slug == body.slug for c in clusters):
        raise HTTPException(409, f"cluster '{body.slug}' already exists")
    registry.save_clusters(clusters + [body])
    return body


@app.get("/api/operators")
def list_operators():
    return registry.list_operators()


@app.post("/api/operators", status_code=201)
def add_operator(body: Operator):
    operators = registry.list_operators()
    if any(o.slug == body.slug for o in operators):
        raise HTTPException(409, f"operator '{body.slug}' already exists")
    registry.save_operators(operators + [body])
    return body


# -- UI --------------------------------------------------------------------


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(STATIC_DIR / "index.html")


def _get_or_404(slug: str) -> Candidate:
    try:
        return registry.get_candidate(slug)
    except KeyError:
        raise HTTPException(404, f"no candidate '{slug}'")
