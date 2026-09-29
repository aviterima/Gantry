# PRD — Gantry testing release v0.4

Owner: Armando Viteri. Status: implementation branch, business acceptance open.

A reviewer can create an idea, set delivery mode and audience/operator assignment,
enter scores and evidence, set positive budget/time caps, edit memo commentary,
and approve or reject from Mission Control. Configuration can add clusters and
operators. The registry labels demonstration data and incomplete scores clearly.

ADR-0003 defines the server-side contract and known debt. In particular approval
requires >=35/50, passing evidence-backed gates and complete valid declarations.
Research is optional: review the cited corpus and deliberately accept proposed
scores. Unconfigured research is shown as unavailable, never simulated as live.
Access requires an allowlisted email plus an independently provisioned access key.

## Acceptance
Automated: shared route contract against Python and Worker, authentication and
revocation tests, malformed-input tests, decision locks, research failure and
citation tests, UI cancellation and intake checks, lint/format/type checks.
Business: 10 real candidates, >=8 signed go/no-go decisions within two days.
Live research: a configured provider produces useful source-grounded proposals
from a one-liner; reviewer validates quality, cost and coverage. Not yet evidenced.

## Operations testing scope
The reviewer creates tournaments, schedules reviews, prepares G0-approved launches,
records readiness evidence and activates sandbox/CSV experiments. Numeric G1–G3
plans must have been saved before G0. The operations engine consumes deduplicated
signals, computes gate metrics and caps, and queues human decisions. G2 pass opens
concentration; kill opens wind-down and retains learnings; G3 pass opens promotion
and handoff. Contact reservations and suppression apply across launches. Portfolio,
channel costs, audit history and downloadable handoffs are visible in Mission Control.

ADR-0004 defines exact semantics and persistence. Tests run through both runtimes
and through the browser. The local launcher preserves its isolated sandbox across
restarts. Detailed coverage and exclusions are in `reviews/v0.4-testing-release.md`.

## Excluded from this release
Live outbound/social/CRM adapters and independent verification of imported evidence;
public landing deployment, real payment/booking, legal spinouts and equity execution;
automated discovery, live cluster listening/health and background notification jobs;
production deployment and concurrent editing of the selection registry.
