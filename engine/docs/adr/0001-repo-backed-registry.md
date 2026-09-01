# ADR-0001: Repo-backed registry, no database until Phase 3

**Status:** accepted (Phase 1)

## Decision
Candidates, clusters, and operators are stored as YAML/Markdown files under
`data/`, read and written by `engine/app/registry.py`. No database.

## Rationale
ENGINE-SPEC Phase 1 explicitly defers the database until Phase 3, when the
Signal store earns it. File storage makes every candidate and memo reviewable
in a PR, diffable, and versioned by git for free — which matches how G0
decisions should be audited at this stage.

## Consequences / debt register entry
- No concurrent-write safety: acceptable for a single-reviewer Phase 1;
  **repayment trigger:** first tournament with > 1 concurrent reviewer, or
  Phase 3 Signal store arrival — migrate candidates to the same store then.
- Status is computed, never stored, so files can't go stale.

# ADR-0002: Deterministic memo drafts with an AI seam

**Status:** accepted (Phase 1)

## Decision
`draft_memo()` renders a deterministic Markdown memo from the candidate's own
data. The AI domain-expert research pipeline (Phase 1 deliverable 3) will plug
in behind the same function signature, enriching evidence and drafting
narrative sections.

## Rationale
The memo's structure (declarations, scorecard with evidence, pre-committed
thresholds, decision) is a compliance artifact and must be complete and
consistent even when no model is available; generation quality can improve
without changing the contract. Keeps Phase 1 runnable offline and testable.

## Consequences
- Memos read as structured summaries, not narratives, until the research
  pipeline lands. **Repayment trigger:** research-pipeline integration.
