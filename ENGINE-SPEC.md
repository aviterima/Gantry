# Gantry Engine: Multi-Phase Specification

Companion to `FRAMEWORK.md`. The framework defines *what* we decide (lanes, scorecard,
gates); this spec defines the system that executes it — from candidate intake through
market test — and how it integrates the operating stack:

| Tool | Role | Stages it serves |
|------|------|------------------|
| **Neubloc (email engine)** | Outbound sequences, smoke-test campaigns, nurture flows | G1 smoke → G3 money |
| **Vox** | Social media: audience listening during selection, distribution and demand-gen during testing | G0 research → G3 |
| **Forum (CRM)** | System of record for every lead, account, and conversation across all launches | G1 → promotion |

Guiding principle from the framework: **the engine must make launching cheap, killing
easy, and concentration fast.** Every phase below ships something usable on the next
tournament; nothing waits for the full build.

This spec reflects the four modifications adopted from `CRITIQUE.md`: paid usage and
retention as the primary gate signals (leads demoted to a G1 reachability check),
service-first delivery as the default vertical-lane entry mode, ~5-launch tournaments
with immediate concentration on gate survivors, an operator bench recruited from day
one, and audience-clustered tournaments whose channel assets compound across launches.

---

## Architecture overview

One shared platform, multi-tenant by launch. Core objects:

- **Candidate** — an idea in the selection pipeline. Carries lane (§2.2 substitution /
  §2.3 vertical), scorecard, G0 memo, research corpus, proposed cluster, and operator
  match.
- **Launch** — a candidate that cleared G0. Owns a brand, a landing property, channel
  configs (Neubloc sequence IDs, Vox account/campaign IDs, Forum pipeline ID), gate
  state, budget/time caps, a **delivery mode** (`service_first` | `self_serve`), a
  **cluster** membership, and an **operator** assignment (nullable until matched).
- **Cluster** — a shared audience vertical that outlives any single launch: its list,
  social presence, community trust, watering holes, and accumulated research. Launches
  in a cluster deliberately share these assets; clusters are the unit across which
  channel spend compounds (FRAMEWORK §5).
- **Operator** — a bench member: domain profile, current load, equity terms, matched
  candidates/launches. Matching happens at G0; hands-on engagement triggers at G2.
- **Persona** — named buyer definition per launch: titles, firmographics, watering holes,
  channel hypotheses.
- **Signal** — a normalized event: `{launch_id, channel, stage, actor, event_type,
  timestamp, value}`. Everything the gates consume is a Signal. Channel adapters
  (Neubloc, Vox, Forum, web analytics) translate native events into this one schema —
  this is the heart of the engine, because it is what makes tournaments comparable.
- **Gate record** — per launch per gate: thresholds *written at G0*, current metrics,
  cap countdown, decision + memo.

Integration style: thin adapters over each tool's API/webhooks. The engine never
re-implements email sending, social posting, or CRM storage — it orchestrates and
normalizes. If a tool lacks an API for something, the adapter degrades to a CSV
import/export step rather than blocking the phase.

---

## Mission Control — the entry point

One web application is the system's single front door; nothing is operated by poking
adapters or editing files directly once the equivalent Mission Control surface exists.
Three panes:

1. **Control** — the lifecycle actions: the G0 approval queue, the launch checklist
   runner, the kill/extend/promote queue, concentration-trigger confirmations, and the
   human-in-the-loop approvals (memo sign-off, first sends of new sequences). Every
   action is audited: who, when, against which gate record.
2. **Configuration** — adapter connections and health (Neubloc, Vox, Forum, web
   analytics), cluster definitions and their shared assets, the operator bench, gate
   threshold templates, budget caps, suppression lists, and the brand/domain inventory.
   Configuration is versioned; thresholds locked at G0 render read-only in the UI and
   can only change through the extension-memo flow — the interface itself enforces the
   no-moved-goalposts rule.
3. **Data summary** — drill-down from portfolio → tournament → launch: every gate
   metric against its pre-committed threshold, days-to-cap, spend vs. cap, cluster
   asset health, channel performance, reallocation speed. Every displayed number is
   traceable to Signal events — no hand-entered metrics.

Mission Control is built incrementally: Phase 1 ships the shell with registry,
scorecard, and G0 approvals; Phase 2 adds launch control and configuration; Phase 3
adds the gate dashboard and decision queue; Phase 4 adds the portfolio and cluster
views. Each phase's acceptance criteria are met *through* Mission Control, not around
it.

---

## Engineering discipline and the handoff package

Every launch's software is written to be handed to a professional team the moment it
passes the viability gates — hand-off-ready from day one, because retrofitting quality
after a gate pass costs exactly the time the concentration rule says we don't have.

