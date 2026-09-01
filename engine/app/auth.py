"""Email-allowlist authentication (no passwords).

A visitor signs in with an email address; if it is on the allowlist
(data/allowed_emails.yaml) they receive a signed session cookie. This is
identification against an allowlist, not proof of mailbox ownership —
magic-link verification arrives with the Neubloc email adapter in Phase 2
(logged in the known-debt register by design, see ENGINE-SPEC).

The signing secret comes from GANTRY_SECRET, or is generated once into
data/.auth_secret (git-ignored).
"""

from __future__ import annotations

import hashlib
import hmac
import os
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


def make_cookie(data_dir: Path, email: str) -> str:
    email = email.strip().lower()
    expires = int(time.time()) + SESSION_TTL_SECONDS
    payload = f"{email}|{expires}"
    return f"{payload}|{_sign(payload, _secret(data_dir))}"


def verify_cookie(data_dir: Path, cookie: str | None) -> str | None:
    """Return the session email, or None for a missing/invalid/expired/
    no-longer-allowed cookie."""
    if not cookie or cookie.count("|") != 2:
        return None
    email, expires_s, sig = cookie.rsplit("|", 2)
    payload = f"{email}|{expires_s}"
    if not hmac.compare_digest(sig, _sign(payload, _secret(data_dir))):
        return None
    try:
        if int(expires_s) < time.time():
            return None
    except ValueError:
        return None
    if not is_allowed(data_dir, email):  # revoking an email ends its sessions
        return None
    return email
