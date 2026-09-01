"""Phase 1 tests: scorecard gating, registry round-trip, memo, and API flows."""

import pytest
from fastapi.testclient import TestClient

from engine.app import main as app_main
from engine.app.memo import draft_memo
from engine.app.models import (
    Candidate,
    CandidateStatus,
    DimensionScore,
    DIMENSIONS,
    GateThresholds,
    Scorecard,
)
from engine.app.registry import Registry
from engine.seed import build_candidates, CLUSTERS, OPERATORS


def full_scorecard(reach=5, tts=5) -> Scorecard:
    dims = {
        name: DimensionScore(score=4, evidence="test evidence") for name in DIMENSIONS
    }
    dims["buyer_reachability"] = DimensionScore(score=reach, evidence="test evidence")
    dims["time_to_signal"] = DimensionScore(score=tts, evidence="test evidence")
    return Scorecard(dimensions=dims)


def make_candidate(**overrides) -> Candidate:
    base = dict(
        slug="test-co",
        name="TestCo",
        one_liner="A test company.",
        lane="vertical",
        delivery_mode="service_first",
        cluster="construction-smb",
        operator="jordan-reyes",
        case_against="It might fail because of X, argued honestly.",
        kill_criterion="Kill if Y does not happen by week 4.",
        scorecard=full_scorecard(),
        thresholds=GateThresholds(
            g1_reachability="x", g2_engagement="y", g3_retention="z"
        ),
    )
    base.update(overrides)
    return Candidate.model_validate(base)


# -- scorecard gating (FRAMEWORK §3) ---------------------------------------


def test_gating_dimension_below_floor_makes_untestable():
    c = make_candidate(scorecard=full_scorecard(reach=2))
    assert c.status == CandidateStatus.untestable
    assert "buyer_reachability" in c.scorecard.failed_gates()
    ok, blockers = c.is_decidable()
    assert not ok and any("gating" in b for b in blockers)


def test_gating_dimension_needs_evidence_not_vibes():
    sc = full_scorecard()
    sc.dimensions["time_to_signal"] = DimensionScore(score=5, evidence="  ")
    c = make_candidate(scorecard=sc)
    assert c.status == CandidateStatus.untestable


def test_high_total_cannot_rescue_failed_gate():
    sc = full_scorecard(tts=1)
    for name in DIMENSIONS:
        if name != "time_to_signal":
            sc.dimensions[name] = DimensionScore(score=5, evidence="e")
    c = make_candidate(scorecard=sc)
    assert c.status == CandidateStatus.untestable


def test_unscored_candidate_is_draft():
    c = make_candidate(scorecard=Scorecard())
    assert c.status == CandidateStatus.draft


# -- G0 declarations (ENGINE-SPEC Phase 1) ---------------------------------


def test_missing_cluster_without_exception_blocks_decision():
    c = make_candidate(cluster=None, cluster_exception="")
    ok, blockers = c.is_decidable()
    assert not ok and any("cluster" in b for b in blockers)


def test_written_exception_satisfies_declaration():
    c = make_candidate(
        cluster=None, cluster_exception="no cluster fit, documented",
        operator=None, operator_exception="bench gap, documented",
    )
    ok, _ = c.is_decidable()
    assert ok


def test_incomplete_thresholds_block_decision():
    c = make_candidate(thresholds=GateThresholds())
    ok, blockers = c.is_decidable()
    assert not ok and any("thresholds" in b for b in blockers)


def test_missing_case_against_or_kill_criterion_blocks_decision():
    c = make_candidate(case_against="  ", kill_criterion="")
    ok, blockers = c.is_decidable()
    assert not ok
    joined = " ".join(blockers)
    assert "case-against" in joined and "kill-criterion" in joined


# -- bands (deterministic, code-only — lesson from Polis) ------------------


def test_band_is_deterministic_and_harsh():
    strong = Scorecard(
        dimensions={n: DimensionScore(score=5, evidence="e") for n in DIMENSIONS}
    )
    assert strong.band()["name"] == "strong"
    mediocre = Scorecard(
        dimensions={n: DimensionScore(score=3, evidence="e") for n in DIMENSIONS}
    )
    assert mediocre.band()["name"] == "conditional"  # 30/50 is not "excellent"


def test_incomplete_scorecard_never_bands():
    # Guards the Polis overall() renormalization bug: a partial scorecard
    # must never produce a valid-looking band.
    sc = Scorecard(
        dimensions={"pain_intensity": DimensionScore(score=5, evidence="e")}
    )
    assert sc.band() is None


# -- memo ------------------------------------------------------------------


def test_memo_contains_declarations_and_gating_flag():
    c = make_candidate()
    memo = draft_memo(c)
    assert "construction-smb" in memo and "jordan-reyes" in memo
    assert "*(gating)*" in memo and "Pending G0 review" in memo

    untestable = make_candidate(scorecard=full_scorecard(reach=1))
    assert "UNTESTABLE" in draft_memo(untestable)


# -- registry round-trip ---------------------------------------------------


def test_registry_roundtrip(tmp_path):
    reg = Registry(tmp_path)
    c = make_candidate()
    c.memo = draft_memo(c)
    reg.save_candidate(c)
    loaded = reg.get_candidate("test-co")
    assert loaded.name == "TestCo"
    assert loaded.scorecard.total() == c.scorecard.total()
    assert loaded.memo == c.memo
    assert (tmp_path / "candidates" / "test-co" / "memo.md").exists()


