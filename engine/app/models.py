"""Core domain models for the Gantry selection engine (Phase 1).

Implements the FRAMEWORK.md §3 scorecard with its gating rules and the
candidate lifecycle up to the G0 decision. See ENGINE-SPEC.md Phase 1.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

# FRAMEWORK §3: dimensions 2 and 3 are gating, not just scored.
GATING_DIMENSIONS = ("buyer_reachability", "time_to_signal")
GATING_MIN_SCORE = 3

# Deliberately harsh bands (lesson from Polis: "a product that calls 75
# 'excellent' is not helping anyone decide"). Computed here, never by a model,
# and always rendered wherever a total is rendered.
BANDS: tuple[tuple[int, str, str], ...] = (
    (43, "strong", "Rare. Launch early in the next tournament."),
    (35, "credible", "Launchable — queue it."),
    (28, "conditional", "Fix the named weakness first."),
    (20, "weak", "Park it; revisit only with new evidence."),
    (0, "not_this_one", "No."),
)

DIMENSIONS: dict[str, str] = {
    "pain_intensity": "Hair-on-fire pain vs. a vitamin?",
    "buyer_reachability": "1,000+ qualified buyers reachable via automatable channels for < $2k?",
    "time_to_signal": "Will a real buyer pay or commit within 4-8 weeks of launch?",
    "budget_existence": "Does the buyer already pay for something adjacent?",
    "incumbent_exposure": "Survives the incumbent shipping an AI UI tomorrow?",
    "ai_leverage": "Does AI collapse the cost of the value delivery, not just the code?",
    "moat_trajectory": "After 100 customers, what can't a fast follower clone?",
    "founder_market_access": "Credible domain access — including operator-bench fit?",
    "expansion_path": "Obvious second product for the same buyer?",
    "portfolio_synergy": "Reuses launch stack / shares an audience cluster?",
}


class Lane(str, Enum):
    substitution = "substitution"  # FRAMEWORK §2.2
    vertical = "vertical"  # FRAMEWORK §2.3


class DeliveryMode(str, Enum):
    service_first = "service_first"
    self_serve = "self_serve"


class CandidateStatus(str, Enum):
    draft = "draft"
    scored = "scored"
    untestable = "untestable"  # failed a gating dimension
    g0_approved = "g0_approved"
    g0_rejected = "g0_rejected"


class DimensionScore(BaseModel):
    score: int = Field(ge=1, le=5)
    evidence: str = ""  # gating dimensions need evidence, not vibes


class Scorecard(BaseModel):
    dimensions: dict[str, DimensionScore] = Field(default_factory=dict)

    def missing_dimensions(self) -> list[str]:
        return [d for d in DIMENSIONS if d not in self.dimensions]

    def total(self) -> int:
        return sum(d.score for d in self.dimensions.values())

    def failed_gates(self) -> list[str]:
        """Gating dimensions that score below the floor or lack evidence."""
        failed = []
        for name in GATING_DIMENSIONS:
            ds = self.dimensions.get(name)
            if ds is None or ds.score < GATING_MIN_SCORE or not ds.evidence.strip():
                failed.append(name)
        return failed

    def is_testable(self) -> bool:
        return not self.missing_dimensions() and not self.failed_gates()

    def band(self) -> Optional[dict]:
        """Deterministic band for a COMPLETE scorecard; None otherwise.

        Never bands a partial scorecard — a partial total silently
        renormalizes toward whatever was scored (the Polis overall() bug).
        """
        if self.missing_dimensions():
            return None
        total = self.total()
        for floor, name, note in BANDS:
            if total >= floor:
                return {"name": name, "note": note}
        return None


class GateThresholds(BaseModel):
    """Pre-committed G1-G3 thresholds, written at G0, never after seeing data."""

    g1_reachability: str = ""
    g2_engagement: str = ""
    g3_retention: str = ""
    budget_cap_usd: int = 2000
    time_cap_weeks: int = 3

    def is_complete(self) -> bool:
        return all(
            v.strip() for v in (self.g1_reachability, self.g2_engagement, self.g3_retention)
        )


class G0Decision(BaseModel):
    approved: bool
    decided_by: str
    notes: str = ""
    decided_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Candidate(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str
    one_liner: str
    lane: Lane
    delivery_mode: DeliveryMode
    persona: str = ""
    channel: str = ""
    # G0 must declare cluster and operator, or carry a written exception.
    cluster: Optional[str] = None
    cluster_exception: str = ""
    operator: Optional[str] = None
    operator_exception: str = ""
    # The anti-recommendation (lesson from Polis): the strongest case against,
    # argued properly, and a falsifiable kill criterion. Both required at G0.
    case_against: str = ""
    kill_criterion: str = ""
    scorecard: Scorecard = Field(default_factory=Scorecard)
    thresholds: GateThresholds = Field(default_factory=GateThresholds)
    memo: str = ""
    decision: Optional[G0Decision] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def status(self) -> CandidateStatus:
        if self.decision is not None:
            return (
                CandidateStatus.g0_approved
                if self.decision.approved
                else CandidateStatus.g0_rejected
            )
        if self.scorecard.missing_dimensions():
            return CandidateStatus.draft
        if not self.scorecard.is_testable():
            return CandidateStatus.untestable
        return CandidateStatus.scored

    def declaration_gaps(self) -> list[str]:
        """G0 declarations still missing (each needs a value or a written exception)."""
        gaps = []
        if not self.cluster and not self.cluster_exception.strip():
            gaps.append("cluster")
        if not self.operator and not self.operator_exception.strip():
            gaps.append("operator")
        if not self.thresholds.is_complete():
            gaps.append("thresholds")
        if not self.case_against.strip():
            gaps.append("case-against")
        if not self.kill_criterion.strip():
            gaps.append("kill-criterion")
        return gaps

    def is_decidable(self) -> tuple[bool, list[str]]:
        """A candidate can enter the G0 queue only when fully scored, testable,
        and every declaration (cluster, operator, thresholds) is made."""
        blockers = []
        missing = self.scorecard.missing_dimensions()
        if missing:
            blockers.append(f"unscored dimensions: {', '.join(missing)}")
        failed = self.scorecard.failed_gates()
        if failed:
            blockers.append(f"failed gating dimensions: {', '.join(failed)}")
        gaps = self.declaration_gaps()
        if gaps:
            blockers.append(f"missing declarations: {', '.join(gaps)}")
        return (not blockers, blockers)


class Cluster(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str
    description: str = ""
    watering_holes: list[str] = Field(default_factory=list)


class Operator(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str
    domain_profile: str = ""
    load: int = 0  # matched candidates/launches currently carried
