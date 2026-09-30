"""Every operations scenario runs against both authenticated HTTP runtimes."""

import io
import json
import os
import socket
import subprocess
import sys
import time
import zipfile
from datetime import datetime, timezone

import httpx

from engine.tests.test_contract import api as api
from engine.tests.test_contract import create, login, scored
from engine.tests.test_contract import worker_bundle as worker_bundle

CHECKS = [
    "brand",
    "domain",
    "landing",
    "privacy",
    "email_plan",
    "social_plan",
    "crm_pipeline",
    "instrumentation",
]
PLAN = {
    "g1": {
        "days": 7,
        "budget_cents": 50000,
        "targets": {"visitors": 1, "captures": 1, "capture_rate": 0.1},
    },
    "g2": {"days": 7, "budget_cents": 75000, "targets": {"paid_delivered": 1}},
    "g3": {
        "days": 7,
        "budget_cents": 75000,
        "targets": {"payers": 1, "outbound_payers": 1, "repeat_payers": 1},
    },
}


def state(api):
    r = api.get("/api/operations")
    assert r.status_code == 200, r.text
    return r.json()


def cmd(api, action, expected=200, **values):
    r = api.post(
        "/api/operations", json={"revision": state(api)["revision"], "action": action, **values}
    )
    assert r.status_code == expected, r.text
    return r


def prepared(api, slug="candidate"):
    create(api, slug=slug)
    scored(api, slug=slug)
    assert (
        api.post(
            f"/api/candidates/{slug}/thresholds",
            json={
                "g1_reachability": "Qualified capture",
                "g2_engagement": "Paid work delivered",
                "g3_retention": "Outbound payer and repeat order",
                "execution_plan": PLAN,
            },
        ).status_code
        == 200
    )
    assert api.post(f"/api/candidates/{slug}/decision", json={"approved": True}).status_code == 200
    cmd(api, "launch.create", candidate_id=slug, tournament_id="test")
    for item in CHECKS:
        cmd(api, "checklist.record", launch_id=slug, item=item, evidence="Reviewed in test mode")


def tournament(api, capacity=5):
    login(api)
    cmd(
        api,
        "tournament.create",
        id="test",
        name="Test tournament",
        reviewer="tester@example.com",
        capacity=capacity,
        review_at="2026-10-15T10:00:00Z",
        mode="sandbox",
    )


def signal(kind, id, **extra):
    return {
        "id": id,
        "event_type": kind,
        "timestamp": datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z"),
        "actor": "buyer@example.com",
        "channel": "email",
        "angle": "pain",
        **extra,
    }


def test_complete_service_lifecycle_and_handoff(api, tmp_path):
    tournament(api)
    prepared(api)
    cmd(api, "launch.activate", launch_id="candidate")
    cmd(api, "gate.decide", expected=422, launch_id="candidate", decision="pass", note="Too early")
    events = [signal("visit", "visit"), signal("qualified_capture", "capture")]
    cmd(api, "signals.import", launch_id="candidate", events=events)
    cmd(api, "signals.import", launch_id="candidate", events=events)
    assert len(state(api)["signals"]) == 2
    cmd(api, "gate.decide", launch_id="candidate", decision="pass", note="Reachable audience")
    cmd(
        api,
        "signals.import",
        launch_id="candidate",
        events=[
            signal("payment", "paid", order_id="o1", value_cents=5000, pure_outbound=True),
            signal("delivered", "delivered", order_id="o1"),
        ],
    )
    cmd(api, "gate.decide", launch_id="candidate", decision="pass", note="Paid work delivered")
    assert state(api)["launches"][0]["concentration"]["pending"]
    cmd(
        api,
        "concentration.confirm",
        launch_id="candidate",
        operator="Test operator",
        budget_cents=20000,
        note="Hands-on now",
    )
    cmd(
        api,
        "signals.import",
        launch_id="candidate",
        events=[
            signal("payment", "repeat", order_id="o2", value_cents=5000),
            signal("crm_stage", "crm", crm_stage="Retained"),
        ],
    )
    cmd(api, "gate.decide", launch_id="candidate", decision="pass", note="Repeat paid demand")
    cmd(api, "promotion.confirm", expected=422, launch_id="candidate", note="Premature")
    for item in [
        "entity_and_equity",
        "operator_terms",
        "data_handover",
        "cluster_access_terms",
        "handoff_verified",
        "playbook_retained",
    ]:
        cmd(
            api,
            "promotion.record",
            launch_id="candidate",
            item=item,
            evidence="Test checklist evidence",
        )
    cmd(api, "promotion.confirm", launch_id="candidate", note="Testing promotion only")
    assert state(api)["launches"][0]["status"] == "promoted"
    cmd(
        api,
        "signals.import",
        expected=409,
        launch_id="candidate",
        events=[signal("visit", "closed")],
    )
    r = api.get("/api/operations/handoff/candidate")
    assert r.status_code == 200
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        assert "index.html" in z.namelist() and "smoke_test.py" in z.namelist()
        assert json.loads(z.read("private/crm-staging.json"))[0]["stage"] == "Retained"
        assert json.loads(z.read("private/launch.json"))["candidate"]["decision"]["approved"]
        assert len(json.loads(z.read("private/signals.json"))) == 6
        z.extractall(tmp_path / "handoff")
    subprocess.run(
        [sys.executable, "smoke_test.py"], cwd=tmp_path / "handoff", check=True, capture_output=True
    )
    compile((tmp_path / "handoff/serve.py").read_text(), "serve.py", "exec")
    assert "TEST PREVIEW" in api.get("/launch-preview/candidate").text


