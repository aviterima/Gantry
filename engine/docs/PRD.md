# PRD — Phase 1 Selection Engine

Derived from `ENGINE-SPEC.md` Phase 1. Goal: any idea goes from raw thesis to a
scored, evidenced go/no-go decision in ≤ 2 days of human attention.

## Users
Studio reviewers (score, review, decide) and candidate authors (intake, memo prep).

## In scope (Phase 1)
1. Candidate registry, repo-backed (`data/candidates/<slug>/`).
2. Scorecard as code: 10 FRAMEWORK §3 dimensions; gating on buyer_reachability
   and time_to_signal (score ≥ 3 + evidence) enforced server-side.
3. G0 memo drafts generated from scorecard + declarations; human edits and signs.
4. G0 approval queue with decidability blockers surfaced; approvals blocked
   until every blocker clears; rejections always allowed.
5. Cluster and operator-bench registries (read/add).
6. Mission Control shell: summary tiles, G0 Queue, Registry with scorecard and
   threshold editing, Configuration pane.

## Out of scope (later phases)
Adapters (Neubloc/Vox/Forum), Signal store, launch stack, AI research pipeline
(Phase 1 ships the memo seam it plugs into), auth/roles, audit log persistence.

## Acceptance (from ENGINE-SPEC)
10 real candidates through the flow; ≥ 8 signed G0 decisions inside the 2-day
cap; gating dimensions carry evidence; every signed memo declares delivery
mode, cluster, and operator match or a written exception.
