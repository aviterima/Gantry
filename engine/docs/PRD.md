# PRD — Selection Engine v0.3

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

## Excluded from this release
Launch stack, outbound integrations, Signal store, G1–G4 automation, spinouts,
operator recruitment, equity terms, production deployment and multi-reviewer use.
