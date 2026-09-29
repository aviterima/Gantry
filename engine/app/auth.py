"""Allowlisted reviewer authentication using per-reviewer access keys.

Only SHA-256 key digests are configured. Signed sessions bind to the digest,
so key rotation invalidates existing sessions. Mailbox verification remains
a future integration. The signing secret uses GANTRY_SECRET or a persisted,
git-ignored data/.auth_secret file.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import time
from pathlib import Path

import yaml

COOKIE_NAME = "gantry_session"
SESSION_TTL_SECONDS = 30 * 24 * 3600  # 30 days

ALLOWED_FILE = "allowed_emails.yaml"
SECRET_FILE = ".auth_secret"


def _secret(data_dir: Path) -> bytes:
    env = os.environ.get("GANTRY_SECRET")
    if env:
        return env.encode()
    path = data_dir / SECRET_FILE
    if not path.exists():
        data_dir.mkdir(parents=True, exist_ok=True)
        path.write_text(secrets.token_hex(32))
    return path.read_text().strip().encode()


def load_allowed(data_dir: Path) -> list[str]:
    path = data_dir / ALLOWED_FILE
    if not path.exists():
        return []
    emails = yaml.safe_load(path.read_text()) or []
    return [e.strip().lower() for e in emails if isinstance(e, str) and e.strip()]


def save_allowed(data_dir: Path, emails: list[str]) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    deduped = sorted({e.strip().lower() for e in emails if e.strip()})
    (data_dir / ALLOWED_FILE).write_text(yaml.safe_dump(deduped))


def is_allowed(data_dir: Path, email: str) -> bool:
    return email.strip().lower() in load_allowed(data_dir)


def _sign(payload: str, key: bytes) -> str:
    return hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()


def access_hash(email: str) -> str | None:
    try:
        value = json.loads(os.environ.get("GANTRY_ACCESS_KEY_HASHES", "{}"))
        digest = value.get(email.strip().lower()) if isinstance(value, dict) else None
        return digest if isinstance(digest, str) and re.fullmatch(r"[a-f0-9]{64}", digest) else None
    except ValueError:
        return None


def check_access_key(email: str, key: str) -> bool:
    expected = access_hash(email)
    actual = hashlib.sha256(key.encode()).hexdigest()
    return bool(expected and hmac.compare_digest(expected, actual))


def make_cookie(data_dir: Path, email: str) -> str:
    email = email.strip().lower()
    expires = int(time.time()) + SESSION_TTL_SECONDS
    payload = f"v2|{email}|{expires}"
    return f"{payload}|{_sign(payload + '|' + (access_hash(email) or ''), _secret(data_dir))}"


def verify_cookie(data_dir: Path, cookie: str | None) -> str | None:
    if not cookie or cookie.count("|") != 3:
        return None
    version, email, expires_s, sig = cookie.split("|")
    digest = access_hash(email)
    if version != "v2" or not digest:
        return None
    payload = f"{version}|{email}|{expires_s}"
    if not hmac.compare_digest(sig, _sign(payload + "|" + digest, _secret(data_dir))):
        return None
    try:
        if int(expires_s) <= time.time():
            return None
    except ValueError:
        return None
    return email if is_allowed(data_dir, email) else None
