"""Start an isolated, persistent local testing workspace; never touch production data."""

import hashlib
import json
import os
import secrets
import shutil
import subprocess
import threading
import webbrowser
from pathlib import Path


def initialize(path: Path):
    from engine.app import auth
    from engine.app.models import Candidate, DimensionScore, G0Decision, GateThresholds
    from engine.app.registry import Registry
    from engine.seed import CLUSTERS, OPERATORS, build_candidates

    path.mkdir(parents=True, exist_ok=True)
    credential_file = path / "reviewer-key.json"
    if credential_file.exists():
        credentials = json.loads(credential_file.read_text(encoding="utf-8"))
    else:
        credentials = {"email": "tester@example.test", "key": secrets.token_urlsafe(24)}
        credential_file.write_text(json.dumps(credentials), encoding="utf-8")
        try:
            credential_file.chmod(0o600)
        except OSError:
            pass
    auth.save_allowed(path, [credentials["email"]])
    registry = Registry(path)
    if not (path / "clusters.yaml").exists():
        registry.save_clusters(CLUSTERS)
    if not (path / "operators.yaml").exists():
        registry.save_operators(OPERATORS)
    examples = build_candidates()
    for mode, slug, name in [
        ("service_first", "sandbox-service", "Sandbox · Contractor estimating"),
        ("self_serve", "sandbox-product", "Sandbox · Project checklist"),
    ]:
        from engine.app.models import DIMENSIONS

        gate2 = (
            {"paid_delivered": 1}
            if mode == "service_first"
            else {"activations": 1, "week2_returns": 1}
        )
        plan = {
            "g1": {
                "days": 7,
                "budget_cents": 50000,
                "targets": {"visitors": 1, "captures": 1, "capture_rate": 0.1},
            },
            "g2": {"days": 7, "budget_cents": 75000, "targets": gate2},
            "g3": {
                "days": 7,
                "budget_cents": 75000,
                "targets": {"payers": 1, "outbound_payers": 1, "repeat_payers": 1},
            },
        }
        c = Candidate(
            slug=slug,
            name=name,
            one_liner="A fictional opportunity for end-to-end workflow testing.",
            lane="vertical" if mode == "service_first" else "substitution",
            delivery_mode=mode,
            persona="Fictional contractor owner",
            channel="Test trade audience",
            cluster_exception="Isolated sandbox example",
            operator_exception="Assign a fictional operator at concentration",
            case_against="Example evidence is not commercial validation",
            kill_criterion="Kill if the paid test fails",
            is_demo=True,
        )
        c.scorecard.dimensions = {
            d: DimensionScore(score=4, evidence="Synthetic testing evidence") for d in DIMENSIONS
        }
        c.thresholds = GateThresholds(
            g1_reachability="One qualified test capture",
            g2_engagement="One paid delivered test engagement"
            if mode == "service_first"
            else "One activation and week-2 return",
            g3_retention="One outbound payer with a repeat order",
            execution_plan=plan,
        )
        c.decision = G0Decision(
            approved=True,
            decided_by="sandbox-fixture",
            notes="Synthetic approval for testing only; not an owner decision",
        )
        examples.append(c)
    for candidate in examples:
        target = path / "candidates" / candidate.slug / "candidate.yaml"
        if target.exists() and target.stat().st_size:
            continue  # Never replace a nonempty record, including edited examples.
        if target.exists():
            backup = target.with_name("candidate.yaml.empty-" + secrets.token_hex(6) + ".bak")
            target.rename(backup)
        registry.save_candidate(candidate)
    return credentials


def main():
    if not shutil.which("node"):
        raise SystemExit("Install Node.js 22 or later, then run again.")
    version = subprocess.check_output(["node", "--version"], text=True, encoding="utf-8").strip()
    if int(version.lstrip("v").split(".")[0]) < 22:
        raise SystemExit("Node.js 22 or later is required.")
    root = Path(__file__).resolve().parents[1]
    path = Path(os.environ.get("GANTRY_TEST_DATA_DIR", str(root / ".testing-data"))).resolve()
    os.environ["GANTRY_DATA_DIR"] = str(path)
    credentials = initialize(path)
    os.environ["GANTRY_ACCESS_KEY_HASHES"] = json.dumps(
        {credentials["email"]: hashlib.sha256(credentials["key"].encode()).hexdigest()}
    )
    port = int(os.environ.get("GANTRY_TEST_PORT", "8765"))
    print(
        f"\nGantry local testing: http://127.0.0.1:{port}\nEmail: {credentials['email']}\nAccess key: {credentials['key']}\n\nKeep this window open. Ctrl+C stops the server. Data is preserved between runs.\n",
        flush=True,
    )
    if os.environ.get("GANTRY_OPEN_BROWSER", "1") == "1":
        threading.Timer(2, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    import uvicorn

    uvicorn.run("engine.app.main:app", host="127.0.0.1", port=port)


if __name__ == "__main__":
    main()
