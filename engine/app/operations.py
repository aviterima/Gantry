"""Transactional operations persistence around the shared Node/Worker kernel."""

import io
import json
import sqlite3
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[2]


def execute(data_dir: Path, actor: str, candidates: list, command=None, handoff=None):
    data_dir.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(data_dir / "operations.sqlite3", timeout=15) as db:
        db.execute("CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, body TEXT NOT NULL)")
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT body FROM state WHERE id=1").fetchone()
        payload = {
            "state": json.loads(row[0]) if row else None,
            "context": {
                "actor": actor,
                "now": datetime.now(timezone.utc)
                .isoformat(timespec="milliseconds")
                .replace("+00:00", "Z"),
                "candidates": candidates,
            },
            "command": command,
            "handoff": handoff,
        }
        try:
            result = subprocess.run(
                ["node", str(ROOT / "engine/operations/cli.mjs")],
                input=json.dumps(payload),
                text=True,
                capture_output=True,
                timeout=15,
                check=True,
            )
            output = json.loads(result.stdout)
        except (OSError, subprocess.SubprocessError, ValueError):
            raise HTTPException(503, "Operations runtime unavailable; install Node 22+") from None
        if "error" in output:
            raise HTTPException(output["error"]["status"], output["error"]["detail"])
        if command is not None:
            db.execute("INSERT OR REPLACE INTO state VALUES (1, ?)", (json.dumps(output["state"]),))
            return {"revision": output["state"]["revision"]}
        return output["result"]


def archive(package):
    # The shared factory owns the exact file set for both runtimes.
    result = subprocess.run(
        ["node", str(ROOT / "engine/operations/factory-cli.mjs")],
        input=json.dumps(package),
        text=True,
        capture_output=True,
        timeout=15,
        check=True,
    )
    files = json.loads(result.stdout)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as output:
        for name, content in files.items():
            output.writestr(name, content)
    return buffer.getvalue()


def validate_plan(plan, mode, overall):
    payload = {"validate_plan": {"plan": plan, "mode": mode, "overall": overall}}
    result = subprocess.run(
        ["node", str(ROOT / "engine/operations/cli.mjs")],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        timeout=15,
        check=True,
    )
    out = json.loads(result.stdout)
    if "error" in out:
        raise HTTPException(out["error"]["status"], out["error"]["detail"])
