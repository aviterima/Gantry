"""G0 memo generator (ENGINE-SPEC Phase 1, deliverable 4).

Drafts the one-page decision memo from the candidate's scorecard and
declarations. A human edits and signs it in Mission Control; the draft is
deterministic here, with an interface seam where the AI research pipeline
plugs in later.
"""

from __future__ import annotations

import json

from .models import DIMENSIONS, GATING_DIMENSIONS, Candidate

LANE_LABELS = {
    "substitution": "Lane one — product substitution (FRAMEWORK §2.2)",
    "vertical": "Lane two — vertical, AI as domain expert (FRAMEWORK §2.3)",
}
MODE_LABELS = {
    "service_first": "Service-first (sell the work before building the product)",
    "self_serve": "Self-serve product",
}


def draft_memo(candidate: Candidate) -> str:
    sc = candidate.scorecard
    cluster = candidate.cluster or f"_exception: {candidate.cluster_exception or 'none given'}_"
    operator = candidate.operator or f"_exception: {candidate.operator_exception or 'none given'}_"
    lines = [
        f"# G0 Memo — {candidate.name}",
        "",
        f"**Thesis:** {candidate.one_liner}",
        "",
        f"- **Lane:** {LANE_LABELS[candidate.lane.value]}",
        f"- **Delivery mode:** {MODE_LABELS[candidate.delivery_mode.value]}",
        f"- **Buyer persona:** {candidate.persona or '_not yet defined_'}",
        f"- **Primary channel:** {candidate.channel or '_not yet defined_'}",
        f"- **Cluster:** {cluster}",
        f"- **Operator match:** {operator}",
        "",
        "## Scorecard",
        "",
        "| Dimension | Score | Evidence |",
        "|---|---|---|",
    ]
    for name in DIMENSIONS:
        ds = sc.dimensions.get(name)
        gate = " *(gating)*" if name in GATING_DIMENSIONS else ""
        if ds is None:
            lines.append(f"| {name}{gate} | — | _unscored_ |")
        else:
            lines.append(f"| {name}{gate} | {ds.score} | {ds.evidence or '—'} |")
    band = sc.band()
    band_note = ""
    if not sc.is_testable():
        band_note = " — **UNTESTABLE** (gating dimension failed or unscored)"
    elif band:
        band_note = f" — band: **{band['name'].upper().replace('_', ' ')}** ({band['note']})"
    lines += [
        "",
        f"**Total:** {sc.total()} / 50{band_note}",
        "",
        "## Case against (required at G0)",
        "",
        candidate.case_against
        or "_NOT WRITTEN — approval is blocked until the strongest case against is argued._",
        "",
        f"**Kill criterion:** {candidate.kill_criterion or '_NOT SET — approval is blocked until a falsifiable kill criterion exists._'}",
        "",
        "## Pre-committed thresholds (locked at G0)",
        "",
        f"- **G1 reachability:** {candidate.thresholds.g1_reachability or '_not set_'}",
        f"- **G2 engagement:** {candidate.thresholds.g2_engagement or '_not set_'}",
        f"- **G3 retention:** {candidate.thresholds.g3_retention or '_not set_'}",
        f"- **Caps:** ${candidate.thresholds.budget_cap_usd:,} / {candidate.thresholds.time_cap_weeks} weeks",
        "",
        "## Structured execution plan",
        json.dumps(candidate.thresholds.execution_plan.model_dump(), indent=2)
        if candidate.thresholds.execution_plan
        else "_Not recorded; candidate cannot enter the launch engine._",
        "",
        "## Reviewer commentary",
        "",
        candidate.memo_notes or "_No additional commentary._",
        "",
        "## Decision",
        "",
    ]
    if candidate.decision:
        verdict = "APPROVED" if candidate.decision.approved else "REJECTED"
        lines.append(
            f"**{verdict}** by {candidate.decision.decided_by} — {candidate.decision.notes or 'no notes'}"
        )
    else:
        lines.append("_Pending G0 review._")
    return "\n".join(lines) + "\n"
