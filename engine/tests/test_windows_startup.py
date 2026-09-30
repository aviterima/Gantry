"""Portable regression suite, also run on native Windows with UTF-8 mode disabled."""

import json
import os
import socket
import subprocess
import sys
import time

import httpx
import pytest
import yaml

from engine.app.models import Candidate
from engine.app.operations import execute
from engine.app.registry import Registry
from engine.app.textio import write_text
from engine.testing import initialize


def candidate(name="Unicode ≥ café 東京"):
    return Candidate(
        slug="unicode",
        name=name,
        one_liner="Evidence ≥ 3 — retained",
        lane="vertical",
        delivery_mode="service_first",
        memo="Memo ≥ 3 ✓",
    )


def test_utf8_registry_roundtrip(tmp_path):
    registry = Registry(tmp_path)
    c = candidate()
    registry.save_candidate(c)
    assert registry.get_candidate(c.slug).model_dump() == c.model_dump()
    assert "≥" in (tmp_path / "candidates/unicode/candidate.yaml").read_bytes().decode("utf-8")


def test_encoding_failure_preserves_existing_file(tmp_path):
    path = tmp_path / "record.txt"
    write_text(path, "Existing ≥ evidence")
    before = path.read_bytes()
    with pytest.raises(UnicodeEncodeError):
        write_text(path, "Invalid surrogate \ud800")
    assert path.read_bytes() == before
    assert list(tmp_path.iterdir()) == [path]


def test_legacy_windows_registry_is_read_without_loss(tmp_path):
    registry = Registry(tmp_path)
    c = Candidate(
        slug="legacy",
        name="Café — retained",
        one_liner="A test",
        lane="vertical",
        delivery_mode="service_first",
    )
    folder = tmp_path / "candidates/legacy"
    folder.mkdir()
    folder.joinpath("candidate.yaml").write_bytes(
        yaml.safe_dump(json.loads(c.model_dump_json()), allow_unicode=True).encode("cp1252")
    )
    folder.joinpath("memo.md").write_bytes("Café — notes".encode("cp1252"))
    loaded = registry.get_candidate("legacy")
    assert loaded.name == c.name and loaded.memo == "Café — notes"
    registry.save_candidate(loaded)
    assert "Café" in folder.joinpath("candidate.yaml").read_bytes().decode("utf-8")


def test_partial_seed_repair_preserves_existing_data(tmp_path):
    first = initialize(tmp_path)
    registry = Registry(tmp_path)
    edited = registry.get_candidate("crewcast")
    edited.name = "My edited ≥ example"
    registry.save_candidate(edited)
    broken = tmp_path / "candidates/permit-pilot/candidate.yaml"
    broken.write_bytes(b"")  # Reproduce the file left by CP1252 write_text failure.
    execute(
        tmp_path,
        first["email"],
        [],
        command={
            "revision": 0,
            "action": "tournament.create",
            "id": "kept",
            "name": "Existing ≥ tournament 東京",
            "reviewer": first["email"],
            "capacity": 1,
            "review_at": "2026-10-01T00:00:00Z",
            "mode": "sandbox",
        },
    )
    second = initialize(tmp_path)
    assert second == first
    assert registry.get_candidate("crewcast").name == edited.name
    assert registry.get_candidate("permit-pilot").is_demo
    assert len(registry.list_candidates()) == 8
    backups = list(broken.parent.glob("candidate.yaml.empty-*.bak"))
    assert len(backups) == 1 and backups[0].read_bytes() == b""
    assert (
        execute(tmp_path, first["email"], [])["tournaments"][0]["name"]
        == "Existing ≥ tournament 東京"
    )


def test_real_launcher_on_host_platform(tmp_path):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = {
        **os.environ,
        "GANTRY_TEST_DATA_DIR": str(tmp_path / "data"),
        "GANTRY_TEST_PORT": str(port),
        "GANTRY_OPEN_BROWSER": "0",
        "PYTHONUTF8": "0",
    }
    # Deliberately omit -X utf8: explicit file/pipe encodings must work on their own.
    log = tmp_path / "server.log"
    with log.open("wb") as output:
        process = subprocess.Popen(
            [sys.executable, "-m", "engine.testing"], env=env, stdout=output, stderr=output
        )
        try:
            with httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False) as client:
                ready = False
                for _ in range(150):
                    if process.poll() is not None:
                        break
                    try:
                        if client.get("/login").status_code == 200:
                            ready = True
                            break
                    except httpx.ConnectError:
                        pass
                    time.sleep(0.1)
                assert ready, "Launcher did not become ready; inspect native CI logs"
                credentials = json.loads(
                    (tmp_path / "data/reviewer-key.json").read_text(encoding="utf-8")
                )
                assert (
                    client.post(
                        "/api/login",
                        json={"email": credentials["email"], "access_key": credentials["key"]},
                    ).status_code
                    == 200
                )
                assert len(client.get("/api/candidates").json()) == 8
                assert client.get("/api/operations").status_code == 200
        finally:
            process.terminate()
            process.wait(timeout=15)
