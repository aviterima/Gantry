"""One request schema source, exported for the Worker validator."""

from typing import Optional

from pydantic import Field

from .models import DeliveryMode, Lane, Scorecard, StrictModel


class LoginIn(StrictModel):
    email: str
    access_key: str = ""


class AllowedEmailIn(StrictModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CandidateIn(StrictModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=1, pattern=r"\S")
    one_liner: str = Field(min_length=1, pattern=r"\S")
    lane: Lane
    delivery_mode: DeliveryMode
    persona: str = ""
    channel: str = ""
    cluster: Optional[str] = None
    cluster_exception: str = ""
    operator: Optional[str] = None
    operator_exception: str = ""
    case_against: str = ""
    kill_criterion: str = ""


class ScoreIn(Scorecard):
    pass


class CaseIn(StrictModel):
    case_against: str
    kill_criterion: str


class MemoIn(StrictModel):
    memo_notes: str


class DecisionIn(StrictModel):
    approved: bool = Field(strict=True)
    notes: str = ""
