"""Generate Worker schemas; CI fails if the checked-in contract drifts."""

import json
from pathlib import Path

from pydantic import BaseModel

from .app.models import DIMENSIONS, Candidate, Cluster, GateThresholds, Operator, ResearchCorpus
from .app.requests import AllowedEmailIn, CandidateIn, CaseIn, DecisionIn, LoginIn, MemoIn, ScoreIn

MODELS: list[type[BaseModel]] = [
    LoginIn,
    AllowedEmailIn,
    CandidateIn,
    ScoreIn,
    CaseIn,
    MemoIn,
    DecisionIn,
    GateThresholds,
    Cluster,
    Operator,
    ResearchCorpus,
    Candidate,
]


def export():
    schemas = {m.__name__: m.model_json_schema() for m in MODELS}
    schemas["Cluster"]["properties"]["watering_holes"]["default"] = []
    schemas["ScoreIn"]["properties"]["dimensions"]["default"] = {}
    for name in ["ScoreIn", "ResearchCorpus"]:
        field = "dimensions" if name == "ScoreIn" else "proposed_scores"
        schemas[name]["properties"][field]["propertyNames"] = {"enum": list(DIMENSIONS)}
    return json.dumps(schemas, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    path = Path(__file__).resolve().parents[1] / "deploy/cloudflare/src/contracts.json"
    path.write_text(export())
    (path.parent / "dimensions.json").write_text(json.dumps(DIMENSIONS, indent=2) + "\n")