- **Spec-first development.** No launch code is generated without its spec set: a short
  PRD derived from the G0 memo, an architecture document, and ADRs for any
  non-obvious decision (including every CSV-bridge or adapter compromise). AI drafts
  all of it; the specs live in the launch's repo, not in chat history.
- **Golden repo template.** Each launch gets its own repository instantiated from a
  studio template: enforced lint/format/typecheck, a test suite that runs in CI from
  the first commit, infrastructure-as-code for its deployment, secrets kept in a
  managed store (never in the repo), a seeded README and operational runbook.
  AI writes the code; the template and CI enforce the standard; a human reviews at
  gate transitions, not every commit.
- **Known-debt register.** Deliberate shortcuts (a manual step behind a service-first
  offering, a batch CSV bridge, an unscaled query) are logged in the repo as debt
  entries with their trigger condition for repayment — a team inheriting the code
  learns its compromises from the register, not from incidents.
- **The handoff package.** Assembled automatically, first at the G2 concentration
  trigger (for the operator going hands-on) and finalized at G4 (for the spinout
  team): the spec set, the repo with green CI, the deployment runbook, an export of
  the launch's full Signal history and Forum pipeline, the channel playbook, and the
  known-debt register. **Acceptance test for the package: a competent engineer with
  no prior context can run the product locally and deploy it within one day using
  only the package.**

---

## Phase 1 — Selection engine (candidate intake → G0)

**Goal:** any idea can go from raw thesis to a scored, evidenced go/no-go decision in
≤ 2 days of human attention.

Deliverables:
1. **Candidate registry** — repo-backed to start (one directory per candidate:
   `candidates/<slug>/memo.md`, `scorecard.yaml`, `research/`). No database until Phase 3
   proves we need one.
2. **Scorecard as code** — the 10 dimensions from FRAMEWORK §3 in a schema with the two
   gating dimensions (buyer reachability, time-to-signal) enforced: a candidate scoring
   below threshold on either is auto-marked `untestable` regardless of total.
3. **AI domain-expert research pipeline** — given a vertical/category, produce the G0
   research corpus: workflow map, regulatory landscape, incumbent/legacy vendors, budget
   evidence, persona draft with titles and firmographics, watering-hole inventory
   (communities, subreddits, associations, hashtags). **Vox integration (read-only):**
   social listening queries to size and locate the audience — where does this persona
   actually congregate, what language do they use for the pain, who are the loud voices.
   Listening output feeds scorecard dimension 2 (reachability) with evidence instead of
   guesses.
4. **G0 memo generator** — drafts the one-page memo from scorecard + corpus; a human
   edits and signs it. The memo must contain the *pre-committed* G1–G3 thresholds and
   caps (framework rule: thresholds are written before launch, never after seeing data),
   plus three declarations the post-critique model requires: **delivery mode**
   (service-first vs self-serve — service-first is the vertical-lane default, and the
   choice selects which G2/G3 gate profile applies), **cluster assignment** (which
   shared audience vertical this launch compounds, or an explicit exception memo for an
   unclustered launch), and **operator match** (which bench operator fits, or an
   explicit exception).
5. **Operator bench registry** — bench members with domain profiles, load, and equity
   terms; candidate–operator matching surfaced during G0 drafting. Bench *recruitment*
   is a studio workstream that starts in parallel with this phase, not after it — it is
   the slowest asset to build and it gates promotion (FRAMEWORK §5).
6. **Mission Control shell** — the web app's first cut: candidate registry browsing,
   scorecard entry and review, the G0 approval queue, and configuration screens for
   clusters and the operator bench. From this phase on, every new capability lands as
   a Mission Control surface.

Acceptance: run 10 real candidates through it; ≥ 8 reach a signed G0 decision within the
2-day cap; both gating dimensions have evidence attached, not vibes; every signed memo
declares delivery mode, cluster, and operator match (or a written exception).

---

## Phase 2 — Launch stack (G0 → G1 smoke test live)

**Goal:** a cleared candidate goes from G0 sign-off to a live, instrumented smoke test in
≤ 3 working days.

Deliverables:
1. **Landing property template** — brandable landing page (positioning, intent-qualifying
   capture form, pricing-signal block), deployed per launch on a shared host under its
   own domain. **Service-first launches get a service variant:** offer framing, scoping
   questionnaire, call booking, and a payment/deposit path — because for service-first
   launches the G1 "capture" is a service inquiry and the G2 signal is a paid engagement,
   not a signup. Every page emits Signals (visit, scroll-depth, form start, qualified
   capture, booking, payment) tagged with `launch_id` and channel attribution (UTM
   discipline enforced by the template — hand-built links are how attribution dies).
