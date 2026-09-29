"""Same behavioral scenarios against FastAPI and the real Worker router."""

import hashlib
import json
import os
import subprocess
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from engine.app import auth, main, research
from engine.app.models import DIMENSIONS, ResearchCorpus
from engine.app.registry import Registry
from engine.export_contract import export

ROOT = Path(__file__).resolve().parents[2]
CORPUS = dict(
    workflow_map="A documented workflow [s1]",
    regulatory_landscape="Not covered",
    incumbents="Not covered",
    budget_evidence="Not covered",
    persona="An operator",
    watering_holes="Not covered",
    case_against="Manual effort may dominate",
    kill_criterion="No paid engagement",
    sources=[
        dict(
            id="s1",
            url="https://example.com/evidence",
            title="Evidence",
            retrieved_at="2026-09-29T10:00:00Z",
            excerpt="Fixture source text",
        )
    ],
    proposed_scores={
        "pain_intensity": dict(
            score=4, evidence="Documented pain", source_ids=["s1"], confidence="medium"
        )
    },
)


@pytest.fixture(scope="session", autouse=True)
def worker_bundle():
    subprocess.run(
        [
            str(ROOT / "node_modules/.bin/esbuild"),
            "deploy/cloudflare/src/worker.js",
            "--bundle",
            "--platform=node",
            "--format=esm",
            "--loader:.html=text",
            "--outfile=.build/worker-test.mjs",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )


@pytest.fixture(params=["python", "worker"])
def api(request, tmp_path, monkeypatch):
    digest_config = json.dumps({"tester@example.com": hashlib.sha256(b"test-key").hexdigest()})
    auth_config = tmp_path / "auth.json"
    auth_config.write_text(digest_config)
    if request.param == "python":
        reg = Registry(tmp_path)
        auth.save_allowed(tmp_path, ["tester@example.com"])
        monkeypatch.setattr(main, "registry", reg)
        monkeypatch.setattr(main, "DATA_DIR", tmp_path)
        monkeypatch.setenv(
            "GANTRY_ACCESS_KEY_HASHES",
            json.dumps({"tester@example.com": hashlib.sha256(b"test-key").hexdigest()}),
        )
        monkeypatch.setenv("GANTRY_RESEARCH_URL", "https://research.test/run")

        async def fake(candidate):
            return ResearchCorpus.model_validate(json.loads((tmp_path / "corpus.json").read_text()))

        monkeypatch.setattr(research, "research_candidate", fake)
        client = TestClient(main.app)
        proc = None
    else:
        proc = subprocess.Popen(
            ["node", "engine/tests/worker-server.mjs"],
            cwd=ROOT,
            env={
                **os.environ,
                "TEST_RESEARCH_CORPUS": str(tmp_path / "corpus.json"),
                "TEST_AUTH_CONFIG": str(auth_config),
            },
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        port = proc.stdout.readline().strip()
        assert port.isdigit(), proc.stderr.read()
        client = httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False)
    (tmp_path / "corpus.json").write_text(json.dumps(CORPUS))

    def rotate(value):
        auth_config.write_text(value)
        monkeypatch.setenv("GANTRY_ACCESS_KEY_HASHES", value)

    client.rotate = rotate
    client.corpus_path = tmp_path / "corpus.json"
    yield client
    client.close()
    if proc:
        proc.terminate()
        proc.wait(timeout=5)


def login(api):
    assert (
        api.post(
            "/api/login", json={"email": "tester@example.com", "access_key": "test-key"}
        ).status_code
        == 200
    )


def create(api, slug="candidate", **overrides):
    b = dict(
        slug=slug,
        name="Candidate",
        one_liner="Solve a contractor workflow",
        lane="vertical",
        delivery_mode="service_first",
        persona="Contractor owner",
        channel="Trade association",
        cluster_exception="New audience",
        operator_exception="Recruiting",
        case_against="Manual labor may dominate",
        kill_criterion="No paid engagements by week 4",
    )
    b.update(overrides)
    r = api.post("/api/candidates", json=b)
    assert r.status_code == 201, r.text
    return b


def scored(api, slug="candidate", value=4):
    dims = {d: dict(score=value, evidence="Evidence") for d in DIMENSIONS}
    assert api.post(f"/api/candidates/{slug}/score", json={"dimensions": dims}).status_code == 200
    assert (
        api.post(
            f"/api/candidates/{slug}/thresholds",
            json={
                "g1_reachability": "3% qualified response",
                "g2_engagement": "3 paid engagements",
                "g3_retention": "1 repeat",
                "budget_cap_usd": 2000,
                "time_cap_weeks": 3,
            },
        ).status_code
        == 200
    )
    return dims


def test_authentication_and_routes(api):
    assert api.get("/api/summary").status_code == 401
    assert api.post("/api/login", json={"email": "tester@example.com"}).status_code == 403
    assert (
        api.post(
            "/api/login", json={"email": "tester@example.com", "access_key": "wrong"}
        ).status_code
        == 403
    )
    login(api)
    assert api.get("/").status_code == 200
    assert api.get("/login").status_code == 200
    assert api.get("/api/me").json() == {"email": "tester@example.com"}
    assert api.get("/api/allowed-emails").json() == ["tester@example.com"]
    assert api.post("/api/allowed-emails", json={"email": "new@example.com"}).status_code == 201
    assert api.post("/api/allowed-emails", json={"email": "new@example.com"}).status_code == 409
    assert api.post("/api/allowed-emails", json={"email": "bad"}).status_code == 422
    assert api.get("/api/summary").json()["candidates"] == 0
    assert api.get("/api/candidates/missing").status_code == 404
    assert api.post("/api/logout", json={}).status_code == 200
    assert api.get("/api/me").status_code == 401


def test_intake_edit_memo_approval_and_locks(api):
    login(api)
    b = create(api)
    assert api.post("/api/candidates", json=b).status_code == 409
    b["lane"] = "substitution"
    b["name"] = "Updated"
    assert api.put("/api/candidates/candidate", json=b).status_code == 200
    assert api.get("/api/candidates/candidate").json()["lane"] == "substitution"
    assert api.put("/api/candidates/candidate", json={**b, "slug": "rename"}).status_code == 422
    assert api.put("/api/candidates/candidate", json={**b, "lane": "bad"}).status_code == 422
    assert (
        api.put(
            "/api/candidates/candidate/memo", json={"memo_notes": "Human perspective"}
        ).status_code
        == 200
    )
    assert "Human perspective" in api.post("/api/candidates/candidate/memo", json={}).json()["memo"]
    assert (
        api.post("/api/candidates/candidate/decision", json={"approved": True}).status_code == 422
    )
    scored(api)
    assert api.get("/api/summary").json()["g0_queue"] == 1
    assert len(api.get("/api/g0-queue").json()) == 1
    r = api.post(
        "/api/candidates/candidate/decision", json={"approved": True, "notes": "Evidence reviewed"}
    )
    assert r.status_code == 200, r.text
    assert r.json()["decision"]["decided_by"] == "tester@example.com"
    assert r.json()["status"] == "g0_approved"
    for action, method, payload in [
        ("score", "post", {"dimensions": {}}),
        ("thresholds", "post", {}),
        ("case", "post", {"case_against": "x", "kill_criterion": "y"}),
        ("memo", "put", {"memo_notes": "x"}),
        ("memo", "post", {}),
        ("decision", "post", {"approved": False}),
        ("research", "post", {}),
        ("accept-research", "post", {}),
    ]:
        assert (
            getattr(api, method)(f"/api/candidates/candidate/{action}", json=payload).status_code
            == 409
        )
    assert api.put("/api/candidates/candidate", json=b).status_code == 409


@pytest.mark.parametrize(
    "invalid",
    [
        {"extra": {"score": 5, "evidence": "x"}},
        {"pain_intensity": {"score": 2.7}},
        {"pain_intensity": {"score": True}},
        {"pain_intensity": {"score": 6}},
        {"pain_intensity": {"score": "4"}},
    ],
)
def test_invalid_scores_are_atomic(api, invalid):
    login(api)
    create(api)
    scored(api)
    before = api.get("/api/candidates/candidate").json()
    r = api.post("/api/candidates/candidate/score", json={"dimensions": invalid})
    assert r.status_code == 422, r.text
    assert api.get("/api/candidates/candidate").json() == before


def test_band_gate_declarations_and_draft_rejection(api):
    login(api)
    create(api)
    dims = scored(api, value=1)
    for name in ["buyer_reachability", "time_to_signal"]:
        dims[name] = {"score": 3, "evidence": "e"}
    api.post("/api/candidates/candidate/score", json={"dimensions": dims})
    assert api.get("/api/candidates/candidate").json()["total_score"] == 14
    assert (
        api.post("/api/candidates/candidate/decision", json={"approved": True}).status_code == 422
    )
    dims = scored(api)
    dims["buyer_reachability"]["evidence"] = "  "
    api.post("/api/candidates/candidate/score", json={"dimensions": dims})
    assert api.get("/api/candidates/candidate").json()["status"] == "untestable"
    assert (
        api.post("/api/candidates/candidate/decision", json={"approved": True}).status_code == 422
    )
    api.post(
        "/api/candidates/candidate/score", json={"dimensions": {"pain_intensity": {"score": 5}}}
    )
    c = api.get("/api/candidates/candidate").json()
    assert c["band"] is None and c["status"] == "draft"
    assert (
        api.post("/api/candidates/candidate/decision", json={"approved": False}).status_code == 200
    )


def test_configuration_references_and_positive_caps(api):
    login(api)
    assert api.post("/api/clusters", json={"slug": "trades", "name": "Trades"}).status_code == 201
    assert (
        api.post(
            "/api/operators",
            json={"slug": "operator", "name": "Operator", "equity_notes": "Pending"},
        ).status_code
        == 201
    )
    assert (
        api.post("/api/operators", json={"slug": "bad", "name": "Bad", "load": -1}).status_code
        == 422
    )
    assert api.post("/api/clusters", json={"slug": "trades", "name": "Trades"}).status_code == 409
    assert api.get("/api/clusters").json()[0]["watering_holes"] == []
    assert api.get("/api/operators").json()[0]["equity_notes"] == "Pending"
    b = create(api, cluster="trades", operator="operator")
    scored(api)
    assert api.put("/api/candidates/candidate", json={**b, "cluster": "missing"}).status_code == 422
    assert (
        api.put("/api/candidates/candidate", json={**b, "operator": "missing"}).status_code == 422
    )
    for field in [
        "persona",
        "channel",
        "case_against",
        "kill_criterion",
        "cluster_exception",
        "operator_exception",
    ]:
        altered = {**b, field: ""}
        if field == "cluster_exception":
            altered["cluster"] = None
        if field == "operator_exception":
            altered["operator"] = None
        api.put("/api/candidates/candidate", json=altered)
        assert (
            api.post("/api/candidates/candidate/decision", json={"approved": True}).status_code
            == 422
        ), field
    for field in ["budget_cap_usd", "time_cap_weeks"]:
        for value in [0, -1, 2.7, True, "3"]:
            assert (
                api.post("/api/candidates/candidate/thresholds", json={field: value}).status_code
                == 422
            )


def test_research_is_separate_and_citations_validated(api):
    login(api)
    create(api)
    assert api.get("/api/research-status").json()["configured"]
    r = api.post("/api/candidates/candidate/research", json={})
    assert r.status_code == 200, r.text
    assert r.json()["research"]["sources"][0]["id"] == "s1"
    assert r.json()["scorecard"]["dimensions"] == {} and r.json()["decision"] is None
    r = api.post("/api/candidates/candidate/accept-research", json={})
    assert r.status_code == 200
    assert (
        "https://example.com/evidence"
        in r.json()["scorecard"]["dimensions"]["pain_intensity"]["evidence"]
    )
    assert r.json()["status"] == "draft"
    before = api.get("/api/candidates/candidate").json()
    bad = json.loads(json.dumps(CORPUS))
    bad["proposed_scores"]["pain_intensity"]["source_ids"] = ["invented"]
    api.corpus_path.write_text(json.dumps(bad))
    assert api.post("/api/candidates/candidate/research", json={}).status_code == 502
    assert api.get("/api/candidates/candidate").json() == before


def test_generated_contract_has_not_drifted():
    assert (ROOT / "deploy/cloudflare/src/contracts.json").read_text() == export()


def test_key_rotation_revokes_sessions_and_missing_config_fails_closed(api):
    login(api)
    api.rotate(json.dumps({"tester@example.com": hashlib.sha256(b"new-key").hexdigest()}))
    assert api.get("/api/me").status_code == 401
    assert (
        api.post(
            "/api/login", json={"email": "tester@example.com", "access_key": "test-key"}
        ).status_code
        == 403
    )
    assert (
        api.post(
            "/api/login", json={"email": "tester@example.com", "access_key": "new-key"}
        ).status_code
        == 200
    )
    api.rotate("{}")
    assert api.get("/api/me").status_code == 401
    assert (
        api.post(
            "/api/login", json={"email": "tester@example.com", "access_key": "new-key"}
        ).status_code
        == 503
    )


@pytest.mark.parametrize("fault", ["url", "date", "duplicate", "dimension"])
def test_invalid_research_never_changes_candidate(api, fault):
    login(api)
    create(api)
    before = api.get("/api/candidates/candidate").json()
    bad = json.loads(json.dumps(CORPUS))
    if fault == "url":
        bad["sources"][0]["url"] = "javascript:alert(1)"
    elif fault == "date":
        bad["sources"][0]["retrieved_at"] = "2026-02-30T10:00:00Z"
    elif fault == "duplicate":
        bad["sources"].append(bad["sources"][0])
    else:
        bad["proposed_scores"]["invented_dimension"] = bad["proposed_scores"]["pain_intensity"]
    api.corpus_path.write_text(json.dumps(bad))
    assert api.post("/api/candidates/candidate/research", json={}).status_code == 502
    assert api.get("/api/candidates/candidate").json() == before
