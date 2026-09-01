"""Repo-backed registry (ENGINE-SPEC Phase 1: no database until Phase 3).

Layout:
    data/candidates/<slug>/candidate.yaml   # everything but the memo
    data/candidates/<slug>/memo.md          # the G0 memo draft
    data/clusters.yaml
    data/operators.yaml
"""

from __future__ import annotations

import json
from pathlib import Path

import yaml

from .models import Candidate, Cluster, Operator


class Registry:
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.candidates_dir = self.data_dir / "candidates"
        self.candidates_dir.mkdir(parents=True, exist_ok=True)

    # -- candidates -----------------------------------------------------

    def list_candidates(self) -> list[Candidate]:
        out = []
        for path in sorted(self.candidates_dir.glob("*/candidate.yaml")):
            out.append(self._load_candidate(path))
        return out

    def get_candidate(self, slug: str) -> Candidate:
        path = self.candidates_dir / slug / "candidate.yaml"
        if not path.exists():
            raise KeyError(slug)
        return self._load_candidate(path)

    def save_candidate(self, candidate: Candidate) -> None:
        cdir = self.candidates_dir / candidate.slug
        cdir.mkdir(parents=True, exist_ok=True)
        payload = json.loads(candidate.model_dump_json(exclude={"memo"}))
        (cdir / "candidate.yaml").write_text(
            yaml.safe_dump(payload, sort_keys=False, allow_unicode=True)
        )
        (cdir / "memo.md").write_text(candidate.memo)

    def _load_candidate(self, path: Path) -> Candidate:
        raw = yaml.safe_load(path.read_text())
        memo_path = path.parent / "memo.md"
        raw["memo"] = memo_path.read_text() if memo_path.exists() else ""
        return Candidate.model_validate(raw)

    # -- clusters / operators ------------------------------------------

    def list_clusters(self) -> list[Cluster]:
        return [Cluster.model_validate(c) for c in self._load_list("clusters.yaml")]

    def save_clusters(self, clusters: list[Cluster]) -> None:
        self._save_list("clusters.yaml", clusters)

    def list_operators(self) -> list[Operator]:
        return [Operator.model_validate(o) for o in self._load_list("operators.yaml")]

    def save_operators(self, operators: list[Operator]) -> None:
        self._save_list("operators.yaml", operators)

    def _load_list(self, filename: str) -> list[dict]:
        path = self.data_dir / filename
        if not path.exists():
            return []
        return yaml.safe_load(path.read_text()) or []

    def _save_list(self, filename: str, items) -> None:
        payload = [json.loads(i.model_dump_json()) for i in items]
        (self.data_dir / filename).write_text(
            yaml.safe_dump(payload, sort_keys=False, allow_unicode=True)
        )
