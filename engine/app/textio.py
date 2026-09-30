"""Portable registry text I/O, including records written by older Windows builds."""

import os
import tempfile
from pathlib import Path


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        # v0.4 used the Windows locale; preserve readable legacy records.
        return raw.decode("cp1252")


def write_text(path: Path, text: str) -> None:
    """Replace only after UTF-8 encoding and a complete temporary-file write."""
    payload = text.encode("utf-8")
    temp = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as output:
            temp = Path(output.name)
            output.write(payload)
        os.replace(temp, path)
    finally:
        if temp is not None:
            temp.unlink(missing_ok=True)