def test_revision_capacity_and_suppression(api):
    tournament(api, capacity=1)
    before = state(api)
    assert (
        api.post("/api/operations", json={"revision": 0, "action": "tournament.create"}).status_code
        == 409
    )
    assert state(api)["revision"] == before["revision"]
    prepared(api)
    prepared(api, "second")
    cmd(api, "launch.activate", launch_id="candidate")
    cmd(api, "launch.activate", launch_id="second", expected=409)
    cmd(api, "contact.claim", launch_id="candidate", email="BUYER@example.com")
    cmd(api, "contact.claim", launch_id="second", email="buyer@example.com", expected=409)
    cmd(api, "contact.suppress", email="Buyer@example.com")
    assert not state(api)["claims"]
    cmd(api, "contact.claim", launch_id="candidate", email="buyer@example.com", expected=409)


def test_extension_kill_winddown_and_atomic_import(api):
    tournament(api)
    prepared(api)
    cmd(api, "launch.activate", launch_id="candidate")
    before = state(api)
    cmd(
        api,
        "signals.import",
        launch_id="candidate",
        events=[signal("visit", "good"), signal("made-up", "bad")],
        expected=422,
    )
    assert state(api)["signals"] == before["signals"]
    cmd(
        api,
        "gate.decide",
        launch_id="candidate",
        decision="extend",
        days=7,
        budget_cents=1000,
        angle="A new audience",
        note="Try once",
        expected=422,
    )
    cmd(
        api,
        "gate.decide",
        launch_id="candidate",
        decision="extend",
        days=3,
        budget_cents=1000,
        angle="A new audience",
        note="Try once",
    )
    cmd(
        api,
        "gate.decide",
        launch_id="candidate",
        decision="extend",
        days=2,
        budget_cents=1000,
        angle="Again",
        note="Try twice",
        expected=409,
    )
    cmd(api, "contact.claim", launch_id="candidate", email="buyer@example.com")
    cmd(api, "gate.decide", launch_id="candidate", decision="kill", note="No reachable paid demand")
    assert len(state(api)["learnings"]) == 1 and not state(api)["claims"]
    for item in [
        "customer_notice",
        "data_export",
        "refunds_reviewed",
        "opt_outs",
        "domain_retention",
    ]:
        cmd(
            api,
            "winddown.record",
            launch_id="candidate",
            item=item,
            evidence="Confirmed test completion",
        )
    assert state(api)["launches"][0]["status"] == "killed"


def test_precommit_and_signal_validation(api):
    tournament(api)
    create(api)
    scored(api)
    assert (
        api.post("/api/candidates/candidate/decision", json={"approved": True}).status_code == 200
    )
    cmd(api, "launch.create", candidate_id="candidate", tournament_id="test", expected=422)
    assert (
        api.post("/api/candidates/candidate/thresholds", json={"execution_plan": PLAN}).status_code
        == 409
    )
    prepared(api, "second")
    cmd(api, "launch.activate", launch_id="second")
    cmd(
        api,
        "signals.import",
        launch_id="second",
        events=[
            signal(
                "payment",
                "future",
                timestamp="2099-01-01T00:00:00Z",
                order_id="future",
                value_cents=100,
            )
        ],
        expected=422,
    )
    cmd(
        api,
        "signals.import",
        launch_id="second",
        events=[
            signal("payment", "paid", order_id="order", value_cents=100),
            signal("refund", "refund", order_id="order"),
        ],
    )
    assert state(api)["launches"][0]["metrics"]["payers"] == 0
    now = signal("visit", "x")["timestamp"]
    cmd(
        api,
        "signals.import",
        launch_id="second",
        csv=f'id,event_type,timestamp,actor,channel,angle\ncsv1,visit,{now},"Buyer, One",web,a\n',
    )
    assert state(api)["launches"][0]["metrics"]["visitors"] == 1
    for invalid in [None, [], {}]:
        assert api.post("/api/operations", json=invalid).status_code == (
            409 if invalid == {} else 422
        )


def test_local_testing_launcher_and_restart(tmp_path):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = {
        **os.environ,
        "GANTRY_TEST_PORT": str(port),
        "GANTRY_OPEN_BROWSER": "0",
        "GANTRY_TEST_DATA_DIR": str(tmp_path),
    }
    key = None
    for attempt in range(2):
        process = subprocess.Popen(
            [sys.executable, "-m", "engine.testing"],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            with httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False) as client:
                for retry in range(50):
                    try:
                        response = client.get("/login")
                        if response.status_code == 200:
                            break
                    except httpx.ConnectError:
                        pass
                    time.sleep(0.1)
                credentials = json.loads((tmp_path / "reviewer-key.json").read_text())
                if key:
                    assert credentials["key"] == key
                key = credentials["key"]
                assert (
                    client.post(
                        "/api/login", json={"email": credentials["email"], "access_key": key}
                    ).status_code
                    == 200
                )
                candidates = client.get("/api/candidates").json()
                assert len(candidates) == 8
                assert (
                    sum(
                        c["slug"].startswith("sandbox-")
                        and c["thresholds"]["execution_plan"] is not None
                        for c in candidates
                    )
                    == 2
                )
                assert client.get("/operations").status_code == 200
                assert client.get("/api/operations").status_code == 200
        finally:
            process.terminate()
            process.wait(timeout=10)