# -- seed data sanity ------------------------------------------------------


def test_seed_data_exercises_every_status():
    statuses = {c.status for c in build_candidates()}
    assert CandidateStatus.scored in statuses
    assert CandidateStatus.untestable in statuses
    assert CandidateStatus.draft in statuses
    assert CandidateStatus.g0_approved in statuses


def test_seed_references_resolve():
    cluster_slugs = {c.slug for c in CLUSTERS}
    operator_slugs = {o.slug for o in OPERATORS}
    for c in build_candidates():
        if c.cluster:
            assert c.cluster in cluster_slugs, c.slug
        if c.operator:
            assert c.operator in operator_slugs, c.slug


# -- API flows -------------------------------------------------------------


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from engine.app import auth

    reg = Registry(tmp_path)
    reg.save_clusters(CLUSTERS)
    reg.save_operators(OPERATORS)
    auth.save_allowed(tmp_path, ["tester@example.com"])
    monkeypatch.setattr(app_main, "registry", reg)
    monkeypatch.setattr(app_main, "DATA_DIR", tmp_path)
    c = TestClient(app_main.app)
    assert c.post("/api/login", json={"email": "Tester@Example.com"}).status_code == 200
    return c


def test_auth_required_and_allowlist(tmp_path, monkeypatch):
    from engine.app import auth

    auth.save_allowed(tmp_path, ["tester@example.com"])
    monkeypatch.setattr(app_main, "DATA_DIR", tmp_path)
    c = TestClient(app_main.app)
    assert c.get("/api/summary").status_code == 401
    assert c.post("/api/login", json={"email": "stranger@example.com"}).status_code == 403
    assert c.post("/api/login", json={"email": "tester@example.com"}).status_code == 200
    assert c.get("/api/me").json()["email"] == "tester@example.com"
    # adding an email lets it in; removal from the allowlist ends sessions
    assert c.post("/api/allowed-emails", json={"email": "new@example.com"}).status_code == 201
    assert "new@example.com" in c.get("/api/allowed-emails").json()
    auth.save_allowed(tmp_path, ["someone-else@example.com"])
    assert c.get("/api/summary").status_code == 401


def test_api_full_g0_flow(client):
    body = {
        "slug": "api-co", "name": "ApiCo", "one_liner": "Via API.",
        "lane": "vertical", "delivery_mode": "self_serve",
        "cluster": "construction-smb", "operator": "jordan-reyes",
    }
    assert client.post("/api/candidates", json=body).status_code == 201

    # approve before scoring must fail
    r = client.post("/api/candidates/api-co/decision",
                    json={"approved": True, "decided_by": "t"})
    assert r.status_code == 422

    dims = {name: {"score": 4, "evidence": "e"} for name in DIMENSIONS}
    assert client.post("/api/candidates/api-co/score",
                       json={"dimensions": dims}).status_code == 200
    assert client.post("/api/candidates/api-co/thresholds", json={
        "g1_reachability": "a", "g2_engagement": "b", "g3_retention": "c",
        "budget_cap_usd": 1000, "time_cap_weeks": 3}).status_code == 200

    # still blocked: the case against is a required declaration
    r = client.post("/api/candidates/api-co/decision",
                    json={"approved": True, "decided_by": "t"})
    assert r.status_code == 422 and "case-against" in r.json()["detail"]
    assert client.post("/api/candidates/api-co/case", json={
        "case_against": "Strongest case against, argued honestly.",
        "kill_criterion": "Kill if no paid commitment by week 4."}).status_code == 200

    r = client.post("/api/candidates/api-co/decision",
                    json={"approved": True, "decided_by": "t", "notes": "ok"})
    assert r.status_code == 200
    assert r.json()["status"] == "g0_approved"

    # no-moved-goalposts: thresholds locked after decision
    r = client.post("/api/candidates/api-co/thresholds", json={
        "g1_reachability": "moved", "g2_engagement": "b", "g3_retention": "c",
        "budget_cap_usd": 9999, "time_cap_weeks": 9})
    assert r.status_code == 409
    # and no double decisions
    r = client.post("/api/candidates/api-co/decision",
                    json={"approved": False, "decided_by": "t"})
    assert r.status_code == 409


def test_api_untestable_cannot_be_approved(client):
    body = {"slug": "weak-co", "name": "WeakCo", "one_liner": "Unreachable buyer.",
            "lane": "vertical", "delivery_mode": "self_serve",
            "cluster_exception": "doc", "operator_exception": "doc"}
    client.post("/api/candidates", json=body)
    dims = {name: {"score": 4, "evidence": "e"} for name in DIMENSIONS}
    dims["buyer_reachability"] = {"score": 1, "evidence": "nobody reachable"}
    client.post("/api/candidates/weak-co/score", json={"dimensions": dims})
    r = client.post("/api/candidates/weak-co/decision",
                    json={"approved": True, "decided_by": "t"})
    assert r.status_code == 422
    # rejection is always allowed
    r = client.post("/api/candidates/weak-co/decision",
                    json={"approved": False, "decided_by": "t", "notes": "untestable"})
    assert r.status_code == 200


def test_api_summary_counts(client):
    s = client.get("/api/summary").json()
    assert s["clusters"] == len(CLUSTERS) and s["operators"] == len(OPERATORS)