2. **Neubloc adapter (outbound):**
   - Push: create/update sequences from launch playbook templates (2 angles per launch,
     per the one-re-angle rule); load target lists built from the persona definition.
   - Pull: webhook/poll delivery, open, reply, positive-reply classification into
     Signals. Reply text lands in Forum (below), metrics land in the Signal store.
   - Guardrails: per-launch sending domains (never the studio's root domain), warm-up
     scheduling, global suppression list shared across all launches so one person is
     never sequenced by two launches *simultaneously*. Within a cluster, *sequential*
     reuse of the shared list is deliberate strategy (FRAMEWORK §5) — the adapter
     supports cluster-scoped lists with per-launch send-state so successive launches
     inherit the audience without colliding in it.
3. **Vox adapter (distribution):**
   - Push: per-launch social profiles/campaigns; scheduled content from the launch
     playbook; paid boosts where the persona warrants it.
   - Pull: impressions, engagements, click-throughs, DM/comment leads → Signals; DM
     leads forwarded into Forum.
4. **Forum adapter (CRM):**
   - One Forum workspace, one pipeline per launch, shared stage taxonomy across ALL
     launches: `Captured → Qualified → Conversation → Pilot/Paid → Retained` (plus
     `Disqualified`). The shared taxonomy is non-negotiable — it is what makes G-gate
     metrics identical across launches.
   - Every lead from any channel (Neubloc reply, Vox DM, landing capture) is upserted to
     Forum with source attribution within minutes. Forum is the single system of record
     for *people*; the Signal store is the system of record for *metrics*. Stage changes
     in Forum flow back as Signals.
5. **Launch checklist runner** — brand assets, domain, page, sequences, social, pipeline,
   thresholds loaded, caps armed. A launch is "live" only when the checklist is green.
   Runs in Mission Control's Control pane, alongside the adapter configuration and
   health screens added this phase.
6. **Launch codebase factory** — the golden repo template and the spec-first pipeline
   (PRD from the G0 memo, architecture doc, ADRs) from **Engineering discipline**
   above, applied to every launch that ships software this phase — including the
   internal tooling behind service-first delivery. Handoff-readiness is not deferred
   to the gate that needs it.

Acceptance: launch tournament 1 (3–5 candidates) with ≤ 3 days G0→live each; every lead in
Forum traceable to its channel; zero cross-launch duplicate sequencing.

---

## Phase 3 — Signal engine & gate management (G1 → G3)

**Goal:** gate decisions become a weekly review of a queue, not an archaeology project.

Deliverables:
1. **Signal store + metric definitions** — the normalized event stream persisted
   (database earns its keep here), with the gate metrics from FRAMEWORK §4 computed
   identically for every launch, by delivery mode: qualified-capture rate as a
   *reachability check only* (G1); paid engagements delivered for service-first, or
   activation and week-2 unprompted return for self-serve (G2); paying customers with
   at least one from pure outbound *and at least one renewal or repeat purchase* (G3);
   plus channel-level CAC-to-signal. Paid and retention metrics rank above volume
   metrics everywhere the dashboard sorts. Because absolute channel benchmarks decay as
   outbound saturates (`CRITIQUE.md` §3), G1 thresholds are recalibrated per tournament
   against the running cross-launch baseline, not trusted as constants.
2. **Tournament dashboard** — Mission Control's Data-summary pane: every live launch
   vs. its pre-committed thresholds — current value, trend, days-to-cap remaining,
   spend vs. budget cap. Color state is computed, not asserted.
3. **Kill/extend/promote queue with the concentration trigger** — when a launch hits
   its cap or clears its gate, it enters the decision queue. Kill is the default: an
   `extend` requires an attached memo naming the one specific re-angle and its new
   (shorter) cap; the system enforces the one-re-angle-per-gate rule by refusing a
   second extension at the same gate. A **G2 pass fires the concentration trigger**: a
   same-week queue item that raises the launch's budget caps, notifies its matched
   operator to go hands-on, assembles the first **handoff package** (see Engineering
   discipline) for that operator, and moves the launch to the top of the review order —
   concentration is a system event, not a ceremony deferred to promotion.
4. **Stage-appropriate signal weighting** — self-serve launches gate on activation
   metrics; sales-assisted ones gate on Forum stage progression (calls held, pilots
   signed). Which profile applies is declared at G0, not chosen after.
5. **Post-mortem capture and respectful wind-down** — killing a launch triggers two
   workflows. *Write-back:* channel performance, message performance, persona learnings,
   filed into the research corpus (and its cluster's corpus) where Phase 1's pipeline
   reads it for future candidates — killed launches' channel data and research outlive
   the code. *Wind-down:* user notice and data export, refunds on undelivered
   service-first work, opt-out honoring, and the domain kept alive for the retention
   window — vertical communities are durable studio assets, and a trail of abandoned
   brands poisons the cluster for later, serious entries (`CRITIQUE.md` §5).

Acceptance: tournament 2 runs entirely on the dashboard; every kill/extend decision has a
gate record with pre-committed thresholds; at least one Phase-1 candidate memo cites
learnings from a killed launch.

---

## Phase 4 — Portfolio operations & promotion (G3 → G4 and steady state)

**Goal:** the studio runs multiple concurrent tournaments without decision-attention
becoming the bottleneck it inevitably wants to become.

Deliverables:
1. **Portfolio view** — Mission Control's top level: all launches across tournaments by lane (substitution vs.
   vertical), **cluster**, gate stage, spend, and signal quality; lane-mix tracking
   against the 2/3–1/3 starting ratio and the at-least-half-clustered rule, with
   per-tournament adjustment (FRAMEWORK §5); cluster asset health (list size, engagement,
   trust indicators) as first-class metrics; and reallocation-speed tracking — time from
   gate event to budget/attention change, since that speed is the tournament model's
   alpha.
2. **Cadence automation** — tournament scheduling, gate-review calendar, reviewer load
   metering (framework open question #4: max concurrent live launches per reviewer is
   measured, then enforced as the batch-size cap).
3. **Promotion workflow (G4)** — with the matched operator hands-on since the G2
   concentration trigger, promotion formalizes what concentration started: spin-out
   checklist (entity and cap table per the operator-equity model resolved before
   tournament 1 — FRAMEWORK §7), **data handover** (its Forum pipeline and lead history
   export cleanly to the new company's own stack; cluster-shared assets stay with the
   studio, with agreed access terms for the spinout), the **finalized handoff package**
   (spec set, repo with green CI, runbook, Signal history, known-debt register — held
   to the one-day acceptance test in Engineering discipline), and **playbook retention**
   (channel and message learnings stay in the studio corpus).
4. **Channel health & compliance** — deliverability monitoring across Neubloc sending
   domains, Vox account standing, suppression-list integrity, CAN-SPAM/GDPR hygiene
   (per-launch privacy policy on every landing property, honored opt-outs shared
   globally).
5. **Candidate generation flywheel** — Phase 1's research pipeline runs continuously
   against the accumulated corpus and Vox listening data to propose candidates, so the
   top of the funnel approaches zero marginal cost too.

Acceptance: two tournaments running concurrently with gate reviews inside their calendar
slots; first promotion (or a portfolio review explaining why none) executed through the
workflow.

---

## Cross-phase requirements

- **Attribution discipline:** every outbound touch (email link, social post, ad) carries
  launch + channel + angle tags; the landing template rejects untagged campaign traffic
  into a `direct/unknown` bucket that the dashboard surfaces (if that bucket grows,
  instrumentation is broken — treat as an incident).
- **Identity resolution:** one person appearing across channels (opened email, then DM'd
  on social, then signed up) resolves to one Forum contact and one Signal actor.
  Email-first matching; good enough beats perfect.
- **Tenancy & blast-radius:** launches share infrastructure but never sending
  reputation; a spam complaint on one launch cannot burn another's domain. Data and
  brand isolation holds *across* clusters; *within* a declared cluster, sharing the
  list, community presence, and (where declared at G0) brand umbrella is deliberate
  and configured, not accidental.
- **Human-in-the-loop boundaries:** the engine drafts and schedules; a human approves
  G0 memos, first sends of any new sequence, and every kill/extend/promote decision.
  Nothing customer-facing goes out unreviewed in tournament 1–2; loosen deliberately later.
- **Tool abstraction:** Neubloc/Vox/Forum sit behind adapter interfaces
  (`EmailChannel`, `SocialChannel`, `CRMStore`) so a tool swap is an adapter, not a
  rewrite.

## Build order & dependencies

Phase 1 has no dependencies — start immediately; its outputs are useful even run by
hand. Phase 2 needs Phase 1's persona/threshold outputs and API access to all three
tools (first integration task: confirm Neubloc, Vox, and Forum API/webhook capabilities;
any gap becomes a CSV bridge, logged as debt). Phase 3 needs Phase 2's Signal emission.
Phase 4 needs a tournament's worth of Phase 3 history. Tournament 1 can launch at end of
Phase 2 with gates reviewed semi-manually — do not hold tournament 1 for Phase 3.

## Open items to confirm

1. API surface of Neubloc's email engine (sequences, webhooks, suppression) — determines
   how much of the Phase 2 adapter is real-time vs. batch.
2. Vox capabilities: does it cover listening (Phase 1 research) as well as
   posting/campaigns (Phase 2), or do we need a separate listening source?
3. Forum: multi-pipeline support in one workspace, webhook support for stage changes,
   and API rate limits at portfolio scale.
4. Signal store technology choice — deferred to Phase 3 by design; a spreadsheet-grade
   store is acceptable through tournament 1.
