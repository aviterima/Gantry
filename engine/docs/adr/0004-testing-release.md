# ADR-0004 — End-to-end testing release

Date: 2026-09-29. Status: implementation for owner testing.

The owner authorized the full build ready for testing. This release extends the
selection engine through launch preparation, tournaments, signal ingestion,
G1–G3 decisions, concentration, wind-down and promotion/handoff. It is a testing
release, not evidence of commercial or integration acceptance.

## Integration discovery and release boundary

The kit identifies Neubloc email, Vox social and Forum CRM, but supplies no API
contracts, webhook credentials, rate limits or test accounts. No available
connector exposes these three project-specific engines. Their capabilities remain
unverified. Do not invent endpoints or deliver customer messages. This release
supports explicitly labeled sandbox and CSV-import workflows. Forum remains the
intended live contact system; imported contacts are an offline staging copy.
Real adapters require an approved capability report and sandbox credentials.
Social listening, real payment processing, outbound delivery, domain provisioning,
automatic candidate discovery and legal spinout execution remain integration or
business acceptance work. The UI must never present these as connected.

## Deterministic shared operations kernel

Both deployments execute the same pure JavaScript operations module. Python calls
its Node CLI inside a SQLite BEGIN IMMEDIATE transaction. The Worker calls it
inside a Durable Object storage transaction. This makes lifecycle rules identical
and serializes commands. Node 22+ is consequently a Python runtime dependency.
Every mutation requires the latest revision; stale writes return 409. Commands
are atomic and append an actor/time/action audit entry. No client-supplied actor
or current-time overrides are accepted over HTTP.

Selection remains in the existing file/KV registry; signed G0 candidates are
snapshotted when creating a launch. Existing selection concurrency debt is not
claimed resolved. Operations data is isolated from selection and demo seeding.

## Gate contract

Structured G1–G3 plans are optionally recorded within thresholds before G0 and
therefore locked with the original decision. A launch cannot be created without
one; historical decisions are never amended or inferred from prose. Every rule
sets days, budget in cents and numeric targets. The three budgets and time windows
must fit the overall G0 caps. G1 requires visitors, qualified captures and a capture
rate; service-first G2 requires delivered paid engagements; self-serve G2 requires
activation and unprompted returns 7–14 days later. G3 requires paying customers,
at least one purely outbound customer and at least one repeat purchaser. Metrics
use deduplicated actors, delivered work/order identifiers, and paid order IDs.
Refunded orders do not count as paid; capture/return events require preceding
visit/activation. Stage metrics are cumulative since launch, while spend and
deadlines are tracked against the active gate's budget and start time.

Passing evidence never advances a gate automatically. A reviewer signs pass,
kill or extend. One extension per gate requires a rationale, a specific re-angle,
a positive shorter time window and positive incremental budget; original plans
remain unchanged and additional authorization is audited. Kill creates wind-down
tasks and retained learnings. G2 pass creates a concentration task; acknowledgement
requires an operator and an explicit additional budget. G3 pass creates the G4
promotion checklist; promotion requires concentration, operator assignment and
evidence for each checklist item. No legal entity is created by the app.

## Launch controls and evidence

Only G0-approved candidates can launch once. Tournaments declare reviewer,
capacity, review date and sandbox/CSV mode. A reviewer uses the same declared
capacity across tournaments. Review dates can be rescheduled and exported to an
iCalendar file. Activation requires an evidenced
checklist and enforces reviewer capacity across active tournaments. Landing pages
are authenticated previews; captured test signals never send email or process a
payment. CSV signals carry IDs, timestamps, channel, angle and actor identity.
Imports are all-or-nothing and duplicate IDs are idempotent only for identical
events. Future/invalid dates and unknown event types are rejected. Imported data
is evidence supplied by the reviewer, not independently verified provider data.
Unattributed visits are counted in a direct/unknown bucket.

Contact claims are globally exclusive across launches; suppression releases any
claim and prevents reclaim. Imported unsubscribe events also suppress globally. Claims only reserve a contact for an eventual human-
approved sequence; no sending occurs. Killing a launch releases its claims.

## Handoff and limits

Downloadable ZIPs contain the immutable G0 snapshot, plan, signals, imported CRM
stages, audit, gate decisions, playbook, debt, PRD, architecture and a runnable
static landing scaffold with smoke test and CI. They are a starting repository,
not a custom product automatically implemented from a one-liner. Live deployment
and professional one-day handoff acceptance remain unproven.

Operations state is deliberately capped at 1.8 MB in this test release; migrate to
normalized tables and paged event reads before production-scale tournaments.
No background scheduler or outbound notification daemon: dated queues and operator
tasks surface on load. No production deploy or merge is part of this build.

Storage sizing reference: https://developers.cloudflare.com/durable-objects/platform/limits/
The state is stored as JSON text below the SQLite-backed per-value limit.


## Windows persistence correction — 2026-09-30

v0.4.1 defines UTF-8 for registry writes, generated contracts and Python/Node
subprocess streams. Registry reads accept UTF-8 (including BOM) and legacy CP1252.
Atomic file replacement prevents encoding failures from truncating existing records.
The test initializer restores missing or empty known demo fixtures, backing up empty
files, and never overwrites nonempty records. Native Windows CI exercises startup,
legacy encoding, Unicode persistence and operations. Production data is not repaired
or reseeded by this testing-only recovery path.
