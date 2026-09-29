"""Core domain models for the Gantry selection engine (Phase 1).

Implements the FRAMEWORK.md §3 scorecard with its gating rules and the
candidate lifecycle up to the G0 decision. See ENGINE-SPEC.md Phase 1.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    "time_to_signal": "Will a real buyer pay or commit within 4-6 weeks of launch?",
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


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DimensionScore(StrictModel):
    score: int = Field(ge=1, le=5, strict=True)
    evidence: str = ""  # gating dimensions need evidence, not vibes


class Scorecard(StrictModel):
    dimensions: dict[str, DimensionScore] = Field(default_factory=dict)

    @field_validator("dimensions")
    @classmethod
    def known_dimensions(cls, value):
        if set(value) - set(DIMENSIONS):
            raise ValueError("unknown score dimension")
        return value

    def missing_dimensions(self) -> list[str]:
        return [d for d in DIMENSIONS if d not in self.dimensions]

    def total(self) -> int:
        return sum(self.dimensions[d].score for d in DIMENSIONS if d in self.dimensions)

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


class ExecutionGate(StrictModel):
    days: int = Field(gt=0, le=90, strict=True)
    budget_cents: int = Field(gt=0, strict=True)
    targets: dict[str, Annotated[float, Field(strict=True, gt=0)]] = Field(min_length=1)


class ExecutionPlan(StrictModel):
    g1: ExecutionGate
    g2: ExecutionGate
    g3: ExecutionGate


class GateThresholds(StrictModel):
    """Pre-committed G1-G3 thresholds, written at G0, never after seeing data."""

    execution_plan: Optional[ExecutionPlan] = None
    g1_reachability: str = ""
    g2_engagement: str = ""
    g3_retention: str = ""
    budget_cap_usd: int = Field(default=2000, gt=0, strict=True)
    time_cap_weeks: int = Field(default=3, gt=0, strict=True)

    def is_complete(self) -> bool:
        return all(v.strip() for v in (self.g1_reachability, self.g2_engagement, self.g3_retention))


class G0Decision(BaseModel):
    approved: bool
    decided_by: str
    notes: str = ""
    decided_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ResearchSource(StrictModel):
    id: str = Field(min_length=1)
    url: str = Field(pattern=r"^https?://[^\s/]+(?:/[^\s]*)?$")
    title: str = Field(min_length=1)
    retrieved_at: str = Field(
        pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
    )
    excerpt: str = Field(min_length=1)

    @field_validator("retrieved_at")
    @classmethod
    def timestamp(cls, value):
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class ProposedScore(DimensionScore):
    evidence: str = Field(min_length=1, pattern=r"\S")
    source_ids: list[str] = Field(min_length=1)
    confidence: Literal["low", "medium", "high"]


class ResearchCorpus(StrictModel):
    workflow_map: str
    regulatory_landscape: str
    incumbents: str
    budget_evidence: str
    persona: str
    watering_holes: str
    case_against: str
    kill_criterion: str
    sources: list[ResearchSource] = Field(min_length=1, max_length=50)
    proposed_scores: dict[str, ProposedScore]

    @model_validator(mode="after")
    def citations_resolve(self):
        ids = [s.id for s in self.sources]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate research source ID")
        if set(self.proposed_scores) - set(DIMENSIONS):
            raise ValueError("unknown score dimension")
        for proposal in self.proposed_scores.values():
            if set(proposal.source_ids) - set(ids):
                raise ValueError("unresolved source citation")
        return self


class Candidate(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=1, pattern=r"\S")
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
    memo_notes: str = ""
    is_demo: bool = False
    research: Optional[ResearchCorpus] = None
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
        if not self.persona.strip():
            gaps.append("persona")
        if not self.channel.strip():
            gaps.append("channel")
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
        if not missing and self.scorecard.total() < 35:
            blockers.append("score below approval floor: 35/50 required")
        gaps = self.declaration_gaps()
        if gaps:
            blockers.append(f"missing declarations: {', '.join(gaps)}")
        return (not blockers, blockers)


class Cluster(StrictModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=1, pattern=r"\S")
    description: str = ""
    watering_holes: list[str] = Field(default_factory=list)


class Operator(StrictModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=1, pattern=r"\S")
    equity_notes: str = ""
    domain_profile: str = ""
    load: int = Field(default=0, ge=0, strict=True)  # matched candidates/launches currently carried
