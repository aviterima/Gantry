# ADR-0003 — Selection workflow v0.3

Status: implemented on the v0.3 review branch, pending owner acceptance.
Date: 2026-09-29.

## Scope and authority
The exported Git tree and GitHub main both end at d2fead4. The two whitepapers
are strategic references with different scoring models; neither replaces the
10-dimension Gantry scorecard. No real opportunities, operators, or customer
results have been supplied. Keep demonstration records clearly labeled.

This release completes the manual selection surface and adds a research-provider
boundary. Phase 1 business acceptance still requires 10 real candidates and
8 signed decisions within the two-day cap. Phases 2–4 remain future work.

## Decision contract
- Scores are integers 1–5 over exactly the ten recognized dimension names.
  Unknown dimensions and malformed payloads return 422 without partial writes.
  Saving a scorecard replaces its dimension set, so clearing a score works.
- A complete scorecard scoring at least 35 (Credible) is eligible for approval;
  lower bands are blocked. No override is provided in this release. This is the
  conservative implementation of the existing band verbs, proposed for review.
- Both gating dimensions require score >=3 and evidence. Every approval also
  requires persona, channel, case against, kill criterion, all three threshold
  texts, positive integer budget/time caps, and valid cluster/operator references
  or written exceptions when unassigned. Rejections remain possible for drafts.
- Existing signed records remain readable; new policy is not retroactive.
- Candidate slug is immutable. Declaration updates validate enums and references.
- Memo commentary is human-editable separately from generated facts. Regeneration
  preserves commentary; all candidate edits and research writes lock after G0.
- Cancel in either decision dialog must produce no request. Decisions record the
  authenticated reviewer, timestamp, and notes.
- Four-to-six weeks is the selection time-to-paid-signal question. G3's separate
  four-to-eight-week retention horizon is unchanged.

## Research boundary
POST /api/candidates/{slug}/research calls an optional, server-configured HTTPS
research provider. The provider accepts {candidate, dimensions} and returns a
corpus with workflow_map, regulatory_landscape, incumbents, budget_evidence,
persona, watering_holes, case_against, kill_criterion, sources, and proposed_scores.
Sources have id, URL, title, retrieved_at and excerpt. Each proposed score cites
source IDs, has evidence and a confidence (low/medium/high). URLs must be HTTP(S),
IDs unique, timestamps valid and citations resolvable. Proposals may be partial;
missing coverage never becomes a positive finding. Provider text is untrusted.

The application validates and stores the corpus but never auto-applies scores
or approves a candidate. Explicit human acceptance copies proposals into the
scorecard; it does not silently replace persona, case against, or declarations.
Provider absence returns 503; malformed/failed provider results return 502 and
leave the candidate unchanged. No fabricated fallback evidence is generated.
A provider run that races a candidate edit is rejected with 409.

This boundary is integration-ready, not a claim that live research is configured.
The included research service must be configured and deployed separately to
supply retrieval and synthesis.
No customer data is sent until a reviewer chooses Run research.

## Authentication
Allowlisted email alone is insufficient. Require a per-reviewer random access
key whose SHA-256 digest is supplied in GANTRY_ACCESS_KEY_HASHES (JSON email →
digest). No bypass or default key. Missing configuration fails closed (503).
Version-2 signed cookies bind to the configured digest so old email-only sessions
and rotated keys are invalid. Keys never appear in logs, candidate data, or git.
Local HTTP is supported; deployment uses HTTPS and Secure cookies.
This is possession-based authentication, not mailbox verification.

## Parity and persistence
Both Python and Worker routes share request schemas generated from Pydantic.
The Worker uses JSON Schema validation before mutations. A common HTTP contract
suite runs against FastAPI and the actual Worker module with an in-memory KV
adapter; a Wrangler dry build checks packaging. This does not simulate KV's
cross-edge consistency. Python files and KV remain single-reviewer stores.

## Debt and repayment triggers
- Live provider quality/cost evaluation and evidence freshness: required before declaring research acceptance complete.
- Email magic links / SSO and roles: before adding a multi-reviewer operational team.
- Transactional store, immutable full audit history, optimistic revision enforcement
  on every edit: before concurrent reviewers; KV remains eventually consistent.
- Gate-specific machine-readable metrics and caps: before Phase 3 automation;
  current text plus overall launch caps supports human review only.
- Operator equity is an owner decision; this release stores a notes field only.
- Production deploy remains separately authorized. Do not merge just to deploy.

## Included research service
`engine.research_service:app` implements the provider contract as a separate
service usable by either runtime. Three bounded search queries gather workflow,
regulatory/competitive, and budget/audience evidence. Up to 18 unique sources
with excerpts are sent to an environment-configured chat-completions model.
The model may return narrative fields and proposed scores only; retrieved source
metadata is supplied by code and cannot be rewritten by the model. The service
validates every proposed citation. A second model call reviews the draft for
unsupported claims and optimism; only the validated revision is returned.

The service requires a >=32-character bearer secret, a search endpoint/key, and a
model endpoint/key/model. Endpoints must be HTTPS. No credentials are bundled.
Search follows the JSON search protocol documented at
https://help.tavily.com/articles/4840311948-tavily-search-api ; the synthesis
adapter accepts the common chat-completions JSON envelope. Deploy behind HTTPS.
Timeouts and source/model size caps bound each run; a live quality/cost acceptance
run still requires configured accounts. This replaces the need to build an
external service from scratch, while keeping provider choice replaceable.
