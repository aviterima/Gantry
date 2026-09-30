"""Gantry Mission Control — Phase 1 (ENGINE-SPEC).

Serves the web UI and the selection-engine API: candidate registry,
scorecard with gating, G0 approval queue, cluster and operator config.
All routes except the login flow require an email-allowlist session
(see auth.py).

Run:  uvicorn engine.app.main:app --reload   (from the repo root)
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response

from . import auth, operations, research
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
from .requests import AllowedEmailIn, CandidateIn, CaseIn, DecisionIn, LoginIn, MemoIn, ScoreIn

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(
    os.environ.get("GANTRY_DATA_DIR")
    or os.environ.get("LASTZ_DATA_DIR")  # pre-rename compatibility
    or REPO_ROOT / "data"
)
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"

app = FastAPI(title="Gantry Mission Control", version="0.3.0")
registry = Registry(DATA_DIR)

PUBLIC_PATHS = {"/login", "/api/login"}


@app.middleware("http")
async def require_session(request: Request, call_next):
    path = request.url.path
    if path in PUBLIC_PATHS:
        return await call_next(request)
    email = auth.verify_cookie(DATA_DIR, request.cookies.get(auth.COOKIE_NAME))
    if email is None:
        if path.startswith("/api/"):
            return JSONResponse({"detail": "authentication required"}, status_code=401)
        return RedirectResponse("/login")
    request.state.email = email
    return await call_next(request)


@app.post("/api/login")
def login(body: LoginIn, request: Request):
    email = body.email.strip().lower()
    if not auth.access_hash(email):
        raise HTTPException(503, "Reviewer access key is not configured")
    if not auth.is_allowed(DATA_DIR, email) or not auth.check_access_key(email, body.access_key):
        raise HTTPException(403, "Invalid email or access key")
    resp = JSONResponse({"email": email})
    resp.set_cookie(
        auth.COOKIE_NAME,
        auth.make_cookie(DATA_DIR, email),
        max_age=auth.SESSION_TTL_SECONDS,
        secure=request.url.scheme == "https",
        httponly=True,
        samesite="lax",
    )
    return resp


@app.post("/api/logout")
def logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(auth.COOKIE_NAME)
    return resp


@app.get("/api/me")
def me(request: Request):
    return {"email": request.state.email}


@app.get("/api/allowed-emails")
def allowed_emails():
    return auth.load_allowed(DATA_DIR)


@app.post("/api/allowed-emails", status_code=201)
def add_allowed_email(body: AllowedEmailIn):
    email = body.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(422, "That doesn't look like an email address.")
    emails = auth.load_allowed(DATA_DIR)
    if email in emails:
        raise HTTPException(409, f"{email} is already on the allowlist")
    auth.save_allowed(DATA_DIR, emails + [email])
    return {"email": email}


@app.get("/login", include_in_schema=False)
def login_page():
    return FileResponse(STATIC_DIR / "login.html")


def approval_blockers(c: Candidate) -> list[str]:
    blockers = c.is_decidable()[1]
    if c.cluster and c.cluster not in {x.slug for x in registry.list_clusters()}:
        blockers.append("unknown cluster")
    if c.operator and c.operator not in {x.slug for x in registry.list_operators()}:
        blockers.append("unknown operator")
    return blockers


def validate_references(c: Candidate) -> None:
    errors = [x for x in approval_blockers(c) if x.startswith("unknown ")]
    if errors:
        raise HTTPException(422, "; ".join(errors))


def candidate_view(c: Candidate) -> dict:
    blockers = approval_blockers(c)
    decidable = not blockers
    view = c.model_dump(mode="json")
    view["memo"] = draft_memo(c)
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
    queue = [
        c for c in candidates if c.status == CandidateStatus.scored and not approval_blockers(c)
    ]
    return {
        "candidates": len(candidates),
        "demo_candidates": sum(c.is_demo for c in candidates),
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


@app.post("/api/candidates", status_code=201)
def create_candidate(body: CandidateIn):
    try:
        registry.get_candidate(body.slug)
        raise HTTPException(409, f"candidate '{body.slug}' already exists")
    except KeyError:
        pass
    c = Candidate.model_validate(body.model_dump())
    validate_references(c)
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.put("/api/candidates/{slug}")
def update_candidate(slug: str, body: CandidateIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already has a G0 decision; declarations are locked")
    if body.slug != slug:
        raise HTTPException(422, "slug is immutable")
    updated = Candidate.model_validate({**c.model_dump(), **body.model_dump()})
    validate_references(updated)
    updated.memo = draft_memo(updated)
    registry.save_candidate(updated)
    return candidate_view(updated)


@app.post("/api/candidates/{slug}/score")
def score_candidate(slug: str, body: ScoreIn):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already has a G0 decision; the scorecard is locked")
    c.scorecard.dimensions = dict(body.dimensions)
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.post("/api/candidates/{slug}/thresholds")
def set_thresholds(slug: str, body: GateThresholds):
    c = _get_or_404(slug)
    if c.decision is not None:
        # Mission Control enforces the no-moved-goalposts rule (ENGINE-SPEC).
        raise HTTPException(409, "thresholds are locked at G0; use the extension-memo flow")
    if body.execution_plan:
        operations.validate_plan(
            body.execution_plan.model_dump(), c.delivery_mode.value, body.model_dump()
        )
    c.thresholds = body
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


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
    c = _editable(slug)
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


@app.post("/api/candidates/{slug}/decision")
def decide(slug: str, body: DecisionIn, request: Request):
    c = _get_or_404(slug)
    if c.decision is not None:
        raise HTTPException(409, "candidate already decided")
    blockers = approval_blockers(c)
    if body.approved and blockers:
        raise HTTPException(422, "cannot approve: " + "; ".join(blockers))
    if body.approved and c.thresholds.execution_plan:
        operations.validate_plan(
            c.thresholds.execution_plan.model_dump(),
            c.delivery_mode.value,
            c.thresholds.model_dump(),
        )
    c.decision = G0Decision(
        approved=body.approved, notes=body.notes, decided_by=request.state.email
    )
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
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise HTTPException(404, "candidate not found")
    try:
        return registry.get_candidate(slug)
    except KeyError:
        raise HTTPException(404, f"no candidate '{slug}'")


def _editable(slug: str) -> Candidate:
    c = _get_or_404(slug)
    if c.decision:
        raise HTTPException(409, "candidate already has a G0 decision; record is locked")
    return c


@app.put("/api/candidates/{slug}/memo")
def edit_memo(slug: str, body: MemoIn):
    c = _editable(slug)
    c.memo_notes = body.memo_notes
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.get("/api/research-status")
def research_status():
    return {"configured": research.configured()}


@app.post("/api/candidates/{slug}/research")
async def run_research(slug: str):
    c = _editable(slug)
    if not research.configured():
        raise HTTPException(503, "Research provider is not configured")
    before = c.model_dump_json()
    try:
        corpus = await research.research_candidate(c)
    except Exception:
        raise HTTPException(502, "Research provider failed or returned invalid evidence") from None
    current = _editable(slug)
    if current.model_dump_json() != before:
        raise HTTPException(409, "Candidate changed during research; run again")
    current.research = corpus
    registry.save_candidate(current)
    return candidate_view(current)


@app.post("/api/candidates/{slug}/accept-research")
def accept_research(slug: str):
    c = _editable(slug)
    if not c.research or not c.research.proposed_scores:
        raise HTTPException(422, "No proposed scores to accept")
    sources = {x.id: x for x in c.research.sources}
    for name, proposal in c.research.proposed_scores.items():
        evidence = (
            proposal.evidence
            + "\nSources: "
            + "; ".join(
                sources[x].url + " (" + sources[x].retrieved_at + ")" for x in proposal.source_ids
            )
        )
        c.scorecard.dimensions[name] = DimensionScore(score=proposal.score, evidence=evidence)
    c.memo = draft_memo(c)
    registry.save_candidate(c)
    return candidate_view(c)


@app.get("/operations", include_in_schema=False)
def operations_page():
    return FileResponse(STATIC_DIR / "operations.html")


@app.get("/api/operations")
def operations_view(request: Request):
    return operations.execute(DATA_DIR, request.state.email, [])


@app.post("/api/operations")
async def operations_command(request: Request):
    if len(await request.body()) > 512000:
        raise HTTPException(413, "Command too large")
    try:
        body = await request.json()
    except ValueError:
        raise HTTPException(422, "Invalid JSON") from None
    if not isinstance(body, dict):
        raise HTTPException(422, "Invalid command")
    candidates = [c.model_dump(mode="json") for c in registry.list_candidates()]
    return operations.execute(DATA_DIR, request.state.email, candidates, command=body)


@app.get("/api/operations/handoff/{slug}")
def operations_handoff(slug: str, request: Request):
    package = operations.execute(DATA_DIR, request.state.email, [], handoff=slug)
    return Response(
        operations.archive(package),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{package["launch"]["id"]}-handoff.zip"'
        },
    )


@app.get("/launch-preview/{slug}", include_in_schema=False)
def launch_preview(slug: str, request: Request):
    import json
    import subprocess

    package = operations.execute(DATA_DIR, request.state.email, [], handoff=slug)
    package["preview"] = True
    rendered = subprocess.run(
        ["node", str(REPO_ROOT / "engine/operations/factory-cli.mjs")],
        input=json.dumps(package),
        text=True,
        encoding="utf-8",
        capture_output=True,
        timeout=15,
        check=True,
    )
    return Response(rendered.stdout, media_type="text/html")
